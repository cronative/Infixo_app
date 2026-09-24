"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
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
import { MadeWithInflixo } from "@/components/shared/MadeWithInflixo";
import { CreatorPublicShell, PublicCard } from "@/components/public/CreatorPublicShell";
import { PublicPageHeader, PublicIconButton } from "@/components/public/PublicPageHeader";
import { PublicSectionHeader } from "@/components/public/PublicSectionHeader";
import {
  getPublicTheme,
  PUBLIC_CARD_PADDING,
  PUBLIC_CTA_BUTTON,
  PUBLIC_ICON_BUTTON,
  PUBLIC_TYPE,
} from "@/components/public/publicTheme";

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

        const isProfOk = profRes.status === 1 || profRes.success === true;
        const profile = profRes.data?.profile || profRes.profile;

        if (isProfOk && profile && profile.username) {
          setProfile(profile);
          setTheme((profile.themeKey || "minimal-white") as ThemeKey);
          setNotFound(false);

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
          }

          const series = serRes.data?.series || serRes.series;
          if ((serRes.status === 1 || serRes.success) && Array.isArray(series)) {
            setSeries(series);
          }

          const packages = mediakitRes.data?.packages || mediakitRes.packages;
          if ((mediakitRes.status === 1 || mediakitRes.success) && Array.isArray(packages)) {
            setPackages(packages);
          }
          const mkSettings = mediakitRes.data?.settings || mediakitRes.settings;
          if ((mediakitRes.status === 1 || mediakitRes.success) && mkSettings) {
            setSettings(mkSettings);
          }

          const reviews = revRes.data?.reviews || revRes.reviews;
          if ((revRes.status === 1 || revRes.success) && Array.isArray(reviews)) {
            setReviews(reviews);
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
    if (typeof window === "undefined") return;
    // The browser uses the document title as the default PDF file name.
    const previousTitle = document.title;
    const name = profile?.displayName || profile?.username || "Creator";
    document.title = `${name} - Media Kit`;
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  // Dashboard "PDF" button opens this page with ?download=pdf — open the print dialog once loaded.
  useEffect(() => {
    if (!loaded || !profile || typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("download") !== "pdf") return;
    const timer = window.setTimeout(handlePrint, 600);
    return () => window.clearTimeout(timer);
  }, [loaded, profile]);

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

  // Only the creator's real packages. (Sample packages with invented prices were
  // previously shown to brands when a creator had none.)
  const displayPackages = packages.filter((p) => p.isActive !== false);

  const pt = getPublicTheme(theme);
  const c = pt.colors;
  const isDark = pt.isDark;
  const cardStyle = pt.itemStyle;
  const subtleStyle = pt.elevatedStyle;
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
    <CreatorPublicShell
      themeKey={theme}
      wrapperProps={{ "data-media-kit-print": true }}
      mainClassName="print:h-auto print:max-w-none print:p-0 print:overflow-visible"
      outside={
        <style
          // Print-only rules for "Export PDF"
          dangerouslySetInnerHTML={{
            __html: `
          /* ── Media kit → PDF (A4) ─────────────────────────────── */
          @page {
            size: A4;
            /* No paper margin: the theme background runs edge to edge; spacing comes from padding below */
            margin: 0;
          }

          @media print {
            html,
            body {
              background: ${c.pageBackground} !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Only the media kit is printed (no cookie banner, toasts, install prompt) */
            body > :not([data-media-kit-print]):not(:has([data-media-kit-print])) {
              display: none !important;
            }

            [data-media-kit-print] {
              min-height: 0 !important;
              background: ${c.pageBackground} !important;
            }

            [data-media-kit-print] *,
            [data-media-kit-print] *::before,
            [data-media-kit-print] *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              animation: none !important;
              transition: none !important;
            }

            /* Drop the web-only layers: photo/gradient background, ambient animation, overlays */
            [data-media-kit-print] > :not(main) {
              display: none !important;
            }

            /* Flatten the centered web card into a full-width document */
            [data-media-kit-print] main {
              position: static !important;
              height: auto !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              transform: none !important;
            }

            [data-media-kit-print] main > div {
              display: block !important;
              background: transparent !important;
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              overflow: visible !important;
              min-height: 0 !important;
            }

            [data-media-kit-actions] {
              display: none !important;
            }

            [data-media-kit-content] {
              display: block !important;
              flex: none !important;
              height: auto !important;
              overflow: visible !important;
              padding: 14mm 16mm 10mm !important;
              /* Repeat the top/bottom padding on every printed page */
              -webkit-box-decoration-break: clone;
              box-decoration-break: clone;
            }

            [data-media-kit-content] > * + * {
              margin-top: 7mm !important;
            }

            /* Keep individual cards whole; let long sections flow across pages */
            [data-media-kit-keep],
            [data-media-kit-content] article {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            /* Never leave a section heading alone at the bottom of a page */
            [data-media-kit-section] > :first-child {
              break-after: avoid;
              page-break-after: avoid;
            }

            [data-media-kit-footer] {
              border-top-width: 1px !important;
              margin: 0 16mm !important;
              padding: 4mm 0 12mm !important;
              break-inside: avoid;
            }

            [data-media-kit-print] a:not(.underline) {
              text-decoration: none !important;
            }
          }
        `,
          }}
        />
      }
    >
      <PublicCard
        themeKey={theme}
        className="print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
      >
        <div data-media-kit-actions className={`${PUBLIC_CARD_PADDING} shrink-0 pt-4 pb-3 sm:pt-5`}>
          <PublicPageHeader
            themeKey={theme}
            backHref={`/${cleanHandle}`}
            backLabel="Back to profile"
            creatorName={profile.displayName || ""}
            creatorHandle={cleanHandle}
            creatorPhoto={profile.photoDataUrl}
            pageLabel="Media kit"
            actions={
              <>
                <PublicIconButton themeKey={theme} onClick={handlePrint} label="Export PDF">
                  <Printer className="h-4 w-4" />
                </PublicIconButton>
                <PublicIconButton themeKey={theme} onClick={handleCopyLink} label="Share media kit">
                  <Share2 className="h-4 w-4" />
                </PublicIconButton>
              </>
            }
          />
        </div>

        <div
          data-media-kit-content
          className={`min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain ${PUBLIC_CARD_PADDING} pt-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden print:overflow-visible`}
        >
          {/* Creator identity: the "cover" of the media kit (also used in the PDF) */}
          <section className="text-center">
            <p style={{ color: c.accentText }} className={PUBLIC_TYPE.eyebrow}>Media kit</p>
            <CreatorAvatar
              src={profile.photoDataUrl}
              name={profile.displayName || "Creator"}
              className="mx-auto mt-3 h-[72px] w-[72px] overflow-hidden rounded-full border-2 object-cover object-center shadow-sm sm:h-20 sm:w-20"
              style={{ borderColor: c.border, backgroundColor: c.cardBackground }}
              textClassName="text-lg font-extrabold sm:text-xl"
              textStyle={{ color: c.primaryText }}
              fallbackBgClass="bg-[#043084]"
            />
            <div className="mt-2 flex items-center justify-center gap-1.5 px-2">
              <h1 style={pt.headingStyle} className={`${PUBLIC_TYPE.creatorName} break-words line-clamp-2`}>
                {profile.displayName || "Creator"}
              </h1>
              {profile.isVerified && <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-emerald-500" />}
            </div>
            <p style={{ color: c.mutedText }} className={`mt-0.5 ${PUBLIC_TYPE.meta}`}>@{cleanHandle}</p>
            {creatorTypes && (
              <p style={{ color: c.secondaryText }} className={`mt-1 break-words px-2 ${PUBLIC_TYPE.meta}`}>{creatorTypes}</p>
            )}
            {Boolean(profile.city) && (
              <p style={{ color: c.mutedText }} className={`mt-1 inline-flex items-center justify-center gap-1 ${PUBLIC_TYPE.meta}`}>
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{[profile.city, profile.state].filter(Boolean).join(", ")}</span>
              </p>
            )}
            {profile.bio && profile.bio.trim() && (
              <p style={{ color: c.secondaryText }} className={`mx-auto mt-2 max-w-md break-words px-1 ${PUBLIC_TYPE.body}`}>
                {profile.bio}
              </p>
            )}
            {/* PDF only: clickable profile + social links (the icon buttons are hidden on paper) */}
            <div className="mt-2 hidden print:block">
              <a
                href={`${typeof window !== "undefined" ? window.location.origin : "https://inflixo.com"}/${cleanHandle}`}
                style={{ color: c.accentText }}
                className={`underline underline-offset-2 ${PUBLIC_TYPE.meta}`}
              >
                {(typeof window !== "undefined" ? window.location.host : "inflixo.com")}/{cleanHandle}
              </a>
              {headerSocials.length > 0 && (
                <p className={`mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 ${PUBLIC_TYPE.meta}`}>
                  {headerSocials.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      style={{ color: c.secondaryText }}
                      className="inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      {item.icon}
                      <span>{item.href.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    </a>
                  ))}
                </p>
              )}
            </div>
            {headerSocials.length > 0 && (
              <div data-media-kit-actions className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {headerSocials.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    title={item.label}
                    style={pt.controlStyle}
                    className={PUBLIC_ICON_BUTTON}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Total fanbase + platform breakdown */}
          <section data-media-kit-section data-media-kit-keep style={cardStyle} className="rounded-[14px] border p-4 text-center sm:p-5">
            <p style={{ color: c.mutedText }} className={PUBLIC_TYPE.eyebrow}>Total fanbase</p>
            <p style={{ ...pt.headingStyle, color: c.accentText }} className={`mt-1.5 ${PUBLIC_TYPE.stat}`}>{formatCount(totalAudience)}</p>
            <p style={{ color: c.secondaryText }} className={`mt-1 ${PUBLIC_TYPE.meta}`}>Across primary social platforms</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Instagram", unit: "Followers", value: socials.instagram.followers || 0, icon: <InstagramIcon className="h-4 w-4 text-pink-500" /> },
                { label: "YouTube", unit: "Subscribers", value: socials.youtube.subscribers || 0, icon: <YoutubeIcon className="h-4 w-4 text-red-500" /> },
                { label: "Facebook", unit: "Followers", value: socials.facebook.followers || 0, icon: <FacebookIcon className="h-4 w-4 text-blue-500" /> },
              ].map((item) => (
                <div key={item.label} style={subtleStyle} className="min-w-0 rounded-[12px] border px-1.5 py-3">
                  <div className="mx-auto flex justify-center">{item.icon}</div>
                  <p className="mt-1.5 text-base font-bold tabular-nums">{formatCount(item.value)}</p>
                  <p style={{ color: c.mutedText }} className={`truncate ${PUBLIC_TYPE.label}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Collaboration packages / rate card */}
          {displayPackages.length > 0 && (
            <section data-media-kit-section className="space-y-3">
              <PublicSectionHeader
                themeKey={theme}
                title="Collaboration packages"
                icon={<Briefcase className="h-4 w-4" />}
                description="Deliverables, pricing and turnaround."
              />
              <div className="space-y-2.5 print:grid print:grid-cols-2 print:gap-3 print:space-y-0">
                {displayPackages.map((pkg) => {
                  const visual = getPackageCardVisual(pkg);
                  return (
                    <article key={pkg.id} style={cardStyle} className="rounded-[14px] border p-3.5 sm:p-4">
                      <div className="flex items-start gap-3">
                        {visual.icon}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                            <div className="min-w-0 flex-1">
                              <h3 className={`break-words ${PUBLIC_TYPE.cardTitle}`}>{pkg.title}</h3>
                              {(pkg.isPopular || pkg.badge) && (
                                <p style={{ color: c.accentText }} className={`mt-0.5 ${PUBLIC_TYPE.label}`}>{pkg.badge || "Most popular"}</p>
                              )}
                            </div>
                            <p className={`shrink-0 text-right break-words ${PUBLIC_TYPE.price}`}>{formatPackagePrice(pkg.price)}</p>
                          </div>
                          {pkg.deliverables?.length > 0 && (
                            <ul className="mt-2.5 space-y-1.5">
                              {pkg.deliverables.map((item, index) => (
                                <li key={index} style={{ color: c.secondaryText }} className={`flex items-start gap-1.5 break-words ${PUBLIC_TYPE.metaRegular} leading-snug`}>
                                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: c.accent }} />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <div style={{ borderColor: c.divider }} className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                        <span style={{ color: c.secondaryText }} className={`flex items-center gap-1 ${PUBLIC_TYPE.label}`}>
                          <Clock className="h-3.5 w-3.5" /> {formatDeliveryText(pkg.turnaroundDays)}
                        </span>
                        {hasDirectContact && (
                          <div data-media-kit-actions className="flex items-center gap-1.5">
                            {contactEmail && (
                              <a
                                href={emailHref(pkg.title)}
                                aria-label={`Email about ${pkg.title}`}
                                title="Email creator"
                                style={{ background: c.accent }}
                                className="tap-scale flex h-10 items-center gap-1.5 rounded-[12px] px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                              >
                                <Mail className="h-4 w-4" /> Email
                              </a>
                            )}
                            {whatsappNumber && (
                              <a
                                href={whatsappHref(pkg.title)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`WhatsApp about ${pkg.title}`}
                                title="WhatsApp creator"
                                className="tap-scale flex h-10 items-center gap-1.5 rounded-[12px] bg-[#16a34a] px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                              >
                                <MessageCircle className="h-4 w-4" /> WhatsApp
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              {hasDirectContact && (
                <a
                  data-media-kit-actions
                  href={contactEmail ? emailHref() : whatsappHref()}
                  target={contactEmail ? undefined : "_blank"}
                  rel={contactEmail ? undefined : "noopener noreferrer"}
                  style={{ color: c.accentText }}
                  className={`tap-scale inline-flex min-h-10 items-center gap-1 px-0.5 ${PUBLIC_TYPE.label}`}
                >
                  Need something custom? Ask @{cleanHandle} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              )}
            </section>
          )}

          {/* Team */}
          {team.members.length > 0 && (
            <section data-media-kit-section className="space-y-3">
              <PublicSectionHeader
                themeKey={theme}
                title={team.team?.teamName || "Creator team"}
                icon={<Users className="h-4 w-4" />}
                meta={`${team.members.length}`}
              />
              <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                {team.members.map((member) => (
                  <div key={member.id} style={cardStyle} className="flex min-w-0 items-center gap-2.5 rounded-[14px] border p-3">
                    <div style={{ background: c.accent }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-xs font-bold text-white">
                      {getInitials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate ${PUBLIC_TYPE.cardTitle}`}>{member.name}</p>
                      <p style={{ color: c.secondaryText }} className={`truncate ${PUBLIC_TYPE.meta}`}>{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <section data-media-kit-section className="space-y-3">
              <PublicSectionHeader
                themeKey={theme}
                title="Reviews"
                icon={<Star className="h-4 w-4" />}
                meta={`${reviews.length}`}
                action={reviews.length > 3 ? { label: "View all", href: `/${cleanHandle}/reviews` } : undefined}
              />
              {reviews.slice(0, 3).map((review) => {
                const rating = Math.max(0, Math.min(5, Math.round(Number(review.rating) || 0)));
                return (
                  <article key={review.id} style={cardStyle} className="rounded-[14px] border p-3.5 sm:p-4">
                    {rating > 0 && (
                      <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
                        {Array.from({ length: rating }).map((_, index) => (
                          <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    )}
                    {review.comment && (
                      <p className={`${rating > 0 ? "mt-2" : ""} break-words ${PUBLIC_TYPE.body}`}>&ldquo;{review.comment}&rdquo;</p>
                    )}
                    <p style={{ color: c.secondaryText }} className={`mt-2 ${PUBLIC_TYPE.meta}`}>
                      <span style={{ color: c.primaryText }} className="font-semibold">{review.clientName}</span>
                      {review.clientDesignation ? ` · ${review.clientDesignation}` : ""}
                    </p>
                  </article>
                );
              })}
            </section>
          )}

          {/* Brand CTA */}
          {hasDirectContact && (
            <section data-media-kit-section data-media-kit-keep style={cardStyle} className="rounded-[14px] border p-5 text-center">
              <h2 style={pt.headingStyle} className={PUBLIC_TYPE.sectionTitle}>Let&apos;s create something together</h2>
              <p style={{ color: c.secondaryText }} className={`mx-auto mt-1 max-w-xs ${PUBLIC_TYPE.metaRegular}`}>
                Contact @{cleanHandle} directly for collaborations and campaign enquiries.
              </p>
              <div className="mx-auto mt-4 flex max-w-sm flex-col gap-2">
                {contactEmail && (
                  <a href={emailHref()} style={{ background: c.accent, borderColor: c.accent, color: "#FFFFFF" }} className={`${PUBLIC_CTA_BUTTON} min-w-0`}>
                    <Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{contactEmail}</span>
                  </a>
                )}
                {whatsappNumber && (
                  <a href={whatsappHref()} target="_blank" rel="noopener noreferrer" className={`${PUBLIC_CTA_BUTTON} border-[#16a34a] bg-[#16a34a] text-white`}>
                    <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp +{whatsappNumber}
                  </a>
                )}
              </div>
            </section>
          )}
          <div className="h-2" aria-hidden="true" />
        </div>

        {/* Pinned Made with Inflixo footer (same as profile) */}
        <div data-media-kit-footer style={{ borderColor: c.divider }} className="flex shrink-0 select-none items-center justify-center border-t px-4 pt-3.5 pb-[15px]">
          <MadeWithInflixo
            color={isDark ? "#FFFFFF" : c.secondaryText}
            backgroundColor={c.accentSoft}
            borderColor={c.accentBorder}
          />
        </div>
      </PublicCard>
    </CreatorPublicShell>
  );
}
