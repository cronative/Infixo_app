"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUp,
  Camera,
  Check,
  Film,
  Menu,
  MessageSquareText,
  Play,
  ShieldCheck,
  ShoppingBag,
  Users,
  Video,
  X,
  Plus,
  Minus,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { ProfileService } from "@/services/ProfileService";
import { CreatorProfile, SocialAccounts, ThemeKey } from "@/types";
import { formatPlanPrice, usePricingCurrency } from "@/lib/pricing";
import {
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_GIGS,
  EXPERT_DEMO_CUSTOM_LINKS,
  EXPERT_DEMO_REVIEWS,
  EXPERT_DEMO_THEME,
  EXPERT_DEMO_PRODUCTS,
} from "@/data/expertDemoCreator";

// Lazy-load the heavy LivePreviewCard for fast initial page load
const LivePreviewCard = dynamic(
  () => import("@/components/onboarding/LivePreviewCard").then((mod) => mod.LivePreviewCard),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[460px] items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7A2253] border-t-transparent" />
      </div>
    ),
  }
);

const PILLARS = [
  {
    icon: Film,
    title: "Video Series & Episodes",
    text: "Organise your videos into bingeable seasons & episodes so fans easily watch Part 1, 2, and 3 without searching your feed.",
  },
  {
    icon: Play,
    title: "Views Stay Yours",
    text: "Videos open directly on your original YouTube, Instagram, or Facebook post. 100% of watch time, views, likes, and comments grow on your platform.",
  },
  {
    icon: ShoppingBag,
    title: "Creator Shop & Affiliate Gear",
    text: "Sell digital downloads (presets, guides, courses) or recommend gear with Amazon affiliate links in one clean tap.",
  },
  {
    icon: Zap,
    title: "0% Platform Commission",
    text: "Keep every rupee you earn. Inflixo charges 0% commission on digital product sales and sponsorships—payments route directly to you.",
  },
  {
    icon: MessageSquareText,
    title: "Rate Cards & Collabs",
    text: "Add sponsorship packages, deliverable pricing, and direct inquiry options so brands can quickly book you.",
  },
  {
    icon: ShieldCheck,
    title: "Brand Testimonials",
    text: "Show real testimonials from brands and collaborators to build instant credibility before deals.",
  },
];

const FAQS = [
  {
    q: "Do my fans need an app or account to watch?",
    a: "No. Anyone can open your Inflixo link directly in any mobile or desktop browser without signing up.",
  },
  {
    q: "Does Inflixo host or re-upload my videos?",
    a: "No. Your videos stay on YouTube, Instagram, or Facebook. Inflixo only organises your video links into a clean series format with episodes.",
  },
  {
    q: "Will my YouTube or Instagram views be affected?",
    a: "Not at all. Inflixo keeps all views on your channels. When fans click a video, it opens your original post. All views, watch time, likes, and comments count directly on your channel.",
  },
  {
    q: "How does 0% platform commission work?",
    a: "Inflixo takes zero cut on all product sales and brand sponsorships. 100% of customer payments go directly to your connected bank account or UPI via Razorpay.",
  },
  {
    q: "Can I create multiple series with seasons & episodes?",
    a: "Yes! Organise your tutorials, vlogs, podcasts, or comedy sketches into separate series with sequential episodes and seasons.",
  },
  {
    q: "Can I keep my collab rate cards private?",
    a: "Yes. You can keep your profile public while sharing your rate cards only with brands when you choose.",
  },
  {
    q: "Can I sell digital products or add affiliate links?",
    a: "Yes! Inflixo has a built-in Creator Shop. You can sell digital downloads (presets, guides, templates, courses) or add affiliate links for your camera gear and recommendations with 0% platform commission.",
  },
];

const SERIES_STEPS = [
  {
    step: "01",
    title: "Paste your video links",
    text: "Add links from YouTube, Instagram, or Facebook. Zero re-uploading needed.",
  },
  {
    step: "02",
    title: "Create ordered series",
    text: "Arrange Part 1, 2, 3 in sequence so fans always know what to watch next.",
  },
  {
    step: "03",
    title: "Put one link in bio",
    text: "Share inflixo.com/yourname so fans can watch your best work in one place.",
  },
];

