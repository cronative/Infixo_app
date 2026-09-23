"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Mail,
  MessageCircle,
  Share2,
  Printer,
  ShieldCheck,
  Star,
  Users,
  Check,
  Gift,
  ArrowRight,
  Clock,
  UserX,
  MapPin,
} from "lucide-react";
import {
  CreatorProfile,
  SocialAccounts,
  Series,
  MediaKitPackage,
  MediaKitSettings,
  CreatorReview,
  CreatorBrand,
  CreatorCollaboration,
  TeamMember,
  CreatorTeam,
  ThemeKey,
  EMPTY_SOCIAL_ACCOUNTS,
} from "@/types";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";
import { Logo } from "@/components/shared/Logo";
import { formatCount } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useToast } from "@/contexts/ToastContext";
import { SyncingLoader } from "@/components/shared/SyncingLoader";
import { getInitials } from "@/lib/avatar";
import { ThemeService, THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { isDarkTheme } from "@/components/onboarding/LivePreviewCard";
import { MadeWithInflixo } from "@/components/shared/MadeWithInflixo";

const DEFAULT_FALLBACK_PACKAGES: MediaKitPackage[] = [
  {
    id: "sample_reel",
    title: "Instagram Reel",
    platform: "Instagram Reel",
    price: "₹10,000",
    turnaroundDays: 2,
    badge: "Most Popular",
    isPopular: true,
    isActive: true,
    deliverables: [
      "1 x 30–60s Dedicated Reel",
      "Brand Collaborator Tag",
      "Direct Promo Link in Bio (24 Hours)",
      "Pinned Comment with Tracked Link",
      "Raw Video Footage (Optional)",
    ],
  },
  {
    id: "sample_yt",
    title: "YouTube Integration",
    platform: "YouTube Video Integration",
    price: "₹25,000",
    turnaroundDays: 4,
    badge: "",
    isPopular: false,
    isActive: true,
    deliverables: [
      "60–90s Brand Integration",
      "Product Mention & Showcase",
      "Link in Description",
      "Community Post (Optional)",
      "Raw Footage (Optional)",
    ],
  },
  {
    id: "sample_bundle",
    title: "Instagram Bundle",
    platform: "Instagram Bundle",
    price: "₹18,000",
    turnaroundDays: 2,
    badge: "",
    isPopular: false,
    isActive: true,
    deliverables: [
      "1 x Reel (30–60s)",
      "2 x Instagram Stories",
      "Brand Tag & Location Tag",
      "Exclusive Discount Code",
      "Link in Bio (24 Hours)",
    ],
  },
];

function formatPackagePrice(price: string): string {
  if (!price) return "₹0";
  const trimmed = price.trim();
  if (trimmed.startsWith("₹") || trimmed.startsWith("$") || trimmed.startsWith("€") || trimmed.startsWith("£")) {
    return trimmed;
  }
  if (/^\d[\d,]*$/.test(trimmed)) {
    return `₹${Number(trimmed.replace(/,/g, "")).toLocaleString("en-IN")}`;
  }
  return `₹${trimmed}`;
}

function formatDeliveryText(days: number | undefined): string {
  if (!days) return "2 Days";
  if (days === 1) return "1 Day";
  if (days === 4) return "3–5 Days";
  return `${days} Days`;
}

function getPackageCardVisual(pkg: MediaKitPackage) {
  const platform = (pkg.platform || "").toLowerCase();
  const title = (pkg.title || "").toLowerCase();

  if (platform.includes("youtube") || title.includes("youtube")) {
    return {
      cardClass: "border-rose-100 bg-gradient-to-b from-rose-50/25 via-white to-white",
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-[#FF0000] flex items-center justify-center text-white shadow-xs shrink-0">
          <YoutubeIcon className="w-5 h-5 text-white" />
        </div>
      ),
    };
  }

  if (
    platform.includes("bundle") ||
    title.includes("bundle") ||
    platform.includes("multi") ||
    title.includes("multi") ||
    platform.includes("retainer") ||
    title.includes("retainer")
  ) {
    return {
      cardClass: "border-purple-100 bg-gradient-to-b from-purple-50/25 via-white to-white",
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-[#FAF5FF] border border-purple-200/80 flex items-center justify-center text-purple-600 shadow-xs shrink-0">
          <Gift className="w-5 h-5 text-purple-600 stroke-[2.2]" />
        </div>
      ),
    };
  }

  if (
    platform.includes("instagram") ||
    title.includes("instagram") ||
    platform.includes("reel") ||
    title.includes("reel") ||
    platform.includes("story") ||
    title.includes("story")
  ) {
    return {
      cardClass: "border-pink-200/80 bg-gradient-to-b from-pink-50/25 via-white to-white",
      icon: (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FD5949] via-[#D6249F] to-[#285AEB] flex items-center justify-center text-white shadow-xs shrink-0">
          <InstagramIcon className="w-5 h-5 text-white" />
        </div>
      ),
    };
  }

  return {
    cardClass: "border-blue-100 bg-gradient-to-b from-blue-50/25 via-white to-white",
    icon: (
      <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] border border-blue-200/80 flex items-center justify-center text-[#043084] shadow-xs shrink-0">
        <Briefcase className="w-5 h-5 text-[#043084] stroke-[2.2]" />
      </div>
    ),
  };
}

export default function PublicMediaKitPage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [theme, setTheme] = useState<ThemeKey>("minimal-white");
  const [socials, setSocials] = useState<SocialAccounts>(EMPTY_SOCIAL_ACCOUNTS);
  const [series, setSeries] = useState<Series[]>([]);
  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [settings, setSettings] = useState<MediaKitSettings | null>(null);
  const [reviews, setReviews] = useState<CreatorReview[]>([]);
  const [team, setTeam] = useState<{ team?: CreatorTeam | null; members: TeamMember[] }>({ members: [] });
  const [brands, setBrands] = useState<CreatorBrand[]>([]);
  const [collaborations, setCollaborations] = useState<CreatorCollaboration[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadMediaKitData() {
      const rawUser = decodeURIComponent(params.username ?? "").trim();
      const usernameParam = rawUser.replace(/^@/, "").toLowerCase();
      if (!usernameParam) {
        setNotFound(true);
        setLoaded(true);
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
          brandRes,
          collabRes,
        ] = await Promise.all([
          fetch(`/api/creator/profile?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/socials?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/series?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/mediakit?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/reviews?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/team?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/brands?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
          fetch(`/api/creator/collaborations?username=${encodeURIComponent(usernameParam)}`).then((r) => r.json()).catch(() => ({ success: false })),
        ]);

        if (profRes.success && profRes.profile && profRes.profile.username) {
          setProfile(profRes.profile);
          setTheme((profRes.profile.themeKey || "minimal-white") as ThemeKey);
          setNotFound(false);

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
            setPackages(mediakitRes.packages);
          }
          if (mediakitRes.success && mediakitRes.settings) {
            setSettings(mediakitRes.settings);
          }

          if (revRes.success && Array.isArray(revRes.reviews)) {
            setReviews(revRes.reviews);
          }

          if (teamRes.success && teamRes.team) {
            setTeam({ team: teamRes.team, members: teamRes.members || [] });
          }

          if (brandRes.success && Array.isArray(brandRes.brands)) {
            setBrands(brandRes.brands);
          }

          if (collabRes.success && Array.isArray(collabRes.collaborations)) {
            setCollaborations(collabRes.collaborations);
          }

        } else {
          try {
            const {
              profileRepository,
              seriesRepository,
              teamRepository,
              brandsRepository,
              collaborationsRepository,
              reviewsRepository,
            } = await import("@/repositories/localRepository");
            const local = profileRepository.get();
            const cleanLocalUser = (local?.username || "").replace(/^@/, "").toLowerCase();
            if (local && (cleanLocalUser === usernameParam || !local.username)) {
              setProfile({ ...local, username: local.username || usernameParam });
              setTheme((local.themeKey || "minimal-white") as ThemeKey);
              setSeries(seriesRepository.getAll());
              const localTeam = teamRepository.get();
              setTeam(localTeam ? { team: localTeam.team || localTeam, members: localTeam.members || [] } : { members: [] });
              setBrands(brandsRepository.getAll());
              setCollaborations(collaborationsRepository.getAll());
              setReviews(reviewsRepository.getAll().filter((r) => r.status === "approved"));
              setNotFound(false);
              setLoaded(true);
              return;
            }
          } catch (localErr) {
            console.warn("Local fallback error:", localErr);
          }
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

  const handleCopyLink = async () => {
    if (typeof window !== "undefined") {
      const success = await copyToClipboard(window.location.href);
      if (success) showToast("Media kit link copied! 💼✨");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!loaded) {
    return <SyncingLoader message="Loading Official Creator Media Kit..." fullScreen hideProgressBar={true} />;
  }

  if (notFound || !profile) {
    const handle = decodeURIComponent(params.username ?? "");
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#FAF8FA] px-4 py-12 text-center text-[#17131A]">
        <div className="max-w-md space-y-6">
          <Logo />
          <div className="rounded-3xl border border-[#ECE8EB] bg-white p-8 space-y-4 shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7EDF3] text-[#043084]">
              <UserX className="h-7 w-7" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#17131A]">Media Kit Not Found</h1>
            <p className="text-xs text-[#6F6872]">No creator media kit registered for @{handle}.</p>
            <button
              onClick={() => router.push("/")}
              className="w-full py-2.5 rounded-xl bg-[#043084] text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
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

  const displayPackages =
    packages.length > 0
      ? packages.filter((p) => p.isActive !== false)
      : DEFAULT_FALLBACK_PACKAGES;

  const themeMeta = ThemeService.getThemeMeta(theme);
  const pageBgStyle = themeMeta.outerBgClass || THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];
  const isDark = isDarkTheme(theme) || themeMeta.mode === "dark";
  const profileSurface = themeMeta.profileSurface;
  const cardStyle = {
    background: themeMeta.colors.cardBackground,
    borderColor: themeMeta.colors.border,
    color: themeMeta.colors.primaryText,
    boxShadow: themeMeta.effects.cardShadow,
  };
  const subtleStyle = {
    background: themeMeta.colors.elevatedBackground,
    borderColor: themeMeta.colors.border,
  };
  const controlStyle = {
    background: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.82)",
    borderColor: isDark ? "rgba(255,255,255,0.20)" : themeMeta.colors.border,
    color: themeMeta.colors.primaryText,
  };
  const cleanHandle = (profile.username || params.username || "creator").replace(/^@/, "");
  const contactEmail = settings?.sponsorEmail?.trim() || profile.email?.trim() || "";
  const whatsappNumber = settings?.whatsappNumber?.replace(/\D/g, "") || "";
  const hasDirectContact = Boolean(contactEmail || whatsappNumber);
  const contactMessage = (packageTitle?: string) =>
    `Hi ${profile.displayName || cleanHandle}, I would like to discuss${packageTitle ? ` your ${packageTitle} package` : " a brand collaboration"}.`;
  const emailHref = (packageTitle?: string) => {
    const subject = packageTitle
      ? `Collaboration enquiry: ${packageTitle}`
      : `Brand collaboration with ${profile.displayName || cleanHandle}`;
    return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(contactMessage(packageTitle))}`;
  };
  const whatsappHref = (packageTitle?: string) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(contactMessage(packageTitle))}`;
  const creatorTypes = [profile.category, profile.profession]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" · ");
  const headerSocials = [
    socials.instagram.username && {
      label: "Instagram",
      href: socials.instagram.url || `https://instagram.com/${socials.instagram.username.replace(/^@/, "")}`,
      icon: <InstagramIcon className="h-4 w-4 text-pink-500" />,
    },
    socials.youtube.username && {
      label: "YouTube",
      href: socials.youtube.url || `https://youtube.com/@${socials.youtube.username.replace(/^@/, "")}`,
      icon: <YoutubeIcon className="h-4 w-4 text-red-500" />,
    },
    socials.facebook.username && {
      label: "Facebook",
      href: socials.facebook.url || `https://facebook.com/${socials.facebook.username.replace(/^@/, "")}`,
      icon: <FacebookIcon className="h-4 w-4 text-blue-500" />,
    },
  ].filter(Boolean) as Array<{ label: string; href: string; icon: React.ReactNode }>;

  return (
    <div
      data-media-kit-print
      style={{ backgroundColor: themeMeta.colors.pageBackground }}
      className="relative min-h-dvh overflow-hidden print:overflow-visible"
    >
      <style jsx global>{`
        @media print {
          html,
          body,
          [data-media-kit-print] {
            background: ${themeMeta.colors.pageBackground} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          [data-media-kit-print] *,
          [data-media-kit-print] *::before,
          [data-media-kit-print] *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          [data-media-kit-actions] {
            display: none !important;
          }

          [data-media-kit-content] {
            height: auto !important;
            overflow: visible !important;
          }

          [data-media-kit-section] {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div
        className={`fixed inset-0 z-0 pointer-events-none transition-colors duration-500 ${pageBgStyle}`}
        style={{ backgroundColor: themeMeta.colors.pageBackground }}
        aria-hidden="true"
      />
      {themeMeta.animation?.type !== "none" && (
        <AmbientAnimation
          type={themeMeta.animation?.type || themeMeta.animationType}
          colors={themeMeta.animation?.colors || themeMeta.particleColors}
          themeKey={themeMeta.key}
        />
      )}
      <FocusOverlay overlay={themeMeta.focusOverlay} />

      <main className="relative z-10 mx-auto flex h-dvh min-h-0 w-full max-w-[520px] flex-col px-2.5 py-2.5 sm:px-4 sm:py-3.5 print:h-auto print:max-w-none print:p-0">
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border backdrop-blur-xl print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
          style={{
            background: profileSurface?.background || themeMeta.colors.profileBackground,
            borderColor: profileSurface?.border || themeMeta.colors.border,
            boxShadow: profileSurface?.shadow || themeMeta.effects.shadow,
            color: themeMeta.colors.primaryText,
            fontFamily: themeMeta.typography.fontFamily,
          }}
        >
          <header
            data-media-kit-actions
            className="z-20 flex shrink-0 items-center justify-between gap-2 border-b px-3 py-3 sm:px-4"
            style={{ borderColor: themeMeta.colors.divider }}
          >
            <button
              type="button"
              onClick={() => router.push(`/${cleanHandle}`)}
              className="tap-scale inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-xs font-bold backdrop-blur-md transition-opacity hover:opacity-80"
              style={controlStyle}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Profile
            </button>
            <span className="min-w-0 truncate text-xs font-extrabold uppercase tracking-[0.12em]">Media Kit</span>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={handlePrint} aria-label="Export media kit" title="Export PDF" className="tap-scale flex h-9 w-9 items-center justify-center rounded-[10px] border backdrop-blur-md transition-opacity hover:opacity-80" style={controlStyle}>
                <Printer className="h-4 w-4" />
              </button>
              <button type="button" onClick={handleCopyLink} aria-label="Share media kit" title="Share media kit" className="tap-scale flex h-9 w-9 items-center justify-center rounded-[10px] border backdrop-blur-md transition-opacity hover:opacity-80" style={controlStyle}>
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div data-media-kit-content className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-4 print:overflow-visible">
            <section className="text-center">
              <div className="relative mx-auto inline-block">
                <CreatorAvatar
                  src={profile.photoDataUrl}
                  name={profile.displayName || "Creator"}
                  className="mx-auto h-[68px] w-[68px] overflow-hidden rounded-full border-2 object-contain object-center shadow-sm ring-3 ring-black/5 sm:h-[76px] sm:w-[76px]"
                  style={{ borderColor: themeMeta.colors.border, backgroundColor: themeMeta.colors.cardBackground }}
                  textClassName="text-lg font-extrabold sm:text-xl"
                  textStyle={{ color: themeMeta.colors.primaryText }}
                  fallbackBgClass="bg-[#043084]"
                />
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <h1 className="font-display text-xl font-black" style={{ fontFamily: themeMeta.typography.headingFontFamily }}>
                  {profile.displayName || "Creator"}
                </h1>
                {profile.isVerified && <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />}
              </div>
              <p className="mt-0.5 text-xs font-medium sm:text-[13px]" style={{ color: themeMeta.colors.mutedText }}>@{cleanHandle}</p>
              {creatorTypes && <p className="mt-0.5 text-xs font-medium opacity-85" style={{ color: themeMeta.colors.secondaryText }}>{creatorTypes}</p>}
              {Boolean(profile.city) && (
                <p className="mt-0.5 inline-flex items-center justify-center gap-1 text-[11px] font-medium opacity-80" style={{ color: themeMeta.colors.mutedText }}>
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span>{[profile.city, profile.state].filter(Boolean).join(", ")}</span>
                </p>
              )}
              <p className="mx-auto mt-1 max-w-sm px-1 text-xs font-normal leading-relaxed sm:text-[13px]" style={{ color: themeMeta.colors.secondaryText }}>
                {profile.bio || "Official creator portfolio and collaboration media kit."}
              </p>
              {headerSocials.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                  {headerSocials.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      title={item.label}
                      className="tap-scale flex h-8 w-8 items-center justify-center rounded-[10px] border transition-opacity hover:opacity-80"
                      style={{ background: themeMeta.colors.cardBackground, borderColor: themeMeta.colors.border }}
                    >
                      {item.icon}
                    </a>
                  ))}
                </div>
              )}
            </section>

            <section data-media-kit-section className="rounded-2xl border p-4 text-center" style={cardStyle}>
              <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: themeMeta.colors.mutedText }}>Total fanbase</p>
              <p className="mt-1 font-display text-3xl font-black" style={{ color: themeMeta.colors.primaryText }}>{formatCount(totalAudience)}</p>
              <p className="mt-0.5 text-[11px]" style={{ color: themeMeta.colors.secondaryText }}>Across primary social platforms</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: "Instagram", value: socials.instagram.followers || 0, icon: <InstagramIcon className="h-4 w-4 text-pink-500" /> },
                  { label: "YouTube", value: socials.youtube.subscribers || 0, icon: <YoutubeIcon className="h-4 w-4 text-red-500" /> },
                  { label: "Facebook", value: socials.facebook.followers || 0, icon: <FacebookIcon className="h-4 w-4 text-blue-500" /> },
                ].map((item) => (
                  <div key={item.label} className="min-w-0 rounded-xl border px-1.5 py-2.5" style={subtleStyle}>
                    <div className="mx-auto flex justify-center">{item.icon}</div>
                    <p className="mt-1 text-sm font-black">{formatCount(item.value)}</p>
                    <p className="truncate text-[9px] font-semibold" style={{ color: themeMeta.colors.mutedText }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </section>

            {displayPackages.length > 0 && (
              <section data-media-kit-section className="space-y-2.5">
                <div className="flex items-end justify-between gap-3 px-0.5">
                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-black"><Briefcase className="h-4 w-4" /> Collaboration packages</h2>
                    <p className="mt-0.5 text-[11px]" style={{ color: themeMeta.colors.secondaryText }}>Clear deliverables, pricing and turnaround.</p>
                  </div>
                  {hasDirectContact && (
                    <a
                      href={contactEmail ? emailHref() : whatsappHref()}
                      target={contactEmail ? undefined : "_blank"}
                      rel={contactEmail ? undefined : "noopener noreferrer"}
                      className="shrink-0 text-[11px] font-black"
                      style={{ color: themeMeta.colors.accentText }}
                    >
                      Ask for custom <ArrowRight className="ml-0.5 inline h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="space-y-2.5">
                  {displayPackages.map((pkg) => {
                    const visual = getPackageCardVisual(pkg);
                    return (
                      <article key={pkg.id} className="rounded-2xl border p-3.5" style={cardStyle}>
                        <div className="flex items-start gap-3">
                          {visual.icon}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-black">{pkg.title}</h3>
                                {(pkg.isPopular || pkg.badge) && <p className="mt-0.5 text-[10px] font-bold" style={{ color: themeMeta.colors.accentText }}>{pkg.badge || "Most popular"}</p>}
                              </div>
                              <p className="shrink-0 text-sm font-black">{formatPackagePrice(pkg.price)}</p>
                            </div>
                            {pkg.deliverables?.length > 0 && (
                              <ul className="mt-2 space-y-1.5">
                                {pkg.deliverables.slice(0, 4).map((item, index) => (
                                  <li key={index} className="flex items-start gap-1.5 text-[11px] leading-snug" style={{ color: themeMeta.colors.secondaryText }}>
                                    <Check className="mt-0.5 h-3 w-3 shrink-0" style={{ color: themeMeta.colors.accent }} />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: themeMeta.colors.divider }}>
                          <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: themeMeta.colors.secondaryText }}><Clock className="h-3 w-3" /> {formatDeliveryText(pkg.turnaroundDays)}</span>
                          {hasDirectContact && (
                            <div className="flex items-center gap-1.5">
                              {contactEmail && (
                                <a
                                  href={emailHref(pkg.title)}
                                  aria-label={`Email about ${pkg.title}`}
                                  title="Email creator"
                                  className="flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[10px] font-black text-white transition-opacity hover:opacity-90"
                                  style={{ background: themeMeta.colors.accent }}
                                >
                                  <Mail className="h-3.5 w-3.5" /> Email
                                </a>
                              )}
                              {whatsappNumber && (
                                <a
                                  href={whatsappHref(pkg.title)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`WhatsApp about ${pkg.title}`}
                                  title="WhatsApp creator"
                                  className="flex h-8 items-center gap-1.5 rounded-[10px] bg-[#16a34a] px-2.5 text-[10px] font-black text-white transition-opacity hover:opacity-90"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {team.members.length > 0 && (
              <section data-media-kit-section className="space-y-2.5">
                <h2 className="flex items-center gap-2 px-0.5 text-sm font-black"><Users className="h-4 w-4" /> {team.team?.teamName || "Creator team"}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {team.members.map((member) => (
                    <div key={member.id} className="flex min-w-0 items-center gap-2 rounded-xl border p-2.5" style={cardStyle}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[10px] font-black text-white" style={{ background: themeMeta.colors.accent }}>{getInitials(member.name)}</div>
                      <div className="min-w-0"><p className="truncate text-[11px] font-black">{member.name}</p><p className="truncate text-[10px]" style={{ color: themeMeta.colors.secondaryText }}>{member.role}</p></div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {reviews.length > 0 && (
              <section data-media-kit-section className="space-y-2.5">
                <h2 className="flex items-center gap-2 px-0.5 text-sm font-black"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Reviews</h2>
                {reviews.slice(0, 3).map((review) => (
                  <article key={review.id} className="rounded-2xl border p-3.5" style={cardStyle}>
                    <div className="flex gap-0.5">{Array.from({ length: Number(review.rating) || 5 }).map((_, index) => <Star key={index} className="h-3 w-3 fill-amber-400 text-amber-400" />)}</div>
                    {review.comment && <p className="mt-2 text-xs italic leading-relaxed">&ldquo;{review.comment}&rdquo;</p>}
                    <p className="mt-2 text-[10px] font-bold" style={{ color: themeMeta.colors.secondaryText }}>{review.clientName}{review.clientDesignation ? ` · ${review.clientDesignation}` : ""}</p>
                  </article>
                ))}
              </section>
            )}

            {hasDirectContact && (
              <section data-media-kit-section className="rounded-2xl border p-5 text-center" style={cardStyle}>
                <h2 className="text-base font-black">Let&apos;s create something together</h2>
                <p className="mx-auto mt-1 max-w-xs text-[11px] leading-relaxed" style={{ color: themeMeta.colors.secondaryText }}>Contact @{cleanHandle} directly for collaborations and campaign enquiries.</p>
                <div className="mx-auto mt-3 flex max-w-sm flex-col gap-2">
                  {contactEmail && (
                    <a href={emailHref()} className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-xs font-black text-white transition-opacity hover:opacity-90" style={{ background: themeMeta.colors.accent }}>
                      <Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{contactEmail}</span>
                    </a>
                  )}
                  {whatsappNumber && (
                    <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] bg-[#16a34a] px-4 py-2 text-xs font-black text-white transition-opacity hover:opacity-90">
                      <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp +{whatsappNumber}
                    </a>
                  )}
                </div>
              </section>
            )}

            <div className="flex items-center justify-center pb-3 pt-1 text-center">
              <MadeWithInflixo
                color={isDark ? "#FFFFFF" : themeMeta.colors.secondaryText}
                backgroundColor={themeMeta.colors.accentSoft}
                borderColor={themeMeta.colors.accentBorder}
              />
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
