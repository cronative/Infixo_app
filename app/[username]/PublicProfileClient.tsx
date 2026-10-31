"use client";

import type { CreatorProduct } from "@/types";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Play, UserX, Home, Sparkles, Film, Users, Lock, ShieldAlert, ArrowRight, Clock, ExternalLink } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { SkeletonProfileCard } from "@/components/ui/Skeleton";
import { ProfileService } from "@/services/ProfileService";
import { SocialService } from "@/services/SocialService";
import { ThemeService, THEME_LIST } from "@/services/ThemeService";
import { SeriesService } from "@/services/SeriesService";
import { ThemeCard } from "@/themes/registry";
import { CreatorProfile, SocialAccounts, Series, ThemeKey, EMPTY_SOCIAL_ACCOUNTS, CreatorReview, MediaKitPackage, MediaKitSettings, CreatorSetupItem } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { buildProfileUrl } from "@/utils/format";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { CreatorPublicShell } from "@/components/public/CreatorPublicShell";
import { getPlanQuota } from "@/services/subscriptionLimits";
import { canUsePremiumLayout } from "@/config/plans";
import { DEFAULT_THEME_KEY, resolveThemeKey } from "@/lib/themeKeys";
import { setPublicTrackContext, trackProfileView } from "@/lib/publicTrack";

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
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (nowMs - actMs > sevenDaysMs) return true;
  }
  return false;
}

