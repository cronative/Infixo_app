"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  Send,
  MessageSquare,
  ShieldCheck,
  Package,
  Lock,
  Video,
  Building2,
  Sparkles,
  Wand2,
  RotateCw,
  Film,
  Handshake,
  Clock,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/contexts/ToastContext";

// Function to generate 5 contextual, unique AI review suggestions <= 250 characters
function generateContextualSuggestions(
  creatorName?: string,
  projectTitle?: string,
  clientName?: string
): string[] {
  const creator = creatorName || "the creator";
  const project = projectTitle || "our collaboration";
  const brand = clientName || "our brand";

  const pool = [
    `Collaborating with ${creator} on "${project}" was exceptional! Top quality content, smooth communication, and great results for ${brand}. ⭐`,
    `${creator} delivered outstanding work on "${project}"! Highly creative, punctual, and drove excellent engagement for ${brand}.`,
    `Super professional experience working with ${creator} for "${project}". Content was beautifully produced and exceeded ${brand}'s campaign goals!`,
    `Loved the creative execution by ${creator} on "${project}". Smooth workflow, quick turnaround, and high audience interest for ${brand}!`,
    `${creator} brought "${project}" to life with authentic storytelling. Incredible quality and seamless partnership with ${brand}. Highly recommend!`,
    `Working with ${creator} on "${project}" was a breeze! High production value, clear communication, and great brand impact for ${brand}.`,
    `${creator} created fantastic content for "${project}"! Professional, reliable, and delivered results beyond what ${brand} expected.`,
    `Impressive work by ${creator} for "${project}". The attention to detail and storytelling style fit ${brand} perfectly!`,
    `Fantastic partnership with ${creator} on "${project}". On-time delivery, top-grade visuals, and great engagement for ${brand}!`,
    `${creator} did a phenomenal job on "${project}". Clear messaging, authentic engagement, and total professionalism with ${brand}.`,
  ];

  // Ensure all suggestions are strictly under 250 characters
  const validPool = pool.map((t) => (t.length > 250 ? t.substring(0, 247) + "..." : t));

  // Random shuffle to pick 5 unique items every time
  const shuffled = [...validPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

export default function PublicReviewSubmissionPage() {
  const params = useParams<{ token: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [submittedNow, setSubmittedNow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [reviewData, setReviewData] = useState<{
    token: string;
    clientName: string;
    clientEmail: string;
    clientDesignation: string;
    projectTitle: string;
    contentUrl: string;
    rating: number;
    ratingContentQuality?: number;
    ratingProfessionalism?: number;
    ratingTimelyDelivery?: number;
    comment: string;
    status: string;
  } | null>(null);

  const [creatorData, setCreatorData] = useState<{
    displayName: string;
    username: string;
    photoDataUrl: string | null;
    category?: string;
    profession?: string;
    isVerified?: boolean;
  } | null>(null);

  // 4 Rating Criteria (Fast 30-60 second review)
  const [ratingOverall, setRatingOverall] = useState(5);
  const [ratingContentQuality, setRatingContentQuality] = useState(5);
  const [ratingProfessionalism, setRatingProfessionalism] = useState(5);
  const [ratingTimelyDelivery, setRatingTimelyDelivery] = useState(5);

  // Hover States for Rating Stars
  const [hoverOverall, setHoverOverall] = useState(0);
  const [hoverContentQuality, setHoverContentQuality] = useState(0);
  const [hoverProfessionalism, setHoverProfessionalism] = useState(0);
  const [hoverTimelyDelivery, setHoverTimelyDelivery] = useState(0);

  // Optional Written Review (Max 250 characters)
  const [comment, setComment] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Refresh AI Suggestions
  const handleRefreshSuggestions = (
    cName?: string,
    pTitle?: string,
    bName?: string
  ) => {
    const newSuggestions = generateContextualSuggestions(
      cName || creatorData?.displayName,
      pTitle || reviewData?.projectTitle,
      bName || reviewData?.clientName
    );
    setAiSuggestions(newSuggestions);
  };

  // Load Review & Creator Info
  useEffect(() => {
    async function loadData() {
      const tokenParam = params.token ? decodeURIComponent(params.token).trim() : "";

      if (!tokenParam) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/review?token=${encodeURIComponent(tokenParam)}`).then((r) => r.json());
        if (res.success && res.review) {
          setReviewData(res.review);
          setRatingOverall(res.review.rating || 5);
          setRatingContentQuality(res.review.ratingContentQuality || res.review.rating || 5);
          setRatingProfessionalism(res.review.ratingProfessionalism || res.review.rating || 5);
          setRatingTimelyDelivery(res.review.ratingTimelyDelivery || res.review.rating || 5);
          setComment(res.review.comment ? res.review.comment.substring(0, 250) : "");

          const creatorInfo = res.creator || { displayName: "Creator", username: "creator", photoDataUrl: null };
          setCreatorData(creatorInfo);

          // Generate 5 contextual AI suggestions based on creator & work
          handleRefreshSuggestions(creatorInfo.displayName, res.review.projectTitle, res.review.clientName);

          if (res.isAlreadySubmitted || ["pending_approval", "approved", "rejected"].includes(res.review.status)) {
            setIsAlreadySubmitted(true);
          }
          setNotFound(false);
        } else {
          // Check local repository as fallback
          if (typeof window !== "undefined") {
            const rawLocal = window.localStorage.getItem("inflixo:reviews");
            if (rawLocal) {
              try {
                const list = JSON.parse(rawLocal);
                const match = list.find((item: any) => item.token === tokenParam);
                if (match) {
                  setReviewData(match);
                  setRatingOverall(match.rating || 5);
                  setRatingContentQuality(match.ratingContentQuality || match.rating || 5);
                  setRatingProfessionalism(match.ratingProfessionalism || match.rating || 5);
                  setRatingTimelyDelivery(match.ratingTimelyDelivery || match.rating || 5);
                  setComment(match.comment ? match.comment.substring(0, 250) : "");
                  setCreatorData({ displayName: "Creator", username: "creator", photoDataUrl: null });
                  handleRefreshSuggestions("Creator", match.projectTitle, match.clientName);
                  if (["pending_approval", "approved", "rejected"].includes(match.status)) {
                    setIsAlreadySubmitted(true);
                  }
                  setNotFound(false);
                  setLoading(false);
                  return;
                }
              } catch (e) { }
            }
          }
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load review page:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.token]);

  // AI Auto-Generate Review
  const handleGenerateAiReview = () => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const suggestions = generateContextualSuggestions(
        creatorData?.displayName,
        reviewData?.projectTitle,
        reviewData?.clientName
      );
      const chosen = suggestions[Math.floor(Math.random() * suggestions.length)];
      setComment(chosen.slice(0, 250));
      setIsGeneratingAi(false);
      showToast("✨ AI generated a personalized review!", "success");
    }, 350);
  };

  // Select AI Suggestion Chip (Enforce 250 character limit)
  const handleSelectSuggestion = (suggestionText: string) => {
    setComment(suggestionText.slice(0, 250));
    showToast("Selected AI review suggestion! ⭐", "info");
  };

  // Handle Form Submit
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAlreadySubmitted) {
      showToast("This review link has already been used.", "error");
      return;
    }

    if (comment.length > 250) {
      showToast("Review comment cannot exceed 250 characters", "error");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          rating: ratingOverall,
          ratingContentQuality,
          ratingProfessionalism,
          ratingTimelyDelivery,
          comment: comment.trim().slice(0, 250),
          clientName: reviewData?.clientName || "",
          clientDesignation: reviewData?.clientDesignation || "",
        }),
      }).then((r) => r.json());

      if (res.success) {
        // Also update local storage fallback if present
        if (typeof window !== "undefined") {
          const rawLocal = window.localStorage.getItem("inflixo:reviews");
          if (rawLocal) {
            try {
              const list = JSON.parse(rawLocal);
              const updatedList = list.map((r: any) =>
                r.token === params.token
                  ? {
                    ...r,
                    rating: ratingOverall,
                    ratingContentQuality,
                    ratingProfessionalism,
                    ratingTimelyDelivery,
                    comment: comment.trim().slice(0, 250),
                    status: "pending_approval",
                  }
                  : r
              );
              window.localStorage.setItem("inflixo:reviews", JSON.stringify(updatedList));
            } catch (e) { }
          }
        }

        setSubmittedNow(true);
        setIsAlreadySubmitted(true);
        showToast("Review submitted successfully! Thank you ⭐", "success");
      } else {
        if (res.isAlreadySubmitted) {
          setIsAlreadySubmitted(true);
        }
        throw new Error(res.error || "Failed to submit review");
      }
    } catch (err: any) {
      console.warn("Backend error submitting review, saving locally:", err);

      if (typeof window !== "undefined") {
        const rawLocal = window.localStorage.getItem("inflixo:reviews");
        if (rawLocal) {
          try {
            const list = JSON.parse(rawLocal);
            const updatedList = list.map((r: any) =>
              r.token === params.token
                ? {
                  ...r,
                  rating: ratingOverall,
                  ratingContentQuality,
                  ratingProfessionalism,
                  ratingTimelyDelivery,
                  comment: comment.trim().slice(0, 250),
                  status: "pending_approval",
                }
                : r
            );
            window.localStorage.setItem("inflixo:reviews", JSON.stringify(updatedList));
          } catch (e) { }
        }
      }

      setSubmittedNow(true);
      setIsAlreadySubmitted(true);
      showToast("Review submitted successfully! Thank you ⭐", "success");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <SyncingLoader message="Loading Creator Review Invitation..." fullScreen hideProgressBar={true} />;
  }

  if (notFound || !reviewData) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-4 bg-[#FAF9F6] text-[#181716] text-center">
        <div className="max-w-sm">
          <EmptyState
            icon={<MessageSquare className="h-6 w-6 text-[#151933]" />}
            title="Review Link Invalid or Expired"
            description="This review request link doesn't exist or is invalid."
            action={
              <Link href="/" className="text-xs font-bold text-[#151933] hover:underline">
                ← Return to Inflixo Home
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  // Star Rating Selector Helper Component
  const StarRatingRow = ({
    label,
    icon: Icon,
    val,
    setVal,
    hoverVal,
    setHoverVal,
    isRequired = true,
  }: {
    label: string;
    icon: any;
    val: number;
    setVal: (n: number) => void;
    hoverVal: number;
    setHoverVal: (n: number) => void;
    isRequired?: boolean;
  }) => (
    <div className="space-y-1 py-2.5 px-3.5 bg-[#fbfbfb] rounded-xl border border-[#E7E3DC]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="h-4 w-4 text-[#151933] shrink-0" />
          <span className="text-xs font-bold text-[#181716] truncate">
            {label} {isRequired && <span className="text-[#C2414B]">*</span>}
          </span>
        </div>

        {/* Star Rating Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverVal(star)}
              onMouseLeave={() => setHoverVal(0)}
              onClick={() => setVal(star)}
              className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
            >
              <Star
                className={`h-5 w-5 transition-colors ${star <= (hoverVal || val)
                  ? "fill-amber-400 text-amber-400"
                  : "text-[#E7E3DC] fill-[#E7E3DC]"
                  }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#FAF9F6] text-[#181716] flex flex-col items-center justify-center p-4 sm:p-6 text-left relative">

      <main className="max-w-lg w-full space-y-5 my-6">

        {/* Top Inflixo Branding Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DC]">
          <Logo size="sm" />
          <span className="inline-flex items-center gap-1 rounded-full bg-[#151933]/[0.09] border border-[#151933]/20 px-3 py-1 text-[10px] font-extrabold text-[#151933] uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3 text-[#17845B]" /> Verified Brand Review
          </span>
        </div>

        {/* Creator Identity Card */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 sm:p-5 flex items-center gap-4 shadow-xs">
          <CreatorAvatar
            src={creatorData?.photoDataUrl || null}
            name={creatorData?.displayName || "Creator"}
            className="w-14 h-14 rounded-full border-2 border-[#151933]/30 object-cover shrink-0"
            textClassName="text-lg font-black text-[#151933]"
            fallbackBgClass="bg-[#151933]/[0.09]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="font-display text-base sm:text-lg font-extrabold text-[#181716] truncate">
                {creatorData?.displayName || "Creator"}
              </h2>
              {creatorData?.isVerified && <ShieldCheck className="h-4 w-4 text-[#17845B] shrink-0" />}
            </div>
            <p className="text-xs font-bold text-[#151933]">
              @{creatorData?.username || "creator"}
            </p>
            {(creatorData?.category || creatorData?.profession) && (
              <p className="text-[11px] font-semibold text-[#797570] truncate mt-0.5">
                {[creatorData?.category, creatorData?.profession].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Read-Only Collaboration Info Card */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-[#fbfbfb] p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-[#E7E3DC] pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-[#151933] shrink-0" />
              <div className="min-w-0 text-xs">
                <span className="text-[10px] font-bold text-[#797570] uppercase tracking-wider block">
                  Reviewing For Brand / Client
                </span>
                <span className="font-extrabold text-[#181716] text-sm truncate block">
                  {reviewData.clientName}
                </span>
              </div>
            </div>
            {reviewData.clientDesignation && (
              <span className="bg-white border border-[#E7E3DC] text-[#181716] text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                {reviewData.clientDesignation}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <Package className="h-4 w-4 text-[#151933] shrink-0" />
              <div className="min-w-0 text-xs">
                <span className="text-[10px] font-bold text-[#797570] uppercase tracking-wider block">
                  Collab Deliverable
                </span>
                <span className="font-extrabold text-[#181716] text-xs truncate block">
                  {reviewData.projectTitle}
                </span>
              </div>
            </div>

            {reviewData.contentUrl && (
              <a
                href={reviewData.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#151933] hover:bg-[#2c1937] text-white font-extrabold text-xs px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Video className="h-3.5 w-3.5" />
                <span>View Work ↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Locked State if Already Submitted */}
        {isAlreadySubmitted && !submittedNow ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6 text-center space-y-4 shadow-sm animate-in zoom-in-95">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mx-auto">
              <Lock className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-extrabold text-[#181716]">
                Review Already Submitted 🔒
              </h3>
              <p className="text-xs text-[#54514D] font-medium max-w-sm mx-auto leading-relaxed">
                This review invitation link has already been used to submit feedback for <strong className="text-[#181716]">&quot;{reviewData.projectTitle}&quot;</strong>. Re-submission is disabled.
              </p>
            </div>

            <div className="pt-3 border-t border-amber-200/80 text-xs">
              <Link
                href={`/${creatorData?.username || "creator"}`}
                className="bg-[#151933] hover:bg-[#2c1937] text-white font-extrabold px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>Visit Creator Profile →</span>
              </Link>
            </div>
          </div>
        ) : submittedNow ? (
          /* Thank You Screen on Submission */
          <div className="rounded-3xl border border-[#17845B]/20 bg-[#EAF7F0] p-6 text-center space-y-4 shadow-sm animate-in zoom-in-95">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#17845B]/20 text-[#17845B] mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-extrabold text-[#181716]">
                Thank You for Your Feedback!
              </h3>
              <p className="text-xs text-[#54514D] font-medium max-w-sm mx-auto leading-relaxed">
                Your review for <strong className="text-[#181716]">&quot;{reviewData.projectTitle}&quot;</strong> has been submitted to {creatorData?.displayName || "the creator"} for approval.
              </p>
            </div>

            <div className="pt-3 border-t border-[#17845B]/20 text-xs">
              <Link
                href={`/${creatorData?.username || "creator"}`}
                className="bg-[#17845B] hover:bg-[#136c4b] text-white font-extrabold px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>Visit Creator Profile Page →</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Submission Form — 4 Rating Criteria + Optional Written Review */
          <div className="rounded-3xl border border-[#E7E3DC] bg-white p-5 sm:p-7 shadow-xs space-y-5">

            <div className="border-b border-[#E7E3DC] pb-2">
              <h3 className="font-extrabold text-[#181716] text-base">
                Rate your collaboration with {creatorData?.displayName || "Creator"}
              </h3>
              <p className="text-xs font-medium text-[#797570]">
                Takes less than 60 seconds
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3.5">

              {/* 4 Focused Rating Criteria */}
              <StarRatingRow
                label="Overall Experience"
                icon={Star}
                val={ratingOverall}
                setVal={setRatingOverall}
                hoverVal={hoverOverall}
                setHoverVal={setHoverOverall}
              />

              <StarRatingRow
                label="Content Quality"
                icon={Film}
                val={ratingContentQuality}
                setVal={setRatingContentQuality}
                hoverVal={hoverContentQuality}
                setHoverVal={setHoverContentQuality}
              />

              <StarRatingRow
                label="Professionalism"
                icon={Handshake}
                val={ratingProfessionalism}
                setVal={setRatingProfessionalism}
                hoverVal={hoverProfessionalism}
                setHoverVal={setHoverProfessionalism}
              />

              <StarRatingRow
                label="Timely Delivery"
                icon={Clock}
                val={ratingTimelyDelivery}
                setVal={setRatingTimelyDelivery}
                hoverVal={hoverTimelyDelivery}
                setHoverVal={setHoverTimelyDelivery}
              />

              {/* Optional Written Review Comment with Max 250 Chars & Character Counter */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#181716] flex items-center gap-1">
                    <span>Share your experience (optional)</span>
                  </label>

                  {/* AI Auto-Generate Button */}
                  <button
                    type="button"
                    onClick={handleGenerateAiReview}
                    disabled={isGeneratingAi}
                    className="inline-flex items-center gap-1 bg-[#151933]/[0.09] hover:bg-[#151933]/15 text-[#151933] text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-[#151933]/20 transition-all cursor-pointer shadow-2xs"
                  >
                    <Wand2 className={`h-3 w-3 ${isGeneratingAi ? "animate-spin" : ""}`} />
                    <span>{isGeneratingAi ? "Generating..." : "✨ Auto-Write with AI"}</span>
                  </button>
                </div>

                <textarea
                  rows={3}
                  maxLength={250}
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 250))}
                  placeholder="Write a few words about working with this creator..."
                  className="w-full rounded-xl border border-[#E7E3DC] bg-[#fbfbfb] px-3.5 py-2.5 text-xs font-medium text-[#181716] placeholder-[#797570] focus:border-[#151933] focus:bg-white focus:outline-none"
                />

                {/* Character Counter Display */}
                <div className="flex items-center justify-between text-[10.5px] px-1">
                  <div className="flex items-center gap-1 text-[#797570] font-bold">
                    <Sparkles className="h-3 w-3 text-[#151933]" />
                    <span>AI Review Suggestions:</span>
                  </div>
                  <span className={`font-extrabold ${comment.length >= 240 ? "text-amber-600" : "text-[#797570]"}`}>
                    {comment.length} / 250 max
                  </span>
                </div>

                {/* Dynamic Contextual AI Suggestion Chips (5 Unique Per Creator & Work) */}
                <div className="pt-0.5 space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {aiSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="bg-[#fbfbfb] hover:bg-[#151933]/[0.09] hover:border-[#151933]/40 text-[#54514D] hover:text-[#151933] text-[10.5px] font-semibold px-2.5 py-1 rounded-xl border border-[#E7E3DC] transition-all text-left cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  {/* Refresh AI Suggestions Button */}
                  <div className="pt-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRefreshSuggestions()}
                      className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#151933] hover:underline cursor-pointer"
                    >
                      <RotateCw className="h-3 w-3" />
                      <span>Refresh 5 AI Ideas</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#151933] hover:bg-[#2c1937] text-white font-extrabold text-sm py-3.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? "Submitting Review..." : "Submit Brand Review →"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
