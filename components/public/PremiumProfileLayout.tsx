"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Film,
  Play,
  Link2,
  ExternalLink,
  ShoppingBag,
  Briefcase,
  Star,
  Camera,
  Users,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MapPin,
  MessageCircle,
  User,
  Mic,
  Sun,
  Handshake,
} from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  XTwitterIcon,
  LinkedinIcon,
} from "@/components/shared/BrandIcons";
import { formatCount } from "@/utils/format";
import { formatFans, getCreatorEra } from "@/lib/creatorEra";
import { ProfileHeader } from "@/components/public/ProfileHeader";
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
  allSeriesHref?: string;
  allProductsHref?: string;
  allReviewsHref?: string;
}

function getSeriesEpisodesCount(s: Series): number {
  if (Array.isArray(s.seasons)) {
    return s.seasons.reduce((acc, season) => acc + (season.episodes?.length || 0), 0);
  }
  return 0;
}

function formatProductPrice(paise?: number | null, fallbackPrice?: string): string {
  if (typeof paise === "number" && paise > 0) {
    return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
  }
  if (fallbackPrice) {
    return fallbackPrice.startsWith("₹") ? fallbackPrice : `₹${fallbackPrice}`;
  }
  return "₹0";
}

function getLinkIcon(url: string, iconType?: string) {
  const u = (url || "").toLowerCase();
  if (u.includes("maps.google") || u.includes("goo.gl") || iconType === "map") {
    return <MapPin className="h-4 w-4 text-emerald-600" />;
  }
  if (u.includes("amazon.") || u.includes("amzn.") || iconType === "shopping") {
    return <ShoppingBag className="h-4 w-4 text-amber-600" />;
  }
  if (u.includes("wa.me") || u.includes("whatsapp.com") || iconType === "chat") {
    return <MessageCircle className="h-4 w-4 text-emerald-500" />;
  }
  return <Link2 className="h-4 w-4 text-(--accent-text)" />;
}

function getLinkSubtext(url: string, subtitle?: string): string {
  if (subtitle) return subtitle;
  const u = (url || "").toLowerCase();
  if (u.includes("maps.google") || u.includes("goo.gl")) return "Opens in Google Maps";
  if (u.includes("amazon.") || u.includes("amzn.")) return "Opens on Amazon";
  if (u.includes("wa.me") || u.includes("whatsapp.com")) return "Opens in WhatsApp";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "Opens in YouTube";
  if (u.includes("instagram.com")) return "Opens in Instagram";
  return "Opens external link";
}

