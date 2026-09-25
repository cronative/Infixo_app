"use client";

import type { CreatorProduct } from "@/types";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, UserX, Home, Sparkles, Film, Users } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { SkeletonProfileCard } from "@/components/ui/Skeleton";
import { ProfileService } from "@/services/ProfileService";
import { SocialService } from "@/services/SocialService";
import { ThemeService } from "@/services/ThemeService";
import { SeriesService } from "@/services/SeriesService";
import { ThemeCard } from "@/themes/registry";
import { CreatorProfile, SocialAccounts, Series, ThemeKey, EMPTY_SOCIAL_ACCOUNTS, CreatorReview, MediaKitPackage, MediaKitSettings, CreatorSetupItem } from "@/types";
import { useToast } from "@/contexts/ToastContext";
import { buildProfileUrl } from "@/utils/format";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { CreatorPublicShell } from "@/components/public/CreatorPublicShell";
import { getPlanQuota } from "@/services/subscriptionLimits";

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
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (nowMs - actMs > sevenDaysMs) return true;
  }
  return false;
}

function getPublicVisitorId() {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem("inflixo_vid");
  if (existing) return existing;
  const next = `v_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  localStorage.setItem("inflixo_vid", next);
  return next;
}

function getPageViewEventId(creatorId: string, username: string, visitorId: string) {
  const navigationStart = typeof performance !== "undefined" ? Math.floor(performance.timeOrigin) : Date.now();
  return `profile:${creatorId}:${username}:${visitorId}:${navigationStart}`;
}

export default function PublicProfileClient() {
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
  const [team, setTeam] = useState<{ team?: any; members: any[] }>({ members: [] });
  const [brands, setBrands] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [setupItems, setSetupItems] = useState<CreatorSetupItem[]>([]);
  const [otherSocials, setOtherSocials] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

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
        setNotFound(false);
        setProfilePrivate(false);
        setLoaded(true);
        return;
      }

      // Fetch Creator Profile from MySQL Database (with local repository fallback for immediate preview)
      try {
        const [
          profRes,
          socRes,
          serRes,
          linkRes,
          mediakitRes,
          revRes,
          teamRes,
          brandRes,
          collabRes,
          setupRes,
          otherSocRes,
          secRes,
          productsRes,
        ] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/socials?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/series?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/custom-links?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/mediakit?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/reviews?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/team?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/brands?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/collaborations?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/setup?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/other-socials?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/sections?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/public/products?username=${encodeURIComponent(usernameParam)}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({ status: 0 })),
        ]);

        const isProfOk = profRes.status === 1 || profRes.success === true;
        const profile = profRes.data?.profile || profRes.profile;
        const subscription = profRes.data?.subscription || profRes.subscription;

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
            setProfilePrivate(true);
            setNotFound(false);
            setLoaded(true);
            return;
          }

          setProfile(profile);
          if (profile.themeKey) {
            setTheme(profile.themeKey as ThemeKey);
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
            const accs: SocialAccounts = { ...EMPTY_SOCIAL_ACCOUNTS };
            socials.forEach((s: any) => {
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
          } else {
            setSocials(EMPTY_SOCIAL_ACCOUNTS);
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

          // Track Profile View Event
          try {
            const visitorKey = getPublicVisitorId();
            const eventId = getPageViewEventId(profile.id, usernameParam, visitorKey);

            fetch("/api/analytics/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                creator_id: profile.id,
                creator_username: usernameParam,
                event_type: "profile_view",
                visitor_id: visitorKey,
                event_id: eventId,
                source: "public_profile",
                metadata: {
                  referrer: typeof document !== "undefined" ? document.referrer : "",
                },
              }),
            }).catch(() => { });
          } catch { }
        } else {
          // Fallback to local profile if in same browser session for immediate view
          try {
            const {
              profileRepository,
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
            const cleanLocalUser = (local?.username || "").replace(/^@/, "").toLowerCase();
            if (local && (cleanLocalUser === usernameParam || !local.username)) {
              setProfile({ ...local, username: local.username || usernameParam });
              const localTheme = themeRepository.get() || local.themeKey || "minimal-white";
              setTheme(localTheme as ThemeKey);
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

  if (notFound || profilePrivate) {
    const handle = decodeURIComponent(params.username ?? "");
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#F6EBF1]/60 via-slate-50 to-white px-4 py-12 text-center text-slate-900 overflow-hidden">
        {/* Ambient Maroon Background Glow Orbs */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#043084]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />

        <main className="relative z-10 w-full max-w-md space-y-6">
          {/* Header Branding */}
          <div className="flex items-center justify-center px-2">
            <Logo />
          </div>

          {/* Main Clean Light Theme Card */}
          <div className="rounded-[32px] border border-[#E8DCE4] bg-white/95 p-8 sm:p-10 shadow-2xl shadow-[#043084]/5 backdrop-blur-xl space-y-6 text-center">
            {/* Icon Badge */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#043084] text-white shadow-xl shadow-[#043084]/25 ring-4 ring-[#F6EBF1]">
              <UserX className="h-8 w-8 stroke-[2.2]" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2.5">
              <h1 className="font-display text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {profilePrivate ? "This profile is private" : `No Profile Found for @${handle}`}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-sm mx-auto">
                {profilePrivate
                  ? "This creator's free trial has ended, so their public profile is currently private."
                  : "Using this username on Inflixo, no profile has been created yet. If you want to create your creator profile with this handle, click below to get started."}
              </p>
            </div>

            {/* Single Action Button */}
            <div className="pt-2">
              <button
                onClick={() => router.push("/login")}
                className="tap-scale w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#043084] hover:bg-brand-hover px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-[#043084]/20 transition-all border border-[#043084] hover:scale-[1.02] cursor-pointer"
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
    <CreatorPublicShell themeKey={theme}>
        {/* Main Theme Profile Card (Renders Profile, Socials, Series, Services, Reviews & Custom Links) */}
        <ThemeCard
          themeKey={theme}
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
          totalAudience={totalAudience}
          variant="full"
          containedScroll={true}
          seriesOpenMode="page"
          seriesPreviewLimit={3}
          allSeriesHref={`/${handleStr.replace(/^@/, "")}/series`}
          productsPreviewLimit={3}
          allProductsHref={`/${handleStr.replace(/^@/, "")}/products`}
          reviewsPreviewLimit={3}
          allReviewsHref={`/${handleStr.replace(/^@/, "")}/reviews`}
          onShare={handleShare}
        />
    </CreatorPublicShell>
  );
}
