"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, AtSign, Eye, Link2 } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { PlatformCard } from "@/components/socials/PlatformCard";
import { ConnectedAccountCard } from "@/components/socials/ConnectedAccountCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
  const { profile, socials, totalAudience, updateSocials, theme } = useCreator();
  const [submitting, setSubmitting] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [consentError, setConsentError] = useState(false);
  const [disconnectModal, setDisconnectModal] = useState<ConfirmDisconnectModal>(null);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

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
      showToast("Social handles linked! Now let's pick your theme 👑");
    } catch (e) {
      console.warn("Failed to persist socials on Next click:", e);
    }
    OnboardingService.setStep("theme");
    setTimeout(() => {
      setSubmitting(false);
      router.push("/onboarding/themes");
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
    <OnboardingLayout
      step="socials"
      isMobilePreviewOpen={isMobilePreviewOpen}
      setIsMobilePreviewOpen={setIsMobilePreviewOpen}
      preview={
        <LivePreviewCard
          profile={profile}
          socials={socials}
          totalAudience={totalAudience}
          themeKey={theme}
          isOnboarding={true}
          isInformational={true}
        />
      }
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#b85c6b]/20 bg-[#b85c6b]/[0.09] px-3 py-1 text-xs font-bold text-[#b85c6b]">
          <Sparkles className="h-3.5 w-3.5 text-[#b85c6b] shrink-0" />
          <span>Step 2 of 6 • Social Handles</span>
        </div>

        {/* Mobile / Tablet Dedicated Preview Trigger */}
        <button
          type="button"
          onClick={() => setIsMobilePreviewOpen(true)}
          className="lg:hidden tap-scale inline-flex items-center gap-1.5 rounded-full border border-[#b85c6b]/30 bg-[#b85c6b]/[0.09] hover:bg-[#b85c6b]/15 px-3 py-1 text-xs font-bold text-[#b85c6b] transition-all cursor-pointer shadow-xs"
          title="Preview public profile"
        >
          <Eye className="h-3.5 w-3.5 text-[#b85c6b]" />
          <span>Preview Profile</span>
        </button>
      </div>

      <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#181716] sm:text-3xl">
        Add your social handles
      </h1>
      <p className="mt-1.5 text-xs sm:text-sm text-[#54514D] leading-relaxed">
        Enter your handle for each platform, preview your profile details, and link them to your public page.
      </p>

      {/* Public Data Scraping Permission (One-Line Top Layout) */}
      <div className="mt-5">
        <SocialDataConsentCard
          variant="one-line"
          accepted={consentAccepted}
          onToggle={handleConsentToggle}
          error={consentError}
          disabled={isInstaConnected || isYtConnected || isFbConnected}
        />
      </div>

      {/* Social Platforms Username Form */}
      <div className="mt-5 space-y-5">
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
              <Input
                label="Instagram Username"
                placeholder="username"
                prefix="instagram.com/"
                leftIcon={<AtSign className="h-4 w-4 text-pink-500" />}
                value={instaInput}
                onChange={(e) => setInstaInput(e.target.value.trim().replace(/^@/, ""))}
              />
              <InstagramFetcher username={instaInput} onBeforeFetch={requireConsentBeforeAction} variant="inline" />
            </>
          )}
        </PlatformCard>

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
              <Input
                label="YouTube Channel Handle"
                placeholder="channelname"
                prefix="youtube.com/@"
                leftIcon={<AtSign className="h-4 w-4 text-red-500" />}
                value={ytInput}
                onChange={(e) => setYtInput(e.target.value.trim().replace(/^@/, ""))}
              />
              <YoutubeFetcher handle={ytInput} onBeforeFetch={requireConsentBeforeAction} variant="inline" />
            </>
          )}
        </PlatformCard>

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
              <Input
                label="Facebook Page Username"
                placeholder="pagename"
                prefix="facebook.com/"
                leftIcon={<AtSign className="h-4 w-4 text-blue-600" />}
                value={fbInput}
                onChange={(e) => setFbInput(e.target.value.trim().replace(/^@/, ""))}
              />
              <FacebookFetcher username={fbInput} onBeforeFetch={requireConsentBeforeAction} variant="inline" />
            </>
          )}
        </PlatformCard>

        {/* Additional Platform Informational Note */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-4 text-left flex items-start gap-3 shadow-xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#b85c6b]/[0.09] text-[#b85c6b]">
            <Link2 className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-[#181716]">Want to add more platforms?</h4>
            <p className="text-xs text-[#54514D] leading-relaxed">
              You can add more social profiles and custom links anytime after creating your profile from{" "}
              <strong className="text-[#b85c6b] font-semibold">Dashboard → Links &amp; Socials</strong>.
            </p>
          </div>
        </div>

        {/* Step 2 Form Bottom Navigation (Natural flow, Back + Next) */}
        <div className="pt-4 border-t border-[#E7E3DC] mt-8 flex flex-col-reverse sm:flex-row items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto h-11 rounded-xl border-[#E7E3DC] text-[#181716] hover:bg-[#fbfbfb] font-semibold text-sm px-6"
            onClick={() => router.push("/onboarding/profile")}
          >
            Back
          </Button>
          <Button
            type="button"
            fullWidth
            size="lg"
            loading={submitting}
            onClick={handleNext}
            className="w-full sm:flex-1 h-11 bg-[#b85c6b] hover:bg-[#6F3456] text-white font-bold text-sm rounded-xl cursor-pointer shadow-xs"
          >
            Save &amp; Next →
          </Button>
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
