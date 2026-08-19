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

  let title = "Social Profile";
  let accentGradient = "from-purple-600 to-indigo-600";
  let buttonShadow = "shadow-purple-500/25";
  let brandIcon = <InstagramIcon className="h-6 w-6 text-white" />;
  let displayName = "";
  let handle = "";
  let isVerified = false;
  let stats: { label: string; value: string | number; icon?: React.ReactNode }[] = [];

  if (platform === "instagram") {
    const data = preview.data as FetchedInstagramUser;
    title = "Instagram Profile";
    accentGradient = "from-pink-500 via-rose-500 to-orange-400";
    buttonShadow = "shadow-rose-500/30";
    brandIcon = <InstagramIcon className="h-6 w-6 text-white" />;
    displayName = data.full_name || data.username;
    handle = `@${data.username}`;
    isVerified = Boolean(data.is_verified);
    stats = [
      { label: "Followers", value: formatCount(data.follower_count), icon: <Users className="h-3.5 w-3.5 text-pink-500" /> },
      { label: "Posts", value: formatCount(data.media_count), icon: <Grid className="h-3.5 w-3.5 text-pink-500" /> },
      { label: "Following", value: formatCount(data.following_count), icon: <Heart className="h-3.5 w-3.5 text-pink-500" /> },
    ];
  } else if (platform === "youtube") {
    const data = preview.data as FetchedYoutubeChannel;
    title = "YouTube Channel";
    accentGradient = "from-red-600 via-red-500 to-rose-600";
    buttonShadow = "shadow-red-500/30";
    brandIcon = <YoutubeIcon className="h-6 w-6 text-white" />;
    displayName = data.title || data.channel_name;
    handle = `@${data.channel_name}`;
    isVerified = Boolean(data.verified);
    stats = [
      { label: "Subscribers", value: formatCount(data.subscribers) || data.subscriber_count_text?.split(" ")[0] || "0", icon: <Users className="h-3.5 w-3.5 text-red-500" /> },
      { label: "Channel Status", value: isVerified ? "Official" : "Active", icon: <Check className="h-3.5 w-3.5 text-emerald-500" /> },
    ];
  } else if (platform === "facebook") {
    const data = preview.data as FetchedFacebookPage;
    title = "Facebook Page";
    accentGradient = "from-blue-600 via-blue-500 to-indigo-600";
    buttonShadow = "shadow-blue-500/30";
    brandIcon = <FacebookIcon className="h-6 w-6 text-white" />;
    displayName = data.name || data.username;
    handle = `@${data.username}`;
    isVerified = Boolean(data.verified);
    stats = [
      { label: "Followers", value: formatCount(data.followers), icon: <Users className="h-3.5 w-3.5 text-blue-600" /> },
      { label: "Page Likes", value: formatCount(data.likes), icon: <Heart className="h-3.5 w-3.5 text-blue-600" /> },
    ];
  }

  const containerClasses =
    variant === "inline"
      ? "mt-4 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md animate-in fade-in-50 slide-in-from-top-2"
      : "relative z-10 w-full max-w-sm sm:max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl border border-slate-100 transition-all scale-100 my-auto";

  return (
    <div className={containerClasses}>
      {/* Header Bar with Vibrant Brand Gradient */}
      <div className={`relative flex items-center justify-between bg-gradient-to-r ${accentGradient} px-5 py-4 text-white shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-2xs border border-white/20">
            {brandIcon}
          </div>
          <div>
            <h3 className="font-display text-sm sm:text-base font-black text-white leading-tight">{title}</h3>
            <p className="text-[11px] text-white/85 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Ready to connect
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all backdrop-blur-xs"
          title="Dismiss preview"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Profile Content Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Centered Identity: Icon Badge, Display Name & Username Pill */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-2.5">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accentGradient} shadow-md ${buttonShadow} border-2 border-white ring-4 ring-slate-100/90`}>
              {brandIcon}
            </div>
            {isVerified && (
              <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 fill-sky-500 text-white shadow-md" />
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 px-2">
            <h4 className="font-display text-lg font-black text-slate-900 tracking-tight leading-snug">
              {displayName}
            </h4>
            {isVerified && <BadgeCheck className="h-4 w-4 fill-sky-500 text-white shrink-0" />}
          </div>

          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 border border-slate-200/60">
            <span>{handle}</span>
          </div>
        </div>

        {/* Stats Bar */}
        {stats.length > 0 && (
          <div className={`grid gap-2.5 ${stats.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {stats.map((st, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center rounded-xl bg-slate-50/90 p-2.5 border border-slate-100 text-center shadow-2xs"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1">
                  {st.icon}
                  {st.label}
                </p>
                <p className="font-display text-base font-black text-slate-900 mt-0.5 truncate max-w-full">
                  {st.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons (Confirm & Cancel) */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="tap-scale flex-1 rounded-xl border border-slate-200/90 bg-slate-50/80 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`tap-scale flex-[1.5] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r ${accentGradient} py-2.5 text-xs font-black text-white shadow-md ${buttonShadow} hover:shadow-lg transition-all disabled:opacity-50 flex`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
            )}
            Confirm &amp; Link
          </button>
        </div>
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
