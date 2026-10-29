"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  Check,
  Trash2,
  Plus,
  ExternalLink,
  MoreVertical,
  Eye,
  EyeOff,
  Copy,
  Send,
  Share2,
  Building2,
  Mail,
  Tag,
  Sparkles,
  X,
  ShieldCheck,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorReview, ReviewStatus } from "@/types";
import { reviewsRepository } from "@/repositories/localRepository";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { OverLimitBadge } from "@/components/ui/OverLimitBadge";
import { getPlanQuota } from "@/services/subscriptionLimits";

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
  const { profile, subscription } = useCreator();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "pending" | "invited">("all");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<CreatorReview | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-open modal if navigated from "Request a Review" CTA
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("request") === "1" || params.get("action") === "request") {
        setIsModalOpen(true);
      }
    }
  }, []);

  // Fetch reviews on mount
  useEffect(() => {
    async function loadReviews() {
      const email = profile.email || "";
      const username = profile.username || "";

      try {
        if (email || username) {
          const httpResponse = await fetch(
            `/api/creator/reviews?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`
          );
          const apiResponse = await httpResponse.json();
          const revList = apiResponse.data?.reviews || apiResponse.reviews;

          if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success) && Array.isArray(revList)) {
            setReviews(revList);
            reviewsRepository.saveAll(revList);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch reviews from DB:", err);
      }

      setReviews(reviewsRepository.getAll());
    }

    loadReviews();
  }, [profile.email, profile.username]);

  // Click outside to close 3-dot menus
  useEffect(() => {
    // Ignore presses inside an open menu so its items receive their click.
    const handleClickOutside = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.("[data-menu]")) return;
      setActiveMenuId(null);
    };
    if (activeMenuId) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  const updateReviews = (updated: CreatorReview[]) => {
    setReviews(updated);
    reviewsRepository.saveAll(updated);
  };

  const handleCreateRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!clientName.trim()) {
      showToast("Please enter client or brand name", "error");
      return;
    }

    if (!clientEmail.trim()) {
      showToast("Please enter client email address", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const email = profile.email || "";
      const creatorId = profile.id || profile.email || "";

      const httpResponse = await fetch("/api/creator/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          creatorId,
          clientName: clientName.trim(),
          clientEmail: clientEmail.trim(),
          projectTitle: projectTitle.trim() || undefined,
        }),
      });
      const apiResponse = await httpResponse.json();
      const reviewData = apiResponse.data?.review || apiResponse.review;

      if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success) && reviewData) {
        const newRev: CreatorReview = reviewData;
        updateReviews([newRev, ...reviews]);
        showToast(`Review invitation email sent to ${clientEmail.trim()}! ✉️`, "success");

        setClientName("");
        setClientEmail("");
        setProjectTitle("");
        setIsModalOpen(false);
        return;
      } else {
        throw new Error(apiResponse.message || apiResponse.error || "Failed to create review request");
      }
    } catch (err: unknown) {
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
      showToast(`Review invitation email sent to ${clientEmail.trim()}! ✉️`, "success");

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
    } catch { }

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
    } catch { }

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

  const cleanHandle = (profile.username || "creator").replace(/^@/, "");
  const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
  const publicReviewsUrl = `${origin}/${cleanHandle}/reviews`;

  const handleCopyPublicReviewsLink = async () => {
    const success = await copyToClipboard(publicReviewsUrl);
    showToast(success ? "Reviews listing link copied! ⭐" : "Could not copy reviews link", success ? "success" : "error");
  };

  const handleSharePublicReviewsLink = async () => {
    const title = `${profile.displayName || cleanHandle}'s Reviews on Inflixo`;
    const text = `Read verified reviews for ${profile.displayName || cleanHandle} on Inflixo.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: publicReviewsUrl });
        return;
      }

      await handleCopyPublicReviewsLink();
    } catch {
      // User dismissed native share sheet.
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
    <PageContainer className="text-left">
      {/* 1. PAGE HEADER */}
      <PageHeader
        {...PAGE_COPY.reviews}
        meta={`${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`}
        actions={
          <button type="button" onClick={() => setIsModalOpen(true)} className="dash-btn-primary">
            <Plus className="h-3.5 w-3.5" />
            <span>Request review</span>
          </button>
        }
      />

      {/* 2. ZERO STATE: When 0 reviews, show unified empty state directly */}
      {reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="h-7 w-7" />}
          title="Get your first review"
          description="Ask a brand or sponsor you've worked with to leave you a review. You choose whether it appears on your profile."
          action={
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-[5px] bg-[#7A2253] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#7A2253]/20 transition-all hover:opacity-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Request review</span>
            </button>
          }
        />
      ) : (
        /* 3. REVIEWS EXIST: Show Compact Summary + Tabs + Cards */
        <div className="space-y-3.5">
          {/* Compact Summary Line */}
          <div className="flex flex-wrap items-center gap-2 rounded-[5px] border border-[#ECECF0] bg-white px-4 py-2.5 sm:py-3 shadow-none text-[13px] font-medium text-[#18181B]">
            <span className="font-semibold text-[#18181B]">{reviews.length} reviews</span>
            <span className="text-[#6B6B76]/40">·</span>
            <span className="text-[#18181B]">{approvedCount} published</span>
            <span className="text-[#6B6B76]/40">·</span>
            <span className="text-[#6B6B76]">{pendingCount} pending</span>
            <span className="text-[#6B6B76]/40">·</span>
            <span className="text-[#6B6B76]">{invitedCount} {invitedCount === 1 ? "invitation" : "invitations"}</span>
          </div>

          <div className="rounded-[5px] border border-[#ECECF0] bg-white p-3 shadow-none">
            <div className="flex flex-col gap-2 rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] p-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[#6B6B76]">Public reviews link</p>
                <p className="mt-0.5 line-clamp-2 break-words text-[13px] font-semibold text-[#18181B]" title={publicReviewsUrl}>{publicReviewsUrl}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyPublicReviewsLink}
                  className="inline-flex h-8 items-center gap-1 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-[13px] font-medium text-[#18181B] transition-colors hover:bg-[#FAFAFB]"
                >
                  <Copy className="h-3 w-3 text-[#6B6B76]" />
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={handleSharePublicReviewsLink}
                  className="inline-flex h-8 items-center gap-1 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-[13px] font-medium text-[#18181B] transition-colors hover:bg-[#FAFAFB]"
                >
                  <Share2 className="h-3 w-3" />
                  <span>Share</span>
                </button>
                <a
                  href={publicReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-[13px] font-medium text-[#18181B] transition-colors hover:bg-[#FAFAFB]"
                >
                  <ExternalLink className="h-3 w-3 text-[#6B6B76]" />
                  <span>View</span>
                </a>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 border-b border-[#ECECF0] pb-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`h-8 px-3 rounded-[5px] text-[13px] font-medium transition-colors cursor-pointer shrink-0 ${activeTab === "all"
                ? "bg-[#F7EEF2] text-[#7A2253]"
                : "text-[#6B6B76] hover:bg-[#FAFAFB] hover:text-[#18181B]"
                }`}
            >
              All ({reviews.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("approved")}
              className={`h-8 px-3 rounded-[5px] text-[13px] font-medium transition-colors cursor-pointer shrink-0 ${activeTab === "approved"
                ? "bg-[#F7EEF2] text-[#7A2253]"
                : "text-[#6B6B76] hover:bg-[#FAFAFB] hover:text-[#18181B]"
                }`}
            >
              Published ({approvedCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`h-8 px-3 rounded-[5px] text-[13px] font-medium transition-colors cursor-pointer shrink-0 ${activeTab === "pending"
                ? "bg-[#F7EEF2] text-[#7A2253]"
                : "text-[#6B6B76] hover:bg-[#FAFAFB] hover:text-[#18181B]"
                }`}
            >
              Pending ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("invited")}
              className={`h-8 px-3 rounded-[5px] text-[13px] font-medium transition-colors cursor-pointer shrink-0 ${activeTab === "invited"
                ? "bg-[#F7EEF2] text-[#7A2253]"
                : "text-[#6B6B76] hover:bg-[#FAFAFB] hover:text-[#18181B]"
                }`}
            >
              Invitations ({invitedCount})
            </button>
          </div>

          {/* List of Reviews / Invitations */}
          {filteredReviews.length === 0 ? (
            <div className="rounded-[5px] border border-[#ECECF0] bg-white p-4 text-center text-[13px] text-[#6B6B76]">
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
                    className="rounded-[5px] border border-[#ECECF0] bg-white p-3.5 sm:p-4 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
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
                        <p className="text-[14px] font-medium text-[#18181B] leading-snug">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      ) : null}

                      {/* Client + Project + Status */}
                      <div className="flex items-center gap-2 flex-wrap text-[12px] text-[#6B6B76]">
                        <span className="font-semibold text-[#18181B]">{rev.clientName}</span>
                        {rev.status === "approved" &&
                          reviews.filter((r) => r.status === "approved").indexOf(rev) >= getPlanQuota(subscription?.planKey).maxReviews && <OverLimitBadge />}
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
                          <span className="h-6 inline-flex items-center gap-1 text-[12px] font-medium text-[#17845B] bg-[#EAF7F0] px-2 rounded-[5px] border border-[#17845B]/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#17845B]" />
                            Published
                          </span>
                        )}
                        {rev.status === "pending_approval" && (
                          <span className="h-6 inline-flex items-center gap-1 text-[12px] font-medium text-[#B7791F] bg-[#B7791F]/10 px-2 rounded-[5px] border border-[#B7791F]/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#B7791F]" />
                            Pending
                          </span>
                        )}
                        {rev.status === "pending_invite" && (
                          <span className="h-6 inline-flex items-center gap-1 text-[12px] font-medium text-[#6B6B76] bg-[#FAFAFB] px-2 rounded-[5px] border border-[#ECECF0]">
                            Awaiting response
                          </span>
                        )}
                        {rev.status === "rejected" && (
                          <span className="h-6 inline-flex items-center gap-1 text-[12px] font-medium text-[#6B6B76] bg-[#FAFAFB] px-2 rounded-[5px] border border-[#ECECF0]">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ECECF0]">
                      {isInvite ? (
                        <button
                          type="button"
                          onClick={() => handleCopyReviewLink(rev)}
                          className="h-8 px-3 rounded-[5px] border border-[#ECECF0] bg-white hover:bg-[#FAFAFB] text-[13px] font-medium text-[#18181B] cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Copy className="h-3 w-3 text-[#6B6B76]" />
                          <span>Copy Link</span>
                        </button>
                      ) : rev.status === "pending_approval" ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(rev.id, "approved")}
                          className="h-8 px-3 rounded-[5px] bg-[#7A2253] hover:opacity-95 text-white text-[13px] font-medium cursor-pointer inline-flex items-center gap-1"
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
                          className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white hover:bg-[#FAFAFB] text-[#6B6B76] hover:text-[#18181B] cursor-pointer"
                          aria-label="More actions"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {activeMenuId === rev.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            data-menu
                            className="absolute right-0 top-full mt-1.5 w-44 rounded-[5px] border border-[#ECECF0] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in"
                          >
                            {rev.token && (
                              <button
                                type="button"
                                onClick={() => handleCopyReviewLink(rev)}
                                className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-[13px] font-medium text-[#18181B] hover:bg-[#FAFAFB] transition-colors cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 text-[#6B6B76]" />
                                <span>Copy Link</span>
                              </button>
                            )}

                            {rev.status === "approved" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(rev.id, "rejected")}
                                className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-xs font-medium text-[#7A2253] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                              >
                                <EyeOff className="h-3.5 w-3.5 text-[#64748b]" />
                                <span>Hide from profile</span>
                              </button>
                            )}

                            {(rev.status === "rejected" || rev.status === "pending_approval") && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(rev.id, "approved")}
                                className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-xs font-medium text-[#7A2253] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-[#64748b]" />
                                <span>Publish on profile</span>
                              </button>
                            )}

                            <div className="my-1 border-t border-[#e2e8f0]" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setReviewToDelete(rev);
                              }}
                              className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
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

      {/* 4. ULTRA-MODERN REQUEST REVIEW MODAL (EMAIL ONLY) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        showCloseButton={false}
        className="rounded-[5px] border border-slate-200/80 shadow-2xl overflow-hidden"
      >
        {/* Custom Header with Gradient Star Squircle */}
        <div className="relative border-b border-slate-100 bg-gradient-to-b from-[#FFF9FB]/80 to-white px-5 sm:px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] bg-gradient-to-tr from-[#7A2253] via-[#942767] to-[#C2414B] text-white shadow-md shadow-[#7A2253]/25">
                <Star className="h-5 w-5 fill-white/20 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold tracking-tight text-slate-900">
                    Request a Review
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-[5px] bg-pink-50 border border-pink-200/60 px-2 py-0.5 text-[10px] font-bold text-[#7A2253]">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 font-normal">
                  Ask a brand you&apos;ve worked with to leave feedback for your profile.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-[5px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleCreateRequest}
          className="flex flex-col flex-1 min-h-0"
        >
          <ModalBody className="p-5 sm:p-6 space-y-4 text-left">
            {/* Info Notice Banner */}
            <div className="flex items-center gap-3 p-3.5 rounded-[5px] bg-[#FFF9FB] border border-[#FCE7F1] text-xs text-[#7A2253]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[#FDF2F7] text-[#7A2253] shadow-xs">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs">We&apos;ll send an email invitation</p>
                <p className="text-[11.5px] text-slate-500 font-normal leading-tight mt-0.5">
                  The brand will receive a secure 1-click link to submit their review about working with you.
                </p>
              </div>
            </div>

            {/* Field 1: Client / Brand Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="client-name" className="block text-[13px] font-bold text-slate-800">
                  Client or brand name <span className="text-[#C2414B]">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-normal">
                  Brand you collaborated with
                </span>
              </div>
              <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                  <Building2 className="h-4 w-4" />
                </span>
                <input
                  id="client-name"
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Puma India or Urban Cafe"
                  className="flex-1 min-w-0 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                />
              </div>

              {/* Quick Brand Suggestions */}
              {!clientName && (
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="text-[10.5px] text-slate-400 font-medium">Popular:</span>
                  {["Puma", "Boat", "Mamaearth", "Nykaa", "Urban Cafe"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setClientName(b)}
                      className="text-[10.5px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded-[5px] transition-colors cursor-pointer"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Field 2: Client Email */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="client-email" className="block text-[13px] font-bold text-slate-800">
                  Client email <span className="text-[#C2414B]">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-normal">
                  We&apos;ll send the review request to this email
                </span>
              </div>
              <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="client-email"
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="collabs@brand.com"
                  className="flex-1 min-w-0 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Field 3: Collaboration / Campaign Name */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="collab-title" className="block text-[13px] font-bold text-slate-800">
                  Collaboration / campaign name <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-normal">
                  Helps brand remember the project
                </span>
              </div>
              <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                  <Tag className="h-4 w-4" />
                </span>
                <input
                  id="collab-title"
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Summer Campaign Reel or Store Launch"
                  className="flex-1 min-w-0 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Compact Live Review Preview Pill */}
            <div className="p-3.5 rounded-[5px] border border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-[11.5px]">
                  Brand will submit: <strong className="text-slate-800 font-semibold">1–5★ Rating</strong> · <strong className="text-slate-800 font-semibold">Feedback</strong> · <strong className="text-slate-800 font-semibold">Brand Logo</strong>
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-[#7A2253] bg-pink-50 border border-pink-200/70 px-2 py-0.5 rounded-[5px] uppercase tracking-wider">
                Live Review
              </span>
            </div>
          </ModalBody>

          {/* Footer Actions */}
          <ModalFooter className="px-5 sm:px-6 py-3.5 border-t border-[#e2e8f0] bg-white flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !clientName.trim() || !clientEmail.trim()}
              className="h-10 px-5 rounded-[5px] bg-[#7A2253] hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-[#7A2253]/20 transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Sending..." : "Send Invitation"}</span>
            </button>
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
    </PageContainer>
  );
}
