"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  Check,
  Play,
  Film,
  ShieldCheck,
  Users,
  Layers,
  Briefcase,
  Clock,
  CheckCircle2,
  MessageCircle,
  Mail,
  Star,
  ExternalLink,
  Link2,
  Tv,
  Globe,
  Zap,
  TrendingUp,
  ShoppingBag,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { AuthService } from "@/services/AuthService";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { PricingTable } from "@/components/subscription/PricingTable";
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
  { key: "minimal-white", name: "Soft Minimal" },
  { key: "sand-linen", name: "Warm Sand Linen" },
  { key: "rose-gold", name: "Rose Gold Luxe" },
  { key: "lavender-haze", name: "Lavender Haze" },
  { key: "sakura-blossom", name: "Sakura Blossom" },
];

const HERO_SLIDES = [
  {
    tag: "All-in-One Profile",
    heading: "One profile for everything you do as a creator.",
    subheading: "Show your followers, content, links, collaboration gigs and reviews—all in one place.",
  },
  {
    tag: "Total Fanbase",
    heading: "Show your complete fanbase across every platform.",
    subheading: "Combine Instagram, YouTube and Facebook followers into one impressive live Total Fanbase.",
  },
  {
    tag: "Series & Episodes",
    heading: "Keep every part of your content in order.",
    subheading: "Organize Part 1, Part 2 & Part 3 into playlists so viewers never lose the next episode.",
  },
  {
    tag: "Collab Gigs & Rate Cards",
    heading: "Show brands how they can work with you.",
    subheading: "List your packages, set fixed rates, and receive direct WhatsApp inquiries with zero commission.",
  },
  {
    tag: "Client Reviews",
    heading: "Turn happy clients into visible trust.",
    subheading: "Showcase authentic ratings and verified reviews to close brand deals faster.",
  },
  {
    tag: "Custom Links",
    heading: "Keep your important links easy to find.",
    subheading: "Add your store, portfolio, community and courses without cluttering your bio.",
  },
];

