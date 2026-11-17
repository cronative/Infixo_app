"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { renderSVG } from "uqr";
import {
  Sparkles,
  Check,
  X,
  Star,
  Download,
  Copy,
  MessageSquare,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Users,
  UsersRound,
  Loader2,
  MapPin,
  Play,
  Target,
  Handshake,
  IndianRupee,
  Mail,
  Megaphone,
  BadgeCheck,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CreditCard,
  ExternalLink,
  FileText,
  Languages,
  Layers,
  Link2,
  MessageCircle,
  Percent,
  Quote,
  RefreshCw,
  Send,
  Share2,
  User,
  type LucideIcon,
} from "lucide-react";
import { USAGE_RIGHTS, revisionsLabel, shortItemsSummary } from "@/lib/collabPackage";
import {
  CreatorProfile,
  SocialAccounts,
  Series,
  MediaKitPackage,
  MediaKitSettings,
  CreatorReview,
  CreatorTeam,
  TeamMember,
  CreatorBrand,
  CreatorCollaboration,
} from "@/types";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { PublicTeamGroups } from "@/components/team/PublicTeamGroups";
import { formatFans, getCreatorEra, calculateTotalFanbase } from "@/lib/creatorEra";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useToast } from "@/contexts/ToastContext";
import { PDF_PREPARING_LABEL, useMediaKitPdf } from "@/hooks/useMediaKitPdf";
import { packageView, platformIcon } from "@/components/mediakit/PackageCard";
import {
  BrandPlatformIcon,
  CARD_ITEM,
  CARD_ITEM_HOVER,
  CARD_LIST,
  PLATFORM_BRAND,
  SectionCard,
} from "@/components/public/ui";

export interface MediaKitV2ContentProps {
  profile: CreatorProfile;
  socials?: SocialAccounts;
  totalAudience?: number;
  series?: Series[];
  packages?: MediaKitPackage[];
  settings?: MediaKitSettings;
  reviews?: CreatorReview[];
  team?: { team?: CreatorTeam | null; members: TeamMember[] };
  /** Brands page (logos) and Collaborations page (past campaigns) from the dashboard. */
  brands?: CreatorBrand[];
  collaborations?: CreatorCollaboration[];
  hideTeam?: boolean;
  onEnquirePackage?: (pkg: MediaKitPackage | null) => void;
  isInformational?: boolean;
  isPrint?: boolean;
  /** Share button in the top bar and footer (falls back to copying the link). */
  onShare?: () => void;
}

const MK_CARD = "rounded-[5px] border border-(--surface-border) bg-[var(--header-bg,var(--card-bg))]";

