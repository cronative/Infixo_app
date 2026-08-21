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
  Briefcase,
  Clock,
  CheckCircle2,
  MessageCircle,
  Mail,
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
  { key: "sand-linen", name: "Warm Sand Linen" },
  { key: "rose-gold", name: "Rose Gold Luxe" },
  { key: "lavender-haze", name: "Lavender Haze" },
  { key: "sakura-blossom", name: "Sakura Blossom" },
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#803D63] border-t-transparent" />
          <p className="text-xs font-medium text-[#4B5563]">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#FFFFFF] text-[#111827] flex flex-col font-sans selection:bg-purple-100 selection:text-[#803D63]">
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
              className="inline-flex items-center gap-1.5 rounded-full bg-[#803D63] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#6D3254] transition-colors cursor-pointer"
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
              <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-semibold text-[#803D63]">
                <Sparkles className="h-3.5 w-3.5 text-[#803D63]" />
                <span>Early Access for India&apos;s Top Creators</span>
              </div>

              {/* Heading */}
              <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight tracking-tight text-[#111827]">
                Your content is everywhere. Your creator identity shouldn&apos;t be scattered.
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg font-bold text-[#111827] leading-relaxed">
                One page for your series. One live number for brands.
              </p>

              {/* Handle Claim & Interactive Generator Input */}
              <div className="space-y-3 pt-1">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleClaim(username);
                  }}
                  className="flex items-center rounded-xl border border-[#E5E7EB] bg-white p-1.5 focus-within:border-[#803D63] focus-within:ring-2 focus-within:ring-[#803D63]/20 transition-all max-w-md shadow-xs"
                >
                  <span className="pl-3.5 text-xs sm:text-sm font-bold text-[#803D63] select-none shrink-0">
                    inflixo.com/
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourname (e.g. techburners)"
                    className="w-full bg-transparent px-1 py-2 text-xs sm:text-sm font-bold text-[#111827] outline-none placeholder:text-[#9CA3AF] placeholder:font-normal min-w-0"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-[#803D63] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#6D3254] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate Page</span>
                  </button>
                </form>

                {/* Micro-Trust Proof */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#4B5563] pt-1">
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> Live Real-Time Preview
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> Connects in 60s
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" /> 100% Free Setup
                  </span>
                </div>

                {/* Plain 3-Step What You Get Strip */}
                <div className="pt-4 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-bold text-[#111827]">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#803D63] shrink-0 stroke-[3]" />
                    <span>1. One page for your series (in order)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#803D63] shrink-0 stroke-[3]" />
                    <span>2. One live combined fanbase count</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#803D63] shrink-0 stroke-[3]" />
                    <span>3. One rate card with direct brand contact</span>
                  </div>
                </div>
              </div>

              {/* INTEGRATED BRAND OUTREACH & MEDIA KIT FEATURE BLOCK */}
              <div className="border-t border-[#E5E7EB] pt-8 mt-8 sm:mt-12 lg:mt-16 space-y-4">
                <span className="inline-block rounded-full bg-purple-50 text-[#803D63] border border-purple-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                  Brand Outreach &amp; Media Kit
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] leading-tight">
                  Brands don&apos;t want 5 links. They want your true reach.
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#4B5563] leading-relaxed">
                  Separate profiles under-report your real scale — Inflixo adds every platform into one live number.
                </p>

                <div className="space-y-2 pt-1 text-xs sm:text-sm font-semibold text-[#111827]">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                    <div>
                      <strong className="text-[#111827]">Unlimited Collab Gigs:</strong> Free rate card listing &amp; pre-qualified WhatsApp briefs.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                    <div>
                      <strong className="text-[#111827]">AI-Synced Fanbase Count:</strong> Inflixo checks your connected accounts and updates your numbers automatically, no manual entry.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero: INTERACTIVE LIVE PREVIEW CARD WITH REAL-TIME HANDLE GENERATION */}
            <div className="lg:col-span-6 flex flex-col items-center justify-start w-full">
              <div className="w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-3 relative transition-all duration-700 space-y-3">
                {/* Sleek Browser Bar Header */}
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
                    <span>inflixo.com/{username ? username.toLowerCase().replace(/[^a-z0-9_]/g, "") : "yourname"}</span>
                  </div>
                </div>

                {/* REAL LIVE PREVIEW CARD COMPONENT WITH DYNAMIC HANDLE */}
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
                  totalAudience={username.trim() ? 1480000 : 20500000}
                  themeKey={activeTheme.key}
                />

                {/* VIRAL CLAIM HANDLE CTA BUTTON BELOW PREVIEW CARD */}
                <button
                  type="button"
                  onClick={() => handleClaim(username)}
                  className="w-full tap-scale py-3 px-4 rounded-xl bg-[#803D63] hover:bg-[#6D3254] text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Claim @{username.trim() || "yourname"} Profile Before Someone Else Does</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
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
                  <span className="rounded bg-[#803D63] px-2.5 py-0.5 text-[10px] font-bold text-white">
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
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#803D63] text-white"
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
              <span className="inline-block rounded-full bg-purple-50 text-[#803D63] border border-purple-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                One page for your whole series
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111827] leading-tight">
                Don&apos;t let Part 2 get lost in social feeds.
              </h2>
              <p className="text-sm sm:text-base font-medium text-[#4B5563] leading-relaxed">
                Feeds scatter your series into disconnected posts. Inflixo puts every part on one page, in order — like a playlist. Custom posters, numbered episodes, and 1-tap playback keep viewers watching.
              </p>

              <div className="space-y-2 pt-2 text-xs sm:text-sm font-semibold text-[#111827]">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <div>
                    <strong className="text-[#111827]">Playlist-Style Auto-Sequencing:</strong> Part 1 leads straight to Part 2 with 1-tap playback.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <div>
                    <strong className="text-[#111827]">Cross-Platform Support:</strong> Unify YouTube videos, Instagram Reels, and Facebook episodes in one clean series.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.5. SECTION: INTERACTIVE CREATOR MEDIA KIT & BRAND COLLABS */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-4 text-left">
              <span className="inline-block rounded-full bg-purple-50 text-[#803D63] border border-purple-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                Direct Brand Deals
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111827] leading-tight">
                Get paid by brands without a middleman
              </h2>
              <p className="text-sm sm:text-base font-medium text-[#4B5563] leading-relaxed">
                Stop losing leads in crowded DMs. Brands see your reach and rate card, and contact you directly — zero commission.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-medium text-[#111827]">
                <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-[#F9FAFB] p-3">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <div>
                    <strong className="text-slate-900 block font-bold">Dynamic Rate Cards:</strong>
                    List custom pricing for Reels, YouTube integrations &amp; retainers.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-[#F9FAFB] p-3">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <div>
                    <strong className="text-slate-900 block font-bold">AI-Synced Fanbase Count:</strong>
                    Automatically updated cross-platform reach across Instagram, YouTube &amp; Facebook.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-[#F9FAFB] p-3">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <div>
                    <strong className="text-slate-900 block font-bold">Direct WhatsApp &amp; Email Leads:</strong>
                    Pre-qualified campaign briefs sent directly to your WhatsApp or inbox.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-[#F9FAFB] p-3">
                  <Check className="h-4 w-4 text-[#803D63] shrink-0 mt-0.5 stroke-[3]" />
                  <div>
                    <strong className="text-slate-900 block font-bold">1-Click PDF Media Kit Export:</strong>
                    Generate a polished PDF proposal instantly for agencies and sponsors.
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Card Mockup: Media Kit Rate Card Preview */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/40 via-white to-white p-5 space-y-4 text-left shadow-lg relative">
                <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">LIVE MEDIA KIT</span>
                  </div>
                  <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-amber-950">
                    RATE CARD LIVE
                  </span>
                </div>

                {/* Sample Gig Card 1 */}
                <div className="rounded-xl border border-amber-200 bg-white p-4 space-y-2.5 shadow-2xs relative">
                  <span className="absolute -top-2 right-3 bg-[#803D63] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                    MOST POPULAR
                  </span>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="border text-[9px] font-extrabold px-2 py-0.5 rounded uppercase bg-[#F6EBF1] text-[#803D63] border-[#E8DCE4]">
                        Instagram Reel
                      </span>
                      <h5 className="font-bold text-sm text-slate-900 mt-1">1x High-Engagement Dedicated Reel</h5>
                    </div>
                    <span className="font-extrabold text-base text-[#803D63]">₹2,000</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold">Turnaround: 2 Days</p>
                  <ul className="text-xs space-y-1 pt-1 border-t border-slate-100 text-slate-600">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 stroke-[3]" />
                      <span>30–60s Dedicated Reel + Brand Tag</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 stroke-[3]" />
                      <span>Direct Promo Code Link in Bio</span>
                    </li>
                  </ul>
                </div>

                {/* Sample Gig Card 2 */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="border text-[9px] font-extrabold px-2 py-0.5 rounded uppercase bg-indigo-50 text-indigo-700 border-indigo-100">
                        Instagram Bundle
                      </span>
                      <h5 className="font-bold text-sm text-slate-900 mt-1">3x Reels Mini-Campaign Pack</h5>
                    </div>
                    <span className="font-extrabold text-base text-[#803D63]">₹5,400</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold">Turnaround: 5 Days • Save 10%</p>
                </div>

                {/* Direct WhatsApp & Email Contact Bar */}
                <div className="pt-2 border-t border-amber-100 grid grid-cols-2 gap-2">
                  <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs">
                    <span>WhatsApp Brief</span>
                  </div>
                  <div className="bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs">
                    <span>Email Brief</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION 3: CREATOR COLLECTIVE */}
      <section className="py-12 sm:py-16 bg-[#FFFFFF] border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 sm:p-8 text-[#111827] space-y-4">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#111827] leading-tight">
              Built with India&apos;s first 10,000 creators.
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] font-semibold max-w-xl mx-auto">
              Join early access to receive a foundational creator membership and an invite to the Inflixo Creator Summit 2027.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SECTION 4: TRANSPARENT, CREATOR-FIRST PRICING */}
      <section className="py-16 sm:py-24 bg-[#F9FAFB] border-b border-[#E5E7EB]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-8">
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="inline-block rounded-full bg-purple-50 text-[#803D63] border border-purple-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
              Pricing Plans
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111827]">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#4B5563]">
              Transparent, creator-first plans with full media kit features.
            </p>
          </div>

          <div className="text-left">
            <PricingTable showEarlyAccessBanner={true} />
          </div>
        </div>
      </section>

      {/* 7. FINAL BOTTOM CONVERSION BANNER */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-8 sm:p-12 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111827]">
                Your fanbase, your series, one link.
              </h2>
            </div>

            <div className="max-w-md mx-auto space-y-3 pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClaim(bottomUsername);
                }}
                className="flex items-center rounded-xl border border-[#E5E7EB] bg-white p-1.5 focus-within:border-[#803D63] focus-within:ring-2 focus-within:ring-[#803D63]/20 transition-all shadow-xs"
              >
                <span className="pl-3.5 text-xs sm:text-sm font-bold text-[#803D63] select-none shrink-0">
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
                  className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-[#803D63] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#6D3254] transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Claim Handle</span>
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
