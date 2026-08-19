"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  Play,
  Film,
  Check,
  Zap,
  Sparkle,
  ExternalLink,
  ChevronDown,
  Palette,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { AuthService } from "@/services/AuthService";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { PricingTable } from "@/components/subscription/PricingTable";
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

  const [username, setUsername] = useState("");
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
      <div className="flex min-h-dvh items-center justify-center bg-[#FAF8FF]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#651FFF] border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#FAF8FF] text-[#0F172A] flex flex-col font-sans selection:bg-purple-100 selection:text-[#651FFF] overflow-x-hidden relative">
      {/* GLOBAL FLOATING BACKGROUND ANIMATED GRADIENT ORBS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#651FFF]/15 via-purple-300/20 to-transparent blur-[90px] animate-orb-1" />
        <div className="absolute top-[35%] -left-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-200/40 via-[#651FFF]/10 to-transparent blur-[110px] animate-orb-2" />
        <div className="absolute bottom-10 -right-32 w-[550px] h-[550px] rounded-full bg-gradient-to-bl from-[#651FFF]/12 via-indigo-200/30 to-transparent blur-[100px] animate-orb-1" />
      </div>

      {/* 1. NAVBAR */}
      <header className="safe-top sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-purple-100/80 transition-all">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-8">
          <Logo size="md" />

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#total-fanbase" className="hover:text-[#651FFF] transition-colors">
              Total Fanbase
            </a>
            <a href="#series-solution" className="hover:text-[#651FFF] transition-colors">
              Series
            </a>
            <a href="#pricing" className="hover:text-[#651FFF] transition-colors">
              Pricing
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 rounded-full bg-[#651FFF] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-[#500CD6] hover:scale-105 transition-all cursor-pointer"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-[#0F172A] hover:text-[#651FFF] transition-colors"
                >
                  Log in
                </Link>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="inline-flex items-center gap-2 rounded-full bg-[#651FFF] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-600/20 hover:bg-[#500CD6] hover:scale-105 transition-all cursor-pointer"
                >
                  Create Your Free Page
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION — DYNAMIC 10-SECOND AUTO THEME SWITCHER */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-[#FAF8FF] z-10">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Main H1 Big Headline */}
              <h1 className="font-display text-[40px] sm:text-[58px] font-bold leading-[1.12] tracking-normal text-[#0F172A]">
                ARE YOU A CONTENT CREATOR?
              </h1>

              {/* Sub-header */}
              <p className="text-lg sm:text-[23px] font-semibold leading-relaxed tracking-normal text-[#651FFF]">
                Your content is everywhere. <br className="hidden sm:inline" />
                <span className="text-[#0F172A] italic font-normal">Your creator identity shouldn&apos;t be.</span>
              </p>

              {/* Single Clean Description */}
              <p className="text-base sm:text-lg font-medium text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Bring your <strong className="text-[#0F172A] font-bold">Total Fanbase</strong>, socials, and organized content <span className="italic font-bold text-[#651FFF]">Series</span> together into one simple page.
              </p>

              {/* Username Claim Input & Primary CTA */}
              <div className="max-w-md mx-auto lg:mx-0 space-y-2.5 pt-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleClaim(username);
                  }}
                  className="flex items-center rounded-full border-2 border-purple-200 bg-white p-1.5 shadow-xl shadow-purple-500/10 focus-within:border-[#651FFF] focus-within:ring-4 focus-within:ring-purple-100 transition-all"
                >
                  <span className="pl-4 text-sm font-semibold text-slate-400 select-none shrink-0">
                    inflixo.com/
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourname"
                    className="w-full bg-transparent px-1 py-2.5 text-sm sm:text-base font-semibold text-[#0F172A] focus:outline-none placeholder:text-slate-300 min-w-0"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 shrink-0 rounded-full bg-[#651FFF] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#500CD6] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Create Free Page</span>
                  </button>
                </form>

                <p className="text-xs font-semibold text-slate-500">
                  Free Early Access • Setup in 2 minutes
                </p>
              </div>

              {/* Advantages of Joining Inflixo */}
              <div className="pt-6 border-t border-purple-200/80 space-y-4 max-w-xl mx-auto lg:mx-0 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-[#651FFF]">
                  ✨ <span className="italic font-normal">ADVANTAGES OF JOINING</span> INFLIXO
                </p>

                <div className="flex flex-col space-y-3.5 w-full">
                  <div className="flex items-center gap-4 rounded-2xl bg-white border border-purple-100 p-4 shadow-xs hover:border-[#651FFF]/40 hover:shadow-md transition-all">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#651FFF] font-bold text-base">
                      ⚡
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">Total Fanbase Counter</h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mt-0.5">
                        Combine YouTube, IG &amp; FB into one impressive <span className="italic font-semibold text-slate-800">total number.</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl bg-white border border-purple-100 p-4 shadow-xs hover:border-[#651FFF]/40 hover:shadow-md transition-all">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#651FFF] font-bold text-base">
                      🎬
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">Ordered Content Series Flow</h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mt-0.5">
                        Organize Part 1, Part 2, Part 3 so your fans watch <span className="italic font-semibold text-slate-800">every episode in order.</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl bg-white border border-purple-100 p-4 shadow-xs hover:border-[#651FFF]/40 hover:shadow-md transition-all">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#651FFF] font-bold text-base">
                      💼
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">Brand &amp; Sponsorship Ready</h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mt-0.5">
                        Share one professional link with brand sponsors to showcase your <span className="italic font-semibold text-slate-800">total fanbase &amp; series portfolio.</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl bg-white border border-purple-100 p-4 shadow-xs hover:border-[#651FFF]/40 hover:shadow-md transition-all">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#651FFF] font-bold text-base">
                      📈
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">Binge Watching &amp; High Retention</h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mt-0.5">
                        Keep fans hooked on your profile with <span className="italic font-semibold text-slate-800">seamless next-episode discovery</span> across all your series.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl bg-white border border-purple-100 p-4 shadow-xs hover:border-[#651FFF]/40 hover:shadow-md transition-all">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#651FFF] font-bold text-base">
                      🎯
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">Single Master Bio Link</h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mt-0.5">
                        Replace 5 messy links with <span className="italic font-semibold text-[#651FFF]">inflixo.com/yourname</span> on all your social bios.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl bg-white border border-purple-100 p-4 shadow-xs hover:border-[#651FFF]/40 hover:shadow-md transition-all">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#651FFF] font-bold text-base">
                      🚀
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">Instant Creator Portfolio</h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mt-0.5">
                        Get a polished, high-converting OTT-style creator profile page <span className="italic font-semibold text-slate-800">live in under 2 minutes.</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-2xl bg-white border border-purple-100 p-4 shadow-xs hover:border-[#651FFF]/40 hover:shadow-md transition-all">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#651FFF] font-bold text-base">
                      🆓
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">100% Free Early Access</h4>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed mt-0.5">
                        Zero monthly fees • Full creator features included during early launch.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero: 100% REAL TONY STARK LIVE PREVIEW CARD WITH 10S AUTO THEME SWITCH */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="w-full max-w-[360px] rounded-[36px] border-4 border-slate-900 bg-white p-3.5 shadow-2xl relative animate-float-slow transition-all duration-700">
                {/* Phone Speaker Notch */}
                <div className="w-16 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

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

      {/* 3. PROBLEM 1 → SOLUTION 1: REAL TOTAL FANBASE PREVIEW */}
      <section id="total-fanbase" className="py-20 sm:py-28 bg-[#F6F1FF] border-y border-purple-200/70 z-10">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-2xs">
                <span>PROBLEM 01</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-snug">
                Stop showing separate numbers.
              </h2>
              <p className="text-base sm:text-lg font-medium text-slate-600 leading-relaxed">
                Instead of telling brands and fans about every social account separately:
              </p>

              <div className="pt-3 border-t border-purple-200">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#651FFF] leading-snug">
                  Show your <span className="italic font-normal text-slate-900">20.5M</span> Total Fanbase.
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                  Your combined audience from socials connected to Inflixo.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-md rounded-3xl border border-purple-200 bg-white p-6 shadow-xl space-y-4 text-left hover:scale-[1.01] transition-transform">
                <div className="flex items-center justify-between rounded-2xl bg-[#651FFF] p-4 text-white shadow-md shadow-purple-600/20">
                  <div className="flex items-center gap-2">
                    <span className="text-base">❤️</span>
                    <span className="text-sm font-bold text-white">Total Fanbase</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span className="font-display text-2xl font-bold text-white">20.5M</span>
                  </div>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 pt-1">
                  Connected Social Platforms
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                        <InstagramIcon className="h-4 w-4 fill-current" />
                      </span>
                      <div className="min-w-0 text-left space-y-0.5">
                        <p className="truncate text-sm font-bold text-slate-900 leading-tight">Tony Stark</p>
                        <p className="truncate text-xs font-medium text-slate-500 leading-snug">@tonystark</p>
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">INSTAGRAM</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 shrink-0">4.8M Followers</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                        <YoutubeIcon className="h-4 w-4 fill-current" />
                      </span>
                      <div className="min-w-0 text-left space-y-0.5">
                        <p className="truncate text-sm font-bold text-slate-900 leading-tight">Stark Tech Vlogs</p>
                        <p className="truncate text-xs font-medium text-slate-500 leading-snug">@tonystark</p>
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">YOUTUBE</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 shrink-0">12.5M Subscribers</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <FacebookIcon className="h-4 w-4 fill-current" />
                      </span>
                      <div className="min-w-0 text-left space-y-0.5">
                        <p className="truncate text-sm font-bold text-slate-900 leading-tight">Tony Stark Official</p>
                        <p className="truncate text-xs font-medium text-slate-500 leading-snug">@tonystark</p>
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">FACEBOOK</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 shrink-0">3.2M Followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROBLEM 2 → SOLUTION 2: REAL SERIES ACCORDION PREVIEW */}
      <section id="series-solution" className="py-20 sm:py-32 bg-[#F3EEFF] text-slate-900 border-b border-purple-200/80 relative z-10">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-6 space-y-4 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#651FFF] px-3 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-sm">
                <span>PROBLEM 02</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 leading-snug">
                Don&apos;t let Part 2 get lost.
              </h2>

              <p className="text-base sm:text-lg font-medium text-slate-600 leading-relaxed">
                Your fans watched Part 1. Now they shouldn&apos;t have to search your feed for <span className="italic font-semibold text-slate-800">Part 2, Part 3 or Part 4.</span>
              </p>

              <div className="pt-3 border-t border-purple-200">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#651FFF] leading-snug">
                  Turn your content into an <span className="italic font-normal text-slate-900">organized</span> Series.
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
                  Fans can find every part from one clean page and continue watching.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="inline-flex items-center gap-2 rounded-full bg-[#651FFF] px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-purple-600/30 hover:bg-[#500CD6] hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Create Your First Series →</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-3xl border border-purple-200 bg-white p-6 space-y-4 shadow-xl text-left hover:scale-[1.01] transition-transform">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Public Series Portfolio</span>
                  <span className="text-[10px] font-bold text-[#651FFF] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">1 Series Live</span>
                </div>

                <div className="rounded-2xl border border-purple-200 bg-slate-900 text-white p-4 space-y-3 shadow-md">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=120&q=80"
                      alt="Iron Tech Series"
                      className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-base font-bold text-white truncate">Iron Tech Series</h4>
                      <p className="text-xs text-slate-400 truncate">Season 1 • 4 Episodes • Technology</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between rounded-xl bg-slate-800 p-2.5 border border-slate-700">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#651FFF] text-[10px] font-bold text-white shrink-0">01</span>
                        <p className="text-xs font-bold text-white truncate">Part 01: Arc Reactor Tech</p>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 shrink-0">Watched ✓</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-[#651FFF] p-2.5 text-white shadow-md animate-pulse">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-[#651FFF] shrink-0">02</span>
                        <p className="text-xs font-bold text-white truncate">Part 02: Building Mark I</p>
                      </div>
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500 shrink-0">Next Up →</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-2.5 border border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-700 text-[10px] font-bold text-slate-300 shrink-0">03</span>
                        <p className="text-xs font-semibold text-slate-300 truncate">Part 03: J.A.R.V.I.S AI System</p>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400 shrink-0">Queued</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-2.5 border border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-700 text-[10px] font-bold text-slate-300 shrink-0">04</span>
                        <p className="text-xs font-semibold text-slate-300 truncate">Part 04: Nanotech Flight Test</p>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-400 shrink-0">Queued</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING & EARLY ACCESS SECTION */}
      <section id="pricing" className="py-20 sm:py-28 bg-[#FAF8FF] border-b border-purple-200/70 z-10 relative">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 text-center space-y-8">
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#651FFF] px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
              <span>TRANSPARENT PRICING</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-slate-900 leading-snug">
              Free Early Access + <span className="italic font-normal text-[#651FFF]">Simple Creator Plans</span>
            </h2>
            <p className="text-base sm:text-lg font-medium text-slate-600">
              Get 100% Free Early Access today. Paid monthly &amp; yearly plans will launch soon with extra creator power.
            </p>
          </div>

          <PricingTable showEarlyAccessBanner={false} />
        </div>
      </section>

      {/* 6. FINAL POSITIONING & CLOSING CTA */}
      <section className="py-24 sm:py-32 bg-[#F3EEFF] text-center relative overflow-hidden z-10">
        <div className="mx-auto max-w-4xl px-5 sm:px-8 relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="font-display text-4xl sm:text-6xl font-bold text-[#0F172A] tracking-normal">
              That&apos;s Inflixo.
            </h2>
            <p className="text-lg sm:text-2xl font-semibold text-slate-600 max-w-2xl mx-auto leading-relaxed">
              One creator page for your <strong className="text-[#651FFF] font-bold">Total Fanbase</strong>, socials and <span className="italic font-normal text-slate-800">organized content</span> <strong className="text-[#651FFF] font-bold">Series</strong>.
            </p>
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <div className="inline-block rounded-2xl bg-white border-2 border-purple-200 px-6 py-3.5 text-lg sm:text-2xl font-mono font-bold text-[#651FFF] shadow-md">
              inflixo.com/yourname
            </div>

            <div>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="inline-flex items-center gap-2 rounded-full bg-[#651FFF] px-9 py-4 text-base sm:text-lg font-bold text-white shadow-xl shadow-purple-600/30 hover:bg-[#500CD6] hover:scale-105 transition-all cursor-pointer"
              >
                <span>Create Your Inflixo</span>
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-500">
              Free Early Access • Setup in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="mt-auto border-t border-purple-100 bg-white py-10 z-10 relative">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-semibold text-slate-600">
          <Logo size="sm" />

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/" className="hover:text-[#651FFF] transition-colors">
              Creator Home
            </Link>
            <a href="#total-fanbase" className="hover:text-[#651FFF] transition-colors">
              Total Fanbase
            </a>
            <a href="#series-solution" className="hover:text-[#651FFF] transition-colors">
              Series
            </a>
            <a href="#pricing" className="hover:text-[#651FFF] transition-colors">
              Pricing
            </a>
            <Link href="/privacy" className="hover:text-[#651FFF] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#651FFF] transition-colors">
              Terms of Service
            </Link>
          </div>

          <p className="text-slate-400 font-semibold">Built by TrustIQ Labs · &copy; 2026 Inflixo</p>
        </div>
      </footer>
    </div>
  );
}
