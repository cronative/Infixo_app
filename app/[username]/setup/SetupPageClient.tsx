"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { UserX } from "lucide-react";
import { ThemeCard } from "@/themes/registry";
import { SocialService } from "@/services/SocialService";
import { CreatorPublicShell } from "@/components/public/CreatorPublicShell";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import {
  CreatorProfile,
  CreatorSetupItem,
  EMPTY_SOCIAL_ACCOUNTS,
  SocialAccounts,
  ThemeKey,
} from "@/types";
import {
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_SETUP_ITEMS,
  EXPERT_DEMO_THEME,
} from "@/data/expertDemoCreator";
import { resolveThemeKey } from "@/lib/themeKeys";

const EMPTY_PROFILE: CreatorProfile = {
  photoDataUrl: null,
  displayName: "",
  username: "",
  category: null,
  bio: "",
  updatedAt: new Date().toISOString(),
};

function isFreeTrialExpired(subscription?: {
  planKey?: string;
  status?: string;
  activatedAt?: string | Date | null;
  trialEndsAt?: string | Date | null;
  endsAt?: string | Date | null;
  currentPeriodEndsAt?: string | Date | null;
}) {
  if (!subscription) return false;
  if (subscription.status && !["active", "trial"].includes(subscription.status)) return true;
  if (subscription.planKey && subscription.planKey !== "early_access" && subscription.planKey !== "trial" && subscription.planKey !== "free") return false;

  const nowMs = Date.now();
  const trialEndMs = subscription.trialEndsAt ? new Date(subscription.trialEndsAt).getTime() : 0;
  if (trialEndMs && nowMs > trialEndMs) return true;

  const periodEndMs = subscription.currentPeriodEndsAt
    ? new Date(subscription.currentPeriodEndsAt).getTime()
    : subscription.endsAt
      ? new Date(subscription.endsAt).getTime()
      : 0;
  if (periodEndMs && nowMs > periodEndMs) return true;

  if (subscription.activatedAt) {
    const actMs = new Date(subscription.activatedAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (nowMs - actMs > thirtyDaysMs) return true;
  }
  return false;
}

function buildSocialAccounts(rows: Array<Record<string, unknown>>): SocialAccounts {
  const accounts: SocialAccounts = { ...EMPTY_SOCIAL_ACCOUNTS };
  rows.forEach((row) => {
    const platform = String(row.platform || "").toLowerCase();
    const handle = String(row.username || row.accountName || "");
    const cleanHandle = handle.replace(/^@/, "");
    const count = Number(row.followerCount || row.followers || 0);

    if (platform === "instagram") {
      accounts.instagram = {
        ...accounts.instagram,
        followers: count,
        username: handle,
        url: cleanHandle ? `https://instagram.com/${cleanHandle}` : "",
      };
    } else if (platform === "youtube") {
      accounts.youtube = {
        ...accounts.youtube,
        subscribers: count,
        username: handle,
        url: cleanHandle ? `https://youtube.com/@${cleanHandle}` : "",
      };
    } else if (platform === "facebook") {
      accounts.facebook = {
        ...accounts.facebook,
        followers: count,
        username: handle,
        url: cleanHandle ? `https://facebook.com/${cleanHandle}` : "",
      };
    }
  });
  return accounts;
}

export default function SetupPageClient() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isPreview = searchParams?.get("preview") === "true";

  const rawUser = decodeURIComponent(params.username ?? "").trim();
  const username = rawUser.replace(/^@/, "").toLowerCase();

  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [setupItems, setSetupItems] = useState<CreatorSetupItem[]>([]);
  const [setupSettings, setSetupSettings] = useState<{ whereIStarted?: string | null }>({});
  const [theme, setTheme] = useState<ThemeKey>("inflixo-maroon");
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    async function loadSetupPage() {
      if (!username) {
        setNotFound(true);
        setLoaded(true);
        return;
      }

      if (fetchingRef.current) return;
      fetchingRef.current = true;

      if (username === "demo_creator") {
        setProfile(EXPERT_DEMO_PROFILE);
        setSocials(EXPERT_DEMO_SOCIALS);
        setSetupItems(EXPERT_DEMO_SETUP_ITEMS);
        setTheme(EXPERT_DEMO_THEME);
        setLoaded(true);
        fetchingRef.current = false;
        return;
      }

      try {
        const [profileRes, socialsRes, setupRes] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(username)}`, { cache: isPreview ? "no-store" : "default" }).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/socials?username=${encodeURIComponent(username)}`, { cache: isPreview ? "no-store" : "default" }).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/setup?username=${encodeURIComponent(username)}`, { cache: isPreview ? "no-store" : "default" }).then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        const isProfOk = profileRes.status === 1 || profileRes.success === true;
        const freshProfile = profileRes.data?.profile || profileRes.profile;
        const freshSubscription = profileRes.data?.subscription || profileRes.subscription;

        if (!isProfOk || !freshProfile?.username || (!isPreview && isFreeTrialExpired(freshSubscription))) {
          try {
            const { profileRepository, creatorSetupRepository } = await import("@/repositories/localRepository");
            const localProfile = profileRepository.get();
            if (localProfile && localProfile.username) {
              setProfile(localProfile);
              setSocials(SocialService.getAccounts() || EMPTY_SOCIAL_ACCOUNTS);
              setSetupItems(creatorSetupRepository.getAll() || []);
              setTheme(resolveThemeKey(localProfile.themeKey));
              setNotFound(false);
              setLoaded(true);
              fetchingRef.current = false;
              return;
            }
          } catch {}

          setNotFound(true);
          setLoaded(true);
          fetchingRef.current = false;
          return;
        }

        const freshTheme = resolveThemeKey(freshProfile.themeKey);
        const rawSocials = socialsRes.data?.socials || socialsRes.socials;
        const freshSocials = Array.isArray(rawSocials) ? buildSocialAccounts(rawSocials) : EMPTY_SOCIAL_ACCOUNTS;
        const freshItems = Array.isArray(setupRes.data?.items || setupRes.items)
          ? (setupRes.data?.items || setupRes.items)
          : [];
        const freshSettings = setupRes.data?.settings || setupRes.settings || {};

        setProfile(freshProfile);
        setTheme(freshTheme);
        setSocials(freshSocials);
        setSetupItems(freshItems);
        setSetupSettings(freshSettings);
        setNotFound(false);
      } catch (error) {
        console.warn("Failed to load setup page:", error);
        setNotFound(true);
      } finally {
        setLoaded(true);
        fetchingRef.current = false;
      }
    }

    loadSetupPage();
  }, [username, isPreview]);

  if (!loaded) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-white text-[#7A2253]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#7A2253] border-t-transparent" />
          <p className="text-xs font-semibold text-[#64748b]">Loading creator setup...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white px-4 text-center">
        <div className="w-full max-w-sm rounded-[5px] border border-[#e2e8f0] bg-white p-8 shadow-xl shadow-[#7A2253]/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-[#7A2253] text-white shadow-md shadow-[#7A2253]/20">
            <UserX className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-display text-xl font-black text-[#7A2253]">Setup not available</h1>
          <p className="mt-2 text-sm font-medium text-[#64748b]">
            This creator profile is private or the handle does not exist.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-[5px] bg-[#7A2253] px-5 text-sm font-bold text-white shadow-md shadow-[#7A2253]/20 transition-all hover:opacity-95"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  const totalAudience = SocialService.calculateTotalAudience(socials);
  const cleanHandle = (profile.username || params.username || "creator").replace(/^@/, "");
  const setupUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${cleanHandle}/setup`
      : `https://inflixo.com/${cleanHandle}/setup`;

  async function handleShareSetup() {
    const title = `${profile.displayName || cleanHandle}'s Creator Setup & Gear on Inflixo`;
    const text = `Explore the cameras, mics and editing gear used by ${profile.displayName || cleanHandle}.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: setupUrl });
        return;
      }

      const copied = await copyToClipboard(setupUrl);
      showToast(copied ? "Setup link copied! ✨" : "Could not copy link", copied ? "success" : "error");
    } catch {
      // User dismissed share sheet
    }
  }

  return (
    <CreatorPublicShell themeKey={theme} fixedViewport={true}>
      <ThemeCard
        themeKey={theme}
        profile={profile}
        socials={socials}
        series={[]}
        customLinks={[]}
        mediaKitPackages={[]}
        reviews={[]}
        setupItems={setupItems}
        setupSettings={setupSettings}
        totalAudience={totalAudience}
        variant="full"
        containedScroll={false}
        setupOnlyMode
        pageHeader={{ pageLabel: "My Setup", backHref: `/${cleanHandle}`, backLabel: "Back to profile" }}
        onShare={handleShareSetup}
      />
    </CreatorPublicShell>
  );
}

