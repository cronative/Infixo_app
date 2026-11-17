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
} from "lucide-react";
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
import { PackageCard, platformIcon } from "@/components/mediakit/PackageCard";
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

  return (
    <div className="w-full space-y-2 text-left">
      {/* 02. HELLO — who I am, where, availability */}
      {showHello && (
        <SectionCard
          as="section"
          icon={Sparkles}
          title="Hello"
          subtitle="Who I am and what I make."
          count={availability === "busy" ? "Busy right now" : "Open for collabs"}
          colors={NO_COLORS}
        >
          <div className={CARD_LIST}>
            <div className={`${CARD_ITEM} space-y-3 p-3.5`}>
              <div className="flex items-start gap-3">
                <CreatorAvatar
                  src={profile.photoDataUrl}
                  name={displayName}
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                  textClassName="text-lg font-bold text-white"
                  style={{ backgroundColor: "var(--accent)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[16px] font-bold leading-5 text-(--text)">{displayName}</p>
                  {locationText && (
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] text-(--text-muted)">
                      <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 break-words">{locationText}</span>
                    </p>
                  )}
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-(--text-muted)">
                    <span className={`h-2 w-2 rounded-full ${availability === "busy" ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <span className="font-semibold text-(--text)">{availability === "busy" ? "Heads-down creating" : "Open for collaborations"}</span>
                    {replyTime && (
                      <>
                        <span aria-hidden>·</span>
                        <Clock aria-hidden className="h-3 w-3" />
                        <span>Replies {replyTime.toLowerCase()}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <blockquote style={{ fontFamily: SERIF }} className="text-[15px] italic leading-relaxed text-(--text)">
                &ldquo;{introText || `Hi, I'm ${displayName} — I create original stories and thoughtful partnerships for people who care about craft.`}&rdquo;
              </blockquote>

              {nowMaking && (
                <p className="flex items-start gap-2 rounded-[5px] bg-(--accent-soft) px-3 py-2 text-[13px] text-(--text)">
                  <Sparkles aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--accent-text)" />
                  <span>
                    <strong className="font-semibold text-(--accent-text)">Now making:</strong> {nowMaking}
                  </span>
                </p>
              )}

              {niches.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Content niches">
                  {niches.map((n) => (
                    <li key={n} className="rounded-full bg-(--accent-soft) px-2.5 py-0.5 text-[12px] font-medium text-(--accent-text)">
                      {n}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* 03. AUDIENCE & REACH — fans, platform followers, languages */}
      {showAudience && (
        <SectionCard
          as="section"
          icon={UsersRound}
          title="Audience & Reach"
          subtitle={creatorEra ? `${creatorEra.badge} · earned, not bought.` : "The people who tune in."}
          count={calculatedFans > 0 ? `${formatFans(calculatedFans)} fans` : undefined}
          colors={NO_COLORS}
        >
          <div className={CARD_LIST}>
            {audienceDesc && (
              <p className={`${CARD_ITEM} p-3.5 text-[13px] leading-5 text-(--text-secondary)`}>{audienceDesc}</p>
            )}

            {audienceStats.length > 0 && (
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {audienceStats.map((t) => (
                  <div key={t.label} className={`${CARD_ITEM} px-3 py-2.5`}>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted)">{t.label}</dt>
                    <dd title={t.value} className="mt-0.5 line-clamp-2 break-words text-[15px] font-bold leading-5 text-(--text)">
                      {t.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {allPlatforms.map((plat) => (
              <a
                key={plat.key}
                href={plat.url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2.5 p-2.5 ${CARD_ITEM} ${CARD_ITEM_HOVER}`}
              >
                <BrandPlatformIcon platform={plat.key} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold leading-[18px] text-(--text)">{plat.label}</span>
                  <span className="block break-all text-[12px] leading-4 text-(--text-muted)">@{plat.handle}</span>
                </span>
                {plat.count > 0 && (
                  <span className="shrink-0 whitespace-nowrap text-[12px] text-(--text-muted)">
                    <span className="text-[13px] font-semibold text-(--text)">{formatFans(plat.count)}</span> {plat.unit}
                  </span>
                )}
                <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0 text-(--text-muted)" />
              </a>
            ))}

          </div>
        </SectionCard>
      )}

      {/* 04. PAST CAMPAIGNS — the proof brands look for first: work samples, brands, reviews */}
      {showCampaigns && (
        <SectionCard
          as="section"
          icon={Megaphone}
          title="Past Campaigns"
          subtitle="Brand work and results I'm proud of."
          count={pastCampaigns.length > 0 ? `${pastCampaigns.length} ${pastCampaigns.length === 1 ? "campaign" : "campaigns"}` : undefined}
          colors={NO_COLORS}
        >
          {pastCampaigns.length > 0 && (
            <div className="grid grid-cols-1 gap-2 p-2.5 min-[420px]:grid-cols-2 print:grid-cols-2">
              {pastCampaigns.map((c) => {
                const cover = c.thumbnailUrl || c.brandLogoUrl || "";
                const body = (
                  <>
                    <span className="relative block aspect-video overflow-hidden bg-(--accent-soft)">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element -- uploaded campaign cover / brand logo
                        <img src={cover} alt="" className={`h-full w-full ${c.thumbnailUrl ? "object-cover" : "object-contain p-6"}`} />
                      ) : (
                        <span aria-hidden className="flex h-full w-full items-center justify-center text-[28px] font-bold text-(--accent-text)">
                          {c.brandName.trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                      {c.campaignUrl && (
                        <span aria-hidden className="no-print absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white">
                          <Play className="ml-0.5 h-4 w-4 fill-current" />
                        </span>
                      )}
                      {c.duration && <span className="absolute bottom-1.5 right-1.5 rounded-[3px] bg-black/70 px-1.5 text-[10px] font-semibold leading-4 text-white">{c.duration}</span>}
                    </span>
                    <span className="block space-y-0.5 p-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-(--accent-text)">
                        {platformIcon(c.platform)}
                        <span className="min-w-0 truncate">{c.brandName}</span>
                      </span>
                      {c.campaignTitle && <span className="block line-clamp-2 break-words text-[14px] font-bold leading-[18px] text-(--text)">{c.campaignTitle}</span>}
                      {c.description && <span className="block line-clamp-3 break-words text-[12px] leading-[17px] text-(--text-secondary)">{c.description}</span>}
                    </span>
                  </>
                );
                return c.campaignUrl ? (
                  <a key={c.id} href={c.campaignUrl} target="_blank" rel="noopener noreferrer" aria-label={`${c.brandName}: ${c.campaignTitle || "campaign"}`} className={`print-avoid-break block overflow-hidden ${CARD_ITEM} ${CARD_ITEM_HOVER}`}>
                    {body}
                  </a>
                ) : (
                  <article key={c.id} className={`print-avoid-break overflow-hidden ${CARD_ITEM}`}>{body}</article>
                );
              })}
            </div>
          )}

          {extraBrands.length > 0 && (
            <div className={pastCampaigns.length > 0 ? "px-2.5 pb-2.5" : "p-2.5"}>
              <div className={`${CARD_ITEM} space-y-2 p-3.5`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-(--text-muted)">{pastCampaigns.length > 0 ? "Also worked with" : "Brands I've worked with"}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {extraBrands.map((b) => {
                    const chip = (
                      <>
                        {b.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element -- brand logos of any host
                          <img src={b.logo} alt="" className="h-5 w-5 rounded-full object-cover" />
                        ) : (
                          <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-(--accent-soft) text-[10px] font-bold text-(--accent-text)">
                            {b.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span>{b.name}</span>
                      </>
                    );
                    const cls = "inline-flex items-center gap-1.5 rounded-full border border-(--surface-border) bg-(--surface) py-0.5 pl-0.5 pr-2.5 text-[12px] font-semibold text-(--text)";
                    return (
                      <li key={b.name}>
                        {b.url ? (
                          <a href={b.url} target="_blank" rel="noopener noreferrer" className={`${cls} hover:border-(--accent-text)`}>{chip}</a>
                        ) : (
                          <span className={cls}>{chip}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {showReviews && (
            <div className="space-y-0">
              <p className="flex items-center gap-1.5 px-3.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">
                <Star aria-hidden className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                What brands say
              </p>
            <div className={CARD_LIST}>
              {visibleReviews.map((rev) => {
                const stars = Number(rev.rating) || 5;
                const subRatings = [
                  { label: "Content", value: Number(rev.ratingContentQuality) || 0 },
                  { label: "Professional", value: Number(rev.ratingProfessionalism) || 0 },
                  { label: "On time", value: Number(rev.ratingTimelyDelivery) || 0 },
                ].filter((r) => r.value > 0);
                const reviewedOn = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                  : "";
                return (
                  <blockquote key={rev.id} className={`${CARD_ITEM} space-y-2.5 p-3.5`}>
                    <div className="flex items-start gap-2.5">
                      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-[13px] font-bold text-(--accent-text)">
                        {(rev.clientName || "B").trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 text-[14px] font-bold leading-[18px] text-(--text)">
                          <span className="min-w-0 break-words">{rev.clientName}</span>
                          {rev.isVerified && <BadgeCheck aria-label="Verified" className="h-4 w-4 shrink-0 text-(--accent-text)" />}
                        </p>
                        {(rev.clientDesignation || rev.projectTitle) && (
                          <p className="break-words text-[12px] leading-4 text-(--text-muted)">
                            {[rev.clientDesignation, rev.projectTitle].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-right">
                        <span className="flex items-center gap-0.5" aria-label={`${stars} out of 5`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} aria-hidden className={`h-3.5 w-3.5 ${i < Math.round(stars) ? "fill-amber-400 text-amber-500" : "text-(--surface-border)"}`} />
                          ))}
                        </span>
                        <span className="text-[11px] font-semibold text-(--text-muted)">{stars.toFixed(1)}/5</span>
                      </span>
                    </div>

                    {rev.comment && (
                      <p style={{ fontFamily: SERIF }} className="text-[14px] italic leading-relaxed text-(--text)">
                        &ldquo;{rev.comment.trim()}&rdquo;
                      </p>
                    )}

                    {subRatings.length > 0 && (
                      <dl className="grid grid-cols-3 gap-1.5">
                        {subRatings.map((sr) => (
                          <div key={sr.label} className="rounded-[5px] bg-(--surface) px-2 py-1.5 text-center">
                            <dt className="text-[10px] font-semibold uppercase leading-3 tracking-wide text-(--text-muted)">{sr.label}</dt>
                            <dd className="mt-0.5 text-[13px] font-bold text-(--text)">{sr.value.toFixed(1)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}

                    <footer className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-(--text-muted)">
                      <span>
                        Reviewed via Inflixo{reviewedOn ? ` · ${reviewedOn}` : ""}
                      </span>
                      {rev.contentUrl && (
                        <a href={rev.contentUrl} target="_blank" rel="noopener noreferrer" className="no-print inline-flex items-center gap-1 text-[12px] font-semibold text-(--accent-text) hover:underline">
                          See the content
                          <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </footer>
                  </blockquote>
                );
              })}
            </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* 05. WORK WITH ME — packages, prices, deliverables */}
      {showPackages && (
        <SectionCard
          as="section"
          icon={Handshake}
          title="Work With Me"
          subtitle="Packages, prices and exactly what your brand gets."
          count={`${activePackages.length} ${activePackages.length === 1 ? "package" : "packages"}`}
          colors={NO_COLORS}
        >
          {/* No break-avoid here: a tall package kept whole left half-empty PDF pages. */}
          <div className={CARD_LIST}>
            {activePackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} pricesPlusGst={terms?.pricesPlusGst} onRequest={(p) => onEnquirePackage?.(p)} />
            ))}
          </div>
        </SectionCard>
      )}

      {/* 06. BRAND FIT */}
      {showFitChips && (
        <SectionCard as="section" icon={Target} title="Brand Fit" subtitle="Where I add the most value." colors={NO_COLORS}>
          <div className={CARD_LIST}>
            {fitTags.length > 0 && (
              <div className={`${CARD_ITEM} space-y-2 p-3.5`}>
                <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-(--accent-text)">
                  <Check aria-hidden className="h-3.5 w-3.5 stroke-[2.5]" />
                  Great fit for
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {fitTags.map((tag) => (
                    <li key={tag} className="rounded-full bg-(--accent-soft) px-2.5 py-1 text-[12px] font-semibold text-(--accent-text)">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {nofitTags.length > 0 && (
              <div className={`${CARD_ITEM} space-y-2 p-3.5`}>
                <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-(--text-muted)">
                  <X aria-hidden className="h-3.5 w-3.5 stroke-[2.5]" />
                  Probably not the right fit
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {nofitTags.map((tag) => (
                    <li key={tag} className="rounded-full border border-(--surface-border) bg-(--surface) px-2.5 py-1 text-[12px] font-medium text-(--text-muted)">
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* 07. MY PROMISE */}
      {showPromises && (
        <SectionCard as="section" icon={ShieldCheck} title="My Promise" subtitle="What you can count on when we work together." colors={NO_COLORS}>
          <ul className={CARD_LIST}>
            {promises.map((promise) => (
              <li key={promise} className={`${CARD_ITEM} flex items-start gap-2.5 p-3`}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-(--accent-text)">
                  <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 break-words pt-0.5 text-[13px] font-medium leading-[18px] text-(--text)">{promise}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* 08. THE CREW — only when the creator has a team */}
      {showTeam && (
        <SectionCard
          as="section"
          icon={Users}
          title={team?.team?.teamName?.trim() || "The Crew"}
          subtitle={team?.team?.teamDescription?.trim() || "The people behind the camera."}
          count={`${activeTeamMembers.length} ${activeTeamMembers.length === 1 ? "member" : "members"}`}
          colors={NO_COLORS}
        >
          <div className="p-2.5">
            <PublicTeamGroups members={activeTeamMembers} variant="profile" isInformational={isInformational} />
          </div>
        </SectionCard>
      )}

      {/* 09. RATES & TERMS — GST, payment, barter, add-ons (India) */}
      {showTerms && (
        <SectionCard
          as="section"
          icon={IndianRupee}
          title="Rates & Terms"
          subtitle="Good to know before we start."
          colors={NO_COLORS}
          className="print-avoid-break"
        >
          <div className={CARD_LIST}>
            {termRows.length > 0 && (
              <dl className={`${CARD_ITEM} divide-y divide-(--surface-border)`}>
                {termRows.map((row) => (
                  <div key={row.label} className="flex flex-col gap-0.5 px-3.5 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                    <dt className="w-24 shrink-0 text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">{row.label}</dt>
                    <dd className="min-w-0 break-words text-[14px] font-medium text-(--text)">{row.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {termAddOns.length > 0 && (
              <div className={CARD_ITEM}>
                <p className="border-b border-(--surface-border) px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">Add-ons</p>
                <ul className="divide-y divide-(--surface-border)">
                  {termAddOns.map((a, i) => (
                    <li key={`${a.label}-${i}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <span className="min-w-0 break-words text-[13px] text-(--text)">{a.label}</span>
                      <span className="shrink-0 whitespace-nowrap text-[13px] font-bold text-(--accent-text)">
                        {a.price ? (a.price.startsWith("₹") ? a.price : `₹${a.price}`) : "On request"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* 10. BEFORE YOU GO — a short professional closing */}
      <SectionCard as="section" icon={Mail} title="Before You Go" subtitle="Thanks for reading." colors={NO_COLORS} className="print-avoid-break">
        <div className={CARD_LIST}>
          <div className={`${CARD_ITEM} space-y-2 p-3.5`}>
            <p className="text-[14px] leading-[21px] text-(--text)">
              Thank you for considering me for your next campaign. I keep every collaboration native to my audience, on time and
              easy to work with. Let&apos;s create something your customers remember.
            </p>
            <p style={{ fontFamily: "'Caveat', 'Playfair Display', cursive, serif" }} className="select-none text-2xl font-semibold italic text-(--accent-text)">
              {signatureName}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* 11. CONTACT & ENQUIRE — enquiry, contact, PDF, share link */}
      <SectionCard as="section" icon={MessageSquare} title="Contact & Enquire" subtitle="Tell me about your campaign." colors={NO_COLORS} className="print-avoid-break">
        <div className={CARD_LIST}>
          {(businessEmail || whatsappDigits) && (
            <dl className={`${CARD_ITEM} divide-y divide-(--surface-border)`}>
              {businessEmail && (
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">Email</dt>
                  <dd className="min-w-0 break-all text-right text-[13px] font-semibold text-(--text)">{businessEmail}</dd>
                </div>
              )}
              {whatsappDigits && (
                <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted)">WhatsApp</dt>
                  <dd className="text-[13px] font-semibold text-(--text)">+{whatsappDigits}</dd>
                </div>
              )}
            </dl>
          )}

          {qrSvg && (
            <div className={`${CARD_ITEM} flex items-center justify-between gap-4 p-3.5`}>
              <div className="min-w-0 space-y-1">
                <p className="text-[12px] font-bold text-(--text)">Official Creator Media Kit</p>
                <p className="text-[11px] text-(--text-secondary)">Scan for live numbers, campaigns and packages.</p>
                <p className="break-all text-[11px] text-(--text-muted)">
                  inflixo.com/{cleanHandle}/mediakit · Numbers as of{" "}
                  {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="h-16 w-16 shrink-0 rounded-[5px] border border-(--surface-border) bg-white p-1" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
          )}

          {!activeIsPrint && (
            <div className="no-print grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onEnquirePackage?.(null)}
                style={{ backgroundColor: "var(--accent)", color: "var(--on-accent)" }}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[5px] px-4 text-[14px] font-semibold transition-opacity hover:opacity-95 cursor-pointer"
              >
                <MessageSquare aria-hidden className="h-4 w-4" />
                Start a conversation
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                aria-busy={pdfLoading}
                className={`inline-flex h-10 items-center justify-center gap-1.5 px-4 text-[14px] font-semibold text-(--text) cursor-pointer disabled:cursor-wait ${CARD_ITEM} ${CARD_ITEM_HOVER}`}
              >
                {pdfLoading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin text-(--accent-text)" /> : <Download aria-hidden className="h-4 w-4 text-(--accent-text)" />}
                {pdfLoading ? PDF_PREPARING_LABEL : "Download PDF"}
              </button>
              {businessEmail && (
                <a
                  href={`mailto:${businessEmail}?subject=${encodeURIComponent(`Collaboration enquiry for ${displayName}`)}`}
                  className={`inline-flex h-10 items-center justify-center gap-1.5 px-4 text-[14px] font-semibold text-(--text) ${CARD_ITEM} ${CARD_ITEM_HOVER}`}
                >
                  <Mail aria-hidden className="h-4 w-4 text-(--accent-text)" />
                  Email me
                </a>
              )}
              <button
                type="button"
                onClick={handleCopyMediaKitLink}
                className={`inline-flex h-10 items-center justify-center gap-1.5 px-4 text-[14px] font-semibold text-(--text) cursor-pointer ${CARD_ITEM} ${CARD_ITEM_HOVER}`}
              >
                {copiedLink ? <Check aria-hidden className="h-4 w-4 text-emerald-600" /> : <Copy aria-hidden className="h-4 w-4 text-(--text-muted)" />}
                {copiedLink ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}
        </div>
      </SectionCard>

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
