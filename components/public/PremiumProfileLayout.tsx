"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Film,
  Play,
  Link2,
  ExternalLink,
  ShoppingBag,
  Building2,
  Briefcase,
  Star,
  Camera,
  Users,
  Share2,
  Check,
  BadgeCheck,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Handshake,
  Tag,
  Clock,
  MapPin,
  Flame,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  XTwitterIcon,
  LinkedinIcon,
  ThreadsIcon,
  SnapchatIcon,
  PinterestIcon,
  TwitchIcon,
  SpotifyIcon,
  TikTokIcon,
} from "@/components/shared/BrandIcons";
import { formatCount, initials } from "@/utils/format";
import { formatFans, getCreatorEra } from "@/lib/creatorEra";
import { CreatorEraBadge } from "@/components/shared/CreatorEraBadge";
import { CollaborationInquiryModal } from "@/components/mediakit/CollaborationInquiryModal";
import { useToast } from "@/contexts/ToastContext";
import { copyToClipboard } from "@/lib/copyToClipboard";
import type {
  CreatorProfile,
  SocialAccounts,
  Series,
  ThemeKey,
  CreatorReview,
  MediaKitPackage,
  MediaKitSettings,
  CreatorSetupItem,
  CreatorProduct,
} from "@/types";

export interface PremiumProfileLayoutProps {
  profile: CreatorProfile;
  themeKey?: ThemeKey;
  socials?: SocialAccounts;
  series?: Series[];
  products?: CreatorProduct[];
  customLinks?: any[];
  mediaKitPackages?: MediaKitPackage[];
  mediaKitSettings?: MediaKitSettings;
  reviews?: CreatorReview[];
  team?: { team?: any; members: any[] };
  brands?: any[];
  collaborations?: any[];
  setupItems?: CreatorSetupItem[];
  otherSocials?: any[];
  allSocialAccounts?: any[];
  totalAudience?: number;
  onShare?: () => void;
  containedScroll?: boolean;
  hideFooter?: boolean;
}