export default function PublicProfileClient({ forcedLayout }: { forcedLayout?: "tabs" | "premium" } = {}) {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams?.get("tab");
  const initialTab =
    rawTab === "series" || rawTab === "watch" ? "watch" :
    rawTab === "links" || rawTab === "explore" ? "links" :
    rawTab === "shop" || rawTab === "products" ? "shop" :
    rawTab === "setup" || rawTab === "about" || rawTab === "fanbase" ? "about" :
    rawTab === "reviews" || rawTab === "work" || rawTab === "collab" ? "collab" :
    undefined;
  const { showToast } = useToast();

  const [profile, setProfile] = useState<CreatorProfile>(EMPTY_PROFILE);
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [allSocialAccounts, setAllSocialAccounts] = useState<any[]>([]);
  const [theme, setTheme] = useState<ThemeKey>(DEFAULT_THEME_KEY);
  const queryTheme = (searchParams?.get("theme") || null) as ThemeKey | null;
  const effectiveTheme: ThemeKey =
    queryTheme && THEME_LIST.some((t) => t.key === queryTheme)
      ? queryTheme
      : theme;
  const [series, setSeries] = useState<Series[]>([]);
  const [customLinks, setCustomLinks] = useState<any[]>([]);
  const [mediaKitPackages, setMediaKitPackages] = useState<MediaKitPackage[]>([]);
  const [mediaKitSettings, setMediaKitSettings] = useState<MediaKitSettings | undefined>(undefined);
  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [team, setTeam] = useState<{ team?: any; members: any[] }>({ members: [] });
  const [brands, setBrands] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [setupItems, setSetupItems] = useState<CreatorSetupItem[]>([]);
  const [otherSocials, setOtherSocials] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [viewerIsOwner, setViewerIsOwner] = useState(false);

  useEffect(() => {
    try {
      const rawUser = decodeURIComponent(params.username ?? "").trim().replace(/^@/, "").toLowerCase();
      const storedUser = localStorage.getItem("inflixo_creator_profile");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const parsedHandle = (parsed?.username || "").replace(/^@/, "").toLowerCase();
        if (parsedHandle && rawUser && parsedHandle === rawUser) {
          setViewerIsOwner(true);
        }
      }
    } catch {}
  }, [params.username]);

  // Clicks are tracked only while this public page is mounted (see lib/publicTrack.ts).
  useEffect(() => () => setPublicTrackContext(null), []);

  useEffect(() => {
    async function loadData() {
      const rawUser = decodeURIComponent(params.username ?? "").trim();
      const usernameParam = rawUser.replace(/^@/, "").toLowerCase();
      if (!usernameParam) {
        setNotFound(true);
        setProfilePrivate(false);
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
          EXPERT_DEMO_GIGS,
          EXPERT_DEMO_REVIEWS,
          EXPERT_DEMO_SETUP_ITEMS,
          EXPERT_DEMO_PRODUCTS,
        } = await import("@/data/expertDemoCreator");
        setProfile(EXPERT_DEMO_PROFILE);
        setSocials(EXPERT_DEMO_SOCIALS);
        setSeries(EXPERT_DEMO_SERIES);
        setCustomLinks(EXPERT_DEMO_CUSTOM_LINKS);
        setMediaKitPackages(EXPERT_DEMO_GIGS);
        setReviews(EXPERT_DEMO_REVIEWS);
        setSetupItems(EXPERT_DEMO_SETUP_ITEMS);
        setProducts(EXPERT_DEMO_PRODUCTS);
        setTheme(EXPERT_DEMO_THEME);
        setSubscription({ planKey: "pro", status: "active" });
        setNotFound(false);
        setProfilePrivate(false);
        setLoaded(true);
        return;
      }

      // Fetch Creator Profile from MySQL Database (with local repository fallback for immediate preview)
      try {
        // One request for every section (cached 60s server-side for anonymous visitors).
        const all: Record<string, any> = await fetch(`/api/public/profile/${encodeURIComponent(usernameParam)}`)
          .then((r) => (r.ok ? r.json() : {}))
          .catch(() => ({}));
        const section = (key: string) => all?.[key] || { status: 0 };
        const profRes = section("profile");
        const socRes = section("socials");
        const serRes = section("series");
        const linkRes = section("links");
        const mediakitRes = section("mediakit");
        const revRes = section("reviews");
        const teamRes = section("team");
        const brandRes = section("brands");
        const collabRes = section("collaborations");
        const setupRes = section("setup");
        const otherSocRes = section("otherSocials");
        const secRes = section("sections");
        const productsRes = section("products");

        const isProfOk = profRes.status === 1 || profRes.success === true;
        const profile = profRes.data?.profile || profRes.profile;
        const subscription = profRes.data?.subscription || profRes.subscription;
        setSubscription(subscription);
        const isPrivateRes =
          profRes.status === 0 &&
          (profRes.data?.isPrivate === true ||
            profRes.isPrivate === true ||
            profRes.message === "Creator profile is private" ||
            profRes.error === "Creator profile is private");

        if (isPrivateRes) {
          setProfile({
            ...EMPTY_PROFILE,
            displayName: profRes.data?.displayName || profRes.displayName || usernameParam,
            username: profRes.data?.username || profRes.username || usernameParam,
            photoDataUrl: profRes.data?.photoUrl || profRes.photoUrl || null,
          });
          setProfilePrivate(true);
          setNotFound(false);
          setLoaded(true);
          return;
        }

        const rawProducts: CreatorProduct[] =
          productsRes.status === 1 && Array.isArray(productsRes.data?.products)
            ? productsRes.data.products
            : [];
        const quota = getPlanQuota(subscription?.planKey || "early_access");
        const visibleProducts =
          quota.maxProducts === Infinity
            ? rawProducts
            : rawProducts.slice(0, quota.maxProducts);
        setProducts(visibleProducts);

        if (isProfOk && profile && profile.username) {
          if (isFreeTrialExpired(subscription)) {
            setProfile(profile);
            setProfilePrivate(true);
            setNotFound(false);
            setLoaded(true);
            return;
          }

          setProfile(profile);
          if (profile.themeKey) {
            setTheme(resolveThemeKey(profile.themeKey));
          }
          setNotFound(false);
          setProfilePrivate(false);

          const links = linkRes.data?.links || linkRes.links;
          if ((linkRes.status === 1 || linkRes.success) && Array.isArray(links)) {
            setCustomLinks(links);
          } else {
            setCustomLinks([]);
          }

          const socials = socRes.data?.socials || socRes.socials;
          if ((socRes.status === 1 || socRes.success) && Array.isArray(socials)) {
            setAllSocialAccounts(socials);
            const accs: SocialAccounts = { ...EMPTY_SOCIAL_ACCOUNTS };
            socials.forEach((s: any) => {
              const isPrimary = Boolean(s.isPrimary || s.is_primary);
              const handle = s.username || s.accountName || "";
              if (s.platform === "instagram") {
                if (isPrimary || !accs.instagram.username) {
                  accs.instagram = {
                    ...accs.instagram,
                    followers: s.followerCount || 0,
                    username: handle,
                    url: handle ? `https://instagram.com/${handle.replace(/^@/, "")}` : "",
                  };
                }
              } else if (s.platform === "youtube") {
                if (isPrimary || !accs.youtube.username) {
                  accs.youtube = {
                    ...accs.youtube,
                    subscribers: s.followerCount || 0,
                    username: handle,
                    url: handle ? `https://youtube.com/@${handle.replace(/^@/, "")}` : "",
                  };
                }
              } else if (s.platform === "facebook") {
                if (isPrimary || !accs.facebook.username) {
                  accs.facebook = {
                    ...accs.facebook,
                    followers: s.followerCount || 0,
                    username: handle,
                    url: handle ? `https://facebook.com/${handle.replace(/^@/, "")}` : "",
                  };
                }
              }
            });
            setSocials(accs);
          } else {
            setSocials(EMPTY_SOCIAL_ACCOUNTS);
            setAllSocialAccounts([]);
          }

          const series = serRes.data?.series || serRes.series;
          if ((serRes.status === 1 || serRes.success) && Array.isArray(series)) {
            setSeries(series);
          } else {
            setSeries([]);
          }

          const packages = mediakitRes.data?.packages || mediakitRes.packages;
          if ((mediakitRes.status === 1 || mediakitRes.success) && Array.isArray(packages)) {
            setMediaKitPackages(packages);
          } else {
            setMediaKitPackages([]);
          }

          const mkSettings = mediakitRes.data?.settings || mediakitRes.settings;
          if ((mediakitRes.status === 1 || mediakitRes.success) && mkSettings) {
            setMediaKitSettings(mkSettings);
          }

          const reviews = revRes.data?.reviews || revRes.reviews;
          if ((revRes.status === 1 || revRes.success) && Array.isArray(reviews)) {
            setReviews(reviews);
          } else {
            setReviews([]);
          }

          const team = teamRes.data?.team || teamRes.team;
          const members = teamRes.data?.members || teamRes.members || [];
          if ((teamRes.status === 1 || teamRes.success) && team) {
            setTeam({ team, members });
          }

          const brands = brandRes.data?.brands || brandRes.brands;
          if ((brandRes.status === 1 || brandRes.success) && Array.isArray(brands)) {
            setBrands(brands);
          }

          const collabs = collabRes.data?.collaborations || collabRes.collaborations;
          if ((collabRes.status === 1 || collabRes.success) && Array.isArray(collabs)) {
            setCollaborations(collabs);
          }

          const setupItems = setupRes.data?.items || setupRes.items;
          if ((setupRes.status === 1 || setupRes.success) && Array.isArray(setupItems)) {
            setSetupItems(setupItems);
          }

          const otherSocials = otherSocRes.data?.otherSocials || otherSocRes.otherSocials;
          if ((otherSocRes.status === 1 || otherSocRes.success) && Array.isArray(otherSocials)) {
            setOtherSocials(otherSocials);
          }

          const sections = secRes.data?.sections || secRes.sections;
          if ((secRes.status === 1 || secRes.success) && Array.isArray(sections)) {
            setSections(sections);
          }

          setPublicTrackContext({ creatorId: profile.id, username: usernameParam, source: "public_profile" });
          trackProfileView();
        } else {
          // If profile is private, do not fallback to local profile
          if (isPrivateRes) {
            setProfilePrivate(true);
            setNotFound(false);
            setLoaded(true);
            return;
          }

          // Fallback to local profile if in same browser session for immediate view
          try {
            const {
              profileRepository,
              subscriptionRepository,
              socialRepository,
              seriesRepository,
              customLinksRepository,
              themeRepository,
              reviewsRepository,
              teamRepository,
              brandsRepository,
              collaborationsRepository,
              creatorSetupRepository,
              otherSocialsRepository,
              sectionsRepository,
            } = await import("@/repositories/localRepository");
            const local = profileRepository.get();
            const localSub = subscriptionRepository.get();

            // Guard against showing expired trial via local cache
            if (isFreeTrialExpired(localSub)) {
              if (local) {
                setProfile({ ...local, username: local.username || usernameParam });
              }
              setProfilePrivate(true);
              setNotFound(false);
              setLoaded(true);
              return;
            }

            const cleanLocalUser = (local?.username || "").replace(/^@/, "").toLowerCase();
            if (local && (cleanLocalUser === usernameParam || !local.username)) {
              setProfile({ ...local, username: local.username || usernameParam });
              setTheme(resolveThemeKey(themeRepository.get() || local.themeKey));
              setSocials(socialRepository.get() || EMPTY_SOCIAL_ACCOUNTS);
              setSeries(seriesRepository.getAll() || []);
              setCustomLinks(customLinksRepository.get() || []);
              setReviews(reviewsRepository.getAll() || []);
              setTeam(teamRepository.get() || { members: [] });
              setBrands(brandsRepository.getAll() || []);
              setCollaborations(collaborationsRepository.getAll() || []);
              setSetupItems(creatorSetupRepository.getAll() || []);
              setOtherSocials(otherSocialsRepository.getAll() || []);
              setSections(sectionsRepository.getAll() || []);
              setNotFound(false);
              setProfilePrivate(false);
              setLoaded(true);
              return;
            }
          } catch (localErr) {
            console.warn("Local fallback error:", localErr);
          }

          setNotFound(true);
          setProfilePrivate(false);
        }
      } catch (e) {
        console.warn("Failed to load creator profile from DB deeplink:", e);
        setNotFound(true);
        setProfilePrivate(false);
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
        .then((apiResponse) => {
          setUsernameAvailable(Boolean(apiResponse.data?.available ?? apiResponse.available));
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
    const pageImg = profile.photoDataUrl || "https://inflixo.com/logo-square.png";

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

  const queryLayout = searchParams?.get("layout");
  const creatorPlanKey = subscription?.planKey;
  const isProOrVip = canUsePremiumLayout(creatorPlanKey);
  const requestedPremium =
    profile.publicProfileLayout === "premium" ||
    (profile as any)?.visibilitySettings?.publicProfileLayout === "premium";

  const effectiveLayoutMode: "tabs" | "premium" =
    forcedLayout ||
    (queryLayout === "premium"
      ? "premium"
      : queryLayout === "tabs" || queryLayout === "simple"
        ? "tabs"
        : requestedPremium && isProOrVip
          ? "premium"
          : "tabs");

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

  if (profilePrivate) {
    const handle = profile.username || decodeURIComponent(params.username ?? "");
    const displayName = profile.displayName || `@${handle}`;

    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-12 text-center text-slate-900 overflow-hidden">
        {/* Ambient Warm Background Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />

        <main className="relative z-10 w-full max-w-md space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-center px-2">
            <Logo />
          </div>

          {/* Main Card */}
          <div className="rounded-[5px] border border-rose-100 bg-white/95 p-8 sm:p-10 shadow-2xl shadow-rose-950/5 backdrop-blur-xl space-y-6 text-center">
            {/* Avatar / Lock Badge */}
            <div className="relative mx-auto w-fit">
              <div className="h-20 w-20 rounded-full border-2 border-white shadow-xl ring-2 ring-rose-200 overflow-hidden bg-rose-50 flex items-center justify-center mx-auto">
                {profile.photoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoDataUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-rose-700 uppercase">
                    {(displayName[0] || handle[0] || "C").toUpperCase()}
                  </span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-[5px] bg-rose-500 text-white shadow-md ring-2 ring-white">
                <Lock className="h-3.5 w-3.5" />
              </span>
            </div>

            {viewerIsOwner ? (
              /* Case A: The Creator viewing their own profile */
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-[5px] bg-rose-50 border border-rose-200/80 px-3 py-1 text-xs font-bold text-rose-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>Free Trial Ended · Profile Hidden</span>
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  Your Public Profile is Currently Hidden
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal max-w-sm mx-auto">
                  Hey <strong>{displayName}</strong>, your 7-day free trial has expired. Your public profile (<code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">inflixo.com/@{handle}</code>) is currently hidden from fans and brand inquiries.
                </p>

                <div className="rounded-[5px] border border-rose-100 bg-rose-50/60 p-3 text-left space-y-1.5">
                  <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                    <span>What&apos;s paused:</span>
                  </p>
                  <p className="text-[11px] text-slate-600">
                    • Your bio link shows this inactive screen to visitors.<br />
                    • Brand collaboration requests and media kit are on hold.<br />
                    • Reactivating instantly restores your page and all data.
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => router.push("/dashboard/subscription")}
                    className="tap-scale w-full inline-flex items-center justify-center gap-2 rounded-[5px] bg-[#7A2253] hover:opacity-95 px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-[#7A2253]/20 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Reactivate My Profile (Choose Plan)</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full text-xs font-semibold text-slate-500 hover:text-slate-800 py-1.5 cursor-pointer"
                  >
                    Go to Creator Dashboard
                  </button>
                </div>
              </div>
            ) : (
              /* Case B: Public visitor / Fan / Brand */
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 rounded-[5px] bg-amber-50 border border-amber-200/80 px-3 py-1 text-xs font-semibold text-amber-800">
                  <Clock className="h-3 w-3 text-amber-600" />
                  <span>Profile Temporarily Inactive</span>
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  @{handle}&apos;s Space is Taking a Pause
                </h1>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal max-w-sm mx-auto">
                  This creator space on Inflixo is currently taking a short break. The creator may be updating their profile, refreshing their content, or renewing their space. Please check back again soon!
                </p>

                <div className="pt-3 space-y-3">
                  <button
                    onClick={() => router.push("/")}
                    className="tap-scale w-full inline-flex items-center justify-center gap-2 rounded-[5px] bg-[#7A2253] hover:opacity-95 px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-[#7A2253]/20 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Explore Inflixo Creators</span>
                  </button>

                  <p className="text-[11px] text-slate-400">
                    Are you @{handle}?{" "}
                    <button
                      onClick={() => router.push("/login")}
                      className="font-semibold text-[#7A2253] hover:underline cursor-pointer"
                    >
                      Sign in to reactivate your profile
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs font-semibold text-slate-400">
            Inflixo · The Creator Operating System
          </p>
        </main>
      </div>
    );
  }

  if (notFound) {
    const handle = decodeURIComponent(params.username ?? "");
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-12 text-center text-slate-900 overflow-hidden">
        {/* Ambient Maroon Background Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#7A2253]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />

        <main className="relative z-10 w-full max-w-md space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-center px-2">
            <Logo />
          </div>

          {/* Main Clean Light Theme Card */}
          <div className="rounded-[5px] border border-[#E8DCE4] bg-white/95 p-8 sm:p-10 shadow-2xl shadow-[#7A2253]/5 backdrop-blur-xl space-y-6 text-center">
            {/* Icon Badge */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[5px] bg-[#7A2253] text-white shadow-xl shadow-[#7A2253]/25 ring-4 ring-[#F6EBF1]">
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
                className="tap-scale w-full inline-flex items-center justify-center gap-2 rounded-[5px] bg-[#7A2253] hover:opacity-95 px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-[#7A2253]/20 transition-all border border-[#7A2253] hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Claim Handle &amp; Create Profile</span>
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
    <CreatorPublicShell themeKey={effectiveTheme} fixedViewport={true}>
        {/* Main Theme Profile Card (Renders Profile, Socials, Series, Services, Reviews & Custom Links) */}
        <ThemeCard
          themeKey={effectiveTheme}
          profile={profile}
          socials={socials}
          series={series}
          products={products}
          setupItems={setupItems}
          customLinks={customLinks}
          mediaKitPackages={mediaKitPackages}
          mediaKitSettings={mediaKitSettings}
          reviews={reviews}
          team={team}
          brands={brands}
          collaborations={collaborations}
          otherSocials={otherSocials}
          sections={sections}
          allSocialAccounts={allSocialAccounts}
          totalAudience={totalAudience}
          variant="full"
          containedScroll={false}
          layoutMode={effectiveLayoutMode}
          initialTab={initialTab}
          seriesOpenMode="page"
          seriesPreviewLimit={5}
          allSeriesHref={`/${handleStr.replace(/^@/, "")}/series`}
          productsPreviewLimit={handleStr.replace(/^@/, "") === "demo_creator" ? 9 : 6}
          allProductsHref={`/${handleStr.replace(/^@/, "")}/products`}
          reviewsPreviewLimit={3}
          allReviewsHref={`/${handleStr.replace(/^@/, "")}/reviews`}
        />
    </CreatorPublicShell>
  );
}
