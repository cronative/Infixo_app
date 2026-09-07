"use client";

import { CheckCircle2, Loader2, X } from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { formatCount } from "@/utils/format";
import { FetchedInstagramUser } from "./InstagramFetcher";
import { FetchedYoutubeChannel } from "./YoutubeFetcher";
import { FetchedFacebookPage } from "./FacebookFetcher";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

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

  if (variant === "inline") {
    return (
      <div className="mt-4 bg-white border border-[#E4DAD5] rounded-2xl p-5 shadow-xs text-left">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E4DAD5]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fbfbfb] border border-[#E4DAD5] shrink-0">
              {brandIcon}
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-[#181716] leading-snug">
                {displayName}
              </h4>
              <p className="text-xs font-medium text-[#797570]">
                {handle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#797570] hover:text-[#181716] hover:bg-[#fbfbfb] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 py-3.5 text-center">
          {stats.map((st, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#fbfbfb] border border-[#E4DAD5]">
              <p className="text-sm font-bold text-[#181716] leading-tight">
                {st.value}
              </p>
              <p className="text-[10px] font-semibold text-[#797570] uppercase mt-0.5">
                {st.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-[#E4DAD5] bg-white py-2 text-xs font-semibold text-[#797570] hover:bg-[#fbfbfb] hover:text-[#181716] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#600a0f] hover:bg-[#600a0f] py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            <span>Confirm &amp; Link</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
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
  if (!preview) return null;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={displayName}
      description={handle}
      icon={brandIcon}
    >
      <ModalBody className="p-5 space-y-4 text-left">
        <p className="text-xs text-[#797570] font-medium">
          Confirm that this is your account to link it to your Inflixo profile.
        </p>

        <div className="grid grid-cols-3 gap-2.5 text-center">
          {stats.map((st, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#fbfbfb] border border-[#E4DAD5]">
              <p className="text-sm font-bold text-[#181716] leading-tight">
                {st.value}
              </p>
              <p className="text-[10px] font-semibold text-[#797570] uppercase mt-0.5">
                {st.label}
              </p>
            </div>
          ))}
        </div>
      </ModalBody>

      <ModalFooter className="px-5 py-3.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-[#E4DAD5] text-xs font-semibold text-[#797570] hover:bg-[#fbfbfb] hover:text-[#181716] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="bg-[#600a0f] hover:bg-[#600a0f] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          <span>Confirm &amp; Link</span>
        </button>
      </ModalFooter>
    </Modal>
  );
}
