"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ExternalLink,
  MoreVertical,
  ShieldCheck,
  Trash2,
  AtSign,
  RefreshCw,
  Info,
  Link as LinkIcon,
  BarChart2,
  Sparkles,
  Unlink,
  Eye,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";
import { InstagramFetcher } from "@/components/socials/InstagramFetcher";
import { YoutubeFetcher } from "@/components/socials/YoutubeFetcher";
import { FacebookFetcher } from "@/components/socials/FacebookFetcher";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal, ModalBody } from "@/components/ui/Modal";
import { formatSimplifiedSyncDate } from "@/lib/socialSyncDate";
import { formatCount } from "@/utils/format";
import { SocialService } from "@/services/SocialService";

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
  platformName: string;
  handle: string;
} | null;

export default function DashboardSocialsPage() {
  const { profile, socials, totalAudience, updateSocials } = useCreator();
  const { showToast } = useToast();

  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [disconnectModal, setDisconnectModal] = useState<ConfirmDisconnectModal>(null);
  const [submittingDisconnect, setSubmittingDisconnect] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Draft handles for unconnected platforms
  const [draftInsta, setDraftInsta] = useState(() => extractUsername(socials?.instagram?.url || ""));
  const [draftYt, setDraftYt] = useState(() => extractUsername(socials?.youtube?.url || ""));
  const [draftFb, setDraftFb] = useState(() => extractUsername(socials?.facebook?.url || ""));

  // Keep draft handles in sync when socials hydrate or change
  useEffect(() => {
    if (socials?.instagram?.url || socials?.instagram?.username) {
      setDraftInsta(extractUsername(socials.instagram.url || "") || socials.instagram.username || "");
    }
    if (socials?.youtube?.url || socials?.youtube?.username) {
      setDraftYt(extractUsername(socials.youtube.url || "") || socials.youtube.username || "");
    }
    if (socials?.facebook?.url || socials?.facebook?.username) {
      setDraftFb(extractUsername(socials.facebook.url || "") || socials.facebook.username || "");
    }
  }, [socials]);

  // Connected handles & booleans (safe optional chaining)
  const instaConnectedHandle = extractUsername(socials?.instagram?.url || "") || socials?.instagram?.username || "";
  const ytConnectedHandle = extractUsername(socials?.youtube?.url || "") || socials?.youtube?.username || "";
  const fbConnectedHandle = extractUsername(socials?.facebook?.url || "") || socials?.facebook?.username || "";

  const isInstaConnected = Boolean(socials?.instagram?.url || (socials?.instagram?.followers ?? 0) > 0 || instaConnectedHandle);
  const isYtConnected = Boolean(socials?.youtube?.url || (socials?.youtube?.subscribers ?? 0) > 0 || ytConnectedHandle);
  const isFbConnected = Boolean(socials?.facebook?.url || (socials?.facebook?.followers ?? 0) > 0 || fbConnectedHandle);

  const connectedCount = [isInstaConnected, isYtConnected, isFbConnected].filter(Boolean).length;

  // Sync single platform trigger
  const handleSyncPlatform = async (platform: "instagram" | "youtube" | "facebook") => {
    setSyncingPlatform(platform);
    try {
      if (platform === "instagram" && instaConnectedHandle) {
        const httpResponse = await fetch("/api/instagram/userInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: instaConnectedHandle }),
        });
        const apiResponse = await httpResponse.json();
        const u = apiResponse.data?.user || apiResponse.user;
        if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success) && u) {
          const followerCount = Number(u.follower_count || 0);
          const mediaCount = Number(u.media_count || 0);
          updateSocials({
            instagram: {
              ...socials.instagram,
              username: u.username,
              name: u.full_name,
              followers: followerCount,
              posts: mediaCount,
              isVerified: u.is_verified,
              lastSyncedAt: new Date().toISOString(),
            },
          });
          await fetch("/api/creator/socials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email || undefined,
              platform: "instagram",
              accountName: u.full_name || u.username,
              username: u.username,
              followerCount,
              mediaCount,
              isVerified: Boolean(u.is_verified),
            }),
          }).catch((err) => console.error("Failed to sync Instagram to DB:", err));
          showToast("Instagram profile synced! 📸");
        } else {
          showToast("Could not refresh Instagram. Please check handle.", "error");
        }
      } else if (platform === "youtube" && ytConnectedHandle) {
        const httpResponse = await fetch("/api/youtube/channelInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelName: ytConnectedHandle }),
        });
        const apiResponse = await httpResponse.json();
        const c = apiResponse.data?.channel || apiResponse.channel;
        if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success) && c) {
          const subscribers = Number(c.subscribers || 0);
          const videoCount = Number(c.video_count || 0);
          updateSocials({
            youtube: {
              ...socials.youtube,
              username: c.channel_name || ytConnectedHandle,
              channelTitle: c.title,
              subscribers,
              videos: videoCount,
              isVerified: c.verified,
              lastSyncedAt: new Date().toISOString(),
            },
          });
          await fetch("/api/creator/socials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email || undefined,
              platform: "youtube",
              accountName: c.title || c.channel_name || ytConnectedHandle,
              username: c.channel_name || ytConnectedHandle,
              followerCount: subscribers,
              mediaCount: videoCount,
              isVerified: Boolean(c.verified),
            }),
          }).catch((err) => console.error("Failed to sync YouTube to DB:", err));
          showToast("YouTube channel synced! 📺");
        } else {
          showToast("Could not refresh YouTube. Please check handle.", "error");
        }
      } else if (platform === "facebook" && fbConnectedHandle) {
        const httpResponse = await fetch("/api/facebook/pageInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: fbConnectedHandle }),
        });
        const apiResponse = await httpResponse.json();
        const p = apiResponse.data?.page || apiResponse.page;
        if (httpResponse.ok && (apiResponse.status === 1 || apiResponse.success) && p) {
          const followers = Number(p.followers || 0);
          updateSocials({
            facebook: {
              ...socials.facebook,
              username: p.username || fbConnectedHandle,
              name: p.name,
              followers,
              isVerified: p.verified,
              lastSyncedAt: new Date().toISOString(),
            },
          });
          await fetch("/api/creator/socials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email || undefined,
              platform: "facebook",
              accountName: p.name || fbConnectedHandle,
              username: p.username || fbConnectedHandle,
              followerCount: followers,
              mediaCount: 0,
              isVerified: Boolean(p.verified),
            }),
          }).catch((err) => console.error("Failed to sync Facebook to DB:", err));
          showToast("Facebook page synced! 📘");
        } else {
          showToast("Could not refresh Facebook. Please check handle.", "error");
        }
      } else {
        const updated = await SocialService.fetchFromDb({ email: profile.email, username: profile.username });
        if (updated) {
          updateSocials(updated);
        }
        showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} stats refreshed! ✨`);
      }
    } catch {
      showToast(`Could not refresh ${platform}. Please check handle.`, "error");
    } finally {
      setSyncingPlatform(null);
    }
  };

  // Disconnect Execution
  const handleExecuteDisconnect = async () => {
    if (!disconnectModal) return;
    setSubmittingDisconnect(true);
    const { platform } = disconnectModal;
    const email = profile.email;

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
      showToast(`${disconnectModal.platformName} disconnected!`);
      setDisconnectModal(null);
    } catch (err) {
      console.error("Failed to disconnect social account:", err);
      showToast("Could not disconnect account. Please try again.", "error");
    } finally {
      setSubmittingDisconnect(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 w-full pb-8 text-left">
      {/* 1. BREADCRUMB */}
      <div className="flex items-center gap-1.5 text-xs text-[#64748b] font-medium">
        <span>Studio</span>
        <span className="text-slate-400">&gt;</span>
        <span className="text-[#0f172a] font-semibold">Social Accounts</span>
      </div>

      {/* 2. PAGE HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0f172a]">
              Social Accounts
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#ecfdf5] border border-[#d1fae5] px-2.5 py-0.5 text-xs font-semibold text-[#047857]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
              <span>Live Fanbase Sync</span>
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-[#64748b]">
            Connect YouTube, Instagram, and Facebook to verify your audience and calculate your Total Fanbase.
          </p>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("connect-accounts-section");
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
              } else {
                showToast("All major social accounts are connected! 🎉");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#7A2253] hover:bg-[#681c46] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-2xs transition-colors cursor-pointer"
          >
            <span>+</span>
            <span>Connect Account</span>
          </button>
        </div>
      </div>

      {/* 3. TOP STATS BANNER */}
      <div className="rounded-[5px] border border-[#FCE7F3] bg-[#FFF5F7]/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs text-left">
        {/* Left: Accounts Connected */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F3] text-[#7A2253]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#0f172a] leading-tight">
              {connectedCount} social accounts connected
            </h3>
            <p className="text-xs text-[#64748b] font-medium mt-0.5">
              Your audience across all platforms
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-[#FCE7F3]" />

        {/* Right: Total Fanbase */}
        <div className="flex items-center gap-3 sm:gap-4 sm:pl-4 flex-1 sm:justify-start">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F3] text-[#7A2253]">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-base sm:text-lg font-bold text-[#0f172a] leading-none">
              {formatCount(totalAudience || 0)}
            </div>
            <p className="text-xs text-[#64748b] font-medium mt-0.5">
              Total Fanbase
            </p>
          </div>
        </div>
      </div>

      {/* 4. CONNECTED SOCIAL CARDS (3 COLUMNS) */}
      {connectedCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* INSTAGRAM CONNECTED CARD */}
          {isInstaConnected && (
            <ConnectedSocialCard
              platformName="Instagram"
              icon={
                <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] text-white shadow-2xs shrink-0">
                  <InstagramIcon className="h-4 w-4 fill-white" />
                </div>
              }
              handle={instaConnectedHandle || (isInstaConnected ? profile.username : "")}
              displayName={socials?.instagram?.name || "Instagram Profile"}
              isVerified={socials?.instagram?.isVerified ?? true}
              count={socials?.instagram?.followers || 0}
              countLabel="Followers"
              lastSyncedAt={socials?.instagram?.lastSyncedAt || socials?.updatedAt}
              profileUrl={socials?.instagram?.url || (instaConnectedHandle ? `https://instagram.com/${instaConnectedHandle}` : "")}
              isSyncing={syncingPlatform === "instagram"}
              onSync={() => handleSyncPlatform("instagram")}
              onDisconnect={() =>
                setDisconnectModal({
                  platform: "instagram",
                  platformName: "Instagram",
                  handle: instaConnectedHandle,
                })
              }
            />
          )}

          {/* YOUTUBE CONNECTED CARD */}
          {isYtConnected && (
            <ConnectedSocialCard
              platformName="YouTube"
              icon={
                <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#FF0000] text-white shadow-2xs shrink-0">
                  <YoutubeIcon className="h-4 w-4 fill-white" />
                </div>
              }
              handle={ytConnectedHandle}
              displayName={socials?.youtube?.channelTitle || "YouTube Channel"}
              isVerified={socials?.youtube?.isVerified ?? true}
              count={socials?.youtube?.subscribers || 0}
              countLabel="Subscribers"
              lastSyncedAt={socials?.youtube?.lastSyncedAt || socials?.updatedAt}
              profileUrl={socials?.youtube?.url || (ytConnectedHandle ? `https://youtube.com/@${ytConnectedHandle}` : "")}
              isSyncing={syncingPlatform === "youtube"}
              onSync={() => handleSyncPlatform("youtube")}
              onDisconnect={() =>
                setDisconnectModal({
                  platform: "youtube",
                  platformName: "YouTube",
                  handle: ytConnectedHandle,
                })
              }
            />
          )}

          {/* FACEBOOK CONNECTED CARD */}
          {isFbConnected && (
            <ConnectedSocialCard
              platformName="Facebook"
              icon={
                <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#1877F2] text-white shadow-2xs shrink-0">
                  <FacebookIcon className="h-4 w-4 fill-white" />
                </div>
              }
              handle={fbConnectedHandle || instaConnectedHandle}
              displayName={socials?.facebook?.name || "Facebook Page"}
              isVerified={socials?.facebook?.isVerified ?? true}
              count={socials?.facebook?.followers || 0}
              countLabel="Followers"
              lastSyncedAt={socials?.facebook?.lastSyncedAt || socials?.updatedAt}
              profileUrl={socials?.facebook?.url || (fbConnectedHandle ? `https://facebook.com/${fbConnectedHandle}` : "")}
              isSyncing={syncingPlatform === "facebook"}
              onSync={() => handleSyncPlatform("facebook")}
              onDisconnect={() =>
                setDisconnectModal({
                  platform: "facebook",
                  platformName: "Facebook",
                  handle: fbConnectedHandle,
                })
              }
            />
          )}
        </div>
      )}

      {/* 5. CONNECT ANOTHER PLATFORM SECTION */}
      {connectedCount < 3 && (
        <div id="connect-accounts-section" className="space-y-3 pt-1 text-left">
          <h3 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
            {connectedCount === 0 ? "Connect your creator accounts" : "Connect another platform"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Instagram Unconnected */}
            {!isInstaConnected && (
              <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3.5 sm:p-4 space-y-2.5 shadow-xs text-left">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] text-white shadow-2xs shrink-0">
                    <InstagramIcon className="h-4 w-4 fill-white" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0f172a]">Instagram</h4>
                    <p className="text-[11px] text-[#64748b]">Show profile &amp; followers.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#E1306C]">
                      <InstagramIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={draftInsta}
                      onChange={(e) => setDraftInsta(e.target.value.trim().replace(/^@/, ""))}
                      placeholder="Instagram username"
                      className="flex-1 h-9 px-3 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/60 bg-transparent outline-none"
                    />
                  </div>
                  <InstagramFetcher username={draftInsta} />
                </div>
              </div>
            )}

            {/* YouTube Unconnected */}
            {!isYtConnected && (
              <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3.5 sm:p-4 space-y-2.5 shadow-xs text-left">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#FF0000] text-white shadow-2xs shrink-0">
                    <YoutubeIcon className="h-4 w-4 fill-white" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0f172a]">YouTube</h4>
                    <p className="text-[11px] text-[#64748b]">Show channel &amp; subscribers.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#FF0000]">
                      <YoutubeIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={draftYt}
                      onChange={(e) => setDraftYt(e.target.value.trim().replace(/^@/, ""))}
                      placeholder="YouTube channel handle"
                      className="flex-1 h-9 px-3 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/60 bg-transparent outline-none"
                    />
                  </div>
                  <YoutubeFetcher handle={draftYt} />
                </div>
              </div>
            )}

            {/* Facebook Unconnected */}
            {!isFbConnected && (
              <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-3.5 sm:p-4 space-y-2.5 shadow-xs text-left">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#1877F2] text-white shadow-2xs shrink-0">
                    <FacebookIcon className="h-4 w-4 fill-white" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#0f172a]">Facebook</h4>
                    <p className="text-[11px] text-[#64748b]">Show page &amp; followers.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#1877F2]">
                      <FacebookIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={draftFb}
                      onChange={(e) => setDraftFb(e.target.value.trim().replace(/^@/, ""))}
                      placeholder="Facebook page username"
                      className="flex-1 h-9 px-3 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/60 bg-transparent outline-none"
                    />
                  </div>
                  <FacebookFetcher username={draftFb} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. SHORTCUT TO CUSTOM LINKS */}
      <section className="rounded-[5px] border border-[#e2e8f0] bg-white p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F3] text-[#7A2253]">
            <LinkIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#0f172a]">
              Looking to add custom links &amp; bio buttons?
            </h3>
            <p className="text-[11px] text-[#64748b] font-medium">
              Add affiliate products, brand stores, WhatsApp, and custom website links on your profile.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/links"
          className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#e2e8f0] bg-white px-3.5 py-2 text-xs font-bold text-[#0f172a] hover:border-[#cbd5e1] hover:bg-[#f8fafc] transition-colors shrink-0 self-start sm:self-auto shadow-2xs"
        >
          <span>Custom Links Manager</span>
          <ExternalLink className="h-3.5 w-3.5 text-[#64748b]" />
        </Link>
      </section>

      {/* 7. HOW SOCIAL DATA WORKS (Compact Info Row + Learn more Modal) */}
      <section className="rounded-[5px] border border-[#e2e8f0] bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs text-left">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F3] text-[#7A2253]">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[#0f172a]">How social data works</h3>
            <p className="text-[11px] text-[#64748b] font-medium">
              Inflixo uses publicly available profile information to calculate your Total Fanbase.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsInfoModalOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#7A2253] hover:underline cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <span>Learn more</span>
          <span>&rarr;</span>
        </button>
      </section>

      {/* LEARN MORE MODAL */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="How social data works"
        description="Inflixo uses publicly available profile information to display connected account details and calculate your Total Fanbase."
        icon={<Info className="h-5 w-5" />}
        size="xl"
        className="max-w-4xl lg:max-w-5xl"
      >
        <ModalBody className="p-4 sm:p-6 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: 7 Explanatory Feature Items */}
            <div className="lg:col-span-7 space-y-4">
              {/* Item 1 */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253]">
                  <BarChart2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#0f172a] leading-tight">
                    Reads public profile information
                  </h4>
                  <p className="mt-0.5 text-xs text-[#64748b] leading-relaxed">
                    We access publicly available data like followers, subscribers, profile avatar, and username to show your stats.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-[13px] font-bold text-[#0f172a] leading-tight">
                      AI-powered data insights
                    </h4>
                    <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F3] px-2 py-0.5 text-[10px] font-bold text-[#7A2253]">
                      ✨ Powered by AI
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#64748b] leading-relaxed">
                    Our AI analyzes your connected accounts to get accurate follower and subscriber counts, detect anomalies, and keep your Total Fanbase up to date.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253]">
                  <ShieldCheck className="h-4 w-4 text-[#10b981]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#0f172a] leading-tight">
                    Secure &amp; read-only access
                  </h4>
                  <p className="mt-0.5 text-xs text-[#64748b] leading-relaxed">
                    We never receive or store your social platform passwords. Your account remains safe and private.
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253]">
                  <RefreshCw className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#0f172a] leading-tight">
                    Auto-sync &amp; update
                  </h4>
                  <p className="mt-0.5 text-xs text-[#64748b] leading-relaxed">
                    Your follower counts and profile details are updated regularly using AI to ensure accurate Total Fanbase.
                  </p>
                </div>
              </div>

              {/* Item 5 */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253]">
                  <Unlink className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#0f172a] leading-tight">
                    Disconnect anytime
                  </h4>
                  <p className="mt-0.5 text-xs text-[#64748b] leading-relaxed">
                    You can disconnect any social account at any time with just one click.
                  </p>
                </div>
              </div>

              {/* Item 6 */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253]">
                  <Eye className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#0f172a] leading-tight">
                    Only public data is used
                  </h4>
                  <p className="mt-0.5 text-xs text-[#64748b] leading-relaxed">
                    We can only access information that is publicly visible on your social profiles.
                  </p>
                </div>
              </div>

              {/* Item 7 */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253]">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-[13px] font-bold text-[#0f172a] leading-tight">
                    Calculate Total Fanbase
                  </h4>
                  <p className="mt-0.5 text-xs text-[#64748b] leading-relaxed">
                    We combine followers/subscribers from all connected platforms using AI to show your Total Fanbase.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Visual Diagram */}
            <div className="lg:col-span-5 rounded-[5px] bg-[#FAF8FA] border border-[#F3E8EE] p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
              {/* Top AI Badge */}
              <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCE7F3] text-[#7A2253] px-3 py-1 text-xs font-bold shadow-2xs">
                  <span className="text-sm">🤖</span>
                  <span>AI Analyzes &amp; Syncs Data</span>
                </span>
              </div>

              {/* Curved dotted pink connectors down to 3 cards */}
              <div className="w-full flex justify-center -my-1">
                <svg className="w-full max-w-[260px] h-9 overflow-visible" viewBox="0 0 260 36" fill="none">
                  <path d="M 130 0 L 130 36" stroke="#F472B6" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M 130 0 C 130 18 45 14 45 36" stroke="#F472B6" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M 130 0 C 130 18 215 14 215 36" stroke="#F472B6" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
              </div>

              {/* 3 Connected Platform Cards */}
              <div className="grid grid-cols-3 gap-2">
                {/* Instagram */}
                <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-2 sm:p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB] text-white shadow-2xs mb-1">
                    <InstagramIcon className="h-3.5 w-3.5 fill-white" />
                  </div>
                  <span className="font-display text-xs sm:text-sm font-bold text-[#0f172a] leading-none">
                    {socials?.instagram?.followers ? formatCount(socials.instagram.followers) : "654"}
                  </span>
                  <span className="text-[10px] text-[#64748b] font-medium mt-0.5">Followers</span>
                </div>

                {/* YouTube */}
                <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-2 sm:p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF0000] text-white shadow-2xs mb-1">
                    <YoutubeIcon className="h-3.5 w-3.5 fill-white" />
                  </div>
                  <span className="font-display text-xs sm:text-sm font-bold text-[#0f172a] leading-none">
                    {socials?.youtube?.subscribers ? formatCount(socials.youtube.subscribers) : "11.8K"}
                  </span>
                  <span className="text-[10px] text-[#64748b] font-medium mt-0.5">Subscribers</span>
                </div>

                {/* Facebook */}
                <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-2 sm:p-2.5 text-center flex flex-col items-center justify-center shadow-2xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-2xs mb-1">
                    <FacebookIcon className="h-3.5 w-3.5 fill-white" />
                  </div>
                  <span className="font-display text-xs sm:text-sm font-bold text-[#0f172a] leading-none">
                    {socials?.facebook?.followers ? formatCount(socials.facebook.followers) : "1.8K"}
                  </span>
                  <span className="text-[10px] text-[#64748b] font-medium mt-0.5">Followers</span>
                </div>
              </div>

              {/* Curved dotted pink connectors down to Total Fanbase */}
              <div className="w-full flex justify-center -my-1 relative">
                <svg className="w-full max-w-[260px] h-9 overflow-visible" viewBox="0 0 260 36" fill="none">
                  <path d="M 130 0 L 130 36" stroke="#F472B6" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M 45 0 C 45 22 130 18 130 36" stroke="#F472B6" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M 215 0 C 215 22 130 18 130 36" stroke="#F472B6" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
                <span className="absolute left-4 top-1 text-[#F472B6] text-xs">✨</span>
                <span className="absolute right-4 top-1 text-[#F472B6] text-xs">✨</span>
              </div>

              {/* Total Fanbase Card */}
              <div className="rounded-[5px] border border-[#FCE7F3] bg-white p-3 sm:p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#FFF0F5] text-[#7A2253]">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[#64748b] leading-tight">Total Fanbase</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-display text-lg sm:text-xl font-bold text-[#0f172a] leading-none">
                          {totalAudience > 0 ? formatCount(totalAudience) : "14.3K"}
                        </span>
                        <TrendingUp className="h-3.5 w-3.5 text-[#7A2253]" />
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F3] px-2 py-0.5 text-[10px] font-bold text-[#7A2253]">
                    ✨ Calculated by AI
                  </span>
                </div>

                <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between gap-2">
                  <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&fit=crop&q=80" alt="Avatar 1" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&fit=crop&q=80" alt="Avatar 2" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&fit=crop&q=80" alt="Avatar 3" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="inline-block h-5 w-5 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&fit=crop&q=80" alt="Avatar 4" />
                    <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f1f5f9] text-[8px] font-bold text-[#475569] ring-2 ring-white">
                      +12K
                    </div>
                  </div>
                  <p className="text-[10px] text-[#64748b] font-medium truncate">
                    Your total audience across platforms
                  </p>
                </div>
              </div>

              {/* Bottom Tip Callout */}
              <div className="rounded-[5px] bg-[#FFF5F7] border border-[#FCE7F1] p-2.5 flex items-start gap-2 text-left">
                <span className="text-xs shrink-0">💡</span>
                <p className="text-[11px] text-[#7A2253] font-medium leading-snug">
                  V2 AI detects inactive or fake followers to give you more accurate and reliable numbers.
                </p>
              </div>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* 6. DISCONNECT CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(disconnectModal)}
        onClose={() => setDisconnectModal(null)}
        onConfirm={handleExecuteDisconnect}
        loading={submittingDisconnect}
        title={`Disconnect ${disconnectModal?.platformName}?`}
        description={`@${disconnectModal?.handle} will be removed from your Inflixo profile, and its audience count will no longer be included in Total Fanbase.`}
        confirmText="Disconnect Account"
        cancelText="Cancel"
      />
    </div>
  );
}

