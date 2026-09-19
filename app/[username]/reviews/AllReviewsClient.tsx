"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserX } from "lucide-react";
import { ThemeCard } from "@/themes/registry";
import { ThemeService, THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { SocialService } from "@/services/SocialService";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { isDarkTheme } from "@/components/onboarding/LivePreviewCard";
import {
  CreatorProfile,
  CreatorReview,
  EMPTY_SOCIAL_ACCOUNTS,
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

  const explicitEnd = subscription.trialEndsAt || subscription.endsAt || subscription.currentPeriodEndsAt;
  const explicitEndMs = explicitEnd ? new Date(explicitEnd).getTime() : Number.NaN;
  if (!Number.isNaN(explicitEndMs)) return Date.now() > explicitEndMs;

  if (!subscription.activatedAt) return false;
  const activatedMs = new Date(subscription.activatedAt).getTime();
  if (Number.isNaN(activatedMs)) return false;

  return Date.now() - activatedMs > 7 * 24 * 60 * 60 * 1000;
}

function buildSocialAccounts(rows: Array<Record<string, unknown>>): SocialAccounts {
  const accounts: SocialAccounts = { ...EMPTY_SOCIAL_ACCOUNTS };

  rows.forEach((row) => {
    const platform = String(row.platform || "");
    const handle = String(row.username || row.accountName || "");
    const cleanHandle = handle.replace(/^@/, "");
    const count = Number(row.followerCount || 0);

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

export default function AllReviewsClient() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [theme, setTheme] = useState<ThemeKey>("minimal-white");
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadReviewsPage() {
      const rawUser = decodeURIComponent(params.username ?? "").trim();
      const username = rawUser.replace(/^@/, "").toLowerCase();

      if (!username) {
        setNotFound(true);
        setLoaded(true);
        return;
      }

      if (username === "demo_creator") {
        const {
          EXPERT_DEMO_PROFILE,
          EXPERT_DEMO_SOCIALS,
          EXPERT_DEMO_REVIEWS,
          EXPERT_DEMO_THEME,
        } = await import("@/data/expertDemoCreator");
        setProfile(EXPERT_DEMO_PROFILE);
        setSocials(EXPERT_DEMO_SOCIALS);
        setReviews(EXPERT_DEMO_REVIEWS);
        setTheme(EXPERT_DEMO_THEME);
        setLoaded(true);
        return;
      }

      try {
        const [profileRes, socialsRes, reviewsRes] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(username)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/socials?username=${encodeURIComponent(username)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/reviews?username=${encodeURIComponent(username)}&status=approved`).then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        if (
          !profileRes.success ||
          !profileRes.profile?.username ||
          isFreeTrialExpired(profileRes.subscription) ||
          profileRes.profile.visibilitySettings?.showReviews === false
        ) {
          setNotFound(true);
          setLoaded(true);
          return;
        }

        setProfile(profileRes.profile);
        setTheme((profileRes.profile.themeKey || "minimal-white") as ThemeKey);
        setSocials(Array.isArray(socialsRes.socials) ? buildSocialAccounts(socialsRes.socials) : EMPTY_SOCIAL_ACCOUNTS);
        setReviews(Array.isArray(reviewsRes.reviews) ? reviewsRes.reviews : []);
        setNotFound(false);
      } catch (error) {
        console.warn("Failed to load all reviews page:", error);
        setNotFound(true);
      } finally {
        setLoaded(true);
      }
    }

    loadReviewsPage();
  }, [params.username]);

  if (!loaded) {
    const handle = decodeURIComponent(params.username ?? "").trim();
    return <SyncingLoader message={`Syncing @${handle}'s reviews...`} fullScreen hideProgressBar={true} />;
  }

  if (notFound) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fafc] px-4 text-center">
        <div className="w-full max-w-sm rounded-[24px] border border-[#e2e8f0] bg-white p-8 shadow-xl shadow-[#043084]/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#043084] text-white">
            <UserX className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-display text-xl font-black text-[#043084]">Reviews not available</h1>
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
  const reviewsUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${cleanHandle}/reviews`
    : `https://inflixo.com/${cleanHandle}/reviews`;

  async function handleShareReviewsList() {
    const title = `${profile.displayName || cleanHandle}'s Reviews on Inflixo`;
    const text = `Read verified reviews for ${profile.displayName || cleanHandle} on Inflixo.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: reviewsUrl });
        return;
      }

      const copied = await copyToClipboard(reviewsUrl);
      showToast(copied ? "Reviews listing link copied! ✨" : "Could not copy link", copied ? "success" : "error");
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

      <main className="relative z-10 h-dvh min-h-0 flex flex-col mx-auto w-full max-w-[520px] px-2.5 py-2.5 sm:px-4 sm:py-3.5 overflow-hidden animate-fade-in-up">
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
          series={[]}
          customLinks={[]}
          mediaKitPackages={[]}
          reviews={reviews}
          totalAudience={totalAudience}
          variant="full"
          containedScroll
          seriesOpenMode="page"
          reviewsOnlyMode
          onShare={handleShareReviewsList}
        />
      </main>
    </div>
  );
}
