"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import {
  CreatorProfile,
  SocialAccounts,
  Series,
  MediaKitPackage,
  MediaKitSettings,
  CreatorReview,
  TeamMember,
  CreatorTeam,
  ThemeKey,
  EMPTY_SOCIAL_ACCOUNTS,
} from "@/types";
import { ThemeCard } from "@/themes/registry";
import { Logo } from "@/components/shared/Logo";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useToast } from "@/contexts/ToastContext";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { CreatorPublicShell } from "@/components/public/CreatorPublicShell";
import { DEFAULT_THEME_KEY, resolveThemeKey } from "@/lib/themeKeys";
import { setPublicTrackContext, trackPublicEvent } from "@/lib/publicTrack";

export default function PublicMediaKitPage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [theme, setTheme] = useState<ThemeKey>(DEFAULT_THEME_KEY);
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [series, setSeries] = useState<Series[]>([]);
  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [settings, setSettings] = useState<MediaKitSettings | undefined>(undefined);
  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [team, setTeam] = useState<{ team?: CreatorTeam | null; members: TeamMember[] }>({ members: [] });
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => () => setPublicTrackContext(null), []);

  useEffect(() => {
    async function loadMediaKitData() {
      const rawUser = decodeURIComponent(params.username ?? "").trim();
      const usernameParam = rawUser.replace(/^@/, "").toLowerCase();
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
          EXPERT_DEMO_GIGS,
          EXPERT_DEMO_REVIEWS,
          EXPERT_DEMO_THEME,
          EXPERT_DEMO_MEDIA_KIT_SETTINGS,
          EXPERT_DEMO_TEAM,
        } = await import("@/data/expertDemoCreator");
        setProfile(EXPERT_DEMO_PROFILE);
        setSocials(EXPERT_DEMO_SOCIALS);
        setSeries(EXPERT_DEMO_SERIES);
        setPackages(EXPERT_DEMO_GIGS);
        setSettings(EXPERT_DEMO_MEDIA_KIT_SETTINGS);
        setReviews(EXPERT_DEMO_REVIEWS);
        setTeam(EXPERT_DEMO_TEAM);
        setTheme(EXPERT_DEMO_THEME);
        setLoaded(true);
        setNotFound(false);
        return;
      }

      try {
        const [
          profRes,
          socRes,
          serRes,
          mediakitRes,
          revRes,
          teamRes,
        ] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/socials?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/series?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/mediakit?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/reviews?username=${encodeURIComponent(usernameParam)}&status=approved`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/team?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        const isProfOk = profRes.status === 1 || profRes.success === true;
        const fetchedProfile = profRes.data?.profile || profRes.profile;

        if (isProfOk && fetchedProfile && fetchedProfile.username) {
          setProfile(fetchedProfile);
          setPublicTrackContext({ creatorId: fetchedProfile.id, username: usernameParam, source: "public_mediakit" });
          trackPublicEvent("media_kit_view");
          setTheme(resolveThemeKey(fetchedProfile.themeKey));
          setNotFound(false);

          const rawSocials = socRes.data?.socials || socRes.socials;
          if ((socRes.status === 1 || socRes.success) && Array.isArray(rawSocials)) {
            const accs: SocialAccounts = { ...EMPTY_SOCIAL_ACCOUNTS };
            rawSocials.forEach((s: any) => {
              if (s.isHidden || s.is_hidden) return;
              const isPrimary = Boolean(s.isPrimary || s.is_primary);
              const handle = s.username || "";
              if (s.platform === "instagram" && (isPrimary || !accs.instagram.username)) {
                accs.instagram = {
                  ...accs.instagram,
                  followers: isPrimary ? (s.followerCount || 0) : accs.instagram.followers,
                  username: handle,
                  url: handle ? `https://instagram.com/${handle.replace(/^@/, "")}` : "",
                };
              } else if (s.platform === "youtube" && (isPrimary || !accs.youtube.username)) {
                accs.youtube = {
                  ...accs.youtube,
                  subscribers: isPrimary ? (s.followerCount || 0) : accs.youtube.subscribers,
                  username: handle,
                  url: handle ? `https://youtube.com/@${handle.replace(/^@/, "")}` : "",
                };
              } else if (s.platform === "facebook" && (isPrimary || !accs.facebook.username)) {
                accs.facebook = {
                  ...accs.facebook,
                  followers: isPrimary ? (s.followerCount || 0) : accs.facebook.followers,
                  username: handle,
                  url: handle ? `https://facebook.com/${handle.replace(/^@/, "")}` : "",
                };
              }
            });
            setSocials(accs);
          }

          const rawSeries = serRes.data?.series || serRes.series;
          if ((serRes.status === 1 || serRes.success) && Array.isArray(rawSeries)) {
            setSeries(rawSeries);
          }

          const rawPackages = mediakitRes.data?.packages || mediakitRes.packages;
          if ((mediakitRes.status === 1 || mediakitRes.success) && Array.isArray(rawPackages)) {
            setPackages(rawPackages);
          }
          const mkSettings = mediakitRes.data?.settings || mediakitRes.settings;
          if ((mediakitRes.status === 1 || mediakitRes.success) && mkSettings) {
            setSettings(mkSettings);
          }

          const rawReviews = revRes.data?.reviews || revRes.reviews;
          if ((revRes.status === 1 || revRes.success) && Array.isArray(rawReviews)) {
            setReviews(rawReviews);
          }

          const rawTeam = teamRes.data?.team || teamRes.team;
          const rawMembers = teamRes.data?.members || teamRes.members || rawTeam?.members || [];
          if ((teamRes.status === 1 || teamRes.success) && rawTeam) {
            setTeam({ team: rawTeam, members: rawMembers });
          }
        } else {
          setNotFound(true);
        }
      } catch (e) {
        console.warn("Failed to load media kit data:", e);
        setNotFound(true);
      } finally {
        setLoaded(true);
      }
    }
    loadMediaKitData();
  }, [params.username]);

  // Support ?download=pdf query param to trigger server-side A4 PDF download
  useEffect(() => {
    if (!loaded || !profile || typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("download") !== "pdf") return;
    const cleanHandle = (profile.username || params.username || "creator").replace(/^@/, "");
    window.location.href = `/api/creator/mediakit/pdf?username=${encodeURIComponent(cleanHandle)}`;
  }, [loaded, profile, params.username]);

  if (!loaded) {
    return <SyncingLoader message="Loading Official Creator Media Kit..." fullScreen hideProgressBar={true} />;
  }

  if (notFound || !profile) {
    const handle = decodeURIComponent(params.username ?? "");
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-white px-4 py-12 text-center text-[#17131A]">
        <div className="max-w-md space-y-6">
          <Logo />
          <div className="rounded-[5px] border border-[#ECE8EB] bg-white p-8 space-y-4 shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[5px] bg-[#F7EDF3] text-[#7A2253]">
              <UserX className="h-7 w-7" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#17131A]">Media Kit Not Found</h1>
            <p className="text-xs text-[#6F6872]">No creator media kit registered for @{handle}.</p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-2.5 rounded-[5px] bg-[#7A2253] text-white text-xs font-semibold hover:opacity-95 shadow-md shadow-[#7A2253]/20 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalAudience =
    (socials.instagram?.followers || 0) +
    (socials.youtube?.subscribers || 0) +
    (socials.facebook?.followers || 0);

  const cleanHandle = (profile.username || params.username || "creator").replace(/^@/, "");
  const mediaKitUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${cleanHandle}/mediakit`
      : `https://inflixo.com/${cleanHandle}/mediakit`;

  async function handleShareMediaKit() {
    const title = `${profile?.displayName || cleanHandle} — Media Kit on Inflixo`;
    const text = `Explore ${profile?.displayName || cleanHandle}'s editorial media kit & collaboration packages on Inflixo.`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: mediaKitUrl });
        return;
      }
      const copied = await copyToClipboard(mediaKitUrl);
      showToast(copied ? "Media kit link copied! ✨" : "Could not copy link", copied ? "success" : "error");
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
        series={series}
        customLinks={[]}
        mediaKitPackages={packages}
        mediaKitSettings={settings}
        reviews={reviews}
        team={team}
        totalAudience={totalAudience}
        variant="full"
        containedScroll={false}
        seriesOpenMode="page"
        mediaKitOnlyMode
        pageHeader={{
          pageLabel: "Media Kit",
          backHref: `/${cleanHandle}`,
          backLabel: "Back to profile",
        }}
        onShare={handleShareMediaKit}
      />
    </CreatorPublicShell>
  );
}

