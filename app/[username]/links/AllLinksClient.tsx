"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { UserX } from "lucide-react";
import { ThemeCard } from "@/themes/registry";
import { CreatorPublicShell } from "@/components/public/CreatorPublicShell";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import {
  CreatorProfile,
  CustomLink,
  EMPTY_SOCIAL_ACCOUNTS,
  SocialAccounts,
  ThemeKey,
} from "@/types";
import {
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_CUSTOM_LINKS,
  EXPERT_DEMO_THEME,
} from "@/data/expertDemoCreator";
import { DEFAULT_THEME_KEY, resolveThemeKey } from "@/lib/themeKeys";
import { setPublicTrackContext } from "@/lib/publicTrack";
import { SocialService } from "@/services/SocialService";

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
    if (!Number.isNaN(actMs) && nowMs - actMs > 7 * 24 * 60 * 60 * 1000) return true;
  }
  return false;
}

export default function AllLinksClient() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const isPreview = searchParams?.get("preview") === "true";

  const rawUser = decodeURIComponent(params.username ?? "").trim();
  const username = rawUser.replace(/^@/, "").toLowerCase();

  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [allSocialAccounts, setAllSocialAccounts] = useState<any[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [theme, setTheme] = useState<ThemeKey>(DEFAULT_THEME_KEY);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => () => setPublicTrackContext(null), []);

  useEffect(() => {
    async function loadLinksPage() {
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
        setCustomLinks(EXPERT_DEMO_CUSTOM_LINKS);
        setTheme(EXPERT_DEMO_THEME);
        setLoaded(true);
        fetchingRef.current = false;
        return;
      }

      try {
        const all: Record<string, any> = await fetch(
          `/api/public/profile/${encodeURIComponent(username)}`,
          { cache: isPreview ? "no-store" : "default" }
        )
          .then((r) => (r.ok ? r.json() : {}))
          .catch(() => ({}));

        const section = (key: string) => all?.[key] || { status: 0 };
        const profRes = section("profile");
        const socRes = section("socials");
        const linkRes = section("links");

        const isProfOk = profRes.status === 1 || profRes.success === true;
        const freshProfile = profRes.data?.profile || profRes.profile;
        const subscription = profRes.data?.subscription || profRes.subscription;

        if (
          !isProfOk ||
          !freshProfile?.username ||
          (!isPreview && (isFreeTrialExpired(subscription) || freshProfile.visibilitySettings?.showCustomLinks === false))
        ) {
          // If in preview or owner, try local repository fallback
          try {
            const { profileRepository, customLinksRepository } = await import("@/repositories/localRepository");
            const localProfile = profileRepository.get();
            if (localProfile && localProfile.username) {
              setProfile(localProfile);
              setCustomLinks(customLinksRepository.get() || []);
              setSocials(SocialService.getAccounts() || EMPTY_SOCIAL_ACCOUNTS);
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
        const rawSocials = socRes.data?.socials || socRes.socials;
        const rawLinks = linkRes.data?.links || linkRes.links;

        setProfile(freshProfile);
        setTheme(freshTheme);
        if (Array.isArray(rawSocials)) {
          setAllSocialAccounts(rawSocials);
        }
        setCustomLinks(Array.isArray(rawLinks) ? rawLinks : []);
        setNotFound(false);
      } catch (error) {
        console.warn("Failed to load links page:", error);
        try {
          const { profileRepository, customLinksRepository } = await import("@/repositories/localRepository");
          const localProfile = profileRepository.get();
          if (localProfile && localProfile.username) {
            setProfile(localProfile);
            setCustomLinks(customLinksRepository.get() || []);
            setSocials(SocialService.getAccounts() || EMPTY_SOCIAL_ACCOUNTS);
            setTheme(resolveThemeKey(localProfile.themeKey));
            setNotFound(false);
            setLoaded(true);
            return;
          }
        } catch {}

        setNotFound(true);
      } finally {
        setLoaded(true);
        fetchingRef.current = false;
      }
    }

    loadLinksPage();
  }, [username, isPreview]);

  const cleanHandle = username || "creator";
  const totalAudience = allSocialAccounts.reduce((sum, a) => sum + (Number(a.followerCount) || 0), 0);

  const handleShareLinks = async () => {
    try {
      const shareUrl = typeof window !== "undefined" ? window.location.href : `https://inflixo.com/${cleanHandle}/links`;
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: `${profile.displayName || cleanHandle}'s Links`,
          url: shareUrl,
        });
        return;
      }
      const copied = await copyToClipboard(shareUrl);
      showToast(copied ? "Links page copied! ✨" : "Could not copy link", copied ? "success" : "error");
    } catch {
      // User dismissed share dialog
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-white text-[#7A2253]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#7A2253] border-t-transparent" />
          <p className="text-xs font-semibold text-[#64748b]">Loading links...</p>
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
          <h1 className="mt-5 font-display text-xl font-black text-[#7A2253]">Links not available</h1>
          <p className="mt-2 text-sm font-medium text-[#64748b]">
            This creator profile is private or the handle does not exist.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-[5px] bg-[#7A2253] px-5 text-xs font-bold text-white transition-all hover:bg-brand-hover cursor-pointer"
          >
            Explore Inflixo
          </button>
        </div>
      </div>
    );
  }

  return (
    <CreatorPublicShell themeKey={theme} fixedViewport={true}>
      <ThemeCard
        themeKey={theme}
        profile={profile}
        socials={socials}
        series={[]}
        products={[]}
        customLinks={customLinks}
        mediaKitPackages={[]}
        reviews={[]}
        allSocialAccounts={allSocialAccounts}
        totalAudience={totalAudience}
        variant="full"
        containedScroll={false}
        linksOnlyMode
        pageHeader={{ pageLabel: "Links", backHref: `/${cleanHandle}`, backLabel: "Back to profile" }}
        onShare={handleShareLinks}
      />
    </CreatorPublicShell>
  );
}
