"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Share2,
  Printer,
  Sparkles,
  ShieldCheck,
  Star,
  Users,
  Film,
  Building2,
  Handshake,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Check,
  Gift,
  ArrowRight,
  Clock,
  ChevronRight,
  UserX,
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
import { CollaborationInquiryModal } from "@/components/mediakit/CollaborationInquiryModal";
import { getInitials } from "@/lib/avatar";

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
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [selectedPackageForInquiry, setSelectedPackageForInquiry] = useState<string | undefined>(undefined);

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

  return (
    <div className="min-h-dvh bg-[#FAF8FA] text-[#17131A] pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#ECE8EB] px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-xs font-bold text-[#043084] bg-[#F7EDF3] px-2 py-0.5 rounded-md">
              Media Kit
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-white hover:bg-surface-soft px-3.5 py-1.5 text-xs font-semibold text-[#17131A] transition-colors cursor-pointer shadow-2xs"
            >
              <Share2 className="h-3.5 w-3.5 text-[#043084]" />
              <span className="hidden sm:inline">Share Media Kit</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#ECE8EB] bg-white hover:bg-surface-soft px-3.5 py-1.5 text-xs font-semibold text-[#17131A] transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-[#6F6872]" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setIsInquiryOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#043084] hover:bg-brand-hover px-4 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs"
            >
              <span>Work With Me</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-6 text-left">
        {/* 1. HERO CREATOR IDENTIFICATION */}
        <section className="rounded-3xl border border-[#ECE8EB] bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <CreatorAvatar
                src={profile.photoDataUrl}
                name={profile.displayName || "Creator"}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover aspect-square border border-[#ECE8EB] shadow-xs"
                textClassName="text-2xl font-bold"
                fallbackBgClass="bg-[#F7EDF3]"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#17131A]">
                    {profile.displayName || "Creator"}
                  </h1>
                  {profile.isVerified && <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-[#043084]">
                  @{profile.username} • {profile.category || "Digital Creator"}
                </p>
                <p className="text-xs text-[#6F6872] max-w-xl leading-relaxed pt-1">
                  {profile.bio || "Official creator portfolio and brand collaboration kit."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-4 text-center sm:text-right shrink-0 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6F6872] block">
                Total Verified Fanbase
              </span>
              <p className="font-display text-3xl font-bold text-[#043084]">
                {formatCount(totalAudience)}
              </p>
              <p className="text-[11px] text-[#6F6872]">Combined audience reach</p>
            </div>
          </div>

          {/* Social Reach Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#ECE8EB]">
            {/* Instagram */}
            <div className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
                  <InstagramIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Instagram</p>
                  <p className="text-[11px] text-[#6F6872]">@{socials.instagram.username || profile.username}</p>
                </div>
              </div>
              <p className="font-display text-sm font-bold">
                {formatCount(socials.instagram.followers || 0)}
              </p>
            </div>

            {/* YouTube */}
            <div className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                  <YoutubeIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">YouTube</p>
                  <p className="text-[11px] text-[#6F6872]">@{socials.youtube.username || profile.username}</p>
                </div>
              </div>
              <p className="font-display text-sm font-bold">
                {formatCount(socials.youtube.subscribers || 0)}
              </p>
            </div>

            {/* Facebook */}
            <div className="rounded-2xl border border-[#ECE8EB] bg-[#FAF8FA] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <FacebookIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-xs">Facebook</p>
                  <p className="text-[11px] text-[#6F6872]">@{socials.facebook.username || profile.username}</p>
                </div>
              </div>
              <p className="font-display text-sm font-bold">
                {formatCount(socials.facebook.followers || 0)}
              </p>
            </div>
          </div>
        </section>

        {/* 2. COLLABORATION PACKAGES & RATE CARDS */}
        {displayPackages.length > 0 && (
          <section className="rounded-3xl border border-[#ECE8EB] bg-white p-5 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#043084]/10 border border-[#043084]/15 flex items-center justify-center text-[#043084] shrink-0 shadow-2xs">
                  <Briefcase className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-[#17131A] tracking-tight">
                    Collaboration Packages
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#64748b]">
                    Custom packages available. Let&apos;s discuss your brand goals!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPackageForInquiry(undefined);
                  setIsInquiryOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#043084] font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
              >
                <span>View All Packages</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-1">
              {displayPackages.map((pkg) => {
                const visual = getPackageCardVisual(pkg);
                const displayPrice = formatPackagePrice(pkg.price);

                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-3xl border ${visual.cardClass} p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md`}
                  >
                    {/* Floating Most Popular / Badge */}
                    {(pkg.isPopular || pkg.badge) && (
                      <span className="absolute -top-3 left-6 z-10 bg-[#E11D74] text-white px-3.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs tracking-tight whitespace-nowrap">
                        {pkg.badge || "Most Popular"}
                      </span>
                    )}

                    <div className="space-y-4">
                      {/* Card Top Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {visual.icon}
                          <h3 className="font-bold text-base sm:text-lg text-[#17131A] leading-snug truncate" title={pkg.title}>
                            {pkg.title}
                          </h3>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-lg sm:text-xl text-[#17131A] leading-tight">
                            {displayPrice}
                          </div>
                          <div className="text-[10px] text-[#64748b] font-medium mt-0.5">
                            Starting from
                          </div>
                        </div>
                      </div>

                      {/* Deliverables Checklist */}
                      {pkg.deliverables && pkg.deliverables.length > 0 && (
                        <ul className="space-y-2 pt-2 text-[#334155]">
                          {pkg.deliverables.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] font-medium leading-snug">
                              <Check className="h-4 w-4 text-[#043084] shrink-0 mt-0.5 stroke-[2.5]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#043084]">
                        <Clock className="h-4 w-4 stroke-[2]" />
                        <span>Delivery: {formatDeliveryText(pkg.turnaroundDays)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPackageForInquiry(pkg.title);
                          setIsInquiryOpen(true);
                        }}
                        className="px-5 py-2 rounded-full bg-[#043084] hover:bg-[#032360] text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer"
                      >
                        Enquire Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. CLIENT REVIEWS */}
        {reviews.length > 0 && (
          <section className="space-y-3.5">
            <div className="px-1">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#17131A] flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                Verified Client Reviews ({reviews.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {reviews.map((rev) => (
                <div key={rev.id} className="rounded-2xl border border-[#ECE8EB] bg-white p-4 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: Number(rev.rating) || 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                    ))}
                  </div>
                  {rev.comment && <p className="text-xs text-[#17131A] italic">“{rev.comment}”</p>}
                  <p className="text-[11px] font-bold text-[#6F6872] pt-1">
                    {rev.clientName} {rev.clientDesignation ? `• ${rev.clientDesignation}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. CREATOR TEAM */}
        {team?.members && Array.isArray(team.members) && team.members.length > 0 && (
          <section className="space-y-3.5">
            <div className="px-1">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#17131A] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#043084]" />
                {team?.team?.teamName || "Creator Team"} ({team?.members?.length || 0})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {team.members.map((m) => (
                <div key={m.id} className="rounded-2xl border border-[#ECE8EB] bg-white p-3.5 flex items-center gap-3 shadow-2xs">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#043084] text-white font-extrabold text-xs shrink-0 ring-2 ring-[#F7EDF3]">
                    {getInitials(m.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-[#17131A] truncate">{m.name}</p>
                    <p className="text-[11px] font-semibold text-[#043084] truncate">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. BOTTOM CONTACT & INQUIRY FOOTER */}
        <section className="rounded-3xl border border-[#ECE8EB] bg-[#F7EDF3]/50 p-6 sm:p-8 text-center space-y-3">
          <h2 className="font-display text-lg font-bold text-[#17131A]">
            Ready to start a brand collaboration?
          </h2>
          <p className="text-xs text-[#6F6872] max-w-md mx-auto">
            Get in touch directly with @{profile.username} for tailored sponsorship campaigns and custom deliverables.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsInquiryOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#043084] hover:bg-brand-hover px-6 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs"
            >
              <span>Submit Brand Inquiry</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </main>

      {/* Inquiry Modal */}
      <CollaborationInquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        creatorId={profile.id || profile.username || "creator"}
        creatorEmail={profile.email}
        creatorName={profile.displayName || "Creator"}
        creatorUsername={profile.username || "creator"}
        packages={packages}
        selectedPackageTitle={selectedPackageForInquiry}
      />
    </div>
  );
}
