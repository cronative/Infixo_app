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
}: SocialPreviewCardProps) {
  const { platform } = preview;

  let brandIcon = <InstagramIcon className="h-5 w-5 text-white" />;
  let brandBg = "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600";
  let username = "";
  let followersCount = "";

  if (platform === "instagram") {
    const data = preview.data as FetchedInstagramUser;
    brandIcon = <InstagramIcon className="h-5 w-5 text-white" />;
    brandBg = "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600";
    username = `@${(data.username || "").replace(/^@/, "")}`;
    followersCount = `${formatCount(data.follower_count)} Followers`;
  } else if (platform === "youtube") {
    const data = preview.data as FetchedYoutubeChannel;
    brandIcon = <YoutubeIcon className="h-5 w-5 text-white" />;
    brandBg = "bg-red-600";
    const channelHandle = (data.channel_name || data.title || "").replace(/^@/, "");
    username = `@${channelHandle}`;
    followersCount = `${formatCount(data.subscribers) || data.subscriber_count_text || "0"} Subscribers`;
  } else if (platform === "facebook") {
    const data = preview.data as FetchedFacebookPage;
    brandIcon = <FacebookIcon className="h-5 w-5 text-white" />;
    brandBg = "bg-blue-600";
    const pageHandle = (data.username || data.name || "").replace(/^@/, "");
    username = `@${pageHandle}`;
    followersCount = `${formatCount(data.followers)} Followers`;
  }

  return (
    <div className="mt-3 bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xs text-left animate-fade-in space-y-3.5">
      {/* Sirf Username / Handle & Followers / Subscribers Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${brandBg} shadow-2xs`}>
            {brandIcon}
          </div>
          <div>
            <p className="text-sm font-bold text-[#181716] leading-tight">
              {username}
            </p>
            <p className="text-xs font-semibold text-[#64748b] mt-0.5">
              {followersCount}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#181716] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Cancel and Confirm & Link Buttons */}
      <div className="flex items-center gap-2.5 pt-2 border-t border-[#e2e8f0]">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl border border-[#cbd5e1] bg-white py-2 text-xs font-semibold text-[#181716] hover:bg-[#f8fafc] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#151933] hover:bg-[#2c1b36] py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Linking...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Confirm &amp; Link</span>
            </>
          )}
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
  if (!preview) return null;

  const { platform } = preview;
  let brandIcon = <InstagramIcon className="h-5 w-5 text-white" />;
  let brandBg = "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600";
  let username = "";
  let followersCount = "";

  if (platform === "instagram") {
    const data = preview.data as FetchedInstagramUser;
    brandIcon = <InstagramIcon className="h-5 w-5 text-white" />;
    brandBg = "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600";
    username = `@${(data.username || "").replace(/^@/, "")}`;
    followersCount = `${formatCount(data.follower_count)} Followers`;
  } else if (platform === "youtube") {
    const data = preview.data as FetchedYoutubeChannel;
    brandIcon = <YoutubeIcon className="h-5 w-5 text-white" />;
    brandBg = "bg-red-600";
    const channelHandle = (data.channel_name || data.title || "").replace(/^@/, "");
    username = `@${channelHandle}`;
    followersCount = `${formatCount(data.subscribers) || data.subscriber_count_text || "0"} Subscribers`;
  } else if (platform === "facebook") {
    const data = preview.data as FetchedFacebookPage;
    brandIcon = <FacebookIcon className="h-5 w-5 text-white" />;
    brandBg = "bg-blue-600";
    const pageHandle = (data.username || data.name || "").replace(/^@/, "");
    username = `@${pageHandle}`;
    followersCount = `${formatCount(data.followers)} Followers`;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Confirm Social Account"
      description="Verify your account before linking"
    >
      <ModalBody className="p-5 text-left">
        <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc]">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${brandBg} shadow-2xs`}>
            {brandIcon}
          </div>
          <div>
            <p className="text-sm sm:text-base font-bold text-[#181716] leading-tight">
              {username}
            </p>
            <p className="text-xs font-semibold text-[#64748b] mt-0.5">
              {followersCount}
            </p>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="px-5 py-3.5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-xl border border-[#cbd5e1] text-xs font-semibold text-[#181716] hover:bg-[#f8fafc] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 bg-[#151933] hover:bg-[#2c1b36] text-white font-semibold text-xs py-2 px-4 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-60 active:scale-98"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Linking...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Confirm &amp; Link</span>
            </>
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
}
