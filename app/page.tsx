"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  Check,
  Play,
  Tv,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  MessageCircle,
  Mail,
  Star,
  ExternalLink,
  Link2,
  TrendingUp,
  ShoppingBag,
  Eye,
  Share2,
  Layers,
  ShieldCheck,
  Flame,
  Globe,
  Radio,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { AuthService } from "@/services/AuthService";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { CreatorProfile, SocialAccounts, Series, ThemeKey, MediaKitPackage, CreatorReview } from "@/types";

const DEMO_PROFILE: CreatorProfile = {
  displayName: "Tony Stark",
  username: "tonystark",
  category: "Technology & AI",
  bio: "🚀 Genius, Tech Creator & Founder of Stark Industries ✨ Building AI, Robotics & Armor Series",
  photoDataUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  updatedAt: new Date().toISOString(),
};

const DEMO_SOCIALS: SocialAccounts = {
  instagram: {
    url: "https://instagram.com/tonystark",
    followers: 4800000,
    posts: 420,
    username: "tonystark",
    name: "Tony Stark",
  },
  youtube: {
    url: "https://youtube.com/tonystark",
    subscribers: 12500000,
    videos: 150,
    totalViews: 85000000,
    username: "tonystark",
    channelTitle: "Stark Tech Vlogs",
  },
  facebook: {
    url: "https://facebook.com/tonystark",
    followers: 3200000,
    posts: 310,
    username: "tonystark",
    name: "Tony Stark Official",
  },
  updatedAt: new Date().toISOString(),
};