function getProductIcon(name: string, category?: string) {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();
  if (n.includes("mic") || c.includes("audio")) {
    return <Mic className="h-5 w-5 text-slate-500" />;
  }
  if (n.includes("tripod") || n.includes("camera") || n.includes("lens") || c.includes("camera")) {
    return <Camera className="h-5 w-5 text-slate-500" />;
  }
  if (n.includes("light") || n.includes("led") || c.includes("light")) {
    return <Sun className="h-5 w-5 text-slate-500" />;
  }
  return <ShoppingBag className="h-5 w-5 text-slate-500" />;
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
  hideFooter = false,
  allSeriesHref,
  allProductsHref,
  allReviewsHref,
}: PremiumProfileLayoutProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<MediaKitPackage | undefined>(undefined);
  const [isSetupOpen, setIsSetupOpen] = useState(false);

  const cleanHandle = (profile.username || "creator").replace(/^@/, "").toLowerCase();
  const creatorEra = totalAudience > 0 ? getCreatorEra(totalAudience) : null;

  // Social list formatted for ProfileHeader
  const socialList = useMemo(() => {
    const list: any[] = [];
    if (socials?.instagram?.username) {
      list.push({
        platform: "instagram",
        label: "Instagram",
        url: socials.instagram.url || `https://instagram.com/${socials.instagram.username.replace(/^@/, "")}`,
        count: socials.instagram.followers,
        handle: socials.instagram.username,
        hasAccount: true,
      });
    }
    if (socials?.youtube?.username) {
      list.push({
        platform: "youtube",
        label: "YouTube",
        url: socials.youtube.url || `https://youtube.com/@${socials.youtube.username.replace(/^@/, "")}`,
        count: socials.youtube.subscribers,
        handle: socials.youtube.username,
        hasAccount: true,
      });
    }
    if (socials?.facebook?.username) {
      list.push({
        platform: "facebook",
        label: "Facebook",
        url: socials.facebook.url || `https://facebook.com/${socials.facebook.username.replace(/^@/, "")}`,
        count: socials.facebook.followers,
        handle: socials.facebook.username,
        hasAccount: true,
      });
    }
    return list;
  }, [socials]);

  // Top 3 items for sections
  const topSeries = series.slice(0, 3);
  const topLinks = customLinks.slice(0, 3);
  const topProducts = products.slice(0, 3);
  const topPackages = mediaKitPackages.slice(0, 3);
  const topReviews = reviews.slice(0, 3);

  const seriesUrl = allSeriesHref || `/${cleanHandle}/series`;
  const linksUrl = `/${cleanHandle}/links`;
  const productsUrl = allProductsHref || `/${cleanHandle}/products`;
  const reviewsUrl = allReviewsHref || `/${cleanHandle}/reviews`;
  const mediaKitUrl = `/${cleanHandle}/media-kit`;

  async function handleShareClick() {
    if (onShare) {
      onShare();
      return;
    }
    const url = typeof window !== "undefined" ? window.location.href : `https://inflixo.com/${cleanHandle}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName || "Creator"} on Inflixo`,
          url,
        });
        return;
      } catch {}
    }
    const success = await copyToClipboard(url);
    if (success) showToast("Profile link copied to clipboard! ✨");
  }

  function handlePackageInquire(pkg?: MediaKitPackage) {
    setSelectedPackage(pkg);
    setIsCollabModalOpen(true);
  }

  return (
    <div className="w-full flex justify-center py-0 sm:py-6 md:py-8 px-0 sm:px-4">
      {/* Main Single Vertical Container Matching Inflixo Card Style */}
      <div className="w-full max-w-[540px] bg-(--card-bg) border-0 sm:border border-(--card-border) sm:rounded-2xl shadow-none sm:shadow-lg overflow-hidden text-(--text) transition-colors">
        
        {/* ============================================================== */}
        {/* 1. TOP HEADER (Exact ProfileHeader layout from Screenshot 1)    */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5 border-b border-(--divider)">
          <ProfileHeader
            displayName={profile.displayName || `@${cleanHandle}`}
            username={cleanHandle}
            photoUrl={profile.photoDataUrl}
            isVerified={true}
            tagline={profile.profession || profile.category || "Content Creator"}
            socialList={socialList}
            totalAudience={totalAudience}
            creatorEra={creatorEra}
            onShareClick={handleShareClick}
          />
        </div>

        {/* ============================================================== */}
        {/* 2. SECTION: SERIES & PLAYLISTS (Screenshot 1)                 */}
        {/* ============================================================== */}
        {series.length > 0 && (
          <section className="border-b border-(--divider) text-left">
            {/* Section Header */}
            <div className="px-4 sm:px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-[#7A2253] shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-(--text) tracking-tight">
                  Series &amp; Playlists
                </h3>
              </div>
              <p className="text-xs text-(--text-muted) mt-0.5">
                All my stories, in the right order.
              </p>
            </div>

            {/* Series Rows */}
            <div className="divide-y divide-(--divider)">
              {topSeries.map((s, idx) => {
                const epCount = getSeriesEpisodesCount(s);
                return (
                  <div
                    key={s.id || idx}
                    onClick={() => router.push(`/${cleanHandle}/series/${s.id}`)}
                    className="tap-scale px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.02] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Play Box / Thumbnail */}
                      <div className="h-14 w-20 sm:h-16 sm:w-24 rounded-lg bg-[#EAE2DC] shrink-0 overflow-hidden relative flex items-center justify-center">
                        {s.posterDataUrl ? (
                          <>
                            <Image
                              src={s.posterDataUrl}
                              alt={s.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <div className="h-7 w-7 rounded-full bg-white/90 text-[#7A2253] flex items-center justify-center shadow-md">
                                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-[#7A2253] text-white flex items-center justify-center shadow-md">
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          </div>
                        )}
                      </div>

                      {/* Series Info */}
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-(--text) line-clamp-1">
                          {s.title}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-(--text-muted) mt-0.5">
                          {s.genre || "General"} · {epCount} Episodes
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>

            {/* View All Series Footer */}
            <div className="border-t border-(--divider)">
              <Link
                href={seriesUrl}
                className="tap-scale w-full py-3 px-4 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#7A2253] hover:bg-black/[0.02] transition-colors"
              >
                <span>View All Series</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 3. SECTION: LINKS & COMMUNITIES (Screenshot 2)                */}
        {/* ============================================================== */}
        {customLinks.length > 0 && (
          <section className="border-b border-(--divider) text-left">
            {/* Section Header */}
            <div className="px-4 sm:px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[#7A2253] shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-(--text) tracking-tight">
                  Links &amp; Communities
                </h3>
              </div>
              <p className="text-xs text-(--text-muted) mt-0.5">
                Explore my favorite places and communities.
              </p>
            </div>

            {/* Links Rows */}
            <div className="divide-y divide-(--divider)">
              {topLinks.map((link, idx) => (
                <a
                  key={link.id || idx}
                  href={link.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-scale px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Circle Icon */}
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      {getLinkIcon(link.url, link.icon)}
                    </div>
                    {/* Link Info */}
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-(--text) group-hover:text-[#7A2253] line-clamp-1 transition-colors">
                        {link.title}
                      </h4>
                      <p className="text-[11px] text-(--text-muted) mt-0.5">
                        {getLinkSubtext(link.url, link.subtitle)}
                      </p>
                    </div>
                  </div>

                  <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#7A2253] shrink-0 transition-colors" />
                </a>
              ))}
            </div>

            {/* View All Links Footer */}
            <div className="border-t border-(--divider)">
              <Link
                href={linksUrl}
                className="tap-scale w-full py-3 px-4 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#7A2253] hover:bg-black/[0.02] transition-colors"
              >
                <span>
                  View All Links {customLinks.length > 3 ? `(${customLinks.length - 3} more)` : ""}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 4. SECTION: CREATOR SHOP (Screenshot 2)                        */}
        {/* ============================================================== */}
        {products.length > 0 && (
          <section className="border-b border-(--divider) text-left">
            {/* Section Header */}
            <div className="px-4 sm:px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-[#7A2253] shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-(--text) tracking-tight">
                  Creator Shop
                </h3>
              </div>
              <p className="text-xs text-(--text-muted) mt-0.5">
                Gear and products I recommend.
              </p>
            </div>

            {/* Product Rows */}
            <div className="divide-y divide-(--divider)">
              {topProducts.map((p, idx) => (
                <a
                  key={p.id || idx}
                  href={p.productUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-scale px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Square Thumbnail / Icon */}
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        getProductIcon(p.name, (p as any).category)
                      )}
                    </div>
                    {/* Product Info */}
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-(--text) group-hover:text-[#7A2253] line-clamp-1 transition-colors">
                        {p.name}
                      </h4>
                      <p className="text-xs sm:text-sm font-bold text-(--text) mt-0.5">
                        {formatProductPrice(p.pricePaise, (p as any).price)}
                      </p>
                    </div>
                  </div>

                  <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#7A2253] shrink-0 transition-colors" />
                </a>
              ))}
            </div>

            {/* View All Products Footer & Disclaimer */}
            <div className="border-t border-(--divider) py-3 text-center">
              <Link
                href={productsUrl}
                className="tap-scale inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#7A2253] hover:underline"
              >
                <span>
                  View All Products {products.length > 3 ? `(${products.length - 3} more)` : ""}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <p className="text-[10px] text-slate-400 mt-2">
                Some product links may be affiliate links.
              </p>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 5. SECTION: ABOUT ME (Screenshot 3)                            */}
        {/* ============================================================== */}
        <section className="border-b border-(--divider) text-left">
          {/* Section Header */}
          <div className="px-4 sm:px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-[#7A2253] shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-(--text) tracking-tight">
                About Me
              </h3>
            </div>
            <p className="text-xs text-(--text-muted) mt-0.5">
              The person behind the videos.
            </p>
          </div>

          <div className="px-4 sm:px-5 pb-5 space-y-4">
            {/* Bio text */}
            {profile.bio && (
              <p className="text-xs sm:text-sm text-(--text) leading-relaxed">
                {profile.bio}
              </p>
            )}

            {/* Primary Social Accounts Box */}
            {socialList.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-(--text)">
                  Primary Social Accounts
                </h4>
                <div className="rounded-xl border border-(--divider) bg-(--card-bg) divide-y divide-(--divider) overflow-hidden">
                  {socialList.map((s: any) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-scale px-3.5 py-2.5 flex items-center justify-between hover:bg-black/[0.02] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {s.platform === "instagram" && <InstagramIcon className="h-4 w-4 text-[#E1306C]" />}
                        {s.platform === "youtube" && <YoutubeIcon className="h-4 w-4 text-[#FF0000]" />}
                        {s.platform === "facebook" && <FacebookIcon className="h-4 w-4 text-[#1877F2]" />}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-(--text) group-hover:text-[#7A2253] transition-colors">
                            {s.label}
                          </p>
                          <p className="text-[11px] text-(--text-muted)">
                            {s.handle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-right shrink-0">
                        {typeof s.count === "number" && s.count > 0 && (
                          <div className="text-right">
                            <p className="text-xs font-bold text-(--text)">
                              {formatFans(s.count)}
                            </p>
                            <p className="text-[10px] text-(--text-muted)">
                              {s.platform === "youtube" ? "Subscribers" : "Followers"}
                            </p>
                          </div>
                        )}
                        <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-[#7A2253] ml-1" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Other Social Accounts */}
            {otherSocials && otherSocials.length > 0 && (
              <div className="space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-(--text)">
                    Other Social Accounts
                  </h4>
                  <p className="text-[11px] text-(--text-muted)">
                    My additional profiles and channels.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Grouped by platform */}
                  {["instagram", "youtube", "facebook"].map((plat) => {
                    const group = otherSocials.filter(
                      (o: any) => (o.platform || "").toLowerCase() === plat
                    );
                    if (group.length === 0) return null;
                    return (
                      <div key={plat} className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-(--text) flex items-center gap-1.5">
                          {plat === "instagram" && <InstagramIcon className="h-3.5 w-3.5 text-[#E1306C]" />}
                          {plat === "youtube" && <YoutubeIcon className="h-3.5 w-3.5 text-[#FF0000]" />}
                          {plat === "facebook" && <FacebookIcon className="h-3.5 w-3.5 text-[#1877F2]" />}
                          <span className="capitalize">{plat} Accounts</span>
                        </p>
                        <div className="rounded-xl border border-(--divider) bg-(--card-bg) divide-y divide-(--divider) overflow-hidden">
                          {group.map((item: any, idx: number) => {
                            const handle = item.username || item.accountName || "";
                            const url = item.url || (
                              plat === "instagram" ? `https://instagram.com/${handle.replace(/^@/, "")}` :
                              plat === "youtube" ? `https://youtube.com/@${handle.replace(/^@/, "")}` :
                              `https://facebook.com/${handle.replace(/^@/, "")}`
                            );
                            return (
                              <a
                                key={item.id || idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tap-scale px-3 py-2 flex items-center justify-between hover:bg-black/[0.02] text-xs font-medium text-(--text) hover:text-[#7A2253] transition-colors"
                              >
                                <span>@{handle.replace(/^@/, "")}</span>
                                <ExternalLink className="h-3 w-3 text-slate-400" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* My Setup & Creative Team Accordion */}
            {(setupItems.length > 0 || (team.members && team.members.length > 0)) && (
              <div className="rounded-xl border border-(--divider) overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsSetupOpen(!isSetupOpen)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-black/[0.02] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-[#7A2253] shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-(--text)">
                        My Setup &amp; Creative Team
                      </h5>
                      <p className="text-[10px] text-(--text-muted)">
                        Tools and people behind my content.
                      </p>
                    </div>
                  </div>
                  {isSetupOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                {isSetupOpen && (
                  <div className="p-3 border-t border-(--divider) bg-slate-50/50 space-y-3">
                    {/* Setup Gear items */}
                    {setupItems.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Studio Gear
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {setupItems.map((gear, idx) => (
                            <a
                              key={gear.id || idx}
                              href={gear.linkUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-white border border-(--divider) text-xs flex items-center gap-2 hover:border-[#7A2253] transition-colors"
                            >
                              <div className="h-7 w-7 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                <Camera className="h-3.5 w-3.5 text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-(--text) truncate text-[11px]">
                                  {gear.name}
                                </p>
                                <p className="text-[9px] text-(--text-muted) truncate">
                                  {gear.category || "Gear"}
                                </p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Team Members */}
                    {team.members && team.members.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Creative Team
                        </p>
                        <div className="divide-y divide-(--divider) bg-white rounded-lg border border-(--divider)">
                          {team.members.map((member, idx) => (
                            <div key={member.id || idx} className="p-2 flex items-center justify-between text-xs">
                              <div>
                                <p className="font-semibold text-(--text) text-[11px]">
                                  {member.name}
                                </p>
                                <p className="text-[9px] text-(--text-muted)">
                                  {member.role || "Team"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* 6. SECTION: WORK WITH ME (Screenshot 4 & 5)                    */}
        {/* ============================================================== */}
        {(mediaKitPackages.length > 0 || reviews.length > 0) && (
          <section className="border-b border-(--divider) text-left">
            {/* Section Header */}
            <div className="px-4 sm:px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#7A2253] shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-(--text) tracking-tight">
                  Work With Me
                </h3>
              </div>
              <p className="text-xs text-(--text-muted) mt-0.5">
                Creative partnerships that feel authentic.
              </p>
            </div>

            {/* Packages List */}
            {topPackages.length > 0 && (
              <div className="px-4 sm:px-5 pb-4 space-y-3">
                {topPackages.map((pkg, idx) => (
                  <div
                    key={pkg.id || idx}
                    className="rounded-xl border border-(--divider) bg-(--card-bg) p-4 space-y-3"
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-(--text)">
                            {pkg.title}
                          </h4>
                          <p className="text-xs text-(--text-muted) mt-0.5">
                            {pkg.platform}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm sm:text-base font-extrabold text-[#7A2253]">
                            {pkg.price ? (pkg.price.startsWith("₹") ? pkg.price : `₹${pkg.price}`) : "Custom"}
                            {pkg.priceUnit && (
                              <span className="text-[10px] text-slate-500 font-normal"> / {pkg.priceUnit.replace(/^per_/, "")}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {pkg.description && (
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {pkg.description}
                        </p>
                      )}
                    </div>

                    {/* Deliverables Checklist */}
                    {Array.isArray(pkg.deliverables) && pkg.deliverables.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          What&apos;s Included
                        </p>
                        <ul className="space-y-1 text-xs text-slate-600">
                          {pkg.deliverables.map((del, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-1.5">
                              <Check className="h-3.5 w-3.5 text-[#7A2253] shrink-0 mt-0.5" />
                              <span>{del}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Enquire Now Button */}
                    <button
                      type="button"
                      onClick={() => handlePackageInquire(pkg)}
                      className="tap-scale w-full py-2.5 px-4 rounded-lg bg-[#7A2253] hover:bg-[#661b44] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#7A2253]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Enquire Now</span>
                    </button>
                  </div>
                ))}

                {/* View All Packages Footer */}
                {mediaKitPackages.length > 3 && (
                  <div className="text-center pt-1">
                    <Link
                      href={mediaKitUrl}
                      className="tap-scale inline-flex items-center gap-1.5 text-xs font-bold text-[#7A2253] hover:underline"
                    >
                      <span>View All Packages ({mediaKitPackages.length - 3} more)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* What Brands Say (Reviews) */}
            {reviews.length > 0 && (
              <div className="px-4 sm:px-5 pb-5 space-y-2.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-[#7A2253]" />
                    <h4 className="text-xs font-bold text-(--text)">
                      What Brands Say
                    </h4>
                  </div>
                  <p className="text-[11px] text-(--text-muted)">
                    Words from previous collaborations.
                  </p>
                </div>

                <div className="divide-y divide-(--divider) rounded-xl border border-(--divider) bg-(--card-bg) overflow-hidden">
                  {topReviews.map((rev, idx) => (
                    <div key={rev.id || idx} className="p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-(--text)">
                          {rev.clientName || "Brand Client"}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span>{rev.rating ? rev.rating.toFixed(1) : "5.0"}</span>
                        </div>
                      </div>
                      {(rev.projectTitle || (rev as any).serviceType) && (
                        <p className="text-[11px] font-medium text-slate-500">
                          {rev.projectTitle || (rev as any).serviceType}
                        </p>
                      )}
                      {rev.comment && (
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Collaboration Callout */}
            <div className="px-4 sm:px-5 pb-5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Handshake className="h-3.5 w-3.5 text-[#7A2253]" />
                <h4 className="text-xs font-bold text-(--text)">
                  Custom Collaboration
                </h4>
              </div>
              <p className="text-xs text-(--text-muted) leading-relaxed">
                Have a unique idea? Let&apos;s make it happen. For custom campaigns and long-term partnerships, send your proposal.
              </p>
              <button
                type="button"
                onClick={() => handlePackageInquire(undefined)}
                className="tap-scale w-full py-2.5 px-4 rounded-lg bg-[#7A2253] hover:bg-[#661b44] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#7A2253]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <span>Send a Custom Request</span>
              </button>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* 7. FOOTER: POWERED BY INFLIXO (Screenshot 5)                    */}
        {/* ============================================================== */}
        {!hideFooter && (
          <footer className="py-4 px-4 text-center border-t border-(--divider) bg-slate-50/50">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#7A2253] transition-colors"
            >
              <span>Powered by Inflixo</span>
              <ChevronDown className="h-3 w-3" />
            </Link>
          </footer>
        )}
      </div>

      {/* Collaboration Inquiry Modal */}
      {isCollabModalOpen && (
        <CollaborationInquiryModal
          isOpen={isCollabModalOpen}
          onClose={() => setIsCollabModalOpen(false)}
          creatorId={profile.id || cleanHandle}
          creatorUsername={cleanHandle}
          creatorName={profile.displayName || cleanHandle}
          creatorEmail={profile.email}
          selectedPackageTitle={selectedPackage?.title}
          packages={mediaKitPackages}
        />
      )}
    </div>
  );
}
