"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ExternalLink,
  MoreVertical,
  Trash2,
  RefreshCw,
  Plus,
  Share2,
  Calendar,
  Sparkles,
  ShieldCheck,
  BarChart2,
  Users,
  X,
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
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { getCreatorEra, getEraProgress, formatFans } from "@/lib/creatorEra";
import { CreatorEraBadge } from "@/components/shared/CreatorEraBadge";
import { CreatorEraCelebrationModal } from "@/components/shared/CreatorEraCelebrationModal";
import { PLANS } from "@/config/plans";

interface SocialAccountRow {
  id: number;
  platform: "instagram" | "youtube" | "facebook";
  accountName: string;
  username: string;
  followerCount: number;
  mediaCount?: number;
  isVerified?: boolean;
  isPrimary: boolean;
  updatedAt?: string;
}

function formatRelativeUpdate(dateStr?: string | null): string {
  if (!dateStr) return "Updated recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Updated recently";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Updated just now";
    if (diffHours < 24) return `Updated ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Updated yesterday";
    if (diffDays < 30) return `Updated ${diffDays} days ago`;
    return `Updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  } catch {
    return "Updated recently";
  }
}

function buildAccountProfileUrl(platform: string, username: string): string {
  const clean = (username || "").replace(/^@/, "");
  if (platform === "instagram") return `https://instagram.com/${clean}`;
  if (platform === "youtube") return `https://youtube.com/@${clean}`;
  if (platform === "facebook") return `https://facebook.com/${clean}`;
  return "#";
}

