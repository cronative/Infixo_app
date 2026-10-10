"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Link2, Plus, ChevronDown, Check } from "lucide-react";
import { OnboardingLayout } from "@/layouts/OnboardingLayout";
import { ConnectedAccountCard } from "@/components/socials/ConnectedAccountCard";
import { useCreator } from "@/contexts/CreatorContext";
import { OnboardingService } from "@/services/OnboardingService";
import { SocialService } from "@/services/SocialService";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  XTwitterIcon,
  LinkedinIcon,
  ThreadsIcon,
  SpotifyIcon,
} from "@/components/shared/BrandIcons";
import { InstagramFetcher } from "@/components/socials/InstagramFetcher";
import { YoutubeFetcher } from "@/components/socials/YoutubeFetcher";
import { FacebookFetcher } from "@/components/socials/FacebookFetcher";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { SocialDataConsentCard } from "@/components/socials/SocialDataConsentCard";
import { authRepository } from "@/repositories/localRepository";
import { useToast } from "@/contexts/ToastContext";

function extractUsername(url?: string | null): string {
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
  platform: "instagram" | "youtube" | "facebook" | "twitter" | "linkedin" | "threads" | "spotify";
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

  // Core 3 Platforms
  const [instaInput, setInstaInput] = useState(() => extractUsername(socials.instagram?.url));
  const [ytInput, setYtInput] = useState(() => extractUsername(socials.youtube?.url));
  const [fbInput, setFbInput] = useState(() => extractUsername(socials.facebook?.url));

  const instaConnectedHandle = extractUsername(socials.instagram?.url) || socials.instagram?.username || "";
  const ytConnectedHandle = extractUsername(socials.youtube?.url) || socials.youtube?.username || "";
  const fbConnectedHandle = extractUsername(socials.facebook?.url) || socials.facebook?.username || "";

  const isInstaConnected = Boolean(socials.instagram?.url || (socials.instagram?.followers || 0) > 0 || instaConnectedHandle);
  const isYtConnected = Boolean(socials.youtube?.url || (socials.youtube?.subscribers || 0) > 0 || ytConnectedHandle);
  const isFbConnected = Boolean(socials.facebook?.url || (socials.facebook?.followers || 0) > 0 || fbConnectedHandle);

  // Other Platforms (Twitter/X, LinkedIn, Threads, Spotify)
  const [twInput, setTwInput] = useState(() => extractUsername(socials.twitter?.url || socials.twitter?.username || ""));
  const [liInput, setLiInput] = useState(() => extractUsername(socials.linkedin?.url || socials.linkedin?.username || ""));
  const [thInput, setThInput] = useState(() => extractUsername(socials.threads?.url || socials.threads?.username || ""));
  const [spInput, setSpInput] = useState(() => extractUsername(socials.spotify?.url || socials.spotify?.username || ""));

  const twConnectedHandle = extractUsername(socials.twitter?.url || "") || socials.twitter?.username || "";
  const liConnectedHandle = extractUsername(socials.linkedin?.url || "") || socials.linkedin?.username || "";
  const thConnectedHandle = extractUsername(socials.threads?.url || "") || socials.threads?.username || "";
  const spConnectedHandle = extractUsername(socials.spotify?.url || "") || socials.spotify?.username || "";

  const isTwConnected = Boolean(socials.twitter?.url || (socials.twitter?.followers || 0) > 0 || twConnectedHandle);
  const isLiConnected = Boolean(socials.linkedin?.url || (socials.linkedin?.followers || 0) > 0 || liConnectedHandle);
  const isThConnected = Boolean(socials.threads?.url || (socials.threads?.followers || 0) > 0 || thConnectedHandle);
  const isSpConnected = Boolean(socials.spotify?.url || (socials.spotify?.followers || 0) > 0 || spConnectedHandle);

  const hasAnyOtherConnected = isTwConnected || isLiConnected || isThConnected || isSpConnected;
  const [showMoreSocials, setShowMoreSocials] = useState<boolean>(hasAnyOtherConnected);

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
        twitter: { url: "", followers: 0, username: "", name: "" },
        linkedin: { url: "", followers: 0, username: "", name: "" },
        threads: { url: "", followers: 0, username: "", name: "" },
        spotify: { url: "", followers: 0, username: "", name: "" },
      });
      setInstaInput("");
      setYtInput("");
      setFbInput("");
      setTwInput("");
      setLiInput("");
      setThInput("");
      setSpInput("");
      showToast("Authorization unchecked — social accounts removed 🔒", "info");
    } else {
      setConsentError(false);
    }
  }

  function handleConnectPlatform(platform: "twitter" | "linkedin" | "threads" | "spotify", handle: string) {
    const clean = handle.trim().replace(/^@/, "");
    if (!clean) {
      showToast("Please enter a username or handle first", "error");
      return;
    }
    const urlMap = {
      twitter: `https://x.com/${clean}`,
      linkedin: `https://linkedin.com/in/${clean}`,
      threads: `https://threads.net/@${clean}`,
      spotify: `https://open.spotify.com/artist/${clean}`,
    };
    const updateObj: Partial<typeof socials> = {};
    updateObj[platform] = {
      url: urlMap[platform],
      username: clean,
      followers: socials[platform]?.followers || 0,
      name: clean,
    };
    updateSocials(updateObj);
    showToast(`${platform === "twitter" ? "X (Twitter)" : platform.charAt(0).toUpperCase() + platform.slice(1)} linked! ✨`);
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
      const updatedSocials = { ...socials };
      if (twInput && !socials.twitter?.url) {
        updatedSocials.twitter = { url: `https://x.com/${twInput}`, username: twInput, followers: socials.twitter?.followers || 0 };
      }
      if (liInput && !socials.linkedin?.url) {
        updatedSocials.linkedin = { url: `https://linkedin.com/in/${liInput}`, username: liInput, followers: socials.linkedin?.followers || 0 };
      }
      if (thInput && !socials.threads?.url) {
        updatedSocials.threads = { url: `https://threads.net/@${thInput}`, username: thInput, followers: socials.threads?.followers || 0 };
      }
      if (spInput && !socials.spotify?.url) {
        updatedSocials.spotify = { url: `https://open.spotify.com/artist/${spInput}`, username: spInput, followers: socials.spotify?.followers || 0 };
      }
      updateSocials(updatedSocials);
      SocialService.saveAccounts(updatedSocials);
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

  function promptDisconnect(platform: "instagram" | "youtube" | "facebook" | "twitter" | "linkedin" | "threads" | "spotify") {
    const nameMap = {
      instagram: "Instagram",
      youtube: "YouTube",
      facebook: "Facebook",
      twitter: "X (Twitter)",
      linkedin: "LinkedIn",
      threads: "Threads",
      spotify: "Spotify",
    };
    const handleMap = {
      instagram: instaConnectedHandle,
      youtube: ytConnectedHandle,
      facebook: fbConnectedHandle,
      twitter: twConnectedHandle,
      linkedin: liConnectedHandle,
      threads: thConnectedHandle,
      spotify: spConnectedHandle,
    };
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
      } else if (platform === "twitter") {
        updateSocials({ twitter: { url: "", followers: 0, username: "", name: "" } });
        setTwInput("");
      } else if (platform === "linkedin") {
        updateSocials({ linkedin: { url: "", followers: 0, username: "", name: "" } });
        setLiInput("");
      } else if (platform === "threads") {
        updateSocials({ threads: { url: "", followers: 0, username: "", name: "" } });
        setThInput("");
      } else if (platform === "spotify") {
        updateSocials({ spotify: { url: "", followers: 0, username: "", name: "" } });
        setSpInput("");
      }

      if (email) {
        await fetch(`/api/creator/socials?email=${encodeURIComponent(email)}&platform=${platform}`, {
          method: "DELETE",
        });
      }
      showToast(`${platform === "twitter" ? "X" : platform.charAt(0).toUpperCase() + platform.slice(1)} connection removed! 🗑️`);
      setDisconnectModal(null);
    } catch (err: unknown) {
      console.error("Disconnect error:", err);
      showToast("Could not remove connection", "error");
    }
  }

  return (
    <OnboardingLayout step="socials">
      <div className="w-full max-w-[460px] mx-auto pt-0 sm:pt-1 pb-4">
        {/* SINGLE UNIFIED WHITE CARD */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4 sm:p-5 space-y-3.5 text-left shadow-xs">

          {/* 1. Header Section */}
          <div className="space-y-1">
            <h1 className="font-display text-xl sm:text-[24px] font-extrabold text-[#181716] tracking-tight leading-tight">
              Add your social handles
            </h1>
            <p className="text-xs font-normal text-[#54514D] leading-relaxed">
              Connect what you have now. You can add, edit, or remove accounts anytime.
            </p>
          </div>

          {/* 2. Public Data Scraping Permission Card */}
          <div>
            <SocialDataConsentCard
              variant="one-line"
              accepted={consentAccepted}
              onToggle={handleConsentToggle}
              error={consentError}
              disabled={isInstaConnected || isYtConnected || isFbConnected}
            />
          </div>

          {/* 3. Social Platforms List */}
          <div className="space-y-2.5">

            {/* Instagram Card */}
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shadow-2xs">
                  <InstagramIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#181716] block">
                    Instagram
                  </span>
                  <span className="text-[10.5px] text-[#64748b]">
                    Fetch followers &amp; profile details
                  </span>
                </div>
              </div>

              {isInstaConnected ? (
                <div className="bg-white rounded-xl p-2.5 border border-[#e2e8f0]">
                  <ConnectedAccountCard
                    platform="instagram"
                    icon={<InstagramIcon className="h-4 w-4 text-white" />}
                    accentClass="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                    name="Instagram Profile"
                    handle={instaConnectedHandle}
                    displayName={socials.instagram?.name}
                    isVerified={socials.instagram?.isVerified}
                    count={socials.instagram?.followers || 0}
                    countLabel="Followers"
                    lastSyncedAt={socials.instagram?.lastSyncedAt || socials.updatedAt}
                    onDisconnect={() => promptDisconnect("instagram")}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex h-10.5 sm:h-11 items-center rounded-xl border border-[#cbd5e1] bg-white px-3 transition-all focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10">
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
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 shadow-2xs">
                  <YoutubeIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#181716] block">
                    YouTube Channel
                  </span>
                  <span className="text-[10.5px] text-[#64748b]">
                    Fetch subscribers &amp; channel info
                  </span>
                </div>
              </div>

              {isYtConnected ? (
                <div className="bg-white rounded-xl p-2.5 border border-[#e2e8f0]">
                  <ConnectedAccountCard
                    platform="youtube"
                    icon={<YoutubeIcon className="h-4 w-4 text-white" />}
                    accentClass="bg-red-600"
                    name="YouTube Channel"
                    handle={ytConnectedHandle}
                    displayName={socials.youtube?.channelTitle}
                    isVerified={socials.youtube?.isVerified}
                    count={socials.youtube?.subscribers || 0}
                    countLabel="Subscribers"
                    lastSyncedAt={socials.youtube?.lastSyncedAt || socials.updatedAt}
                    onDisconnect={() => promptDisconnect("youtube")}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex h-10.5 sm:h-11 items-center rounded-xl border border-[#cbd5e1] bg-white px-3 transition-all focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10">
                    <span className="text-xs sm:text-sm font-medium text-[#64748b] select-none shrink-0">
                      youtube.com/
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
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shadow-2xs">
                  <FacebookIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#181716] block">
                    Facebook Page
                  </span>
                  <span className="text-[10.5px] text-[#64748b]">
                    Fetch page followers &amp; details
                  </span>
                </div>
              </div>

              {isFbConnected ? (
                <div className="bg-white rounded-xl p-2.5 border border-[#e2e8f0]">
                  <ConnectedAccountCard
                    platform="facebook"
                    icon={<FacebookIcon className="h-4 w-4 text-white" />}
                    accentClass="bg-blue-600"
                    name="Facebook Page"
                    handle={fbConnectedHandle}
                    displayName={socials.facebook?.name}
                    isVerified={socials.facebook?.isVerified}
                    count={socials.facebook?.followers || 0}
                    countLabel="Followers"
                    lastSyncedAt={socials.facebook?.lastSyncedAt || socials.updatedAt}
                    onDisconnect={() => promptDisconnect("facebook")}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex h-10.5 sm:h-11 items-center rounded-xl border border-[#cbd5e1] bg-white px-3 transition-all focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10">
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

            {/* Expandable Other Social Platforms (X, LinkedIn, Threads, Spotify) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMoreSocials(!showMoreSocials)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-dashed border-[#cbd5e1] bg-white hover:bg-[#f8fafc] text-xs font-semibold text-[#7A2253] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Plus className={`h-3.5 w-3.5 transition-transform ${showMoreSocials ? "rotate-45" : ""}`} />
                  <span>{showMoreSocials ? "Hide other platforms" : "Add other platforms (X, LinkedIn, Threads, Spotify)"}</span>
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMoreSocials ? "rotate-180" : ""}`} />
              </button>

              {showMoreSocials && (
                <div className="space-y-2.5 pt-2.5">
                  {/* X (Twitter) Card */}
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 shadow-2xs">
                        <XTwitterIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#181716] block">
                          X (Twitter)
                        </span>
                        <span className="text-[10.5px] text-[#64748b]">
                          Link your X profile &amp; posts
                        </span>
                      </div>
                    </div>

                    {isTwConnected ? (
                      <div className="bg-white rounded-xl p-2.5 border border-[#e2e8f0]">
                        <ConnectedAccountCard
                          platform="twitter"
                          icon={<XTwitterIcon className="h-3.5 w-3.5 text-white" />}
                          accentClass="bg-slate-900"
                          name="X (Twitter)"
                          handle={twConnectedHandle}
                          count={socials.twitter?.followers || 0}
                          countLabel="Followers"
                          onDisconnect={() => promptDisconnect("twitter")}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-1 h-10.5 items-center rounded-xl border border-[#cbd5e1] bg-white px-3 transition-all focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10">
                          <span className="text-xs sm:text-sm font-medium text-[#64748b] select-none shrink-0">
                            x.com/
                          </span>
                          <input
                            type="text"
                            value={twInput}
                            onChange={(e) => setTwInput(e.target.value.trim().replace(/^@/, ""))}
                            placeholder="handle"
                            className="h-full w-full bg-transparent px-1 text-xs sm:text-sm font-semibold text-[#181716] outline-none placeholder:text-[#94a3b8]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConnectPlatform("twitter", twInput)}
                          className="h-10.5 px-3 rounded-xl bg-[#7A2253] text-white text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shrink-0"
                        >
                          Link
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LinkedIn Card */}
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-700 shadow-2xs">
                        <LinkedinIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#181716] block">
                          LinkedIn
                        </span>
                        <span className="text-[10.5px] text-[#64748b]">
                          Link your LinkedIn profile
                        </span>
                      </div>
                    </div>

                    {isLiConnected ? (
                      <div className="bg-white rounded-xl p-2.5 border border-[#e2e8f0]">
                        <ConnectedAccountCard
                          platform="linkedin"
                          icon={<LinkedinIcon className="h-4 w-4 text-white" />}
                          accentClass="bg-sky-700"
                          name="LinkedIn"
                          handle={liConnectedHandle}
                          count={socials.linkedin?.followers || 0}
                          countLabel="Connections"
                          onDisconnect={() => promptDisconnect("linkedin")}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-1 h-10.5 items-center rounded-xl border border-[#cbd5e1] bg-white px-3 transition-all focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10">
                          <span className="text-xs sm:text-sm font-medium text-[#64748b] select-none shrink-0">
                            linkedin.com/in/
                          </span>
                          <input
                            type="text"
                            value={liInput}
                            onChange={(e) => setLiInput(e.target.value.trim().replace(/^@/, ""))}
                            placeholder="username"
                            className="h-full w-full bg-transparent px-1 text-xs sm:text-sm font-semibold text-[#181716] outline-none placeholder:text-[#94a3b8]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConnectPlatform("linkedin", liInput)}
                          className="h-10.5 px-3 rounded-xl bg-[#7A2253] text-white text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shrink-0"
                        >
                          Link
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Threads Card */}
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 shadow-2xs">
                        <ThreadsIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#181716] block">
                          Threads
                        </span>
                        <span className="text-[10.5px] text-[#64748b]">
                          Link your Threads handle
                        </span>
                      </div>
                    </div>

                    {isThConnected ? (
                      <div className="bg-white rounded-xl p-2.5 border border-[#e2e8f0]">
                        <ConnectedAccountCard
                          platform="threads"
                          icon={<ThreadsIcon className="h-3.5 w-3.5 text-white" />}
                          accentClass="bg-slate-900"
                          name="Threads"
                          handle={thConnectedHandle}
                          count={socials.threads?.followers || 0}
                          countLabel="Followers"
                          onDisconnect={() => promptDisconnect("threads")}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-1 h-10.5 items-center rounded-xl border border-[#cbd5e1] bg-white px-3 transition-all focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10">
                          <span className="text-xs sm:text-sm font-medium text-[#64748b] select-none shrink-0">
                            threads.net/@
                          </span>
                          <input
                            type="text"
                            value={thInput}
                            onChange={(e) => setThInput(e.target.value.trim().replace(/^@/, ""))}
                            placeholder="username"
                            className="h-full w-full bg-transparent px-1 text-xs sm:text-sm font-semibold text-[#181716] outline-none placeholder:text-[#94a3b8]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConnectPlatform("threads", thInput)}
                          className="h-10.5 px-3 rounded-xl bg-[#7A2253] text-white text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shrink-0"
                        >
                          Link
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Spotify Card */}
                  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 shadow-2xs">
                        <SpotifyIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#181716] block">
                          Spotify
                        </span>
                        <span className="text-[10.5px] text-[#64748b]">
                          Link your Spotify artist or podcast
                        </span>
                      </div>
                    </div>

                    {isSpConnected ? (
                      <div className="bg-white rounded-xl p-2.5 border border-[#e2e8f0]">
                        <ConnectedAccountCard
                          platform="spotify"
                          icon={<SpotifyIcon className="h-4 w-4 text-white" />}
                          accentClass="bg-emerald-600"
                          name="Spotify"
                          handle={spConnectedHandle}
                          count={socials.spotify?.followers || 0}
                          countLabel="Listeners"
                          onDisconnect={() => promptDisconnect("spotify")}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-1 h-10.5 items-center rounded-xl border border-[#cbd5e1] bg-white px-3 transition-all focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10">
                          <span className="text-xs sm:text-sm font-medium text-[#64748b] select-none shrink-0">
                            spotify.com/artist/
                          </span>
                          <input
                            type="text"
                            value={spInput}
                            onChange={(e) => setSpInput(e.target.value.trim().replace(/^@/, ""))}
                            placeholder="artist_id_or_name"
                            className="h-full w-full bg-transparent px-1 text-xs sm:text-sm font-semibold text-[#181716] outline-none placeholder:text-[#94a3b8]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConnectPlatform("spotify", spInput)}
                          className="h-10.5 px-3 rounded-xl bg-[#7A2253] text-white text-xs font-semibold hover:opacity-95 transition-all cursor-pointer shrink-0"
                        >
                          Link
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 4. Additional Platforms Note Box */}
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc]/70 p-2 sm:p-2.5 text-left flex items-start gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white border border-[#e2e8f0] text-[#7A2253] mt-0.5">
              <Link2 className="h-3 w-3" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-[#181716]">Link what you have, add more anytime</h4>
              <p className="text-[10.5px] text-[#64748b] leading-relaxed">
                You don&apos;t need every platform to get started. You can also add custom links, WhatsApp, and more anytime from your creator dashboard.
              </p>
            </div>
          </div>

          {/* 5. Navigation Buttons (Back + Next) */}
          <div className="pt-0.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/onboarding/profile")}
              className="rounded-xl border border-[#cbd5e1] bg-white text-[#181716] font-semibold text-xs sm:text-sm h-10.5 sm:h-11 px-3.5 hover:bg-surface-soft transition-all cursor-pointer shrink-0"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#7A2253] hover:opacity-95 text-white font-semibold text-xs sm:text-sm h-10.5 sm:h-11 transition-all cursor-pointer shadow-md shadow-[#7A2253]/20 disabled:opacity-60 active:scale-98"
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
