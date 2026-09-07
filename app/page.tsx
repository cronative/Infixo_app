"use client";

import { useState, useEffect, useRef } from "react";
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
  Eye,
  Share2,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { InstagramIcon, YoutubeIcon, TikTokIcon } from "@/components/shared/BrandIcons";
import { AuthService } from "@/services/AuthService";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { CreatorProfile, SocialAccounts, Series, ThemeKey, MediaKitPackage, CreatorReview, BillingCycle } from "@/types";
import { openCookiePreferences } from "@/lib/cookieConsent";

const DEMO_PROFILE: CreatorProfile = {
  displayName: "Tony Stark",
  username: "tonystark",
  category: "Technology & AI",
  bio: "Building AI, Robotics & Armor Series • Tech breakdown & real engineering experiments",
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

/**
 * Animated number counter component (starts 0.5s after load, runs 1.2s)
 */
function AnimatedCounter({ end, duration = 1200, prefix = "", suffix = "" }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTimeout = setTimeout(() => {
            const startTime = performance.now();
            const animate = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const easeProgress = 1 - Math.pow(1 - progress, 3);
              setCount(Math.floor(easeProgress * end));
              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setCount(end);
              }
            };
            requestAnimationFrame(animate);
          }, 500);
          return () => clearTimeout(startTimeout);
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref} className="tabular-nums font-bold">
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function LandingHomePage() {
  const router = useRouter();
  const isLoggedIn = AuthService.isLoggedIn();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [bottomUsername, setBottomUsername] = useState("");
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
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

  // Subtle Auto-Theme Switcher for Live Preview Showcase
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

  if (checkingAuth && isLoggedIn) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fbfbfb]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#B85C6B] border-t-transparent" />
          <p className="text-xs font-medium text-[#6B5A5D]">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-[#fbfbfb] text-[#241618] flex flex-col font-sans selection:bg-[#f3dde057] selection:text-[#8C3F4D] overflow-x-hidden antialiased">
      {/* =========================================================================
          NAVIGATION BAR
         ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#E4DAD5] transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-8">
            <Logo size="md" />
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#6B5A5D]">
              <button
                type="button"
                onClick={() => scrollToSection("total-fanbase")}
                className="hover:text-[#B85C6B] transition-colors cursor-pointer py-1"
              >
                Total Fanbase
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("series")}
                className="hover:text-[#B85C6B] transition-colors cursor-pointer py-1"
              >
                Series Playlists
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("collaborations")}
                className="hover:text-[#B85C6B] transition-colors cursor-pointer py-1"
              >
                Brand Collabs
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("pricing")}
                className="hover:text-[#B85C6B] transition-colors cursor-pointer py-1"
              >
                Pricing
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-[#6B5A5D] hover:text-[#241618] px-3 py-1.5 transition-colors"
            >
              Log In
            </Link>
            <button
              type="button"
              onClick={() => handleClaim(username || "yourname")}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#B85C6B] px-4 py-2 text-xs sm:text-sm font-semibold text-[#fbfbfb] hover:bg-[#8C3F4D] transition-colors cursor-pointer active:scale-98"
            >
              <span>Claim Your Handle</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECTION 1: HERO
         ========================================================================= */}
      <section className="relative z-10 pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-[#E4DAD5] bg-[#fbfbfb]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            {/* Tag / Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f3dde057] px-3.5 py-1 text-xs font-semibold text-[#8C3F4D]">
              <Sparkles className="h-3.5 w-3.5 text-[#B85C6B]" />
              <span>The Link-in-Bio for Series Creators</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-3xl sm:text-5xl md:text-5xl lg:text-[54px] font-bold leading-[1.12] tracking-tight text-[#241618]">
              One profile for everything you&apos;ve built as a creator.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg font-normal text-[#6B5A5D] max-w-2xl mx-auto leading-relaxed">
              Your audience, content, series, collaborations and credibility — together in one link.
            </p>

            {/* Trimmed Reassurance Line */}
            <p className="text-xs sm:text-sm font-medium text-[#6B5A5D]">
              100% native credit — views &amp; revenue stay on your platform.
            </p>

            {/* Claim Handle Input Form */}
            <div className="max-w-md mx-auto space-y-3 pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClaim(username);
                }}
                className="flex items-center rounded-[8px] border border-[#E4DAD5] bg-[#FFFFFF] p-1.5 focus-within:border-[#B85C6B] transition-colors"
              >
                <span className="pl-3 text-xs sm:text-sm font-medium text-[#6B5A5D] select-none shrink-0">
                  inflixo.com/
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-transparent px-2 py-1.5 text-xs sm:text-sm font-medium text-[#241618] outline-none placeholder:text-[#6B5A5D]/60 min-w-0"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 shrink-0 rounded-[8px] bg-[#B85C6B] px-4 py-2 text-xs sm:text-sm font-semibold text-[#fbfbfb] hover:bg-[#8C3F4D] transition-colors cursor-pointer active:scale-98"
                >
                  <span>Claim</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleClaim(username)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#B85C6B] hover:bg-[#8C3F4D] px-6 py-2.5 text-sm font-semibold text-[#fbfbfb] transition-colors cursor-pointer active:scale-98"
                >
                  <span>Claim Your Handle</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("hero-preview")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[8px] bg-transparent hover:bg-[#fbfbfb] border border-[#B85C6B] px-6 py-2.5 text-sm font-semibold text-[#B85C6B] transition-colors cursor-pointer"
                >
                  <Eye className="h-4 w-4 text-[#B85C6B]" />
                  <span>See Creator Live Hub</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div
            id="hero-preview"
            className="relative max-w-4xl mx-auto mt-12 sm:mt-16 pt-2 pb-4 flex items-center justify-center"
          >
            {/* Floating Badge: Total Fanbase */}
            <div className="hidden sm:block absolute top-4 -left-6 lg:-left-12 z-20">
              <div className="flex items-center gap-2.5 rounded-[12px] bg-[#FFFFFF] border border-[#E4DAD5] px-3.5 py-2 text-xs font-semibold text-[#241618]">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#fbfbfb] text-[#B85C6B] shrink-0">
                  <Users className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <p className="text-[11px] text-[#6B5A5D] leading-none">Total Fanbase</p>
                  <p className="text-xs font-bold text-[#241618] leading-tight pt-0.5">20.5M Combined</p>
                </div>
              </div>
            </div>

            {/* Floating Badge: OTT Series */}
            <div className="hidden sm:block absolute top-6 -right-6 lg:-right-12 z-20">
              <div className="flex items-center gap-2.5 rounded-[12px] bg-[#FFFFFF] border border-[#E4DAD5] px-3.5 py-2 text-xs font-semibold text-[#241618]">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#fbfbfb] text-[#B85C6B] shrink-0">
                  <Tv className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <p className="text-[11px] text-[#6B5A5D] leading-none">OTT Series</p>
                  <p className="text-xs font-bold text-[#241618] leading-tight pt-0.5">Part 01 • 02 • 03</p>
                </div>
              </div>
            </div>

            {/* Floating Badge: Multi-Platform Sync with Live dot in primary maroon */}
            <div className="hidden md:flex absolute bottom-12 -left-8 lg:-left-14 z-20">
              <div className="flex items-center gap-3 rounded-[12px] bg-[#FFFFFF] border border-[#E4DAD5] px-3.5 py-2 text-xs font-semibold text-[#241618]">
                <div className="flex items-center -space-x-1.5 shrink-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fbfbfb] text-[#B85C6B] border border-[#E4DAD5]">
                    <InstagramIcon className="h-3 w-3" />
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fbfbfb] text-[#B85C6B] border border-[#E4DAD5]">
                    <YoutubeIcon className="h-3 w-3" />
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fbfbfb] text-[#B85C6B] border border-[#E4DAD5]">
                    <TikTokIcon className="h-3 w-3" />
                  </span>
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#B85C6B] animate-pulse" />
                    <p className="text-[11px] font-bold text-[#8C3F4D]">LIVE SYNC</p>
                  </div>
                  <p className="text-xs font-bold text-[#241618] leading-tight pt-0.5">3 Platforms</p>
                </div>
              </div>
            </div>

            {/* Floating Badge: Collab Gigs */}
            <div className="hidden sm:block absolute bottom-12 -right-8 lg:-right-14 z-20">
              <div className="flex items-center gap-2.5 rounded-[12px] bg-[#FFFFFF] border border-[#E4DAD5] px-3.5 py-2 text-xs font-semibold text-[#241618]">
                <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#f3dde057] text-[#8C3F4D] shrink-0">
                  <Briefcase className="h-4 w-4" />
                </span>
                <div className="text-left">
                  <p className="text-[11px] text-[#6B5A5D] leading-none">Collab Gigs</p>
                  <p className="text-xs font-bold text-[#241618] leading-tight pt-0.5">Direct Rate Card</p>
                </div>
              </div>
            </div>

            {/* Center Profile Preview Container */}
            <div className="w-full max-w-[560px] rounded-[12px] border border-[#E4DAD5] bg-[#FFFFFF] p-4 relative z-10 space-y-3">
              <div className="flex items-center justify-between bg-[#fbfbfb] px-3.5 py-2 rounded-[8px] border border-[#E4DAD5]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAD5]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAD5]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E4DAD5]" />
                </div>
                <div className="flex items-center gap-1 rounded-[8px] bg-[#FFFFFF] px-3 py-0.5 text-xs font-medium text-[#241618] border border-[#E4DAD5]">
                  <span className="text-[#6B5A5D]">inflixo.com/</span>
                  <span className="font-bold">{username ? username.toLowerCase().replace(/[^a-z0-9_]/g, "") : "tonystark"}</span>
                </div>
                <div className="w-6" />
              </div>

              <LivePreviewCard
                profile={
                  username.trim()
                    ? {
                      displayName: username.trim().charAt(0).toUpperCase() + username.trim().slice(1),
                      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      category: "Digital Creator",
                      bio: `Official OTT Media Kit & Series Showcase of @${username.trim()}`,
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

              <button
                type="button"
                onClick={() => handleClaim(username || "yourname")}
                className="w-full py-2.5 px-4 rounded-[8px] bg-[#B85C6B] hover:bg-[#8C3F4D] text-[#fbfbfb] font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Claim Your Handle</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: THE CORE INSIGHT & PROBLEM CARDS (MERGED)
         ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#FFFFFF] border-b border-[#E4DAD5]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          {/* Trimmed Insight Statement (2 lines only) */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#241618]">
              Link trees show links. Inflixo shows your story.
            </h2>
            <p className="text-sm sm:text-base text-[#6B5A5D]">
              You built the audience. Why should your value be scattered across the internet?
            </p>
          </div>

          {/* 4 Trimmed Problem Cards (6-8 words descriptions) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-[12px] border border-[#E4DAD5] bg-[#fbfbfb] space-y-3 transition-colors hover:border-[#B85C6B]">
              <div className="h-10 w-10 rounded-[8px] bg-[#f3dde057] text-[#8C3F4D] flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-base text-[#241618]">Audience Fragmented</h3>
              <p className="text-xs text-[#6B5A5D] leading-relaxed">
                Followers spread across separate platform silos.
              </p>
            </div>

            <div className="p-5 rounded-[12px] border border-[#E4DAD5] bg-[#fbfbfb] space-y-3 transition-colors hover:border-[#B85C6B]">
              <div className="h-10 w-10 rounded-[8px] bg-[#f3dde057] text-[#8C3F4D] flex items-center justify-center">
                <Tv className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-base text-[#241618]">Multi-Part Videos Lost</h3>
              <p className="text-xs text-[#6B5A5D] leading-relaxed">
                Episodic series get buried in rapid feeds.
              </p>
            </div>

            <div className="p-5 rounded-[12px] border border-[#E4DAD5] bg-[#fbfbfb] space-y-3 transition-colors hover:border-[#B85C6B]">
              <div className="h-10 w-10 rounded-[8px] bg-[#f3dde057] text-[#8C3F4D] flex items-center justify-center">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-base text-[#241618]">Rate Cards in DMs</h3>
              <p className="text-xs text-[#6B5A5D] leading-relaxed">
                Rates live in unformatted chat threads.
              </p>
            </div>

            <div className="p-5 rounded-[12px] border border-[#E4DAD5] bg-[#fbfbfb] space-y-3 transition-colors hover:border-[#B85C6B]">
              <div className="h-10 w-10 rounded-[8px] bg-[#f3dde057] text-[#8C3F4D] flex items-center justify-center">
                <Star className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-base text-[#241618]">Brand Proof Hidden</h3>
              <p className="text-xs text-[#6B5A5D] leading-relaxed">
                Sponsor praise stays locked in private messages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: UNIFIED REACH & EPISODIC PLAYLISTS (SIDE-BY-SIDE)
         ========================================================================= */}
      <section id="total-fanbase" className="py-16 sm:py-24 bg-[#fbfbfb] border-b border-[#E4DAD5]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-16">
          {/* Part A: Unified Reach */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4 text-left">
              <span className="inline-block rounded-full bg-[#f3dde057] text-[#8C3F4D] px-3 py-0.5 text-xs font-semibold">
                Unified Reach
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#241618] tracking-tight leading-tight">
                Your reach, unified — one number brands trust.
              </h2>
              <p className="text-sm text-[#6B5A5D] leading-relaxed">
                Bring your audience from YouTube, Instagram, and TikTok under one roof. Inflixo aggregates your verified cross-platform reach into a single live stat.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[#6B5A5D] pt-1">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                  <span>One live-verified reach counter for brand proposals</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                  <span>Instant breakdown by platform with live counts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                  <span>Command higher sponsorship rates with total audience data</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#B85C6B] hover:bg-[#8C3F4D] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#fbfbfb] transition-colors cursor-pointer active:scale-98"
                >
                  <span>Calculate My Total Reach</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md rounded-[12px] border border-[#E4DAD5] bg-[#FFFFFF] p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E4DAD5]">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={DEMO_PROFILE.photoDataUrl || ""}
                      alt={DEMO_PROFILE.displayName}
                      className="h-10 w-10 rounded-full object-cover border border-[#E4DAD5]"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#241618]">{DEMO_PROFILE.displayName}</h4>
                      <p className="text-xs text-[#6B5A5D]">@{DEMO_PROFILE.username}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C3F4D] bg-[#f3dde057] px-2.5 py-0.5 rounded-full">
                    <span className="h-2 w-2 rounded-full bg-[#B85C6B] animate-pulse" />
                    Live Sync
                  </span>
                </div>

                <div className="rounded-[8px] p-5 text-center bg-[#fbfbfb] border border-[#E4DAD5] space-y-1">
                  <p className="text-3xl sm:text-4xl font-bold tracking-tight text-[#241618]">
                    <AnimatedCounter end={20500000} />
                  </p>
                  <p className="text-[11px] font-bold tracking-wider uppercase text-[#8C3F4D]">
                    TOTAL UNIFIED REACH
                  </p>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#fbfbfb] border border-[#E4DAD5]">
                    <div className="flex items-center gap-2 font-medium text-[#241618]">
                      <InstagramIcon className="h-4 w-4 text-[#B85C6B]" />
                      <span>Instagram</span>
                    </div>
                    <span className="font-bold text-[#241618]">4.8M Followers</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#fbfbfb] border border-[#E4DAD5]">
                    <div className="flex items-center gap-2 font-medium text-[#241618]">
                      <YoutubeIcon className="h-4 w-4 text-[#B85C6B]" />
                      <span>YouTube</span>
                    </div>
                    <span className="font-bold text-[#241618]">12.5M Subscribers</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#fbfbfb] border border-[#E4DAD5]">
                    <div className="flex items-center gap-2 font-medium text-[#241618]">
                      <TikTokIcon className="h-4 w-4 text-[#B85C6B]" />
                      <span>TikTok</span>
                    </div>
                    <span className="font-bold text-[#241618]">3.2M Followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Part B: Episodic Playlists */}
          <div id="series" className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-8 border-t border-[#E4DAD5]">
            <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-md rounded-[12px] border border-[#E4DAD5] bg-[#FFFFFF] p-5 space-y-3 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4DAD5]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C3F4D] bg-[#f3dde057] px-2 py-0.5 rounded-[4px]">
                      OTT Playlist
                    </span>
                    <h4 className="text-sm font-bold text-[#241618] pt-1">
                      Iron Tech Series
                    </h4>
                  </div>
                  <span className="text-xs text-[#6B5A5D]">4 Episodes</span>
                </div>

                <div className="space-y-2">
                  {[
                    { num: "01", title: "Episode 1: Arc Reactor Tech", progress: "100%", active: false },
                    { num: "02", title: "Episode 2: Building Mark I", progress: "65%", active: true },
                    { num: "03", title: "Episode 3: J.A.R.V.I.S AI System", progress: "0%", active: false },
                    { num: "04", title: "Episode 4: Nanotech Flight Test", progress: "0%", active: false },
                  ].map((ep) => (
                    <div
                      key={ep.num}
                      className={`flex items-center gap-3 rounded-[8px] p-2.5 text-xs border ${ep.active
                        ? "bg-[#fbfbfb] border-[#B85C6B]"
                        : "bg-[#FFFFFF] border-[#E4DAD5] text-[#241618]"
                        }`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#f3dde057] text-[#8C3F4D] shrink-0 font-bold">
                        <Play className="h-3 w-3 fill-current ml-0.5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#241618] truncate">{ep.title}</span>
                          {ep.active && (
                            <span className="text-[10px] font-bold text-[#8C3F4D]">
                              Next Up
                            </span>
                          )}
                        </div>
                        <div className="h-1 w-full rounded-full bg-[#E4DAD5] overflow-hidden">
                          <div
                            className="h-full bg-[#B85C6B] rounded-full transition-all duration-1000"
                            style={{ width: ep.progress }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4 text-left order-1 lg:order-2">
              <span className="inline-block rounded-full bg-[#f3dde057] text-[#8C3F4D] px-3 py-0.5 text-xs font-semibold">
                Episodic Playlists
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#241618] tracking-tight leading-tight">
                Stop losing viewers between Part 1 and Part 4.
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-[#6B5A5D]">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                  <span>Keep multi-part videos in sequential order</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                  <span>Enable season-style bingeing for evergreen content</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                  <span>Native YouTube &amp; Instagram views and ad revenue preserved</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#B85C6B] hover:bg-[#8C3F4D] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#fbfbfb] transition-colors cursor-pointer active:scale-98"
                >
                  <span>Build My Series Hub</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: DYNAMIC MEDIA KIT & BRAND CREDIBILITY
         ========================================================================= */}
      <section id="collaborations" className="py-16 sm:py-24 bg-[#FFFFFF] border-b border-[#E4DAD5]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-4 text-left">
              <span className="inline-block rounded-full bg-[#f3dde057] text-[#8C3F4D] px-3 py-0.5 text-xs font-semibold">
                Media Kit &amp; Credibility
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#241618] tracking-tight leading-tight">
                No more stale PDF decks.
              </h2>
              <p className="text-sm text-[#6B5A5D] leading-relaxed">
                Don&apos;t let your credibility disappear when the campaign ends. Share custom rate cards, dynamic audience insights, and verified sponsor reviews right from your bio.
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-[#6B5A5D]">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                  <span>Instant 1-click WhatsApp &amp; email brief routing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                  <span>Transparent fixed rates and deliverables</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                  <span>Verified ratings and sponsor ROI case studies</span>
                </li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#B85C6B] hover:bg-[#8C3F4D] px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#fbfbfb] transition-colors cursor-pointer active:scale-98"
                >
                  <span>Build My Live Rate Card</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Visuals: Rate Card + Review */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-[12px] border border-[#E4DAD5] bg-[#fbfbfb] p-5 space-y-3 text-left">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4DAD5]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-[4px] uppercase bg-[#f3dde057] text-[#8C3F4D]">
                      Instagram Reel
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-[4px] bg-[#FFFFFF] border border-[#E4DAD5] text-[#241618]">
                      ⭐ Most Popular
                    </span>
                  </div>
                  <span className="font-display text-base font-bold text-[#241618]">
                    ₹25,000
                  </span>
                </div>

                <div>
                  <h5 className="font-bold text-sm text-[#241618]">
                    1x Dedicated 4K Reel + Story Series
                  </h5>
                  <p className="text-xs text-[#6B5A5D] mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#B85C6B]" /> Turnaround: 3 Days
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E4DAD5] grid grid-cols-2 gap-2">
                  <div className="bg-[#B85C6B] text-[#fbfbfb] text-xs font-semibold py-2 px-3 rounded-[8px] inline-flex items-center justify-center gap-1.5 hover:bg-[#8C3F4D] transition-colors cursor-pointer">
                    <MessageCircle className="h-3.5 w-3.5 fill-current" />
                    <span>WhatsApp Inquiry</span>
                  </div>
                  <div className="bg-[#FFFFFF] border border-[#E4DAD5] text-[#241618] text-xs font-semibold py-2 px-3 rounded-[8px] inline-flex items-center justify-center gap-1.5 hover:bg-[#fbfbfb] transition-colors cursor-pointer">
                    <Mail className="h-3.5 w-3.5 text-[#B85C6B]" />
                    <span>Email Brief</span>
                  </div>
                </div>
              </div>

              {/* Review Card */}
              <div className="rounded-[12px] border border-[#E4DAD5] bg-[#FFFFFF] p-4 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[#B85C6B]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                    <span className="font-bold text-[#241618] ml-1">5.0</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#8C3F4D] bg-[#f3dde057] px-2 py-0.5 rounded-[4px]">
                    Verified Sponsor
                  </span>
                </div>
                <p className="text-xs italic text-[#241618] leading-relaxed">
                  &ldquo;Tony delivered our campaign in record time with 3.4x ROI on app installs. Incredible creator professionalism!&rdquo;
                </p>
                <p className="text-[11px] font-semibold text-[#6B5A5D]">
                  Priya Sharma • Brand Marketing Lead, CultFit
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: CREATOR QUOTE & COMPLETE PROFILE
         ========================================================================= */}
      <section className="py-16 sm:py-24 bg-[#fbfbfb] border-b border-[#E4DAD5]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
          <blockquote className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#241618] leading-snug tracking-tight">
            &ldquo;Creators deserve an identity bigger than any single platform.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: PRICING & FINAL CONVERSION
         ========================================================================= */}
      <section id="pricing" className="py-16 sm:py-24 bg-[#fbfbfb] border-b border-[#E4DAD5]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-block rounded-full bg-[#f3dde057] text-[#8C3F4D] px-3 py-0.5 text-xs font-semibold">
              Plans &amp; Pricing
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#241618]">
              Upgrade when you&apos;re ready.
            </h2>
            <p className="text-sm text-[#6B5A5D]">
              Start building your Inflixo profile today.
            </p>

            {/* Billing Cycle + Currency Toggle */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <div className="inline-flex items-center rounded-[8px] bg-[#FFFFFF] p-1 border border-[#E4DAD5]">
                <button
                  type="button"
                  onClick={() => setPricingCycle("monthly")}
                  className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${pricingCycle === "monthly"
                    ? "bg-[#B85C6B] text-[#fbfbfb]"
                    : "text-[#6B5A5D] hover:text-[#241618]"
                    }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setPricingCycle("yearly")}
                  className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${pricingCycle === "yearly"
                    ? "bg-[#B85C6B] text-[#fbfbfb]"
                    : "text-[#6B5A5D] hover:text-[#241618]"
                    }`}
                >
                  <span>Yearly</span>
                  <span className={`text-[10px] px-1 rounded ${pricingCycle === "yearly" ? "bg-white/20 text-white" : "bg-[#f3dde057] text-[#8C3F4D]"
                    }`}>
                    -16%
                  </span>
                </button>
              </div>

              <div className="inline-flex items-center rounded-[8px] bg-[#FFFFFF] p-1 border border-[#E4DAD5]">
                <button
                  type="button"
                  onClick={() => setCurrency("INR")}
                  className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${currency === "INR"
                    ? "bg-[#B85C6B] text-[#fbfbfb]"
                    : "text-[#6B5A5D] hover:text-[#241618]"
                    }`}
                >
                  ₹ INR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${currency === "USD"
                    ? "bg-[#B85C6B] text-[#fbfbfb]"
                    : "text-[#6B5A5D] hover:text-[#241618]"
                    }`}
                >
                  $ USD
                </button>
              </div>
            </div>
          </div>

          {/* 3 Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Plan 1: Starter */}
            <div className="p-6 rounded-[12px] border border-[#E4DAD5] bg-[#FFFFFF] space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-base text-[#241618]">Starter</h4>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-[4px] bg-[#f3dde057] text-[#8C3F4D]">
                    Free Forever
                  </span>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#241618]">{currency === "INR" ? "₹0" : "$0"}</p>
                  <p className="text-xs text-[#6B5A5D] mt-0.5">No credit card required</p>
                </div>
                <ul className="space-y-2.5 text-xs text-[#6B5A5D] pt-3 border-t border-[#E4DAD5]">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Up to 3 content series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Up to 15 total episodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>1 creator service rate card</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Total Fanbase live counter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Social profiles &amp; custom links</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E4DAD5]">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="w-full py-2 px-4 rounded-[8px] bg-transparent hover:bg-[#fbfbfb] border border-[#B85C6B] text-[#B85C6B] font-semibold text-xs transition-colors cursor-pointer"
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* Plan 2: Pro */}
            <div className="p-6 rounded-[12px] border-2 border-[#B85C6B] bg-[#FFFFFF] space-y-5 flex flex-col justify-between relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-base text-[#241618]">Pro</h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-[4px] bg-[#B85C6B] text-[#fbfbfb]">
                    Recommended
                  </span>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#241618]">
                    {currency === "INR"
                      ? pricingCycle === "yearly"
                        ? "₹1,999"
                        : "₹199"
                      : pricingCycle === "yearly"
                        ? "$24.99"
                        : "$2.99"}
                    <span className="text-xs text-[#6B5A5D] font-normal">
                      {pricingCycle === "yearly" ? " / year" : " / month"}
                    </span>
                  </p>
                  <p className="text-xs text-[#6B5A5D] mt-0.5">Taxes may apply</p>
                </div>
                <ul className="space-y-2.5 text-xs text-[#241618] font-medium pt-3 border-t border-[#E4DAD5]">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Up to 30 content series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Up to 300 total episodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Up to 3 active service rate cards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Remove Inflixo branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Direct brand lead routing</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E4DAD5]">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="w-full py-2.5 px-4 rounded-[8px] bg-[#B85C6B] hover:bg-[#8C3F4D] text-[#fbfbfb] font-semibold text-xs sm:text-sm transition-colors cursor-pointer active:scale-98"
                >
                  Upgrade to Creator Pro
                </button>
              </div>
            </div>

            {/* Plan 3: VIP */}
            <div className="p-6 rounded-[12px] border border-[#E4DAD5] bg-[#FFFFFF] space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-base text-[#241618]">VIP</h4>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-[4px] bg-[#f3dde057] text-[#8C3F4D]">
                    Custom
                  </span>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#241618]">
                    {currency === "INR"
                      ? pricingCycle === "yearly"
                        ? "₹2,999"
                        : "₹299"
                      : pricingCycle === "yearly"
                        ? "$39.99"
                        : "$4.99"}
                    <span className="text-xs text-[#6B5A5D] font-normal">
                      {pricingCycle === "yearly" ? " / year" : " / month"}
                    </span>
                  </p>
                  <p className="text-xs text-[#6B5A5D] mt-0.5">Taxes may apply</p>
                </div>
                <ul className="space-y-2.5 text-xs text-[#6B5A5D] pt-3 border-t border-[#E4DAD5]">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Unlimited content series</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Unlimited total episodes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Unlimited creator services</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Remove Inflixo branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#B85C6B] shrink-0" />
                    <span>Full feature access &amp; priority</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E4DAD5]">
                <button
                  type="button"
                  onClick={() => handleClaim(username || "yourname")}
                  className="w-full py-2 px-4 rounded-[8px] bg-transparent hover:bg-[#fbfbfb] border border-[#B85C6B] text-[#B85C6B] font-semibold text-xs transition-colors cursor-pointer"
                >
                  Get VIP Access
                </button>
              </div>
            </div>
          </div>

          {/* Final Bottom CTA */}
          <div className="mt-12 rounded-[12px] border border-[#E4DAD5] bg-[#FFFFFF] p-8 sm:p-12 text-center space-y-6">
            <div className="space-y-2 max-w-xl mx-auto">
              <h3 className="font-display text-2xl sm:text-4xl font-bold text-[#241618]">
                Your fanbase. Your content. Your work. One Inflixo link.
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5A5D]">
                Build the profile that shows the complete creator behind the content.
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleClaim(bottomUsername);
                }}
                className="flex items-center rounded-[8px] border border-[#E4DAD5] bg-[#fbfbfb] p-1.5 focus-within:border-[#B85C6B] transition-colors"
              >
                <span className="pl-3 text-xs sm:text-sm font-medium text-[#6B5A5D] select-none shrink-0">
                  inflixo.com/
                </span>
                <input
                  type="text"
                  value={bottomUsername}
                  onChange={(e) => setBottomUsername(e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-transparent px-2 py-1.5 text-xs sm:text-sm font-medium text-[#241618] outline-none placeholder:text-[#6B5A5D]/60 min-w-0"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 shrink-0 rounded-[8px] bg-[#B85C6B] px-4 py-2 text-xs sm:text-sm font-semibold text-[#fbfbfb] hover:bg-[#8C3F4D] transition-colors cursor-pointer active:scale-98"
                >
                  <span>Claim</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              <button
                type="button"
                onClick={() => handleClaim(bottomUsername)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#B85C6B] hover:bg-[#8C3F4D] px-6 py-2.5 text-sm font-semibold text-[#fbfbfb] transition-colors cursor-pointer active:scale-98"
              >
                <span>Claim Your Handle</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
         ========================================================================= */}
      <footer className="mt-auto border-t border-[#E4DAD5] bg-[#FFFFFF] py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#6B5A5D]">
          <Logo size="sm" />
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="hover:text-[#241618] transition-colors">
              Creator Home
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection("total-fanbase")}
              className="hover:text-[#241618] transition-colors cursor-pointer"
            >
              Total Fanbase
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("series")}
              className="hover:text-[#241618] transition-colors cursor-pointer"
            >
              Series Playlists
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="hover:text-[#241618] transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <Link href="/privacy" className="hover:text-[#241618] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:text-[#241618] transition-colors">
              Cookie Policy
            </Link>
            <button
              type="button"
              onClick={() => openCookiePreferences()}
              className="hover:text-[#241618] transition-colors cursor-pointer"
            >
              Cookie Preferences
            </button>
            <Link href="/terms" className="hover:text-[#241618] transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="text-[#6B5A5D]">&copy; 2026 Inflixo. All rights reserved.</p>
        </div>
      </footer>

      {/* FLOATING SCROLL TO TOP BUTTON */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${showScrollTop
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
          }`}
      >
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="group flex items-center gap-1.5 rounded-full border border-[#E4DAD5] bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-[#241618] hover:border-[#B85C6B] transition-colors cursor-pointer"
        >
          <ArrowUp className="h-4 w-4 text-[#B85C6B]" />
          <span className="hidden sm:inline">Top</span>
        </button>
      </div>
    </div>
  );
}
