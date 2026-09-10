"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Star,
  Check,
  X,
  Mail,
  Trash2,
  Plus,
  ExternalLink,
  MoreVertical,
  Eye,
  EyeOff,
  Copy,
  Clock,
  Send,
  Building2,
  Share2,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorReview, ReviewStatus } from "@/types";
import { reviewsRepository } from "@/repositories/localRepository";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

export default function DashboardReviewsPage() {
  const { profile } = useCreator();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "pending" | "invited">("all");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<CreatorReview | null>(null);

  // Request Review Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch reviews on mount
  useEffect(() => {
    async function loadReviews() {
      const email = profile.email || "";
      const username = profile.username || "";

      try {
        if (email || username) {
          const res = await fetch(
            `/api/creator/reviews?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`
          )
            .then((r) => r.json())
            .catch(() => null);

          if (res && res.success && Array.isArray(res.reviews)) {
            setReviews(res.reviews);
            reviewsRepository.saveAll(res.reviews);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch reviews from DB:", err);
      }

      setReviews(reviewsRepository.getAll());
      setLoading(false);
    }

    loadReviews();
  }, [profile.email, profile.username]);

  // Click outside to close 3-dot menus
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    if (activeMenuId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  const updateReviews = (updated: CreatorReview[]) => {
    setReviews(updated);
    reviewsRepository.saveAll(updated);
  };

  const handleCreateRequest = async (e?: React.FormEvent, copyLinkAfter = false) => {
    if (e) e.preventDefault();

    if (!clientName.trim()) {
      showToast("Please enter client or brand name", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const email = profile.email || "";
      const creatorId = profile.id || profile.email || "";

      const res = await fetch("/api/creator/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          creatorId,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim() || undefined,
          projectTitle: projectTitle.trim() || undefined,
        }),
      }).then((r) => r.json());

      if (res.success && res.review) {
        const newRev: CreatorReview = res.review;
        updateReviews([newRev, ...reviews]);

        if (copyLinkAfter || !clientEmail.trim()) {
          const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
          const link = res.reviewUrl || `${origin}/review/${newRev.token}`;
          await copyToClipboard(link);
          showToast("Review link created and copied to clipboard! 🔗", "success");
        } else {
          showToast(`Review invitation email sent to ${clientEmail.trim()}! ✉️`, "success");
        }

        setClientName("");
        setClientEmail("");
        setProjectTitle("");
        setIsModalOpen(false);
      } else {
        throw new Error(res.error || "Failed to create review request");
      }
    } catch (err: any) {
      console.warn("Backend error, saving locally:", err);

      const reviewId = `rev_${Date.now()}`;
      const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newRev: CreatorReview = {
        id: reviewId,
        creatorId: profile.id || "cr_local",
        token,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        projectTitle: projectTitle.trim() || "Brand Collaboration",
        contentUrl: "",
        rating: 5,
        comment: "",
        status: "pending_invite",
        createdAt: new Date().toISOString(),
      };

      updateReviews([newRev, ...reviews]);

      const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
      const link = `${origin}/review/${token}`;
      await copyToClipboard(link);
      showToast("Review link created and copied to clipboard! 🔗", "success");

      setClientName("");
      setClientEmail("");
      setProjectTitle("");
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Update (Approve / Hide / Reject)
  const handleUpdateStatus = async (id: string, status: ReviewStatus) => {
    setActiveMenuId(null);
    try {
      fetch("/api/creator/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      }).catch((e) => console.warn("Failed API status update:", e));
    } catch (e) { }

    const updated = reviews.map((r) => (r.id === id ? { ...r, status } : r));
    updateReviews(updated);

    if (status === "approved") {
      showToast("Review published on your profile! ⭐");
    } else if (status === "rejected") {
      showToast("Review hidden from your profile.");
    }
  };

  // Handle Delete Review
  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    const id = reviewToDelete.id;
    try {
      fetch(`/api/creator/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch((e) =>
        console.warn("Failed API delete:", e)
      );
    } catch (e) { }

    const updated = reviews.filter((r) => r.id !== id);
    updateReviews(updated);
    showToast("Review removed.");
    setReviewToDelete(null);
  };

  const handleCopyReviewLink = async (rev: CreatorReview) => {
    setActiveMenuId(null);
    if (!rev.token) {
      showToast("No direct review link available", "info");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const link = `${origin}/review/${rev.token}`;
    const success = await copyToClipboard(link);
    if (success) {
      showToast("Review submission link copied! 🔗");
    }
  };

  // Counts
  const pendingCount = useMemo(() => reviews.filter((r) => r.status === "pending_approval").length, [reviews]);
  const approvedCount = useMemo(() => reviews.filter((r) => r.status === "approved").length, [reviews]);
  const invitedCount = useMemo(() => reviews.filter((r) => r.status === "pending_invite").length, [reviews]);

  const filteredReviews = useMemo(() => {
    if (activeTab === "pending") return reviews.filter((r) => r.status === "pending_approval");
    if (activeTab === "approved") return reviews.filter((r) => r.status === "approved");
    if (activeTab === "invited") return reviews.filter((r) => r.status === "pending_invite");
    return reviews;
  }, [reviews, activeTab]);

  return (
    <div className="space-y-6 w-full pb-12 text-left">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#181716] leading-tight">
            Reviews
          </h1>
          <p className="text-sm sm:text-[15px] text-[#54514D] font-normal mt-1">
            Collect reviews from brands you&apos;ve worked with and choose which ones appear on your profile.
          </p>
        </div>

        {/* Top CTA: Only visible when reviews exist */}
        {reviews.length > 0 && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-[#151933] hover:bg-[#2c1937] text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Request Review</span>
          </button>
        )}
      </div>

      {/* 2. ZERO STATE: When 0 reviews, show compact empty state directly */}
      {reviews.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#E7E3DC] bg-white p-7 sm:p-8 text-center space-y-3.5 shadow-xs max-w-xl mx-auto min-h-[220px] flex flex-col items-center justify-center">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#181716]">
              Get your first review
            </h3>
            <p className="text-xs sm:text-sm text-[#797570] max-w-md mx-auto">
              Ask a brand you&apos;ve worked with to leave you a review. You choose whether it appears on your profile.
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="h-10 px-5 rounded-xl bg-[#151933] hover:bg-[#2c1937] text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Request Review</span>
            </button>
          </div>
        </div>
      ) : (
        /* 3. REVIEWS EXIST: Show Compact Summary + Tabs + Cards */
        <div className="space-y-4">
          {/* Compact Summary Line (Only shown when reviews exist) */}
          <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-[#E7E3DC] bg-white px-5 py-3.5 shadow-xs text-sm font-medium text-[#181716]">
            <span className="font-semibold text-[#181716]">{reviews.length} reviews</span>
            <span className="text-[#797570]/40">·</span>
            <span className="text-[#181716]">{approvedCount} published</span>
            <span className="text-[#797570]/40">·</span>
            <span className="text-[#54514D]">{pendingCount} pending</span>
            <span className="text-[#797570]/40">·</span>
            <span className="text-[#54514D]">{invitedCount} {invitedCount === 1 ? "invitation" : "invitations"}</span>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 border-b border-[#E7E3DC] pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === "all"
                  ? "bg-[#151933]/[0.09] text-[#151933] border border-[#151933]/20"
                  : "text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716]"
                }`}
            >
              All ({reviews.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("approved")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === "approved"
                  ? "bg-[#151933]/[0.09] text-[#151933] border border-[#151933]/20"
                  : "text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716]"
                }`}
            >
              Published ({approvedCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === "pending"
                  ? "bg-[#151933]/[0.09] text-[#151933] border border-[#151933]/20"
                  : "text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716]"
                }`}
            >
              Pending ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("invited")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === "invited"
                  ? "bg-[#151933]/[0.09] text-[#151933] border border-[#151933]/20"
                  : "text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716]"
                }`}
            >
              Invitations ({invitedCount})
            </button>
          </div>

          {/* List of Reviews / Invitations */}
          {filteredReviews.length === 0 ? (
            <div className="rounded-2xl border border-[#E7E3DC] bg-white p-6 text-center text-xs text-[#797570]">
              No reviews in this tab.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((rev) => {
                const isInvite = rev.status === "pending_invite";
                const ratingValue = Number(rev.rating) || 5;

                return (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                  >
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Top row: Stars (if submitted review) or Status */}
                      {!isInvite && (
                        <div className="flex items-center gap-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i <= ratingValue ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                                }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Comment (if review) or Brand Name */}
                      {rev.comment ? (
                        <p className="text-sm font-semibold text-[#181716] leading-snug">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      ) : null}

                      {/* Client + Project + Status */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-[#797570]">
                        <span className="font-bold text-[#181716]">{rev.clientName}</span>
                        {rev.projectTitle && (
                          <>
                            <span>·</span>
                            <span>{rev.projectTitle}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{isInvite ? `Requested ${formatDate(rev.createdAt)}` : formatDate(rev.createdAt)}</span>

                        {/* Status Badge */}
                        {rev.status === "approved" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#17845B] bg-[#EAF7F0] px-2 py-0.5 rounded-full border border-[#17845B]/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#17845B]" />
                            Published
                          </span>
                        )}
                        {rev.status === "pending_approval" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B7791F] bg-[#B7791F]/10 px-2 py-0.5 rounded-full border border-[#B7791F]/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#B7791F]" />
                            Pending
                          </span>
                        )}
                        {rev.status === "pending_invite" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#797570] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E7E3DC]">
                            Awaiting response
                          </span>
                        )}
                        {rev.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#797570] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E7E3DC]">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E7E3DC]">
                      {isInvite ? (
                        <button
                          type="button"
                          onClick={() => handleCopyReviewLink(rev)}
                          className="px-3 py-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#181716] transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Copy className="h-3 w-3 text-[#797570]" />
                          <span>Copy Link</span>
                        </button>
                      ) : rev.status === "pending_approval" ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(rev.id, "approved")}
                          className="px-3 py-1.5 rounded-xl bg-[#151933] hover:bg-[#2c1937] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          <span>Publish</span>
                        </button>
                      ) : null}

                      {/* Three-dot Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === rev.id ? null : rev.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
                          aria-label="More actions"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === rev.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[#E7E3DC] bg-white p-1.5 shadow-lg z-50 space-y-0.5 animate-in fade-in"
                          >
                            {rev.token && (
                              <button
                                type="button"
                                onClick={() => handleCopyReviewLink(rev)}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 text-[#797570]" />
                                <span>Copy Link</span>
                              </button>
                            )}

                            {rev.status === "approved" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(rev.id, "rejected")}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                              >
                                <EyeOff className="h-3.5 w-3.5 text-[#797570]" />
                                <span>Hide from profile</span>
                              </button>
                            )}

                            {(rev.status === "rejected" || rev.status === "pending_approval") && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(rev.id, "approved")}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-[#797570]" />
                                <span>Publish on profile</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-[#E7E3DC]" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setReviewToDelete(rev);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{isInvite ? "Cancel request" : "Delete review"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. SIMPLE REQUEST REVIEW MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        title="Request a Review"
        description="Ask a brand you've worked with to leave feedback for your profile."
        icon={<Star className="h-4 w-4" />}
      >
        <form onSubmit={(e) => handleCreateRequest(e, false)} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-3.5 text-left">
            <div className="space-y-1">
              <label htmlFor="client-name" className="block text-xs font-bold text-[#181716]">
                Client or brand name <span className="text-[#C2414B]">*</span>
              </label>
              <input
                id="client-name"
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Puma India or Urban Cafe"
                className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#151933] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="client-email" className="block text-xs font-bold text-[#181716]">
                Client email <span className="text-[#797570] font-normal">(Optional if sharing link directly)</span>
              </label>
              <input
                id="client-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="collabs@brand.com"
                className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#151933] focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="collab-title" className="block text-xs font-bold text-[#181716]">
                Collaboration / campaign name <span className="text-[#797570] font-normal">(Optional)</span>
              </label>
              <input
                id="collab-title"
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Summer Campaign Reel or Store Launch"
                className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white px-3.5 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/50 focus:border-[#151933] focus:outline-none transition-colors"
              />
            </div>
          </ModalBody>

          <ModalFooter className="px-4 sm:px-5 py-3 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#E7E3DC] text-xs font-semibold text-[#797570] hover:bg-[#FAF8F5] hover:text-[#181716] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                disabled={isSubmitting || !clientName.trim()}
                onClick={() => handleCreateRequest(undefined, true)}
                className="h-10 px-4 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#181716] transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                title="Create and copy shareable review link"
              >
                <Copy className="h-3.5 w-3.5 text-[#797570]" />
                <span>Copy Review Link</span>
              </button>

              {clientEmail.trim() ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-4 rounded-xl bg-[#151933] hover:bg-[#2c1937] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Sending..." : "Send Invitation"}</span>
                </button>
              ) : null}
            </div>
          </ModalFooter>
        </form>
      </Modal>

      {/* 5. DELETE REVIEW CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleDeleteReview}
        title={reviewToDelete?.status === "pending_invite" ? "Cancel review request?" : "Delete this review?"}
        description={
          reviewToDelete?.status === "pending_invite"
            ? `The review invitation for "${reviewToDelete?.clientName}" will be cancelled.`
            : `The review from "${reviewToDelete?.clientName}" will be permanently removed.`
        }
        confirmText={reviewToDelete?.status === "pending_invite" ? "Cancel Request" : "Delete Review"}
        cancelText="Keep"
      />
    </div>
  );
}
