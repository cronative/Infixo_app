"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";
import { SocialService } from "@/services/SocialService";
import { authRepository } from "@/repositories/localRepository";
import { SocialPreviewModal, SocialPreviewCard, SocialPreviewData } from "./SocialPreviewModal";

export interface FetchedFacebookPage {
  name: string;
  username: string;
  page_id: string;
  url: string;
  image: string;
  cover_image: string;
  followers: number;
  likes: number;
  verified: boolean;
  categories: string[];
  intro: string;
}

interface FacebookFetcherProps {
  username: string;
  onConfirmSync?: (fetched: FetchedFacebookPage) => void;
  onBeforeFetch?: () => boolean;
  variant?: "inline" | "modal";
}

export function FacebookFetcher({ username, onConfirmSync, onBeforeFetch, variant = "modal" }: FacebookFetcherProps) {
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
      showToast("Please enter a Facebook Page username first", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/facebook/pageInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Could not fetch Facebook Page details");
      }

      setPreviewData({ platform: "facebook", data: data.page });
      if (variant === "modal") {
        setModalOpen(true);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to fetch Facebook Page info", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmModal() {
    if (!previewData || previewData.platform !== "facebook") return;
    const fetchedPage = previewData.data;

    setSaving(true);
    const nowIso = new Date().toISOString();

    try {
      const updatedSocials = {
        ...socials,
        facebook: {
          ...socials.facebook,
          url: `https://facebook.com/${fetchedPage.username}`,
          username: fetchedPage.username,
          name: fetchedPage.name,
          followers: fetchedPage.followers,
          posts: fetchedPage.likes,
          isVerified: Boolean(fetchedPage.verified),
          avatarUrl: fetchedPage.image,
          intro: fetchedPage.intro,
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
            platform: "facebook",
            accountName: fetchedPage.name || fetchedPage.username,
            username: fetchedPage.username,
            followerCount: fetchedPage.followers || 0,
            mediaCount: fetchedPage.likes || 0,
            isVerified: Boolean(fetchedPage.verified),
          }),
        }).catch((e) => console.error("Failed to save Facebook to DB:", e));
      }

      const patch: Partial<typeof profile> = {};
      if (!profile.displayName || profile.displayName === "Your name") {
        patch.displayName = fetchedPage.name || fetchedPage.username;
      }
      if (!profile.bio && fetchedPage.intro) {
        patch.bio = fetchedPage.intro.slice(0, 160);
      }
      if (!profile.photoDataUrl && fetchedPage.image) {
        patch.photoDataUrl = fetchedPage.image;
      }

      if (Object.keys(patch).length > 0) {
        updateProfile(patch);
      }

      showToast(`Facebook Page "${fetchedPage.name}" linked successfully! ✨🎉`);

      if (onConfirmSync) {
        onConfirmSync(fetchedPage);
      }
    } catch (err: any) {
      console.error("Facebook confirm error:", err);
      showToast("Failed to connect Facebook Page. Please try again.", "error");
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
          className="tap-scale flex items-center gap-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching Facebook Page...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Fetch Page Details
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
