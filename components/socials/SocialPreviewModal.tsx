"use client";

import { useEffect } from "react";
import { X, CheckCircle2, BadgeCheck, Users, Grid, Heart, Sparkles, Check, Loader2 } from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { formatCount } from "@/utils/format";
import { FetchedInstagramUser } from "./InstagramFetcher";
import { FetchedYoutubeChannel } from "./YoutubeFetcher";
import { FetchedFacebookPage } from "./FacebookFetcher";

export type SocialPreviewData =
  | { platform: "instagram"; data: FetchedInstagramUser }
  | { platform: "youtube"; data: FetchedYoutubeChannel }
  | { platform: "facebook"; data: FetchedFacebookPage };

interface SocialPreviewCardProps {
  preview: SocialPreviewData;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  variant?: "inline" | "modal";
}

export function SocialPreviewCard({
  preview,
  onConfirm,
  onClose,
  loading = false,
  variant = "inline",
}: SocialPreviewCardProps) {
  const { platform } = preview;

  let brandIcon = <InstagramIcon className="h-5 w-5 text-pink-600" />;
  let displayName = "";
  let handle = "";
  let stats: { label: string; value: string | number }[] = [];

  if (platform === "instagram") {
    const data = preview.data as FetchedInstagramUser;
    brandIcon = <InstagramIcon className="h-5 w-5 text-pink-600" />;
    displayName = data.full_name || data.username;
    handle = `@${data.username}`;
    stats = [
      { label: "Followers", value: formatCount(data.follower_count) },
      { label: "Posts", value: formatCount(data.media_count) },
      { label: "Following", value: formatCount(data.following_count) },
    ];
  } else if (platform === "youtube") {
    const data = preview.data as FetchedYoutubeChannel;
    brandIcon = <YoutubeIcon className="h-5 w-5 text-red-600" />;
    displayName = data.title || data.channel_name;
    handle = `@${data.channel_name}`;
    stats = [
      { label: "Subscribers", value: formatCount(data.subscribers) || data.subscriber_count_text?.split(" ")[0] || "0" },
      { label: "Status", value: data.verified ? "Official" : "Active" },
      { label: "Platform", value: "YouTube" },
    ];
  } else if (platform === "facebook") {
    const data = preview.data as FetchedFacebookPage;
    brandIcon = <FacebookIcon className="h-5 w-5 text-blue-600" />;
    displayName = data.name || data.username;
    handle = `@${data.username}`;
    stats = [
      { label: "Followers", value: formatCount(data.followers) },
      { label: "Likes", value: formatCount(data.likes) },
      { label: "Platform", value: "Facebook" },
    ];
  }

  const containerClasses =
    variant === "inline"
      ? "mt-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm animate-in fade-in-50 slide-in-from-top-2 text-left"
      : "relative z-10 w-full max-w-sm sm:max-w-md bg-white border border-gray-200 rounded-xl p-5 shadow-xl text-left my-auto";

  return (
    <div className={containerClasses}>
      {/* Header Row: Left Platform Logo, Right Full Name + @username */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
            {brandIcon}
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-gray-900 leading-snug">
              {displayName}
            </h4>
            <p className="text-xs font-medium text-gray-500">
              {handle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Metrics Grid: 3-column grid */}
      <div className="grid grid-cols-3 gap-3 py-4 text-center">
        {stats.map((st, i) => (
          <div key={i} className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50/70 border border-gray-100">
            <p className="text-lg font-bold text-gray-900 leading-tight">
              {st.value}
            </p>
            <p className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase mt-0.5">
              {st.label}
            </p>
          </div>
        ))}
      </div>

      {/* Action Buttons: Cancel (Outline) & Confirm & Link (Solid Primary) */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer text-center"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6B3252] py-2.5 text-xs font-medium text-white transition-colors disabled:opacity-50 cursor-pointer text-center shadow-none"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span>Confirm &amp; Link</span>
        </button>
      </div>
    </div>
  );
}

interface SocialPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  preview: SocialPreviewData | null;
}

export function SocialPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  preview,
}: SocialPreviewModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click listener */}
      <div className="fixed inset-0" onClick={onClose} />

      <SocialPreviewCard
        preview={preview}
        onConfirm={onConfirm}
        onClose={onClose}
        loading={loading}
        variant="modal"
      />
    </div>
  );
}
