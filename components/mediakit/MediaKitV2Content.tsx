"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { renderSVG } from "uqr";
import {
  Sparkles,
  Play,
  Check,
  X,
  Star,
  Download,
  Copy,
  MessageSquare,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Film,
  ShieldCheck,
  Users,
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
} from "@/types";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
} from "@/components/shared/BrandIcons";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";
import { SeriesPoster } from "@/components/shared/SeriesPoster";
import { PublicTeamGroups } from "@/components/team/PublicTeamGroups";
import { formatFans, getCreatorEra, calculateTotalFanbase } from "@/lib/creatorEra";
import { EraAwardMedal } from "@/components/shared/EraBadge";
import { formatCount } from "@/utils/format";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useToast } from "@/contexts/ToastContext";

export interface MediaKitV2ContentProps {
  profile: CreatorProfile;
  socials?: SocialAccounts;
  totalAudience?: number;
  series?: Series[];
  packages?: MediaKitPackage[];
  settings?: MediaKitSettings;
  reviews?: CreatorReview[];
  team?: { team?: CreatorTeam | null; members: TeamMember[] };
  hideTeam?: boolean;
  onEnquirePackage?: (pkg: MediaKitPackage | null) => void;
  isInformational?: boolean;
  isPrint?: boolean;
}

function getSeriesEpisodes(s: Series): any[] {
  if (s && Array.isArray(s.seasons) && s.seasons.length > 0) {
    return s.seasons.flatMap((sn) => (sn && Array.isArray(sn.episodes) ? sn.episodes : []));
  }
  if (s && Array.isArray((s as any).episodes)) {
    return (s as any).episodes;
  }
  return [];
}

function formatPackagePrice(pkg: MediaKitPackage): string {
  const unitMap: Record<string, string> = {
    per_reel: "/ reel",
    per_post: "/ post",
    per_video: "/ video",
    per_package: "/ package",
    per_month: "/ month",
  };
  const unitLabel = pkg.priceUnit ? unitMap[pkg.priceUnit] || "" : "";
  const prefix = pkg.isStartingPrice ? "From " : "";
  const raw = (pkg.price || pkg.minPrice || "").trim();
  if (!raw) return "Custom scope";
  const withSymbol = raw.startsWith("₹") || raw.toLowerCase().includes("contact") ? raw : `₹${raw}`;
  return `${prefix}${withSymbol}${unitLabel ? ` ${unitLabel}` : ""}`;
}

