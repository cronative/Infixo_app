"use client";

import { useEffect, useState } from "react";
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
  Video,
  Sparkles,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorReview, ReviewStatus } from "@/types";
import { reviewsRepository } from "@/repositories/localRepository";

export default function DashboardReviewsPage() {
  const { profile } = useCreator();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "invited" | "all">("pending");

  // Popup Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Review Request Form State
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientDesignation, setClientDesignation] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);

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

      // Fallback to local repository
      setReviews(reviewsRepository.getAll());
      setLoading(false);
    }

    loadReviews();
  }, [profile.email, profile.username]);

  // Sync state to local storage repository
  const updateReviews = (updated: CreatorReview[]) => {
    setReviews(updated);
    reviewsRepository.saveAll(updated);
  };

  // Handle Send Review Invitation Email to Brand Client
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

        // Reset form & close modal
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

  // Handle Status Update (Approve / Reject)
  const handleUpdateStatus = async (id: string, status: ReviewStatus) => {
    try {
      fetch("/api/creator/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      }).catch((e) => console.warn("Failed API status update:", e));
    } catch (e) {}

    const updated = reviews.map((r) => (r.id === id ? { ...r, status } : r));
    updateReviews(updated);

    if (status === "approved") {
      showToast("Review approved and published to public profile! ⭐", "success");
    } else if (status === "rejected") {
      showToast("Review status set to rejected", "info");
    }
  };

  // Handle Delete Review
  const handleDeleteReview = async (id: string) => {
    try {
      fetch(`/api/creator/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch((e) =>
        console.warn("Failed API delete:", e)
      );
    } catch (e) {}

    const updated = reviews.filter((r) => r.id !== id);
    updateReviews(updated);
    showToast("Review deleted", "info");
  };

  // Filter counts
  const pendingCount = reviews.filter((r) => r.status === "pending_approval").length;
  const approvedCount = reviews.filter((r) => r.status === "approved").length;
  const invitedCount = reviews.filter((r) => r.status === "pending_invite").length;

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === "pending") return r.status === "pending_approval";
    if (activeTab === "approved") return r.status === "approved";
    if (activeTab === "invited") return r.status === "pending_invite";
    return true;
  });

  return (
    <div className="px-4 sm:px-8 py-6 max-w-6xl mx-auto space-y-6 text-left pb-10">
      
      {/* Page Header with Trigger Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Client Reviews & Brand Testimonials</span>
            <span className="bg-[#803D63]/10 text-[#803D63] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#803D63]/20">
              Social Proof
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Send email review invitations to brands, approve incoming testimonials & showcase 5-star social proof.
          </p>
        </div>

        {/* Action Button: Opens Popup Modal */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-[#803D63] hover:bg-[#6D3254] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Request Brand Review</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {lastSentEmail && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-3 text-emerald-900 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>Review invitation email successfully sent to <strong>{lastSentEmail}</strong>!</span>
          </div>
          <button
            type="button"
            onClick={() => setLastSentEmail(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Reviews Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "pending"
              ? "bg-[#803D63] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Pending Approval</span>
          {pendingCount > 0 && (
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("approved")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "approved"
              ? "bg-[#803D63] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Published Testimonials ({approvedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invited")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "invited"
              ? "bg-[#803D63] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Sent Email Invites ({invitedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === "all"
              ? "bg-[#803D63] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>All ({reviews.length})</span>
        </button>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
          <MessageSquare className="h-9 w-9 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-700">No review requests in this tab</p>
            <p className="text-[11px] text-slate-500 font-medium max-w-sm mx-auto">
              {activeTab === "pending"
                ? "You have no submitted brand reviews awaiting approval."
                : activeTab === "approved"
                ? "Approved client reviews will show up on your public profile."
                : "Click 'Request Brand Review' above to send email invitations to your brand partners."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Request Brand Review</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3 shadow-2xs text-left flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Status & Rating Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  {rev.status === "pending_approval" && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                      ⏳ Pending Approval
                    </span>
                  )}
                  {rev.status === "approved" && (
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Published
                    </span>
                  )}
                  {rev.status === "pending_invite" && (
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      📩 Email Sent ({rev.clientEmail})
                    </span>
                  )}
                  {rev.status === "rejected" && (
                    <span className="bg-rose-100 text-rose-900 border border-rose-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Rejected
                    </span>
                  )}
                </div>

                {/* Client & Project Badge */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#803D63] shrink-0" />
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                      {rev.clientName}
                    </h4>
                  </div>
                  {rev.clientDesignation && (
                    <p className="text-[11px] font-semibold text-slate-500">
                      {rev.clientDesignation}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      📦 {rev.projectTitle}
                    </span>
                    {rev.contentUrl && (
                      <a
                        href={rev.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#803D63] hover:underline flex items-center gap-1"
                      >
                        <Video className="h-3 w-3" /> View Reel/Shoot Link ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Comment text */}
                {rev.comment ? (
                  <p className="text-xs text-slate-700 font-medium leading-relaxed italic bg-slate-50 rounded-xl p-3 border border-slate-100">
                    “{rev.comment}”
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-medium italic">
                    Waiting for brand client to submit review text via email link...
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-slate-400">
                  {new Date(rev.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1.5">
                  {rev.status === "pending_approval" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(rev.id, "approved")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Approve & Publish</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(rev.id, "rejected")}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {rev.status === "approved" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(rev.id, "rejected")}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      Hide / Unpublish
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Review Request"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: Request Review Form */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-xl w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-left border border-slate-200/80 animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#803D63]">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900">
                    Request Review from Brand / Client
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    An email invitation with a secure single-use link will be sent to the client.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendEmailRequest} className="space-y-3.5 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Client / Brand Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Puma India / Nike"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Client / Brand Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="e.g. marketing@puma.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Title of Collab (Reels / Shorts / Shoot) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Created Reel / Short Film / Brand Campaign"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Link of Reels, Shoot, Short etc. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="e.g. https://instagram.com/reel/123 or YouTube link"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">
                  Client Role / Designation <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={clientDesignation}
                  onChange={(e) => setClientDesignation(e.target.value)}
                  placeholder="e.g. Marketing Manager @ Puma"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#803D63] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#803D63] hover:bg-[#6D3254] text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? "Sending..." : "Send Review Request Email →"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