/* ==========================================================================
   BLUE VERIFIED BADGE & LAST UPDATED HELPER
   ========================================================================== */
function BlueVerifiedBadge({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.79-4-4-4-.495 0-.965.084-1.4.238C14.55 2.475 13.18 1.6 11.6 1.6c-1.58 0-2.95.875-3.6 2.148-.435-.154-.905-.238-1.4-.238-2.21 0-4 1.79-4 4 0 .495.084.965.238 1.4C1.575 9.55.7 10.92.7 12.5c0 1.58.875 2.95 2.148 3.6-.154.435-.238.905-.238 1.4 0 2.21 1.79 4 4 4 .495 0 .965-.084 1.4-.238.65 1.273 2.02 2.148 3.6 2.148 1.58 0 2.95-.875 3.6-2.148.435.154.905.238 1.4.238 2.21 0 4-1.79 4-4 0-.495-.084-.965-.238-1.4 1.273-.65 2.148-2.02 2.148-3.6z"
        fill="#1D9BF0"
      />
      <path
        d="M10.2 16.2l-3.5-3.5 1.4-1.4 2.1 2.1 5.3-5.3 1.4 1.4-6.7 6.7z"
        fill="#ffffff"
      />
    </svg>
  );
}

function formatLastUpdated(dateStr?: string | null): { label: string; time: string } {
  if (!dateStr) return { label: "Last updated", time: "recently" };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { label: "Last updated", time: "recently" };
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return { label: "Last updated", time: "just now" };
    if (diffHours < 24) return { label: "Last updated", time: `${diffHours} hours ago` };
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return { label: "Last updated", time: "yesterday" };
    if (diffDays < 30) return { label: "Last updated", time: `${diffDays} days ago` };
    return {
      label: "Last updated",
      time: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  } catch {
    return { label: "Last updated", time: "recently" };
  }
}

