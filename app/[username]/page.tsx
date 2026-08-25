"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, UserX, Home, Sparkles, Film, Users } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { SkeletonProfileCard } from "@/components/ui/Skeleton";
import { ProfileService } from "@/services/ProfileService";
import { SocialService } from "@/services/SocialService";
import { ThemeService, THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { SeriesService } from "@/services/SeriesService";
import { ThemeCard } from "@/themes/registry";
import { CreatorProfile, SocialAccounts, Series, ThemeKey, EMPTY_SOCIAL_ACCOUNTS, CreatorReview, MediaKitPackage, MediaKitSettings } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { buildProfileUrl } from "@/utils/format";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { copyToClipboard } from "@/lib/copyToClipboard";

const EMPTY_PROFILE: CreatorProfile = {
  photoDataUrl: null,
  displayName: "",
  username: "",
  category: null,
  bio: "",
  updatedAt: new Date().toISOString(),
};

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [theme, setTheme] = useState<ThemeKey>("minimal-white");
  const [series, setSeries] = useState<Series[]>([]);
  const [customLinks, setCustomLinks] = useState<any[]>([]);
  const [mediaKitPackages, setMediaKitPackages] = useState<MediaKitPackage[]>([]);
  const [mediaKitSettings, setMediaKitSettings] = useState<MediaKitSettings | undefined>(undefined);
  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadData() {
      const usernameParam = decodeURIComponent(params.username ?? "").trim().toLowerCase();
      if (!usernameParam) {
        setNotFound(true);
        setLoaded(true);
        return;
      }

      if (usernameParam === "demo_creator") {
        const {
          EXPERT_DEMO_PROFILE,
          EXPERT_DEMO_SOCIALS,
          EXPERT_DEMO_SERIES,
          EXPERT_DEMO_CUSTOM_LINKS,
          EXPERT_DEMO_THEME,
        } = await import("@/data/expertDemoCreator");
        setProfile(EXPERT_DEMO_PROFILE);
        setSocials(EXPERT_DEMO_SOCIALS);
        setSeries(EXPERT_DEMO_SERIES);
        setCustomLinks(EXPERT_DEMO_CUSTOM_LINKS);
        setTheme(EXPERT_DEMO_THEME);
        setNotFound(false);
        setLoaded(true);
        return;
      }

      // 1. Initial check for local profile if logged in creator
      const localProfile = ProfileService.getProfile();
      if (localProfile.username && localProfile.username.toLowerCase() === usernameParam) {
        setProfile(localProfile);
        setSocials(SocialService.getAccounts());
        setTheme(ThemeService.getSelectedTheme());
        setSeries(SeriesService.getAllLocal());
        setLoaded(true);
      }

      // 2. Fetch Creator Profile by username from MySQL DB (Universal Deeplinking & Server Data!)
      try {
        const [profRes, socRes, serRes, linkRes, mediakitRes, revRes] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/socials?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/series?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/custom-links?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/mediakit?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/reviews?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        if (profRes.success && profRes.profile) {
          setProfile(profRes.profile);
          if (profRes.profile.themeKey) {
            setTheme(profRes.profile.themeKey as ThemeKey);
          }
          setNotFound(false);
        } else if (!localProfile.username || localProfile.username.toLowerCase() !== usernameParam) {
          setNotFound(true);
        }

        if (linkRes.success && Array.isArray(linkRes.links)) {
          setCustomLinks(linkRes.links);
        }

        if (socRes.success && Array.isArray(socRes.socials)) {
          const accs: SocialAccounts = { ...EMPTY_SOCIAL_ACCOUNTS };
          socRes.socials.forEach((s: any) => {
            const handle = s.username || s.accountName || "";
            if (s.platform === "instagram") {
              accs.instagram = {
                ...accs.instagram,
                followers: s.followerCount || 0,
                username: handle,
                url: handle ? `https://instagram.com/${handle.replace(/^@/, "")}` : "",
              };
            } else if (s.platform === "youtube") {
              accs.youtube = {
                ...accs.youtube,
                subscribers: s.followerCount || 0,
                username: handle,
                url: handle ? `https://youtube.com/@${handle.replace(/^@/, "")}` : "",
              };
            } else if (s.platform === "facebook") {
              accs.facebook = {
                ...accs.facebook,
                followers: s.followerCount || 0,
                username: handle,
                url: handle ? `https://facebook.com/${handle.replace(/^@/, "")}` : "",
              };
            }
          });
          setSocials(accs);
        }

        if (serRes.success && Array.isArray(serRes.series)) {
          setSeries(serRes.series);
        }

        if (mediakitRes.success && Array.isArray(mediakitRes.packages)) {
          setMediaKitPackages(mediakitRes.packages);
        }
        if (mediakitRes.success && mediakitRes.settings) {
          setMediaKitSettings(mediakitRes.settings);
        }

        if (revRes.success && Array.isArray(revRes.reviews)) {
          setReviews(revRes.reviews);
        }
      } catch (e) {
        console.warn("Failed to load creator profile from DB deeplink:", e);
      } finally {
        setLoaded(true);
      }
    }
    loadData();
  }, [params.username]);

  // Dynamically check handle availability when profile is not found
  useEffect(() => {
    if (notFound && params.username) {
      const handle = decodeURIComponent(params.username).trim().toLowerCase();
      fetch(`/api/creator/check-username?username=${encodeURIComponent(handle)}`)
        .then((r) => r.json())
        .then((data) => {
          setUsernameAvailable(Boolean(data.available));
        })
        .catch(() => {
          setUsernameAvailable(false);
        });
    }
  }, [notFound, params.username]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!profile.displayName && !profile.username) return;

    const displayName = profile.displayName || profile.username || "Creator";
    const handle = profile.username || "creator";
    const pageTitle = `${displayName} (@${handle}) — Official Inflixo Creator Profile`;
    const pageDesc = profile.bio || `Check out ${displayName}'s official fanbase stats, connected social channels & original series on Inflixo.`;
    const pageUrl = `https://inflixo.com/${handle}`;
    const pageImg = profile.photoDataUrl || "https://inflixo.com/apple-icon.png";

    document.title = pageTitle;

    const setMeta = (nameOrProp: string, content: string, isProp = false) => {
      let el = document.querySelector(isProp ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (isProp) el.setAttribute("property", nameOrProp);
        else el.setAttribute("name", nameOrProp);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", pageDesc);
    setMeta("og:title", pageTitle, true);
    setMeta("og:description", pageDesc, true);
    setMeta("og:url", pageUrl, true);
    setMeta("og:image", pageImg, true);
    setMeta("og:type", "profile", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", pageDesc);
    setMeta("twitter:image", pageImg);

    let scriptEl = document.getElementById("json-ld-profile");
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = "json-ld-profile";
      scriptEl.setAttribute("type", "application/ld+json");
      document.head.appendChild(scriptEl);
    }

    scriptEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "mainEntity": {
        "@type": "Person",
        "name": displayName,
        "alternateName": `@${handle}`,
        "identifier": handle,
        "description": pageDesc,
        "image": pageImg,
        "url": pageUrl,
        "sameAs": [
          socials.instagram.url,
          socials.youtube.url,
          socials.facebook.url,
        ].filter(Boolean),
      },
    });
  }, [profile, socials]);

  const totalAudience = SocialService.calculateTotalAudience(socials);
  const handleStr = profile.username || decodeURIComponent(params.username ?? "username");
  const fullUrl = buildProfileUrl(handleStr);
  const pageBgStyle = THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName || "Creator"} on Inflixo`,
          url: fullUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  }

  async function handleCopy() {
    const success = await copyToClipboard(fullUrl);
    if (success) {
      setCopied(true);
      showToast("Profile link copied to clipboard! ✨");
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast("Couldn't copy link", "error");
    }
  }

  if (!loaded) {
    const handle = decodeURIComponent(params.username ?? "").trim();
    const syncMessage = handle ? `Syncing @${handle}'s creator page...` : "Syncing creator page & live reach...";
    return <SyncingLoader message={syncMessage} fullScreen hideProgressBar={true} />;
  }

  if (notFound) {
    const handle = decodeURIComponent(params.username ?? "");
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#F6EBF1]/60 via-slate-50 to-white px-4 py-12 text-center text-slate-900 overflow-hidden">
        {/* Ambient Maroon Background Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#803D63]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />

        <main className="relative z-10 w-full max-w-md space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-center px-2">
            <Logo />
          </div>

          {/* Main Clean Light Theme Card */}
          <div className="rounded-[32px] border border-[#E8DCE4] bg-white/95 p-8 sm:p-10 shadow-2xl shadow-[#803D63]/5 backdrop-blur-xl space-y-6 text-center">
            {/* Icon Badge */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#803D63] text-white shadow-xl shadow-[#803D63]/25 ring-4 ring-[#F6EBF1]">
              <UserX className="h-8 w-8 stroke-[2.2]" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2.5">
              <h1 className="font-display text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                No Profile Found for @{handle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
                Using this username on Inflixo, no profile has been created yet. If you want to create your creator profile with this handle, click below to get started.
              </p>
            </div>

            {/* Single Action Button */}
            <div className="pt-2">
              <button
                onClick={() => router.push("/login")}
                className="tap-scale w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-[#803D63]/20 transition-all border border-[#803D63] hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Create Profile</span>
              </button>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-400">
            Your fanbase. Your content. In order.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-dvh transition-colors duration-300 ${pageBgStyle}`}>
      <main className="mx-auto max-w-2xl px-2.5 sm:px-8 py-4 sm:py-10 space-y-5 animate-fade-in-up">
        {/* Main Theme Profile Card (Renders Profile, Socials, Series, Gigs, Reviews & Custom Links) */}
        <ThemeCard
          themeKey={theme}
          profile={profile}
          socials={socials}
          series={series}
          customLinks={customLinks}
          mediaKitPackages={mediaKitPackages}
          mediaKitSettings={mediaKitSettings}
          reviews={reviews}
          totalAudience={totalAudience}
          variant="full"
          onShare={handleShare}
        />




      </main>
    </div>
  );
}
