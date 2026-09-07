"use client";

import { useEffect, useState } from "react";
import { Handshake, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, MoreVertical } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorCollaboration } from "@/types";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { collaborationsRepository } from "@/repositories/localRepository";

export default function DashboardCollaborationsPage() {
  const { profile } = useCreator();
  const { showToast } = useToast();

  const [collaborations, setCollaborations] = useState<CreatorCollaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<CreatorCollaboration | null>(null);
  const [collabToDelete, setCollabToDelete] = useState<CreatorCollaboration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignUrl, setCampaignUrl] = useState("");
  const [description, setDescription] = useState("");

  const creatorLookup = profile.id || profile.email || profile.username;

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  const loadCollaborations = async () => {
    if (!creatorLookup) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/creator/collaborations?creatorId=${encodeURIComponent(creatorLookup)}`).then((r) => r.json());
      if (res.success && Array.isArray(res.collaborations)) {
        setCollaborations(res.collaborations);
        collaborationsRepository.saveAll(res.collaborations);
      } else {
        const local = collaborationsRepository.getAll();
        setCollaborations(local);
      }
    } catch {
      const local = collaborationsRepository.getAll();
      setCollaborations(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborations();
  }, [creatorLookup]);

  const handleOpenModal = (collab?: CreatorCollaboration) => {
    if (collab) {
      setEditingCollab(collab);
      setBrandName(collab.brandName);
      setBrandLogo(collab.brandLogoUrl || null);
      setCampaignTitle(collab.campaignTitle || "");
      setCampaignUrl(collab.campaignUrl || "");
      setDescription(collab.description || "");
    } else {
      setEditingCollab(null);
      setBrandName("");
      setBrandLogo(null);
      setCampaignTitle("");
      setCampaignUrl("");
      setDescription("");
    }
    setIsModalOpen(true);
  };

  const handleSaveCollaboration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      showToast("Brand name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/creator/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          collaboration: {
            id: editingCollab?.id,
            brandName: brandName.trim(),
            brandLogoUrl: brandLogo,
            campaignTitle: campaignTitle.trim(),
            campaignUrl: campaignUrl.trim(),
            description: description.trim(),
            sortOrder: editingCollab ? editingCollab.sortOrder : collaborations.length,
            isActive: editingCollab?.isActive !== false,
          },
        }),
      }).then((r) => r.json());

      if (res.success) {
        showToast(editingCollab ? "Collaboration updated! ✨" : "Collaboration added! 🚀");
        setIsModalOpen(false);
        loadCollaborations();
      } else {
        showToast(res.error || "Failed to save collaboration", "error");
      }
    } catch {
      showToast("An error occurred while saving collaboration", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollaboration = async () => {
    if (!collabToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/creator/collaborations?id=${encodeURIComponent(collabToDelete.id)}&creatorId=${encodeURIComponent(creatorLookup)}`,
        { method: "DELETE" }
      ).then((r) => r.json());

      if (res.success) {
        showToast("Collaboration removed");
        setCollabToDelete(null);
        loadCollaborations();
      } else {
        showToast(res.error || "Failed to delete collaboration", "error");
      }
    } catch {
      showToast("Failed to remove collaboration", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCollab = async (collab: CreatorCollaboration) => {
    try {
      const updated = !collab.isActive;
      await fetch("/api/creator/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          collaboration: {
            ...collab,
            isActive: updated,
          },
        }),
      });
      showToast(updated ? "Collaboration visible on profile" : "Collaboration hidden from profile");
      loadCollaborations();
    } catch { }
  };

  return (
    <div className="space-y-4 sm:space-y-5 w-full pb-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#181716]">
            Selected Collaborations
          </h1>
          <p className="text-xs sm:text-[13px] text-[#797570] font-medium mt-0.5">
            Showcase the brands, sponsor campaigns, and commercial partnerships you have worked with.
          </p>
        </div>

        {collaborations.length > 0 && (
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-3.5 transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Collaboration</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-8 text-center text-xs text-[#797570]">
          Loading collaborations...
        </div>
      ) : collaborations.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border-2 border-dashed border-[#E7E3DC] bg-white p-8 sm:p-10 text-center space-y-3 max-w-xl mx-auto shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b85c6b]/[0.09] text-[#b85c6b]">
            <Handshake className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-sm sm:text-base font-bold text-[#181716]">
              Showcase the brands you&apos;ve worked with
            </h3>
            <p className="text-xs text-[#797570] font-medium max-w-sm mx-auto leading-relaxed">
              Feature logos and highlights from your past sponsor deals (e.g. Nike, Spotify, Sony, Boat). Builds instant credibility with prospective sponsors.
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="tap-scale inline-flex items-center gap-1.5 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Collaboration</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E7E3DC] bg-white divide-y divide-[#E7E3DC] shadow-xs">
          {collaborations.map((collab) => (
            <div
              key={collab.id}
              className={`px-3.5 py-2.5 sm:py-3 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-colors text-left ${collab.isActive ? "" : "opacity-60 bg-[#FAF8F5]/40"
                }`}
            >
              {/* Left: Brand Logo / Handshake badge + Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {collab.brandLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={collab.brandLogoUrl}
                    alt={collab.brandName}
                    className="h-9 w-9 rounded-xl object-cover border border-[#E7E3DC] shrink-0"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3dde057] border border-[#E7D0D4] text-[#8C3F4D] font-bold text-xs shrink-0">
                    <Handshake className="h-4 w-4" />
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold text-xs sm:text-[13px] text-[#181716]">{collab.brandName}</h3>
                    {collab.campaignTitle && (
                      <span className="text-[11px] font-semibold text-[#b85c6b] truncate">
                        • {collab.campaignTitle}
                      </span>
                    )}
                    {!collab.isActive && (
                      <span className="text-[10px] font-semibold text-[#797570] bg-zinc-100 px-1.5 py-0.2 rounded shrink-0">
                        Hidden
                      </span>
                    )}
                  </div>
                  {collab.description ? (
                    <p className="text-[11px] text-[#797570] line-clamp-1 leading-snug">{collab.description}</p>
                  ) : (
                    <p className="text-[11px] font-medium text-[#797570]">Brand Partnership</p>
                  )}
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Desktop Buttons */}
                <div className="hidden sm:flex items-center gap-2">
                  {collab.campaignUrl && (
                    <a
                      href={collab.campaignUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] px-2.5 py-1 text-xs font-semibold text-[#181716] transition-colors shadow-xs"
                      title="View Campaign Link"
                    >
                      <span>View</span>
                      <ExternalLink className="h-3 w-3 text-[#b85c6b]" />
                    </a>
                  )}

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => handleToggleCollab(collab)}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${collab.isActive
                        ? "bg-[#EAF7F0] text-[#17845B] border-[#17845B]/20"
                        : "bg-zinc-100 text-[#797570] border-[#E7E3DC]"
                      }`}
                    title={collab.isActive ? "Visible on profile" : "Hidden from profile"}
                  >
                    {collab.isActive ? <Eye className="h-3 w-3 text-[#17845B]" /> : <EyeOff className="h-3 w-3" />}
                    <span className="hidden md:inline">{collab.isActive ? "Visible" : "Hidden"}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenModal(collab)}
                    className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                    title="Edit collaboration"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setCollabToDelete(collab)}
                    className="flex h-7 w-7 items-center justify-center rounded-xl border border-rose-100 bg-white hover:bg-rose-50 text-[#C2414B] transition-colors cursor-pointer shadow-xs"
                    title="Remove collaboration"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Mobile 3-Dot Dropdown */}
                <div className="relative sm:hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === collab.id ? null : collab.id);
                    }}
                    className="tap-scale flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                    aria-label="More actions"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </button>

                  {activeMenuId === collab.id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in text-left"
                    >
                      {collab.campaignUrl && (
                        <a
                          href={collab.campaignUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenuId(null)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-[#b85c6b]" />
                          <span>View Campaign</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          handleToggleCollab(collab);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        {collab.isActive ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5 text-[#797570]" />
                            <span>Hide from Profile</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5 text-[#17845B]" />
                            <span>Show on Profile</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          handleOpenModal(collab);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#797570]" />
                        <span>Edit Collaboration</span>
                      </button>

                      <div className="my-1 border-t border-[#E7E3DC]" />

                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          setCollabToDelete(collab);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Collaboration</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT COLLABORATION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        title={editingCollab ? "Edit Collaboration" : "Add Collaboration"}
        description="Showcase a brand partnership or commercial campaign."
        icon={<Handshake className="h-4 w-4" />}
      >
        <form onSubmit={handleSaveCollaboration} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-bold text-[#181716] mb-1">
                Brand Logo / Image (Optional)
              </label>
              <PhotoUpload
                value={brandLogo}
                onChange={setBrandLogo}
                shape="rounded"
                size={70}
                label="Upload Brand Logo"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Brand / Partner Name <span className="text-[#C2414B]">*</span>
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Sony Music, Nike, or Boat Audio"
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/80 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#b85c6b] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Campaign Title (Optional)
              </label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="e.g. Summer Launch Reel Campaign"
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/80 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#b85c6b] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Campaign URL / Live Reel Link (Optional)
              </label>
              <input
                type="url"
                value={campaignUrl}
                onChange={(e) => setCampaignUrl(e.target.value)}
                placeholder="https://instagram.com/reel/... or https://youtube.com/watch?v=..."
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/80 px-3.5 py-2 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#b85c6b] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#181716]">
                Short Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly mention key deliverables (e.g. 2x Instagram Reels, 1x YouTube dedicated video with 250K+ views)..."
                className="w-full rounded-xl border border-[#E7E3DC] bg-[#FAF8F5]/80 p-2.5 text-xs font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#b85c6b] focus:bg-white focus:outline-none transition-colors resize-y"
              />
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
              className="bg-[#b85c6b] hover:bg-[#6F3456] text-white font-semibold text-xs py-1.5 px-4 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{isSubmitting ? "Saving..." : editingCollab ? "Save Changes" : "Add Collaboration"}</span>
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={Boolean(collabToDelete)}
        onClose={() => setCollabToDelete(null)}
        onConfirm={handleDeleteCollaboration}
        title="Delete Collaboration?"
        description={`Are you sure you want to remove "${collabToDelete?.brandName || "this collaboration"}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={isSubmitting}
      />
    </div>
  );
}