/* ==========================================================================
   CONNECTED SOCIAL CARD SUB-COMPONENT
   ========================================================================== */
interface ConnectedSocialCardProps {
  platformName: string;
  icon: React.ReactNode;
  handle: string;
  displayName: string;
  isVerified?: boolean;
  count: number;
  countLabel: string;
  lastSyncedAt?: string;
  profileUrl: string;
  isSyncing: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}

function ConnectedSocialCard({
  platformName,
  icon,
  handle,
  displayName,
  isVerified = true,
  count,
  countLabel,
  lastSyncedAt,
  profileUrl,
  isSyncing,
  onSync,
  onDisconnect,
}: ConnectedSocialCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const updatedInfo = formatLastUpdated(lastSyncedAt);

  return (
    <div className="rounded-[5px] border border-[#e2e8f0] bg-white p-4 sm:p-4.5 shadow-2xs transition-all duration-200 hover:border-[#cbd5e1] hover:shadow-xs text-left flex flex-col justify-between space-y-3.5">
      {/* 1. TOP ROW: Platform Icon & Name + Connected Badge & 3-dots */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0">{icon}</div>
          <h3 className="text-sm sm:text-base font-bold text-[#0f172a] truncate">
            {platformName}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#047857] bg-[#ecfdf5] border border-[#d1fae5] px-2.5 py-0.5 rounded-[5px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            Connected
          </span>

          {/* Three-dots menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer shadow-2xs"
              aria-label="More actions"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-40 rounded-[5px] border border-[#e2e8f0] bg-white p-1.5 shadow-lg z-50 space-y-0.5 animate-in fade-in">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={() => {
                    setMenuOpen(false);
                    onSync();
                  }}
                  className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-xs font-medium text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-[#64748b] ${isSyncing ? "animate-spin text-[#7A2253]" : ""}`}
                  />
                  <span>{isSyncing ? "Syncing..." : "Refresh data"}</span>
                </button>

                <div className="my-1 border-t border-[#e2e8f0]" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDisconnect();
                  }}
                  className="flex w-full items-center gap-2 rounded-[5px] px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE ROW: Username with Verified Badge + Count & Label */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-[#0f172a] truncate">
            {handle ? (handle.startsWith("@") ? handle : `@${handle}`) : `@${displayName}`}
          </span>
          {isVerified && <BlueVerifiedBadge className="h-3.5 w-3.5 shrink-0" />}
        </div>

        <div className="text-right shrink-0">
          <div className="font-display text-base sm:text-lg font-bold text-[#0f172a] leading-none">
            {formatCount(count)}
          </div>
          <div className="text-[11px] font-medium text-[#64748b] mt-0.5">
            {countLabel}
          </div>
        </div>
      </div>

      {/* 3. SUB-ROW: Calendar icon + Last updated */}
      <div className="flex items-start gap-2 text-xs text-[#64748b]">
        <Calendar className="h-3.5 w-3.5 text-[#94a3b8] shrink-0 mt-0.5" />
        <div className="text-[11px] leading-tight text-[#64748b]">
          <span>{updatedInfo.label}</span>
          <span className="block font-medium text-[#475569]">{updatedInfo.time}</span>
        </div>
      </div>

      {/* 4. BOTTOM ACTION: Full width View Profile button */}
      <div className="pt-0.5">
        {profileUrl ? (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-[5px] border border-[#FCE7F3] bg-[#FFF5F7] hover:bg-[#FCE7F3]/70 py-2 px-3 text-xs font-bold text-[#7A2253] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>View Profile</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#7A2253]" />
          </a>
        ) : (
          <div className="w-full rounded-[5px] border border-[#FCE7F3] bg-[#FFF5F7] py-2 px-3 text-xs font-bold text-[#7A2253]/60 flex items-center justify-center gap-1.5">
            <span>View Profile</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