const DEMO_SERIES: Series[] = [
  {
    id: "demo-s1",
    title: "Iron Tech Series",
    posterDataUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
    description: "4-part tech breakdown of Arc Reactor & J.A.R.V.I.S",
    genre: "Technology",
    language: "English",
    seasons: [
      {
        id: "s1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          { id: "e1", episodeNumber: 1, title: "Part 01: Arc Reactor Tech", thumbnailDataUrl: null, platform: "YouTube", externalUrl: "https://youtube.com", description: "" },
          { id: "e2", episodeNumber: 2, title: "Part 02: Building Mark I", thumbnailDataUrl: null, platform: "YouTube", externalUrl: "https://youtube.com", description: "" },
          { id: "e3", episodeNumber: 3, title: "Part 03: J.A.R.V.I.S AI System", thumbnailDataUrl: null, platform: "YouTube", externalUrl: "https://youtube.com", description: "" },
          { id: "e4", episodeNumber: 4, title: "Part 04: Nanotech Flight Test", thumbnailDataUrl: null, platform: "YouTube", externalUrl: "https://youtube.com", description: "" },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

const DEMO_PACKAGES: MediaKitPackage[] = [
  {
    id: "pkg_demo_1",
    platform: "Instagram",
    title: "1x High-Engagement Dedicated Reel + Bio Link",
    price: "₹25,000",
    turnaroundDays: 3,
    deliverables: [
      "30–60s 4K Dedicated Reel with Brand Co-Author tag",
      "Direct Promo Link pinned in bio for 48 hours",
      "Full raw footage & 30-day analytics report",
    ],
    badge: "⭐ MOST POPULAR",
    isPopular: true,
    isActive: true,
  },
];

const DEMO_REVIEWS: CreatorReview[] = [
  {
    id: "rev_demo_1",
    creatorId: "demo_tonystark",
    token: "demo_tok_1",
    clientName: "Priya Sharma",
    clientEmail: "priya@cultfit.in",
    clientDesignation: "Brand Marketing Lead, CultFit",
    projectTitle: "CultFit AI Smart Workout Campaign",
    contentUrl: "https://instagram.com/p/demo_reel",
    rating: 5,
    ratingContentQuality: 5,
    ratingProfessionalism: 5,
    ratingTimelyDelivery: 5,
    comment: "Tony delivered our campaign in record time with 3.4x ROI on app installs. Incredible creator professionalism and authentic audience trust!",
    status: "approved",
    createdAt: new Date().toISOString(),
  },
];

const PREVIEW_THEMES: { key: ThemeKey; name: string }[] = [
  { key: "minimal-white", name: "Minimal White" },
  { key: "signature-purple", name: "Signature Purple" },
  { key: "midnight", name: "Midnight Dark" },
];

export default function LandingHomePage() {
  const router = useRouter();
  const isLoggedIn = AuthService.isLoggedIn();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [bottomUsername, setBottomUsername] = useState("");
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (AuthService.isLoggedIn()) {
      router.replace("/dashboard");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  // Subtle 6-Second Auto-Theme Switcher for Live Preview Showcase
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentThemeIndex((prev) => (prev + 1) % PREVIEW_THEMES.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  const activeTheme = PREVIEW_THEMES[currentThemeIndex];

  function handleClaim(un: string) {
    const trimmed = un.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (trimmed) {
      router.push(`/login?claim=${trimmed}`);
    } else {
      router.push("/login");
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window === "undefined" || window.innerWidth < 1024) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setMouseOffset({
      x: Math.max(-1, Math.min(1, x)) * 14,
      y: Math.max(-1, Math.min(1, y)) * 14,
    });
  };

  const handlePreviewMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  if (checkingAuth && isLoggedIn) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FAF8FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#803D63] border-t-transparent" />
          <p className="text-xs font-medium text-[#6F6872]">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-[#FFFFFF] text-[#17131A] flex flex-col font-sans selection:bg-[#F7EDF3] selection:text-[#803D63] overflow-x-hidden">
      {/* Subtle Ambient Background Gradients */}
      <div className="pointer-events-none fixed -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[#803D63]/[0.03] blur-3xl z-0" />
      <div className="pointer-events-none fixed top-1/3 -right-32 h-[450px] w-[450px] rounded-full bg-[#F7EDF3]/60 blur-3xl z-0" />
      <div className="pointer-events-none fixed bottom-1/4 -left-32 h-[450px] w-[450px] rounded-full bg-[#803D63]/[0.02] blur-3xl z-0" />

      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#EDE5EA] transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Logo size="md" />
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#6F6872]">
              <button
                type="button"
                onClick={() => scrollToSection("features")}
                className="hover:text-[#17131A] transition-colors cursor-pointer"
              >
                Features
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("total-fanbase")}
                className="hover:text-[#17131A] transition-colors cursor-pointer"
              >
                Total Fanbase
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("series")}
                className="hover:text-[#17131A] transition-colors cursor-pointer"
              >
                Series Playlists
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("collaborations")}
                className="hover:text-[#17131A] transition-colors cursor-pointer"
              >
                Brand Collabs
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("compare")}
                className="hover:text-[#17131A] transition-colors cursor-pointer"
              >
                Compare
              </button>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-[#6F6872] hover:text-[#17131A] px-3 py-1.5 transition-colors"
            >
              Log In
            </Link>
            <button
              type="button"
              onClick={() => handleClaim("")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#6D3254] transition-all cursor-pointer shadow-xs tap-scale"
            >
              <span>Claim Handle</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative z-10 pt-12 pb-16 sm:pt-18 sm:pb-24 border-b border-[#EDE5EA] bg-gradient-to-b from-[#FAF8FA] to-[#FFFFFF]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-7">
          {/* Eyebrow Label */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EDE5EA] bg-[#F7EDF3] px-4 py-1.5 text-xs font-semibold text-[#803D63]">
            <Sparkles className="h-3.5 w-3.5 text-[#803D63]" />
            <span>The All-in-One Creator Profile</span>
          </div>

          {/* Confident Headline */}
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.15] tracking-tight text-[#17131A] max-w-4xl mx-auto">
            One link for your entire <br className="hidden sm:inline" />
            <span className="text-[#803D63]">creator universe.</span>
          </h1>

          {/* Concise 2-3 Line Description */}
          <p className="text-base sm:text-lg md:text-xl font-normal text-[#6F6872] max-w-2xl mx-auto leading-relaxed">
            Combine your followers across Instagram, YouTube, and Facebook into one live Total Fanbase. Organize your series into bingeable playlists, showcase brand collab packages, and build visible client trust.
          </p>

          {/* Interactive Handle Claim & CTA Box */}
          <div className="max-w-md mx-auto space-y-3 pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleClaim(username);
              }}
              className="flex items-center rounded-xl border border-[#EDE5EA] bg-white p-1.5 focus-within:border-[#803D63] focus-within:ring-3 focus-within:ring-[#803D63]/10 transition-all shadow-xs"
            >
              <span className="pl-3.5 text-xs sm:text-sm font-semibold text-[#803D63] select-none shrink-0">
                inflixo.com/
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                className="w-full bg-transparent px-2 py-2 text-xs sm:text-sm font-semibold text-[#17131A] outline-none placeholder:text-[#6F6872]/60 placeholder:font-normal min-w-0"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-[#803D63] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#6D3254] transition-colors cursor-pointer shadow-xs"
              >
                <span>Claim</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Action Buttons: Primary & Secondary */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleClaim(username)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3 text-sm font-semibold text-white transition-all shadow-sm cursor-pointer tap-scale"
              >
                <Sparkles className="h-4 w-4" />
                <span>Claim My Username</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("live-preview")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-[#FAF8FA] border border-[#EDE5EA] px-6 py-3 text-sm font-semibold text-[#803D63] transition-all shadow-xs cursor-pointer"
              >
                <Eye className="h-4 w-4 text-[#803D63]" />
                <span>View Creator Profile</span>
              </button>
            </div>

            {/* Early Access Supporting Line (Strictly No "Free" Word) */}
            <p className="text-xs font-medium text-[#6F6872] pt-2">
              Early Access &bull; No card required &bull; Setup in 60 seconds
            </p>
          </div>

          {/* Clean Creator Feature Strip */}
          <div className="pt-6 max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {[
                { label: "Total Fanbase", icon: Users },
                { label: "Social Stats", icon: TrendingUp },
                { label: "Series & Episodes", icon: Tv },
                { label: "Custom Links", icon: Link2 },
                { label: "Collab Gigs", icon: Briefcase },
                { label: "Client Reviews", icon: Star },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#EDE5EA] px-3.5 py-1.5 text-xs font-semibold text-[#17131A] shadow-2xs hover:border-[#803D63] transition-all"
                  >
                    <Icon className="h-3.5 w-3.5 text-[#803D63]" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. PUBLIC CREATOR PROFILE PREVIEW (APPROVED UNCHANGED LIVE CARD WITH CREATOR ECOSYSTEM ORBIT) */}
      <section
        id="live-preview"
        onMouseMove={handlePreviewMouseMove}
        onMouseLeave={handlePreviewMouseLeave}
        className="relative py-16 sm:py-24 bg-[#FAF8FA] border-b border-[#EDE5EA] scroll-mt-12 overflow-hidden"
      >
        {/* Animated Creator Ecosystem Orbit Rings in Background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-0">
          {/* Outer Orbiting Track with Rotating Accent Nodes */}
          <div className="relative w-[680px] sm:w-[820px] lg:w-[1020px] h-[680px] sm:h-[820px] lg:h-[1020px] rounded-full border border-dashed border-[#803D63]/20 animate-orbit-slow">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-[#803D63] shadow-xs" />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#803D63]/50" />
            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-[#803D63]/70" />
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-2 w-2 rounded-full bg-[#803D63]/40" />
          </div>

          {/* Inner Counter-Orbiting Guide Track */}
          <div className="absolute w-[500px] sm:w-[620px] lg:w-[760px] h-[500px] sm:h-[620px] lg:h-[760px] rounded-full border border-dashed border-[#EDE5EA] animate-orbit-reverse">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-rose-300" />
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 h-2 w-2 rounded-full bg-purple-300" />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <span className="inline-block rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider">
              Product Demonstration
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17131A]">
              See everything about a creator on one profile.
            </h2>
            <p className="text-sm sm:text-base font-normal text-[#6F6872] leading-relaxed">
              Audience counts, verified socials, structured content series, collaboration packages, and client reviews—presented in one sober, cohesive media kit.
            </p>

            {/* Interactive Theme Switcher Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <span className="text-[11px] font-semibold text-[#6F6872] mr-1">Preview Theme:</span>
              {PREVIEW_THEMES.map((th, idx) => (
                <button
                  key={th.key}
                  type="button"
                  onClick={() => setCurrentThemeIndex(idx)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    currentThemeIndex === idx
                      ? "bg-[#803D63] text-white shadow-2xs"
                      : "bg-white border border-[#EDE5EA] text-[#6F6872] hover:text-[#17131A]"
                  }`}
                >
                  {th.name}
                </button>
              ))}
            </div>
          </div>

          {/* Central Showcase Wrapper with Orbiting Ecosystem Badges */}
          <div className="relative max-w-5xl mx-auto flex items-center justify-center py-6 sm:py-8 px-2 sm:px-4">
            {/* FLOATING ORBIT BADGE 1: Total Fanbase (Top-Left) */}
            <div
              className="absolute -top-3 left-1 sm:left-4 md:top-2 md:-left-6 lg:top-8 lg:-left-16 xl:-left-24 z-20 transition-transform duration-200 ease-out"
              style={{
                transform: `translate3d(${mouseOffset.x * 0.9}px, ${mouseOffset.y * 0.9}px, 0)`,
              }}
            >
              <div className="animate-float-slow-1">
                <div className="flex items-center gap-2 sm:gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EDE5EA] px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#17131A] shadow-md shadow-[#803D63]/8 hover-lift">
                  <span className="flex h-6 sm:h-7 w-6 sm:w-7 items-center justify-center rounded-xl bg-[#F7EDF3] text-[#803D63] shrink-0">
                    <Users className="h-3.5 w-3.5" />
                  </span>
                  <div className="text-left">
                    <p className="text-[9px] sm:text-[10px] text-[#6F6872] leading-none">Total Fanbase</p>
                    <p className="text-[11px] sm:text-xs font-bold text-[#17131A] leading-tight">20.5M Combined</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING ORBIT BADGE 2: OTT Series & Episodes (Top-Right) */}
            <div
              className="absolute -top-3 right-1 sm:right-4 md:top-4 md:-right-6 lg:top-10 lg:-right-16 xl:-right-24 z-20 transition-transform duration-200 ease-out"
              style={{
                transform: `translate3d(${mouseOffset.x * -0.9}px, ${mouseOffset.y * -0.9}px, 0)`,
              }}
            >
              <div className="animate-float-slow-2">
                <div className="flex items-center gap-2 sm:gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EDE5EA] px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#17131A] shadow-md shadow-[#803D63]/8 hover-lift">
                  <span className="flex h-6 sm:h-7 w-6 sm:w-7 items-center justify-center rounded-xl bg-[#F7EDF3] text-[#803D63] shrink-0">
                    <Tv className="h-3.5 w-3.5" />
                  </span>
                  <div className="text-left">
                    <p className="text-[9px] sm:text-[10px] text-[#6F6872] leading-none">OTT Series</p>
                    <p className="text-[11px] sm:text-xs font-bold text-[#17131A] leading-tight">Part 01 &bull; 02 &bull; 03</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING ORBIT BADGE 3: Multi-Platform Sync (Middle-Left) */}
            <div
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-8 lg:-left-20 xl:-left-28 z-20 transition-transform duration-200 ease-out"
              style={{
                transform: `translate3d(${mouseOffset.x * 0.65}px, ${mouseOffset.y * 0.65}px, 0)`,
              }}
            >
              <div className="animate-float-slow-3">
                <div className="flex items-center gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EDE5EA] px-3.5 py-2 text-xs font-semibold text-[#17131A] shadow-md shadow-[#803D63]/8 hover-lift">
                  <div className="flex items-center -space-x-1.5 shrink-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-50 text-pink-600 border border-white">
                      <InstagramIcon className="h-3 w-3" />
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600 border border-white">
                      <YoutubeIcon className="h-3 w-3" />
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-white">
                      <FacebookIcon className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-[#6F6872] leading-none">Live Sync</p>
                    <p className="text-xs font-bold text-[#17131A] leading-tight">3 Channels</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING ORBIT BADGE 4: Brand Collab Packages (Lower-Right) */}
            <div
              className="absolute bottom-16 -right-1 sm:right-4 md:bottom-20 md:-right-6 lg:bottom-28 lg:-right-16 xl:-right-24 z-20 transition-transform duration-200 ease-out"
              style={{
                transform: `translate3d(${mouseOffset.x * -0.75}px, ${mouseOffset.y * -0.75}px, 0)`,
              }}
            >
              <div className="animate-float-slow-4">
                <div className="flex items-center gap-2 sm:gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EDE5EA] px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#17131A] shadow-md shadow-[#803D63]/8 hover-lift">
                  <span className="flex h-6 sm:h-7 w-6 sm:w-7 items-center justify-center rounded-xl bg-[#0D9488]/10 text-[#0D9488] shrink-0">
                    <Briefcase className="h-3.5 w-3.5" />
                  </span>
                  <div className="text-left">
                    <p className="text-[9px] sm:text-[10px] text-[#6F6872] leading-none">Collab Gigs</p>
                    <p className="text-[11px] sm:text-xs font-bold text-[#17131A] leading-tight">Direct WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING ORBIT BADGE 5: Verified Client Reviews (Lower-Left) */}
            <div
              className="absolute bottom-16 -left-1 sm:left-4 md:bottom-16 md:-left-6 lg:bottom-16 lg:-left-16 xl:-left-24 z-20 transition-transform duration-200 ease-out"
              style={{
                transform: `translate3d(${mouseOffset.x * 0.7}px, ${mouseOffset.y * 0.7}px, 0)`,
              }}
            >
              <div className="animate-float-slow-2">
                <div className="flex items-center gap-2 sm:gap-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EDE5EA] px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#17131A] shadow-md shadow-[#803D63]/8 hover-lift">
                  <span className="flex h-6 sm:h-7 w-6 sm:w-7 items-center justify-center rounded-xl bg-amber-50 text-amber-500 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="text-left">
                    <p className="text-[9px] sm:text-[10px] text-[#6F6872] leading-none">Brand Trust</p>
                    <p className="text-[11px] sm:text-xs font-bold text-[#17131A] leading-tight">5.0 Verified Review</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exact Approved Live Preview Container (Unchanged Dimensions & UI) */}
            <div className="w-full max-w-[540px] rounded-3xl border border-[#EDE5EA] bg-white p-3 sm:p-4 relative z-10 transition-all duration-500 space-y-3 shadow-xl shadow-[#803D63]/5">
              {/* Browser Header Bar */}
              <div className="flex items-center justify-between bg-[#FAF8FA] px-4 py-2.5 rounded-2xl border border-[#EDE5EA]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EDE5EA]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EDE5EA]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#EDE5EA]" />
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#17131A] border border-[#EDE5EA]">
                  <span>inflixo.com/{username ? username.toLowerCase().replace(/[^a-z0-9_]/g, "") : "tonystark"}</span>
                </div>
                <div className="w-6" />
              </div>

              {/* Exact Approved Live Preview Card Component */}
              <LivePreviewCard
                profile={
                  username.trim()
                    ? {
                        displayName: username.trim().charAt(0).toUpperCase() + username.trim().slice(1),
                        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
                        category: "Digital Creator",
                        bio: `🚀 Official OTT Media Kit & Series Showcase of @${username.trim()}`,
                        photoDataUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username.trim())}`,
                        updatedAt: new Date().toISOString(),
                      }
                    : DEMO_PROFILE
                }
                socials={
                  username.trim()
                    ? {
                        instagram: { url: `https://instagram.com/${username}`, followers: 450000, posts: 180, username: username.trim() },
                        youtube: { url: `https://youtube.com/@${username}`, subscribers: 820000, videos: 95, totalViews: 45000000, username: username.trim() },
                        facebook: { url: `https://facebook.com/${username}`, followers: 210000, posts: 120, username: username.trim() },
                        updatedAt: new Date().toISOString(),
                      }
                    : DEMO_SOCIALS
                }
                series={DEMO_SERIES}
                mediaKitPackages={DEMO_PACKAGES}
                reviews={DEMO_REVIEWS}
                totalAudience={username.trim() ? 1480000 : 20500000}
                themeKey={activeTheme.key}
              />

              {/* Action Strip Below Profile Preview */}
              <button
                type="button"
                onClick={() => handleClaim(username)}
                className="w-full tap-scale py-3 px-4 rounded-xl bg-[#803D63] hover:bg-[#6D3254] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Claim @{username.trim() || "yourname"} Profile</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* 4. CREATOR PROBLEM CARDS SECTION */}
      <section id="problems" className="py-16 sm:py-24 bg-white border-b border-[#EDE5EA]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-block rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider">
              The Creator Dilemma
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17131A]">
              Creators build huge followings, but their value gets scattered.
            </h2>
            <p className="text-sm sm:text-base text-[#6F6872] leading-relaxed">
              Standard bio-link tools are designed as plain link lists. They were never built for the complex reality of modern video creators and professional brand partnerships.
            </p>
          </div>

          {/* 4 Clean Problem Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-2xl border border-[#EDE5EA] bg-[#FAF8FA] space-y-3 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-[#F7EDF3] text-[#803D63] flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-[#17131A]">Fragmented Audience</h3>
              <p className="text-xs sm:text-sm text-[#6F6872] leading-relaxed">
                Followers are split across Instagram, YouTube, and Facebook. Showing one channel makes your reach look smaller than it is.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#EDE5EA] bg-[#FAF8FA] space-y-3 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-[#F7EDF3] text-[#803D63] flex items-center justify-center">
                <Tv className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-[#17131A]">Lost Series Episodes</h3>
              <p className="text-xs sm:text-sm text-[#6F6872] leading-relaxed">
                Part 1, Part 2, and Part 3 get separated inside algorithm feeds. Viewers struggle to discover and watch the next episode.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#EDE5EA] bg-[#FAF8FA] space-y-3 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-[#F7EDF3] text-[#803D63] flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-[#17131A]">Repetitive Rate DMing</h3>
              <p className="text-xs sm:text-sm text-[#6F6872] leading-relaxed">
                Copy-pasting deliverables and negotiating rates in messy DMs wastes hours and makes collaboration look unprofessional.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[#EDE5EA] bg-[#FAF8FA] space-y-3 hover-lift">
              <div className="h-10 w-10 rounded-xl bg-[#F7EDF3] text-[#803D63] flex items-center justify-center">
                <Star className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-base text-[#17131A]">Trapped Client Proof</h3>
              <p className="text-xs sm:text-sm text-[#6F6872] leading-relaxed">
                Your best feedback and campaign praise remain trapped in private WhatsApp chats instead of building visible social proof.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURE 1: TOTAL FANBASE (STRONGEST VISUAL PRIORITY) */}
      <section id="total-fanbase" className="py-16 sm:py-24 bg-[#FAF8FA] border-b border-[#EDE5EA]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Copy: Heading, Problem, Solution, Benefits, CTA */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="inline-block rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA] px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Feature 01 &bull; Total Fanbase
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17131A] leading-tight">
                Show your complete audience in one unified number.
              </h3>

              {/* Creator Problem Box */}
              <div className="text-xs sm:text-sm text-[#17131A] bg-[#F7EDF3]/70 border border-[#EDE5EA] p-3.5 rounded-xl leading-relaxed">
                <strong className="text-[#803D63]">Creator problem:</strong> Platforms keep your audience counts siloed. Showing a single account undervalues your actual creator footprint.
              </div>

              {/* Solution Paragraph */}
              <p className="text-sm sm:text-base font-normal text-[#6F6872] leading-relaxed">
                Inflixo combines your connected platforms into one verified Total Fanbase, presenting a credible combined number for brands and sponsors.
              </p>

              {/* Highlight Formula */}
              <div className="rounded-xl bg-white border border-[#EDE5EA] p-3 text-center font-display font-bold text-xs sm:text-sm text-[#803D63] shadow-2xs">
                Instagram + YouTube + Facebook = Total Fanbase
              </div>

              {/* Concise Benefits */}
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-[#17131A]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Show your verified multi-platform reach</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Make an immediate impression on brand marketers</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Share one live number instead of scattered screenshots</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Show My Total Fanbase</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Visual: Clean Total Fanbase Count Card */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-[#EDE5EA] bg-white p-5 sm:p-6 shadow-lg shadow-[#803D63]/5 space-y-5 hover-lift">
                {/* Creator Meta Strip */}
                <div className="flex items-center justify-between pb-3 border-b border-[#EDE5EA]">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={DEMO_PROFILE.photoDataUrl || ""}
                      alt={DEMO_PROFILE.displayName}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-[#EDE5EA]"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-[#17131A]">{DEMO_PROFILE.displayName}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA]">
                          {DEMO_PROFILE.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6F6872]">@{DEMO_PROFILE.username}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live Sync
                  </span>
                </div>

                {/* Total Fanbase Highlight Card */}
                <div className="rounded-2xl p-6 text-center w-full space-y-1 bg-[#FAF8FA] border border-[#EDE5EA]">
                  <p className="text-3xl sm:text-4xl font-extrabold tabular-nums text-[#17131A]">
                    20,500,000
                  </p>
                  <p className="text-[11px] font-bold tracking-wider uppercase text-[#803D63]">
                    TOTAL FANBASE
                  </p>
                  <p className="text-[11px] font-medium text-[#6F6872]">
                    Combined reach across Instagram, YouTube &amp; Facebook
                  </p>
                </div>

                {/* Social Channel Breakdown Rows */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EDE5EA]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
                        <InstagramIcon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-[#17131A]">Instagram</span>
                    </div>
                    <span className="text-xs font-bold text-[#17131A]">4.8M</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EDE5EA]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <YoutubeIcon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-[#17131A]">YouTube</span>
                    </div>
                    <span className="text-xs font-bold text-[#17131A]">12.5M</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#EDE5EA]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FacebookIcon className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-semibold text-[#17131A]">Facebook</span>
                    </div>
                    <span className="text-xs font-bold text-[#17131A]">3.2M</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURE 2: SERIES AND EPISODES (EQUAL/GREATER VISUAL PRIORITY) */}
      <section id="series" className="py-16 sm:py-24 bg-white border-b border-[#EDE5EA]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Visual: OTT-Inspired Series & Playlist Showcase (Order 2 on mobile, 1 on desktop) */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-md rounded-2xl border border-[#EDE5EA] bg-[#FAF8FA] p-5 shadow-lg shadow-[#803D63]/5 space-y-3.5 text-left hover-lift">
                {/* Series Header Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#803D63] bg-[#F7EDF3] px-2 py-0.5 rounded-md">
                      OTT Content Playlist
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-[#17131A] pt-1">
                      Iron Tech Series
                    </h4>
                    <p className="text-xs text-[#6F6872]">
                      4 Episodes &bull; Technology &bull; English
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EDE5EA] bg-white text-[#6F6872] shadow-2xs">
                    <Share2 className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Ordered Episodes List */}
                <div className="space-y-2 pt-1">
                  {[
                    { num: "01", title: "Part 01: Arc Reactor Tech", progress: "100%", active: false },
                    { num: "02", title: "Part 02: Building Mark I", progress: "65%", active: true },
                    { num: "03", title: "Part 03: J.A.R.V.I.S AI System", progress: "0%", active: false },
                    { num: "04", title: "Part 04: Nanotech Flight Test", progress: "0%", active: false },
                  ].map((ep) => (
                    <div
                      key={ep.num}
                      className={`flex items-center gap-3 rounded-xl p-2.5 text-xs border transition-all ${
                        ep.active
                          ? "bg-white border-[#803D63] shadow-xs"
                          : "bg-white/80 border-[#EDE5EA] text-[#17131A]"
                      }`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7EDF3] text-[#803D63] shrink-0">
                        <Play className="h-3 w-3 fill-current ml-0.5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#17131A] truncate">{ep.title}</span>
                          {ep.active && (
                            <span className="text-[10px] font-semibold text-[#803D63] bg-[#F7EDF3] px-1.5 py-0.5 rounded">
                              Next Up
                            </span>
                          )}
                        </div>
                        {/* Subtle Progress Bar */}
                        <div className="h-1 w-full rounded-full bg-[#EDE5EA] overflow-hidden">
                          <div
                            className="h-full bg-[#803D63] rounded-full"
                            style={{ width: ep.progress }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Continue Watching Action Pill */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7EDF3] border border-[#EDE5EA] text-xs font-semibold text-[#803D63]">
                  <span className="flex items-center gap-1.5">
                    <Tv className="h-3.5 w-3.5" /> Continue Watching Episode 2
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Right Copy: Heading, Problem, Solution, Benefits, CTA */}
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              <span className="inline-block rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA] px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Feature 02 &bull; Series &amp; Episodes
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17131A] leading-tight">
                Keep every episode in order so viewers never lose the next part.
              </h3>

              {/* Creator Problem Box */}
              <div className="text-xs sm:text-sm text-[#17131A] bg-[#F7EDF3]/70 border border-[#EDE5EA] p-3.5 rounded-xl leading-relaxed">
                <strong className="text-[#803D63]">Creator problem:</strong> Multi-part videos get scattered by algorithms. Followers rarely find Part 2 or Part 3 in sequence.
              </div>

              {/* Solution Paragraph */}
              <p className="text-sm sm:text-base font-normal text-[#6F6872] leading-relaxed">
                Organize your episodic content into clean, OTT-inspired playlists. Link videos from YouTube, Instagram, or Facebook into a seamless sequential journey.
              </p>

              {/* Concise Benefits */}
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-[#17131A]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Organize multi-part videos into clean series</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Support YouTube, Instagram Reels, and Facebook episodes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Help fans watch in order without searching through feeds</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Share one single link for an entire mini-series</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Create My First Series</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FEATURE 3: SOCIAL ACCOUNTS & CUSTOM LINKS */}
      <section id="custom-links" className="py-16 sm:py-24 bg-[#FAF8FA] border-b border-[#EDE5EA]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="inline-block rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA] px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Feature 03 &bull; Socials &amp; Priority Links
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17131A] leading-tight">
                All your important channels and links in one clean hub.
              </h3>

              {/* Creator Problem Box */}
              <div className="text-xs sm:text-sm text-[#17131A] bg-[#F7EDF3]/70 border border-[#EDE5EA] p-3.5 rounded-xl leading-relaxed">
                <strong className="text-[#803D63]">Creator problem:</strong> Websites, store merchandise, community groups, and courses get lost inside crowded social bios.
              </div>

              <p className="text-sm sm:text-base font-normal text-[#6F6872] leading-relaxed">
                Connect your social accounts with direct follow buttons and highlight priority destinations like stores, Discord servers, podcasts, and courses.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-[#17131A]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Connect multiple social channels seamlessly</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Promote stores, podcasts, and digital courses</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Update links anytime without changing your Inflixo URL</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Add My Priority Links</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Visual: Social & Custom Links Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-[#EDE5EA] bg-white p-5 sm:p-6 shadow-lg shadow-[#803D63]/5 space-y-3 hover-lift">
                <div className="flex items-center justify-between pb-2 border-b border-[#EDE5EA]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6F6872]">Priority Links</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="rounded-xl p-3 text-xs font-semibold flex items-center justify-between border bg-[#FAF8FA] border-[#EDE5EA] hover:border-[#803D63] text-[#17131A] transition-all">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7EDF3] text-[#803D63]">
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </span>
                      <span>Official Merch Store</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-[#6F6872]" />
                  </div>

                  <div className="rounded-xl p-3 text-xs font-semibold flex items-center justify-between border bg-[#FAF8FA] border-[#EDE5EA] hover:border-[#803D63] text-[#17131A] transition-all">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7EDF3] text-[#803D63]">
                        <Users className="h-3.5 w-3.5" />
                      </span>
                      <span>Creator Discord Community</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-[#6F6872]" />
                  </div>

                  <div className="rounded-xl p-3 text-xs font-semibold flex items-center justify-between border bg-[#FAF8FA] border-[#EDE5EA] hover:border-[#803D63] text-[#17131A] transition-all">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F7EDF3] text-[#803D63]">
                        <Zap className="h-3.5 w-3.5" />
                      </span>
                      <span>AI Robotics Masterclass</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-[#6F6872]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FEATURE 4: BRAND COLLABORATION & MEDIA KIT */}
      <section id="collaborations" className="py-16 sm:py-24 bg-white border-b border-[#EDE5EA]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Visual: Collab Gigs Service Cards (Order 2 on mobile, 1 on desktop) */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-md rounded-2xl border border-[#EDE5EA] bg-[#FAF8FA] p-5 shadow-lg shadow-[#803D63]/5 space-y-3.5 text-left hover-lift">
                {/* Header Row: Platform Pill + Badge + Price */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA]">
                      Instagram Reel
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                      ⭐ Most Popular
                    </span>
                  </div>
                  <span className="font-display text-base font-bold text-[#803D63]">
                    ₹25,000
                  </span>
                </div>

                {/* Title & Turnaround */}
                <div>
                  <h5 className="font-bold text-sm text-[#17131A]">
                    1x High-Engagement Dedicated Reel + Bio Link
                  </h5>
                  <p className="text-[11px] font-medium mt-0.5 flex items-center gap-1 text-[#6F6872]">
                    <Clock className="h-3 w-3 shrink-0" /> Turnaround: 3 Days
                  </p>
                </div>

                {/* Deliverables List */}
                <ul className="text-xs space-y-1.5 pt-2 border-t border-[#EDE5EA] text-[#6F6872]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">30–60s 4K Dedicated Reel with Brand Co-Author tag</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Direct Promo Link pinned in bio for 48 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">Full raw footage &amp; 30-day analytics report</span>
                  </li>
                </ul>

                {/* Direct Contact Actions */}
                <div className="pt-2 border-t border-[#EDE5EA] grid grid-cols-2 gap-2">
                  <div className="bg-[#0D9488] text-white text-xs font-semibold py-2 px-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-2xs">
                    <MessageCircle className="h-3.5 w-3.5 fill-white" />
                    <span>WhatsApp Inquiry</span>
                  </div>
                  <div className="bg-[#17131A] text-white text-xs font-semibold py-2 px-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-2xs">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email Brief</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              <span className="inline-block rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA] px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Feature 04 &bull; Brand Collabs &amp; Rate Cards
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17131A] leading-tight">
                Show brands exactly how they can collaborate with you.
              </h3>

              {/* Creator Problem Box */}
              <div className="text-xs sm:text-sm text-[#17131A] bg-[#F7EDF3]/70 border border-[#EDE5EA] p-3.5 rounded-xl leading-relaxed">
                <strong className="text-[#803D63]">Creator problem:</strong> Negotiating deliverables and rates through endless DM threads looks disorganized and delays brand deals.
              </div>

              <p className="text-sm sm:text-base font-normal text-[#6F6872] leading-relaxed">
                Publish clear collaboration packages for Instagram Reels, YouTube integrations, and reviews. Display your prices or contact options with direct 1-tap booking.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-[#17131A]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>List packages with fixed pricing or custom inquiries</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Detail deliverables, formats, and turnaround timelines</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Receive direct WhatsApp and email lead notifications</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Zero platform commission on direct brand deals</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Build My Collab Card</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FEATURE 5: CLIENT REVIEWS & VERIFIED TRUST */}
      <section id="reviews" className="py-16 sm:py-24 bg-[#FAF8FA] border-b border-[#EDE5EA]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="inline-block rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA] px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Feature 05 &bull; Client Reviews
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17131A] leading-tight">
                Turn happy brand partnerships into visible credibility.
              </h3>

              {/* Creator Problem Box */}
              <div className="text-xs sm:text-sm text-[#17131A] bg-[#F7EDF3]/70 border border-[#EDE5EA] p-3.5 rounded-xl leading-relaxed">
                <strong className="text-[#803D63]">Creator problem:</strong> Genuine sponsor praise stays buried in private message threads instead of helping close the next sponsor.
              </div>

              <p className="text-sm sm:text-base font-normal text-[#6F6872] leading-relaxed">
                Collect authenticated ratings and written reviews from brand marketers. Showcase verified campaign deliverables directly on your profile.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-[#17131A]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Send review request links to client partners</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Display verified collaboration badges and ratings</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                  <span>Control which reviews are publicly displayed</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Collect Client Reviews</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Visual: Client Review Card */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-[#EDE5EA] bg-white p-5 sm:p-6 shadow-lg shadow-[#803D63]/5 space-y-3.5 text-left hover-lift">
                <div className="rounded-xl p-3 border border-[#EDE5EA] bg-[#F7EDF3] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-500 text-sm">⭐</span>
                    <span className="font-bold text-sm text-[#17131A]">5.0</span>
                    <span className="text-[#6F6872] text-xs">&bull;</span>
                    <span className="font-semibold text-xs text-[#17131A]">18 Brand Collaborations</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#803D63]">Verified</span>
                </div>

                <div className="rounded-xl p-4 space-y-2.5 border border-[#EDE5EA] bg-[#FAF8FA]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#EDE5EA] text-[#803D63]">
                      CultFit Campaign
                    </span>
                  </div>

                  <p className="text-xs font-medium italic leading-relaxed text-[#17131A]">
                    &ldquo;Tony delivered our campaign in record time with 3.4x ROI on app installs. Incredible creator professionalism and authentic audience trust!&rdquo;
                  </p>

                  <div className="pt-2 flex items-center justify-between text-[11px] border-t border-[#EDE5EA]">
                    <div className="truncate">
                      <span className="font-bold text-[#17131A]">Priya Sharma</span>
                      <span className="text-[#6F6872] ml-1">&bull; Brand Lead, CultFit</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. COMPARISON SECTION: NORMAL BIO-LINK VS INFLIXO */}
      <section id="compare" className="py-16 sm:py-24 bg-white border-b border-[#EDE5EA]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-block rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider">
              Product Comparison
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17131A]">
              Why creators upgrade to Inflixo.
            </h2>
            <p className="text-sm sm:text-base text-[#6F6872] leading-relaxed">
              Standard bio-links give you a column of buttons. Inflixo provides an all-in-one creator identity and media kit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Normal Bio-Link Column (Neutral, Not Aggressive) */}
            <div className="p-6 sm:p-8 rounded-2xl border border-[#EDE5EA] bg-[#FAF8FA] space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-lg text-[#6F6872]">Normal Bio-Link</h4>
                  <p className="text-xs text-[#6F6872]">Basic URL list aggregators</p>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-[#6F6872]">
                  <li className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6F6872] shrink-0 mt-2" />
                    <span>Plain list of clickable buttons</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6F6872] shrink-0 mt-2" />
                    <span>Separate isolated platform follower counts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6F6872] shrink-0 mt-2" />
                    <span>No structured series or episode ordering</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6F6872] shrink-0 mt-2" />
                    <span>No built-in rate cards or brand packages</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6F6872] shrink-0 mt-2" />
                    <span>No client testimonial collection</span>
                  </li>
                </ul>
              </div>
              <p className="text-[11px] text-[#6F6872] pt-4 border-t border-[#EDE5EA]">
                Requires multiple tools and manual rate negotiation.
              </p>
            </div>

            {/* Inflixo Creator Profile Column (Highlighted in Soft Maroon) */}
            <div className="p-6 sm:p-8 rounded-2xl border-2 border-[#803D63] bg-[#F7EDF3]/40 space-y-6 flex flex-col justify-between relative shadow-md shadow-[#803D63]/5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-lg text-[#803D63]">Inflixo Creator Profile</h4>
                    <p className="text-xs text-[#6F6872]">Complete Creator Identity &amp; Media Kit</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#803D63] text-white">
                    Recommended
                  </span>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm font-semibold text-[#17131A]">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                    <span>Live combined Total Fanbase metric</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                    <span>OTT-inspired video series playlists &amp; episodes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                    <span>Structured collab gigs, deliverables &amp; rate cards</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                    <span>Verified brand client review collection</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                    <span>Custom priority links &amp; curated aesthetics</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#EDE5EA]">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#803D63] hover:bg-[#6D3254] text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Build My Creator Profile</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. PURPOSE AND VISION SECTION */}
      <section id="purpose" className="py-16 sm:py-24 bg-[#FAF8FA] border-b border-[#EDE5EA]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-10 text-center">
          <div className="max-w-3xl mx-auto space-y-3">
            <span className="inline-block rounded-full bg-[#F7EDF3] text-[#803D63] border border-[#EDE5EA] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider">
              Our Vision
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17131A] leading-tight">
              &ldquo;Creators deserve an identity beyond individual platforms.&rdquo;
            </h2>
            <p className="text-sm sm:text-base text-[#6F6872] leading-relaxed">
              Algorithms change, platforms evolve, but your creative work and audience trust belong to you. Inflixo provides the home where your complete journey is recognized.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            <div className="p-6 rounded-2xl bg-white border border-[#EDE5EA] space-y-2.5 shadow-2xs">
              <div className="h-8 w-8 rounded-lg bg-[#F7EDF3] text-[#803D63] flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h4 className="font-bold text-sm text-[#17131A]">Organize Creator Journeys</h4>
              <p className="text-xs text-[#6F6872] leading-relaxed">
                Transform scattered video posts into bingeable, ordered series that retain your audience.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EDE5EA] space-y-2.5 shadow-2xs">
              <div className="h-8 w-8 rounded-lg bg-[#F7EDF3] text-[#803D63] flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h4 className="font-bold text-sm text-[#17131A]">Make Creator Value Visible</h4>
              <p className="text-xs text-[#6F6872] leading-relaxed">
                Unify cross-platform followers and verified reviews into a credible, professional media kit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#EDE5EA] space-y-2.5 shadow-2xs">
              <div className="h-8 w-8 rounded-lg bg-[#F7EDF3] text-[#803D63] flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h4 className="font-bold text-sm text-[#17131A]">Build a Stronger Ecosystem</h4>
              <p className="text-xs text-[#6F6872] leading-relaxed">
                Empower creators to present their work with dignity and engage directly with brand partners.
              </p>
            </div>
          </div>
        </div>
      </section>



      {/* 13. FINAL CTA SECTION */}
      <section className="py-16 sm:py-24 bg-[#FAF8FA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-[#EDE5EA] bg-white p-8 sm:p-14 text-center space-y-6 shadow-xl shadow-[#803D63]/5">
            <div className="space-y-3">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17131A] leading-tight">
                Your fanbase. Your content. Your work. <br />
                <span className="text-[#803D63]">One Inflixo link.</span>
              </h2>
              <p className="text-sm sm:text-base font-normal text-[#6F6872] max-w-xl mx-auto leading-relaxed">
                Give your complete creator journey one unified, professional home.
              </p>
            </div>

            {/* Bottom Claim Input Form */}
            <div className="max-w-md mx-auto space-y-3 pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClaim(bottomUsername);
                }}
                className="flex items-center rounded-xl border border-[#EDE5EA] bg-white p-1.5 focus-within:border-[#803D63] focus-within:ring-3 focus-within:ring-[#803D63]/10 transition-all shadow-xs"
              >
                <span className="pl-3.5 text-xs sm:text-sm font-semibold text-[#803D63] select-none shrink-0">
                  inflixo.com/
                </span>
                <input
                  type="text"
                  value={bottomUsername}
                  onChange={(e) => setBottomUsername(e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-transparent px-2 py-2 text-xs sm:text-sm font-semibold text-[#17131A] outline-none placeholder:text-[#6F6872]/60 placeholder:font-normal min-w-0"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-[#803D63] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#6D3254] transition-colors cursor-pointer shadow-xs"
                >
                  <span>Claim</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleClaim(bottomUsername)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3 text-sm font-semibold text-white transition-all shadow-sm cursor-pointer tap-scale"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Build My Creator Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleClaim(bottomUsername)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-[#FAF8FA] border border-[#EDE5EA] px-6 py-3 text-sm font-semibold text-[#803D63] transition-all shadow-xs cursor-pointer"
                >
                  <span>Claim My Username</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[#EDE5EA] bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#6F6872]">
          <Logo size="sm" />
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/" className="hover:text-[#17131A] transition-colors">
              Creator Home
            </Link>
            <Link href="/privacy" className="hover:text-[#17131A] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#17131A] transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="text-[#6F6872]/80">&copy; 2026 Inflixo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