export function PremiumProfileLayout({
  profile,
  themeKey = "inflixo-maroon",
  socials,
  series = [],
  products = [],
  customLinks = [],
  mediaKitPackages = [],
  mediaKitSettings,
  reviews = [],
  team = { members: [] },
  brands = [],
  collaborations = [],
  setupItems = [],
  otherSocials = [],
  allSocialAccounts = [],
  totalAudience = 0,
  onShare,
  containedScroll = false,
  hideFooter = false,
}: PremiumProfileLayoutProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [collabModalOpen, setCollabModalOpen] = useState(false);
  const [selectedPackageTitle, setSelectedPackageTitle] = useState<string | undefined>(undefined);
  const [copiedLink, setCopiedLink] = useState(false);

  const cleanHandle = (profile.username || "creator").replace(/^@/, "");
  const creatorEra = getCreatorEra(totalAudience);

  // Sliced data based on user priority specification
  const topSeries = series.slice(0, 3);
  const remainingSeriesCount = Math.max(0, series.length - 3);

  const topLinks = customLinks.slice(0, 10);
  const remainingLinksCount = Math.max(0, customLinks.length - 10);

  const topProducts = products.slice(0, 3);
  const remainingProductsCount = Math.max(0, products.length - 3);

  const topReviews = reviews.slice(0, 3);
  const remainingReviewsCount = Math.max(0, reviews.length - 3);

  const topPackages = mediaKitPackages.slice(0, 3);
  const topBrands = brands.slice(0, 6);
  const topSetupItems = setupItems.slice(0, 4);
  const teamMembers = team?.members || [];

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }
    const profileUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${cleanHandle}`
      : `https://inflixo.com/${cleanHandle}`;
    const success = await copyToClipboard(profileUrl);
    if (success) {
      setCopiedLink(true);
      showToast("Profile link copied to clipboard! ✨");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const openCollabWithPackage = (pkgTitle?: string) => {
    setSelectedPackageTitle(pkgTitle);
    setCollabModalOpen(true);
  };

  // Build social accounts list with icons
  const socialList = [
    socials?.youtube?.username ? {
      platform: "youtube",
      label: "YouTube",
      handle: socials.youtube.username,
      url: socials.youtube.url || `https://youtube.com/@${socials.youtube.username.replace(/^@/, "")}`,
      count: socials.youtube.subscribers,
      unit: "Subscribers",
      icon: <YoutubeIcon className="h-4 w-4 text-[#FF0000]" />,
    } : null,
    socials?.instagram?.username ? {
      platform: "instagram",
      label: "Instagram",
      handle: socials.instagram.username,
      url: socials.instagram.url || `https://instagram.com/${socials.instagram.username.replace(/^@/, "")}`,
      count: socials.instagram.followers,
      unit: "Followers",
      icon: <InstagramIcon className="h-4 w-4 text-[#E4405F]" />,
    } : null,
    socials?.facebook?.username ? {
      platform: "facebook",
      label: "Facebook",
      handle: socials.facebook.username,
      url: socials.facebook.url || `https://facebook.com/${socials.facebook.username.replace(/^@/, "")}`,
      count: socials.facebook.followers,
      unit: "Followers",
      icon: <FacebookIcon className="h-4 w-4 text-[#1877F2]" />,
    } : null,
    ((socials as any)?.x?.username || socials?.twitter?.username) ? {
      platform: "x",
      label: "X",
      handle: (socials as any)?.x?.username || socials?.twitter?.username,
      url: (socials as any)?.x?.url || socials?.twitter?.url || `https://x.com/${((socials as any)?.x?.username || socials?.twitter?.username || "").replace(/^@/, "")}`,
      count: (socials as any)?.x?.followers || socials?.twitter?.followers || 0,
      unit: "Followers",
      icon: <XTwitterIcon className="h-4 w-4 text-current" />,
    } : null,
    socials?.linkedin?.username ? {
      platform: "linkedin",
      label: "LinkedIn",
      handle: socials.linkedin.username,
      url: socials.linkedin.url || `https://linkedin.com/in/${socials.linkedin.username.replace(/^@/, "")}`,
      count: socials.linkedin.followers,
      unit: "Connections",
      icon: <LinkedinIcon className="h-4 w-4 text-[#0A66C2]" />,
    } : null,
  ].filter(Boolean);

  // Add any extra active social accounts
  if (Array.isArray(allSocialAccounts)) {
    allSocialAccounts.forEach((acc: any) => {
      if (!socialList.some((s) => s?.platform === acc.platform)) {
        let icon = <ExternalLink className="h-4 w-4" />;
        if (acc.platform === "tiktok") icon = <TikTokIcon className="h-4 w-4" />;
        else if (acc.platform === "spotify") icon = <SpotifyIcon className="h-4 w-4 text-[#1DB954]" />;
        else if (acc.platform === "threads") icon = <ThreadsIcon className="h-4 w-4" />;
        else if (acc.platform === "twitch") icon = <TwitchIcon className="h-4 w-4 text-[#9146FF]" />;
        else if (acc.platform === "snapchat") icon = <SnapchatIcon className="h-4 w-4 text-[#FFFC00]" />;
        else if (acc.platform === "pinterest") icon = <PinterestIcon className="h-4 w-4 text-[#E60023]" />;

        socialList.push({
          platform: acc.platform,
          label: acc.platform,
          handle: acc.username || acc.accountName || "",
          url: acc.url || "",
          count: acc.followerCount || 0,
          unit: "Followers",
          icon,
        });
      }
    });
  }

  return (
    <div
      className={`relative w-full max-w-[620px] mx-auto text-(--text-primary) transition-all ${
        containedScroll ? "overflow-y-auto max-h-full pr-1" : ""
      }`}
    >
      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 1. VERTICAL CENTERED HEADER                                           */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <header className="relative flex flex-col items-center text-center pt-2 sm:pt-4 pb-6 px-4">
        {/* Subtle Ambient Radial Highlight behind Header */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full blur-3xl opacity-30"
          style={{ background: "var(--accent)" }}
          aria-hidden="true"
        />

        {/* Profile Picture (Large Centered, Elegant Shadow & Ring) */}
        <div className="relative mb-3.5 group">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-2 border-(--card-border) ring-4 ring-(--accent)/15 shadow-xl bg-(--card-bg) flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            {profile.photoDataUrl ? (
              <Image
                src={profile.photoDataUrl}
                alt={profile.displayName || cleanHandle}
                fill
                sizes="(max-width: 640px) 96px, 112px"
                className="object-cover"
                priority
              />
            ) : (
              <span className="font-display text-3xl font-black text-(--text-primary)">
                {initials(profile.displayName || cleanHandle)}
              </span>
            )}
          </div>

          {/* Online / Active Badge Indicator */}
          <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-(--card-bg) shadow-sm flex items-center justify-center" title="Active Creator">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          </span>
        </div>

        {/* Display Name + Verified Badge */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-(--text-primary) tracking-tight">
            {profile.displayName || `@${cleanHandle}`}
          </h1>
          <BadgeCheck className="h-5 w-5 text-[#38BDF8] shrink-0" fill="#38BDF8" color="#ffffff" aria-label="Verified Creator" />
          {creatorEra && (
            <CreatorEraBadge badge={creatorEra.badge} />
          )}
        </div>

        {/* Username Handle */}
        <p className="text-xs sm:text-sm font-semibold text-(--text-secondary) mt-0.5">
          @{cleanHandle}
        </p>

        {/* Bio */}
        {profile.bio && (
          <p className="text-xs sm:text-sm text-(--text-secondary) leading-relaxed max-w-md mx-auto mt-2.5 px-2">
            {profile.bio}
          </p>
        )}

        {/* Category & Location Badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap mt-3 text-[11px] font-medium text-(--text-secondary)">
          {profile.category && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-(--card-bg) border border-(--card-border) backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-(--accent)" />
              <span>{profile.category}</span>
            </span>
          )}
          {profile.city && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-(--card-bg) border border-(--card-border) backdrop-blur-md">
              <MapPin className="h-3 w-3 text-(--text-secondary)" />
              <span>{profile.city}{profile.country ? `, ${profile.country}` : ""}</span>
            </span>
          )}
        </div>

        {/* Total Fanbase Community Pill */}
        {totalAudience > 0 && (
          <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-(--accent)/10 border border-(--accent)/20 text-(--accent) text-xs font-bold tracking-tight">
            <Flame className="h-3.5 w-3.5 text-(--accent) animate-pulse" />
            <span>{formatFans(totalAudience)} Total Community Reach</span>
          </div>
        )}

        {/* Connected Socials Bar */}
        {socialList.length > 0 && (
          <div className="flex items-center justify-center gap-2 flex-wrap mt-4">
            {socialList.map((soc) => (
              <a
                key={soc?.platform}
                href={soc?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-(--card-bg) hover:bg-(--card-border) border border-(--card-border) text-xs font-semibold text-(--text-primary) transition-all shadow-xs hover:scale-105"
                title={`${soc?.label}: ${soc?.handle} (${formatCount(soc?.count || 0)} ${soc?.unit})`}
              >
                {soc?.icon}
                <span className="text-[11px] font-bold">{soc?.handle?.replace(/^@/, "")}</span>
                {Boolean(soc?.count) && (
                  <span className="text-[10px] text-(--text-secondary) font-normal border-l border-(--card-border) pl-1.5">
                    {formatFans(soc?.count || 0)}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Primary Action Buttons Row */}
        <div className="flex items-center justify-center gap-2.5 w-full max-w-sm mt-5">
          <button
            type="button"
            onClick={() => openCollabWithPackage()}
            className="tap-scale flex-1 h-10 px-4 rounded-xl bg-(--accent) hover:opacity-95 text-(--accent-text) font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-(--accent)/25 transition-all cursor-pointer"
          >
            <Handshake className="h-4 w-4" />
            <span>Work With Me</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="tap-scale h-10 px-3.5 rounded-xl bg-(--card-bg) hover:bg-(--card-border) border border-(--card-border) text-(--text-primary) font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Share Profile"
          >
            {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{copiedLink ? "Copied" : "Share"}</span>
          </button>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 2. SECTION: FEATURED SERIES (TOP 3 + VIEW ALL)                        */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {series.length > 0 && (
        <section className="mb-6 pt-2">
          {/* Section Header */}
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) flex items-center justify-center">
                <Film className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-(--text-primary)">
                Featured Series
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-(--card-bg) border border-(--card-border) text-(--text-secondary)">
              {series.length} {series.length === 1 ? "series" : "series"}
            </span>
          </div>

          {/* Top 3 Series Cards */}
          <div className="space-y-3">
            {topSeries.map((item) => {
              const epCount = (item.seasons?.[0]?.episodes || []).length;
              return (
                <div
                  key={item.id}
                  onClick={() => router.push(`/${cleanHandle}/series/${item.id}`)}
                  className="group relative flex gap-3.5 rounded-2xl bg-(--card-bg) hover:bg-(--card-border)/40 border border-(--card-border) p-3 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01]"
                >
                  {/* Poster Thumbnail */}
                  <div className="relative h-20 w-28 sm:h-24 sm:w-36 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    {(item.posterDataUrl || (item as any).coverUrl) ? (
                      <Image
                        src={item.posterDataUrl || (item as any).coverUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 112px, 144px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-tr from-[#7A2253] to-amber-600 flex items-center justify-center">
                        <Film className="h-6 w-6 text-white/70" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-8 w-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg">
                        <Play className="h-4 w-4 ml-0.5 fill-current" />
                      </div>
                    </div>
                  </div>

                  {/* Series Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {item.platform && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-(--accent)/10 text-(--accent)">
                          {item.platform}
                        </span>
                      )}
                      {item.genre && (
                        <span className="text-[10px] text-(--text-secondary) font-medium">
                          {item.genre}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-(--text-primary) line-clamp-1 group-hover:text-(--accent) transition-colors">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-[11px] text-(--text-secondary) line-clamp-2 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] font-semibold text-(--text-secondary)">
                      <span>{epCount} {epCount === 1 ? "episode" : "episodes"}</span>
                      <span>·</span>
                      <span className="text-(--accent) inline-flex items-center gap-0.5 group-hover:underline">
                        <span>Watch now</span>
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View All Remaining Series Button */}
          {remainingSeriesCount > 0 && (
            <div className="mt-3 text-center">
              <Link
                href={`/${cleanHandle}/series`}
                className="tap-scale w-full py-2.5 px-4 rounded-xl bg-(--card-bg) hover:bg-(--card-border) border border-(--card-border) text-xs font-bold text-(--text-primary) inline-flex items-center justify-center gap-1.5 transition-all shadow-xs hover:scale-[1.01]"
              >
                <span>View all my rest of series ({remainingSeriesCount})</span>
                <ArrowRight className="h-3.5 w-3.5 text-(--accent)" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 3. SECTION: CUSTOM LINKS (TOP 10 + VIEW ALL)                          */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {customLinks.length > 0 && (
        <section className="mb-6 pt-2">
          {/* Section Header */}
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) flex items-center justify-center">
                <Link2 className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-(--text-primary)">
                Quick Links
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-(--card-bg) border border-(--card-border) text-(--text-secondary)">
              {customLinks.length} {customLinks.length === 1 ? "link" : "links"}
            </span>
          </div>

          {/* Top 10 Links */}
          <div className="space-y-2.5">
            {topLinks.map((link: any, idx: number) => {
              const url = link.url || link.destinationUrl || "#";
              const title = link.title || link.name || "Custom Link";
              const desc = link.description || link.subtitle;
              return (
                <a
                  key={link.id || idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-scale group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-(--card-bg) hover:bg-(--card-border)/40 border border-(--card-border) transition-all duration-200 shadow-xs hover:shadow-md hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-(--accent)/10 text-(--accent) flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {link.iconUrl ? (
                        <img src={link.iconUrl} alt="" className="h-5 w-5 object-contain" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-(--text-primary) line-clamp-1 group-hover:text-(--accent) transition-colors">
                        {title}
                      </h3>
                      {desc && (
                        <p className="text-[11px] text-(--text-secondary) line-clamp-1 mt-0.5">
                          {desc}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="h-7 w-7 rounded-full bg-(--card-border)/40 flex items-center justify-center text-(--text-secondary) group-hover:text-(--accent) group-hover:translate-x-0.5 transition-all shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                </a>
              );
            })}
          </div>

          {/* View All Remaining Links Button */}
          {remainingLinksCount > 0 && (
            <div className="mt-3 text-center">
              <Link
                href={`/${cleanHandle}/links`}
                className="tap-scale w-full py-2.5 px-4 rounded-xl bg-(--card-bg) hover:bg-(--card-border) border border-(--card-border) text-xs font-bold text-(--text-primary) inline-flex items-center justify-center gap-1.5 transition-all shadow-xs hover:scale-[1.01]"
              >
                <span>View all my links ({remainingLinksCount})</span>
                <ArrowRight className="h-3.5 w-3.5 text-(--accent)" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 4. SECTION: SHOP & PRODUCTS (TOP 3 + VIEW ALL)                        */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="mb-6 pt-2">
          {/* Section Header */}
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) flex items-center justify-center">
                <ShoppingBag className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-(--text-primary)">
                Shop &amp; Recommendations
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-(--card-bg) border border-(--card-border) text-(--text-secondary)">
              {products.length} {products.length === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Top 3 Product Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topProducts.map((prod: any, idx: number) => {
              const priceStr = prod.price !== null && prod.price !== undefined
                ? `₹${Number(prod.price).toLocaleString("en-IN")}`
                : "";
              const url = prod.url || prod.productUrl || "#";
              return (
                <a
                  key={prod.id || idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-scale group flex flex-col rounded-2xl bg-(--card-bg) hover:bg-(--card-border)/40 border border-(--card-border) p-3 transition-all duration-200 shadow-xs hover:shadow-md hover:scale-[1.01]"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                    {prod.image || prod.imageUrl ? (
                      <img
                        src={prod.image || prod.imageUrl}
                        alt={prod.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-50">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                    {prod.isAffiliate && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-xs">
                        Affiliate
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <h3 className="text-xs font-bold text-(--text-primary) line-clamp-2 leading-snug group-hover:text-(--accent) transition-colors flex-1">
                    {prod.name}
                  </h3>

                  <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-(--card-border)/60">
                    <span className="text-xs font-black text-(--accent)">
                      {priceStr || "View"}
                    </span>
                    <span className="text-[10px] font-bold text-(--text-secondary) group-hover:text-(--accent) inline-flex items-center gap-0.5">
                      <span>Buy</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>

          {/* View All Remaining Products Button */}
          {remainingProductsCount > 0 && (
            <div className="mt-3 text-center">
              <Link
                href={`/${cleanHandle}/products`}
                className="tap-scale w-full py-2.5 px-4 rounded-xl bg-(--card-bg) hover:bg-(--card-border) border border-(--card-border) text-xs font-bold text-(--text-primary) inline-flex items-center justify-center gap-1.5 transition-all shadow-xs hover:scale-[1.01]"
              >
                <span>View all my rest of products ({remainingProductsCount})</span>
                <ArrowRight className="h-3.5 w-3.5 text-(--accent)" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 5. SECTION: BRANDS WORKED WITH (PROOF OF TRUST)                       */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {topBrands.length > 0 && (
        <section className="mb-6 pt-2">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-(--text-primary)">
                Worked with Brands
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {topBrands.map((b: any, idx: number) => (
              <div
                key={b.id || idx}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-(--card-bg) border border-(--card-border) shadow-xs"
              >
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {b.logoUrl || b.brandLogoUrl ? (
                    <img src={b.logoUrl || b.brandLogoUrl} alt={b.name || b.brandName} className="h-full w-full object-contain p-1" />
                  ) : (
                    <Building2 className="h-4 w-4 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-(--text-primary) truncate">
                    {b.name || b.brandName}
                  </span>
                  <span className="block text-[10px] text-(--text-secondary) truncate">
                    {b.campaignType || "Brand Collab"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 6. SECTION: COLLAB PACKAGES & RATE CARD                               */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {topPackages.length > 0 && (
        <section className="mb-6 pt-2">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) flex items-center justify-center">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-(--text-primary)">
                Collab Packages &amp; Rates
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openCollabWithPackage()}
              className="text-xs font-bold text-(--accent) hover:underline cursor-pointer"
            >
              Inquire
            </button>
          </div>

          <div className="space-y-3">
            {topPackages.map((pkg, idx) => (
              <div
                key={pkg.id || idx}
                className="p-3.5 rounded-2xl bg-(--card-bg) border border-(--card-border) shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-(--text-primary)">
                      {pkg.title}
                    </span>
                    {pkg.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-(--text-secondary)">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{pkg.turnaroundDays || 2} days delivery</span>
                    </span>
                    {pkg.deliverables && pkg.deliverables.length > 0 && (
                      <span>· {pkg.deliverables.slice(0, 2).join(", ")}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-(--card-border)/60">
                  <span className="text-xs sm:text-sm font-black text-(--text-primary)">
                    {pkg.price || "Contact for rate"}
                  </span>
                  <button
                    type="button"
                    onClick={() => openCollabWithPackage(pkg.title)}
                    className="tap-scale px-3 py-1.5 rounded-lg bg-(--accent) hover:opacity-95 text-(--accent-text) text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 7. SECTION: VERIFIED CLIENT REVIEWS (TOP 3 + VIEW ALL)                */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="mb-6 pt-2">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) flex items-center justify-center">
                <Star className="h-3.5 w-3.5 fill-(--accent)" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-(--text-primary)">
                Client Reviews
              </h2>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-(--card-bg) border border-(--card-border) text-(--text-secondary)">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          <div className="space-y-3">
            {topReviews.map((rev, idx) => (
              <div
                key={rev.id || idx}
                className="p-3.5 rounded-2xl bg-(--card-bg) border border-(--card-border) shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="block text-xs font-bold text-(--text-primary)">
                      {rev.clientName}
                    </span>
                    <span className="block text-[11px] text-(--text-secondary)">
                      {rev.clientDesignation || rev.projectTitle || "Verified Brand Collab"}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-xs text-(--text-secondary) italic leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>

          {remainingReviewsCount > 0 && (
            <div className="mt-3 text-center">
              <Link
                href={`/${cleanHandle}/reviews`}
                className="tap-scale w-full py-2.5 px-4 rounded-xl bg-(--card-bg) hover:bg-(--card-border) border border-(--card-border) text-xs font-bold text-(--text-primary) inline-flex items-center justify-center gap-1.5 transition-all shadow-xs hover:scale-[1.01]"
              >
                <span>View all reviews ({remainingReviewsCount})</span>
                <ArrowRight className="h-3.5 w-3.5 text-(--accent)" />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 8. SECTION: SETUP & GEAR                                              */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {topSetupItems.length > 0 && (
        <section className="mb-6 pt-2">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) flex items-center justify-center">
                <Camera className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-(--text-primary)">
                Creator Setup &amp; Gear
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {topSetupItems.map((gear, idx) => (
              <a
                key={gear.id || idx}
                href={gear.linkUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-scale p-2.5 rounded-xl bg-(--card-bg) hover:bg-(--card-border)/40 border border-(--card-border) shadow-xs flex flex-col items-center text-center transition-all group"
              >
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden mb-2">
                  {gear.imageUrl ? (
                    <img src={gear.imageUrl} alt={gear.name} className="h-full w-full object-contain p-1" />
                  ) : (
                    <Camera className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-(--text-primary) line-clamp-1 group-hover:text-(--accent)">
                  {gear.name}
                </span>
                <span className="text-[9px] text-(--text-secondary) line-clamp-1 mt-0.5">
                  {gear.category || "Gear"}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 9. SECTION: TEAM MEMBERS                                              */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {teamMembers.length > 0 && (
        <section className="mb-6 pt-2">
          <div className="flex items-center justify-between px-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-(--accent)/15 text-(--accent) flex items-center justify-center">
                <Users className="h-3.5 w-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-(--text-primary)">
                Team
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {teamMembers.map((m: any, idx: number) => (
              <div
                key={m.id || idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-(--card-bg) border border-(--card-border) shadow-xs"
              >
                <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700 overflow-hidden">
                  {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(m.name || "T")}
                </div>
                <div>
                  <span className="block text-xs font-bold text-(--text-primary)">{m.name}</span>
                  <span className="block text-[10px] text-(--text-secondary)">{m.role || "Member"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 10. COLLAB INQUIRY MODAL                                              */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <CollaborationInquiryModal
        isOpen={collabModalOpen}
        onClose={() => setCollabModalOpen(false)}
        creatorId={profile.id || ""}
        creatorEmail={profile.email}
        creatorName={profile.displayName || cleanHandle}
        creatorUsername={cleanHandle}
        packages={mediaKitPackages}
        selectedPackageTitle={selectedPackageTitle}
      />

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 11. FOOTER BRANDING                                                   */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {!hideFooter && (
        <footer className="pt-6 pb-8 text-center border-t border-(--card-border)/60 mt-8 space-y-2">
          <a
            href="https://inflixo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale inline-flex items-center gap-1.5 text-[11px] font-bold text-(--text-secondary) hover:text-(--accent) transition-colors"
          >
            <span>Powered by</span>
            <span className="font-extrabold text-(--text-primary)">INFLIXO</span>
          </a>
          <p className="text-[10px] text-(--text-secondary)">
            The Operating System for Modern Creators
          </p>
        </footer>
      )}
    </div>
  );
}
