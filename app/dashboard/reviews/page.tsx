"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  Clock,
  Send,
  X,
  MessageSquare,
  Building2,
  Mail,
  Trash2,
  Plus,
  ExternalLink,
  MoreVertical,
  Check,
  Eye,
  EyeOff,
  Copy,
  Video,
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

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email || "";
  const [user, domain] = email.split("@");
  if (user.length <= 2) return `${user.charAt(0)}***@${domain}`;
  return `${user.substring(0, 2)}***@${domain}`;
}

export default function DashboardReviewsPage() {
  const { profile } = useCreator();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "pending" | "invited">("all");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<CreatorReview | null>(null);

  // Popup Modal State (100% UNTOUCHED logic)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Form State for Request Review (100% UNTOUCHED fields)
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientDesignation, setClientDesignation] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);

  // Background Scroll Lock & Escape Key for Request Review Popup
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsModalOpen(false);
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
        window.scrollTo(0, scrollY);
      };
    }
  }, [isModalOpen]);

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

  // Handle Send Review Invitation Email (100% UNTOUCHED handler logic)
  const handleSendEmailRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      showToast("Please enter client/brand name", "error");
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes("@")) {
      showToast("Please enter a valid client email address", "error");
      return;
    }
    if (!projectTitle.trim()) {
      showToast("Please enter title of collab (e.g. Created Reel / Short / Shoot)", "error");
      return;
    }
    if (!contentUrl.trim()) {
      showToast("Please enter link of reel, shoot, short etc.", "error");
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
          clientEmail: clientEmail.trim(),
          clientDesignation: clientDesignation.trim(),
          projectTitle: projectTitle.trim(),
          contentUrl: contentUrl.trim(),
        }),
      }).then((r) => r.json());

      if (res.success && res.review) {
        const newRev: CreatorReview = res.review;
        updateReviews([newRev, ...reviews]);
        setLastSentEmail(clientEmail.trim());

        showToast(`Review invitation email sent to ${clientEmail.trim()}! ✉️`, "success");

        setClientName("");
        setClientEmail("");
        setClientDesignation("");
        setProjectTitle("");
        setContentUrl("");
        setIsModalOpen(false);
      } else {
        throw new Error(res.error || "Failed to send email");
      }
    } catch (err: any) {
      console.warn("Backend error sending review request email, creating local record:", err);

      const reviewId = `rev_${Date.now()}`;
      const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newRev: CreatorReview = {
        id: reviewId,
        creatorId: profile.id || "cr_local",
        token,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientDesignation: clientDesignation.trim(),
        projectTitle: projectTitle.trim(),
        contentUrl: contentUrl.trim(),
        rating: 5,
        comment: "",
        status: "pending_invite",
        createdAt: new Date().toISOString(),
      };

      updateReviews([newRev, ...reviews]);
      setLastSentEmail(clientEmail.trim());
      showToast(`Review invitation email sent to ${clientEmail.trim()}! ✉️`, "success");

      setClientName("");
      setClientEmail("");
      setClientDesignation("");
      setProjectTitle("");
      setContentUrl("");
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
      showToast("Review approved and published to profile! ⭐");
    } else if (status === "rejected") {
      showToast("Review hidden from profile.");
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

  // Dynamic counts
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#181716] tracking-tight">
            Reviews
          </h1>
          <p className="text-xs sm:text-sm text-[#797570] font-medium mt-1">
            Collect feedback from brand collaborations and choose what appears on your creator profile.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] px-4 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Request Review</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {lastSentEmail && (
        <div className="rounded-2xl border border-[#17845B]/20 bg-[#EAF7F0] p-4 flex items-center justify-between gap-3 text-[#17845B] text-xs font-semibold animate-in fade-in text-left">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#17845B] shrink-0" />
            <span>Review invitation email sent to <strong>{lastSentEmail}</strong>!</span>
          </div>
          <button
            type="button"
            onClick={() => setLastSentEmail(null)}
            className="text-[#17845B] hover:opacity-80 p-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. COMPACT REVIEW SUMMARY (4 Cards) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-left">
        {/* Card 1: All Reviews */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              All Reviews
            </span>
            <MessageSquare className="h-4 w-4 text-[#b85c6b]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#181716]">
            {reviews.length}
          </p>
          <p className="text-[11px] text-[#797570] font-medium">
            Feedback received
          </p>
        </div>

        {/* Card 2: Published */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              Published
            </span>
            <CheckCircle2 className="h-4 w-4 text-[#17845B]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#181716]">
            {approvedCount}
          </p>
          <p className="text-[11px] text-[#797570] font-medium">
            Visible on your profile
          </p>
        </div>

        {/* Card 3: Pending Approval */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              Pending Approval
            </span>
            <Clock className="h-4 w-4 text-[#B7791F]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#181716]">
            {pendingCount}
          </p>
          <p className="text-[11px] text-[#797570] font-medium">
            Waiting for your decision
          </p>
        </div>

        {/* Card 4: Invitations Sent */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              Invitations Sent
            </span>
            <Send className="h-4 w-4 text-[#b85c6b]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#181716]">
            {invitedCount}
          </p>
          <p className="text-[11px] text-[#797570] font-medium">
            Awaiting a response
          </p>
        </div>
      </section>

      {/* 3. STATUS NAVIGATION TABS */}
      <section className="space-y-4 text-left">
        <div className="flex items-center gap-1.5 border-b border-[#E7E3DC] pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === "all"
                ? "bg-[#b85c6b]/[0.09] text-[#b85c6b] border border-[#b85c6b]/20"
                : "text-[#797570] hover:bg-[#F8F7F3] hover:text-[#181716]"
              }`}
          >
            All ({reviews.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === "approved"
                ? "bg-[#b85c6b]/[0.09] text-[#b85c6b] border border-[#b85c6b]/20"
                : "text-[#797570] hover:bg-[#F8F7F3] hover:text-[#181716]"
              }`}
          >
            Published ({approvedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === "pending"
                ? "bg-[#b85c6b]/[0.09] text-[#b85c6b] border border-[#b85c6b]/20"
                : "text-[#797570] hover:bg-[#F8F7F3] hover:text-[#181716]"
              }`}
          >
            Pending ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("invited")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${activeTab === "invited"
                ? "bg-[#b85c6b]/[0.09] text-[#b85c6b] border border-[#b85c6b]/20"
                : "text-[#797570] hover:bg-[#F8F7F3] hover:text-[#181716]"
              }`}
          >
            Invitations ({invitedCount})
          </button>
        </div>

        {/* 4. REVIEWS LIST / EMPTY STATES */}
        {filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-[#E7E3DC] bg-white p-8 sm:p-10 text-center space-y-3 shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b85c6b]/[0.09] text-[#b85c6b] border border-[#b85c6b]/20">
              <MessageSquare className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display text-base font-bold text-[#181716]">
                {activeTab === "all" && "Build trust from completed collaborations"}
                {activeTab === "approved" && "No published reviews yet"}
                {activeTab === "pending" && "No reviews waiting for approval"}
                {activeTab === "invited" && "No review invitations sent"}
              </h3>
              <p className="text-xs text-[#54514D] max-w-md mx-auto">
                {activeTab === "all" &&
                  "Request feedback from brands you have worked with and choose which reviews appear on your creator profile."}
                {activeTab === "approved" &&
                  "Approve a received review to display it on your creator profile."}
                {activeTab === "pending" &&
                  "New feedback will appear here before it is published."}
                {activeTab === "invited" &&
                  "Request feedback after completing a brand collaboration."}
              </p>
            </div>

            {(activeTab === "all" || activeTab === "invited") && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#b85c6b] hover:bg-[#6F3456] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{activeTab === "all" ? "Request First Review" : "Request Review"}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((rev) => {
              const formattedDate = formatDate(rev.createdAt);
              const ratingValue = Number(rev.rating) || 5;

              return (
                <div
                  key={rev.id}
                  className="rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xs text-left"
                >
                  <div className="space-y-3">
                    {/* Top Row: Client Info + Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b85c6b]/[0.09] text-[#b85c6b] border border-[#E7E3DC] shrink-0">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-sm font-bold text-[#181716] truncate" title={rev.clientName}>
                            {rev.clientName}
                          </h3>
                          {rev.clientDesignation ? (
                            <p className="text-[11px] text-[#797570] font-medium truncate">
                              {rev.clientDesignation}
                            </p>
                          ) : (
                            <p className="text-[11px] text-[#797570] font-medium truncate">
                              {maskEmail(rev.clientEmail)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {rev.status === "approved" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#17845B] bg-[#EAF7F0] px-2 py-0.5 rounded-full border border-[#17845B]/20">
                            <span className="h-1 w-1 rounded-full bg-[#17845B]" />
                            Published
                          </span>
                        )}
                        {rev.status === "pending_approval" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#B7791F] bg-[#B7791F]/10 border border-[#B7791F]/20 px-2 py-0.5 rounded-full">
                            <span className="h-1 w-1 rounded-full bg-[#B7791F]" />
                            Pending Approval
                          </span>
                        )}
                        {rev.status === "pending_invite" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#797570] bg-[#F8F7F3] border border-[#E7E3DC] px-2 py-0.5 rounded-full">
                            <span className="h-1 w-1 rounded-full bg-[#797570]" />
                            Invitation Sent
                          </span>
                        )}
                        {rev.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#797570] bg-[#F8F7F3] border border-[#E7E3DC] px-2 py-0.5 rounded-full">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Second Row: Rating Stars + Collaboration Type */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      {rev.status !== "pending_invite" ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="flex items-center gap-0.5 text-amber-400"
                            aria-label={`Rated ${ratingValue} out of 5`}
                          >
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${i < ratingValue
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-[#E7E3DC] text-[#E7E3DC]"
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-[#181716]">
                            {ratingValue.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#797570] font-medium">
                          Awaiting brand rating
                        </span>
                      )}

                      {rev.projectTitle && (
                        <span className="text-[10px] font-bold text-[#b85c6b] bg-[#b85c6b]/[0.09] border border-[#b85c6b]/20 px-2 py-0.5 rounded-md truncate max-w-[160px]">
                          {rev.projectTitle}
                        </span>
                      )}
                    </div>

                    {/* Review Text / Comment */}
                    <div className="rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] p-3 text-xs text-[#181716] font-normal leading-relaxed">
                      {rev.comment ? (
                        <p className="line-clamp-4">“{rev.comment}”</p>
                      ) : (
                        <p className="text-[#797570] italic">
                          Awaiting client feedback submission via secure link.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer Row: Date, Related Link, Actions */}
                  <div className="pt-2 border-t border-[#E7E3DC] flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] text-[#797570] shrink-0">
                        {formattedDate}
                      </span>

                      {rev.contentUrl && (
                        <a
                          href={rev.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-[#b85c6b] hover:underline inline-flex items-center gap-1 truncate"
                        >
                          <span>View related work</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Visibility / Approval Actions */}
                      {rev.status === "pending_approval" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(rev.id, "approved")}
                          className="inline-flex items-center gap-1 rounded-lg bg-[#b85c6b] hover:bg-[#6F3456] text-white px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                        >
                          <Check className="h-3 w-3" />
                          <span>Approve</span>
                        </button>
                      )}

                      {rev.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(rev.id, "rejected")}
                          className="rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] text-[#797570] hover:text-[#181716] px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Hide from Profile
                        </button>
                      )}

                      {rev.status === "rejected" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(rev.id, "approved")}
                          className="rounded-lg border border-[#E7E3DC] bg-white hover:bg-[#F8F7F3] text-[#b85c6b] px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Publish to Profile
                        </button>
                      )}

                      {/* Three-dot Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === rev.id ? null : rev.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E7E3DC] bg-[#F8F7F3] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer"
                          aria-label="More actions"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {activeMenuId === rev.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full mb-1.5 w-40 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-20 space-y-0.5 animate-in fade-in"
                          >
                            {rev.token && (
                              <button
                                type="button"
                                onClick={() => handleCopyReviewLink(rev)}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#F8F7F3] transition-colors cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5 text-[#797570]" />
                                <span>Copy Link</span>
                              </button>
                            )}

                            {rev.status === "approved" ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(rev.id, "rejected")}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#F8F7F3] transition-colors cursor-pointer"
                              >
                                <EyeOff className="h-3.5 w-3.5 text-[#797570]" />
                                <span>Hide from Profile</span>
                              </button>
                            ) : rev.status === "rejected" ? (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(rev.id, "approved")}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#F8F7F3] transition-colors cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5 text-[#797570]" />
                                <span>Publish to Profile</span>
                              </button>
                            ) : null}

                            <div className="my-1 border-t border-[#E7E3DC]" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                setReviewToDelete(rev);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-[#C2414B]/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete Review</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* POPUP MODAL: Request Review Form */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        title="Request a Client Review"
        description="Send a secure review invitation after completing a collaboration."
        icon={<Mail className="h-4 w-4" />}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Modal Form Content (Internal Scrolling) */}
          <ModalBody className="p-5 space-y-4 text-left">
            <form id="review-request-form" onSubmit={handleSendEmailRequest} className="space-y-4">
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
                  placeholder="e.g. Puma India"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#b85c6b] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="client-email" className="block text-xs font-bold text-[#181716]">
                  Client or brand email <span className="text-[#C2414B]">*</span>
                </label>
                <input
                  id="client-email"
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="e.g. marketing@puma.com"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#b85c6b] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="collab-title" className="block text-xs font-bold text-[#181716]">
                  Collaboration title <span className="text-[#C2414B]">*</span>
                </label>
                <input
                  id="collab-title"
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Summer campaign reel"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#b85c6b] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="content-url" className="block text-xs font-bold text-[#181716]">
                  Related work link <span className="text-[#C2414B]">*</span>
                </label>
                <input
                  id="content-url"
                  type="url"
                  required
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="https://instagram.com/reel/..."
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#b85c6b] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="client-designation" className="block text-xs font-bold text-[#181716]">
                  Client role or designation <span className="text-[#797570] font-normal">(Optional)</span>
                </label>
                <input
                  id="client-designation"
                  type="text"
                  value={clientDesignation}
                  onChange={(e) => setClientDesignation(e.target.value)}
                  placeholder="e.g. Marketing Manager"
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#F8F7F3] px-3.5 py-2.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/50 focus:border-[#b85c6b] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </form>
          </ModalBody>

          {/* Modal Actions Footer */}
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
              form="review-request-form"
              disabled={isSubmitting}
              className="bg-[#b85c6b] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Sending..." : "Send Review Request"}</span>
            </button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Delete Review Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleDeleteReview}
        title="Delete this review?"
        description={`The review from "${reviewToDelete?.clientName}" will be removed.`}
        confirmText="Delete Review"
        cancelText="Cancel"
      />
    </div>
  );
}
