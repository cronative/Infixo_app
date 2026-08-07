"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Share2, Copy, QrCode, Play, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { SkeletonProfileCard } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProfileService } from "@/services/ProfileService";
import { SocialService } from "@/services/SocialService";
import { ThemeService, THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { SeriesService } from "@/services/SeriesService";
import { ThemeCard } from "@/themes/registry";
import { CreatorProfile, SocialAccounts, Series, ThemeKey, EMPTY_SOCIAL_ACCOUNTS } from "@/types";
import { useToast } from "@/contexts/ToastContext";

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
  const [theme, setTheme] = useState<ThemeKey>("modern-purple");
  const [series, setSeries] = useState<Series[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

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
            if (s.platform === "instagram") {
              accs.instagram = { ...accs.instagram, followers: s.followerCount || 0, url: s.accountName || "" };
            } else if (s.platform === "youtube") {
              accs.youtube = { ...accs.youtube, subscribers: s.followerCount || 0, url: s.accountName || "" };
            } else if (s.platform === "facebook") {
              accs.facebook = { ...accs.facebook, followers: s.followerCount || 0, url: s.accountName || "" };
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

  const totalAudience = SocialService.calculateTotalAudience(socials);
  const fullUrl = `https://inflixo.com/${profile.username}`;
  const pageBgStyle = THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["modern-purple"];

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: profile.displayName, url: fullUrl });
      } catch {
        // cancelled
      }
    } else {
      handleCopy();
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      showToast("Link copied to clipboard ✨");
    } catch {
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
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
        <Logo />
        <div className="mt-8 max-w-sm">
          <EmptyState
            icon={<Play className="h-5 w-5" />}
            title="Profile not found"
            description="This Inflixo page doesn't exist yet, or hasn't been published."
            action={
              <button onClick={() => router.push("/login")} className="text-sm font-semibold text-inflixo-purple">
                Go to Inflixo →
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-dvh transition-colors duration-300 ${pageBgStyle}`}>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/40 px-5 py-3.5 backdrop-blur-md safe-top sm:px-8">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white sm:hidden"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="hidden sm:block">
          <Logo size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
            aria-label="Copy link"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleShare}
            className="tap-scale flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black text-white shadow-lg transition-all hover:opacity-95"
            style={{ backgroundImage: "var(--gradient-premium)" }}
            aria-label="Share"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-10 space-y-6">
        {/* Main Theme Profile Card (Renders Profile, Socials & Theme-Styled Series/Episodes) */}
        <ThemeCard
          themeKey={theme}
          profile={profile}
          socials={socials}
          series={series}
          totalAudience={totalAudience}
          variant="full"
        />

        {/* Clean Theme-Aware QR Code & Profile Link Box */}
        <div className="flex items-center gap-4 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-5 text-white shadow-xl">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 border border-white/20">
            <QrCode className="h-8 w-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-white">inflixo.com/{profile.username}</p>
            <p className="text-xs text-white/70">Scan or copy to visit this profile</p>
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-xl bg-white/20 hover:bg-white/30 px-3.5 py-2 text-xs font-bold text-white transition-colors border border-white/20"
          >
            Copy Link
          </button>
        </div>
      </main>
    </div>
  );
}
