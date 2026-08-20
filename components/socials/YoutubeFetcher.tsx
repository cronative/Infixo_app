"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";
import { SocialService } from "@/services/SocialService";
import { authRepository } from "@/repositories/localRepository";
import { SocialPreviewModal, SocialPreviewCard, SocialPreviewData } from "./SocialPreviewModal";

export interface FetchedYoutubeChannel {
  channel_id: string;
  channel_name: string;
  title: string;
  description: string;
  subscriber_count_text: string;
  subscribers: number;
  avatar_url: string;
  verified: boolean;
}

interface YoutubeFetcherProps {
  handle: string;
  onConfirmSync?: (fetched: FetchedYoutubeChannel) => void;
  onBeforeFetch?: () => boolean;
  variant?: "inline" | "modal";
}

export function YoutubeFetcher({ handle, onConfirmSync, onBeforeFetch, variant = "modal" }: YoutubeFetcherProps) {
  const { showToast } = useToast();
  const { updateProfile, updateSocials, socials, profile } = useCreator();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<SocialPreviewData | null>(null);

  async function fetchDetails() {
    if (onBeforeFetch && !onBeforeFetch()) {
      return;
    }

    const cleanHandle = handle.trim().replace(/^@/, "");
    if (!cleanHandle) {
      showToast("Please enter a YouTube handle first", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/youtube/channelInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelName: cleanHandle }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not fetch YouTube channel details");
      }

      setPreviewData({ platform: "youtube", data: data.channel });
      if (variant === "modal") {
        setModalOpen(true);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to fetch YouTube channel info", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmModal() {
    if (!previewData || previewData.platform !== "youtube") return;
    const fetchedChannel = previewData.data;

    setSaving(true);
    const nowIso = new Date().toISOString();

    try {
      const updatedSocials = {
        ...socials,
        youtube: {
          ...socials.youtube,
          url: `https://youtube.com/@${fetchedChannel.channel_name}`,
          username: fetchedChannel.channel_name,
          channelTitle: fetchedChannel.title,
          subscribers: fetchedChannel.subscribers,
          isVerified: Boolean(fetchedChannel.verified),
          avatarUrl: fetchedChannel.avatar_url,
          description: fetchedChannel.description,
          lastSyncedAt: nowIso,
        },
      };

      updateSocials(updatedSocials);
      SocialService.saveAccounts(updatedSocials);

      const email = authRepository.getPendingEmail();
      if (email) {
        await fetch("/api/creator/socials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            platform: "youtube",
            accountName: fetchedChannel.title || fetchedChannel.channel_name,
            username: fetchedChannel.channel_name,
            followerCount: fetchedChannel.subscribers || 0,
            mediaCount: 0,
            isVerified: Boolean(fetchedChannel.verified),
          }),
        }).catch((e) => console.error("Failed to save YouTube to DB:", e));
      }

      const patch: Partial<typeof profile> = {};
      if (!profile.displayName || profile.displayName === "Your name") {
        patch.displayName = fetchedChannel.title || fetchedChannel.channel_name;
      }
      if (!profile.bio && fetchedChannel.description) {
        patch.bio = fetchedChannel.description.slice(0, 160);
      }
      if (!profile.photoDataUrl && fetchedChannel.avatar_url) {
        patch.photoDataUrl = fetchedChannel.avatar_url;
      }

      if (Object.keys(patch).length > 0) {
        updateProfile(patch);
      }

      showToast(`YouTube channel @${fetchedChannel.channel_name} linked successfully! ✨🎉`);

      if (onConfirmSync) {
        onConfirmSync(fetchedChannel);
      }
    } catch (err: any) {
      console.error("YouTube confirm error:", err);
      showToast("Failed to connect YouTube channel. Please try again.", "error");
    } finally {
      setSaving(false);
      setModalOpen(false);
      setPreviewData(null);
    }
  }

  return (
    <div className="mt-3">
      {/* Fetch Action Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={fetchDetails}
          disabled={loading || !handle.trim()}
          className="tap-scale flex items-center gap-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching YouTube Channel...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Fetch Channel Details
            </>
          )}
        </button>
      </div>

      {/* Inline Preview below fields */}
      {variant === "inline" && previewData && (
        <SocialPreviewCard
          preview={previewData}
          onConfirm={handleConfirmModal}
          onClose={() => setPreviewData(null)}
          loading={saving}
          variant="inline"
        />
      )}

      {/* Popup Modal (for Dashboard) */}
      {variant === "modal" && (
        <SocialPreviewModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirmModal}
          loading={saving}
          preview={previewData}
        />
      )}
    </div>
  );
}
