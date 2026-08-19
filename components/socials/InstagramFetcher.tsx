"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";
import { SocialService } from "@/services/SocialService";
import { authRepository } from "@/repositories/localRepository";
import { SocialPreviewModal, SocialPreviewCard, SocialPreviewData } from "./SocialPreviewModal";

export interface FetchedInstagramUser {
  username: string;
  full_name: string;
  follower_count: number;
  media_count: number;
  following_count: number;
  biography: string;
  profile_pic_url: string;
  is_verified: boolean;
}

interface InstagramFetcherProps {
  username: string;
  onConfirmSync?: (fetched: FetchedInstagramUser) => void;
  onBeforeFetch?: () => boolean;
  variant?: "inline" | "modal";
}

export function InstagramFetcher({ username, onConfirmSync, onBeforeFetch, variant = "modal" }: InstagramFetcherProps) {
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

    const cleanUsername = username.trim().replace(/^@/, "");
    if (!cleanUsername) {
      showToast("Please enter an Instagram username first", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/instagram/userInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not fetch Instagram details");
      }

      setPreviewData({ platform: "instagram", data: data.user });
      if (variant === "modal") {
        setModalOpen(true);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to fetch Instagram profile", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmModal() {
    if (!previewData || previewData.platform !== "instagram") return;
    const fetchedUser = previewData.data;

    setSaving(true);
    const nowIso = new Date().toISOString();

    try {
      const updatedSocials = {
        ...socials,
        instagram: {
          ...socials.instagram,
          url: `https://instagram.com/${fetchedUser.username}`,
          username: fetchedUser.username,
          name: fetchedUser.full_name,
          followers: fetchedUser.follower_count,
          posts: fetchedUser.media_count,
          isVerified: Boolean(fetchedUser.is_verified),
          avatarUrl: fetchedUser.profile_pic_url,
          biography: fetchedUser.biography,
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
            platform: "instagram",
            accountName: fetchedUser.full_name || fetchedUser.username,
            username: fetchedUser.username,
            followerCount: fetchedUser.follower_count || 0,
            mediaCount: fetchedUser.media_count || 0,
            isVerified: Boolean(fetchedUser.is_verified),
          }),
        }).catch((e) => console.error("Failed to save Instagram to DB:", e));
      }

      const patch: Partial<typeof profile> = {};
      if (!profile.displayName || profile.displayName === "Your name") {
        patch.displayName = fetchedUser.full_name || fetchedUser.username;
      }
      if (!profile.bio && fetchedUser.biography) {
        patch.bio = fetchedUser.biography.slice(0, 160);
      }
      if (!profile.photoDataUrl && fetchedUser.profile_pic_url) {
        patch.photoDataUrl = fetchedUser.profile_pic_url;
      }

      if (Object.keys(patch).length > 0) {
        updateProfile(patch);
      }

      showToast(`Instagram profile @${fetchedUser.username} linked successfully! ✨🎉`);

      if (onConfirmSync) {
        onConfirmSync(fetchedUser);
      }
    } catch (err: any) {
      console.error("Instagram confirm error:", err);
      showToast("Failed to connect Instagram profile. Please try again.", "error");
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
          disabled={loading || !username.trim()}
          className="tap-scale flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 px-4 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching Instagram Profile...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Fetch Profile Details
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
