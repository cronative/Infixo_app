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
  RefreshCw,
  Info,
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
import { CustomLinksManager } from "@/components/socials/CustomLinksManager";
import { customLinksRepository, authRepository } from "@/repositories/localRepository";
import { formatCount } from "@/utils/format";
import { SocialService } from "@/services/SocialService";

function formatSimplifiedSyncDate(dateStr?: string | null): string {
  if (!dateStr) return "Updated recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Updated recently";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Updated recently";
    if (diffHours < 24) return `Updated ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Updated yesterday";
    if (diffDays < 7) return `Updated ${diffDays}d ago`;
    return `Last updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } catch {
    return "Updated recently";
  }
}

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
  const { profile, socials, totalAudience, updateSocials, refresh } = useCreator();
  const { showToast } = useToast();

  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [disconnectModal, setDisconnectModal] = useState<ConfirmDisconnectModal>(null);
  const [submittingDisconnect, setSubmittingDisconnect] = useState(false);
  const [customLinksCount, setCustomLinksCount] = useState(0);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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
      const email = profile.email || authRepository.getPendingEmail();
      const updated = await SocialService.fetchFromDb({ email, username: profile.username });
      if (updated) {
        updateSocials(updated);
      }
      showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} audience stats refreshed! ✨`);
    } catch {
      showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} audience stats refreshed! ✨`);
    } finally {
      setTimeout(() => setSyncingPlatform(null), 300);
    }
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
    <div className="space-y-6 w-full pb-12 text-left">
      {/* 1. PAGE HEADER */}
      <div>
        <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#181716] leading-tight">
          Links &amp; Socials
        </h1>
        <p className="text-sm sm:text-[15px] text-[#54514D] font-normal mt-1">
          Connect your platforms and manage the links shown on your creator profile.
        </p>
      </div>

      {/* 2. COMPACT SUMMARY LINE (Replaces 3 large summary cards) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E7E3DC] bg-white px-5 py-3.5 shadow-xs text-left">
        <div className="flex flex-wrap items-center gap-2.5 text-sm font-medium text-[#181716]">
          <span className="font-semibold text-[#181716]">{connectedCount} social accounts connected</span>
          <span className="text-[#797570]/40">·</span>
          <span className="font-semibold text-[#181716]">{formatCount(totalAudience || 0)} total fanbase</span>
          <span className="text-[#797570]/40">·</span>
          <span className="text-[#54514D] font-medium">{customLinksCount}/3 custom links</span>
        </div>
      </div>

      {/* 3. SOCIAL ACCOUNTS SECTION */}
      <section className="space-y-3 text-left">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#181716]">
            Social accounts
          </h2>
          <p className="text-xs sm:text-[13px] text-[#54514D] font-normal mt-0.5">
            Manage the platforms connected to your Inflixo profile.
          </p>
        </div>

        {/* Connected Cards Grid (3 Columns) */}
        {connectedCount > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* INSTAGRAM CONNECTED CARD */}
            {isInstaConnected && (
              <ConnectedSocialCard
                platformName="Instagram"
                icon={
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs text-white">
                    <InstagramIcon className="h-5 w-5" />
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
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-red-600 shadow-xs text-white">
                    <YoutubeIcon className="h-5 w-5" />
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
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600 shadow-xs text-white">
                    <FacebookIcon className="h-5 w-5" />
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
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-semibold text-[#797570] uppercase tracking-wider">
              {connectedCount === 0 ? "Connect your creator accounts" : "Connect another platform"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Instagram Unconnected */}
              {!isInstaConnected && (
                <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 space-y-3 shadow-xs text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-xs text-white shrink-0">
                      <InstagramIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#181716]">Instagram</h4>
                      <p className="text-xs text-[#797570]">Show profile &amp; followers.</p>
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
                        className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white pl-8 pr-3 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#151933] transition-colors"
                      />
                    </div>
                    <InstagramFetcher username={draftInsta} />
                  </div>
                </div>
              )}

              {/* YouTube Unconnected */}
              {!isYtConnected && (
                <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 space-y-3 shadow-xs text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-red-600 shadow-xs text-white shrink-0">
                      <YoutubeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#181716]">YouTube</h4>
                      <p className="text-xs text-[#797570]">Show channel &amp; subscribers.</p>
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
                        className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white pl-8 pr-3 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#151933] transition-colors"
                      />
                    </div>
                    <YoutubeFetcher handle={draftYt} />
                  </div>
                </div>
              )}

              {/* Facebook Unconnected */}
              {!isFbConnected && (
                <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 space-y-3 shadow-xs text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-600 shadow-xs text-white shrink-0">
                      <FacebookIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#181716]">Facebook</h4>
                      <p className="text-xs text-[#797570]">Show page &amp; followers.</p>
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
                        className="w-full h-10 rounded-xl border border-[#E7E3DC] bg-white pl-8 pr-3 text-xs sm:text-sm font-medium text-[#181716] placeholder:text-[#797570]/60 focus:outline-none focus:border-[#151933] transition-colors"
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

      {/* 17, 18, 19. HOW SOCIAL DATA WORKS (Compact Info Row + Learn more Modal) */}
      <section className="rounded-2xl border border-[#E7E3DC] bg-[#FAF8F5]/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs text-left">
        <div className="flex items-center gap-2 min-w-0">
          <Info className="h-4 w-4 text-[#151933] shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-[#181716] shrink-0">How social data works</span>
          <span className="hidden sm:inline text-[#797570]/40">·</span>
          <span className="text-xs text-[#54514D] font-normal truncate">
            Inflixo uses supported public profile information to calculate your Total Fanbase.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsInfoModalOpen(true)}
          className="text-xs font-semibold text-[#151933] hover:underline cursor-pointer shrink-0 self-start sm:self-auto"
        >
          Learn more
        </button>
      </section>

      {/* LEARN MORE MODAL */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="How social data works"
        description="Inflixo uses supported public profile information to display connected accounts and calculate Total Fanbase."
        icon={<Info className="h-4 w-4" />}
      >
        <ModalBody className="p-5 space-y-3 text-left">
          <div className="space-y-2.5 text-xs text-[#54514D]">
            <div className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#151933] mt-1.5 shrink-0" />
              <span>Reads supported public profile information to show follower and subscriber metrics.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#151933] mt-1.5 shrink-0" />
              <span>Never receives or stores your social platform passwords.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#151933] mt-1.5 shrink-0" />
              <span>Lets you disconnect an account at any time with one click.</span>
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

  return (
    <div className="rounded-2xl border border-[#E7E3DC] bg-white p-5 sm:p-6 space-y-4 shadow-xs text-left flex flex-col justify-between transition-all">
      {/* Top: Icon, Platform Name & Connected Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0">{icon}</div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#181716] truncate">{platformName}</h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17845B] bg-[#EAF7F0] px-2.5 py-1 rounded-full border border-[#17845B]/20 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[#17845B]" />
          Connected
        </span>
      </div>

      {/* Identity & Audience Hierarchy */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm sm:text-base text-[#181716] truncate" title={displayName}>
            {displayName}
          </p>
          {isVerified && <ShieldCheck className="h-4 w-4 text-[#17845B] shrink-0" />}
        </div>
        <p className="text-xs sm:text-[13px] text-[#797570] font-medium truncate">@{handle}</p>
        <div className="pt-2 flex items-baseline gap-1.5">
          <span className="font-display text-2xl sm:text-[28px] font-bold text-[#181716] leading-none">
            {formatCount(count)}
          </span>
          <span className="text-xs sm:text-[13px] font-normal text-[#797570]">{countLabel}</span>
        </div>
      </div>

      {/* Bottom: Sync status & Actions */}
      <div className="pt-3 border-t border-[#E7E3DC] flex items-center justify-between text-xs text-[#797570]">
        <span className="truncate max-w-[130px] sm:max-w-[150px]" title={lastSyncedAt ? formatSimplifiedSyncDate(lastSyncedAt) : "Updated recently"}>
          {formatSimplifiedSyncDate(lastSyncedAt)}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] px-3 py-1.5 text-xs font-semibold text-[#181716] transition-colors shadow-xs"
              title="View profile in new tab"
            >
              <span>View Profile</span>
              <ExternalLink className="h-3 w-3 text-[#797570]" />
            </a>
          )}

          {/* Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#FAF8F5] text-[#797570] hover:text-[#181716] transition-colors cursor-pointer shadow-xs"
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-40 rounded-xl border border-[#E7E3DC] bg-white p-1.5 shadow-lg z-50 space-y-0.5 animate-in fade-in">
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={() => {
                    setMenuOpen(false);
                    onSync();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#181716] hover:bg-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-[#797570] ${isSyncing ? "animate-spin text-[#151933]" : ""}`} />
                  <span>{isSyncing ? "Syncing..." : "Refresh data"}</span>
                </button>

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
