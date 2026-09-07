"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Pencil, Trash2, Eye, EyeOff, Globe, ExternalLink } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorBrand } from "@/types";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { brandsRepository } from "@/repositories/localRepository";
import { getInitials } from "@/lib/avatar";

export default function DashboardBrandsPage() {
  const { profile } = useCreator();
  const { showToast } = useToast();

  const [brands, setBrands] = useState<CreatorBrand[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<CreatorBrand | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<CreatorBrand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");

  const creatorLookup = profile.id || profile.email || profile.username;

  const loadBrands = async () => {
    if (!creatorLookup) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/creator/brands?creatorId=${encodeURIComponent(creatorLookup)}`).then((r) => r.json());
      if (res.success && Array.isArray(res.brands)) {
        setBrands(res.brands);
        brandsRepository.saveAll(res.brands);
      } else {
        const local = brandsRepository.getAll();
        setBrands(local);
      }
    } catch {
      const local = brandsRepository.getAll();
      setBrands(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, [creatorLookup]);

  // Helpers to format and clean handles with prefilled un-editable prefixes
  const extractHandle = (raw?: string, platform?: "instagram" | "youtube" | "facebook") => {
    if (!raw) return "";
    let clean = raw.trim();
    clean = clean.replace(/^https?:\/\//i, "");
    clean = clean.replace(/^(www\.)?instagram\.com\//i, "");
    clean = clean.replace(/^(www\.)?youtube\.com\/(@|c\/|channel\/|user\/)?/i, "");
    clean = clean.replace(/^(www\.)?youtu\.be\//i, "");
    clean = clean.replace(/^(www\.)?facebook\.com\//i, "");
    clean = clean.replace(/^(www\.)?fb\.com\//i, "");
    clean = clean.replace(/^[@\/]+/, "");
    clean = clean.split(/[?#]/)[0];
    clean = clean.replace(/\/+$/, "");
    clean = clean.replace(/\s+/g, "");
    return clean;
  };

  const buildSocialUrl = (handle: string, platform: "instagram" | "youtube" | "facebook") => {
    const clean = extractHandle(handle, platform);
    if (!clean) return "";
    if (platform === "instagram") return `https://instagram.com/${clean}`;
    if (platform === "youtube") return `https://youtube.com/@${clean}`;
    if (platform === "facebook") return `https://facebook.com/${clean}`;
    return clean;
  };

  const handleOpenModal = (brand?: CreatorBrand) => {
    if (brand) {
      setEditingBrand(brand);
      setBrandName(brand.brandName);
      setBrandLogo(brand.brandLogoUrl || null);
      setWebsiteUrl(brand.websiteUrl || "");
      setInstagramUrl(extractHandle(brand.instagramUrl, "instagram"));
      setYoutubeUrl(extractHandle(brand.youtubeUrl, "youtube"));
      setFacebookUrl(extractHandle(brand.facebookUrl, "facebook"));
    } else {
      setEditingBrand(null);
      setBrandName("");
      setBrandLogo(null);
      setWebsiteUrl("");
      setInstagramUrl("");
      setYoutubeUrl("");
      setFacebookUrl("");
    }
    setIsModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      showToast("Brand name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/creator/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          brand: {
            id: editingBrand?.id,
            brandName: brandName.trim(),
            brandLogoUrl: brandLogo,
            websiteUrl: websiteUrl.trim(),
            instagramUrl: buildSocialUrl(instagramUrl, "instagram"),
            youtubeUrl: buildSocialUrl(youtubeUrl, "youtube"),
            facebookUrl: buildSocialUrl(facebookUrl, "facebook"),
            sortOrder: editingBrand ? editingBrand.sortOrder : brands.length,
            isActive: editingBrand?.isActive !== false,
          },
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(editingBrand ? "Brand updated successfully! ✨" : "Brand added successfully! 🚀");
        setIsModalOpen(false);
        loadBrands();
      } else {
        showToast(res.error || "Failed to save brand", "error");
      }
    } catch {
      showToast("An error occurred while saving brand", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!brandToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/creator/brands?id=${encodeURIComponent(brandToDelete.id)}&creatorId=${encodeURIComponent(creatorLookup)}`,
        { method: "DELETE" }
      ).then((r) => r.json());

      if (res.success) {
        showToast("Brand removed");
        setBrandToDelete(null);
        loadBrands();
      } else {
        showToast(res.error || "Failed to delete brand", "error");
      }
    } catch {
      showToast("Failed to remove brand", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBrand = async (brand: CreatorBrand) => {
    try {
      const updated = !brand.isActive;
      await fetch("/api/creator/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          brand: {
            ...brand,
            isActive: updated,
          },
        }),
      });
      showToast(updated ? "Brand visible on profile" : "Brand hidden from profile");
      loadBrands();
    } catch {}
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E3DC] pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-[#181716] tracking-tight">
            My Brands &amp; Ventures
          </h1>
          <p className="text-xs text-[#797570] font-medium mt-0.5">
            Showcase the product lines, businesses, apparel, or channels you are building.
          </p>
        </div>

        {brands.length > 0 && (
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="tap-scale flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4 transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Brand</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-12 text-center text-xs text-[#797570]">
          Loading brands...
        </div>
      ) : brands.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-[#E7E3DC] bg-white p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#803D63]/[0.09] text-[#803D63] border border-[#803D63]/20">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-[#181716]">
              Show the brands and projects you&apos;re building
            </h3>
            <p className="text-xs text-[#797570] font-medium max-w-sm mx-auto leading-relaxed">
              Add your clothing line, merchandise, podcast, production company, or tech startup. Brands appear with logos and direct links on your public profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="tap-scale inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2.5 px-5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Brand</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 bg-white shadow-xs transition-all ${
                brand.isActive ? "border-[#E7E3DC]" : "border-[#E7E3DC] opacity-60 bg-[#F8F7F3]"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#803D63] text-white font-extrabold text-sm shadow-xs ring-2 ring-[#803D63]/20 shrink-0">
                  {getInitials(brand.brandName)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-xs text-[#181716]">{brand.brandName}</h3>
                  {brand.websiteUrl && (
                    <a
                      href={brand.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-[#803D63] hover:underline truncate max-w-full"
                    >
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">{brand.websiteUrl.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    </a>
                  )}

                  {/* Brand Social Links */}
                  <div className="mt-2.5 flex items-center gap-2">
                    {brand.instagramUrl && (
                      <a
                        href={brand.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-50 text-[#E1306C] hover:scale-110 transition-transform"
                        title="Instagram"
                      >
                        <InstagramIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {brand.youtubeUrl && (
                      <a
                        href={brand.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-[#FF0000] hover:scale-110 transition-transform"
                        title="YouTube"
                      >
                        <YoutubeIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {brand.facebookUrl && (
                      <a
                        href={brand.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-[#1877F2] hover:scale-110 transition-transform"
                        title="Facebook"
                      >
                        <FacebookIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="mt-4 pt-3 border-t border-[#E7E3DC] flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleBrand(brand)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#797570] hover:text-[#181716] transition-colors cursor-pointer"
                >
                  {brand.isActive ? (
                    <>
                      <Eye className="h-3.5 w-3.5 text-[#17845B]" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-[#797570]" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(brand)}
                    className="p-1 text-[#797570] hover:text-[#181716] hover:bg-[#F8F7F3] rounded-lg transition-colors cursor-pointer"
                    title="Edit brand"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrandToDelete(brand)}
                    className="p-1 text-[#797570] hover:text-[#C2414B] hover:bg-[#C2414B]/10 rounded-lg transition-colors cursor-pointer"
                    title="Remove brand"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT BRAND MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        title={editingBrand ? "Edit Brand" : "Add Brand"}
        description="Showcase your venture, store or project."
        icon={<Building2 className="h-4 w-4" />}
      >
        <form onSubmit={handleSaveBrand} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-5 sm:p-6 space-y-4 text-left">
            {/* Live Brand Initials Badge Preview */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#F8F7F3] border border-[#E7E3DC]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#803D63] text-white font-extrabold text-sm shadow-xs ring-2 ring-[#803D63]/20 shrink-0">
                {getInitials(brandName || "Brand")}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#181716] truncate">{brandName.trim() || "Brand Name"}</p>
                <span className="inline-block text-[10px] font-semibold text-[#803D63] bg-[#803D63]/[0.09] border border-[#803D63]/20 px-1.5 py-0.5 rounded-md">Brand Venture</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#181716] mb-1.5">
                Brand Name <span className="text-[#C2414B]">*</span>
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. CreatorCloths or The Tech Show"
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#181716] mb-1.5">
                Website URL (Optional)
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://mybrand.com"
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-[#E7E3DC]">
              <div>
                <p className="text-xs font-bold text-[#181716]">Brand Social Links (Optional)</p>
                <p className="text-[11px] text-[#797570] mt-0.5">Enter username only — full profile links are generated automatically.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#797570] mb-1">
                  Instagram Username
                </label>
                <div className="flex h-10 items-center rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3 transition-colors focus-within:border-[#803D63] focus-within:bg-white">
                  <span className="mr-2 text-[#E1306C] shrink-0">
                    <InstagramIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(extractHandle(e.target.value, "instagram"))}
                    placeholder="Enter username (e.g. brandname)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
                <p className="mt-1 text-[10.5px] font-medium text-[#797570]/80 truncate">
                  Link: <span className="text-[#803D63] font-semibold">https://instagram.com/{instagramUrl || "username"}</span>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#797570] mb-1">
                  YouTube Channel Username
                </label>
                <div className="flex h-10 items-center rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3 transition-colors focus-within:border-[#803D63] focus-within:bg-white">
                  <span className="mr-2 text-[#FF0000] shrink-0">
                    <YoutubeIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(extractHandle(e.target.value, "youtube"))}
                    placeholder="Enter channel username (e.g. brandchannel)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
                <p className="mt-1 text-[10.5px] font-medium text-[#797570]/80 truncate">
                  Link: <span className="text-[#803D63] font-semibold">https://youtube.com/@{youtubeUrl || "channel_username"}</span>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#797570] mb-1">
                  Facebook Username
                </label>
                <div className="flex h-10 items-center rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3 transition-colors focus-within:border-[#803D63] focus-within:bg-white">
                  <span className="mr-2 text-[#1877F2] shrink-0">
                    <FacebookIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(extractHandle(e.target.value, "facebook"))}
                    placeholder="Enter page or profile username (e.g. brandpage)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
                <p className="mt-1 text-[10.5px] font-medium text-[#797570]/80 truncate">
                  Link: <span className="text-[#803D63] font-semibold">https://facebook.com/{facebookUrl || "username"}</span>
                </p>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="px-5 sm:px-6 py-3.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#F8F7F3] hover:text-[#181716] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? "Saving..." : editingBrand ? "Save Changes" : "Add Brand"}</span>
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={Boolean(brandToDelete)}
        onClose={() => setBrandToDelete(null)}
        onConfirm={handleDeleteBrand}
        title="Delete Brand?"
        description={`Are you sure you want to remove "${brandToDelete?.brandName || "this brand"}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={isSubmitting}
      />
    </div>
  );
}
