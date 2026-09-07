"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Share2,
  ExternalLink,
  MoreVertical,
  ShieldCheck,
  Trash2,
  AtSign,
  Link2,
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
import { CustomLinksManager } from "@/components/socials/CustomLinksManager";
import { customLinksRepository, authRepository } from "@/repositories/localRepository";
import { formatCount, formatSyncDate } from "@/utils/format";

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
  const [customLinksCount, setCustomLinksCount] = useState(0);

  // Sync initial custom links count
  useEffect(() => {
    const local = customLinksRepository.get();
    if (Array.isArray(local)) {
      setCustomLinksCount(local.length);
    }
  }, []);

  // Draft handles for unconnected platforms
  const [draftInsta, setDraftInsta] = useState(() => extractUsername(socials?.instagram?.url || ""));
  const [draftYt, setDraftYt] = useState(() => extractUsername(socials?.youtube?.url || ""));
  const [draftFb, setDraftFb] = useState(() => extractUsername(socials?.facebook?.url || ""));

  // Connected handles & booleans (safe optional chaining)
  const instaConnectedHandle = extractUsername(socials?.instagram?.url || "") || socials?.instagram?.username || "";
  const ytConnectedHandle = extractUsername(socials?.youtube?.url || "") || socials?.youtube?.username || "";
  const fbConnectedHandle = extractUsername(socials?.facebook?.url || "") || socials?.facebook?.username || "";

  const isInstaConnected = Boolean(socials?.instagram?.url || (socials?.instagram?.followers ?? 0) > 0 || instaConnectedHandle);
  const isYtConnected = Boolean(socials?.youtube?.url || (socials?.youtube?.subscribers ?? 0) > 0 || ytConnectedHandle);
  const isFbConnected = Boolean(socials?.facebook?.url || (socials?.facebook?.followers ?? 0) > 0 || fbConnectedHandle);

  const connectedCount = [isInstaConnected, isYtConnected, isFbConnected].filter(Boolean).length;

  // Summary connected names list
  const connectedNamesText = useMemo(() => {
    const list: string[] = [];
    if (isInstaConnected) list.push("Instagram");
    if (isYtConnected) list.push("YouTube");
    if (isFbConnected) list.push("Facebook");
    if (list.length === 0) return "Connect platforms to show reach";
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list[0]}, ${list[1]} and ${list[2]}`;
  }, [isInstaConnected, isYtConnected, isFbConnected]);

  // Sync single platform trigger
  const handleSyncPlatform = async (platform: "instagram" | "youtube" | "facebook") => {
    setSyncingPlatform(platform);
    updateSocials({});
    showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} audience stats refreshed! ✨`);
    setTimeout(() => setSyncingPlatform(null), 400);
  };

  // Disconnect Execution
  const handleExecuteDisconnect = async () => {
    if (!disconnectModal) return;
    setSubmittingDisconnect(true);
    const { platform } = disconnectModal;
    const email = authRepository.getPendingEmail() || profile.email;

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
    <div className="space-y-4 sm:space-y-5 w-full pb-8">
      {/* 1. PAGE HEADER */}
      <div className="text-left">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#181716]">
          Links &amp; Socials
        </h1>
        <p className="text-xs sm:text-[13px] text-[#797570] font-medium mt-0.5">
          Connect your platforms and manage the links shown on your creator profile.
        </p>
      </div>

      {/* 2. CONNECTED PRESENCE SUMMARY (3 cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        {/* Card 1: Connected Accounts */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-3.5 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#797570] uppercase tracking-wider">
              Connected Accounts
            </span>
            <Share2 className="h-4 w-4 text-[#b85c6b]" />
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
            {connectedCount}
          </p>
          <p className="text-[11px] text-[#797570] font-medium truncate" title={connectedNamesText}>
            {connectedNamesText}
          </p>
        </div>

        {/* Card 2: Total Fanbase */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-3.5 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#797570] uppercase tracking-wider">
              Total Fanbase
            </span>
            <span className="text-base">❤️</span>
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
            {formatCount(totalAudience || 0)}
          </p>
          <p className="text-[11px] text-[#797570] font-medium">
            Combined connected audience
          </p>
        </div>

        {/* Card 3: Custom Links */}
        <div className="rounded-2xl border border-[#E7E3DC] bg-white p-3.5 sm:p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#797570] uppercase tracking-wider">
              Custom Links
            </span>
            <Link2 className="h-4 w-4 text-[#b85c6b]" />
          </div>
          <p className="font-display text-xl sm:text-2xl font-bold text-[#181716]">
            {customLinksCount} of 3
          </p>
          <p className="text-[11px] text-[#797570] font-medium">
            Shown on your public profile
          </p>
        </div>
      </section>

      {/* 3. SOCIAL ACCOUNTS SECTION */}
      <section className="space-y-2.5 sm:space-y-3 text-left">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-[#181716]">
              Social accounts
            </h2>
            <p className="text-[11px] text-[#797570] font-medium">
              Manage the platforms connected to your Inflixo profile.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#797570]">
            {connectedCount} connected
          </span>
        </div>

        {/* Connected Cards Grid (3 Columns) */}
        {connectedCount > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* INSTAGRAM CONNECTED CARD */}
            {isInstaConnected && (
              <ConnectedSocialCard
                platformName="Instagram"
                icon={
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs text-white">
                    <InstagramIcon className="h-4 w-4" />
                  </div>
                }
                handle={instaConnectedHandle}
                displayName={socials?.instagram?.name || "Instagram Profile"}
                isVerified={socials?.instagram?.isVerified}
                count={socials?.instagram?.followers || 0}
                countLabel="followers"
                lastSyncedAt={socials?.instagram?.lastSyncedAt || socials?.updatedAt}
                profileUrl={socials?.instagram?.url || `https://instagram.com/${instaConnectedHandle}`}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 shadow-xs text-white">
                    <YoutubeIcon className="h-4 w-4" />
                  </div>
                }
                handle={ytConnectedHandle}
                displayName={socials?.youtube?.channelTitle || "YouTube Channel"}
                isVerified={socials?.youtube?.isVerified}
                count={socials?.youtube?.subscribers || 0}
                countLabel="subscribers"
                lastSyncedAt={socials?.youtube?.lastSyncedAt || socials?.updatedAt}
                profileUrl={socials?.youtube?.url || `https://youtube.com/@${ytConnectedHandle}`}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-xs text-white">
                    <FacebookIcon className="h-4 w-4" />
                  </div>
                }
                handle={fbConnectedHandle}
                displayName={socials?.facebook?.name || "Facebook Page"}
                isVerified={socials?.facebook?.isVerified}
                count={socials?.facebook?.followers || 0}
                countLabel="followers"
                lastSyncedAt={socials?.facebook?.lastSyncedAt || socials?.updatedAt}
                profileUrl={socials?.facebook?.url || `https://facebook.com/${fbConnectedHandle}`}
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
        ) : null}

        {/* CONNECT ANOTHER PLATFORM SECTION */}
        {connectedCount < 3 && (
          <div className="space-y-2.5 pt-1">
            <h3 className="font-display text-[11px] font-bold text-[#797570] uppercase tracking-wider">
              {connectedCount === 0 ? "Connect your creator accounts" : "Connect another platform"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Instagram Unconnected */}
              {!isInstaConnected && (
                <div className="rounded-2xl border border-[#E7E3DC] bg-white p-3.5 sm:p-4 space-y-2.5 shadow-xs text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs text-white shrink-0">
                      <InstagramIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-xs sm:text-[13px] font-bold text-[#181716]">Instagram</h4>
                      <p className="text-[11px] text-[#797570]">Show profile &amp; followers.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#797570]" />
                      <input
                        type="text"
                        value={draftInsta}
                        onChange={(e) => setDraftInsta(e.target.value.trim().replace(/^@/, ""))}
                        placeholder="Instagram username"
                        className="w-full rounded-xl border border-[#E7E3DC] bg-white pl-8 pr-3 py-1.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#b85c6b] transition-colors"
                      />
                    </div>
                    <InstagramFetcher username={draftInsta} />
                  </div>
                </div>
              )}

              {/* YouTube Unconnected */}
              {!isYtConnected && (
                <div className="rounded-2xl border border-[#E7E3DC] bg-white p-3.5 sm:p-4 space-y-2.5 shadow-xs text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 shadow-xs text-white shrink-0">
                      <YoutubeIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-xs sm:text-[13px] font-bold text-[#181716]">YouTube</h4>
                      <p className="text-[11px] text-[#797570]">Show channel &amp; subscribers.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#797570]" />
                      <input
                        type="text"
                        value={draftYt}
                        onChange={(e) => setDraftYt(e.target.value.trim().replace(/^@/, ""))}
                        placeholder="YouTube channel handle"
                        className="w-full rounded-xl border border-[#E7E3DC] bg-white pl-8 pr-3 py-1.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#b85c6b] transition-colors"
                      />
                    </div>
                    <YoutubeFetcher handle={draftYt} />
                  </div>
                </div>
              )}

              {/* Facebook Unconnected */}
              {!isFbConnected && (
                <div className="rounded-2xl border border-[#E7E3DC] bg-white p-3.5 sm:p-4 space-y-2.5 shadow-xs text-left">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 shadow-xs text-white shrink-0">
                      <FacebookIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-xs sm:text-[13px] font-bold text-[#181716]">Facebook</h4>
                      <p className="text-[11px] text-[#797570]">Show page &amp; followers.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#797570]" />
                      <input
                        type="text"
                        value={draftFb}
                        onChange={(e) => setDraftFb(e.target.value.trim().replace(/^@/, ""))}
                        placeholder="Facebook page username"
                        className="w-full rounded-xl border border-[#E7E3DC] bg-white pl-8 pr-3 py-1.5 text-xs font-semibold text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#b85c6b] transition-colors"
                      />
                    </div>
                    <FacebookFetcher username={draftFb} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. CUSTOM LINKS SECTION */}
      <section className="text-left">
        <CustomLinksManager onChange={(links) => setCustomLinksCount(links.length)} />
      </section>

      {/* 5. HOW SOCIAL DATA WORKS (Disclosure Card) */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-[#FAF8F5]/80 p-3.5 sm:p-4 text-left space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#b85c6b]" />
            <h3 className="font-display text-xs sm:text-sm font-bold text-[#181716]">
              How social data works
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#17845B] bg-[#EAF7F0] px-2 py-0.5 rounded-full border border-[#17845B]/20">
            <span className="h-1 w-1 rounded-full bg-[#17845B]" />
            Public-data access active
          </span>
        </div>

        <p className="text-xs text-[#54514D] font-medium leading-relaxed">
          Inflixo uses supported public profile information to display connected accounts and calculate Total Fanbase.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-[#797570] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#b85c6b]" />
            <span>Reads supported public profile information</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#b85c6b]" />
            <span>Never receives your social-platform password</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#b85c6b]" />
            <span>Lets you disconnect an account when needed</span>
          </div>
        </div>

        <p className="text-[10px] text-[#797570]/80 pt-0.5">
          Required while social accounts are connected.
        </p>
      </section>

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
  isVerified,
  count,
  countLabel,
  lastSyncedAt,
  profileUrl,
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

  return (
    <div className="rounded-2xl border border-[#E7E3DC] bg-white p-3.5 sm:p-4 space-y-2.5 shadow-xs text-left flex flex-col justify-between">
      {/* Top: Icon & Connected Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">{icon}</div>
          <h3 className="font-display text-xs sm:text-[13px] font-bold text-[#181716] truncate">{platformName}</h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#17845B] bg-[#EAF7F0] px-2 py-0.5 rounded-full border border-[#17845B]/20 shrink-0">
          <span className="h-1 w-1 rounded-full bg-[#17845B]" />
          Connected
        </span>
      </div>

      {/* Identity & Audience */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <p className="font-bold text-xs sm:text-[13px] text-[#181716] truncate" title={displayName}>
            {displayName}
          </p>
          {isVerified && <ShieldCheck className="h-3.5 w-3.5 text-[#17845B] shrink-0" />}
        </div>
        <p className="text-[11px] text-[#797570] font-medium truncate">@{handle}</p>
        <p className="font-display text-xl sm:text-2xl font-bold text-[#181716] pt-0.5">
          {formatCount(count)}{" "}
          <span className="text-xs font-normal text-[#797570]">{countLabel}</span>
        </p>
      </div>

      {/* Bottom: Sync status & Actions */}
      <div className="pt-2 border-t border-[#E7E3DC] flex items-center justify-between text-[11px] text-[#797570]">
        <span className="truncate max-w-[130px]" title={lastSyncedAt ? formatSyncDate(lastSyncedAt) : "Synced"}>
          Synced {lastSyncedAt ? formatSyncDate(lastSyncedAt) : "just now"}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] px-2.5 py-1 text-xs font-semibold text-[#181716] transition-colors shadow-xs"
              title="Open profile in new tab"
            >
              <span>Open</span>
              <ExternalLink className="h-3 w-3 text-[#b85c6b]" />
            </a>
          )}

          {/* Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
              aria-label="More actions"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-38 rounded-xl border border-[#E7E3DC] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in">
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#797570]" />
                  <span>Open Profile</span>
                </a>

                <div className="my-1 border-t border-[#E7E3DC]" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDisconnect();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#C2414B] hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