/** Clean white media kit section: outline icon + title (+ accent words) on the left, an optional action on the right. */
function Block({ icon: Icon, title, accent, action, children, className = "" }: { icon: LucideIcon; title: string; accent?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`${MK_CARD} print-avoid-break p-3.5 sm:p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex min-w-0 items-center gap-2 text-[16px] font-bold leading-5 text-(--text)">
          <Icon aria-hidden className="h-5 w-5 shrink-0 text-(--text-muted)" strokeWidth={1.8} />
          <span className="min-w-0">
            {title}
            {accent && <span className="font-medium text-(--text-muted)"> {accent}</span>}
          </span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const NO_COLORS = {};
const SERIF = "Georgia, 'Times New Roman', serif";

export function MediaKitV2Content({
  profile,
  socials,
  totalAudience: passedTotalAudience,
  series = [],
  packages = [],
  settings,
  reviews = [],
  team,
  brands = [],
  collaborations = [],
  hideTeam = false,
  onEnquirePackage,
  isInformational = false,
  isPrint: propIsPrint = false,
  onShare,
}: MediaKitV2ContentProps) {
  const { showToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [urlIsPrint, setUrlIsPrint] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("print");
      if (p === "1" || p === "true") setUrlIsPrint(true);
    }
  }, []);

  const activeIsPrint = Boolean(propIsPrint || urlIsPrint);

  const cleanHandle = (profile.username || "creator").replace(/^@/, "");
  const displayName = profile.displayName || cleanHandle;

  // Compute total audience & era
  const calculatedFans = useMemo(() => {
    if (typeof passedTotalAudience === "number" && passedTotalAudience > 0) {
      return passedTotalAudience;
    }
    return calculateTotalFanbase(socials) || 0;
  }, [passedTotalAudience, socials]);

  const creatorEra = useMemo(
    () => getCreatorEra(calculatedFans > 0 ? calculatedFans : null),
    [calculatedFans]
  );

  // Primary connected socials for editorial prose line
  const connectedPlatforms = useMemo(() => {
    const list: Array<{ key: string; label: string; handle: string; count: number; unit: string; url: string; icon: React.ReactNode }> = [];
    const ig = socials?.instagram;
    if (ig?.username || (ig?.followers || 0) > 0) {
      const h = (ig?.username || cleanHandle).replace(/^@/, "");
      list.push({
        key: "instagram",
        label: "Instagram",
        handle: h,
        count: ig?.followers || 0,
        unit: "followers",
        url: ig?.url || `https://instagram.com/${h}`,
        icon: <InstagramIcon className="h-3.5 w-3.5 text-[#E1306C]" />,
      });
    }
    const yt = socials?.youtube;
    if (yt?.username || (yt?.subscribers || 0) > 0) {
      const h = (yt?.username || cleanHandle).replace(/^@/, "");
      list.push({
        key: "youtube",
        label: "YouTube",
        handle: h,
        count: yt?.subscribers || 0,
        unit: "subscribers",
        url: yt?.url || `https://youtube.com/@${h}`,
        icon: <YoutubeIcon className="h-3.5 w-3.5 text-[#FF0000]" />,
      });
    }
    const fb = socials?.facebook;
    if (fb?.username || (fb?.followers || 0) > 0) {
      const h = (fb?.username || cleanHandle).replace(/^@/, "");
      list.push({
        key: "facebook",
        label: "Facebook",
        handle: h,
        count: fb?.followers || 0,
        unit: "followers",
        url: fb?.url || `https://facebook.com/${h}`,
        icon: <FacebookIcon className="h-3.5 w-3.5 text-[#1877F2]" />,
      });
    }
    return list;
  }, [socials, cleanHandle]);

  // Extract Media Kit v2 fields with clean fallbacks
  const introText = (settings?.intro || settings?.bioHighlight || profile.bio || "").trim();
  const nowMaking = (settings?.nowMaking || "").trim();
  const audienceDesc = (settings?.audienceDesc || "").trim();
  const availability: "open" | "busy" = settings?.availability === "busy" ? "busy" : "open";
  const replyTime = (settings?.replyTime || "Within 24h").trim();
  const fitTags = (settings?.fitTags || []).map((t) => t.trim()).filter(Boolean).slice(0, 6);
  const nofitTags = (settings?.nofitTags || []).map((t) => t.trim()).filter(Boolean).slice(0, 6);
  const promises = (settings?.promises || []).map((p) => p.trim()).filter(Boolean).slice(0, 4);

  // Audience numbers brands ask for first (shown only when the creator filled them in).
  const listText = (v?: string[] | string) => (Array.isArray(v) ? v.join(", ") : (v || "")).trim();
  const engagement = String(settings?.engagementRate ?? "").trim();
  const audienceStats = [
    { label: "Avg reel views", value: String(settings?.avgReelViews ?? "").trim() },
    { label: "Engagement", value: engagement ? (engagement.endsWith("%") ? engagement : `${engagement}%`) : "" },
    { label: "Top cities", value: (settings?.topCities || "").trim() },
    { label: "Languages", value: listText(settings?.contentLanguages) },
  ].filter((t) => t.value);

  const creatorFirstName = useMemo(() => {
    const raw = (profile.displayName || cleanHandle || "").trim();
    const firstWord = raw.split(/\s+/)[0] || "";
    return firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1) : "Creator";
  }, [profile.displayName, cleanHandle]);

  const signatureName = (settings?.signatureName && settings.signatureName.trim())
    ? settings.signatureName.trim()
    : creatorFirstName;

  // Most popular package first.
  const activePackages = useMemo(
    () =>
      (packages || [])
        .filter((p) => p.isActive !== false && !p.isDraft)
        .sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular))),
    [packages]
  );
  const visibleReviews = useMemo(
    () => (reviews || []).filter((r) => (r as any).isVisible !== false && (r as any).is_visible !== 0),
    [reviews]
  );
  const activeTeamMembers = useMemo(() => {
    if (team?.team?.isActive === false) return [];
    return (team?.members || []).filter((m) => m.isActive !== false && m.name?.trim());
  }, [team]);

  const showHello = Boolean(introText || nowMaking || profile.photoDataUrl || settings?.availability);
  const showAudience = Boolean(calculatedFans > 0 || audienceDesc || connectedPlatforms.length > 0 || audienceStats.length > 0);
  const showFitChips = fitTags.length > 0 || nofitTags.length > 0;
  const showPackages = activePackages.length > 0;
  const showPromises = promises.length > 0;
  const showReviews = visibleReviews.length > 0;
  const showTeam = !hideTeam && activeTeamMembers.length > 0;

  // Data the creator already saved elsewhere, now shown on the kit.
  const locationText =
    settings?.location?.trim() || [profile.city, profile.state, profile.country].map((v) => (v || "").trim()).filter(Boolean).join(", ");
  const niches = useMemo(() => {
    const raw = settings?.categories;
    const list = Array.isArray(raw) ? raw : (raw || "").split(",");
    return Array.from(new Set(list.map((c) => String(c).trim()).filter(Boolean))).slice(0, 6);
  }, [settings?.categories]);
  const pastBrands = useMemo(() => {
    const seen = new Set<string>();
    const out: { name: string; logo?: string | null; url?: string }[] = [];
    const add = (name: string, logo?: string | null, url?: string) => {
      const n = name.trim();
      if (!n || seen.has(n.toLowerCase())) return;
      seen.add(n.toLowerCase());
      out.push({ name: n, logo, url });
    };
    brands.filter((b) => b.isActive !== false).forEach((b) => add(b.brandName || "", b.brandLogoUrl, b.websiteUrl || b.instagramUrl || b.youtubeUrl || undefined));
    (settings?.pastBrands || []).forEach((b) => add(b?.name || "", b?.logoUrl));
    return out.slice(0, 12);
  }, [brands, settings?.pastBrands]);
  const pastCampaigns = useMemo(
    () => collaborations.filter((c) => c.isActive !== false && c.brandName?.trim()).slice(0, 6),
    [collaborations]
  );
  // Brand chips that aren't already a campaign card.
  const extraBrands = useMemo(() => {
    const shown = new Set(pastCampaigns.map((c) => c.brandName.trim().toLowerCase()));
    return pastBrands.filter((b) => !shown.has(b.name.toLowerCase()));
  }, [pastBrands, pastCampaigns]);
  const showCampaigns = pastCampaigns.length > 0 || extraBrands.length > 0 || showReviews;
  // Instagram / YouTube / Facebook first, then any other connected platform.
  const allPlatforms = useMemo(() => {
    const extra = (["twitter", "linkedin", "threads", "snapchat", "pinterest", "twitch", "spotify", "tiktok"] as const)
      .map((key) => {
        const acc = socials?.[key];
        const handle = (acc?.username || "").replace(/^@/, "").trim();
        if (!acc || acc.enabled === false || (!acc.url && !handle)) return null;
        return {
          key,
          label: PLATFORM_BRAND[key]?.label || key,
          handle: handle || acc.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""),
          count: acc.followers || 0,
          unit: key === "spotify" ? "listeners" : "followers",
          url: acc.url,
        };
      })
      .filter(Boolean) as { key: string; label: string; handle: string; count: number; unit: string; url: string }[];
    return [...connectedPlatforms, ...extra];
  }, [connectedPlatforms, socials]);

  // India-specific commercial terms (GST, payment, barter, add-ons).
  const terms = settings?.commercialTerms;
  const termRows = [
    terms?.gstRegistered || terms?.pricesPlusGst
      ? {
          label: "GST",
          value: [
            terms?.gstRegistered ? "GST registered" : "",
            terms?.gstin ? `GSTIN ${terms.gstin}` : "",
            terms?.pricesPlusGst ? "Prices + 18% GST" : "",
          ].filter(Boolean).join(" · "),
        }
      : null,
    settings?.minBudget?.trim() ? { label: "Min budget", value: settings.minBudget.trim().startsWith("₹") ? settings.minBudget.trim() : `₹${settings.minBudget.trim()}` } : null,
    terms?.paymentTerms ? { label: "Payment", value: terms.paymentTerms } : null,
    terms?.barter
      ? {
          label: "Barter",
          value:
            terms.barter === "no"
              ? "Paid collaborations only"
              : `${terms.barter === "hybrid" ? "Paid + barter collabs welcome" : "Barter collabs welcome"}${
                  terms.barterMinValue ? ` (min product value ${terms.barterMinValue})` : ""
                }`,
        }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];
  const termAddOns = (terms?.addOns || []).filter((a) => a.label);
  const showTerms = termRows.length > 0 || termAddOns.length > 0;


  const mediaKitPublicUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://inflixo.com";
    if (typeof window !== "undefined") {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return `${window.location.origin}/${cleanHandle}/mediakit`;
      }
    }
    return `${base.replace(/\/$/, "")}/${cleanHandle}/mediakit`;
  }, [cleanHandle]);

  const qrSvg = useMemo(() => {
    try {
      return renderSVG(mediaKitPublicUrl);
    } catch {
      return null;
    }
  }, [mediaKitPublicUrl]);

  const handleCopyMediaKitLink = async () => {
    if (isInformational) {
      showToast("Copies your public media kit link ✨");
      return;
    }
    const ok = await copyToClipboard(mediaKitPublicUrl);
    if (ok) {
      setCopiedLink(true);
      showToast("Media kit link copied! ✨");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      showToast("Could not copy link", "error");
    }
  };

  const { download: downloadPdf, loading: pdfLoading } = useMediaKitPdf(cleanHandle);

  // WhatsApp-first, pre-filled (most Indian brand deals start on WhatsApp).
  const whatsappDigits = (settings?.allowWhatsapp === false ? "" : settings?.whatsappNumber || (profile as { whatsappNumber?: string }).whatsappNumber || "").replace(/\D/g, "");
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hi ${creatorFirstName}, I'm reaching out from [brand] about a collaboration. Saw your Inflixo media kit: ${mediaKitPublicUrl}`)}`
    : "";
  const showStickyBar = !isInformational && !activeIsPrint;
  const businessEmail = settings?.allowEmail === false ? "" : (settings?.sponsorEmail || "").trim();

  const handleDownloadPdf = () => {
    if (isInformational) {
      showToast("Downloads your 2-page A4 Media Kit PDF ✨");
      return;
    }
    void downloadPdf();
  };

  // ── Layout helpers ────────────────────────────────────────────
  const languagesList = (Array.isArray(settings?.contentLanguages) ? settings!.contentLanguages : String(settings?.contentLanguages || "").split(","))
    .map((l) => String(l).trim())
    .filter(Boolean);
  const primaryCategory = (profile.customCategory || profile.category || "").split(/[,•·]/)[0].trim();
  const heroLine = (settings?.bioHighlight || profile.bio || "").trim();
  const deliveryDays = activePackages.map((p) => Number(p.turnaroundDays) || 0).filter((n) => n > 0);
  const typicalDelivery = deliveryDays.length
    ? Math.min(...deliveryDays) === Math.max(...deliveryDays)
      ? `${deliveryDays[0]} working ${deliveryDays[0] === 1 ? "day" : "days"}`
      : `${Math.min(...deliveryDays)}–${Math.max(...deliveryDays)} working days`
    : "";
  const firstDetail = <K extends keyof NonNullable<MediaKitPackage["details"]>>(k: K) =>
    activePackages.map((p) => p.details?.[k]).find((v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));
  const usageRight = firstDetail("usageRights");
  const usageText = usageRight
    ? [USAGE_RIGHTS.find((u) => u.value === usageRight)?.label, firstDetail("usageDuration")].filter(Boolean).join(" · ")
    : "";
  const revisionsText = revisionsLabel(firstDetail("revisions") as string | undefined);
  const gstText = terms?.pricesPlusGst
    ? "Extra (18% GST on package price)"
    : terms?.gstRegistered
      ? "Included in package price"
      : "";
  const rateRows = [
    showPackages ? { icon: IndianRupee, label: "Pricing", value: settings?.minBudget?.trim() ? `As per package · from ${settings.minBudget.trim().startsWith("₹") ? settings.minBudget.trim() : `₹${settings.minBudget.trim()}`}` : "As per selected package" } : null,
    gstText ? { icon: Percent, label: "GST", value: `${gstText}${terms?.gstin ? ` · GSTIN ${terms.gstin}` : ""}` } : null,
    terms?.paymentTerms ? { icon: CreditCard, label: "Payment terms", value: terms.paymentTerms } : null,
    terms?.barter
      ? {
          icon: Handshake,
          label: "Barter",
          value:
            terms.barter === "no"
              ? "Paid collaborations only"
              : `${terms.barter === "hybrid" ? "Paid + barter welcome" : "Barter welcome"}${terms.barterMinValue ? ` (min product value ${terms.barterMinValue})` : ""}`,
        }
      : null,
    usageText ? { icon: Link2, label: "Usage rights", value: usageText } : null,
    revisionsText ? { icon: RefreshCw, label: "Revisions", value: revisionsText } : null,
    typicalDelivery ? { icon: CalendarDays, label: "Typical delivery", value: typicalDelivery } : null,
  ].filter(Boolean) as { icon: typeof IndianRupee; label: string; value: string }[];
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [openPkg, setOpenPkg] = useState<Record<string, boolean>>({});
  const shownCampaigns = showAllCampaigns || activeIsPrint ? pastCampaigns : pastCampaigns.slice(0, 3);

  const card = MK_CARD;
  const tile = "rounded-[5px] border border-(--surface-border) bg-(--card-bg)";
  const primaryBtn =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[5px] px-4 text-[14px] font-semibold transition-opacity hover:opacity-95 cursor-pointer";
  const outlineBtn =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-[5px] border border-(--surface-border) bg-(--card-bg) px-4 text-[14px] font-semibold text-(--text) transition-colors hover:bg-(--surface) cursor-pointer disabled:cursor-wait";
  const accentStyle = { backgroundColor: "var(--accent)", color: "var(--on-accent)" } as const;

  return (
    <div className="w-full space-y-2.5 text-left">
      {/* TOP BAR — Inflixo · Media Kit, share + PDF */}
      {/* Stays pinned while brands scroll, like the profile's nav. */}
      <div className="sticky top-0 z-30 -mx-(--card-px) -mt-5 flex h-12 items-center justify-between gap-3 rounded-t-[5px] border-b border-(--surface-border) bg-[var(--header-bg,var(--card-bg))] px-4 text-(--text)">
        <a href={`/${cleanHandle}`} aria-label="Back to profile" className="flex items-center gap-2.5">
          {/* Same Inflixo wordmark as everywhere else, drawn in the bar's text colour. */}
          <span role="img" aria-label="Inflixo" className="inflixo-logo inline-block h-6 shrink-0" />
          <span aria-hidden className="h-4 w-px bg-(--surface-border)" />
          <span className="text-[14px] font-semibold text-(--text-secondary)">Media Kit</span>
        </a>
        {!activeIsPrint && (
          <span className="no-print flex items-center gap-2">
            <button type="button" onClick={onShare || handleCopyMediaKitLink} aria-label="Share media kit" className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-(--surface-border) text-(--text-secondary) cursor-pointer hover:bg-(--surface)">
              <Share2 className="h-4 w-4" />
            </button>
            <button type="button" onClick={handleDownloadPdf} disabled={pdfLoading} aria-label="Download media kit PDF" className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-(--surface-border) text-(--text-secondary) cursor-pointer hover:bg-(--surface) disabled:cursor-wait">
              {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>
          </span>
        )}
      </div>

      {/* 01. CREATOR HEADER */}
      <section className={`${card} print-avoid-break px-4 pb-4 pt-5 text-center`}>
        <CreatorAvatar
          src={profile.photoDataUrl}
          name={displayName}
          className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-(--surface)"
          textClassName="text-2xl font-bold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        />
        <h1 className="mt-2.5 flex items-center justify-center gap-1.5 text-[22px] font-extrabold leading-7 text-(--text)">
          <span className="min-w-0 break-words">{displayName}</span>
          {profile.isVerified !== false && <BadgeCheck aria-label="Verified" className="h-5 w-5 shrink-0 fill-[#1D9BF0] text-white" />}
        </h1>
        <p className="text-[13px] text-(--text-muted)">@{cleanHandle}</p>
        {(primaryCategory || locationText || languagesList.length > 0) && (
          <ul className="mt-2.5 flex flex-wrap justify-center gap-1.5 text-[12px] font-medium">
            {primaryCategory && <li className="rounded-full border border-(--surface-border) px-2.5 py-1 text-(--text-secondary)">{primaryCategory} Creator</li>}
            {locationText && (
              <li className="inline-flex items-center gap-1 rounded-full border border-(--surface-border) px-2.5 py-1 text-(--text-secondary)">
                <MapPin aria-hidden className="h-3.5 w-3.5 text-(--text-muted)" />
                {locationText}
              </li>
            )}
            {languagesList.length > 0 && (
              <li className="inline-flex items-center gap-1 rounded-full border border-(--surface-border) px-2.5 py-1 text-(--text-secondary)">
                <Languages aria-hidden className="h-3.5 w-3.5 text-(--text-muted)" />
                {languagesList.join(" · ")}
              </li>
            )}
          </ul>
        )}
        {heroLine && <p className="mx-auto mt-2.5 max-w-[420px] text-[14px] leading-5 text-(--text-secondary)">{heroLine}</p>}
        {allPlatforms.length > 0 && (
          <div className="mt-3 flex justify-center gap-2">
            {allPlatforms.slice(0, 6).map((p) => (
              <a key={p.key} href={p.url || undefined} target="_blank" rel="noopener noreferrer" aria-label={p.label} className={`${tile} flex h-10 w-10 items-center justify-center hover:border-(--text-muted)`}>
                <BrandPlatformIcon platform={p.key} size={22} />
              </a>
            ))}
          </div>
        )}
        <dl className="mt-4 grid grid-cols-3 divide-x divide-(--surface-border)">
          <div className="px-2">
            <dt className="text-[12px] text-(--text-muted)">Total Fanbase</dt>
            <dd className="mt-0.5 text-[22px] font-extrabold leading-7 text-(--text)">{calculatedFans > 0 ? formatFans(calculatedFans) : "—"}</dd>
          </div>
          <div className="px-2">
            <dt className="text-[12px] text-(--text-muted)">Packages</dt>
            <dd className="mt-0.5 text-[22px] font-extrabold leading-7 text-(--text)">{activePackages.length}</dd>
          </div>
          <div className="px-2">
            <dt className="text-[12px] text-(--text-muted)">Availability</dt>
            <dd className="mt-1.5 flex items-center justify-center gap-1.5 text-[13px] font-bold leading-4 text-(--text)">
              <span className={`h-2 w-2 shrink-0 rounded-full ${availability === "busy" ? "bg-amber-500" : "bg-emerald-500"}`} />
              {availability === "busy" ? "Busy" : "Open for collabs"}
            </dd>
          </div>
        </dl>
        {!activeIsPrint && (
          <div className="no-print mt-4 space-y-2">
            <button type="button" onClick={() => onEnquirePackage?.(null)} style={accentStyle} className={primaryBtn}>
              <Send aria-hidden className="h-4 w-4" />
              Request Collaboration
            </button>
            <button type="button" onClick={handleDownloadPdf} disabled={pdfLoading} aria-busy={pdfLoading} className={outlineBtn}>
              {pdfLoading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Download aria-hidden className="h-4 w-4" />}
              {pdfLoading ? PDF_PREPARING_LABEL : "Download Media Kit (PDF)"}
            </button>
          </div>
        )}
      </section>

      {/* 02. ABOUT ME FOR BRANDS */}
      {(introText || locationText || typicalDelivery || niches.length > 0) && (
        <Block icon={User} title="About Me for Brands">
          {introText && <p className="whitespace-pre-line break-words text-[14px] leading-[21px] text-(--text-secondary)">{introText}</p>}
          {nowMaking && (
            <p className="mt-2 text-[13px] text-(--text)">
              <strong className="font-semibold text-(--text)">Now making:</strong> {nowMaking}
            </p>
          )}
          {niches.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Content niches">
              {niches.map((n) => (
                <li key={n} className="rounded-full border border-(--surface-border) px-2.5 py-0.5 text-[12px] font-medium text-(--text-secondary)">{n}</li>
              ))}
            </ul>
          )}
          <dl className="mt-3 grid grid-cols-3 gap-2">
            {[
              locationText ? { icon: MapPin, label: "Location", value: locationText } : null,
              replyTime ? { icon: MessageCircle, label: "Reply Time", value: replyTime } : null,
              typicalDelivery ? { icon: CalendarDays, label: "Typical Delivery", value: typicalDelivery } : null,
            ]
              .filter(Boolean)
              .map((t) => {
                const T = t!.icon;
                return (
                  <div key={t!.label} className={`${tile} flex min-w-0 flex-col gap-1 p-2.5`}>
                    <T aria-hidden className="h-4 w-4 shrink-0 text-(--text-muted)" strokeWidth={1.8} />
                    <div className="min-w-0">
                      <dt className="text-[12px] font-bold leading-4 text-(--text)">{t!.label}</dt>
                      <dd className="break-words text-[12px] leading-4 text-(--text-secondary)">{t!.value}</dd>
                    </div>
                  </div>
                );
              })}
          </dl>
        </Block>
      )}

      {/* 03. AUDIENCE & REACH */}
      {showAudience && (
        <Block icon={UsersRound} title="Audience & Reach">
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-[150px_minmax(0,1fr)] print:grid-cols-[150px_minmax(0,1fr)]">
            <div className="flex flex-col items-center justify-center rounded-[5px] border border-(--surface-border) bg-(--surface) px-3 py-4 text-center">
              <span className="text-[28px] font-extrabold leading-8 text-(--text)">{calculatedFans > 0 ? formatFans(calculatedFans) : "—"}</span>
              <span className="text-[13px] text-(--text-secondary)">Total Fanbase</span>
              {creatorEra?.badge && <span className="mt-1 text-[11px] font-medium text-(--text-muted)">{creatorEra.badge}</span>}
            </div>
            <ul className="divide-y divide-(--surface-border)">
              {allPlatforms.map((plat) => (
                <li key={plat.key}>
                  <a href={plat.url || undefined} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 py-2">
                    <BrandPlatformIcon platform={plat.key} size={22} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-(--text)">{plat.label}</span>
                    {plat.count > 0 && (
                      <span className="shrink-0 text-[13px] text-(--text-secondary)">
                        {formatFans(plat.count)} {plat.unit.charAt(0).toUpperCase() + plat.unit.slice(1)}
                      </span>
                    )}
                    <ChevronRight aria-hidden className="no-print h-4 w-4 shrink-0 text-(--text-muted)" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {audienceStats.filter((t) => t.label !== "Languages").length > 0 && (
            <dl className="mt-3 grid grid-cols-3 gap-2">
              {audienceStats
                .filter((t) => t.label !== "Languages")
                .map((t) => (
                  <div key={t.label} className={`${tile} px-2.5 py-2`}>
                    <dt className="text-[11px] text-(--text-muted)">{t.label}</dt>
                    <dd className="line-clamp-2 break-words text-[14px] font-bold text-(--text)">{t.value}</dd>
                  </div>
                ))}
            </dl>
          )}
          {audienceDesc && <p className="mt-3 text-[13px] leading-5 text-(--text-secondary)">{audienceDesc}</p>}
          {languagesList.length > 0 && (
            <p className="mt-3 flex items-center gap-2 border-t border-(--surface-border) pt-3 text-[13px] text-(--text-secondary)">
              <Languages aria-hidden className="h-4 w-4 shrink-0 text-(--text-muted)" />
              <span>
                <strong className="font-semibold text-(--text)">Languages:</strong> {languagesList.join(", ")}
              </span>
            </p>
          )}
        </Block>
      )}

      {/* 04. PAST CAMPAIGNS — proof of work */}
      {showCampaigns && (
        <Block
          icon={Megaphone}
          title="Past Campaigns"
          action={
            pastCampaigns.length > 3 && !activeIsPrint ? (
              <button type="button" onClick={() => setShowAllCampaigns((v) => !v)} className="no-print inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-(--accent-text) hover:underline cursor-pointer">
                {showAllCampaigns ? "Show less" : `View All (${pastCampaigns.length})`}
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </button>
            ) : undefined
          }
        >
          {shownCampaigns.length > 0 && (
            <div className="-mx-3.5 flex snap-x gap-2.5 overflow-x-auto px-3.5 pb-1 min-[460px]:mx-0 min-[460px]:grid min-[460px]:grid-cols-3 min-[460px]:overflow-visible min-[460px]:px-0 min-[460px]:pb-0 print:mx-0 print:grid print:grid-cols-3 print:px-0">
              {shownCampaigns.map((c) => {
                const cover = c.thumbnailUrl || c.brandLogoUrl || "";
                const kind = c.platform === "youtube" ? "Campaign Video" : "Campaign Post";
                return (
                  <article key={c.id} className={`${tile} print-avoid-break w-[62%] shrink-0 snap-start overflow-hidden min-[460px]:w-auto print:w-auto`}>
                    <a href={c.campaignUrl || undefined} target="_blank" rel="noopener noreferrer" className="relative block aspect-[16/11] bg-(--surface)" aria-label={`Watch ${c.brandName} campaign`}>
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element -- uploaded campaign cover / brand logo
                        <img src={cover} alt="" className={`h-full w-full ${c.thumbnailUrl ? "object-cover" : "object-contain p-5"}`} />
                      ) : (
                        <span aria-hidden className="flex h-full w-full items-center justify-center text-[26px] font-bold text-(--text-muted)">{c.brandName.trim().charAt(0).toUpperCase()}</span>
                      )}
                      {c.campaignUrl && (
                        <span aria-hidden className="no-print absolute inset-0 m-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white">
                          <Play className="ml-0.5 h-4 w-4 fill-current" />
                        </span>
                      )}
                      {c.duration && <span className="absolute bottom-1.5 right-1.5 rounded-[3px] bg-black/75 px-1.5 text-[11px] font-semibold leading-4 text-white">{c.duration}</span>}
                    </a>
                    <div className="space-y-0.5 p-2.5">
                      <p className="truncate text-[13px] font-bold text-(--text)">{c.brandName}</p>
                      {c.campaignTitle && <p className="line-clamp-2 text-[12px] leading-4 text-(--text-secondary)">{c.campaignTitle}</p>}
                      {c.description && <p className="line-clamp-2 text-[11px] leading-4 text-(--text-muted)">{c.description}</p>}
                      <p className="flex items-center gap-1.5 pt-1.5 text-[11px] font-medium text-(--text-secondary)">
                        {platformIcon(c.platform)}
                        <span className="min-w-0 flex-1 truncate">{kind}</span>
                        {c.campaignUrl && (
                          <a href={c.campaignUrl} target="_blank" rel="noopener noreferrer" aria-label="Open campaign" className="no-print shrink-0 text-(--accent-text)">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {extraBrands.length > 0 && (
            <div className={shownCampaigns.length > 0 ? "mt-3" : ""}>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-(--text-muted)">{pastCampaigns.length > 0 ? "Also worked with" : "Brands I've worked with"}</p>
              <ul className="flex flex-wrap gap-1.5">
                {extraBrands.map((b) => (
                  <li key={b.name} className="inline-flex items-center gap-1.5 rounded-full border border-(--surface-border) bg-(--card-bg) py-0.5 pl-0.5 pr-2.5 text-[12px] font-semibold text-(--text)">
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- brand logos of any host
                      <img src={b.logo} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-(--surface) text-[10px] font-bold text-(--text-secondary)">{b.name.charAt(0).toUpperCase()}</span>
                    )}
                    {b.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showReviews && (
            <div className="mt-3 space-y-2">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">
                <Star aria-hidden className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                What brands say
              </p>
              {visibleReviews.slice(0, activeIsPrint ? 3 : 3).map((rev) => {
                const stars = Number(rev.rating) || 5;
                return (
                  <blockquote key={rev.id} className={`${tile} print-avoid-break space-y-1.5 p-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="flex min-w-0 items-center gap-1 text-[13px] font-bold text-(--text)">
                        <span className="truncate">{rev.clientName}</span>
                        {rev.isVerified && <BadgeCheck aria-label="Verified" className="h-3.5 w-3.5 shrink-0 text-(--accent-text)" />}
                      </p>
                      <span className="flex shrink-0 items-center gap-0.5" aria-label={`${stars} out of 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} aria-hidden className={`h-3 w-3 ${i < Math.round(stars) ? "fill-amber-400 text-amber-500" : "text-(--surface-border)"}`} />
                        ))}
                      </span>
                    </div>
                    {(rev.clientDesignation || rev.projectTitle) && <p className="text-[11px] text-(--text-muted)">{[rev.clientDesignation, rev.projectTitle].filter(Boolean).join(" · ")}</p>}
                    {rev.comment && <p className="text-[13px] italic leading-5 text-(--text-secondary)">&ldquo;{rev.comment.trim()}&rdquo;</p>}
                  </blockquote>
                );
              })}
            </div>
          )}
        </Block>
      )}

      {/* 05. WORK WITH ME — packages */}
      {showPackages && (
        <Block icon={Layers} title="Collaboration Packages" accent="(Work With Me)">
          <ul className="space-y-3">
            {activePackages.map((pkg) => {
              const v = packageView(pkg, terms?.pricesPlusGst);
              const items = pkg.details?.items || [];
              const summary = items.length ? shortItemsSummary(items) : (pkg.deliverables || []).slice(0, 3).join(" + ");
              const open = activeIsPrint || Boolean(openPkg[pkg.id]);
              const hasMore = v.deliverables.length > 0 || (v.d?.inclusions?.length ?? 0) > 0 || v.terms.length > 0 || v.requirements.length > 0;
              return (
                <li key={pkg.id} className={`${tile} print-avoid-break p-2.5 ${pkg.isPopular ? "border-(--text-muted)" : ""}`}>
                  <div className="flex gap-3">
                    <div className="h-[92px] w-[96px] shrink-0 overflow-hidden rounded-[5px] bg-(--surface) min-[460px]:h-[110px] min-[460px]:w-[140px]">
                      {pkg.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element -- uploaded package cover
                        <img src={pkg.coverImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center gap-1">
                          {v.platforms.length ? v.platforms.map((p) => <span key={p}>{platformIcon(p)}</span>) : <Layers aria-hidden className="h-6 w-6 text-(--text-muted)" />}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-0.5 min-[460px]:flex-row min-[460px]:items-start min-[460px]:justify-between min-[460px]:gap-2">
                        <h3 className="line-clamp-2 break-words text-[15px] font-bold leading-5 text-(--text)">
                          {pkg.title}
                          {pkg.isPopular && <span className="ml-1.5 rounded-full border border-(--surface-border) px-1.5 py-0.5 align-middle text-[10px] font-bold text-(--text-secondary)">Popular</span>}
                        </h3>
                        <p className="shrink-0 leading-tight min-[460px]:text-right">
                          <span className="whitespace-nowrap text-[17px] font-extrabold text-(--text)">{v.price}</span>
                          {v.gst && <span className="block text-[10px] font-semibold text-(--text-muted)">{v.gst}</span>}
                        </p>
                      </div>
                      {(v.platforms.length > 0 || summary) && (
                        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-(--text-secondary)">
                          {v.platforms.length > 0 && <span className="flex shrink-0 items-center gap-1">{v.platforms.map((p) => <span key={p}>{platformIcon(p)}</span>)}</span>}
                          <span className="min-w-0 truncate">{summary}</span>
                        </p>
                      )}
                      {v.description && <p className="mt-1 line-clamp-2 text-[12px] leading-[17px] text-(--text-secondary)">{v.description}</p>}
                    </div>
                  </div>

                  {hasMore && open && (
                    <div className="mt-3 space-y-2.5 border-t border-(--surface-border) pt-3">
                      {v.deliverables.length > 0 && (
                        <div>
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">What your brand gets</p>
                          <ul className="space-y-1">
                            {v.deliverables.map((it, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[13px] leading-[18px]">
                                <Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--text-muted)" strokeWidth={3} />
                                <span className="min-w-0 break-words">
                                  <span className="font-semibold text-(--text)">{it.text}</span>
                                  {(it.extras.length > 0 || it.notes) && <span className="text-(--text-muted)"> · {[...it.extras, it.notes].filter(Boolean).join(" · ")}</span>}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {v.d?.inclusions?.length ? (
                        <div>
                          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">Also included</p>
                          <ul className="flex flex-wrap gap-1.5">
                            {v.d.inclusions.map((inc) => (
                              <li key={inc} className="rounded-full border border-(--surface-border) px-2 py-0.5 text-[11px] font-medium text-(--text-secondary)">{inc}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {v.d && v.d.collabType !== "paid" && v.d.barterDetails && (
                        <p className="text-[12px] text-(--text-secondary)"><strong className="text-(--text)">Barter:</strong> {v.d.barterDetails}</p>
                      )}
                      {v.terms.length > 0 && (
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 min-[460px]:grid-cols-3">
                          {v.terms.map((t) => (
                            <div key={t.label} className="min-w-0">
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">{t.label}</dt>
                              <dd className="break-words text-[12px] font-medium text-(--text)">{t.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {v.requirements.length > 0 && <p className="text-[11px] leading-4 text-(--text-muted)"><strong className="font-semibold">Good to know:</strong> {v.requirements.join(" · ")}</p>}
                    </div>
                  )}

                  {!activeIsPrint && (
                    <div className="no-print mt-2.5 flex flex-col-reverse gap-2 min-[460px]:flex-row min-[460px]:items-center">
                      {hasMore && (
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenPkg((o) => ({ ...o, [pkg.id]: !o[pkg.id] }))}
                          className="inline-flex h-10 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[5px] border border-(--surface-border) px-3 text-[13px] font-semibold text-(--text) hover:bg-(--surface) cursor-pointer"
                        >
                          {open ? "Hide details" : "What's included"}
                          <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                      )}
                      <button type="button" onClick={() => onEnquirePackage?.(pkg)} style={accentStyle} className={`${primaryBtn} h-10 flex-1 whitespace-nowrap`}>
                        <Send aria-hidden className="h-4 w-4" />
                        Request This Package
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Block>
      )}

      {/* 06 + 07. BRAND FIT · MY PROMISE */}
      {(showFitChips || showPromises) && (
        <div className={`grid grid-cols-1 gap-2.5 ${showFitChips && showPromises ? "min-[460px]:grid-cols-2 print:grid-cols-2" : ""}`}>
          {showFitChips && (
            <Block icon={Target} title="Brand Fit">
              <div className="space-y-3">
                {fitTags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-(--text)">Great Fit For</p>
                      <p className="text-[13px] leading-5 text-(--text-secondary)">{fitTags.join(", ")}</p>
                    </div>
                  </div>
                )}
                {nofitTags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <X aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#C2414B]" strokeWidth={3} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-(--text)">Not a Fit For</p>
                      <p className="text-[13px] leading-5 text-(--text-secondary)">{nofitTags.join(", ")}</p>
                    </div>
                  </div>
                )}
              </div>
            </Block>
          )}
          {showPromises && (
            <Block icon={ShieldCheck} title="My Promise">
              <ul className="space-y-1.5">
                {promises.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[13px] leading-5 text-(--text-secondary)">
                    <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-(--text-muted)" strokeWidth={2.5} />
                    <span className="min-w-0">{p}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      )}

      {/* 08. THE CREW — only when the creator has a team */}
      {showTeam && (
        <Block
          icon={Users}
          title={team?.team?.teamName?.trim() || "The Crew"}
          action={<span className="shrink-0 rounded-full border border-(--surface-border) px-2 py-0.5 text-[11px] font-semibold text-(--text-secondary)">{activeTeamMembers.length} {activeTeamMembers.length === 1 ? "Member" : "Members"}</span>}
        >
          <ul className="grid grid-cols-3 gap-2">
            {activeTeamMembers.slice(0, 9).map((m) => (
              <li key={m.id} className="min-w-0 text-center">
                <CreatorAvatar
                  src={m.avatarUrl || undefined}
                  name={m.name}
                  className="mx-auto h-11 w-11 rounded-full object-cover"
                  textClassName="text-[13px] font-bold text-(--text-secondary)"
                  style={{ backgroundColor: "var(--surface)" }}
                />
                <p className="mt-1.5 truncate text-[12px] font-bold text-(--text)">{m.name}</p>
                {m.role && <p className="truncate text-[11px] text-(--text-muted)">{m.role}</p>}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {/* 09. RATES, GST & TERMS */}
      {(rateRows.length > 0 || termAddOns.length > 0) && (
        <Block icon={FileText} title="Rates, GST & Terms">
          {rateRows.length > 0 && (
            <dl className="divide-y divide-(--surface-border)">
              {rateRows.map((r) => {
                const I = r.icon;
                return (
                  <div key={r.label} className="grid grid-cols-[118px_minmax(0,1fr)] gap-2 py-2 min-[420px]:grid-cols-[150px_minmax(0,1fr)] min-[420px]:gap-3">
                    <dt className="flex items-center gap-2 text-[13px] font-bold text-(--text)">
                      <I aria-hidden className="h-4 w-4 shrink-0 text-(--text-muted)" strokeWidth={1.8} />
                      {r.label}
                    </dt>
                    <dd className="break-words text-[13px] text-(--text-secondary)">{r.value}</dd>
                  </div>
                );
              })}
            </dl>
          )}
          {termAddOns.length > 0 && (
            <div className="mt-2 border-t border-(--surface-border) pt-2">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">Add-ons</p>
              <ul className="space-y-1">
                {termAddOns.map((a, i) => (
                  <li key={`${a.label}-${i}`} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="min-w-0 break-words text-(--text)">{a.label}</span>
                    <span className="shrink-0 font-bold text-(--text)">{a.price ? (a.price.startsWith("₹") ? a.price : `₹${a.price}`) : "On request"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Block>
      )}

      {/* 10. BEFORE YOU GO */}
      <section className={`${card} print-avoid-break p-3.5 sm:p-4`}>
        <div className="flex flex-col gap-3 min-[460px]:flex-row min-[460px]:items-center print:flex-row print:items-center">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-[16px] font-bold text-(--text)">
              <Quote aria-hidden className="h-5 w-5 shrink-0 text-(--text-muted)" strokeWidth={1.8} />
              Before You Go
            </h2>
            <p className="mt-1.5 text-[13px] italic leading-5 text-(--text-secondary)">
              &ldquo;Thank you for taking the time to read my media kit. I value meaningful collaborations with brands that fit my audience,
              and I keep every campaign on time and in my own voice.&rdquo;
            </p>
          </div>
          <div className="shrink-0 border-(--surface-border) min-[460px]:border-l min-[460px]:pl-4 print:border-l print:pl-4">
            <p className="text-[12px] text-(--text-muted)">Regards,</p>
            <p style={{ fontFamily: "'Caveat', 'Playfair Display', cursive, serif" }} className="select-none text-[26px] font-semibold italic leading-8 text-(--text)">
              {signatureName}
            </p>
          </div>
        </div>
      </section>

      {/* 11. CONTACT & ENQUIRE */}
      {(businessEmail || whatsappDigits) && (
        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-2 text-[12px] text-(--text-secondary)">
          {businessEmail && (
            <a href={`mailto:${businessEmail}`} className="inline-flex items-center gap-1 hover:text-(--accent-text)">
              <Mail aria-hidden className="h-3.5 w-3.5 text-(--text-muted)" />
              {businessEmail}
            </a>
          )}
          {whatsappDigits && (
            <a href={whatsappHref || undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-(--accent-text)">
              <MessageCircle aria-hidden className="h-3.5 w-3.5 text-(--text-muted)" />
              +{whatsappDigits}
            </a>
          )}
        </p>
      )}
      {!activeIsPrint ? (
        <div className="no-print grid grid-cols-1 gap-2">
          <button type="button" onClick={() => onEnquirePackage?.(null)} style={accentStyle} className={primaryBtn}>
            <Send aria-hidden className="h-4 w-4" />
            Request Collaboration
          </button>
          <button type="button" onClick={handleDownloadPdf} disabled={pdfLoading} aria-busy={pdfLoading} className={outlineBtn}>
            {pdfLoading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Download aria-hidden className="h-4 w-4" />}
            {pdfLoading ? PDF_PREPARING_LABEL : "Download Media Kit (PDF)"}
          </button>
          <button type="button" onClick={onShare || handleCopyMediaKitLink} className={outlineBtn}>
            {copiedLink ? <Check aria-hidden className="h-4 w-4 text-emerald-600" /> : <Share2 aria-hidden className="h-4 w-4" />}
            {copiedLink ? "Link copied!" : "Share Media Kit"}
          </button>
        </div>
      ) : (
        qrSvg && (
          <div className={`${card} flex items-center justify-between gap-4 p-3.5`}>
            <div className="min-w-0 space-y-1">
              <p className="text-[12px] font-bold text-(--text)">Request a collaboration</p>
              <p className="text-[11px] text-(--text-secondary)">Scan for live numbers, campaigns and packages.</p>
              <p className="break-all text-[11px] text-(--text-muted)">
                inflixo.com/{cleanHandle}/mediakit · Numbers as of {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="h-16 w-16 shrink-0 rounded-[5px] border border-(--surface-border) bg-white p-1" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          </div>
        )
      )}

      {/* Phones: always-visible contact bar (not in previews or the PDF). */}
      {showStickyBar && (
        <>
          <div aria-hidden className="h-16 sm:hidden" />
          {/* Portalled to <body>: the card's backdrop-filter would make "fixed" stick to the card, not the screen. */}
          {mounted && createPortal(
          <div
            data-no-print="true"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E7E0D6] bg-white/95 px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] backdrop-blur-sm sm:hidden"
          >
            <div className="mx-auto flex max-w-[480px] items-center gap-2">
              <button
                type="button"
                onClick={() => onEnquirePackage?.(null)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[5px] bg-[#7A2253] px-3 text-[14px] font-semibold text-white cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Enquire</span>
              </button>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[5px] border border-[#25D366]/50 bg-[#25D366]/10 px-3 text-[14px] font-semibold text-[#128C4B]"
                >
                  <span>WhatsApp</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                aria-label="Download media kit PDF"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] border border-[#E7E0D6] bg-white text-[#1C1917] cursor-pointer disabled:cursor-wait"
              >
                {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </button>
            </div>
          </div>,
          document.body,
          )}
        </>
      )}

      {/* Print stylesheet for 2-Page A4 PDF layout */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm 12mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, [data-no-print="true"] {
            display: none !important;
          }
          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* The screen layout pins the card column to the viewport height; let it grow across pages. */
          html, body, main, main * {
            max-height: none !important;
          }
          main, main * {
            animation: none !important;
          }
          .overflow-clip {
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}