function cleanHandle(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export default function LandingHomePage() {
  const router = useRouter();
  const pricingCurrency = usePricingCurrency();
  const isLoggedIn = AuthService.isLoggedIn();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("top");

  const footerRef = useRef<HTMLElement | null>(null);

  // Auth redirect check
  useEffect(() => {
    if (AuthService.isLoggedIn()) {
      const step = OnboardingService.getStep();
      const hasProf = ProfileService.hasProfile();
      if (step === "finish" || hasProf) {
        router.replace("/dashboard");
      } else {
        const stepRoutes: Record<string, string> = {
          profile: "/onboarding/profile",
          socials: "/onboarding/socials",
          theme: "/onboarding/themes",
          series: "/onboarding/subscription",
          subscription: "/onboarding/subscription",
        };
        router.replace(stepRoutes[step] || "/onboarding/profile");
      }
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  // Scroll position & Back to Top listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // IntersectionObserver for active section highlight & footer hide for Back to Top
  useEffect(() => {
    const sectionIds = ["top", "demo", "features", "how-it-works", "pricing", "faq"];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveNav(id);
            }
          });
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    if (footerRef.current) {
      const footerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setFooterInView(entry.isIntersecting);
          });
        },
        { threshold: 0.1 }
      );
      footerObserver.observe(footerRef.current);
      observers.push(footerObserver);
    }

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  function handleClaim(raw: string) {
    const handle = cleanHandle(raw);
    router.push(handle ? `/login?claim=${handle}` : "/login");
  }

  const previewHandle = cleanHandle(username) || EXPERT_DEMO_PROFILE.username || "demo_creator";
  const previewProfile: CreatorProfile = useMemo(() => {
    return username.trim()
      ? {
          displayName: username.trim().charAt(0).toUpperCase() + username.trim().slice(1),
          username: previewHandle,
          category: "Digital Creator",
          bio: `Videos, playlists, fan links and creator profile for @${previewHandle}.`,
          photoDataUrl: "/images/demo/avatar.webp",
          updatedAt: new Date().toISOString(),
        }
      : EXPERT_DEMO_PROFILE;
  }, [previewHandle, username]);

  const previewSocials = useMemo<SocialAccounts>(() => {
    return username.trim()
      ? {
          instagram: { url: `https://instagram.com/${previewHandle}`, followers: 100000, posts: 180, username: previewHandle },
          youtube: { url: `https://youtube.com/@${previewHandle}`, subscribers: 28000, videos: 72, totalViews: 5400000, username: previewHandle },
          facebook: { url: `https://facebook.com/${previewHandle}`, followers: 48400, posts: 112, username: previewHandle },
          updatedAt: new Date().toISOString(),
        }
      : EXPERT_DEMO_SOCIALS;
  }, [previewHandle, username]);

  if (checkingAuth && isLoggedIn) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FFFCFB]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#7A2253] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="landing-scope min-h-dvh antialiased selection:bg-[#F7EDEF] selection:text-[#7A2253]">
      {/* Target for Top scroll */}
      <div id="top" className="absolute top-0 h-px w-px" />

      {/* ── HEADER / NAVIGATION ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E4E4E7] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
          <Logo size="sm" />

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main Navigation">
            <a
              href="#top"
              className={`text-[14px] font-semibold transition-colors ${
                activeNav === "top" ? "text-[#7A2253]" : "text-[#52525B] hover:text-[#18181B]"
              }`}
            >
              Home
            </a>
            <a
              href="#demo"
              className={`text-[14px] font-semibold transition-colors ${
                activeNav === "demo" ? "text-[#7A2253]" : "text-[#52525B] hover:text-[#18181B]"
              }`}
            >
              View Demo
            </a>
            <a
              href="#features"
              className={`text-[14px] font-semibold transition-colors ${
                activeNav === "features" ? "text-[#7A2253]" : "text-[#52525B] hover:text-[#18181B]"
              }`}
            >
              Creator Tools
            </a>
            <a
              href="#pricing"
              className={`text-[14px] font-semibold transition-colors ${
                activeNav === "pricing" ? "text-[#7A2253]" : "text-[#52525B] hover:text-[#18181B]"
              }`}
            >
              Pricing
            </a>
            <a
              href="#faq"
              className={`text-[14px] font-semibold transition-colors ${
                activeNav === "faq" ? "text-[#7A2253]" : "text-[#52525B] hover:text-[#18181B]"
              }`}
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/login"
              className="text-[14px] font-semibold text-[#52525B] hover:text-[#18181B] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#7A2253] hover:bg-[#631841] px-5 text-[14px] font-bold text-white shadow-md shadow-[#7A2253]/25 transition-all"
            >
              <span>Start 7-day free trial</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/login"
              className="text-[14px] font-semibold text-[#52525B] px-2 py-1"
            >
              Log in
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E4E4E7] text-[#18181B] hover:bg-zinc-50"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#E4E4E7] bg-white px-4 py-6 md:hidden animate-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col gap-4 text-left" aria-label="Mobile Navigation">
              <a
                href="#top"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[16px] font-semibold text-[#18181B] py-1"
              >
                Home
              </a>
              <a
                href="#demo"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[16px] font-semibold text-[#18181B] py-1"
              >
                View Demo
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[16px] font-semibold text-[#18181B] py-1"
              >
                Creator Tools
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[16px] font-semibold text-[#18181B] py-1"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[16px] font-semibold text-[#18181B] py-1"
              >
                FAQ
              </a>
              <div className="pt-2 border-t border-[#E4E4E7] flex flex-col gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-[14px] font-semibold text-[#52525B] py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#7A2253] hover:bg-[#631841] px-5 text-[14px] font-bold text-white shadow-md shadow-[#7A2253]/25 transition-all"
                >
                  Start 7-day free trial
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
        {/* Subtle Ambient Floating Icons (Max 3, CSS transform only, prefers-reduced-motion safe) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] overflow-hidden" aria-hidden="true">
          <div className="landing-float absolute left-[6%] top-36 hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E4E4E7] bg-white text-[#7A2253] shadow-xs">
            <Camera className="h-6 w-6" />
          </div>
          <div className="landing-float absolute right-[8%] top-40 hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E4E4E7] bg-white text-[#7A2253] shadow-xs">
            <Video className="h-6 w-6" />
          </div>
          <div className="landing-float absolute left-[14%] bottom-12 hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E4E4E7] bg-white text-[#7A2253] shadow-xs">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        <div className="relative mx-auto max-w-[1120px] px-4 text-center sm:px-6">
          {/* Static Hero Headline (Single H1 on the page) */}
          <div className="mx-auto max-w-3xl space-y-4">
            <h1 className="landing-text-hero font-extrabold tracking-tight text-[#18181B]">
              Your videos, in order. <span className="text-[#7A2253]">Like a show.</span>
            </h1>
            <p className="landing-text-18 font-normal text-[#52525B] max-w-2xl mx-auto">
              Turn scattered YouTube &amp; Instagram videos into bingeable Series with seasons &amp; episodes. Sell affiliate gear &amp; digital downloads directly from your link in bio.
            </p>
          </div>

          {/* Username Claim Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleClaim(username);
            }}
            className="mx-auto mt-8 flex max-w-md items-center rounded-xl border border-[#E4E4E7] bg-white p-1.5 shadow-sm transition-all focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/20"
          >
            <span className="shrink-0 pl-3 text-[14px] font-semibold text-[#52525B]">inflixo.com/</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              aria-label="Your desired handle"
              className="min-w-0 flex-1 bg-transparent px-2 text-[14px] font-semibold text-[#18181B] outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#7A2253] hover:bg-[#631841] px-5 text-[14px] font-bold text-white shadow-md shadow-[#7A2253]/25 transition-all cursor-pointer"
            >
              <span>Claim</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Trust Highlights Row */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-semibold text-[#52525B]">
            <span>✓ No visitor signup needed</span>
            <span>✓ Views stay on your YouTube &amp; Instagram</span>
            <span>✓ Creator Shop &amp; Affiliate products</span>
            <span>✓ 7-day free trial</span>
          </div>

          {/* Made in India Badge */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E4E4E7] bg-white px-4 py-2 text-[14px] font-semibold text-[#18181B] shadow-xs">
              <span className="text-base" role="img" aria-label="Indian Flag">🇮🇳</span>
              <span>Made in India for Indian creators</span>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 divide-y divide-zinc-100 sm:divide-y-0 sm:divide-x sm:divide-zinc-100">
              <div className="pt-2 sm:pt-0 sm:px-3 text-center">
                <p className="text-[24px] font-extrabold text-[#7A2253]">500+</p>
                <p className="text-[14px] font-bold text-[#18181B]">Indian Creators Joined</p>
                <p className="text-[12px] text-[#52525B]">Active on Inflixo</p>
              </div>
              <div className="pt-2 sm:pt-0 sm:px-3 text-center">
                <p className="text-[24px] font-extrabold text-[#7A2253]">0%</p>
                <p className="text-[14px] font-bold text-[#18181B]">Commission</p>
                <p className="text-[12px] text-[#52525B]">Direct creator sales</p>
              </div>
              <div className="pt-2 sm:pt-0 sm:px-3 text-center">
                <p className="text-[24px] font-extrabold text-[#7A2253]">100%</p>
                <p className="text-[14px] font-bold text-[#18181B]">Direct Payouts</p>
                <p className="text-[12px] text-[#52525B]">To UPI &amp; bank via Razorpay</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO PREVIEW SECTION (`#demo`) ── */}
      <section id="demo" className="scroll-mt-24 border-t border-[#E4E4E7] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 text-center sm:px-6">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[#7A2253]">Live Preview</p>
          <h2 className="mt-2 text-[32px] sm:text-[48px] font-extrabold tracking-tight text-[#18181B]">
            {username.trim() ? `See @${previewHandle}'s Live Profile` : "See How Your Profile Looks"}
          </h2>
          <p className="mt-2 text-[16px] text-[#52525B] max-w-xl mx-auto">
            Organized video series, shop products, combined fanbase, and media kit cards in one beautiful link.
          </p>

          <div className="mx-auto mt-10 max-w-[620px] rounded-3xl border border-[#E4E4E7] bg-zinc-50/70 p-2 sm:p-3 shadow-md">
            <div className="mb-3 flex items-center justify-between rounded-xl bg-white border border-[#E4E4E7] px-3.5 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              </div>
              <span className="text-[12px] font-semibold text-[#7A2253]">
                inflixo.com/{previewHandle}
              </span>
              <span className="w-8" />
            </div>

            <div className="rounded-2xl bg-white p-2">
              <LivePreviewCard
                profile={previewProfile}
                socials={previewSocials}
                series={EXPERT_DEMO_SERIES}
                customLinks={EXPERT_DEMO_CUSTOM_LINKS}
                mediaKitPackages={EXPERT_DEMO_GIGS}
                reviews={EXPERT_DEMO_REVIEWS}
                products={EXPERT_DEMO_PRODUCTS}
                totalAudience={1345000}
                themeKey={EXPERT_DEMO_THEME}
                variant="full"
                seriesOpenMode="internal"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION (`#how-it-works`) ── */}
      <section id="how-it-works" className="scroll-mt-24 border-t border-[#E4E4E7] bg-[#FFFCFB] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#7A2253]">Simple Process</p>
              <h2 className="mt-2 text-[32px] sm:text-[48px] font-extrabold tracking-tight text-[#18181B]">
                Make your videos easy to watch in order.
              </h2>
              <p className="mt-3 text-[16px] text-[#52525B]">
                Paste your links. Inflixo groups them into clean playlists so fans can easily watch Part 1, 2, and 3 without hunting through your profile.
              </p>
            </div>

            <div className="space-y-4">
              {SERIES_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs flex items-start gap-4"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F7EDEF] text-[16px] font-black text-[#7A2253]">
                    {step.step}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-[18px] font-bold text-[#18181B]">{step.title}</h3>
                    <p className="text-[14px] text-[#52525B] leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CREATOR TOOLS / PILLARS (`#features`) ── */}
      <section id="features" className="scroll-mt-24 border-t border-[#E4E4E7] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#7A2253]">Creator Tools</p>
            <h2 className="text-[32px] sm:text-[48px] font-extrabold tracking-tight text-[#18181B]">
              Everything a video creator needs
            </h2>
            <p className="text-[16px] text-[#52525B]">
              Organize your video content, show your true reach, and monetize your audience without commission.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between hover:border-[#7A2253] transition-colors"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7EDEF] text-[#7A2253]">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-[18px] font-bold text-[#18181B]">{pillar.title}</h3>
                  <p className="mt-2 text-[14px] text-[#52525B] leading-relaxed">{pillar.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION (`#pricing`) ── */}
      <section id="pricing" className="scroll-mt-24 border-t border-[#E4E4E7] bg-[#FFFCFB] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#7A2253]">Transparent Pricing</p>
            <h2 className="text-[32px] sm:text-[48px] font-extrabold tracking-tight text-[#18181B]">
              Start free. Grow with your fans.
            </h2>
            <p className="text-[16px] text-[#52525B]">
              Try all features free for 7 days. Simple, affordable plans designed for Indian creators.
            </p>
            <div className="mx-auto mt-6 max-w-fit rounded-full bg-[#7A2253]/10 border border-[#7A2253]/20 px-4 py-1.5 text-center text-[12px] font-bold text-[#7A2253]">
              💡 A fraction of other bio-link tools • Cancel anytime • Video Series first
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Plan 1: Free Trial */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-[24px] font-bold text-[#18181B]">Free Trial</h3>
                <p className="mt-1 text-[14px] text-[#52525B]">Full access to your public creator profile for 7 days.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-[48px] font-extrabold text-[#18181B]">₹0</span>
                  <span className="text-[14px] text-[#52525B]">/ 7 days</span>
                </div>
                <p className="text-[12px] font-semibold text-emerald-600">✓ Cancel anytime during trial</p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {[
                    "7 days full access",
                    "Cancel anytime, no card required",
                    "3 series with 15 total episodes",
                    "1 shop product & affiliate gear link",
                    "0% platform commission on sales",
                    "5 custom links & 1 rate card package",
                    "1 brand testimonial",
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#7A2253] mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleClaim(username)}
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#E4E4E7] bg-white text-[14px] font-bold text-[#18181B] hover:bg-[#fdf2f8] hover:border-[#7A2253] transition-colors cursor-pointer"
              >
                Start 7-day free trial
              </button>
            </div>

            {/* Plan 2: Pro (Recommended) */}
            <div className="relative rounded-2xl border-2 border-[#7A2253] bg-white p-6 shadow-sm flex flex-col justify-between">
              <span className="absolute -top-3.5 right-6 rounded-full bg-[#7A2253] px-3 py-0.5 text-[12px] font-bold text-white uppercase tracking-wider">
                Popular
              </span>
              <div>
                <h3 className="text-[24px] font-bold text-[#18181B]">Pro</h3>
                <p className="mt-1 text-[14px] text-[#52525B]">For active creators publishing series and monetizing gear.</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-[48px] font-extrabold text-[#18181B]">
                    {formatPlanPrice("pro", "monthly", pricingCurrency)}
                  </span>
                  <span className="text-[14px] text-[#52525B]">/ month</span>
                </div>
                <p className="text-[12px] font-semibold text-[#7A2253]">Or ₹1,499/year (Save 37%)</p>
                <p className="text-[12px] font-semibold text-emerald-600">✓ Cancel anytime</p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {[
                    "Cancel anytime, no lock-in",
                    "20 series (20 episodes each)",
                    "20 shop products & affiliate links",
                    "0% platform commission on sales",
                    "Direct payouts to UPI / Bank via Razorpay",
                    "20 custom links & 3 collab packages",
                    "10 brand testimonials & rate cards",
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#7A2253] mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleClaim(username)}
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#7A2253] hover:bg-[#631841] text-[14px] font-bold text-white shadow-md shadow-[#7A2253]/25 transition-all cursor-pointer"
              >
                Start 7-day free trial
              </button>
            </div>

            {/* Plan 3: VIP */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-[24px] font-bold text-[#18181B]">VIP</h3>
                <p className="mt-1 text-[14px] text-[#52525B]">Unlimited power for top creators and studio teams.</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-[48px] font-extrabold text-[#18181B]">
                    {formatPlanPrice("vip", "monthly", pricingCurrency)}
                  </span>
                  <span className="text-[14px] text-[#52525B]">/ month</span>
                </div>
                <p className="text-[12px] font-semibold text-[#7A2253]">Or ₹2,499/year (Save 48%)</p>
                <p className="text-[12px] font-semibold text-emerald-600">✓ Cancel anytime</p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {[
                    "Cancel anytime, no lock-in",
                    "Unlimited series and episodes",
                    "Unlimited shop & affiliate products",
                    "0% platform commission on sales",
                    "Direct payouts to UPI / Bank via Razorpay",
                    "Unlimited custom links & testimonials",
                    "10 collab packages & custom rate cards",
                    "Priority WhatsApp support",
                    "Includes 3 creator team seats",
                  ].map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#7A2253] mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleClaim(username)}
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#E4E4E7] bg-white text-[14px] font-bold text-[#18181B] hover:bg-[#fdf2f8] hover:border-[#7A2253] transition-colors cursor-pointer"
              >
                Start 7-day free trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION (`#faq`) ── */}
      <section id="faq" className="scroll-mt-24 border-t border-[#E4E4E7] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#7A2253]">FAQ</p>
            <h2 className="text-[32px] sm:text-[48px] font-extrabold tracking-tight text-[#18181B]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[16px] font-bold text-[#18181B]">{faq.q}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F7EDEF] text-[#7A2253]">
                      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0">
                      <p className="text-[16px] leading-[1.6] text-[#52525B]">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA BANNER ── */}
      <section className="bg-[#7A2253] py-16 sm:py-24 text-center text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-6">
          <h2 className="text-[32px] sm:text-[48px] font-extrabold tracking-tight text-white leading-tight">
            Your videos, in order. Like a show.
          </h2>
          <p className="text-[16px] text-white/90 max-w-xl mx-auto leading-relaxed">
            Create your custom link in 2 minutes. Organise your series, sell with 0% commission, and start your 7-day free trial today.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleClaim(username)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[14px] font-bold text-[#7A2253] shadow-md hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <span>Start 7-day free trial</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer ref={footerRef} className="border-t border-[#E4E4E7] bg-white py-14">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Left Column: Brand */}
            <div className="md:col-span-1 space-y-3">
              <Logo size="sm" />
              <p className="text-[14px] text-[#52525B] leading-relaxed">
                Your videos, in order. Like a show.
              </p>
              <p className="text-[12px] font-semibold text-zinc-500">
                Made in India 🇮🇳
              </p>
            </div>

            {/* Column 1: Product */}
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#18181B]">Product</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><a href="#demo" className="hover:text-[#7A2253] transition-colors">View Demo</a></li>
                <li><a href="#features" className="hover:text-[#7A2253] transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-[#7A2253] transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-[#7A2253] transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Column 2: Company */}
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#18181B]">Company</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><a href="mailto:support@inflixo.com?subject=Inflixo%20Support" className="hover:text-[#7A2253] transition-colors">Contact Support</a></li>
                <li>
                  <a
                    href="https://instagram.com/inflixo_app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#7A2253] transition-colors"
                  >
                    Instagram (@inflixo_app)
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal */}
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#18181B]">Legal</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><Link href="/privacy" className="hover:text-[#7A2253] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#7A2253] transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-[#7A2253] transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="pt-8 border-t border-[#E4E4E7] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#52525B]">
            <p>© 2026 Inflixo. All rights reserved.</p>
            <div>
              <Link href="/login" className="hover:text-[#7A2253] underline font-medium">
                Log in to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── FLOATING BACK TO TOP BUTTON ── */}
      {showScrollTop && !footerInView && (
        <div className="fixed bottom-6 right-6 z-40 transition-all duration-300">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E4E4E7] bg-white text-[#7A2253] shadow-md hover:bg-zinc-50 cursor-pointer"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
