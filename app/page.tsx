"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUp,
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
  Zap,
  Layers,
  Award,
  ShieldCheck,
  Plus,
  ArrowDown,
  ChevronRight,
  Sparkle,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { InstagramIcon, YoutubeIcon, FacebookIcon, TikTokIcon } from "@/components/shared/BrandIcons";
import { AuthService } from "@/services/AuthService";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { CreatorProfile, SocialAccounts, Series, ThemeKey, MediaKitPackage, CreatorReview, BillingCycle } from "@/types";
import { openCookiePreferences } from "@/lib/cookieConsent";

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
    posterDataUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
    description: "4-part episodic breakdown of Arc Reactor, Mark I Armor & J.A.R.V.I.S AI",
    genre: "Technology & AI",
    language: "English",
    seasons: [
      {
        id: "s1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "e1",
            episodeNumber: 1,
            title: "Episode 1: Arc Reactor Energy Core",
            thumbnailDataUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80",
            platform: "YouTube",
            externalUrl: "https://youtube.com",
            description: "How the cold fusion core was engineered.",
          },
          {
            id: "e2",
            episodeNumber: 2,
            title: "Episode 2: Building Mark I Armor",
            thumbnailDataUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=400&q=80",
            platform: "YouTube",
            externalUrl: "https://youtube.com",
            description: "Step-by-step mechanical fabrication breakdown.",
          },
          {
            id: "e3",
            episodeNumber: 3,
            title: "Episode 3: J.A.R.V.I.S AI Neural Link",
            thumbnailDataUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
            platform: "Instagram",
            externalUrl: "https://instagram.com",
            description: "Real-time natural language AI architecture.",
          },
          {
            id: "e4",
            episodeNumber: 4,
            title: "Episode 4: Nanotech Flight Test",
            thumbnailDataUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80",
            platform: "YouTube",
            externalUrl: "https://youtube.com",
            description: "Supersonic flight stability and thruster test.",
          },
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
  const [pricingCycle, setPricingCycle] = useState<BillingCycle>("monthly");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    if (AuthService.isLoggedIn()) {
      router.replace("/dashboard");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  // Track scroll position to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        setShowScrollTop(window.scrollY > 400);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
      <div className="flex min-h-dvh items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#803D63] border-t-transparent" />
          <p className="text-xs font-medium text-[#7C7873]">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-[#FAF9F6] text-[#111110] flex flex-col font-sans selection:bg-[#803D63]/12 selection:text-[#803D63] overflow-x-hidden antialiased">
      {/* Delicate Ambient Warmth - Minimal & Quiet */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-[#803D63]/[0.025] to-transparent blur-3xl z-0" />
      <div className="pointer-events-none fixed bottom-1/4 -left-36 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-[#181716]/[0.015] to-transparent blur-3xl z-0" />

      {/* =========================================================================
          NAVIGATION BAR
         ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#FFFEFC]/90 backdrop-blur-md border-b border-[#EBE7DF] transition-all shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Brand Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Logo size="md" />
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#55524E]">
              <button
                type="button"
                onClick={() => scrollToSection("total-fanbase")}
                className="hover:text-[#111110] transition-colors cursor-pointer py-1"
              >
                Total Fanbase
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("series")}
                className="hover:text-[#111110] transition-colors cursor-pointer py-1"
              >
                Series Playlists
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("collaborations")}
                className="hover:text-[#111110] transition-colors cursor-pointer py-1"
              >
                Brand Collabs
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("credibility")}
                className="hover:text-[#111110] transition-colors cursor-pointer py-1"
              >
                Credibility
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("complete-profile")}
                className="hover:text-[#111110] transition-colors cursor-pointer py-1"
              >
                Complete Profile
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("pricing")}
                className="hover:text-[#111110] transition-colors cursor-pointer py-1"
              >
                Pricing
              </button>
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-[#55524E] hover:text-[#111110] px-3 py-1.5 transition-colors"
            >
              Log In
            </Link>
            <button
              type="button"
              onClick={() => handleClaim(username || "yourname")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#6F3456] transition-all cursor-pointer shadow-[0_2px_8px_rgba(128,61,99,0.20)] tap-scale"
            >
              <span>Claim Your Handle</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          1. HERO — CREATE IMMEDIATE DESIRE & POSITIONING
         ========================================================================= */}
      <section className="relative z-10 pt-14 pb-20 sm:pt-20 sm:pb-28 border-b border-[#EBE7DF] bg-[#FFFEFC] overflow-hidden">
        {/* Very subtle warm center glow behind hero */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_10%,rgba(128,61,99,0.035),transparent_75%)]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center space-y-7 max-w-4xl mx-auto">
            {/* Eyebrow Label - Crisp Charcoal & Refined */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD8CF] bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1F1F1F] shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-[#803D63]" />
              <span>THE LINK-IN-BIO BUILT FOR CREATORS</span>
            </div>

            {/* Main Headline - High-Contrast H1 */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black leading-[1.08] tracking-[-0.035em] text-[#111110]">
              One profile for everything you&apos;ve built as a creator.
            </h1>

            {/* Supporting Copy - High Contrast Slate */}
            <p className="text-base sm:text-lg md:text-xl font-normal text-[#2D2D2D] max-w-2xl mx-auto leading-relaxed">
              Your audience, content, series, collaborations and credibility — together in one link.
            </p>

            {/* Secondary Reassurance Line - Dark Slate */}
            <p className="text-xs sm:text-sm font-semibold text-[#1F1F1F] max-w-lg mx-auto">
              100% native platform credit. Direct views, ad revenue, and engagement stay on YouTube, Instagram, and TikTok.
            </p>

            {/* Interactive Handle Claim & CTA Box */}
            <div className="max-w-md mx-auto space-y-3.5 pt-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClaim(username);
                }}
                className="flex items-center rounded-2xl border border-[#DDD8CF] bg-white p-1.5 focus-within:border-[#803D63] focus-within:ring-3 focus-within:ring-[#803D63]/10 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
              >
                <span className="pl-3.5 text-xs sm:text-sm font-bold text-[#2D2D2D] select-none shrink-0">
                  inflixo.com/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-transparent px-2 py-2 text-xs sm:text-sm font-semibold text-[#111110] outline-none placeholder:text-[#8C8882]/80 placeholder:font-normal min-w-0"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-[#803D63] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#6F3456] transition-all cursor-pointer shadow-xs tap-scale"
                >
                  <span>Claim</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Action Buttons: Primary Maroon + Secondary Neutral */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleClaim(username)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-6 py-3 text-sm font-bold text-white transition-all shadow-[0_4px_14px_rgba(128,61,99,0.20)] cursor-pointer tap-scale"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Claim Your Handle</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("hero-preview")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-[#F8F7F3] border border-[#DDD8CF] px-6 py-3 text-sm font-semibold text-[#111110] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:border-[#111110]/30"
                >
                  <Eye className="h-4 w-4 text-[#2D2D2D]" />
                  <span>See Creator Live Hub</span>
                </button>
              </div>

              {/* Comparison Callout Pill */}
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD8CF] bg-white px-4 py-1.5 text-xs font-semibold text-[#1F1F1F] shadow-2xs">
                  <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-[#803D63]/10 text-[#803D63] text-[10px] font-black">✦</span>
                  <span>Built for creators who outgrew basic link trees: <strong className="text-[#111110]">Episodic playlists + Auto media kits.</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================

              HERO VISUAL: THE REAL EXISTING INFLIXO CREATOR PROFILE PREVIEW
             ========================================================================= */}
          <div
            id="hero-preview"
            onMouseMove={handlePreviewMouseMove}
            onMouseLeave={handlePreviewMouseLeave}
            className="relative max-w-5xl mx-auto mt-14 sm:mt-18 pt-4 pb-6 flex items-center justify-center"
          >
            {/* Subtle soft neutral glow behind preview */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[750px] h-[550px] rounded-full bg-gradient-to-tr from-[#803D63]/[0.04] to-amber-500/[0.015] blur-3xl z-0" />

            {/* Orbiting Platform Guide Rings - Delicate Neutral */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-0">
              <div className="relative w-[700px] sm:w-[860px] lg:w-[1040px] h-[700px] sm:h-[860px] lg:h-[1040px] rounded-full border border-dashed border-[#DDD8CF]/80 animate-orbit-slow">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-[#55524E] shadow-2xs" />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-[#DDD8CF]" />
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 h-2 w-2 rounded-full bg-[#803D63]/50" />
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 h-2 w-2 rounded-full bg-[#DDD8CF]" />
              </div>
            </div>

            {/* FLOATING BADGE 1: Total Fanbase */}
            <div
              className="hidden sm:block absolute -top-2 left-0 sm:left-2 md:top-4 md:-left-4 lg:top-10 lg:-left-14 xl:-left-20 z-20 transition-transform duration-200 ease-out"
              style={{
                transform: `translate3d(${mouseOffset.x * 0.9}px, ${mouseOffset.y * 0.9}px, 0)`,
              }}
            >
              <div className="animate-float-slow-1">
                <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#DDD8CF] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-[#111110] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover-lift">
                  <span className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-xl bg-[#F4F2EB] text-[#111110] border border-[#E2DDD5] shrink-0">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] sm:text-[11px] text-[#7C7873] leading-none">Total Fanbase</p>
                    <p className="text-xs sm:text-sm font-bold text-[#111110] leading-tight pt-0.5">20.5M Combined</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING BADGE 2: OTT Series */}
            <div
              className="hidden sm:block absolute -top-2 right-0 sm:right-2 md:top-6 md:-right-4 lg:top-12 lg:-right-14 xl:-right-20 z-20 transition-transform duration-200 ease-out"
              style={{
                transform: `translate3d(${mouseOffset.x * -0.9}px, ${mouseOffset.y * -0.9}px, 0)`,
              }}
            >
              <div className="animate-float-slow-2">
                <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#DDD8CF] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-[#111110] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover-lift">
                  <span className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-xl bg-[#F4F2EB] text-[#111110] border border-[#E2DDD5] shrink-0">
                    <Tv className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] sm:text-[11px] text-[#7C7873] leading-none">OTT Series</p>
                    <p className="text-xs sm:text-sm font-bold text-[#111110] leading-tight pt-0.5">Part 01 &bull; 02 &bull; 03</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING BADGE 3: Multi-Platform Sync */}
            <div
              className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-6 lg:-left-16 xl:-left-24 z-20 transition-transform duration-200 ease-out"
              style={{
                transform: `translate3d(${mouseOffset.x * 0.65}px, ${mouseOffset.y * 0.65}px, 0)`,
              }}
            >
              <div className="animate-float-slow-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#DDD8CF] px-4 py-2.5 text-xs font-semibold text-[#111110] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover-lift">
                  <div className="flex items-center -space-x-1.5 shrink-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-50 text-pink-600 border-2 border-white shadow-2xs">
                      <InstagramIcon className="h-3 w-3" />
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600 border-2 border-white shadow-2xs">
                      <YoutubeIcon className="h-3 w-3" />
                    </span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 border-2 border-white shadow-2xs">
                      <FacebookIcon className="h-3 w-3" />
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-[#7C7873] leading-none">Live Sync</p>
                    <p className="text-xs font-bold text-[#111110] leading-tight pt-0.5">3 Channels</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING BADGE 4: Collab Gigs */}
            <div
              className="hidden sm:block absolute bottom-16 -right-0 sm:right-2 md:bottom-20 md:-right-4 lg:bottom-24 lg:-right-14 xl:-right-20 z-20 transition-transform duration-200 ease-out"
              style={{
                transform: `translate3d(${mouseOffset.x * -0.75}px, ${mouseOffset.y * -0.75}px, 0)`,
              }}
            >
              <div className="animate-float-slow-4">
                <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#DDD8CF] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-[#111110] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover-lift">
                  <span className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-xl bg-[#EAF7F0] text-[#17845B] border border-[#17845B]/20 shrink-0">
                    <Briefcase className="h-4 w-4" />
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] sm:text-[11px] text-[#7C7873] leading-none">Collab Gigs</p>
                    <p className="text-xs sm:text-sm font-bold text-[#111110] leading-tight pt-0.5">Direct WhatsApp</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING BADGE 5: Verified Reviews */}
            <div
              className="hidden sm:block absolute bottom-16 -left-0 sm:left-2 md:bottom-16 md:-left-4 lg:bottom-16 lg:-left-14 xl:-left-20 z-20 transition-transform duration-200 ease-out"
              style={{
                transform: `translate3d(${mouseOffset.x * 0.7}px, ${mouseOffset.y * 0.7}px, 0)`,
              }}
            >
              <div className="animate-float-slow-2">
                <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#DDD8CF] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold text-[#111110] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover-lift">
                  <span className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="text-left">
                    <p className="text-[10px] sm:text-[11px] text-[#7C7873] leading-none">Brand Trust</p>
                    <p className="text-xs sm:text-sm font-bold text-[#111110] leading-tight pt-0.5">5.0 Verified Review</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dominant Real Inflixo Profile Preview Container */}
            <div className="w-full max-w-[580px] rounded-3xl border border-[#DDD8CF] bg-white p-3.5 sm:p-5 relative z-10 space-y-3.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.02)] ring-1 ring-black/[0.03]">
              {/* Browser Header Bar */}
              <div className="flex items-center justify-between bg-[#F8F7F3] px-4 py-2.5 rounded-2xl border border-[#EBE7DF]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#DDD8CF]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#DDD8CF]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#DDD8CF]" />
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-[11px] font-semibold text-[#111110] border border-[#EBE7DF] shadow-2xs">
                  <span className="text-[#55524E] font-medium">inflixo.com/</span>
                  <span className="font-bold">{username ? username.toLowerCase().replace(/[^a-z0-9_]/g, "") : "tonystark"}</span>
                </div>
                <div className="w-6" />
              </div>

              {/* The Real Existing LivePreviewCard */}
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
                onClick={() => handleClaim(username || "yourname")}
                className="w-full tap-scale py-3.5 px-4 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs sm:text-sm transition-all shadow-[0_4px_14px_rgba(128,61,99,0.20)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Claim Your Handle</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. THE CORE INSIGHT — BRAND STATEMENT / CONTRAST
         ========================================================================= */}
      <section className="relative py-20 sm:py-32 bg-[#F9F8F5] border-b border-[#EBE7DF] overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD8CF] bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1F1F1F] shadow-2xs">
            <span>THE NEXT-GEN CREATOR BIO</span>
          </div>

          {/* Large Typography Statement - High Contrast Charcoal */}
          <div className="space-y-4 font-display font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#111110] tracking-tight leading-snug max-w-4xl mx-auto">
            <p className="text-[#1F1F1F]">Link trees were made for links. Creators are more than links.</p>
            <p className="text-[#1F1F1F]">Instagram shows your feed. YouTube shows your channel.</p>
            
            {/* The Big Reveal */}
            <div className="pt-4">
              <span className="block text-3xl sm:text-5xl md:text-6xl font-black text-[#803D63] tracking-tight">
                Inflixo brings your audience, content and creator identity together — and turns multi-part content into bingeable Series.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. THE CREATOR PROBLEM — EDITORIAL STORYTELLING
         ========================================================================= */}
      <section className="py-20 sm:py-32 bg-[#FFFEFC] border-b border-[#EBE7DF]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block rounded-full bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
              The Reality of Modern Creators
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.03em] text-[#111110] leading-tight">
              You built the audience. <br />
              Why should your value be scattered across the internet?
            </h2>
          </div>

          {/* Editorial Visual Storytelling Fragments - Crisp 1-Liners with Dark Charcoal #2D2D2D */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Fragment 1: Audience */}
            <div className="p-7 rounded-3xl border border-[#EBE7DF] bg-white space-y-4 hover-lift shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="h-12 w-12 rounded-2xl bg-[#F4F2EB] text-[#111110] border border-[#E2DDD5] flex items-center justify-center shadow-2xs">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#111110]">Audience Fragmented</h3>
              <p className="text-xs sm:text-sm font-medium text-[#2D2D2D] leading-relaxed">
                Followers are spread across separate silos. Showing one account at a time drastically understates your real creator footprint.
              </p>
            </div>

            {/* Fragment 2: Content */}
            <div className="p-7 rounded-3xl border border-[#EBE7DF] bg-white space-y-4 hover-lift shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="h-12 w-12 rounded-2xl bg-[#F4F2EB] text-[#111110] border border-[#E2DDD5] flex items-center justify-center shadow-2xs">
                <Tv className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#111110]">Multi-Part Videos Lost</h3>
              <p className="text-xs sm:text-sm font-medium text-[#2D2D2D] leading-relaxed">
                Your best episodic reels, tutorials, and series get buried in rapid feeds. Viewers almost never find Part 2 or 3 in chronological order.
              </p>
            </div>

            {/* Fragment 3: Work */}
            <div className="p-7 rounded-3xl border border-[#EBE7DF] bg-white space-y-4 hover-lift shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="h-12 w-12 rounded-2xl bg-[#F4F2EB] text-[#111110] border border-[#E2DDD5] flex items-center justify-center shadow-2xs">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#111110]">Rate Cards in DMs</h3>
              <p className="text-xs sm:text-sm font-medium text-[#2D2D2D] leading-relaxed">
                Rates and deliverables live in unformatted chat threads and manual PDF decks, creating friction and lost sponsor deals.
              </p>
            </div>

            {/* Fragment 4: Credibility */}
            <div className="p-7 rounded-3xl border border-[#EBE7DF] bg-white space-y-4 hover-lift shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="h-12 w-12 rounded-2xl bg-[#F4F2EB] text-[#111110] border border-[#E2DDD5] flex items-center justify-center shadow-2xs">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#111110]">Brand Proof Hidden</h3>
              <p className="text-xs sm:text-sm font-medium text-[#2D2D2D] leading-relaxed">
                Past campaign praise, sponsor testimonials, and ROI results stay hidden in private messages instead of closing your next sponsorship.
              </p>
            </div>
          </div>

          {/* Concluding Statement Box - High Contrast Neutral */}
          <div className="max-w-3xl mx-auto rounded-3xl border border-[#EBE7DF] bg-[#F9F8F5] p-6 sm:p-8 text-center space-y-2 shadow-2xs">
            <p className="font-display text-lg sm:text-2xl font-bold text-[#111110]">
              A creator is more than a collection of links.
            </p>
            <p className="text-sm sm:text-base font-semibold text-[#1F1F1F]">
              Inflixo gives everything you&apos;ve built one home.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. TOTAL FANBASE — UNIFIED REACH & AGGREGATED STATS
         ========================================================================= */}
      <section id="total-fanbase" className="relative py-20 sm:py-32 bg-[#F9F8F5] border-b border-[#EBE7DF] overflow-hidden">
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Requested Pill Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF7F0] border border-[#17845B]/30 px-3.5 py-1 text-xs font-bold text-[#17845B] shadow-2xs">
                <span>⚡ Live-synced verified reach</span>
              </div>

              <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#111110] leading-[1.12] tracking-[-0.03em]">
                You&apos;re bigger than a single platform&apos;s follower count.
              </h3>

              <p className="text-base sm:text-lg font-medium text-[#2D2D2D] leading-relaxed">
                Bring your audience from YouTube, Instagram, and TikTok under one roof. Inflixo aggregates your verified cross-platform reach into a single live stat brands can trust.
              </p>

              {/* Formula Visual Integration - Clean Neutral High Contrast */}
              <div className="rounded-2xl bg-white border border-[#EBE7DF] p-4 text-center shadow-2xs">
                <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-bold text-[#111110] flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[#111110] bg-[#F4F2EB] border border-[#E2DDD5] px-2.5 py-1 rounded-lg">
                    4.8M Instagram
                  </span>
                  <Plus className="h-3.5 w-3.5 text-[#2D2D2D]" />
                  <span className="inline-flex items-center gap-1 text-[#111110] bg-[#F4F2EB] border border-[#E2DDD5] px-2.5 py-1 rounded-lg">
                    12.5M YouTube
                  </span>
                  <Plus className="h-3.5 w-3.5 text-[#2D2D2D]" />
                  <span className="inline-flex items-center gap-1 text-[#111110] bg-[#F4F2EB] border border-[#E2DDD5] px-2.5 py-1 rounded-lg">
                    3.2M TikTok
                  </span>
                </div>
                <div className="pt-2.5 text-sm sm:text-base font-extrabold text-[#111110]">
                  = <span className="text-[#803D63] font-black">20.5M</span> TOTAL UNIFIED REACH
                </div>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 text-xs sm:text-sm font-semibold text-[#1F1F1F]">
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F0] text-[#17845B] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>One unified, live-verified reach counter for brand proposals</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F0] text-[#17845B] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>Instant breakdown by platform with live follower counts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F0] text-[#17845B] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>Command higher sponsorship rates by pitching total audience footprint</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all shadow-[0_4px_14px_rgba(128,61,99,0.20)] cursor-pointer tap-scale"
                >
                  <span>Calculate My Total Reach</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Visual: Real Inflixo Total Fanbase UI - Clean Prestige */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-3xl border border-[#EBE7DF] bg-white p-6 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.04)] space-y-6 hover-lift">
                {/* Creator Meta Strip */}
                <div className="flex items-center justify-between pb-4 border-b border-[#EBE7DF]">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={DEMO_PROFILE.photoDataUrl || ""}
                      alt={DEMO_PROFILE.displayName}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-[#EBE7DF] shadow-2xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-[#111110]">{DEMO_PROFILE.displayName}</h4>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5]">
                          {DEMO_PROFILE.category}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#1F1F1F]">@{DEMO_PROFILE.username}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#17845B] bg-[#EAF7F0] border border-[#17845B]/25 px-2.5 py-1 rounded-full shadow-2xs">
                    <span className="h-2 w-2 rounded-full bg-[#17845B] animate-pulse" />
                    Live Sync
                  </span>
                </div>

                {/* Total Fanbase Highlight Focal Card - Prestigious & High Contrast */}
                <div className="relative rounded-2xl p-6 sm:p-7 text-center w-full space-y-1.5 bg-[#F9F8F5] border border-[#EBE7DF]">
                  <p className="text-4xl sm:text-5xl lg:text-[52px] font-black tabular-nums tracking-tight text-[#111110] leading-none">
                    20,500,000
                  </p>
                  <p className="text-[12px] font-black tracking-widest uppercase text-[#1F1F1F] pt-1">
                    TOTAL UNIFIED REACH
                  </p>
                  <p className="text-xs font-semibold text-[#2D2D2D] pt-0.5">
                    Live-synced across YouTube, Instagram &amp; TikTok
                  </p>
                </div>

                {/* Social Channel Breakdown Rows */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#EBE7DF] shadow-2xs hover:border-[#111110]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100 shadow-2xs">
                        <InstagramIcon className="h-4 w-4" />
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#111110]">Instagram</span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[#111110] tabular-nums">4.8M Followers</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#EBE7DF] shadow-2xs hover:border-[#111110]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100 shadow-2xs">
                        <YoutubeIcon className="h-4 w-4" />
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#111110]">YouTube</span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[#111110] tabular-nums">12.5M Subscribers</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#EBE7DF] shadow-2xs hover:border-[#111110]/30 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-2xs">
                        <TikTokIcon className="h-4 w-4" />
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#111110]">TikTok</span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[#111110] tabular-nums">3.2M Followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. SERIES & EPISODES — OTT PLAYLISTS & BINGEABILITY
         ========================================================================= */}
      <section id="series" className="relative py-20 sm:py-32 bg-[#FFFEFC] border-b border-[#EBE7DF] overflow-hidden">
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Visual: OTT Series Visual Sequence */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-md rounded-3xl border border-[#EBE7DF] bg-[#F9F8F5] p-6 shadow-[0_16px_40px_rgba(0,0,0,0.04)] space-y-4 text-left hover-lift">
                {/* Series Header Bar */}
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-[#EBE7DF]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F1F1F] bg-white border border-[#EBE7DF] px-2.5 py-0.5 rounded-md">
                      OTT Content Playlist
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-[#111110] pt-1">
                      Iron Tech Series
                    </h4>
                    <p className="text-xs font-semibold text-[#2D2D2D]">
                      4 Episodes &bull; Technology &bull; English
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EBE7DF] bg-white text-[#111110] shadow-xs">
                    <Share2 className="h-4 w-4" />
                  </div>
                </div>

                {/* Ordered Episodes List (PART 01 -> PART 04) */}
                <div className="space-y-2.5 pt-1">
                  {[
                    { num: "01", title: "Episode 1: Arc Reactor Tech", progress: "100%", active: false },
                    { num: "02", title: "Episode 2: Building Mark I", progress: "65%", active: true },
                    { num: "03", title: "Episode 3: J.A.R.V.I.S AI System", progress: "0%", active: false },
                    { num: "04", title: "Episode 4: Nanotech Flight Test", progress: "0%", active: false },
                  ].map((ep) => (
                    <div
                      key={ep.num}
                      className={`flex items-center gap-3 rounded-xl p-3 text-xs border transition-all ${
                        ep.active
                          ? "bg-white border-[#803D63] shadow-[0_2px_8px_rgba(128,61,99,0.08)]"
                          : "bg-white border-[#EBE7DF] text-[#111110] hover:border-[#111110]/30"
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4F2EB] text-[#111110] border border-[#E2DDD5] shrink-0 font-bold">
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#111110] truncate">{ep.title}</span>
                          {ep.active && (
                            <span className="text-[10px] font-bold text-[#803D63] bg-[#803D63]/[0.08] px-2 py-0.5 rounded border border-[#803D63]/20">
                              Next Up
                            </span>
                          )}
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full rounded-full bg-[#EBE7DF] overflow-hidden">
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
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#EBE7DF] text-xs font-bold text-[#111110] shadow-2xs hover:border-[#111110]/30 transition-colors cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Tv className="h-4 w-4 text-[#803D63]" /> Continue Watching Episode 2
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#2D2D2D]" />
                </div>
              </div>
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-6 space-y-6 text-left order-1 lg:order-2">
              <span className="inline-block rounded-full bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                EPISODIC PLAYLISTS
              </span>
              <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#111110] leading-[1.12] tracking-[-0.03em]">
                Turn multi-part content into bingeable Series.
              </h3>

              <p className="text-base sm:text-lg font-medium text-[#2D2D2D] leading-relaxed">
                Keep every episode in order, so viewers can start from Part 1 and never lose the next part.
              </p>

              {/* Reassurance Subline Pill */}
              <div className="p-3.5 rounded-2xl bg-[#F4F2EB] border border-[#E2DDD5] text-xs sm:text-sm font-medium text-[#1F1F1F] flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#17845B] shrink-0 mt-0.5" />
                <span><strong className="text-[#111110]">Direct playback with full credit:</strong> native views, ad revenue, and watch time stay on your original platform.</span>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 text-xs sm:text-sm font-semibold text-[#1F1F1F]">
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F0] text-[#17845B] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>Keep multi-part videos locked in perfect sequential order</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F0] text-[#17845B] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>Enable season-style bingeing for your best evergreen content</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F0] text-[#17845B] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>Preserve original YouTube &amp; Instagram engagement metrics and views</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all shadow-[0_4px_14px_rgba(128,61,99,0.20)] cursor-pointer tap-scale"
                >
                  <span>Build My Series Hub</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. YOUR CREATOR WORLD (Supporting Feature — Minimal & Quiet)
         ========================================================================= */}
      <section id="creator-world" className="relative py-16 sm:py-24 bg-[#F9F8F5] border-b border-[#EBE7DF] overflow-hidden">
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="inline-block rounded-full bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                YOUR CREATOR WORLD
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#111110] leading-[1.18] tracking-[-0.025em]">
                Everything worth discovering about you. <br />
                One place to start.
              </h3>

              <p className="text-sm sm:text-base font-medium text-[#2D2D2D] leading-relaxed">
                Bring your important platforms, websites and links together around your creator identity — not just inside another list of links.
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-[#F8F7F3] border border-[#DDD8CF] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#111110] transition-all shadow-2xs cursor-pointer"
                >
                  <span>Connect My Channels</span>
                  <ArrowRight className="h-4 w-4 text-[#2D2D2D]" />
                </button>
              </div>
            </div>

            {/* Right Visual: Quiet & Elegant Custom Links */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-3xl border border-[#EBE7DF] bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-3 hover-lift">
                <div className="flex items-center justify-between pb-2 border-b border-[#EBE7DF]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">Important Destinations</span>
                  <span className="text-[10px] font-bold text-[#17845B] bg-[#EAF7F0] px-2.5 py-0.5 rounded-full border border-[#17845B]/25">
                    Live
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="rounded-2xl p-3 text-xs sm:text-sm font-semibold flex items-center justify-between border bg-[#F9F8F5] border-[#EBE7DF] hover:border-[#111110] hover:bg-white text-[#111110] transition-all shadow-2xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#111110] border border-[#EBE7DF]">
                        <ShoppingBag className="h-4 w-4 text-[#2D2D2D]" />
                      </span>
                      <span>Official Merch Store</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-[#1F1F1F]" />
                  </div>

                  <div className="rounded-2xl p-3 text-xs sm:text-sm font-semibold flex items-center justify-between border bg-[#F9F8F5] border-[#EBE7DF] hover:border-[#111110] hover:bg-white text-[#111110] transition-all shadow-2xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#111110] border border-[#EBE7DF]">
                        <Users className="h-4 w-4 text-[#2D2D2D]" />
                      </span>
                      <span>Creator Discord Community</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-[#1F1F1F]" />
                  </div>

                  <div className="rounded-2xl p-3 text-xs sm:text-sm font-semibold flex items-center justify-between border bg-[#F9F8F5] border-[#EBE7DF] hover:border-[#111110] hover:bg-white text-[#111110] transition-all shadow-2xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#111110] border border-[#EBE7DF]">
                        <Zap className="h-4 w-4 text-[#2D2D2D]" />
                      </span>
                      <span>AI Robotics Masterclass</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-[#1F1F1F]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. BRAND / WORK WITH ME — LIVE MEDIA KIT & RATE CARDS
         ========================================================================= */}
      <section id="collaborations" className="relative py-20 sm:py-32 bg-[#FFFEFC] border-b border-[#EBE7DF] overflow-hidden">
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Visual: Trustworthy Rate Card */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-md rounded-3xl border border-[#EBE7DF] bg-white p-6 shadow-[0_16px_40px_rgba(0,0,0,0.04)] space-y-4 text-left hover-lift">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#EBE7DF]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5]">
                      Instagram Reel
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
                      ⭐ Most Popular
                    </span>
                  </div>
                  <span className="font-display text-lg font-black text-[#111110]">
                    ₹25,000
                  </span>
                </div>

                {/* Title & Turnaround */}
                <div>
                  <h5 className="font-bold text-sm sm:text-base text-[#111110]">
                    1x High-Engagement Dedicated Reel + Bio Link
                  </h5>
                  <p className="text-xs font-semibold mt-1 flex items-center gap-1.5 text-[#1F1F1F]">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-[#2D2D2D]" /> Turnaround: 3 Days
                  </p>
                </div>

                {/* Deliverables List */}
                <ul className="text-xs space-y-2 pt-2 border-t border-[#EBE7DF] text-[#2D2D2D] font-medium">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#17845B] shrink-0 mt-0.5" />
                    <span className="leading-snug">30–60s 4K Dedicated Reel with Brand Co-Author tag</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#17845B] shrink-0 mt-0.5" />
                    <span className="leading-snug">Direct Promo Link pinned in bio for 48 hours</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#17845B] shrink-0 mt-0.5" />
                    <span className="leading-snug">Full raw footage &amp; 30-day analytics report</span>
                  </li>
                </ul>

                {/* Direct Contact Actions */}
                <div className="pt-2 border-t border-[#EBE7DF] grid grid-cols-2 gap-2.5">
                  <div className="bg-[#17845B] text-white text-xs font-bold py-2.5 px-3 rounded-xl inline-flex items-center justify-center gap-2 shadow-2xs hover:bg-[#147450] transition-colors cursor-pointer">
                    <MessageCircle className="h-3.5 w-3.5 fill-white" />
                    <span>WhatsApp Inquiry</span>
                  </div>
                  <div className="bg-[#111110] text-white text-xs font-bold py-2.5 px-3 rounded-xl inline-flex items-center justify-center gap-2 shadow-2xs hover:bg-black transition-colors cursor-pointer">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email Brief</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-6 space-y-6 text-left order-1 lg:order-2">
              <span className="inline-block rounded-full bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                DYNAMIC RATE CARD &amp; MEDIA KIT
              </span>
              <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#111110] leading-[1.12] tracking-[-0.03em]">
                A media kit that updates itself.
              </h3>

              <p className="text-base sm:text-lg font-medium text-[#2D2D2D] leading-relaxed">
                No more stale PDF decks. Share custom rate cards, dynamic audience insights, and direct inquiry links right from your bio.
              </p>

              {/* Zero-Maintenance Emphasized Copy */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#EBE7DF] text-xs sm:text-sm font-medium text-[#1F1F1F] flex items-start gap-2.5 shadow-2xs">
                <Zap className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5" />
                <span><strong className="text-[#111110]">Live-updating rate cards, dynamic audience analytics, and direct brand inquiries</strong>—no manual PDF exports needed.</span>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 text-xs sm:text-sm font-semibold text-[#1F1F1F]">
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F0] text-[#17845B] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>Instant 1-click WhatsApp &amp; email brief routing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F0] text-[#17845B] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>Transparent fixed rates and custom package deliverables</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EAF7F0] text-[#17845B] shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>Cut out agency middleman delays and manual back-and-forth</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all shadow-[0_4px_14px_rgba(128,61,99,0.20)] cursor-pointer tap-scale"
                >
                  <span>Build My Live Rate Card</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. CREDIBILITY — REVIEWS & SOCIAL PROOF
         ========================================================================= */}
      <section id="credibility" className="relative py-20 sm:py-32 bg-[#F9F8F5] border-b border-[#EBE7DF] overflow-hidden">
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="inline-block rounded-full bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                CREATOR CREDIBILITY
              </span>
              <h3 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#111110] leading-[1.12] tracking-[-0.03em]">
                Don&apos;t just say brands trust you. <br />
                Show it.
              </h3>

              <p className="text-base sm:text-lg font-medium text-[#2D2D2D] leading-relaxed">
                Every successful collaboration adds to your creator story. Don&apos;t let that credibility disappear when the campaign ends. Showcase verified ratings, sponsor praise, and case study ROI directly on your creator hub so future partners can close with confidence.
              </p>

              {/* Emotional Takeaway Card - Clean White Neutral */}
              <div className="rounded-2xl bg-white border border-[#EBE7DF] p-4 text-left shadow-2xs">
                <p className="font-display text-xs sm:text-sm font-bold text-[#111110]">
                  &ldquo;My Inflixo isn&apos;t just a bio link. It is my creator reputation page.&rdquo;
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all shadow-[0_4px_14px_rgba(128,61,99,0.20)] cursor-pointer tap-scale"
                >
                  <span>Build My Creator Credibility</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Visual: Real Client Review UI - Clean & Credible */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-3xl border border-[#EBE7DF] bg-white p-6 sm:p-7 shadow-[0_16px_40px_rgba(0,0,0,0.04)] space-y-4 text-left hover-lift">
                <div className="rounded-2xl p-3.5 border border-[#EBE7DF] bg-[#F9F8F5] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-sm">⭐</span>
                    <span className="font-black text-sm text-[#111110]">5.0</span>
                    <span className="text-[#2D2D2D] text-xs">&bull;</span>
                    <span className="font-bold text-xs text-[#111110]">18 Brand Collaborations</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#17845B] bg-[#EAF7F0] px-2 py-0.5 rounded border border-[#17845B]/20 uppercase tracking-wider">
                    Verified
                  </span>
                </div>

                <div className="rounded-2xl p-4.5 space-y-3 border border-[#EBE7DF] bg-white shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F4F2EB] border border-[#E2DDD5] text-[#1F1F1F]">
                      CultFit Campaign
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-medium italic leading-relaxed text-[#111110]">
                    &ldquo;Tony delivered our campaign in record time with 3.4x ROI on app installs. Incredible creator professionalism and authentic audience trust!&rdquo;
                  </p>

                  <div className="pt-2.5 flex items-center justify-between text-xs border-t border-[#EBE7DF]">
                    <div className="truncate">
                      <span className="font-extrabold text-[#111110]">Priya Sharma</span>
                      <span className="text-[#55524E] ml-1">&bull; Brand Marketing Lead, CultFit</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#17845B] flex items-center gap-1 shrink-0 bg-[#EAF7F0] border border-[#17845B]/25 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3 text-[#17845B]" /> Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* =========================================================================
          9. COMPLETE PROFILE — THE COMPLETE CREATOR
         ========================================================================= */}
      <section id="complete-profile" className="py-20 sm:py-32 bg-[#FFFEFC] border-b border-[#EBE7DF]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="inline-block rounded-full bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
              THE COMPLETE CREATOR
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-6xl font-black tracking-[-0.035em] text-[#111110]">
              One profile. <br />
              <span className="text-[#803D63]">The complete creator.</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#2D2D2D] leading-relaxed max-w-2xl mx-auto">
              Your audience, content, series, collaborations and credibility — together in one creator profile.
            </p>
          </div>

          {/* Real Complete Inflixo Creator-Profile Preview */}
          <div className="relative max-w-4xl mx-auto flex flex-col items-center">
            <div className="w-full max-w-[600px] rounded-3xl border border-[#DDD8CF] bg-white p-3.5 sm:p-5 relative z-10 space-y-3.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.02)] ring-1 ring-black/[0.03]">
              {/* Browser Header Bar */}
              <div className="flex items-center justify-between bg-[#F8F7F3] px-4 py-2.5 rounded-2xl border border-[#EBE7DF]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#DDD8CF]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#DDD8CF]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#DDD8CF]" />
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-[11px] font-semibold text-[#111110] border border-[#EBE7DF] shadow-2xs">
                  <span className="text-[#55524E] font-medium">inflixo.com/</span>
                  <span className="font-bold">{username ? username.toLowerCase().replace(/[^a-z0-9_]/g, "") : "tonystark"}</span>
                </div>
                <div className="w-6" />
              </div>

              {/* The Real Existing LivePreviewCard */}
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
                onClick={() => handleClaim(username || "yourname")}
                className="w-full tap-scale py-3.5 px-4 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs sm:text-sm transition-all shadow-[0_4px_14px_rgba(128,61,99,0.20)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Claim Your Handle</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. CREATOR PHILOSOPHY — EDITORIAL MANIFESTO
         ========================================================================= */}
      <section className="py-24 sm:py-36 bg-[#F9F8F5] border-b border-[#EBE7DF]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-8">
          <blockquote className="font-display text-2xl sm:text-4xl md:text-5xl font-black text-[#111110] leading-snug tracking-tight">
            &ldquo;Creators deserve an identity bigger than any single platform.&rdquo;
          </blockquote>

          <div className="space-y-2 text-base sm:text-lg text-[#2D2D2D] max-w-2xl mx-auto leading-relaxed">
            <p>Platforms change. Algorithms change. Audiences move.</p>
            <p className="font-bold text-[#111110]">
              But the identity you&apos;ve built as a creator belongs to you.
            </p>
            <p className="text-[#111110] font-bold pt-2">
              Inflixo gives that identity one permanent home.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          11. PRICING / UPGRADE — ACCURATE INFLIXO TIERS (CLEAN & MINIMAL)
         ========================================================================= */}
      <section id="pricing" className="py-20 sm:py-32 bg-[#FFFEFC] border-b border-[#EBE7DF]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block rounded-full bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5] px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
              PLANS &amp; PRICING
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-[-0.03em] text-[#111110]">
              Your content looks professional. <br />
              Your creator profile should too.
            </h2>
            <p className="text-base sm:text-lg text-[#2D2D2D] leading-relaxed">
              Start building your Inflixo and upgrade when you&apos;re ready to unlock more of your creator world.
            </p>

            {/* Billing Cycle + Currency Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              {/* Monthly / Yearly Billing Toggle */}
              <div className="inline-flex items-center rounded-2xl bg-[#F8F7F3] p-1 border border-[#DDD8CF]">
                <button
                  type="button"
                  onClick={() => setPricingCycle("monthly")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                    pricingCycle === "monthly"
                      ? "bg-white text-[#111110] shadow-xs border border-[#DDD8CF]"
                      : "text-[#55524E] hover:text-[#111110]"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setPricingCycle("yearly")}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    pricingCycle === "yearly"
                      ? "bg-[#111110] text-white shadow-xs"
                      : "text-[#55524E] hover:text-[#111110]"
                  }`}
                >
                  <span>Yearly</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    pricingCycle === "yearly" ? "bg-white/20 text-white" : "bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5]"
                  }`}>
                    Save 16%
                  </span>
                </button>
              </div>

              {/* Currency Selector */}
              <div className="inline-flex items-center rounded-2xl bg-[#F8F7F3] p-1 border border-[#DDD8CF]">
                <button
                  type="button"
                  onClick={() => setCurrency("INR")}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    currency === "INR"
                      ? "bg-white text-[#111110] shadow-xs border border-[#DDD8CF]"
                      : "text-[#55524E] hover:text-[#111110]"
                  }`}
                >
                  ₹ INR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                    currency === "USD"
                      ? "bg-white text-[#111110] shadow-xs border border-[#DDD8CF]"
                      : "text-[#55524E] hover:text-[#111110]"
                  }`}
                >
                  $ USD
                </button>
              </div>
            </div>
          </div>

          {/* 3 Real Inflixo Plan Cards - Clean White & Subtle Accent */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Plan 1: Starter (Free Forever) */}
            <div className="p-7 rounded-3xl border border-[#EBE7DF] bg-white space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-lg text-[#111110]">Starter</h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F4F2EB] text-[#1F1F1F] border border-[#E2DDD5]">
                    Free Forever
                  </span>
                </div>
                <div>
                  <p className="font-display text-2xl font-black text-[#111110]">{currency === "INR" ? "₹0" : "$0"}</p>
                  <p className="text-xs font-semibold text-[#55524E] mt-0.5">No credit card required</p>
                </div>
                {/* Updated Value Prop Headline */}
                <p className="text-xs sm:text-sm font-semibold text-[#2D2D2D] leading-relaxed">
                  Launch your streaming hub &amp; explore core creator tools.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-[#111110] font-medium pt-3 border-t border-[#EBE7DF]">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Up to 3 content series</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Up to 15 total episodes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>1 creator service rate card</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Total Fanbase live counter</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Social profiles &amp; custom links</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#EBE7DF]">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="w-full py-3 px-4 rounded-xl bg-[#F9F8F5] hover:bg-[#F2EFE9] border border-[#EBE7DF] text-[#111110] font-semibold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer"
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* Plan 2: Pro (Recommended) - Subtle Maroon Accent */}
            <div className="p-7 sm:p-8 rounded-3xl border-2 border-[#803D63] bg-white space-y-6 flex flex-col justify-between relative shadow-[0_12px_32px_rgba(128,61,99,0.08)]">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-lg text-[#111110]">Pro</h4>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#803D63] text-white shadow-xs">
                    Recommended
                  </span>
                </div>
                <div>
                  <p className="font-display text-2xl sm:text-3xl font-black text-[#111110]">
                    {currency === "INR"
                      ? pricingCycle === "yearly"
                        ? "₹1,999"
                        : "₹199"
                      : pricingCycle === "yearly"
                      ? "$24.99"
                      : "$2.99"}
                    <span className="text-xs text-[#55524E] font-semibold">
                      {pricingCycle === "yearly" ? " / year" : " / month"}
                    </span>
                  </p>
                  <p className="text-xs font-semibold text-[#55524E] mt-0.5">Taxes may apply</p>
                </div>
                {/* Updated Value Prop Headline */}
                <p className="text-xs sm:text-sm font-semibold text-[#2D2D2D] leading-relaxed">
                  For serious creators publishing series and monetizing brand partnerships.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm font-semibold text-[#111110] pt-3 border-t border-[#EBE7DF]">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Up to 30 content series</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Up to 300 total episodes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Up to 3 active service rate cards</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Remove Inflixo branding</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Direct brand lead routing</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#EBE7DF]">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="w-full py-3 px-4 rounded-xl bg-[#803D63] hover:bg-[#6F3456] text-white font-bold text-xs sm:text-sm transition-all shadow-[0_4px_14px_rgba(128,61,99,0.20)] flex items-center justify-center gap-2 cursor-pointer tap-scale"
                >
                  <span>Upgrade to Creator Pro</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Plan 3: VIP */}
            <div className="p-7 rounded-3xl border border-[#EBE7DF] bg-white space-y-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-lg text-[#111110]">VIP</h4>
                  <span className="text-[10px] font-bold text-[#1F1F1F] bg-[#F4F2EB] border border-[#E2DDD5] px-2.5 py-0.5 rounded-full">
                    Custom
                  </span>
                </div>
                <div>
                  <p className="font-display text-2xl font-black text-[#111110]">
                    {currency === "INR"
                      ? pricingCycle === "yearly"
                        ? "₹2,999"
                        : "₹299"
                      : pricingCycle === "yearly"
                      ? "$39.99"
                      : "$4.99"}
                    <span className="text-xs text-[#55524E] font-semibold">
                      {pricingCycle === "yearly" ? " / year" : " / month"}
                    </span>
                  </p>
                  <p className="text-xs font-semibold text-[#55524E] mt-0.5">Taxes may apply</p>
                </div>
                {/* Updated Value Prop Headline */}
                <p className="text-xs sm:text-sm font-semibold text-[#2D2D2D] leading-relaxed">
                  For established creators and media brands managing complete content franchises.
                </p>
                <ul className="space-y-3 text-xs sm:text-sm text-[#111110] font-medium pt-3 border-t border-[#EBE7DF]">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Unlimited content series</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Unlimited total episodes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Unlimited creator services</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Remove Inflixo branding</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#17845B] shrink-0" />
                    <span>Full feature access &amp; priority</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#EBE7DF]">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="w-full py-3 px-4 rounded-xl bg-[#F9F8F5] hover:bg-[#F2EFE9] border border-[#EBE7DF] text-[#111110] font-semibold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer"
                >
                  Get VIP Access
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          12. FINAL CONVERSION — ONE INFLIXO LINK
         ========================================================================= */}
      <section className="relative py-20 sm:py-32 bg-[#FFFEFC] overflow-hidden">
        {/* Soft Ambient Center Glow */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] rounded-full bg-gradient-to-tr from-[#803D63]/[0.05] to-transparent blur-3xl z-0" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-[#EBE7DF] bg-white p-8 sm:p-16 text-center space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.02]">
            <div className="space-y-4">
              <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-[#111110] leading-[1.1] tracking-[-0.03em]">
                Your fanbase. <br />
                Your content. <br />
                Your work. <br />
                <span className="text-[#803D63]">
                  One Inflixo link.
                </span>
              </h2>
              <p className="text-base sm:text-xl font-normal text-[#2D2D2D] max-w-xl mx-auto leading-relaxed pt-2">
                Build the profile that shows the complete creator behind the content.
              </p>
            </div>

            {/* Bottom Claim Input Form */}
            <div className="max-w-md mx-auto space-y-3.5 pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClaim(bottomUsername);
                }}
                className="flex items-center rounded-2xl border border-[#DDD8CF] bg-white p-1.5 focus-within:border-[#803D63] focus-within:ring-3 focus-within:ring-[#803D63]/10 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
              >
                <span className="pl-3.5 text-xs sm:text-sm font-bold text-[#2D2D2D] select-none shrink-0">
                  inflixo.com/
                </span>
                <input
                  type="text"
                  value={bottomUsername}
                  onChange={(e) => setBottomUsername(e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-transparent px-2 py-2 text-xs sm:text-sm font-semibold text-[#111110] outline-none placeholder:text-[#8C8882]/70 placeholder:font-normal min-w-0"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-[#803D63] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#6F3456] transition-colors cursor-pointer shadow-xs tap-scale"
                >
                  <span>Claim</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Action Buttons: Primary Maroon + Secondary Neutral */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleClaim(bottomUsername)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6F3456] px-6 py-3 text-sm font-semibold text-white transition-all shadow-[0_4px_14px_rgba(128,61,99,0.20)] cursor-pointer tap-scale"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Claim Your Handle</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("hero-preview")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-[#F8F7F3] border border-[#DDD8CF] px-6 py-3 text-sm font-semibold text-[#111110] transition-all shadow-xs cursor-pointer hover:border-[#111110]/30"
                >
                  <span>See a Creator Profile</span>
                </button>
              </div>

              {/* Final Statement */}
              <p className="text-xs font-semibold text-[#1F1F1F] pt-2">
                Your creator universe deserves one home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
         ========================================================================= */}
      <footer className="mt-auto border-t border-[#EBE7DF] bg-[#FAF9F5] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-semibold text-[#2D2D2D]">
          <Logo size="sm" />
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-[#111110] transition-colors">
              Creator Home
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("total-fanbase")}
              className="hover:text-[#111110] transition-colors cursor-pointer"
            >
              Total Fanbase
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("series")}
              className="hover:text-[#111110] transition-colors cursor-pointer"
            >
              Series Playlists
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="hover:text-[#111110] transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <Link href="/privacy" className="hover:text-[#111110] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:text-[#111110] transition-colors">
              Cookie Policy
            </Link>
            <button
              type="button"
              onClick={() => openCookiePreferences()}
              className="hover:text-[#111110] transition-colors cursor-pointer"
            >
              Cookie Preferences
            </button>
            <Link href="/terms" className="hover:text-[#111110] transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="text-[#1F1F1F] font-medium">&copy; 2026 Inflixo. All rights reserved.</p>
        </div>
      </footer>

      {/* FLOATING SCROLL TO TOP BUTTON */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
          showScrollTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="group flex items-center gap-2 rounded-full border border-[#DDD8CF] bg-white/95 px-3.5 py-2.5 text-xs font-semibold text-[#111110] shadow-[0_4px_16px_rgba(0,0,0,0.08)] backdrop-blur-md hover:bg-white hover:border-[#111110]/30 hover:shadow-[0_6px_20px_rgba(0,0,0,0.12)] transition-all cursor-pointer tap-scale"
        >
          <ArrowUp className="h-4 w-4 text-[#55524E] group-hover:text-[#111110] group-hover:-translate-y-0.5 transition-transform" />
          <span className="hidden sm:inline">Top</span>
        </button>
      </div>
    </div>
  );
}
