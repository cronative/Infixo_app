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
  ChevronRight,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { AuthService } from "@/services/AuthService";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { CreatorProfile, SocialAccounts, Series, ThemeKey } from "@/types";

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

const PREVIEW_THEMES: { key: ThemeKey; name: string }[] = [
  { key: "minimal-white", name: "Soft Minimal" },
  { key: "modern-purple", name: "Electric Purple" },
  { key: "midnight", name: "Midnight Dark" },
  { key: "cyberpunk", name: "Cyberpunk Neon" },
  { key: "emerald-luxe", name: "Emerald Luxe" },
  { key: "ocean-blue", name: "Ocean Blue" },
];

export default function LandingHomePage() {
  const router = useRouter();
  const isLoggedIn = AuthService.isLoggedIn();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [bottomUsername, setBottomUsername] = useState("");
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);

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

  const activeTheme = PREVIEW_THEMES[currentThemeIndex];

  function handleClaim(un: string) {
    const trimmed = un.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (trimmed) {
      router.push(`/login?claim=${trimmed}`);
    } else {
      router.push("/login");
    }
  }

  if (checkingAuth && isLoggedIn) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F9FAFB]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6366F1] border-t-transparent" />
          <p className="text-xs font-medium text-[#4B5563]">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#FFFFFF] text-[#111827] flex flex-col font-sans selection:bg-purple-100 selection:text-[#6366F1]">
      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#E5E7EB]">
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
              className="inline-flex items-center gap-1.5 rounded-full bg-[#6366F1] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#4F46E5] transition-colors cursor-pointer"
            >
              <span>Claim Handle</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="bg-[#F9FAFB] pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Hero Column: Hero Copy + Brand Outreach Block */}
            <div className="lg:col-span-6 space-y-6 text-left pt-1">
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-semibold text-[#6366F1]">
                <Sparkles className="h-3.5 w-3.5 text-[#6366F1]" />
                <span>🚀 Early Access for India&apos;s Top Creators</span>
              </div>

              {/* Heading */}
              <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-[#111827]">
                Your content is everywhere. Your creator identity shouldn&apos;t be scattered.
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg font-medium text-[#4B5563] leading-relaxed">
                Stop sending brands five different links and losing viewers between video parts. Unify your real fanbase across platforms and turn your uploads into bingeable OTT series—in one clean profile.
              </p>

              {/* Handle Claim Input */}
              <div className="space-y-3 pt-1">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleClaim(username);
                  }}
                  className="flex items-center rounded-xl border border-[#E5E7EB] bg-white p-1.5 focus-within:border-[#6366F1] focus-within:ring-1 focus-within:ring-[#6366F1] transition-all max-w-md"
                >
                  <span className="pl-3.5 text-xs sm:text-sm font-semibold text-[#9CA3AF] select-none shrink-0">
                    inflixo.com/
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourname"
                    className="w-full bg-transparent px-1 py-2 text-xs sm:text-sm font-bold text-[#111827] outline-none placeholder:text-[#9CA3AF] placeholder:font-normal min-w-0"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-[#6366F1] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#4F46E5] transition-colors cursor-pointer"
                  >
                    <span>Claim Handle</span>
                  </button>
                </form>

                {/* Micro-Trust Proof */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#4B5563] pt-1">
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> 100% Free Setup
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> Connects in 60s
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> No credit card needed
                  </span>
                </div>
              </div>

              {/* INTEGRATED BRAND OUTREACH & MEDIA KIT FEATURE BLOCK */}
              <div className="border-t border-[#E5E7EB] pt-8 mt-8 sm:mt-12 lg:mt-16 space-y-4">
                <span className="inline-block rounded-full bg-purple-50 text-[#6366F1] border border-purple-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                  Brand Outreach &amp; Media Kit
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] leading-tight">
                  Brands don&apos;t want 5 links. They want your true reach.
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#4B5563] leading-relaxed">
                  You have 400K subscribers on YouTube, 250K on Instagram, and 150K on Facebook. Sharing separate profiles under-reports your scale. Inflixo aggregates your verified accounts into a live <strong className="text-[#111827] font-bold">Total Fanbase Counter</strong> so brands see you as an <strong className="text-[#6366F1] font-bold">800K+ powerhouse</strong>.
                </p>

                <div className="space-y-2 pt-1 text-xs font-semibold text-[#111827]">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#6366F1] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#111827]">Automated Multi-Platform Sync:</strong> Real-time follower and subscriber tracking.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#6366F1] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#111827]">One-Click Media Kit:</strong> Send brands a single verified link instead of screenshots.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero: ORIGINAL LIVE PREVIEW CARD WITH AUTO THEME SWITCHER & WEBBROWSER FRAME */}
            <div className="lg:col-span-6 flex flex-col items-center justify-start w-full">
              <div className="w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-3 relative transition-all duration-700">
                {/* Sleek Browser Bar Header */}
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl mb-2.5 border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
                    <span className="text-emerald-500 font-extrabold">🔒</span>
                    <span>inflixo.com/tonystark</span>
                  </div>
                  <div className="text-[10px] font-bold text-[#6366F1] uppercase tracking-wider hidden sm:block">
                    {activeTheme.name}
                  </div>
                </div>

                {/* REAL LIVE PREVIEW CARD COMPONENT WITH DYNAMIC THEME */}
                <LivePreviewCard
                  profile={DEMO_PROFILE}
                  socials={DEMO_SOCIALS}
                  series={DEMO_SERIES}
                  totalAudience={20500000}
                  themeKey={activeTheme.key}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION 1 VISUAL: TOTAL FANBASE ENGINE AGGREGATOR CARD */}
      <section className="py-12 sm:py-16 bg-[#FFFFFF] border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <span className="inline-block rounded-full bg-purple-50 text-[#6366F1] border border-purple-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
              Real-Time Aggregator Engine
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              Unified Reach Across YouTube, Instagram &amp; Facebook
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[#4B5563]">
              Your verified audience metrics automatically aggregate into a sponsor-ready metric.
            </p>

            <div className="pt-4 flex justify-center">
              <div className="w-full max-w-lg rounded-xl border border-[#E5E7EB] bg-white p-5 space-y-3 text-left">
                {/* Total Reach Header */}
                <div className="flex items-center justify-between rounded-xl bg-[#6366F1] p-4 text-white">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200">Unified Metric</p>
                    <p className="text-xs font-medium text-purple-100">Total Fanbase</p>
                  </div>
                  <p className="font-display text-3xl font-bold text-white">800,000</p>
                </div>

                {/* Feeding Platform Rows */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white shrink-0">
                        <YoutubeIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#111827]">YouTube Channel</span>
                    </div>
                    <span className="text-xs font-bold text-[#111827]">400,000 Subscribers</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500 text-white shrink-0">
                        <InstagramIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#111827]">Instagram Handle</span>
                    </div>
                    <span className="text-xs font-bold text-[#111827]">250,000 Followers</span>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                        <FacebookIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#111827]">Facebook Page</span>
                    </div>
                    <span className="text-xs font-bold text-[#111827]">150,000 Followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION 2: OTT SERIES & EPISODE BUILDER */}
      <section className="py-16 sm:py-24 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Visual Asset: Series Card Mockup */}
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-[#111827] text-white p-5 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#6366F1] px-2.5 py-0.5 text-[10px] font-bold text-white">
                    Season 1 • 5 Episodes
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Filmmaking Series</span>
                </div>

                <div className="relative h-40 w-full overflow-hidden rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80"
                    alt="Travel Series"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6366F1] text-white"
                    >
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-display text-base font-bold text-white">Spiti Valley Expedition</h4>
                  <p className="text-xs text-slate-400">4-part docuseries on high-altitude road trips</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-300 font-medium">Auto-Numbered</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors"
                  >
                    Watch Ep 1 →
                  </button>
                </div>
              </div>
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-6 space-y-4 text-left order-1 lg:order-2">
              <span className="inline-block rounded-full bg-purple-50 text-[#6366F1] border border-purple-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                Zero Algorithm Drop-off
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111827] leading-tight">
                Don&apos;t let Episode 2 get buried in social feeds.
              </h2>
              <p className="text-sm sm:text-base font-medium text-[#4B5563] leading-relaxed">
                You spent weeks producing a 4-part travel series, finance course, or filmmaking vlog, but social feeds scatter your episodes. Inflixo lets you build structured, multi-season web series with custom posters and numbered episodes. Fans binge your content sequentially without switching apps.
              </p>

              <div className="space-y-2 pt-2 text-xs sm:text-sm font-semibold text-[#111827]">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#6366F1] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#111827]">Auto-Sequenced Episodes:</strong> Auto-numbered chapters with direct video embeds.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#6366F1] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#111827]">Cross-Platform Support:</strong> Combine YouTube videos, Reels, and Facebook content in one series.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 3: THE 2027 VISION & CREATOR COLLECTIVE */}
      <section className="py-16 sm:py-24 bg-[#FFFFFF] border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-8 sm:p-12 text-[#111827] space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3.5 py-1 text-xs font-bold text-[#6366F1]">
              <Sparkles className="h-3.5 w-3.5 text-[#6366F1]" />
              <span>Community &amp; Future Road</span>
            </div>

            <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#111827] leading-tight">
              The 10,000 Creator Mission • Summit 2027
            </h2>

            <p className="text-xs sm:text-sm text-[#4B5563] font-medium leading-relaxed max-w-2xl mx-auto">
              Inflixo is built to empower India&apos;s serious digital creators. We are selecting <strong className="text-[#111827] font-bold">10,000 genuine, professional creators</strong> across tech, filmmaking, comedy, travel, and education to build our core ecosystem.
              <br className="hidden sm:inline" />
              Every verified creator joining our early access cohort receives a foundational membership and a direct invitation to the <strong className="text-[#6366F1] font-bold">Inflixo Creator Summit 2027</strong>—a private, high-impact gathering uniting India&apos;s top creators, production houses, and global brand sponsors in one room.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleClaim("")}
                className="inline-flex items-center gap-2 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] px-7 py-3.5 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer"
              >
                <span>Join the 10K Creator Collective</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION 4: TRANSPARENT, CREATOR-FIRST PRICING */}
      <section className="py-16 sm:py-24 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-8">
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-block rounded-full bg-purple-50 text-[#6366F1] border border-purple-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
              Transparent Pricing
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111827]">
              Simple, Creator-First Plans
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#4B5563]">
              Start free during Early Access. Upgrade whenever you need unlimited OTT power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-stretch">
            {/* TIER 1: EARLY ACCESS FREE */}
            <div className="rounded-xl border-2 border-emerald-500 bg-white p-6 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-5 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-bold text-white">
                Active Free Tier
              </div>
              <div className="space-y-4">
                <div className="mt-1">
                  <h3 className="font-display text-lg font-bold text-[#111827]">Tier 1: Early Access</h3>
                  <p className="text-xs font-medium text-[#4B5563]">Essential Identity</p>
                </div>
                <div className="rounded-lg bg-[#F9FAFB] p-3 border border-[#E5E7EB]">
                  <p className="font-display text-3xl font-bold text-[#111827]">₹0</p>
                  <p className="text-xs font-medium text-[#4B5563]">/ Lifetime free</p>
                </div>
                <ul className="space-y-2 text-xs font-medium text-[#111827] pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Live Fanbase Counter (YT, IG, FB)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>1 Active OTT Web Series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Standard Profile Themes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Public inflixo.com/username</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="w-full rounded-lg bg-emerald-100 py-2.5 px-4 text-xs font-bold text-emerald-800 text-center cursor-pointer"
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* TIER 2: CREATOR PRO */}
            <div className="rounded-xl border-2 border-[#6366F1] bg-white p-6 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-5 rounded-full bg-[#6366F1] px-3 py-0.5 text-[11px] font-bold text-white">
                Most Popular
              </div>
              <div className="space-y-4">
                <div className="mt-1">
                  <h3 className="font-display text-lg font-bold text-[#111827]">Tier 2: Creator Pro</h3>
                  <p className="text-xs font-medium text-[#4B5563]">Serious Growth</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-3 border border-purple-100">
                  <p className="font-display text-3xl font-bold text-[#111827]">₹199</p>
                  <p className="text-xs font-medium text-[#4B5563]">/ month</p>
                </div>
                <ul className="space-y-2 text-xs font-medium text-[#111827] pt-2">
                  <li className="flex items-center gap-2 font-bold text-[#111827]">
                    <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0" />
                    <span>Unlimited Series &amp; Episodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0" />
                    <span>Fast 3-Hour Metrics Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0" />
                    <span>All 20+ Designer Card Themes</span>
                  </li>
                  <li className="flex items-center gap-2 font-bold text-[#6366F1]">
                    <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0" />
                    <span>Priority Invite: Summit 2027</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="w-full rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] py-2.5 px-4 text-xs font-bold text-white text-center transition-colors cursor-pointer"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>

            {/* TIER 3: STUDIO / AGENCY */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 flex flex-col justify-between relative hover:border-slate-300 transition-colors">
              <div className="absolute -top-3 left-5 rounded-full bg-slate-900 px-3 py-0.5 text-[11px] font-bold text-white">
                Best Value Annual
              </div>
              <div className="space-y-4">
                <div className="mt-1">
                  <h3 className="font-display text-lg font-bold text-[#111827]">Tier 3: Studio / Agency</h3>
                  <p className="text-xs font-medium text-[#4B5563]">Power Creators &amp; Teams</p>
                </div>
                <div className="rounded-lg bg-[#F9FAFB] p-3 border border-[#E5E7EB]">
                  <p className="font-display text-3xl font-bold text-[#111827]">₹1,999</p>
                  <p className="text-xs font-medium text-[#4B5563]">/ year</p>
                </div>
                <ul className="space-y-2 text-xs font-medium text-[#111827] pt-2">
                  <li className="flex items-center gap-2 font-bold text-[#111827]">
                    <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0" />
                    <span>Real-Time Instant Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0" />
                    <span>Custom Domain Support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0" />
                    <span>Priority Media Kit Analytics</span>
                  </li>
                  <li className="flex items-center gap-2 font-bold text-[#6366F1]">
                    <Check className="h-3.5 w-3.5 text-[#6366F1] shrink-0" />
                    <span>VIP Access: Summit 2027</span>
                  </li>
                </ul>
              </div>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleClaim("")}
                  className="w-full rounded-lg bg-[#111827] hover:bg-black py-2.5 px-4 text-xs font-bold text-white text-center transition-colors cursor-pointer"
                >
                  Get Annual VIP
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL BOTTOM CONVERSION BANNER */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-8 sm:p-12 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111827]">
                Ready to build your creator OTT hub?
              </h2>
              <p className="text-sm sm:text-base font-medium text-[#4B5563]">
                Join thousands of creators showcasing their total reach in one link.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-3 pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClaim(bottomUsername);
                }}
                className="flex items-center rounded-xl border border-[#E5E7EB] bg-white p-1.5 focus-within:border-[#6366F1] focus-within:ring-1 focus-within:ring-[#6366F1] transition-all"
              >
                <span className="pl-3.5 text-xs sm:text-sm font-semibold text-[#9CA3AF] select-none shrink-0">
                  inflixo.com/
                </span>
                <input
                  type="text"
                  value={bottomUsername}
                  onChange={(e) => setBottomUsername(e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-transparent px-1 py-2 text-xs sm:text-sm font-bold text-[#111827] outline-none placeholder:text-[#9CA3AF] placeholder:font-normal min-w-0"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-[#6366F1] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#4F46E5] transition-colors cursor-pointer"
                >
                  <span>Claim My Profile</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-[#E5E7EB] bg-[#FFFFFF] py-8">
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
          <p className="text-[#9CA3AF]">Built by TrustIQ Labs &copy; 2026 Inflixo</p>
        </div>
      </footer>
    </div>
  );
}