export default function DashboardSocialsPage() {
  const { profile, subscription, refresh } = useCreator();
  const { showToast } = useToast();

  const [accounts, setAccounts] = useState<SocialAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);

  // Modals
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addPlatform, setAddPlatform] = useState<"instagram" | "youtube" | "facebook">("instagram");

  // Account removal
  const [accountToRemove, setAccountToRemove] = useState<SocialAccountRow | null>(null);
  const [submittingRemove, setSubmittingRemove] = useState(false);

  // Draft handles for add modal
  const [draftInsta, setDraftInsta] = useState("");
  const [draftYt, setDraftYt] = useState("");
  const [draftFb, setDraftFb] = useState("");

  const rawPlanKey = (subscription?.planKey || "trial") as string;
  const isTrial =
    rawPlanKey === "trial" ||
    rawPlanKey === "early_access" ||
    rawPlanKey === "free" ||
    subscription?.status === "trial";

  const maxPerPlatform =
    (PLANS as any)[rawPlanKey]?.limits?.socialAccountsPerPlatform ?? 5;

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/creator/socials");
      if (res.ok) {
        const json = await res.json();
        const list = json?.data?.socials || json?.socials || [];
        setAccounts(list);
      }
    } catch (err) {
      console.error("Failed to load socials:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Primary accounts & Total Fans Calculation
  const primaryAccounts = useMemo(() => accounts.filter((a) => a.isPrimary), [accounts]);
  const primaryTotal = useMemo(
    () => primaryAccounts.reduce((sum, a) => sum + (Number(a.followerCount) || 0), 0),
    [primaryAccounts]
  );
  const effectiveFanbase = useMemo(() => {
    return typeof profile.peakFanbase === "number" && profile.peakFanbase >= primaryTotal
      ? profile.peakFanbase
      : primaryTotal;
  }, [profile.peakFanbase, primaryTotal]);

  const creatorEra = useMemo(() => getCreatorEra(effectiveFanbase), [effectiveFanbase]);
  const eraProgress = useMemo(() => getEraProgress(effectiveFanbase), [effectiveFanbase]);

  // Grouped by platform
  const instagramAccounts = useMemo(() => accounts.filter((a) => a.platform === "instagram"), [accounts]);
  const youtubeAccounts = useMemo(() => accounts.filter((a) => a.platform === "youtube"), [accounts]);
  const facebookAccounts = useMemo(() => accounts.filter((a) => a.platform === "facebook"), [accounts]);

  // Refresh single account count
  const handleRefreshCount = async (account: SocialAccountRow) => {
    setRefreshingId(account.id);
    try {
      let followerCount = account.followerCount;
      let mediaCount = account.mediaCount || 0;
      let isVerified = account.isVerified ?? false;

      if (account.platform === "instagram") {
        const res = await fetch("/api/instagram/userInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: account.username }),
        });
        const json = await res.json();
        const u = json.data?.user || json.user;
        if (res.ok && u) {
          followerCount = Number(u.follower_count || 0);
          mediaCount = Number(u.media_count || 0);
          isVerified = Boolean(u.is_verified);
        }
      } else if (account.platform === "youtube") {
        const res = await fetch("/api/youtube/channelInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ handle: account.username }),
        });
        const json = await res.json();
        const c = json.data?.channel || json.channel;
        if (res.ok && c) {
          followerCount = Number(c.subscribers || 0);
          isVerified = Boolean(c.verified);
        }
      } else if (account.platform === "facebook") {
        const res = await fetch("/api/facebook/pageInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: account.username }),
        });
        const json = await res.json();
        const p = json.data?.page || json.page;
        if (res.ok && p) {
          followerCount = Number(p.followers || 0);
          mediaCount = Number(p.likes || 0);
          isVerified = Boolean(p.verified);
        }
      }

      await fetch("/api/creator/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: account.platform,
          username: account.username,
          accountName: account.accountName,
          followerCount,
          mediaCount,
          isVerified,
        }),
      });

      showToast(`Updated @${account.username} count to ${formatFans(followerCount)} fans ✨`);
      await fetchAccounts();
      refresh();
    } catch (err: any) {
      console.error("Failed to refresh count:", err);
      showToast("Could not refresh count. Please try again.", "error");
    } finally {
      setRefreshingId(null);
    }
  };

  // Remove account handler
  const handleExecuteRemove = async () => {
    if (!accountToRemove) return;
    setSubmittingRemove(true);
    try {
      const res = await fetch(`/api/creator/socials/${accountToRemove.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (data?.error === "REMOVE_NOT_ALLOWED_IN_TRIAL") {
          showToast("Account removal is not allowed on trial plans", "error");
        } else if (data?.error === "HAS_EXTRA_ACCOUNTS") {
          showToast("Cannot remove primary account while extra accounts exist", "error");
        } else {
          showToast(data?.message || "Failed to remove account", "error");
        }
        return;
      }

      showToast(`@${accountToRemove.username} removed successfully`);
      setAccountToRemove(null);
      await fetchAccounts();
      refresh();
    } catch (err) {
      console.error("Failed to remove account:", err);
      showToast("Could not remove account. Please try again.", "error");
    } finally {
      setSubmittingRemove(false);
    }
  };

  const openAddAccount = (platform?: "instagram" | "youtube" | "facebook") => {
    if (platform) setAddPlatform(platform);
    setAddModalOpen(true);
  };

  const handleConfirmedAdd = () => {
    setAddModalOpen(false);
    setDraftInsta("");
    setDraftYt("");
    setDraftFb("");
    fetchAccounts();
    refresh();
  };

  return (
    <PageContainer className="text-left">
      {/* 1. PAGE HEADER */}
      <PageHeader
        {...PAGE_COPY.socials}
        actions={
          <button type="button" onClick={() => openAddAccount()} className="dash-btn-primary">
            <span>+</span>
            <span>Add account</span>
          </button>
        }
      />

      {/* 2. HERO CARD (Requirement D) */}
      <SectionCard
        title="Total fans"
        subtitle="Across your primary accounts"
        icon={<Users className="h-4 w-4" />}
        action={
          <button type="button" onClick={() => setCelebrationOpen(true)} className="dash-btn-sm bg-[#7A2253] text-white">
            <Share2 className="h-3.5 w-3.5" />
            <span>Share era</span>
          </button>
        }
      >
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[28px] font-semibold text-(--text) tabular-nums leading-[1.25] whitespace-nowrap">
              {formatFans(effectiveFanbase)}
            </span>
            {creatorEra && <CreatorEraBadge badge={creatorEra.badge} />}
          </div>
          <p className="text-[13px] text-(--muted)">fans across your primary accounts</p>
          {eraProgress.nextBadge && eraProgress.fansNeeded > 0 && (
            <p className="text-xs font-medium text-(--primary)">
              {formatFans(eraProgress.fansNeeded)} more fans to{" "}
              {eraProgress.nextBadge.replace(/ Creator$/, "")} 🌟
            </p>
          )}
        </div>
      </SectionCard>

      {/* 3. GROUP BY PLATFORM (Instagram / YouTube / Facebook) */}
      <div className="space-y-5">
        {/* INSTAGRAM SECTION */}
        <PlatformSection
          title="Instagram"
          platform="instagram"
          icon={<InstagramIcon className="h-4 w-4 fill-white" />}
          iconBg="bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB]"
          accounts={instagramAccounts}
          countLabel="Followers"
          maxAllowed={maxPerPlatform}
          isTrial={isTrial}
          refreshingId={refreshingId}
          onRefresh={handleRefreshCount}
          onRemove={(acc) => {
            if (acc.isPrimary && instagramAccounts.length > 1) {
              showToast("Primary account cannot be removed while extra accounts exist", "error");
              return;
            }
            setAccountToRemove(acc);
          }}
          onAdd={() => openAddAccount("instagram")}
        />

        {/* YOUTUBE SECTION */}
        <PlatformSection
          title="YouTube"
          platform="youtube"
          icon={<YoutubeIcon className="h-4 w-4 fill-white" />}
          iconBg="bg-[#FF0000]"
          accounts={youtubeAccounts}
          countLabel="Subscribers"
          maxAllowed={maxPerPlatform}
          isTrial={isTrial}
          refreshingId={refreshingId}
          onRefresh={handleRefreshCount}
          onRemove={(acc) => {
            if (acc.isPrimary && youtubeAccounts.length > 1) {
              showToast("Primary account cannot be removed while extra accounts exist", "error");
              return;
            }
            setAccountToRemove(acc);
          }}
          onAdd={() => openAddAccount("youtube")}
        />

        {/* FACEBOOK SECTION */}
        <PlatformSection
          title="Facebook"
          platform="facebook"
          icon={<FacebookIcon className="h-4 w-4 fill-white" />}
          iconBg="bg-[#1877F2]"
          accounts={facebookAccounts}
          countLabel="Followers"
          maxAllowed={maxPerPlatform}
          isTrial={isTrial}
          refreshingId={refreshingId}
          onRefresh={handleRefreshCount}
          onRemove={(acc) => {
            if (acc.isPrimary && facebookAccounts.length > 1) {
              showToast("Primary account cannot be removed while extra accounts exist", "error");
              return;
            }
            setAccountToRemove(acc);
          }}
          onAdd={() => openAddAccount("facebook")}
        />
      </div>

      {/* 4. FOOTER: HOW WE COUNT TEXT LINK */}
      <div className="pt-2 pb-6 flex justify-center text-center">
        <button
          type="button"
          onClick={() => setIsInfoModalOpen(true)}
          className="text-xs text-[#64748b] hover:text-[#7A2253] hover:underline cursor-pointer transition-colors"
        >
          How we count fans &amp; creator eras
        </button>
      </div>

      {/* ==================================================================== */}
      {/* ADD ACCOUNT MODAL                                                   */}
      {/* ==================================================================== */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Social Account"
        description="Connect your social media account to count your fanbase and showcase your verified reach."
        icon={<Share2 className="h-5 w-5" />}
        size="md"
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <ModalBody className="p-5 sm:p-6 text-left space-y-4 flex-1 min-h-0 overflow-y-auto">
            {/* Platform Tabs */}
            <div className="flex items-stretch rounded-[5px] border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden divide-x divide-[#E2E8F0]">
              {(["instagram", "youtube", "facebook"] as const).map((plat) => {
                const active = addPlatform === plat;
                const label = plat === "instagram" ? "Instagram" : plat === "youtube" ? "YouTube" : "Facebook";
                return (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => setAddPlatform(plat)}
                    className={`group flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold transition-all cursor-pointer select-none ${
                      active
                        ? "bg-white text-[#7A2253] shadow-xs relative z-10"
                        : "bg-[#F8FAFC] text-[#64748b] hover:bg-slate-100 hover:text-[#0f172a]"
                    }`}
                  >
                    {plat === "instagram" && (
                      <InstagramIcon
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          active ? "text-[#E1306C]" : "text-[#64748b] group-hover:text-[#E1306C]"
                        }`}
                      />
                    )}
                    {plat === "youtube" && (
                      <YoutubeIcon
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          active ? "text-[#FF0000]" : "text-[#64748b] group-hover:text-[#FF0000]"
                        }`}
                      />
                    )}
                    {plat === "facebook" && (
                      <FacebookIcon
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          active ? "text-[#1877F2]" : "text-[#64748b] group-hover:text-[#1877F2]"
                        }`}
                      />
                    )}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form based on platform */}
            {addPlatform === "instagram" && (
              <div className="space-y-3 pt-1">
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
                <InstagramFetcher username={draftInsta} onConfirmSync={handleConfirmedAdd} />
              </div>
            )}

            {addPlatform === "youtube" && (
              <div className="space-y-3 pt-1">
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
                <YoutubeFetcher handle={draftYt} onConfirmSync={handleConfirmedAdd} />
              </div>
            )}

            {addPlatform === "facebook" && (
              <div className="space-y-3 pt-1">
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
                <FacebookFetcher username={draftFb} onConfirmSync={handleConfirmedAdd} />
              </div>
            )}
          </ModalBody>

          <ModalFooter className="px-5 sm:px-6 py-3.5">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </ModalFooter>
        </div>
      </Modal>

      {/* ==================================================================== */}
      {/* REMOVE CONFIRMATION MODAL (Red Button)                               */}
      {/* ==================================================================== */}
      <ConfirmModal
        isOpen={Boolean(accountToRemove)}
        onClose={() => setAccountToRemove(null)}
        onConfirm={handleExecuteRemove}
        loading={submittingRemove}
        title={`Remove ${accountToRemove?.platform === "youtube" ? "YouTube Channel" : accountToRemove?.platform === "instagram" ? "Instagram Profile" : "Facebook Page"}?`}
        description={`@${accountToRemove?.username} will be removed from your profile.${
          accountToRemove?.isPrimary
            ? " As your primary account, its followers will no longer be counted toward your Total Fanbase."
            : ""
        }`}
        confirmText="Remove Account"
        cancelText="Cancel"
      />

      {/* ==================================================================== */}
      {/* HOW WE COUNT INFO MODAL                                              */}
      {/* ==================================================================== */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="How We Count Fans & Creator Eras"
        description="Inflixo combines verified follower & subscriber counts from your public primary accounts."
        size="lg"
      >
        <ModalBody className="p-5 sm:p-6 text-left space-y-4 text-xs sm:text-sm text-[#475569] leading-relaxed">
          <div className="space-y-3">
            <div className="p-3 rounded-[5px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <h4 className="font-bold text-[#0f172a]">Primary accounts count</h4>
              <p className="text-xs text-[#64748b]">
                Only primary accounts (one per platform) are added to your Total Fanbase and Creator Era. Extra accounts are showcased on your profile and About tab without inflating your total fans.
              </p>
            </div>

            <div className="p-3 rounded-[5px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <h4 className="font-bold text-[#0f172a]">Public data only</h4>
              <p className="text-xs text-[#64748b]">
                We fetch public follower and subscriber counts directly. No passwords or account permissions are ever requested or stored.
              </p>
            </div>

            <div className="p-3 rounded-[5px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <h4 className="font-bold text-[#0f172a]">Your era never goes down</h4>
              <p className="text-xs text-[#64748b]">
                Once you reach a Creator Era milestone, that achievement is preserved even if subscriber counts fluctuate over time.
              </p>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* Celebration Modal */}
      <CreatorEraCelebrationModal
        isOpen={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        era={creatorEra}
        username={profile.username || "creator"}
        fanbase={effectiveFanbase}
      />
    </PageContainer>
  );
}

/* ==========================================================================
   PLATFORM SECTION COMPONENT
   ========================================================================== */
interface PlatformSectionProps {
  title: string;
  platform: "instagram" | "youtube" | "facebook";
  icon: React.ReactNode;
  iconBg: string;
  accounts: SocialAccountRow[];
  countLabel: string;
  maxAllowed: number;
  isTrial: boolean;
  refreshingId: number | null;
  onRefresh: (acc: SocialAccountRow) => void;
  onRemove: (acc: SocialAccountRow) => void;
  onAdd: () => void;
}

function PlatformSection({
  title,
  platform,
  icon,
  iconBg,
  accounts,
  countLabel,
  maxAllowed,
  isTrial,
  refreshingId,
  onRefresh,
  onRemove,
  onAdd,
}: PlatformSectionProps) {
  // Primary card first, then extras
  const primaryCard = accounts.find((a) => a.isPrimary);
  const extraCards = accounts.filter((a) => !a.isPrimary);
  const canAddMore = accounts.length < maxAllowed;

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-[5px] ${iconBg}`}>
            {icon}
          </div>
          <h3 className="text-[16px] font-semibold text-[#18181B]">{title}</h3>
          <span className="text-[12px] text-[#6B6B76] font-normal">
            ({accounts.length}/{maxAllowed})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-stretch">
        {/* Primary Account Card */}
        {primaryCard && (
          <SocialAccountCard
            account={primaryCard}
            platformTitle={title}
            icon={icon}
            iconBg={iconBg}
            countLabel={countLabel}
            isPrimary={true}
            isTrial={isTrial}
            isRefreshing={refreshingId === primaryCard.id}
            onRefresh={() => onRefresh(primaryCard)}
            onRemove={() => onRemove(primaryCard)}
          />
        )}

        {/* Extra Account Cards */}
        {extraCards.map((extra) => (
          <SocialAccountCard
            key={extra.id}
            account={extra}
            platformTitle={title}
            icon={icon}
            iconBg={iconBg}
            countLabel={countLabel}
            isPrimary={false}
            isTrial={isTrial}
            isRefreshing={refreshingId === extra.id}
            onRefresh={() => onRefresh(extra)}
            onRemove={() => onRemove(extra)}
          />
        ))}

        {/* Dashed Add Another Card */}
        {canAddMore && (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-[5px] border-2 border-dashed border-[#ECECF0] hover:border-[#7A2253]/50 bg-[#FAFAFB] hover:bg-[#FFF0F5]/30 p-5 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer h-full min-h-[148px] group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253] transition-colors">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-[13px] font-medium text-[#18181B] group-hover:text-[#7A2253] transition-colors">
              + Add another {title}
            </span>
            <span className="text-[12px] text-[#6B6B76]">
              {accounts.length === 0 ? "Connect your primary account" : "Connect secondary profile"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   INDIVIDUAL SOCIAL ACCOUNT CARD (Requirement D)
   ========================================================================== */
interface SocialAccountCardProps {
  account: SocialAccountRow;
  platformTitle: string;
  icon: React.ReactNode;
  iconBg: string;
  countLabel: string;
  isPrimary: boolean;
  isTrial: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onRemove: () => void;
}

function SocialAccountCard({
  account,
  platformTitle,
  icon,
  iconBg,
  countLabel,
  isPrimary,
  isTrial,
  isRefreshing,
  onRefresh,
  onRemove,
}: SocialAccountCardProps) {
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

  const cleanHandle = (account.username || "").replace(/^@/, "");
  const profileUrl = buildAccountProfileUrl(account.platform, cleanHandle);
  const relativeUpdate = formatRelativeUpdate(account.updatedAt);

  return (
    <div className="rounded-[5px] border border-[#ECECF0] bg-white p-4 transition-all duration-200 hover:border-[#cbd5e1] text-left flex flex-col justify-between space-y-3 min-h-[148px]">
      {/* Top: Icon + Handle + Primary Badge + ⋮ Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] ${iconBg}`}>
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold text-[#18181B] hover:text-[#7A2253] line-clamp-1 break-words hover:underline"
              >
                @{cleanHandle}
              </a>
              {isPrimary && (
                <span className="inline-flex items-center h-6 rounded-[5px] bg-[#F7EEF2] border border-[#FCE7F3] px-2 text-[12px] font-medium text-[#7A2253]">
                  Primary
                </span>
              )}
            </div>
            {!isPrimary && (
              <p className="text-[12px] text-[#6B6B76] font-normal leading-tight">
                Not counted in total fans
              </p>
            )}
          </div>
        </div>

        {/* Three dots menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#6B6B76] hover:text-[#18181B] hover:bg-[#FAFAFB] transition-colors cursor-pointer"
            aria-label="Account actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-[5px] border border-[#e2e8f0] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in duration-150">
              <button
                type="button"
                disabled={isRefreshing}
                onClick={() => {
                  setMenuOpen(false);
                  onRefresh();
                }}
                className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-xs font-semibold text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-[#64748b] ${isRefreshing ? "animate-spin text-[#7A2253]" : ""}`} />
                <span>{isRefreshing ? "Refreshing..." : "Refresh count"}</span>
              </button>

              {/* Remove option: hidden on trial per Requirement C */}
              {!isTrial && (
                <>
                  <div className="my-0.5 border-t border-[#f1f5f9]" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onRemove();
                    }}
                    className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-xs font-semibold text-[#ef4444] hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Count & Label */}
      <div className="pt-1 flex items-baseline justify-between">
        <div>
          <span className="text-xl sm:text-2xl font-black text-[#0f172a] tabular-nums tracking-tight">
            {formatFans(account.followerCount || 0)}
          </span>
          <span className="ml-1.5 text-xs text-[#64748b] font-medium">{countLabel}</span>
        </div>
      </div>

      {/* Bottom: Relative updated time + View profile */}
      <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[11px] text-[#94a3b8]">
        <span className="flex items-center gap-1 font-medium">
          <Calendar className="h-3 w-3" />
          <span>{relativeUpdate}</span>
        </span>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#7A2253] font-bold hover:underline inline-flex items-center gap-0.5"
        >
          <span>View</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
