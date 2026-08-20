"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AtSign, Copy, ExternalLink, LogOut } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PlatformCard } from "@/components/socials/PlatformCard";
import { ConnectedAccountCard } from "@/components/socials/ConnectedAccountCard";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { InstagramFetcher } from "@/components/socials/InstagramFetcher";
import { YoutubeFetcher } from "@/components/socials/YoutubeFetcher";
import { FacebookFetcher } from "@/components/socials/FacebookFetcher";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SocialDataConsentCard } from "@/components/socials/SocialDataConsentCard";
import { authRepository } from "@/repositories/localRepository";
import { AuthService } from "@/services/AuthService";
import { copyToClipboard } from "@/lib/copyToClipboard";

function extractUsername(url: string): string {
  if (!url) return "";
  const cleaned = url.trim();
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    return last.replace(/^@/, "");
  }
  return cleaned.replace(/^@/, "");
}

type ConfirmDisconnectModal = {
  platform: "instagram" | "youtube" | "facebook";
  title: string;
  description: string;
} | null;

export default function DashboardSocialsPage() {
  const router = useRouter();
  const { profile, socials, updateSocials } = useCreator();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [disconnectModal, setDisconnectModal] = useState<ConfirmDisconnectModal>(null);

  // Local draft handles for typing
  const [draftInsta, setDraftInsta] = useState(() => extractUsername(socials.instagram.url));
  const [draftYt, setDraftYt] = useState(() => extractUsername(socials.youtube.url));
  const [draftFb, setDraftFb] = useState(() => extractUsername(socials.facebook.url));

  const instaConnectedHandle = extractUsername(socials.instagram.url) || socials.instagram.username || "";
  const ytConnectedHandle = extractUsername(socials.youtube.url) || socials.youtube.username || "";
  const fbConnectedHandle = extractUsername(socials.facebook.url) || socials.facebook.username || "";

  const isInstaConnected = Boolean(socials.instagram.url || socials.instagram.followers > 0 || instaConnectedHandle);
  const isYtConnected = Boolean(socials.youtube.url || socials.youtube.subscribers > 0 || ytConnectedHandle);
  const isFbConnected = Boolean(socials.facebook.url || socials.facebook.followers > 0 || fbConnectedHandle);

  const handleStr = profile.username || "nikzios30";
  const profileUrl = `inflixo.com/${handleStr}`;

  async function handleCopyLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://inflixo.com";
    const fullLink = `${origin}/${handleStr}`;
    const success = await copyToClipboard(fullLink);
    if (success) {
      showToast("Profile link copied! ✨");
    } else {
      showToast("Could not copy link", "error");
    }
  }

  function requireConsentBeforeAction(): boolean {
    if (!consentAccepted) {
      showToast("Please check the authorization box first to grant permission 💡", "error");
      return false;
    }
    return true;
  }

  function handleConsentToggle(val: boolean) {
    setConsentAccepted(val);
    if (!val) {
      updateSocials({
        instagram: { url: "", followers: 0, posts: 0, username: "", name: "", avatarUrl: "", biography: "", lastSyncedAt: "" },
        youtube: { url: "", subscribers: 0, videos: 0, totalViews: 0, username: "", channelTitle: "", avatarUrl: "", description: "", lastSyncedAt: "" },
        facebook: { url: "", followers: 0, posts: 0, username: "", name: "", avatarUrl: "", intro: "", lastSyncedAt: "" },
      });
      setDraftInsta("");
      setDraftYt("");
      setDraftFb("");
      showToast("Authorization unchecked — social accounts removed 🔒", "info");
    }
  }

  function promptDisconnect(platform: "instagram" | "youtube" | "facebook") {
    const nameMap = { instagram: "Instagram", youtube: "YouTube", facebook: "Facebook" };
    const handleMap = { instagram: instaConnectedHandle, youtube: ytConnectedHandle, facebook: fbConnectedHandle };
    setDisconnectModal({
      platform,
      title: `Remove Connected ${nameMap[platform]} Account?`,
      description: `Are you sure you want to disconnect @${handleMap[platform] || "account"}? This will remove it from your public profile page.`,
    });
  }

  async function executeDisconnect() {
    if (!disconnectModal) return;
    setSubmitting(true);
    const { platform } = disconnectModal;
    const email = authRepository.getPendingEmail();

    try {
      if (platform === "instagram") {
        updateSocials({ instagram: { url: "", followers: 0, posts: 0, username: "", name: "", avatarUrl: "", biography: "", lastSyncedAt: "" } });
        setDraftInsta("");
      } else if (platform === "youtube") {
        updateSocials({ youtube: { url: "", subscribers: 0, videos: 0, totalViews: 0, username: "", channelTitle: "", avatarUrl: "", description: "", lastSyncedAt: "" } });
        setDraftYt("");
      } else if (platform === "facebook") {
        updateSocials({ facebook: { url: "", followers: 0, posts: 0, username: "", name: "", avatarUrl: "", intro: "", lastSyncedAt: "" } });
        setDraftFb("");
      }

      if (email) {
        await fetch(`/api/creator/socials?email=${encodeURIComponent(email)}&platform=${platform}`, {
          method: "DELETE",
        });
      }
      showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connection removed! 🗑️`);
      setDisconnectModal(null);
    } catch (err: any) {
      console.error("Failed to disconnect social account:", err);
      showToast("Could not remove social account. Please try again! 💡", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#F9FAFB] text-slate-900 pb-16">
      <div className="mx-auto max-w-3xl px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        
        {/* Consistent Top Navigation Action Group */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div>
              <h1 className="font-display text-lg font-black text-slate-900 truncate">
                Social Accounts
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage your connected social profiles and live sync metrics.
              </p>
            </div>
          </div>

        </div>

        <div className="space-y-4">
          {/* INSTAGRAM PLATFORM */}
          <PlatformCard icon={<InstagramIcon className="h-5 w-5 text-white" />} accentClass="bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400" name="Instagram">
            {isInstaConnected ? (
              <ConnectedAccountCard
                platform="instagram"
                icon={<InstagramIcon className="h-5 w-5 text-white" />}
                accentClass="bg-gradient-to-br from-pink-500 to-orange-400"
                name="Instagram Profile"
                handle={instaConnectedHandle}
                displayName={socials.instagram.name}
                isVerified={socials.instagram.isVerified}
                count={socials.instagram.followers}
                countLabel="Followers"
                lastSyncedAt={socials.instagram.lastSyncedAt || socials.updatedAt}
                onDisconnect={() => promptDisconnect("instagram")}
              />
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 text-white">
                    <InstagramIcon className="h-4 w-4" />
                  </div>
                  <p className="font-display text-sm font-bold text-slate-900">Instagram</p>
                </div>
                <Input
                  label="Instagram Username"
                  placeholder="e.g. username"
                  prefix="instagram.com/"
                  leftIcon={<AtSign className="h-4 w-4 text-pink-500" />}
                  value={draftInsta}
                  onChange={(e) => setDraftInsta(e.target.value.trim().replace(/^@/, ""))}
                />
                <InstagramFetcher username={draftInsta} onBeforeFetch={requireConsentBeforeAction} />
              </>
            )}
          </PlatformCard>

          {/* YOUTUBE PLATFORM */}
          <PlatformCard icon={<YoutubeIcon className="h-5 w-5 text-white" />} accentClass="bg-red-600" name="YouTube Channel">
            {isYtConnected ? (
              <ConnectedAccountCard
                platform="youtube"
                icon={<YoutubeIcon className="h-5 w-5 text-white" />}
                accentClass="bg-red-600"
                name="YouTube Channel"
                handle={ytConnectedHandle}
                displayName={socials.youtube.channelTitle}
                isVerified={socials.youtube.isVerified}
                count={socials.youtube.subscribers}
                countLabel="Subscribers"
                lastSyncedAt={socials.youtube.lastSyncedAt || socials.updatedAt}
                onDisconnect={() => promptDisconnect("youtube")}
              />
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white">
                    <YoutubeIcon className="h-4 w-4" />
                  </div>
                  <p className="font-display text-sm font-bold text-slate-900">YouTube Channel</p>
                </div>
                <Input
                  label="YouTube Channel Handle"
                  placeholder="e.g. channelname"
                  prefix="youtube.com/@"
                  leftIcon={<AtSign className="h-4 w-4 text-red-500" />}
                  value={draftYt}
                  onChange={(e) => setDraftYt(e.target.value.trim().replace(/^@/, ""))}
                />
                <YoutubeFetcher handle={draftYt} onBeforeFetch={requireConsentBeforeAction} />
              </>
            )}
          </PlatformCard>

          {/* FACEBOOK PLATFORM */}
          <PlatformCard icon={<FacebookIcon className="h-5 w-5 text-white" />} accentClass="bg-blue-600" name="Facebook Page">
            {isFbConnected ? (
              <ConnectedAccountCard
                platform="facebook"
                icon={<FacebookIcon className="h-5 w-5 text-white" />}
                accentClass="bg-blue-600"
                name="Facebook Page"
                handle={fbConnectedHandle}
                displayName={socials.facebook.name}
                isVerified={socials.facebook.isVerified}
                count={socials.facebook.followers}
                countLabel="Page Followers"
                lastSyncedAt={socials.facebook.lastSyncedAt || socials.updatedAt}
                onDisconnect={() => promptDisconnect("facebook")}
              />
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <FacebookIcon className="h-4 w-4" />
                  </div>
                  <p className="font-display text-sm font-bold text-slate-900">Facebook Page</p>
                </div>
                <Input
                  label="Facebook Page Username"
                  placeholder="e.g. pagename"
                  prefix="facebook.com/"
                  leftIcon={<AtSign className="h-4 w-4 text-blue-600" />}
                  value={draftFb}
                  onChange={(e) => setDraftFb(e.target.value.trim().replace(/^@/, ""))}
                />
                <FacebookFetcher username={draftFb} onBeforeFetch={requireConsentBeforeAction} />
              </>
            )}
          </PlatformCard>

          {/* Authorization Consent Card */}
          <SocialDataConsentCard
            accepted={consentAccepted || isInstaConnected || isYtConnected || isFbConnected}
            onToggle={handleConsentToggle}
            disabled={isInstaConnected || isYtConnected || isFbConnected}
          />
        </div>

        {/* Disconnect Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(disconnectModal)}
          onClose={() => setDisconnectModal(null)}
          onConfirm={executeDisconnect}
          loading={submitting}
          title={disconnectModal?.title || "Remove Connection"}
          description={disconnectModal?.description || ""}
          confirmText="Yes, Remove Connection"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}

