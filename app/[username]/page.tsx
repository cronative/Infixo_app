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
import { CreatorProfile, SocialAccounts, Series, ThemeKey, EMPTY_SOCIAL_ACCOUNTS } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { buildProfileUrl } from "@/utils/format";
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

      // 1. Initial check for local profile if logged in creator
      const localProfile = ProfileService.getProfile();
      if (localProfile.username && localProfile.username.toLowerCase() === usernameParam) {
        setProfile(localProfile);
        setSocials(SocialService.getAccounts());
        setTheme(ThemeService.getSelectedTheme());
        setSeries(SeriesService.getAllLocal());
        setLoaded(true);
      }

      // 2. Fetch Creator Profile by username from MySQL DB (Universal Deeplinking!)
      try {
        const [profRes, socRes, serRes] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()),
          fetch(`/api/creator/socials?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()),
          fetch(`/api/series?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()),
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
    const shareText = `Check out ${profile.displayName ? `${profile.displayName}'s` : "my"} Inflixo profile to see fanbase stats, social channels & original series! 🎬✨`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName || "Creator"} on Inflixo`,
          text: shareText,
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
    const shareText = `Check out ${profile.displayName ? `${profile.displayName}'s` : "my"} Inflixo profile to see fanbase stats, social channels & original series! 🎬✨`;
    const success = await copyToClipboard(`${shareText}\n${fullUrl}`);
    if (success) {
      setCopied(true);
      showToast("Profile link & message copied! ✨");
      setTimeout(() => setCopied(false), 2000);
    } else {
      showToast("Couldn't copy link", "error");
    }
  }

  if (!loaded) {
    return (
      <div className="mx-auto max-w-lg px-5 py-10">
        <SkeletonProfileCard />
      </div>
    );
  }

  if (notFound) {
    const handle = decodeURIComponent(params.username ?? "");
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-purple-50/90 via-slate-50 to-white px-4 py-12 text-center text-slate-900 overflow-hidden">
        {/* Ambient Light Background Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-purple-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl" />

        <main className="relative z-10 w-full max-w-xl space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-between px-2">
            <Logo />
            <span className="rounded-full bg-purple-100 border border-purple-200/80 px-3.5 py-1 text-xs font-black text-purple-700 shadow-2xs">
              Creator Home by Inflixo
            </span>
          </div>

          {/* Main 404 Light Theme Card */}
          <div className="rounded-[32px] border border-purple-100 bg-white/90 p-8 sm:p-12 shadow-2xl shadow-purple-500/10 backdrop-blur-xl space-y-6 text-center">
            {/* Animated Icon Badge */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-purple-600/30 ring-4 ring-purple-100">
              <UserX className="h-10 w-10 stroke-[2.2]" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2.5">
              {usernameAvailable === true ? (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-black text-emerald-700 uppercase tracking-wider mb-1">
                    <Sparkles className="h-3 w-3 text-emerald-600" />
                    <span>@{handle} is Available 🎉</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    @{handle} is available
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                    Want this creator handle? Claim it now and set up your Inflixo page in minutes.
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    <span>CREATOR NOT FOUND</span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    @{handle} isn’t available
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                    This creator profile may have moved, changed its username, or is no longer available.
                  </p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {usernameAvailable === true ? (
                <button
                  onClick={() => router.push(`/login`)}
                  className="tap-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-purple-900/20 transition-all border border-purple-400/30 hover:scale-[1.02]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Claim @{handle}</span>
                </button>
              ) : (
                <button
                  onClick={() => router.push("/login")}
                  className="tap-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-purple-900/20 transition-all border border-purple-400/30 hover:scale-[1.02]"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Create Your Inflixo</span>
                </button>
              )}

              <button
                onClick={() => router.push("/")}
                className="tap-scale w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-6 py-3.5 text-xs font-black text-slate-700 transition-all hover:scale-[1.02]"
              >
                <Home className="h-4 w-4" />
                <span>Explore Inflixo</span>
              </button>
            </div>

            {/* Value Highlights Grid */}
            <div className="mt-8 border-t border-purple-100 pt-6 grid grid-cols-3 gap-2 text-left">
              <div className="rounded-2xl bg-purple-50/60 border border-purple-100 p-3">
                <Film className="h-4 w-4 text-purple-600 mb-1" />
                <p className="text-[11px] font-black text-slate-900">Series &amp; Parts</p>
                <p className="text-[9px] text-slate-500 font-medium">Keep content in order</p>
              </div>

              <div className="rounded-2xl bg-purple-50/60 border border-purple-100 p-3">
                <Users className="h-4 w-4 text-purple-600 mb-1" />
                <p className="text-[11px] font-black text-slate-900">Total Fanbase</p>
                <p className="text-[9px] text-slate-500 font-medium">Bring your audience together</p>
              </div>

              <div className="rounded-2xl bg-purple-50/60 border border-purple-100 p-3">
                <Sparkles className="h-4 w-4 text-purple-600 mb-1" />
                <p className="text-[11px] font-black text-slate-900">Creator Themes</p>
                <p className="text-[9px] text-slate-500 font-medium">Make it yours</p>
              </div>
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
      <main className="mx-auto max-w-2xl px-2.5 sm:px-8 py-4 sm:py-10 space-y-5">
        {/* Main Theme Profile Card (Renders Profile, Socials & Theme-Styled Series/Episodes) */}
        <ThemeCard
          themeKey={theme}
          profile={profile}
          socials={socials}
          series={series}
          totalAudience={totalAudience}
          variant="full"
          onShare={handleShare}
        />




      </main>
    </div>
  );
}
