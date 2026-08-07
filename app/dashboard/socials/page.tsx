"use client";

import { useState } from "react";
import { AtSign, Check, Trash2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { PlatformCard } from "@/components/socials/PlatformCard";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { InstagramFetcher, FetchedInstagramUser } from "@/components/socials/InstagramFetcher";
import { YoutubeFetcher, FetchedYoutubeChannel } from "@/components/socials/YoutubeFetcher";
import { FacebookFetcher, FetchedFacebookPage } from "@/components/socials/FacebookFetcher";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SocialService } from "@/services/SocialService";
import { authRepository } from "@/repositories/localRepository";
import { formatCount } from "@/utils/format";

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

type ConfirmActionType = {
  type: "connect" | "disconnect";
  platform: "instagram" | "youtube" | "facebook";
  title: string;
  description: string;
  confirmText: string;
  data?: any;
};

export default function DashboardSocialsPage() {
  const { socials, updateSocials } = useCreator();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmActionType | null>(null);

  // Local draft handles for un-connected typing
  const [draftInsta, setDraftInsta] = useState("");
  const [draftYt, setDraftYt] = useState("");
  const [draftFb, setDraftFb] = useState("");

  const instaConnectedHandle = extractUsername(socials.instagram.url);
  const ytConnectedHandle = extractUsername(socials.youtube.url);
  const fbConnectedHandle = extractUsername(socials.facebook.url);

  const isInstaConnected = Boolean(socials.instagram.url && (instaConnectedHandle || socials.instagram.followers > 0));
  const isYtConnected = Boolean(socials.youtube.url && (ytConnectedHandle || socials.youtube.subscribers > 0));
  const isFbConnected = Boolean(socials.facebook.url && (fbConnectedHandle || socials.facebook.followers > 0));

  // Triggered when clicking "Confirm & Link" on fetched preview
  function handleInstagramSyncConfirmed(fetched: FetchedInstagramUser) {
    setConfirmModal({
      type: "connect",
      platform: "instagram",
      title: `Connect Instagram @${fetched.username}? ✨`,
      description: `Save & link @${fetched.username} (${formatCount(fetched.follower_count)} Followers) to your live Inflixo profile page?`,
      confirmText: `Yes, Save & Connect`,
      data: fetched,
    });
  }

  function handleYoutubeSyncConfirmed(fetched: FetchedYoutubeChannel) {
    setConfirmModal({
      type: "connect",
      platform: "youtube",
      title: `Connect YouTube @${fetched.channel_name}? ✨`,
      description: `Save & link @${fetched.channel_name} (${formatCount(fetched.subscribers)} Subscribers) to your live Inflixo profile page?`,
      confirmText: `Yes, Save & Connect`,
      data: fetched,
    });
  }

  function handleFacebookSyncConfirmed(fetched: FetchedFacebookPage) {
    setConfirmModal({
      type: "connect",
      platform: "facebook",
      title: `Connect Facebook Page @${fetched.username}? ✨`,
      description: `Save & link @${fetched.username} (${formatCount(fetched.followers)} Followers) to your live Inflixo profile page?`,
      confirmText: `Yes, Save & Connect`,
      data: fetched,
    });
  }

  // Triggered when clicking "Remove Connection" on connected card
  function promptDisconnect(platform: "instagram" | "youtube" | "facebook") {
    const nameMap = { instagram: "Instagram", youtube: "YouTube", facebook: "Facebook" };
    const handleMap = { instagram: instaConnectedHandle, youtube: ytConnectedHandle, facebook: fbConnectedHandle };
    setConfirmModal({
      type: "disconnect",
      platform,
      title: `Remove Connected ${nameMap[platform]} Account?`,
      description: `Are you sure you want to disconnect @${handleMap[platform] || "account"}? You can re-add or connect a new account anytime.`,
      confirmText: `Yes, Remove Connection`,
    });
  }

  async function executeConfirmAction() {
    if (!confirmModal) return;
    setSubmitting(true);
    const { type, platform, data } = confirmModal;
    const email = authRepository.getPendingEmail();

    try {
      if (type === "connect") {
        let updatedSocials = { ...socials };

        if (platform === "instagram" && data) {
          updatedSocials = {
            ...socials,
            instagram: {
              ...socials.instagram,
              url: `https://instagram.com/${data.username}`,
              username: data.username,
              name: data.full_name,
              followers: data.follower_count,
              posts: data.media_count,
              isVerified: Boolean(data.is_verified),
            },
          };
          setDraftInsta("");
        } else if (platform === "youtube" && data) {
          updatedSocials = {
            ...socials,
            youtube: {
              ...socials.youtube,
              url: `https://youtube.com/@${data.channel_name}`,
              username: data.channel_name,
              channelTitle: data.title,
              subscribers: data.subscribers,
              isVerified: Boolean(data.verified),
            },
          };
          setDraftYt("");
        } else if (platform === "facebook" && data) {
          updatedSocials = {
            ...socials,
            facebook: {
              ...socials.facebook,
              url: `https://facebook.com/${data.username}`,
              username: data.username,
              name: data.name,
              followers: data.followers,
              posts: data.likes,
              isVerified: Boolean(data.verified),
            },
          };
          setDraftFb("");
        }

        // Update local React Context & save to MySQL DB
        updateSocials(updatedSocials);
        SocialService.saveAccounts(updatedSocials);
        showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} account connected & saved! ✨🎉`);
      } else if (type === "disconnect") {
        // Clear local state
        if (platform === "instagram") {
          updateSocials({ instagram: { url: "", followers: 0, posts: 0 } });
          setDraftInsta("");
        } else if (platform === "youtube") {
          updateSocials({ youtube: { url: "", subscribers: 0, videos: 0, totalViews: 0 } });
          setDraftYt("");
        } else if (platform === "facebook") {
          updateSocials({ facebook: { url: "", followers: 0, posts: 0 } });
          setDraftFb("");
        }

        // Send DELETE to MySQL DB API
        if (email) {
          await fetch(`/api/creator/socials?email=${encodeURIComponent(email)}&platform=${platform}`, {
            method: "DELETE",
          });
        }
        showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connection removed! 🗑️`);
      }
      setConfirmModal(null);
    } catch (err: any) {
      console.error("Failed to process social account action:", err);
      showToast("Could not update social account. Please try again! 💡", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 sm:px-8 sm:py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black text-inflixo-navy sm:text-3xl">Social Accounts</h1>
        <p className="mt-1 text-sm text-muted">
          Type your username, fetch details to preview, and confirm to connect social accounts to your live profile.
        </p>
      </div>

      <div className="space-y-6">
        {/* INSTAGRAM PLATFORM */}
        {isInstaConnected ? (
          <ConnectedAccountCard
            icon={<InstagramIcon className="h-5 w-5 text-white" />}
            accentClass="bg-gradient-to-br from-pink-500 to-orange-400"
            name="Instagram"
            handle={instaConnectedHandle || socials.instagram.username || "connected"}
            count={socials.instagram.followers}
            countLabel="Followers"
            onDisconnect={() => promptDisconnect("instagram")}
          />
        ) : (
          <PlatformCard icon={<InstagramIcon className="h-5 w-5 text-white" />} accentClass="bg-gradient-to-br from-pink-500 to-orange-400" name="Instagram">
            <Input
              label="Instagram Username"
              placeholder="e.g. username"
              prefix="instagram.com/"
              leftIcon={<AtSign className="h-4 w-4 text-pink-500" />}
              value={draftInsta}
              onChange={(e) => setDraftInsta(e.target.value.trim().replace(/^@/, ""))}
            />
            <InstagramFetcher username={draftInsta} onConfirmSync={handleInstagramSyncConfirmed} />
          </PlatformCard>
        )}

        {/* YOUTUBE PLATFORM */}
        {isYtConnected ? (
          <ConnectedAccountCard
            icon={<YoutubeIcon className="h-5 w-5 text-white" />}
            accentClass="bg-red-500"
            name="YouTube Channel"
            handle={ytConnectedHandle || socials.youtube.username || "connected"}
            count={socials.youtube.subscribers}
            countLabel="Subscribers"
            onDisconnect={() => promptDisconnect("youtube")}
          />
        ) : (
          <PlatformCard icon={<YoutubeIcon className="h-5 w-5 text-white" />} accentClass="bg-red-500" name="YouTube Channel">
            <Input
              label="YouTube Channel Handle"
              placeholder="e.g. channelname"
              prefix="youtube.com/@"
              leftIcon={<AtSign className="h-4 w-4 text-red-500" />}
              value={draftYt}
              onChange={(e) => setDraftYt(e.target.value.trim().replace(/^@/, ""))}
            />
            <YoutubeFetcher handle={draftYt} onConfirmSync={handleYoutubeSyncConfirmed} />
          </PlatformCard>
        )}

        {/* FACEBOOK PLATFORM */}
        {isFbConnected ? (
          <ConnectedAccountCard
            icon={<FacebookIcon className="h-5 w-5 text-white" />}
            accentClass="bg-blue-600"
            name="Facebook Page"
            handle={fbConnectedHandle || socials.facebook.username || "connected"}
            count={socials.facebook.followers}
            countLabel="Page Followers"
            onDisconnect={() => promptDisconnect("facebook")}
          />
        ) : (
          <PlatformCard icon={<FacebookIcon className="h-5 w-5 text-white" />} accentClass="bg-blue-600" name="Facebook Page">
            <Input
              label="Facebook Page Username"
              placeholder="e.g. pagename"
              prefix="facebook.com/"
              leftIcon={<AtSign className="h-4 w-4 text-blue-600" />}
              value={draftFb}
              onChange={(e) => setDraftFb(e.target.value.trim().replace(/^@/, ""))}
            />
            <FacebookFetcher username={draftFb} onConfirmSync={handleFacebookSyncConfirmed} />
          </PlatformCard>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmModal)}
        onClose={() => setConfirmModal(null)}
        onConfirm={executeConfirmAction}
        loading={submitting}
        title={confirmModal?.title || "Confirm Action"}
        description={confirmModal?.description || ""}
        confirmText={confirmModal?.confirmText || "Confirm"}
        cancelText="Cancel"
      />
    </div>
  );
}

function ConnectedAccountCard({
  icon,
  accentClass,
  name,
  handle,
  count,
  countLabel,
  onDisconnect,
}: {
  icon: React.ReactNode;
  accentClass: string;
  name: string;
  handle: string;
  count: number;
  countLabel: string;
  onDisconnect: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-2xs ${accentClass}`}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-extrabold text-slate-900">{name}</h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
                <Check className="h-3 w-3 stroke-[3]" />
                Connected
              </span>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-1">
              @{handle} &middot; <span className="font-extrabold text-purple-700">{formatCount(count)} {countLabel}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDisconnect}
          className="tap-scale inline-flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all self-start sm:self-auto"
        >
          <Trash2 className="h-4 w-4" />
          Remove Connection
        </button>
      </div>
    </div>
  );
}

