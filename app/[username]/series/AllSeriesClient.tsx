"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserX } from "lucide-react";
import { ThemeCard } from "@/themes/registry";
import { ThemeService, THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { SocialService } from "@/services/SocialService";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { isDarkTheme } from "@/components/onboarding/LivePreviewCard";
import {
  CreatorProfile,
  EMPTY_SOCIAL_ACCOUNTS,
  Series,
  SocialAccounts,
  ThemeKey,
} from "@/types";

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
  if (!subscription || subscription.planKey !== "early_access") return false;
  if (subscription.status && !["active", "trial"].includes(subscription.status)) return true;

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

interface SeriesCacheData {
  profile: CreatorProfile;
  socials: SocialAccounts;
  series: Series[];
  theme: ThemeKey;
  cachedAt: number;
}

// Module-level in-memory cache: prevents white screen & re-fetching on back navigation
const seriesListingMemoryCache = new Map<string, SeriesCacheData>();

export default function AllSeriesClient() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const rawUser = decodeURIComponent(params.username ?? "").trim();
  const username = rawUser.replace(/^@/, "").toLowerCase();
  const cachedData = username ? seriesListingMemoryCache.get(username) : undefined;

  const [profile, setProfile] = useState<CreatorProfile>(cachedData?.profile || EMPTY_PROFILE);
  const [socials, setSocials] = useState<SocialAccounts>(cachedData?.socials || EMPTY_SOCIAL_ACCOUNTS);
  const [series, setSeries] = useState<Series[]>(cachedData?.series || []);
  const [theme, setTheme] = useState<ThemeKey>(cachedData?.theme || "minimal-white");
  const [loaded, setLoaded] = useState(Boolean(cachedData));
  const [notFound, setNotFound] = useState(false);
  const fetchingRef = useRef(false);
  const prefetchedUserRef = useRef<string | null>(null);

  useEffect(() => {
    async function loadSeriesPage() {
      if (!username) {
        setNotFound(true);
        setLoaded(true);
        return;
      }

      // If we have fresh cached data (less than 60s old), skip network fetch completely
      const existingCache = seriesListingMemoryCache.get(username);
      if (existingCache && Date.now() - existingCache.cachedAt < 60000) {
        setProfile(existingCache.profile);
        setSocials(existingCache.socials);
        setSeries(existingCache.series);
        setTheme(existingCache.theme);
        setLoaded(true);
        setNotFound(false);
        return;
      }

      if (fetchingRef.current) return;
      fetchingRef.current = true;

      if (username === "demo_creator") {
        const {
          EXPERT_DEMO_PROFILE,
          EXPERT_DEMO_SOCIALS,
          EXPERT_DEMO_SERIES,
          EXPERT_DEMO_THEME,
        } = await import("@/data/expertDemoCreator");
        setProfile(EXPERT_DEMO_PROFILE);
        setSocials(EXPERT_DEMO_SOCIALS);
        setSeries(EXPERT_DEMO_SERIES);
        setTheme(EXPERT_DEMO_THEME);
        seriesListingMemoryCache.set(username, {
          profile: EXPERT_DEMO_PROFILE,
          socials: EXPERT_DEMO_SOCIALS,
          series: EXPERT_DEMO_SERIES,
          theme: EXPERT_DEMO_THEME,
          cachedAt: Date.now(),
        });
        setLoaded(true);
        fetchingRef.current = false;
        return;
      }

      try {
        const [profileRes, socialsRes, seriesRes] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(username)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/socials?username=${encodeURIComponent(username)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/series?username=${encodeURIComponent(username)}`).then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        const isProfOk = profileRes.status === 1 || profileRes.success === true;
        const freshProfile = profileRes.data?.profile || profileRes.profile;
        const freshSubscription = profileRes.data?.subscription || profileRes.subscription;

        if (
          !isProfOk ||
          !freshProfile?.username ||
          isFreeTrialExpired(freshSubscription) ||
          freshProfile.visibilitySettings?.showSeries === false
        ) {
          setNotFound(true);
          setLoaded(true);
          fetchingRef.current = false;
          return;
        }

        const freshTheme = (freshProfile.themeKey || "minimal-white") as ThemeKey;
        const rawSocials = socialsRes.data?.socials || socialsRes.socials;
        const freshSocials = Array.isArray(rawSocials) ? buildSocialAccounts(rawSocials) : EMPTY_SOCIAL_ACCOUNTS;
        const rawSeries = seriesRes.data?.series || seriesRes.series;
        const freshSeries = Array.isArray(rawSeries) ? rawSeries : [];

        setProfile(freshProfile);
        setTheme(freshTheme);
        setSocials(freshSocials);
        setSeries(freshSeries);
        setNotFound(false);

        // Update in-memory cache with timestamp
        seriesListingMemoryCache.set(username, {
          profile: freshProfile,
          socials: freshSocials,
          series: freshSeries,
          theme: freshTheme,
          cachedAt: Date.now(),
        });
      } catch (error) {
        console.warn("Failed to load all series page:", error);
        if (!seriesListingMemoryCache.has(username)) {
          setNotFound(true);
        }
      } finally {
        setLoaded(true);
        fetchingRef.current = false;
      }
    }

    loadSeriesPage();
  }, [username]);

  // Pre-fetch all series detail pages and main profile for instant navigation (only once per username)
  useEffect(() => {
    if (series && series.length > 0 && username && prefetchedUserRef.current !== username) {
      prefetchedUserRef.current = username;
      series.forEach((s) => {
        router.prefetch(`/${username}/series/${s.id}`);
      });
      router.prefetch(`/${username}`);
    }
  }, [series, username, router]);

  if (!loaded) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#f8fafc] text-[#043084]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#043084] border-t-transparent" />
          <p className="text-xs font-semibold text-[#64748b]">Loading series...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fafc] px-4 text-center">
        <div className="w-full max-w-sm rounded-[24px] border border-[#e2e8f0] bg-white p-8 shadow-xl shadow-[#043084]/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#043084] text-white">
            <UserX className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-display text-xl font-black text-[#043084]">Series not available</h1>
          <p className="mt-2 text-sm font-medium text-[#64748b]">
            This creator profile is private or the handle does not exist.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#043084] px-5 text-sm font-bold text-white"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  const themeMeta = ThemeService.getThemeMeta(theme);
  const pageBgStyle = themeMeta.outerBgClass || THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];
  const totalAudience = SocialService.calculateTotalAudience(socials);
  const cleanHandle = (profile.username || params.username || "creator").replace(/^@/, "");
  const seriesUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${cleanHandle}/series`
    : `https://inflixo.com/${cleanHandle}/series`;

  async function handleShareSeriesList() {
    const title = `${profile.displayName || cleanHandle}'s Series & Playlists on Inflixo`;
    const text = `Explore ${profile.displayName || cleanHandle}'s video series and playlists on Inflixo.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: seriesUrl });
        return;
      }

      const copied = await copyToClipboard(seriesUrl);
      showToast(copied ? "Series listing link copied! ✨" : "Could not copy link", copied ? "success" : "error");
    } catch {
      // User dismissed the native share sheet.
    }
  }

  const isDark = isDarkTheme(theme);
  const usesDarkControls = isDark || themeMeta.mode === "dark";

  return (
    <div
      style={{ backgroundColor: themeMeta.colors.pageBackground }}
      className="relative min-h-dvh flex flex-col transition-colors duration-500"
    >
      <div
        className={`fixed inset-0 pointer-events-none transition-colors duration-500 z-0 ${pageBgStyle}`}
        style={{ backgroundColor: themeMeta.colors.pageBackground }}
        aria-hidden="true"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[650px] bg-gradient-radial from-white/[0.06] to-transparent blur-3xl pointer-events-none" />
      </div>

      {themeMeta.animation?.type !== "none" && (
        <AmbientAnimation
          type={themeMeta.animation?.type || themeMeta.animationType}
          colors={themeMeta.animation?.colors || themeMeta.particleColors}
          themeKey={themeMeta.key}
        />
      )}
      <FocusOverlay overlay={themeMeta.focusOverlay} />

      <main className="relative z-10 h-dvh min-h-0 flex flex-col mx-auto w-full max-w-[620px] px-2.5 py-2.5 sm:py-3.5 overflow-hidden animate-fade-in-up">
        <button
          type="button"
          onClick={() => router.push(`/${cleanHandle}`)}
          style={{
            backgroundColor: usesDarkControls ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.85)",
            borderColor: usesDarkControls ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.1)",
            color: usesDarkControls ? "#FFFFFF" : themeMeta.colors.primaryText,
          }}
          className="tap-scale mb-2 inline-flex h-8 w-fit items-center gap-1.5 rounded-[10px] border px-3 text-xs font-bold shadow-xs backdrop-blur-md transition-all hover:opacity-90 cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Profile</span>
        </button>

        <ThemeCard
          themeKey={theme}
          profile={profile}
          socials={socials}
          series={series}
          customLinks={[]}
          mediaKitPackages={[]}
          reviews={[]}
          totalAudience={totalAudience}
          variant="full"
          containedScroll
          seriesOpenMode="page"
          seriesOnlyMode
          onShare={handleShareSeriesList}
        />
      </main>
    </div>
  );
}
