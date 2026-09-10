"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Pencil, Trash2, Eye, EyeOff, Globe, ExternalLink, MoreVertical } from "lucide-react";
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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

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
    } catch { }
  };

  return (
    <div className="space-y-4 sm:space-y-5 w-full pb-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#181716]">
            My Brands &amp; Ventures
          </h1>
          <p className="text-xs sm:text-[13px] text-[#797570] font-medium mt-0.5">
            Showcase the product lines, businesses, apparel, or channels you are building.
          </p>
        </div>

        {brands.length > 0 && (
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#151933] hover:bg-[#2c1937] text-white font-semibold text-xs py-2 px-3.5 transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Brand</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-8 text-center text-xs text-[#797570]">
          Loading brands...
        </div>
      ) : brands.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border-2 border-dashed border-[#E7E3DC] bg-white p-8 sm:p-10 text-center space-y-3 max-w-xl mx-auto shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#151933]/[0.09] text-[#151933]">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-sm sm:text-base font-bold text-[#181716]">
              Show the brands and projects you&apos;re building
            </h3>
            <p className="text-xs text-[#797570] font-medium max-w-sm mx-auto leading-relaxed">
              Add your clothing line, merchandise, podcast, production company, or tech startup. Brands appear with logos and direct links on your public profile.
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#151933] hover:bg-[#2c1937] text-white font-semibold text-xs py-2 px-4 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Brand</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E7E3DC] bg-white divide-y divide-[#E7E3DC] shadow-xs">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className={`px-3.5 py-2.5 sm:py-3 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-colors text-left ${brand.isActive ? "" : "opacity-60 bg-[#FAF8F5]/40"
                }`}
            >
              {/* Left: Brand Squircle Badge + Title & Links */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#15193314] border border-[#E7D0D4] text-[#151933] font-bold text-xs shrink-0 select-none">
                  {getInitials(brand.brandName)}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold text-xs sm:text-[13px] text-[#181716]">{brand.brandName}</h3>
                    {!brand.isActive && (
                      <span className="text-[10px] font-semibold text-[#797570] bg-zinc-100 px-1.5 py-0.2 rounded">Hidden</span>
                    )}
                  </div>
                  {brand.websiteUrl ? (
                    <a
                      href={brand.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#797570] hover:text-[#151933] truncate max-w-full"
                    >
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">{brand.websiteUrl.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    </a>
                  ) : (
                    <p className="text-[11px] font-medium text-[#797570]">Brand Venture</p>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Brand Social Link Badges (Desktop) */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {brand.instagramUrl && (
                    <a
                      href={brand.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-pink-50 text-[#E1306C] transition-colors"
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
                      className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-red-50 text-[#FF0000] transition-colors"
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
                      className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-blue-50 text-[#1877F2] transition-colors"
                      title="Facebook"
                    >
                      <FacebookIcon className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => handleToggleBrand(brand)}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${brand.isActive
                      ? "bg-[#EAF7F0] text-[#17845B] border-[#17845B]/20"
                      : "bg-zinc-100 text-[#797570] border-[#E7E3DC]"
                      }`}
                    title={brand.isActive ? "Visible on profile" : "Hidden from profile"}
                  >
                    {brand.isActive ? <Eye className="h-3 w-3 text-[#17845B]" /> : <EyeOff className="h-3 w-3" />}
                    <span>{brand.isActive ? "Visible" : "Hidden"}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenModal(brand)}
                    className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                    title="Edit brand"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setBrandToDelete(brand)}
                    className="flex h-7 w-7 items-center justify-center rounded-xl border border-rose-100 bg-white hover:bg-rose-50 text-[#C2414B] transition-colors cursor-pointer shadow-xs"
                    title="Remove brand"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Mobile 3-Dot Menu */}
                <div className="relative sm:hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === brand.id ? null : brand.id);
                    }}
                    className="tap-scale flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                    aria-label="Brand options"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>

                  {activeMenuId === brand.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in text-left"
                    >
                      {brand.websiteUrl && (
                        <a
                          href={brand.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenuId(null)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors"
                        >
                          <Globe className="h-3.5 w-3.5 text-[#797570]" />
                          <span>Visit Website</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          handleToggleBrand(brand);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        {brand.isActive ? <EyeOff className="h-3.5 w-3.5 text-[#797570]" /> : <Eye className="h-3.5 w-3.5 text-[#17845B]" />}
                        <span>{brand.isActive ? "Hide from profile" : "Show on profile"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          handleOpenModal(brand);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#797570]" />
                        <span>Edit Brand</span>
                      </button>

                      <div className="my-1 border-t border-[#E7E3DC]" />

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          setBrandToDelete(brand);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Brand</span>
                      </button>
                    </div>
                  )}
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
          <ModalBody className="p-4 sm:p-5 space-y-3.5 text-left">
            {/* Live Brand Initials Badge Preview */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E7E3DC]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#15193314] border border-[#E7D0D4] text-[#151933] font-bold text-xs shrink-0">
                {getInitials(brandName || "Brand")}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#181716] truncate">{brandName.trim() || "Brand Name"}</p>
                <span className="inline-block text-[10px] font-semibold text-[#151933] bg-[#151933]/[0.09] border border-[#151933]/20 px-1.5 py-0.2 rounded-md">Brand Venture</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Brand Name <span className="text-[#C2414B]">*</span>
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. CreatorCloths or The Tech Show"
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/80 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#151933] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Website URL (Optional)
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://mybrand.com"
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/80 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#151933] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-2.5 pt-2 border-t border-[#E7E3DC]">
              <div>
                <p className="text-xs font-bold text-[#181716]">Brand Social Links (Optional)</p>
                <p className="text-[11px] text-[#797570]">Enter username only — profile links are generated automatically.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#797570]">
                  Instagram Username
                </label>
                <div className="flex h-9 items-center rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/80 px-3 transition-colors focus-within:border-[#151933] focus-within:bg-white">
                  <span className="mr-2 text-[#E1306C] shrink-0">
                    <InstagramIcon className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(extractHandle(e.target.value, "instagram"))}
                    placeholder="Enter username (e.g. brandname)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#797570]">
                  YouTube Channel Username
                </label>
                <div className="flex h-9 items-center rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/80 px-3 transition-colors focus-within:border-[#151933] focus-within:bg-white">
                  <span className="mr-2 text-[#FF0000] shrink-0">
                    <YoutubeIcon className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(extractHandle(e.target.value, "youtube"))}
                    placeholder="Enter channel handle (e.g. brandchannel)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[#797570]">
                  Facebook Username
                </label>
                <div className="flex h-9 items-center rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/80 px-3 transition-colors focus-within:border-[#151933] focus-within:bg-white">
                  <span className="mr-2 text-[#1877F2] shrink-0">
                    <FacebookIcon className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(extractHandle(e.target.value, "facebook"))}
                    placeholder="Enter page username (e.g. brandpage)"
                    className="h-full w-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#181716] placeholder:text-[#797570]/40 outline-none"
                  />
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-1.5 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#151933] hover:bg-[#2c1937] text-white font-semibold text-xs py-1.5 px-4 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
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