export function MediaKitV2Content({
  profile,
  socials,
  totalAudience: passedTotalAudience,
  series = [],
  packages = [],
  settings,
  reviews = [],
  team,
  hideTeam = false,
  onEnquirePackage,
  isInformational = false,
  isPrint: propIsPrint = false,
}: MediaKitV2ContentProps) {
  const { showToast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [urlIsPrint, setUrlIsPrint] = useState(false);

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
    const list: Array<{ key: string; label: string; handle: string; count: number; url: string; icon: React.ReactNode }> = [];
    const ig = socials?.instagram;
    if (ig?.username || (ig?.followers || 0) > 0) {
      const h = (ig?.username || cleanHandle).replace(/^@/, "");
      list.push({
        key: "instagram",
        label: "Instagram",
        handle: h,
        count: ig?.followers || 0,
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
  const fitTags = (settings?.fitTags || []).map((t) => t.trim()).filter(Boolean).slice(0, 3);
  const nofitTags = (settings?.nofitTags || []).map((t) => t.trim()).filter(Boolean).slice(0, 3);
  const promises = (settings?.promises || []).map((p) => p.trim()).filter(Boolean).slice(0, 4);

  const creatorFirstName = useMemo(() => {
    const raw = (profile.displayName || cleanHandle || "").trim();
    const firstWord = raw.split(/\s+/)[0] || "";
    return firstWord ? firstWord.charAt(0).toUpperCase() + firstWord.slice(1) : "Creator";
  }, [profile.displayName, cleanHandle]);

  const signatureName = (settings?.signatureName && settings.signatureName.trim())
    ? settings.signatureName.trim()
    : creatorFirstName;

  const topSeries = useMemo(() => (series || []).slice(0, 3), [series]);
  const activePackages = useMemo(() => (packages || []).filter((p) => p.isActive !== false), [packages]);
  const visibleReviews = useMemo(
    () => (reviews || []).filter((r) => (r as any).isVisible !== false && (r as any).is_visible !== 0),
    [reviews]
  );
  const activeTeamMembers = useMemo(() => {
    if (team?.team?.isActive === false) return [];
    return (team?.members || []).filter((m) => m.isActive !== false && m.name?.trim());
  }, [team]);

  const showHello = Boolean(introText || nowMaking || profile.photoDataUrl || settings?.availability);
  const showAudience = Boolean(calculatedFans > 0 || audienceDesc || connectedPlatforms.length > 0);
  const showSeries = topSeries.length > 0;
  const showFitChips = fitTags.length > 0 || nofitTags.length > 0;
  const showPackages = activePackages.length > 0;
  const showPromises = promises.length > 0;
  const showReviews = visibleReviews.length > 0;
  const showTeam = !hideTeam && activeTeamMembers.length > 0;

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

  const handleDownloadPdf = () => {
    if (isInformational) {
      showToast("Downloads your 2-page A4 Media Kit PDF ✨");
      return;
    }
    const pdfUrl = `/api/creator/mediakit/pdf?username=${encodeURIComponent(cleanHandle)}`;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full space-y-8 sm:space-y-10 py-3 sm:py-5 text-left selection:bg-[#7A2253]/15 selection:text-[#7A2253]">
      {/* =================================================================== */}
      {/* 1. HELLO — Warm Editorial Intro, Large Photo, Availability, Now Making */}
      {/* =================================================================== */}
      {showHello && (
        <section
          aria-label="Hello"
          className="rounded-xl border border-[#E7E0D6] bg-[#FAF7F2] p-5 sm:p-7 text-[#1C1917] shadow-2xs space-y-5"
        >
          {/* Availability + Reply Time Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2253]">
              01 · Hello
            </span>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E7E0D6] bg-white px-3 py-1 text-xs font-medium text-[#1C1917]">
              <span
                className={`h-2 w-2 rounded-full ${
                  availability === "busy" ? "bg-amber-500" : "bg-emerald-500"
                }`}
              />
              <span className="font-semibold">
                {availability === "busy" ? "Heads-down creating" : "Open for collaborations"}
              </span>
              {replyTime && (
                <>
                  <span className="text-[#A8A29E]">·</span>
                  <span className="text-[#57534E] inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#78716C]" />
                    <span>Replies {replyTime.toLowerCase()}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Large Creator Portrait + Quote Typography Intro */}
          <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-[#EFE8DF] shadow-md">
              <CreatorAvatar
                src={profile.photoDataUrl}
                name={displayName}
                className="h-full w-full rounded-2xl object-cover"
                textClassName="text-2xl font-serif font-bold text-white"
                style={{ backgroundColor: "#7A2253" }}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              {introText ? (
                <blockquote
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  className="text-base sm:text-lg leading-relaxed text-[#1C1917] italic font-normal"
                >
                  &ldquo;{introText}&rdquo;
                </blockquote>
              ) : (
                <p
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  className="text-base sm:text-lg leading-relaxed text-[#1C1917]"
                >
                  Hi, I&apos;m {displayName} — I create original stories and thoughtful partnerships for people who care about craft.
                </p>
              )}

              {nowMaking && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-[#E7E0D6] bg-white/90 px-3.5 py-2 text-xs text-[#44403C]">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#7A2253]" />
                  <span>
                    <strong className="font-semibold text-[#7A2253]">Now making:</strong>{" "}
                    {nowMaking}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 2. AUDIENCE — "{fans} people chose to follow along" + Era "earned, not bought" */}
      {/* =================================================================== */}
      {showAudience && (
        <section
          aria-label="Audience"
          className="rounded-xl border border-[#E7E0D6] bg-[#FAF7F2] p-5 sm:p-7 text-[#1C1917] shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2253]">
              02 · Audience
            </span>
            {creatorEra && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E0D6] bg-white px-3 py-1 text-xs font-semibold text-[#44403C]">
                <EraAwardMedal era={creatorEra.era} stage={creatorEra.stage} size={18} />
                <span>{creatorEra.badge}</span>
                <span className="text-[#78716C] font-normal italic">— earned, not bought</span>
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {calculatedFans > 0 && (
              <h3
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                className="text-2xl sm:text-[28px] font-normal tracking-tight text-[#1C1917] leading-snug"
              >
                <span className="font-bold text-[#7A2253]">{formatFans(calculatedFans)}</span>{" "}
                people chose to follow along.
              </h3>
            )}

            {!creatorEra && calculatedFans > 0 && (
              <p className="text-xs italic text-[#78716C]">Earned, not bought.</p>
            )}

            {audienceDesc && (
              <p className="text-sm sm:text-[15px] leading-relaxed text-[#44403C]">
                {audienceDesc}
              </p>
            )}
          </div>

          {/* Editorial inline reach chips (no dashboard stat grids) */}
          {connectedPlatforms.length > 0 && (
            <div className="pt-2 border-t border-[#E7E0D6]/80 flex flex-wrap items-center gap-2">
              {connectedPlatforms.map((plat) => (
                <a
                  key={plat.key}
                  href={plat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-[#E7E0D6] bg-white px-3.5 py-1.5 text-xs text-[#1C1917] hover:border-[#7A2253]/40 transition-colors"
                >
                  {plat.icon}
                  <span className="font-semibold">@{plat.handle}</span>
                  {plat.count > 0 && (
                    <span className="text-[#78716C]">{formatCount(plat.count)}</span>
                  )}
                  <ArrowUpRight className="h-3 w-3 text-[#A8A29E]" />
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* 3. SERIES — Top 3 Series with Inline Play                           */}
      {/* =================================================================== */}
      {showSeries && (
        <section
          aria-label="Original Series"
          className="rounded-xl border border-[#E7E0D6] bg-[#FAF7F2] p-5 sm:p-7 text-[#1C1917] shadow-2xs space-y-5"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2253]">
              03 · Original Series
            </span>
            <h3
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              className="text-xl sm:text-2xl font-normal text-[#1C1917]"
            >
              Stories my audience comes back for
            </h3>
          </div>

          <div className="space-y-3.5">
            {topSeries.map((s) => {
              const episodes = getSeriesEpisodes(s);
              const posterSrc = s.posterDataUrl || episodes[0]?.thumbnailDataUrl || null;
              const epCount = episodes.length;
              const episodeText = `${epCount} ${epCount === 1 ? "episode" : "episodes"}`;
              const metaParts = [
                s.genre?.trim(),
                s.language?.trim(),
                episodeText,
                s.platform?.trim() || "Series",
              ].filter(Boolean);

              return (
                <div
                  key={s.id}
                  className="overflow-hidden rounded-xl border border-[#E7E0D6] bg-white transition-all print-avoid-break"
                >
                  <div className="flex flex-col sm:flex-row items-stretch gap-3.5 p-3.5 sm:p-4">
                    <Link
                      href={`/${cleanHandle}/series`}
                      className="group relative h-28 sm:h-24 sm:w-40 shrink-0 overflow-hidden rounded-lg bg-[#1C1917]"
                    >
                      <SeriesPoster
                        src={posterSrc}
                        title={s.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        iconSize={22}
                      />
                    </Link>

                    <div className="min-w-0 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#78716C]">
                          {metaParts.map((part, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span>·</span>}
                              <span>{part}</span>
                            </React.Fragment>
                          ))}
                        </div>
                        <h4 className="mt-0.5 text-base font-bold text-[#1C1917] leading-snug">
                          {s.title}
                        </h4>
                        {s.description && (
                          <p className="mt-1 text-xs text-[#57534E] line-clamp-2 leading-relaxed">
                            {s.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-1">
                        <Link
                          href={`/${cleanHandle}/series`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A2253] hover:underline"
                        >
                          <span>Watch series →</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 4. FIT / NOT-FIT CHIPS                                              */}
      {/* =================================================================== */}
      {showFitChips && (
        <section
          aria-label="Brand Fit"
          className="rounded-xl border border-[#E7E0D6] bg-[#FAF7F2] p-5 sm:p-7 text-[#1C1917] shadow-2xs space-y-5"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2253]">
              04 · Brand Fit
            </span>
            <h3
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              className="text-xl sm:text-2xl font-normal text-[#1C1917]"
            >
              Where I add the most value
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fitTags.length > 0 && (
              <div className="rounded-xl border border-emerald-200/80 bg-white p-4 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Great fit for</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {fitTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900"
                    >
                      <span>✓</span>
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {nofitTags.length > 0 && (
              <div className="rounded-xl border border-rose-200/80 bg-white p-4 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                  <X className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Probably not the right fit</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {nofitTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-900"
                    >
                      <span>✕</span>
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 5. PACKAGES — "The story I'd tell for you" & "What your brand gets" */}
      {/* =================================================================== */}
      {/* Page break between Page 1 (Who I am) and Page 2 (Working together) for print */}
      <div
        className="print-page-break hidden print:block"
        style={{ pageBreakAfter: "always", breakAfter: "page" }}
      />
      {showPackages && (
        <section
          aria-label="Collaboration Packages"
          className="rounded-xl border border-[#E7E0D6] bg-[#FAF7F2] p-5 sm:p-7 text-[#1C1917] shadow-2xs space-y-5 print-avoid-break"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2253]">
                05 · Ways We Can Collaborate
              </span>
              <h3
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                className="text-xl sm:text-2xl font-normal text-[#1C1917]"
              >
                Partnership formats &amp; stories
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {activePackages.map((pkg) => {
              const badgeText = (pkg.packageName || pkg.badge || "").trim();
              const storyPitch = (pkg.storyPitch || pkg.description || "").trim();

              return (
                <div
                  key={pkg.id}
                  className="rounded-xl border border-[#E7E0D6] bg-white p-5 sm:p-6 space-y-4 transition-all hover:border-[#7A2253]/40"
                >
                  {/* Top Meta + Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {pkg.category && (
                          <span className="rounded-md bg-[#FAF7F2] border border-[#E7E0D6] px-2.5 py-0.5 text-[11px] font-semibold text-[#57534E]">
                            {pkg.category}
                          </span>
                        )}
                        <span className="text-xs font-medium text-[#78716C]">
                          {pkg.platform}
                        </span>
                        {pkg.turnaroundDays > 0 && (
                          <span className="text-xs text-[#78716C]">
                            · ~{pkg.turnaroundDays} {pkg.turnaroundDays === 1 ? "day" : "days"}
                          </span>
                        )}
                        {badgeText && (
                          <span className="rounded-full bg-[#7A2253]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#7A2253]">
                            {badgeText}
                          </span>
                        )}
                      </div>

                      <h4
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                        className="text-lg sm:text-xl font-bold text-[#1C1917]"
                      >
                        {pkg.title}
                      </h4>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-extrabold text-[#7A2253]">
                        {formatPackagePrice(pkg)}
                      </div>
                      <p className="text-[11px] text-[#78716C]">Final scope shaped together</p>
                    </div>
                  </div>

                  {/* "The story I'd tell for you" */}
                  {storyPitch && (
                    <div className="rounded-lg border-l-2 border-[#7A2253] bg-[#FAF7F2] px-4 py-3 space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A2253]">
                        The story I&apos;d tell for you
                      </p>
                      <p
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                        className="text-sm italic text-[#292524] leading-relaxed"
                      >
                        &ldquo;{storyPitch}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* "What your brand gets" */}
                  {Array.isArray(pkg.deliverables) && pkg.deliverables.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                        What your brand gets
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pkg.deliverables.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs sm:text-[13px] text-[#292524]"
                          >
                            <Check className="h-4 w-4 shrink-0 text-[#7A2253] mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Row */}
                  <div className="pt-2 border-t border-[#F5F1EB] flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onEnquirePackage?.(pkg)}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#7A2253] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:opacity-95 transition-opacity cursor-pointer"
                    >
                      <span>Let&apos;s talk about this</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 6. PROMISE — Creator's Selected Promises                            */}
      {/* =================================================================== */}
      {showPromises && (
        <section
          aria-label="Creator Promise"
          className="rounded-xl border border-[#E7E0D6] bg-[#FAF7F2] p-5 sm:p-7 text-[#1C1917] shadow-2xs space-y-4"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2253]">
              06 · My Working Promise
            </span>
            <h3
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              className="text-xl sm:text-2xl font-normal text-[#1C1917]"
            >
              What you can count on when we work together
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {promises.map((promise, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-[#E7E0D6] bg-white p-3.5 sm:p-4"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7A2253]/10 text-[#7A2253]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#1C1917] leading-snug">
                  {promise}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 7. REVIEWS — "Reviewed via Inflixo invite"                          */}
      {/* =================================================================== */}
      {showReviews && (
        <section
          aria-label="Brand Reviews"
          className="rounded-xl border border-[#E7E0D6] bg-[#FAF7F2] p-5 sm:p-7 text-[#1C1917] shadow-2xs space-y-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2253]">
                07 · Kind Words From Partners
              </span>
              <h3
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                className="text-xl sm:text-2xl font-normal text-[#1C1917]"
              >
                What brands say after working together
              </h3>
            </div>
          </div>

          <div className="space-y-3.5">
            {visibleReviews.map((rev) => {
              const stars = Number(rev.rating) || 5;
              return (
                <blockquote
                  key={rev.id}
                  className="rounded-xl border border-[#E7E0D6] bg-white p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < stars ? "fill-amber-400 text-amber-500" : "text-stone-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-[#78716C]">
                      Reviewed via Inflixo invite
                    </span>
                  </div>

                  {rev.comment && (
                    <p
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                      className="text-sm sm:text-base italic text-[#1C1917] leading-relaxed"
                    >
                      &ldquo;{rev.comment.trim()}&rdquo;
                    </p>
                  )}

                  <footer className="text-xs text-[#57534E] font-medium">
                    <strong className="font-bold text-[#1C1917]">{rev.clientName}</strong>
                    {rev.projectTitle ? ` · ${rev.projectTitle}` : ""}
                  </footer>
                </blockquote>
              );
            })}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 8. TEAM — The People Behind The Camera                              */}
      {/* =================================================================== */}
      {showTeam && (
        <section
          aria-label="Team"
          className="rounded-xl border border-[#E7E0D6] bg-[#FAF7F2] p-5 sm:p-7 text-[#1C1917] shadow-2xs space-y-4"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2253]">
              08 · {team?.team?.teamName || "The Crew"}
            </span>
            <h3
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              className="text-xl sm:text-2xl font-normal text-[#1C1917]"
            >
              The people behind the camera
            </h3>
            {team?.team?.teamDescription && team.team.teamDescription.trim() && (
              <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
                {team.team.teamDescription.trim()}
              </p>
            )}
          </div>

          <PublicTeamGroups
            members={activeTeamMembers}
            variant="mediakit"
            isInformational={isInformational}
          />
        </section>
      )}

      {/* =================================================================== */}
      {/* 9. CLOSING LETTER + SCRIPT SIGNATURE + CTAs                         */}
      {/* =================================================================== */}
      <section
        aria-label="Closing Letter"
        className="rounded-xl border border-[#E7E0D6] bg-[#FAF7F2] p-6 sm:p-8 text-[#1C1917] shadow-2xs space-y-6 print-avoid-break"
      >
        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A2253]">
            Before you go
          </span>
          <p
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            className="text-base sm:text-lg leading-relaxed text-[#292524]"
          >
            Thank you for taking the time to read through my work. Every collaboration I take on is
            crafted to feel native to the people watching and meaningful for the brand behind it. If
            you feel our stories align, I&apos;d love to hear what you&apos;re building.
          </p>

          <div className="pt-2">
            <p className="text-xs uppercase tracking-widest text-[#78716C]">Warmly,</p>
            <p
              style={{
                fontFamily: "'Caveat', 'Playfair Display', cursive, serif",
              }}
              className="mt-1 text-3xl sm:text-4xl text-[#7A2253] italic font-semibold select-none"
            >
              {signatureName}
            </p>
          </div>
        </div>

        {/* QR Code + verification banner for Print / Public */}
        {qrSvg && (
          <div className="pt-4 border-t border-[#E7E0D6] flex items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <p className="text-xs font-bold text-[#1C1917]">Official Creator Media Kit</p>
              <p className="text-[11px] text-[#57534E]">Scan to watch series, inspect real-time audience &amp; enquire</p>
              <p className="text-[10px] text-[#78716C]">
                inflixo.com/{cleanHandle}/mediakit · Numbers as of {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div
              className="h-16 w-16 shrink-0 rounded-lg border border-[#E7E0D6] p-1 bg-white"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
        )}

        {/* 3 CTAs: Start a conversation / Download PDF / Copy link */}
        <div className={activeIsPrint ? "hidden" : "pt-4 border-t border-[#E7E0D6] flex flex-wrap items-center gap-2.5 no-print"}>
          <button
            type="button"
            onClick={() => onEnquirePackage?.(null)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#7A2253] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Start a conversation</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D6CEC2] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#1C1917] hover:bg-[#F5F0E8] transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4 text-[#7A2253]" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMediaKitLink}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D6CEC2] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#1C1917] hover:bg-[#F5F0E8] transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-[#78716C]" />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>
      </section>

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
        }
      `}</style>
    </div>
  );
}