export default function LandingHomePage() {
  const router = useRouter();
  const isLoggedIn = AuthService.isLoggedIn();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [bottomUsername, setBottomUsername] = useState("");
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  useEffect(() => {
    if (AuthService.isLoggedIn()) {
      router.replace("/dashboard");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  // 5-Second Auto-Theme Switcher for Hero Phone Mockup
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentThemeIndex((prev) => (prev + 1) % PREVIEW_THEMES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // 5-Second Auto-Hero Carousel Switcher (with pause on hover)
  useEffect(() => {
    if (isHeroPaused) return;
    const heroTimer = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);

    return () => clearInterval(heroTimer);
  }, [isHeroPaused]);

  const activeTheme = PREVIEW_THEMES[currentThemeIndex];
  const currentHeroSlide = HERO_SLIDES[heroSlideIndex];

  function handleClaim(un: string) {
    const trimmed = un.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (trimmed) {
      router.push(`/login?claim=${trimmed}`);
    } else {
      router.push("/login");
    }
  }

  const scrollToPreview = () => {
    const el = document.getElementById("live-preview");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (checkingAuth && isLoggedIn) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#803D63] border-t-transparent" />
          <p className="text-xs font-medium text-[#4B5563]">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-[#F6EBF1]/60 via-slate-50 to-white text-[#111827] flex flex-col font-sans selection:bg-purple-100 selection:text-[#803D63] overflow-x-hidden">
      {/* Ambient Maroon Background Glow Orbs */}
      <div className="pointer-events-none fixed -top-24 -left-20 h-96 w-96 rounded-full bg-[#803D63]/10 blur-3xl z-0" />
      <div className="pointer-events-none fixed top-1/3 -right-20 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl z-0" />
      <div className="pointer-events-none fixed bottom-1/4 -left-20 h-96 w-96 rounded-full bg-[#803D63]/5 blur-3xl z-0" />

      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[#E8DCE4]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          {/* Left: Inflixo Logo */}
          <Logo size="md" />

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-[#4B5563] hover:text-[#111827] px-3 py-1.5 transition-colors"
            >
              Log In
            </Link>
            <button
              type="button"
              onClick={() => handleClaim("")}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#803D63] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#6D3254] transition-colors cursor-pointer shadow-xs"
            >
              <span>Claim Handle</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative z-10 bg-transparent pt-8 pb-16 sm:pt-14 sm:pb-20 border-b border-[#E8DCE4]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6">
          {/* HERO CAROUSEL CONTAINER */}
          <div
            className="relative max-w-4xl mx-auto space-y-4"
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
          >
            {/* Header Badge & Navigation Controls */}
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-xs font-bold text-[#803D63] shadow-2xs transition-all">
                <Sparkles className="h-3.5 w-3.5 text-[#803D63]" />
                <span>{currentHeroSlide.tag}</span>
              </div>

              {/* Navigation Controls */}
              <div className="inline-flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-full px-2 py-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setHeroSlideIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
                  className="p-1 rounded-full hover:bg-purple-50 hover:text-[#803D63] text-slate-500 transition-colors cursor-pointer"
                  title="Previous slide"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-700 select-none px-1">
                  {heroSlideIndex + 1}/{HERO_SLIDES.length}
                </span>
                <button
                  type="button"
                  onClick={() => setHeroSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length)}
                  className="p-1 rounded-full hover:bg-purple-50 hover:text-[#803D63] text-slate-500 transition-colors cursor-pointer"
                  title="Next slide"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Sliding Track for Headline & Subheadline */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ transform: `translateX(-${heroSlideIndex * 100}%)` }}
              >
                {HERO_SLIDES.map((slide, idx) => (
                  <div
                    key={idx}
                    className="w-full shrink-0 min-h-[140px] sm:min-h-[160px] flex flex-col items-center justify-start space-y-3 px-2"
                  >
                    <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-[#111827] max-w-4xl mx-auto">
                      {slide.heading}
                    </h1>

                    <p className="text-base sm:text-xl font-medium text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
                      {slide.subheading}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dot / Progress Indicators */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {HERO_SLIDES.map((slide, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setHeroSlideIndex(idx)}
                  title={slide.tag}
                  className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                    idx === heroSlideIndex
                      ? "w-8 bg-[#803D63]"
                      : "w-2 bg-slate-300 hover:bg-purple-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Interactive Handle Claim & CTA Form */}
          <div className="max-w-md mx-auto space-y-4 pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleClaim(username);
              }}
              className="flex items-center rounded-2xl border-2 border-purple-200 bg-white p-1.5 focus-within:border-[#803D63] focus-within:ring-4 focus-within:ring-[#803D63]/10 transition-all shadow-sm"
            >
              <span className="pl-3.5 text-xs sm:text-sm font-bold text-[#803D63] select-none shrink-0">
                inflixo.com/
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname (e.g. techburners)"
                className="w-full bg-transparent px-2 py-2.5 text-xs sm:text-sm font-bold text-[#111827] outline-none placeholder:text-[#9CA3AF] placeholder:font-normal min-w-0"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-[#803D63] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#6D3254] transition-colors cursor-pointer shadow-sm"
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3 text-sm font-bold text-white transition-all shadow-md cursor-pointer tap-scale"
              >
                <Sparkles className="h-4 w-4" />
                <span>Create My Free Profile</span>
              </button>
              <button
                type="button"
                onClick={scrollToPreview}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 transition-all shadow-xs cursor-pointer"
              >
                <Eye className="h-4 w-4 text-[#803D63]" />
                <span>View Live Preview</span>
              </button>
            </div>

            {/* Short Trust Points */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#4B5563] pt-2">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> Free to start
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> Setup in 60 seconds
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> Your own Inflixo link
              </span>
            </div>
          </div>

          {/* Visual Feature Summary Pill Strip */}
          <div className="pt-6 max-w-3xl mx-auto">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Included In Every Creator Profile
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {[
                { label: "Total Fanbase", icon: Users },
                { label: "Social Stats", icon: TrendingUp },
                { label: "Series & Parts", icon: Tv },
                { label: "Custom Links", icon: Link2 },
                { label: "Collab Gigs", icon: Briefcase },
                { label: "Client Reviews", icon: Star },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-purple-200/80 px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:border-[#803D63] transition-all"
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

      {/* 3. LIVE CREATOR PREVIEW SECTION (PRESERVED TONY STARK PROFILE) */}
      <section id="live-preview" className="py-16 sm:py-24 bg-[#F9FAFB] border-b border-[#E5E7EB] scroll-mt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <span className="inline-block rounded-full bg-purple-50 text-[#803D63] border border-purple-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
              Interactive Live Preview
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111827]">
              See everything about a creator on one profile.
            </h2>
            <p className="text-base sm:text-lg font-medium text-[#4B5563] leading-relaxed">
              Followers, social accounts, content series, collaboration services and reviews—presented in one professional place.
            </p>
          </div>

          {/* Interactive Live Preview Component Wrapper */}
          <div className="flex justify-center">
            <div className="w-full max-w-[540px] rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 relative transition-all duration-700 space-y-3 shadow-xl">
              {/* Browser Header Bar */}
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
                  <span>inflixo.com/{username ? username.toLowerCase().replace(/[^a-z0-9_]/g, "") : "tonystark"}</span>
                </div>
              </div>

              {/* Exact Live Preview Card Component */}
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

              {/* CTA Button Below Preview */}
              <button
                type="button"
                onClick={() => handleClaim(username)}
                className="w-full tap-scale py-3.5 px-4 rounded-xl bg-[#803D63] hover:bg-[#6D3254] text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Claim @{username.trim() || "yourname"} Profile Before Someone Else Does</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE INTRODUCTION */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-4">
          <span className="inline-block rounded-full bg-purple-50 text-[#803D63] border border-purple-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
            Creator Features
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#111827] leading-tight">
            Everything you need to show your value as a creator.
          </h2>
          <p className="text-base sm:text-xl font-medium text-[#4B5563] leading-relaxed max-w-3xl mx-auto">
            Inflixo brings your audience, content and professional work together, so fans and brands can understand who you are without opening multiple links.
          </p>
        </div>
      </section>

      {/* 5. 6 DETAILED FEATURE SECTIONS (ALTERNATING LAYOUT) */}

      {/* FEATURE 1: TOTAL FANBASE */}
      <section className="py-16 sm:py-24 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="inline-block rounded-full bg-purple-100 text-[#803D63] border border-purple-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Feature 01 • Total Fanbase
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#111827] leading-tight">
                Show your complete fanbase.
              </h3>
              <p className="text-sm sm:text-base text-rose-700 bg-rose-50 border border-rose-200/60 p-3 rounded-xl font-semibold leading-relaxed">
                <strong>The Problem:</strong> Your followers are spread across Instagram, YouTube and Facebook. Showing only one platform makes your total reach look smaller.
              </p>
              <p className="text-base sm:text-lg font-medium text-[#4B5563] leading-relaxed">
                Inflixo combines your connected platforms into one easy-to-understand Total Fanbase.
              </p>

              {/* Highlight Formula Pill */}
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-3.5 text-center font-display font-extrabold text-sm sm:text-base text-[#803D63]">
                Instagram + YouTube + Facebook = Total Fanbase
              </div>

              {/* Benefits List */}
              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#111827]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Show your complete audience reach</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Make a stronger impression on brands</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Share one live number instead of multiple screenshots</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Show My Total Fanbase</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Visual UI Mockup (Matches Actual Profile Total Fanbase Card) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg space-y-4 hover-lift">
                {/* Creator Header Strip */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={DEMO_PROFILE.photoDataUrl || ""}
                      alt={DEMO_PROFILE.displayName}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-[#803D63]/20"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">{DEMO_PROFILE.displayName}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-[#803D63] border border-purple-200">
                          {DEMO_PROFILE.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">@{DEMO_PROFILE.username}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Verified
                  </span>
                </div>

                {/* Exact Profile Total Fanbase Card */}
                <div className="rounded-2xl p-5 text-center w-full space-y-1 bg-[#F8FAFC] border border-[#E5E7EB] shadow-2xs">
                  <p className="text-3xl sm:text-4xl font-black tabular-nums text-[#111827]">
                    ❤️ 20.5M
                  </p>
                  <p className="text-[11px] font-bold tracking-wider uppercase text-[#803D63]">
                    TOTAL FANBASE
                  </p>
                  <p className="text-[11px] font-semibold text-slate-400">
                    Combined reach across Instagram, YouTube &amp; Facebook
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 2: MULTIPLE SOCIAL ACCOUNTS */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Visual UI Mockup (Matches Actual Profile Social Cards) */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-[#F9FAFB] p-5 shadow-lg space-y-2.5 hover-lift">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Connected Creator Profiles
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    3 Connected
                  </span>
                </div>

                {/* Account Card 1 */}
                <div className="rounded-xl border border-white/60 bg-white/80 p-3.5 flex items-center justify-between shadow-2xs hover:border-[#803D63] transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-50 border border-pink-100">
                      <InstagramIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 text-left space-y-0.5">
                      <p className="truncate text-xs font-bold text-slate-900">Instagram</p>
                      <p className="truncate text-xs font-medium text-[#4B5563]">@tonystark</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold tabular-nums text-slate-900">4.8M</span>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Account Card 2 */}
                <div className="rounded-xl border border-white/60 bg-white/80 p-3.5 flex items-center justify-between shadow-2xs hover:border-[#803D63] transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 border border-red-100">
                      <YoutubeIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 text-left space-y-0.5">
                      <p className="truncate text-xs font-bold text-slate-900">YouTube</p>
                      <p className="truncate text-xs font-medium text-[#4B5563]">@tonystark</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold tabular-nums text-slate-900">12.5M</span>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Account Card 3 */}
                <div className="rounded-xl border border-white/60 bg-white/80 p-3.5 flex items-center justify-between shadow-2xs hover:border-[#803D63] transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                      <FacebookIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 text-left space-y-0.5">
                      <p className="truncate text-xs font-bold text-slate-900">Facebook</p>
                      <p className="truncate text-xs font-medium text-[#4B5563]">@tonystark</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold tabular-nums text-slate-900">3.2M</span>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Copy (Order 1 on mobile, 2 on desktop) */}
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              <span className="inline-block rounded-full bg-purple-100 text-[#803D63] border border-purple-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Feature 02 • Multiple Social Accounts
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#111827] leading-tight">
                All your social accounts in one place.
              </h3>
              <p className="text-sm sm:text-base text-rose-700 bg-rose-50 border border-rose-200/60 p-3 rounded-xl font-semibold leading-relaxed">
                <strong>The Problem:</strong> Fans and brands should not have to open multiple links to find your profiles and understand your audience.
              </p>
              <p className="text-base sm:text-lg font-medium text-[#4B5563] leading-relaxed">
                Display your Instagram, YouTube and Facebook accounts with their usernames, profile links and audience numbers on one profile.
              </p>

              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#111827]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Connect multiple social accounts</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Display individual platform statistics</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Let visitors open any account directly</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Keep your complete social presence organized</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Connect My Accounts</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 3: SERIES AND PARTS */}
      <section className="py-16 sm:py-24 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="inline-block rounded-full bg-purple-100 text-[#803D63] border border-purple-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Feature 03 • Series &amp; Parts
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#111827] leading-tight">
                Keep every part of your content in order.
              </h3>
              <p className="text-sm sm:text-base text-rose-700 bg-rose-50 border border-rose-200/60 p-3 rounded-xl font-semibold leading-relaxed">
                <strong>The Problem:</strong> Part 1, Part 2 and Part 3 often get separated inside social feeds. Your audience should not have to search for the next episode.
              </p>
              <p className="text-base sm:text-lg font-medium text-[#4B5563] leading-relaxed">
                Create a series on Inflixo and arrange every episode in the correct order—even when the parts are posted on different platforms.
              </p>

              <div className="rounded-xl bg-purple-50 border border-purple-200 p-3.5 font-display font-extrabold text-sm sm:text-base text-[#803D63] text-center">
                Every episode in order. One page for your complete series.
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#111827]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Create multiple content series</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Add episodes from Instagram, YouTube or Facebook</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Arrange parts in the correct order</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Help viewers find and watch the next episode</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Share one link for the complete series</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Create My First Series</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Visual UI Mockup (Matches Actual Profile PreviewSeriesItem) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/85 p-4 sm:p-5 text-slate-900 shadow-lg space-y-3.5 text-left hover-lift">
                {/* 1. Header: Title, Subtitle, Description & Share Button */}
                <div className="flex items-start justify-between gap-3 text-left">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h3 className="text-base sm:text-lg font-extrabold leading-tight break-words text-slate-900">
                      Iron Tech Series
                    </h3>
                    <p className="text-xs font-semibold text-slate-500">
                      Technology • 4 Episodes
                    </p>
                    <p className="text-xs font-medium leading-relaxed text-slate-600 pt-1">
                      4-part tech breakdown of Arc Reactor &amp; J.A.R.V.I.S
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-2xs shrink-0">
                    <Share2 className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* 2. Interactive Toggle Button */}
                <div className="flex w-full items-center justify-center gap-2 rounded-xl py-2 px-4 text-xs font-extrabold border bg-[#F6EBF1] border-[#E8DCE4] text-[#803D63] shadow-2xs">
                  <span>View All 4 Episodes ↓</span>
                </div>

                {/* 3. Expanded Episodes List */}
                <div className="space-y-1.5 pt-1">
                  {[
                    { num: "01", title: "Part 01: Arc Reactor Tech", platform: "YouTube" },
                    { num: "02", title: "Part 02: Building Mark I", platform: "YouTube" },
                    { num: "03", title: "Part 03: J.A.R.V.I.S AI System", platform: "YouTube" },
                    { num: "04", title: "Part 04: Nanotech Flight Test", platform: "YouTube" },
                  ].map((ep) => (
                    <div
                      key={ep.num}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2 text-xs border border-slate-200/70 bg-slate-50/80 text-slate-900"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#803D63]/10 text-[#803D63] shrink-0">
                        <Play className="h-3 w-3 fill-current ml-0.5" />
                      </div>
                      <span className="font-extrabold text-xs text-[#803D63] shrink-0 min-w-[52px]">
                        Part {ep.num}
                      </span>
                      <span className="font-semibold text-xs text-slate-800 truncate flex-1">
                        {ep.title}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#803D63] opacity-60 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 4: CUSTOM LINKS */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Visual Mockup (Matches Actual Profile Custom Links) */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-[#F9FAFB] p-5 shadow-lg space-y-2.5 hover-lift">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Creator Custom Links</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    3 Links Active
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 w-full">
                  {/* Custom Link 1 */}
                  <div className="rounded-xl p-3 text-xs font-bold flex items-center justify-between shadow-2xs border bg-white/80 border-slate-200 hover:border-[#803D63] text-slate-900 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#803D63]/10 text-[#803D63]">
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">Official Merch Store</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Custom Link 2 */}
                  <div className="rounded-xl p-3 text-xs font-bold flex items-center justify-between shadow-2xs border bg-white/80 border-slate-200 hover:border-[#803D63] text-slate-900 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#803D63]/10 text-[#803D63]">
                        <Users className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">Stark Discord Community</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </div>

                  {/* Custom Link 3 */}
                  <div className="rounded-xl p-3 text-xs font-bold flex items-center justify-between shadow-2xs border bg-white/80 border-slate-200 hover:border-[#803D63] text-slate-900 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#803D63]/10 text-[#803D63]">
                        <Zap className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">AI Robotics Masterclass</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              <span className="inline-block rounded-full bg-purple-100 text-[#803D63] border border-purple-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Feature 04 • Custom Links
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#111827] leading-tight">
                Keep your important links easy to find.
              </h3>
              <p className="text-sm sm:text-base text-rose-700 bg-rose-50 border border-rose-200/60 p-3 rounded-xl font-semibold leading-relaxed">
                <strong>The Problem:</strong> Your website, store, portfolio, community, course and latest project can get lost inside a crowded social-media bio.
              </p>
              <p className="text-base sm:text-lg font-medium text-[#4B5563] leading-relaxed">
                Add all your important links to your Inflixo profile and control what your audience sees.
              </p>

              <div className="rounded-xl bg-purple-50 border border-purple-200 p-3.5 font-display font-extrabold text-sm sm:text-base text-[#803D63] text-center">
                All your important links. One creator profile.
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#111827]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Add website and portfolio links</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Promote products, courses and communities</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Highlight a current campaign</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Update links without changing your Inflixo URL</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Control which links are publicly visible</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Add My Links</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 5: COLLAB GIGS AND RATE CARDS */}
      <section className="py-16 sm:py-24 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="inline-block rounded-full bg-purple-100 text-[#803D63] border border-purple-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Feature 05 • Collab Gigs &amp; Rate Cards
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#111827] leading-tight">
                Show brands how they can work with you.
              </h3>
              <p className="text-sm sm:text-base text-rose-700 bg-rose-50 border border-rose-200/60 p-3 rounded-xl font-semibold leading-relaxed">
                <strong>The Problem:</strong> Repeating your prices and collaboration details in every DM wastes time and can make your creator business look unorganized.
              </p>
              <p className="text-base sm:text-lg font-medium text-[#4B5563] leading-relaxed">
                Create collaboration gigs for Reels, Stories, YouTube videos, promotions and campaign packages. Add your price, deliverables and turnaround time.
              </p>

              <div className="rounded-xl bg-purple-50 border border-purple-200 p-3.5 font-display font-extrabold text-sm sm:text-base text-[#803D63] text-center">
                Your services. Your rates. Your rules.
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#111827]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>List your collaboration services</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Set your own prices</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Add delivery time and package details</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Let brands understand your offer before contacting you</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Receive direct WhatsApp or email enquiries</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Zero commission on direct deals</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Create My Collab Gig</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Visual UI Mockup (Matches Actual Profile Gigs Card) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/80 p-4 space-y-3 transition-all text-left shadow-lg hover-lift">
                {/* Header Row: Platform Pill + Badge + Price */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4]">
                      Instagram
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                      ⭐ MOST POPULAR
                    </span>
                  </div>
                  <span className="font-display text-base font-extrabold text-[#803D63]">
                    ₹25,000
                  </span>
                </div>

                {/* Title & Turnaround */}
                <div>
                  <h5 className="font-bold text-sm text-slate-900">
                    1x High-Engagement Dedicated Reel + Bio Link
                  </h5>
                  <p className="text-[11px] font-medium mt-0.5 flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3 shrink-0" /> Turnaround: 3 Days
                  </p>
                </div>

                {/* Deliverables List */}
                <ul className="text-xs space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">30–60s 4K Dedicated Reel with Brand Co-Author tag</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">Direct Promo Link pinned in bio for 48 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">Full raw footage &amp; 30-day analytics report</span>
                  </li>
                </ul>

                {/* Direct Contact Actions */}
                <div className="pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-2xs">
                    <MessageCircle className="h-3.5 w-3.5 fill-white" />
                    <span>Book WhatsApp</span>
                  </div>
                  <div className="bg-slate-900 text-white text-xs font-bold py-2 px-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-2xs">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email Brief</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 6: CLIENT REVIEWS */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Visual Mockup (Matches Actual Profile Reviews Tab) */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-[#F9FAFB] p-4 sm:p-5 shadow-lg space-y-3 text-left hover-lift">
                {/* Summary Header */}
                <div className="rounded-2xl p-3.5 border border-[#E8DCE4] bg-[#F6EBF1] text-slate-900 text-left flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 text-sm">⭐</span>
                      <span className="font-extrabold text-sm text-slate-900">5.0</span>
                      <span className="text-slate-400 font-bold text-xs">·</span>
                      <span className="font-bold text-xs text-slate-700">18 Collaborations</span>
                    </div>
                    <p className="text-[11px] font-semibold mt-0.5 text-[#803D63]">
                      <strong>Highly rated for:</strong> Content Quality · Professionalism
                    </p>
                  </div>
                </div>

                {/* Individual Review Card */}
                <div className="rounded-2xl p-4 space-y-2.5 transition-all text-left border border-slate-200/80 bg-white/90 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-[#F6EBF1] text-[#803D63] border-[#E8DCE4] truncate">
                        CultFit Campaign
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200">
                        Work ↗
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-medium italic leading-relaxed text-slate-700">
                    &ldquo;Tony delivered our campaign in record time with 3.4x ROI on app installs. Incredible creator professionalism and authentic audience trust!&rdquo;
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-200/30">
                    <div className="min-w-0 flex-1 truncate pr-2">
                      <span className="font-extrabold text-slate-900">Priya Sharma</span>
                      <span className="ml-1 font-medium text-slate-500">• Brand Marketing Lead, CultFit</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Verified Collaboration
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              <span className="inline-block rounded-full bg-purple-100 text-[#803D63] border border-purple-200 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Feature 06 • Client Reviews
              </span>
              <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-[#111827] leading-tight">
                Turn happy clients into visible trust.
              </h3>
              <p className="text-sm sm:text-base text-rose-700 bg-rose-50 border border-rose-200/60 p-3 rounded-xl font-semibold leading-relaxed">
                <strong>The Problem:</strong> Your best client feedback is usually hidden inside WhatsApp messages, emails and DMs.
              </p>
              <p className="text-base sm:text-lg font-medium text-[#4B5563] leading-relaxed">
                Request genuine reviews from clients and display approved feedback directly on your Inflixo profile.
              </p>

              <div className="rounded-xl bg-purple-50 border border-purple-200 p-3.5 font-display font-extrabold text-sm sm:text-base text-[#803D63] text-center">
                Your best feedback should not stay hidden in chats.
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#111827]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Send review requests to clients</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Collect ratings and written feedback</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Showcase successful collaborations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Control which reviews appear publicly</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <span>Build trust before a brand contacts you</span>
                </li>
              </ul>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-xs cursor-pointer"
                >
                  <span>Collect My First Review</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MEDIA KIT SECTION */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#F9FAFB] to-white border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="inline-block rounded-full bg-purple-50 text-[#803D63] border border-purple-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
              Complete Solution
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#111827] leading-tight">
              Your Inflixo profile is your live creator media kit.
            </h2>
            <p className="text-base sm:text-lg font-medium text-[#4B5563] leading-relaxed">
              Stop sending scattered links, screenshots and repeated rate messages. Share one profile containing everything a brand needs to understand and contact you.
            </p>
            <div className="font-display font-extrabold text-base sm:text-lg text-[#803D63] pt-1">
              &ldquo;Everything a brand needs to know about you—on one link.&rdquo;
            </div>
          </div>

          {/* Included Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { title: "Total Fanbase", desc: "Cross-platform audience combined into one number", icon: Users },
              { title: "Social Stats", desc: "Individual platform metrics for IG, YT & FB", icon: TrendingUp },
              { title: "Series & Episodes", desc: "Ordered content playlists across platforms", icon: Tv },
              { title: "Custom Links", desc: "Store, portfolio, course and priority links", icon: Link2 },
              { title: "Collab Gigs & Rates", desc: "Clear deliverables, prices and timelines", icon: Briefcase },
              { title: "Client Reviews", desc: "Authentic testimonials and star ratings", icon: Star },
              { title: "Direct Contact", desc: "1-tap WhatsApp and Email brand inquiries", icon: MessageCircle },
              { title: "Zero Commission", desc: "Direct brand deals without intermediary fees", icon: ShieldCheck },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2 hover-lift transition-all">
                  <div className="h-8 w-8 rounded-xl bg-purple-50 text-[#803D63] flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => handleClaim("")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-8 py-3.5 text-sm sm:text-base font-bold text-white transition-all shadow-md cursor-pointer tap-scale"
            >
              <Sparkles className="h-4 w-4" />
              <span>Build My Creator Profile</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS SECTION */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-12">
          <div className="space-y-3 max-w-2xl mx-auto">
            <span className="inline-block rounded-full bg-purple-50 text-[#803D63] border border-purple-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
              Quick Setup
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111827]">
              Create your Inflixo profile in minutes.
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              Start with your personal link: <strong className="text-[#803D63]">inflixo.com/yourname</strong>
            </p>
          </div>

          {/* 3 Step Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl border border-slate-200 bg-[#F9FAFB] space-y-4 relative shadow-2xs hover-lift">
              <div className="h-10 w-10 rounded-xl bg-[#803D63] text-white flex items-center justify-center font-display font-black text-base shadow-xs">
                01
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-slate-900">Claim Your Handle</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Choose your personal Inflixo profile link.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-[#F9FAFB] space-y-4 relative shadow-2xs hover-lift">
              <div className="h-10 w-10 rounded-xl bg-[#803D63] text-white flex items-center justify-center font-display font-black text-base shadow-xs">
                02
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-slate-900">Add Your Creator Details</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                      Connect your accounts and add content, links, gigs and reviews.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-[#F9FAFB] space-y-4 relative shadow-2xs hover-lift">
              <div className="h-10 w-10 rounded-xl bg-[#803D63] text-white flex items-center justify-center font-display font-black text-base shadow-xs">
                03
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-slate-900">Share One Link</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  Let fans and brands discover your complete creator profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LIVE CREATOR PREVIEW SECTION (PRESERVED TONY STARK PROFILE) */}
      <section id="live-preview" className="py-16 sm:py-24 bg-[#F6EBF1]/35 border-b border-[#E8DCE4] scroll-mt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <span className="inline-block rounded-full bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
              Interactive Live Preview
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111827]">
              See everything about a creator on one profile.
            </h2>
            <p className="text-base sm:text-lg font-medium text-[#4B5563] leading-relaxed">
              Followers, social accounts, content series, collaboration services and reviews—presented in one professional place.
            </p>
          </div>

          {/* Interactive Live Preview Component Wrapper */}
          <div className="flex justify-center">
            <div className="w-full max-w-[540px] rounded-3xl border border-[#E8DCE4] bg-white p-3 sm:p-4 relative transition-all duration-700 space-y-3 shadow-2xl shadow-[#803D63]/5">
              {/* Browser Header Bar */}
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
                  <span>inflixo.com/{username ? username.toLowerCase().replace(/[^a-z0-9_]/g, "") : "tonystark"}</span>
                </div>
              </div>

              {/* Exact Live Preview Card Component */}
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

              {/* CTA Button Below Preview */}
              <button
                type="button"
                onClick={() => handleClaim(username)}
                className="w-full tap-scale py-3.5 px-4 rounded-2xl bg-[#803D63] hover:bg-[#6D3254] text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Claim @{username.trim() || "yourname"} Profile Before Someone Else Does</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURE INTRODUCTION */}
      <section className="py-16 sm:py-20 bg-white/70 border-b border-[#E8DCE4]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-4">
          <span className="inline-block rounded-full bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
            Creator Features
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#111827] leading-tight">
            Everything you need to show your value as a creator.
          </h2>
          <p className="text-base sm:text-xl font-medium text-[#4B5563] leading-relaxed max-w-3xl mx-auto">
            Inflixo brings your audience, content and professional work together, so fans and brands can understand who you are without opening multiple links.
          </p>
        </div>
      </section>

      {/* 5. 6 DETAILED FEATURE SECTIONS (ALTERNATING LAYOUT) */}

      {/* FEATURE 1: TOTAL FANBASE */}
      <section className="py-16 sm:py-24 bg-[#F6EBF1]/35 border-b border-[#E8DCE4]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E8DCE4] bg-[#F6EBF1] px-3 py-1 text-xs font-bold text-[#803D63]">
                <Users className="h-3.5 w-3.5 text-[#803D63]" />
                <span>Feature 01: Total Fanbase Reach</span>
              </div>
              <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111827] leading-tight">
                One clear number for your total combined reach.
              </h3>
              <p className="text-base text-[#4B5563] font-medium leading-relaxed">
                Connect your Instagram, YouTube and Facebook accounts. Inflixo calculates your total verified fanbase reach automatically in real time.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#803D63] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">Live Social Sync</h4>
                    <p className="text-xs text-[#4B5563] font-medium">Auto-syncs follower counts from connected platforms.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#803D63] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">Direct Platform Badges</h4>
                    <p className="text-xs text-[#4B5563] font-medium">Clickable links that take followers directly to each of your social channels.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#803D63] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">Sponsor-Ready Credibility</h4>
                    <p className="text-xs text-[#4B5563] font-medium">Gives brands a single verified audience metric for sponsorship conversations.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-[440px] rounded-3xl border border-[#E8DCE4] bg-white p-6 sm:p-8 space-y-6 shadow-2xl shadow-[#803D63]/5">
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#803D63]">Total Combined Audience</p>
                  <p className="font-display text-4xl sm:text-5xl font-black text-[#111827]">20,500,000</p>
                  <p className="text-xs font-medium text-slate-500">Across 3 verified platforms</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-pink-50/60 to-purple-50/60 border border-pink-200/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E1306C] text-white">
                        <InstagramIcon className="h-5 w-5 fill-current" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Instagram</p>
                        <p className="text-[11px] font-medium text-slate-500">@tonystark</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-slate-900">4,800,000</p>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-red-50/60 to-orange-50/60 border border-red-200/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF0000] text-white">
                        <YoutubeIcon className="h-5 w-5 fill-current" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">YouTube</p>
                        <p className="text-[11px] font-medium text-slate-500">Stark Tech Vlogs</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-slate-900">12,500,000</p>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-200/80">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877F2] text-white">
                        <FacebookIcon className="h-5 w-5 fill-current" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Facebook</p>
                        <p className="text-[11px] font-medium text-slate-500">Tony Stark Official</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-slate-900">3,200,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PRICING SECTION */}
      <section className="py-16 sm:py-24 bg-[#F6EBF1]/35 border-b border-[#E8DCE4]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-8">
          <div className="space-y-3 max-w-2xl mx-auto">
            <span className="inline-block rounded-full bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
              Simple Plans
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111827]">
              Start free. Upgrade when you need more.
            </h2>
            <p className="text-base font-medium text-[#4B5563] leading-relaxed">
              Create your profile during Early Access and explore Inflixo before choosing a paid plan.
            </p>
          </div>

          <div className="text-left">
            <PricingTable showEarlyAccessBanner={false} />
          </div>
        </div>
      </section>

      {/* 9. SOCIAL PROOF / EARLY ACCESS SECTION */}
      <section className="py-14 sm:py-18 bg-white/70 border-b border-[#E8DCE4]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="rounded-3xl border border-[#E8DCE4] bg-white p-8 sm:p-12 text-[#111827] space-y-5 shadow-2xl shadow-[#803D63]/5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F6EBF1] border border-[#E8DCE4] px-3.5 py-1 text-xs font-bold text-[#803D63]">
              <Sparkles className="h-3.5 w-3.5 text-[#803D63]" />
              <span>India&apos;s Creator Community</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#111827] leading-tight">
              Built for India&apos;s next generation of content creators.
            </h2>
            <p className="text-base sm:text-lg text-[#4B5563] font-medium leading-relaxed max-w-xl mx-auto">
              Join Inflixo during Early Access, claim your creator handle and help shape a platform designed around your real needs.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleClaim("")}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3.5 text-sm font-bold text-white transition-all shadow-md cursor-pointer tap-scale"
              >
                <span>Join Early Access Free</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA SECTION */}
      <section className="py-16 sm:py-24 bg-[#F6EBF1]/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-3xl border border-[#E8DCE4] bg-white p-8 sm:p-14 text-center space-y-6 shadow-2xl shadow-[#803D63]/5">
            <div className="space-y-3">
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#111827] leading-tight">
                You&apos;re building more than followers. You&apos;re building your creator identity.
              </h2>
              <p className="text-base sm:text-lg font-medium text-[#4B5563] max-w-2xl mx-auto leading-relaxed">
                Bring your audience, content, links, collaborations and reviews together on one professional profile.
              </p>
              <p className="font-display font-extrabold text-sm sm:text-base text-[#803D63] pt-1">
                Your fanbase. Your content. Your work. One Inflixo link.
              </p>
            </div>

            {/* Bottom Claim Input Form */}
            <div className="max-w-md mx-auto space-y-3 pt-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClaim(bottomUsername);
                }}
                className="flex items-center rounded-2xl border-2 border-[#E8DCE4] bg-white p-1.5 focus-within:border-[#803D63] focus-within:ring-4 focus-within:ring-[#803D63]/10 transition-all shadow-xs"
              >
                <span className="pl-3.5 text-xs sm:text-sm font-bold text-[#803D63] select-none shrink-0">
                  inflixo.com/
                </span>
                <input
                  type="text"
                  value={bottomUsername}
                  onChange={(e) => setBottomUsername(e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-transparent px-2 py-2.5 text-xs sm:text-sm font-bold text-[#111827] outline-none placeholder:text-[#9CA3AF] placeholder:font-normal min-w-0"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-xl bg-[#803D63] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#6D3254] transition-colors cursor-pointer shadow-xs"
                >
                  <span>Claim</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim(bottomUsername)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3.5 text-sm font-bold text-white transition-all shadow-md cursor-pointer tap-scale"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Create My Free Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleClaim(bottomUsername)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F6EBF1] hover:bg-[#ECD3E2] border border-[#E8DCE4] px-6 py-3.5 text-sm font-bold text-[#803D63] transition-all shadow-xs cursor-pointer"
                >
                  <span>Claim My Handle</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[#E8DCE4] bg-white/80 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#4B5563]">
          <Logo size="sm" />
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/" className="hover:text-[#111827] transition-colors">
              Creator Home
            </Link>
            <Link href="/privacy" className="hover:text-[#111827] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#111827] transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="text-[#9CA3AF]">Built by TrustIQ Labs PVT LTD &copy; 2026 Inflixo</p>
        </div>
      </footer>
    </div>
  );
}
