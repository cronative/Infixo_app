"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Link2, AtSign } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { ConnectedAccountCard } from "@/components/socials/ConnectedAccountCard";
import { useCreator } from "@/contexts/CreatorContext";
import { OnboardingService } from "@/services/OnboardingService";
import { SocialService } from "@/services/SocialService";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { InstagramFetcher } from "@/components/socials/InstagramFetcher";
import { YoutubeFetcher } from "@/components/socials/YoutubeFetcher";
import { FacebookFetcher } from "@/components/socials/FacebookFetcher";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SocialDataConsentCard } from "@/components/socials/SocialDataConsentCard";
import { authRepository } from "@/repositories/localRepository";
import { useToast } from "@/contexts/ToastContext";

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

export default function SocialsStepPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { socials, updateSocials } = useCreator();
  const [submitting, setSubmitting] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [consentError, setConsentError] = useState(false);
  const [disconnectModal, setDisconnectModal] = useState<ConfirmDisconnectModal>(null);

  const [instaInput, setInstaInput] = useState(() => extractUsername(socials.instagram.url));
  const [ytInput, setYtInput] = useState(() => extractUsername(socials.youtube.url));
  const [fbInput, setFbInput] = useState(() => extractUsername(socials.facebook.url));

  const instaConnectedHandle = extractUsername(socials.instagram.url) || socials.instagram.username || "";
  const ytConnectedHandle = extractUsername(socials.youtube.url) || socials.youtube.username || "";
  const fbConnectedHandle = extractUsername(socials.facebook.url) || socials.facebook.username || "";

  const isInstaConnected = Boolean(socials.instagram.url || socials.instagram.followers > 0 || instaConnectedHandle);
  const isYtConnected = Boolean(socials.youtube.url || socials.youtube.subscribers > 0 || ytConnectedHandle);
  const isFbConnected = Boolean(socials.facebook.url || socials.facebook.followers > 0 || fbConnectedHandle);

  function requireConsentBeforeAction(): boolean {
    if (!consentAccepted) {
      setConsentError(true);
      showToast("Please check the authorization box first to grant permission 💡", "error");
      return false;
    }
    setConsentError(false);
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
      setInstaInput("");
      setYtInput("");
      setFbInput("");
      showToast("Authorization unchecked — social accounts removed 🔒", "info");
    } else {
      setConsentError(false);
    }
  }

  async function handleNext() {
    if (!consentAccepted) {
      setConsentError(true);
      showToast("Please check the authorization box to proceed 💡", "error");
      return;
    }
    setConsentError(false);
    setSubmitting(true);
    try {
      SocialService.saveAccounts(socials);
      showToast("Social handles linked! Let's choose your plan ✨");
    } catch (e) {
      console.warn("Failed to persist socials on Next click:", e);
    }
    OnboardingService.setStep("subscription");
    setTimeout(() => {
      setSubmitting(false);
      router.push("/onboarding/subscription");
    }, 120);
  }

  function promptDisconnect(platform: "instagram" | "youtube" | "facebook") {
    const nameMap = { instagram: "Instagram", youtube: "YouTube", facebook: "Facebook" };
    const handleMap = { instagram: instaConnectedHandle, youtube: ytConnectedHandle, facebook: fbConnectedHandle };
    setDisconnectModal({
      platform,
      title: `Remove Connected ${nameMap[platform]} Account?`,
      description: `Are you sure you want to disconnect @${handleMap[platform] || "account"}?`,
    });
  }

  async function executeDisconnect() {
    if (!disconnectModal) return;
    const { platform } = disconnectModal;
    const email = authRepository.getPendingEmail();

    try {
      if (platform === "instagram") {
        updateSocials({ instagram: { url: "", followers: 0, posts: 0, username: "", name: "", avatarUrl: "", biography: "", lastSyncedAt: "" } });
        setInstaInput("");
      } else if (platform === "youtube") {
        updateSocials({ youtube: { url: "", subscribers: 0, videos: 0, totalViews: 0, username: "", channelTitle: "", avatarUrl: "", description: "", lastSyncedAt: "" } });
        setYtInput("");
      } else if (platform === "facebook") {
        updateSocials({ facebook: { url: "", followers: 0, posts: 0, username: "", name: "", avatarUrl: "", intro: "", lastSyncedAt: "" } });
        setFbInput("");
      }

      if (email) {
        await fetch(`/api/creator/socials?email=${encodeURIComponent(email)}&platform=${platform}`, {
          method: "DELETE",
        });
      }
      showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connection removed! 🗑️`);
      setDisconnectModal(null);
    } catch (err: any) {
      console.error("Disconnect error:", err);
      showToast("Could not remove connection", "error");
    }
  }

  return (
    <OnboardingLayout step="socials">
      <div className="w-full max-w-[540px] mx-auto pt-4 sm:pt-8 pb-12">
        {/* SINGLE UNIFIED WHITE CARD (Matching Step 1 & Step 2 design) */}
        <div className="rounded-[28px] border border-[#E7E3DC] bg-white p-6 sm:p-9 space-y-6 text-left shadow-[0_4px_24px_rgba(0,0,0,0.035)]">

          {/* 1. Header Section */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold uppercase tracking-widest text-[#151933]">
              STEP 3 OF 4 · YOUR SOCIALS
            </span>
            <h1 className="font-display text-2xl sm:text-[32px] font-extrabold text-[#181716] tracking-tight leading-tight">
              Add your social handles
            </h1>
            <p className="text-xs sm:text-[13px] font-normal text-[#54514D] leading-relaxed pt-0.5">
              Enter your handles to link your social accounts and showcase your fanbase and content.
            </p>
          </div>

          {/* 2. Public Data Scraping Permission Card */}
          <div className="pt-0.5">
            <SocialDataConsentCard
              variant="one-line"
              accepted={consentAccepted}
              onToggle={handleConsentToggle}
              error={consentError}
              disabled={isInstaConnected || isYtConnected || isFbConnected}
            />
          </div>

          {/* 3. Social Platforms List */}
          <div className="space-y-4">

            {/* Instagram Card */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-2xs">
                  <InstagramIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#181716] block">
                    Instagram
                  </span>
                  <span className="text-[11px] text-[#64748b]">
                    Fetch followers &amp; profile details
                  </span>
                </div>
              </div>

              {isInstaConnected ? (
                <div className="bg-white rounded-xl p-3 border border-[#e2e8f0]">
                  <ConnectedAccountCard
                    platform="instagram"
                    icon={<InstagramIcon className="h-4 w-4 text-white" />}
                    accentClass="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                    name="Instagram Profile"
                    handle={instaConnectedHandle}
                    displayName={socials.instagram.name}
                    isVerified={socials.instagram.isVerified}
                    count={socials.instagram.followers}
                    countLabel="Followers"
                    lastSyncedAt={socials.instagram.lastSyncedAt || socials.updatedAt}
                    onDisconnect={() => promptDisconnect("instagram")}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex h-11 sm:h-12 items-center rounded-xl border border-[#cbd5e1] bg-white px-3.5 transition-all focus-within:border-[#151933] focus-within:ring-2 focus-within:ring-[#151933]/10">
                    <span className="text-xs sm:text-sm font-medium text-[#64748b] select-none shrink-0">
                      instagram.com/
                    </span>
                    <input
                      type="text"
                      value={instaInput}
                      onChange={(e) => setInstaInput(e.target.value.trim().replace(/^@/, ""))}
                      placeholder="username"
                      className="h-full w-full bg-transparent px-1 text-xs sm:text-sm font-semibold text-[#181716] outline-none placeholder:text-[#94a3b8]"
                    />
                  </div>
                  <InstagramFetcher username={instaInput} onBeforeFetch={requireConsentBeforeAction} variant="inline" />
                </div>
              )}
            </div>

            {/* YouTube Card */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 shadow-2xs">
                  <YoutubeIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#181716] block">
                    YouTube Channel
                  </span>
                  <span className="text-[11px] text-[#64748b]">
                    Fetch subscribers &amp; channel info
                  </span>
                </div>
              </div>

              {isYtConnected ? (
                <div className="bg-white rounded-xl p-3 border border-[#e2e8f0]">
                  <ConnectedAccountCard
                    platform="youtube"
                    icon={<YoutubeIcon className="h-4 w-4 text-white" />}
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
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex h-11 sm:h-12 items-center rounded-xl border border-[#cbd5e1] bg-white px-3.5 transition-all focus-within:border-[#151933] focus-within:ring-2 focus-within:ring-[#151933]/10">
                    <span className="text-xs sm:text-sm font-medium text-[#64748b] select-none shrink-0">
                      youtube.com/@
                    </span>
                    <input
                      type="text"
                      value={ytInput}
                      onChange={(e) => setYtInput(e.target.value.trim().replace(/^@/, ""))}
                      placeholder="channelhandle"
                      className="h-full w-full bg-transparent px-1 text-xs sm:text-sm font-semibold text-[#181716] outline-none placeholder:text-[#94a3b8]"
                    />
                  </div>
                  <YoutubeFetcher handle={ytInput} onBeforeFetch={requireConsentBeforeAction} variant="inline" />
                </div>
              )}
            </div>

            {/* Facebook Card */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-2xs">
                  <FacebookIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#181716] block">
                    Facebook Page
                  </span>
                  <span className="text-[11px] text-[#64748b]">
                    Fetch page followers &amp; details
                  </span>
                </div>
              </div>

              {isFbConnected ? (
                <div className="bg-white rounded-xl p-3 border border-[#e2e8f0]">
                  <ConnectedAccountCard
                    platform="facebook"
                    icon={<FacebookIcon className="h-4 w-4 text-white" />}
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
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex h-11 sm:h-12 items-center rounded-xl border border-[#cbd5e1] bg-white px-3.5 transition-all focus-within:border-[#151933] focus-within:ring-2 focus-within:ring-[#151933]/10">
                    <span className="text-xs sm:text-sm font-medium text-[#64748b] select-none shrink-0">
                      facebook.com/
                    </span>
                    <input
                      type="text"
                      value={fbInput}
                      onChange={(e) => setFbInput(e.target.value.trim().replace(/^@/, ""))}
                      placeholder="pagename"
                      className="h-full w-full bg-transparent px-1 text-xs sm:text-sm font-semibold text-[#181716] outline-none placeholder:text-[#94a3b8]"
                    />
                  </div>
                  <FacebookFetcher username={fbInput} onBeforeFetch={requireConsentBeforeAction} variant="inline" />
                </div>
              )}
            </div>

          </div>

          {/* 4. Additional Platforms Note Box */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc]/70 p-3.5 text-left flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-[#151933]">
              <Link2 className="h-3.5 w-3.5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-[#181716]">Want to add more platforms?</h4>
              <p className="text-[11px] sm:text-xs text-[#64748b] leading-relaxed">
                You can add TikTok, X (Twitter), Spotify, Twitch, and custom links anytime from{" "}
                <span className="text-[#151933] font-semibold">Dashboard → Links &amp; Socials</span>.
              </p>
            </div>
          </div>

          {/* 5. Navigation Buttons (Back + Next) */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/onboarding/profile")}
              className="rounded-xl border border-[#cbd5e1] bg-white text-[#181716] font-semibold text-xs sm:text-sm h-12 px-5 hover:bg-[#f8fafc] transition-all cursor-pointer shrink-0"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#151933] hover:bg-[#2c1b36] text-white font-semibold text-xs sm:text-sm h-12 transition-all cursor-pointer shadow-xs disabled:opacity-60 active:scale-98"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Socials...</span>
                </>
              ) : (
                <>
                  <span>Save &amp; Next</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(disconnectModal)}
        onClose={() => setDisconnectModal(null)}
        onConfirm={executeDisconnect}
        title={disconnectModal?.title || "Remove Connection"}
        description={disconnectModal?.description || ""}
        confirmText="Yes, Remove Connection"
        cancelText="Cancel"
      />
    </OnboardingLayout>
  );
}
