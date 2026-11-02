"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  ExternalLink,
  MoreVertical,
  RefreshCw,
  Plus,
  Share2,
  Users,
  EyeOff,
  Eye,
  Loader2,
  ArrowUpRight,
  Trash2,
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
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
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
  isHidden?: boolean;
  updatedAt?: string;
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
  const [togglingHideId, setTogglingHideId] = useState<number | null>(null);
  const [addingSecondary, setAddingSecondary] = useState(false);

  // Delete state
  const [accountToDelete, setAccountToDelete] = useState<SocialAccountRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modals
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addPlatform, setAddPlatform] = useState<"instagram" | "youtube" | "facebook">("instagram");

  // Draft handles for add modal
  const [draftInsta, setDraftInsta] = useState("");
  const [draftYt, setDraftYt] = useState("");
  const [draftFb, setDraftFb] = useState("");

  const rawPlanKey = (subscription?.planKey || "trial") as string;
  const canHideFromProfile = rawPlanKey === "pro" || rawPlanKey === "vip";

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

  // Primary accounts & Total Fans Calculation (Primary accounts only; recalculates dynamically)
  const primaryAccounts = useMemo(() => accounts.filter((a) => a.isPrimary), [accounts]);
  const primaryTotal = useMemo(
    () => primaryAccounts.reduce((sum, a) => sum + (Number(a.followerCount) || 0), 0),
    [primaryAccounts]
  );
  const effectiveFanbase = primaryTotal;

  const creatorEra = useMemo(() => getCreatorEra(effectiveFanbase), [effectiveFanbase]);
  const eraProgress = useMemo(() => getEraProgress(effectiveFanbase), [effectiveFanbase]);

  // Grouped by platform
  const instagramAccounts = useMemo(() => accounts.filter((a) => a.platform === "instagram"), [accounts]);
  const youtubeAccounts = useMemo(() => accounts.filter((a) => a.platform === "youtube"), [accounts]);
  const facebookAccounts = useMemo(() => accounts.filter((a) => a.platform === "facebook"), [accounts]);

  // Refresh primary account count
  const handleRefreshCount = async (account: SocialAccountRow) => {
    if (!account.isPrimary) return;
    setRefreshingId(account.id);
    if (account.platform === "facebook") {
      showToast("Fetching… this can take up to 20s");
    }
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

      await fetch(`/api/creator/socials/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

  // Delete account (recalculates total fans & era; auto-fetches count if oldest secondary is promoted to Primary)
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/creator/socials/${accountToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(json?.message || "Failed to remove account", "error");
        return;
      }

      const cleanHandle = (accountToDelete.username || "").replace(/^@/, "");
      showToast(`Removed @${cleanHandle} from your profile`);
      setAccountToDelete(null);

      // Refresh accounts list & creator context
      await fetchAccounts();
      refresh();

      // If the primary was deleted and an existing secondary was promoted to Primary, fetch its count automatically
      const promoted = json?.data?.promotedAccount;
      if (promoted && promoted.id) {
        const promotedRow: SocialAccountRow = {
          id: promoted.id,
          platform: promoted.platform as any,
          accountName: promoted.username,
          username: promoted.username,
          followerCount: 0,
          isPrimary: true,
        };
        await handleRefreshCount(promotedRow);
      }
    } catch (err) {
      console.error("Failed to remove account:", err);
      showToast("Could not remove account. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Toggle hide/show on public profile (Pro/VIP only)
  const handleToggleHide = async (account: SocialAccountRow) => {
    if (!canHideFromProfile) return;
    setTogglingHideId(account.id);
    const nextHidden = !Boolean(account.isHidden);
    try {
      const res = await fetch(`/api/creator/socials/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: nextHidden }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(json?.message || "Failed to update visibility", "error");
        return;
      }
      showToast(
        nextHidden
          ? `@${account.username} hidden from public profile`
          : `@${account.username} is now visible on your profile`
      );
      await fetchAccounts();
      refresh();
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      showToast("Could not update account visibility", "error");
    } finally {
      setTogglingHideId(null);
    }
  };

  // Add secondary account directly (username only, no count fetch)
  const handleAddSecondaryAccount = async () => {
    const rawDraft =
      addPlatform === "instagram"
        ? draftInsta
        : addPlatform === "youtube"
        ? draftYt
        : draftFb;
    const cleanUsername = rawDraft.trim().replace(/^@/, "");
    if (!cleanUsername) {
      showToast("Please enter a username", "error");
      return;
    }

    setAddingSecondary(true);
    try {
      const res = await fetch("/api/creator/socials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: addPlatform,
          username: cleanUsername,
          accountName: cleanUsername,
          followerCount: 0,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(json?.message || "Failed to add account", "error");
        return;
      }
      showToast(`Added @${cleanUsername} as a secondary account`);
      handleConfirmedAdd();
    } catch (err) {
      console.error("Failed to add secondary account:", err);
      showToast("Could not add account. Please try again.", "error");
    } finally {
      setAddingSecondary(false);
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

  const existingPrimaryForAddPlatform = useMemo(
    () => accounts.find((a) => a.platform === addPlatform && a.isPrimary) || null,
    [accounts, addPlatform]
  );

  const currentDraftValue =
    addPlatform === "instagram"
      ? draftInsta
      : addPlatform === "youtube"
      ? draftYt
      : draftFb;

  const setCurrentDraftValue = (val: string) => {
    const cleaned = val.trim().replace(/^@/, "");
    if (addPlatform === "instagram") setDraftInsta(cleaned);
    else if (addPlatform === "youtube") setDraftYt(cleaned);
    else setDraftFb(cleaned);
  };

  const platformRows = [
    {
      title: "Instagram",
      platform: "instagram" as const,
      icon: <InstagramIcon className="h-4 w-4 fill-white" />,
      iconBg: "bg-gradient-to-tr from-[#fd5949] via-[#d6249f] to-[#285AEB]",
      accounts: instagramAccounts,
    },
    {
      title: "YouTube",
      platform: "youtube" as const,
      icon: <YoutubeIcon className="h-4 w-4 fill-white" />,
      iconBg: "bg-[#FF0000]",
      accounts: youtubeAccounts,
    },
    {
      title: "Facebook",
      platform: "facebook" as const,
      icon: <FacebookIcon className="h-4 w-4 fill-white" />,
      iconBg: "bg-[#1877F2]",
      accounts: facebookAccounts,
    },
  ];

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

      {/* 2. COMPACT TOTAL FANS BAR (~72px max height, single row) */}
      <div className="space-y-1.5">
        <div className="rounded-[5px] border border-[#ECECF0] bg-white px-4 py-2.5 min-h-[56px] max-h-[72px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-wrap">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253]">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-[#18181B] tabular-nums leading-none whitespace-nowrap">
              {formatFans(effectiveFanbase)}
            </span>
            {creatorEra && <CreatorEraBadge badge={creatorEra.badge} />}
            {eraProgress.nextBadge && eraProgress.fansNeeded > 0 && (
              <span className="text-xs text-[#6B6B76] font-medium truncate hidden sm:inline">
                {formatFans(eraProgress.fansNeeded)} more to{" "}
                {eraProgress.nextBadge.replace(/ Creator$/, "")}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCelebrationOpen(true)}
            className="dash-btn-sm bg-[#7A2253] text-white shrink-0"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share era</span>
          </button>
        </div>

        <p className="text-xs text-[#6B6B76] px-0.5">
          Your first account on each platform is your primary account. Only primary accounts count toward your fans.
        </p>
      </div>

      {/* 3. PLATFORM SECTIONS (One section per platform) */}
      <div className="space-y-6">
        {platformRows.map((row) => {
          const primaryAcc = row.accounts.find((a) => a.isPrimary);
          const secondaryAccs = row.accounts.filter((a) => !a.isPrimary);
          const orderedAccounts = primaryAcc ? [primaryAcc, ...secondaryAccs] : secondaryAccs;
          const canAddMore = row.accounts.length < maxPerPlatform;

          return (
            <div key={row.platform} className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] ${row.iconBg}`}>
                    {row.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-[#18181B] flex items-center gap-1.5">
                    <span>{row.title}</span>
                    <span className="text-xs font-normal text-[#6B6B76] tabular-nums">
                      ({row.accounts.length}/{maxPerPlatform})
                    </span>
                  </h3>
                </div>

                {canAddMore ? (
                  <button
                    type="button"
                    onClick={() => openAddAccount(row.platform)}
                    className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[5px] border border-[#E2E8F0] bg-white hover:bg-[#F7EEF2] hover:border-[#7A2253]/30 text-xs font-semibold text-[#18181B] hover:text-[#7A2253] transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-[#94A3B8]">Max reached</span>
                )}
              </div>

              {/* Grid or Empty */}
              {loading ? (
                <div className="text-xs text-[#6B6B76] py-1">Loading...</div>
              ) : orderedAccounts.length === 0 ? (
                <div className="text-xs text-[#94A3B8] py-1">Not connected</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {orderedAccounts.map((acc) => (
                    <AccountCard
                      key={acc.id}
                      account={acc}
                      iconBg={row.iconBg}
                      platformIcon={row.icon}
                      isRefreshing={refreshingId === acc.id}
                      onRefresh={() => handleRefreshCount(acc)}
                      onDelete={() => setAccountToDelete(acc)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. FOOTER: HOW WE COUNT TEXT LINK */}
      <div className="pt-2 pb-4 flex justify-start">
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
        description="Connect your social media account to count your fanbase and showcase your public reach."
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

            {/* Primary vs Secondary Note */}
            {existingPrimaryForAddPlatform ? (
              <div className="rounded-[5px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#475569] leading-relaxed">
                Primary already linked (
                <span className="font-semibold text-[#0f172a]">
                  @{existingPrimaryForAddPlatform.username.replace(/^@/, "")}
                </span>
                ). This will be added as a secondary account — username only, no follower count.
              </div>
            ) : (
              <div className="rounded-[5px] border border-[#FCE7F3] bg-[#F7EEF2]/60 px-3 py-2 text-xs text-[#7A2253] leading-relaxed">
                This will be your primary account. We fetch followers/subscribers from this account only.
              </div>
            )}

            {/* If Primary already exists: username input + Add button (no fetch step) */}
            {existingPrimaryForAddPlatform ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc]">
                      {addPlatform === "instagram" && <InstagramIcon className="h-4 w-4 text-[#E1306C]" />}
                      {addPlatform === "youtube" && <YoutubeIcon className="h-4 w-4 text-[#FF0000]" />}
                      {addPlatform === "facebook" && <FacebookIcon className="h-4 w-4 text-[#1877F2]" />}
                    </span>
                    <input
                      type="text"
                      value={currentDraftValue}
                      onChange={(e) => setCurrentDraftValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && currentDraftValue.trim() && !addingSecondary) {
                          e.preventDefault();
                          handleAddSecondaryAccount();
                        }
                      }}
                      placeholder={
                        addPlatform === "instagram"
                          ? "Instagram username"
                          : addPlatform === "youtube"
                          ? "YouTube channel handle"
                          : "Facebook page username"
                      }
                      className="flex-1 h-9 px-3 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/60 bg-transparent outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!currentDraftValue.trim() || addingSecondary}
                    onClick={handleAddSecondaryAccount}
                    className="h-9 px-4 rounded-[5px] bg-[#7A2253] hover:bg-[#621b42] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0"
                  >
                    {addingSecondary ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    <span>{addingSecondary ? "Adding..." : "Add"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Primary flow: handle -> Fetch -> Confirm & Link */}
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
              </>
            )}
          </ModalBody>

          <ModalFooter className="px-5 sm:px-6 py-3.5">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="h-9 px-4 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </ModalFooter>
        </div>
      </Modal>

      {/* ==================================================================== */}
      {/* HOW WE COUNT INFO MODAL                                              */}
      {/* ==================================================================== */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="How We Count Fans & Creator Eras"
        description="Inflixo combines public follower & subscriber counts from your primary accounts."
        size="lg"
      >
        <ModalBody className="p-5 sm:p-6 text-left space-y-4 text-xs sm:text-sm text-[#475569] leading-relaxed">
          <div className="space-y-3">
            <div className="p-3 rounded-[5px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <h4 className="font-bold text-[#0f172a]">Primary accounts count</h4>
              <p className="text-xs text-[#64748b]">
                Your first account on each platform is your primary account. Only primary accounts (one per platform) are added to your Total Fans and Creator Era. Secondary accounts display your username and profile link without fetching follower counts.
              </p>
            </div>

            <div className="p-3 rounded-[5px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <h4 className="font-bold text-[#0f172a]">Public data only</h4>
              <p className="text-xs text-[#64748b]">
                We fetch public follower and subscriber counts directly for your primary accounts. No passwords or account permissions are ever requested or stored.
              </p>
            </div>

            <div className="p-3 rounded-[5px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <h4 className="font-bold text-[#0f172a]">Creator Era calculation</h4>
              <p className="text-xs text-[#64748b]">
                Your Creator Era updates based on the combined public counts of your connected primary accounts.
              </p>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(accountToDelete)}
        onClose={() => {
          if (!deleting) setAccountToDelete(null);
        }}
        title="Remove Account"
        icon={<Trash2 className="h-5 w-5 text-rose-600" />}
        size="sm"
      >
        <ModalBody className="p-5 text-left space-y-2">
          <p className="text-sm text-[#18181B]">
            Remove <span className="font-semibold">@{accountToDelete?.username.replace(/^@/, "")}</span> from your profile?
          </p>
          {accountToDelete?.isPrimary && (
            <p className="text-xs text-[#6B6B76]">
              If other accounts exist on this platform, the oldest secondary account will automatically become your new primary account and its follower count will be fetched.
            </p>
          )}
        </ModalBody>
        <ModalFooter className="px-5 py-3.5 flex justify-end gap-2">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setAccountToDelete(null)}
            className="h-8 px-3.5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDeleteAccount}
            className="h-8 px-3.5 rounded-[5px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{deleting ? "Removing..." : "Remove"}</span>
          </button>
        </ModalFooter>
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
   ACCOUNT CARD COMPONENT
   ========================================================================== */
interface AccountCardProps {
  account: SocialAccountRow;
  iconBg: string;
  platformIcon: React.ReactNode;
  isRefreshing: boolean;
  onRefresh: () => void;
  onDelete: () => void;
}

function AccountCard({
  account,
  iconBg,
  platformIcon,
  isRefreshing,
  onRefresh,
  onDelete,
}: AccountCardProps) {
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

  return (
    <div
      className={`rounded-[5px] border border-[#ECECF0] bg-white p-3.5 flex flex-col justify-between hover:border-[#cbd5e1] transition-colors h-full ${
        account.isHidden ? "opacity-75" : ""
      }`}
    >
      {/* Top Row: [platform icon/avatar] @handle + Primary/Secondary tag … ⋮ menu (top-right) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] ${iconBg}`}>
            {platformIcon}
          </div>
          <span className="font-semibold text-xs text-[#18181B] truncate max-w-[130px]" title={`@${cleanHandle}`}>
            @{cleanHandle}
          </span>
          {account.isPrimary ? (
            <span className="inline-flex items-center rounded-[4px] bg-[#F7EEF2] border border-[#FCE7F3] px-1.5 py-0.5 text-[10px] font-semibold text-[#7A2253]">
              Primary
            </span>
          ) : (
            <span className="inline-flex items-center rounded-[4px] bg-[#F1F5F9] border border-[#E2E8F0] px-1.5 py-0.5 text-[10px] font-medium text-[#64748B]">
              Secondary
            </span>
          )}
        </div>

        {/* ⋮ Menu (top-right) */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-6 w-6 items-center justify-center rounded-[4px] text-[#6B6B76] hover:text-[#18181B] hover:bg-[#ECECF0]/60 transition-colors cursor-pointer"
            aria-label="Account actions"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-[5px] border border-[#e2e8f0] bg-white p-1 shadow-lg z-50 space-y-0.5 animate-in fade-in duration-150">
              {account.isPrimary && (
                <button
                  type="button"
                  disabled={isRefreshing}
                  onClick={() => {
                    setMenuOpen(false);
                    onRefresh();
                  }}
                  className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-xs font-semibold text-[#0f172a] hover:bg-[#f1f5f9] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-[#64748b] ${
                      isRefreshing ? "animate-spin text-[#7A2253]" : ""
                    }`}
                  />
                  <span>{isRefreshing ? "Refreshing..." : "Refresh count"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex w-full items-center gap-2 rounded-[4px] px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary only: count + "followers/subscribers" */}
      {account.isPrimary ? (
        <div className="my-2.5">
          <div className="text-lg font-bold text-[#18181B] tabular-nums leading-tight">
            {formatFans(account.followerCount)}
          </div>
          <div className="text-[11px] text-[#6B6B76]">
            {account.platform === "youtube" ? "subscribers" : "followers"}
          </div>
        </div>
      ) : (
        <div className="my-2.5 flex-1" />
      )}

      {/* Bottom: "View ↗" link */}
      <div className="pt-1 mt-auto">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#64748B] hover:text-[#7A2253] hover:underline transition-colors w-fit"
        >
          <span>View</span>
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
