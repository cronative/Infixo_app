"use client";

import { useEffect, useState } from "react";
import { Handshake, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
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
    } catch {}
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECE8EB] pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-[#17131A] tracking-tight">
            Selected Collaborations
          </h1>
          <p className="text-xs text-[#6F6872] font-medium mt-0.5">
            Showcase the brands, sponsor campaigns, and commercial partnerships you have worked with.
          </p>
        </div>

        {collaborations.length > 0 && (
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="tap-scale flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4 transition-colors cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Add Collaboration</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-2xl border border-[#ECE8EB] bg-white p-12 text-center text-xs text-[#6F6872]">
          Loading collaborations...
        </div>
      ) : collaborations.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-[#ECE8EB] bg-white p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7EDF3] text-[#803D63]">
            <Handshake className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-[#17131A]">
              Showcase the brands you&apos;ve worked with
            </h3>
            <p className="text-xs text-[#6F6872] font-medium max-w-sm mx-auto leading-relaxed">
              Feature logos and highlights from your past sponsor deals (e.g. Nike, Spotify, Sony, Boat). Builds instant credibility with prospective sponsors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="tap-scale inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2.5 px-5 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Add Collaboration</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collaborations.map((collab) => (
            <div
              key={collab.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 bg-white shadow-2xs transition-all ${
                collab.isActive ? "border-[#ECE8EB]" : "border-slate-200 opacity-60 bg-slate-50"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  {collab.brandLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={collab.brandLogoUrl}
                      alt={collab.brandName}
                      className="h-12 w-12 rounded-xl object-cover border border-[#ECE8EB] shrink-0"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7EDF3] text-[#803D63] font-bold text-sm shrink-0">
                      <Handshake className="h-6 w-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-xs text-[#17131A]">{collab.brandName}</h3>
                    {collab.campaignTitle && (
                      <p className="truncate text-[11px] font-semibold text-[#803D63] mt-0.5">
                        {collab.campaignTitle}
                      </p>
                    )}
                  </div>
                </div>

                {collab.description && (
                  <p className="text-xs text-[#6F6872] line-clamp-2 leading-relaxed">
                    {collab.description}
                  </p>
                )}

                {collab.campaignUrl && (
                  <a
                    href={collab.campaignUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#803D63] hover:underline"
                  >
                    <span>View Campaign</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Actions Bar */}
              <div className="mt-4 pt-3 border-t border-[#ECE8EB] flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleCollab(collab)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#6F6872] hover:text-[#17131A] transition-colors cursor-pointer"
                >
                  {collab.isActive ? (
                    <>
                      <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Visible</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                      <span>Hidden</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(collab)}
                    className="p-1 text-[#6F6872] hover:text-[#17131A] hover:bg-[#FAF8FA] rounded-lg transition-colors cursor-pointer"
                    title="Edit collaboration"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollabToDelete(collab)}
                    className="p-1 text-[#6F6872] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove collaboration"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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
          <ModalBody className="p-5 sm:p-6 space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-[#17131A] mb-1.5">
                Brand Logo / Image (Optional)
              </label>
              <PhotoUpload
                value={brandLogo}
                onChange={setBrandLogo}
                shape="rounded"
                size={80}
                label="Upload Brand Logo"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17131A] mb-1.5">
                Brand / Partner Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Sony Music, Nike, or Boat Audio"
                className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] px-3.5 py-2.5 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17131A] mb-1.5">
                Campaign Title (Optional)
              </label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                placeholder="e.g. Summer Launch Reel Campaign"
                className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] px-3.5 py-2.5 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17131A] mb-1.5">
                Campaign URL / Live Reel Link (Optional)
              </label>
              <input
                type="url"
                value={campaignUrl}
                onChange={(e) => setCampaignUrl(e.target.value)}
                placeholder="https://instagram.com/reel/... or https://youtube.com/watch?v=..."
                className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] px-3.5 py-2.5 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17131A] mb-1.5">
                Short Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly mention key deliverables (e.g. 2x Instagram Reels, 1x YouTube dedicated video with 250K+ views)..."
                className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] p-3 text-xs font-medium text-[#17131A] placeholder:text-[#6F6872]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors resize-y"
              />
            </div>
          </ModalBody>

          <ModalFooter className="px-5 sm:px-6 py-3.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#ECE8EB] text-xs font-semibold text-[#6F6872] hover:bg-[#FAF8FA] hover:text-[#17131A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
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
