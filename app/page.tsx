"use client";

import { useEffect, useRef, useState, useMemo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUp,
  Award,
  BarChart3,
  Briefcase,
  Camera,
  Check,
  Film,
  Laptop,
  Link2,
  Menu,
  MessageSquare,
  Play,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  Users,
  Video,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { ProfileService } from "@/services/ProfileService";
import { CreatorProfile, SocialAccounts } from "@/types";
import { formatPlanPrice, usePricingCurrency } from "@/lib/pricing";
import { PLANS, planFeatureLines, yearlySavingsPercent } from "@/config/plans";
import { EXPERT_DEMO_PROFILE, EXPERT_DEMO_THEME } from "@/data/expertDemoCreator";
import {
  LANDING_DEMO_SOCIALS,
  LANDING_DEMO_SERIES,
  LANDING_DEMO_LINKS,
  LANDING_DEMO_SETUP,
  LANDING_DEMO_PRODUCTS,
  LANDING_DEMO_REVIEWS,
  LANDING_DEMO_GIGS,
} from "@/data/landingDemo";

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

const NAV_LINKS = [
  { id: "top", href: "#top", label: "Home" },
  { id: "demo", href: "#demo", label: "View Demo" },
  { id: "features", href: "#features", label: "Creator Tools" },
  { id: "pricing", href: "#pricing", label: "Pricing" },
  { id: "summit", href: "#summit", label: "Summit 2027" },
  { id: "faq", href: "#faq", label: "FAQ" },
];

const SECTION_IDS = [
  "top",
  "problem",
  "our-story",
  "demo",
  "how-it-works",
  "why-inflixo",
  "features",
  "for-creators",
  "founding",
  "testimonials",
  "summit",
  "pricing",
  "faq",
];

const HERO_CHECKS = [
  "Series & episodes, in order",
  "Your total fans across IG, YT & FB",
  "Tour, tickets & show links",
  "Brand reviews & your gear setup",
];

const HERO_STRIP = [
  { big: "Series", label: "Watch in order", sub: "Part 1 → Part 10, no hunting" },
  { big: "1 Number", label: "Your total fanbase", sub: "Instagram + YouTube + Facebook" },
  { big: "1 Link", label: "Your whole creator world", sub: "Links, collabs, setup & shop" },
];

const PROBLEMS: { icon: typeof Film; title: string; text: ReactNode }[] = [
  {
    icon: Film,
    title: "Part 1 kahan hai?",
    text: "New fans find Part 6 of your series and never find where the story started.",
  },
  {
    icon: Camera,
    title: "Which camera do you use, bhai?",
    text: "The same DM, every single day. You can't reply to everyone.",
  },
  {
    icon: BarChart3,
    title: "What's your total reach?",
    text: "Brands ask. Your followers are split across Instagram, YouTube and Facebook.",
  },
  {
    icon: Ticket,
    title: "Tour dates lost in stories.",
    text: "Show tickets, event links and schedules disappear after 24 hours.",
  },
  {
    icon: Star,
    title: "Brand work with no proof.",
    text: "You've done great collabs, but new brands can't see what past brands said about you.",
  },
  {
    icon: Link2,
    title: "A boring list of links.",
    text: (
      <>
        Regular link-in-bio tools show buttons. Your work deserves a home that looks like <em>you</em>.
      </>
    ),
  },
];

const SERIES_STEPS = [
  {
    step: "01",
    title: "Paste your video links",
    text: "Add links from YouTube, Instagram or Facebook. Your videos stay where they are; nothing is re-uploaded.",
  },
  {
    step: "02",
    title: "Arrange them as series",
    text: "Put Part 1, 2, 3 in order and give your series a name, a cover and a language. Fans always know what to watch next.",
  },
  {
    step: "03",
    title: "Add your creator world",
    text: "Tour schedule, show tickets, other accounts, your gear setup and brand reviews. Your total fanbase is counted from your public profiles.",
  },
  {
    step: "04",
    title: "Put one link in bio",
    text: "Share inflixo.com/yourname everywhere. One link for your fans, and one for brands.",
  },
];

const COMPARISON = [
  { regular: "A list of buttons", inflixo: "A profile that feels like your own channel" },
  { regular: "Videos scattered across apps", inflixo: "Series with seasons & episodes, in order" },
  { regular: "Follower counts on separate apps", inflixo: "One combined fanbase number (IG + YT + FB)" },
  { regular: "Collab proof hidden in DMs", inflixo: "Brand reviews & collab packages on your page" },
  { regular: "\"Which camera?\" answered 100 times", inflixo: "A \"My Setup\" list fans can browse" },
  { regular: "Built for everyone", inflixo: "Built for Indian video creators" },
];

const FOUNDING_BENEFITS = [
  {
    icon: Award,
    title: "Founding Creator badge",
    text: "A permanent badge on your profile.",
  },
  {
    icon: MessageSquare,
    title: "Shape what we build",
    text: "Direct line to the founder for feature requests.",
  },
  {
    icon: Ticket,
    title: "First in line for Summit 2027",
    text: "Priority invite to the Inflixo Creator Summit.",
  },
];

export interface CreatorTestimonial {
  name: string;
  handle: string;
  niche: string;
  avatar?: string;
  followers?: string;
  quote: string;
  disclosure: string;
}

/** Testimonials list. If empty, the entire testimonials section is hidden. */
export const CREATOR_TESTIMONIALS: CreatorTestimonial[] = [];

const PILLARS = [
  {
    icon: Film,
    title: "Video Series & Episodes",
    text: "Organise your videos into seasons and episodes, so a new fan can start at Part 1 and binge the whole story, like a show.",
  },
  {
    icon: Users,
    title: "Your Total Fanbase, One Number",
    text: "Inflixo reads your publicly available follower counts from Instagram, YouTube and Facebook and adds them up. Fans see how big your family is, and brands can see your full reach at a glance.",
  },
  {
    icon: Ticket,
    title: "Tour, Tickets & Show Links",
    text: "Doing a tour, a live show or a meet-up? Add your schedule, ticket links and event pages so fans can find them long after your story disappears.",
  },
  {
    icon: Link2,
    title: "All Your Accounts & Links",
    text: "Second account, podcast, WhatsApp channel, website: keep every link that matters to your fans in one organised place.",
  },
  {
    icon: Star,
    title: "Brand Reviews",
    text: "Every collab you finish can become proof for the next one. Show what brands said about working with you, so new brands can trust you faster.",
  },
  {
    icon: Briefcase,
    title: "Collab Packages & Rate Cards",
    text: "Show your sponsorship packages and deliverables, publicly or privately, so brands can understand how to work with you and reach out directly.",
  },
  {
    icon: Laptop,
    title: "My Setup: Gear & Software",
    text: "Stop answering the same DM. List your camera, mic, lights and editing apps, and add affiliate links if you like. Digital downloads like presets and guides can go in your Creator Shop too.",
  },
  {
    icon: Play,
    title: "Views Stay on Your Platforms",
    text: "Videos open on your original YouTube, Instagram or Facebook post, so watch time, likes and comments count where they matter.",
  },
];

const FAQS = [
  {
    q: "Do my fans need an app or account to watch?",
    a: "No. Anyone can open your Inflixo link in any mobile or desktop browser, with no signup or app.",
  },
  {
    q: "Does Inflixo host or re-upload my videos?",
    a: "No. You paste links to your existing YouTube, Instagram or Facebook videos. Inflixo organises them; your videos stay on your channels.",
  },
  {
    q: "Will my YouTube or Instagram views be affected?",
    a: "Videos open on your original post, so views, likes and comments are counted on your platform, not on Inflixo.",
  },
  {
    q: "How is my total fanbase calculated?",
    a: "Inflixo reads the publicly visible follower or subscriber counts on the Instagram, YouTube and Facebook profiles you add, and shows them together as one number. You can see the per-platform breakdown, and refresh it anytime from your dashboard.",
  },
  {
    q: "Can I add tour dates, show tickets or event links?",
    a: "Yes. Add any link (ticket pages, tour schedules, event pages, other accounts) and arrange them in the order you want.",
  },
  {
    q: "Can I create multiple series with seasons & episodes?",
    a: "Yes. Create multiple series, split them into seasons, and arrange episodes in the exact order fans should watch them.",
  },
  {
    q: "How do brand reviews work?",
    a: "After a collab, you can add a review from the brand to your page. Reviews show on your Collab tab so new brands can see your past work.",
  },
  {
    q: "Can I keep my collab packages private?",
    a: "Yes. You can show packages publicly, or keep them private and share them only with brands that reach out.",
  },
  {
    q: "What is \"My Setup\"?",
    a: "It's a list of the camera, mic, lights, apps and software you use, so fans stop asking in DMs. You can add affiliate links or digital products like presets and guides.",
  },
  {
    q: "Can my manager or editor help run my page?",
    a: `Yes. The ${PLANS.vip.name} plan includes ${PLANS.vip.limits.teamSeats} team seats, so your team can update series, links and collabs for you.`,
  },
];

// Plan cards list their limits straight from config/plans.ts.
const TRIAL_FEATURES = planFeatureLines("trial");
const PRO_FEATURES = [...planFeatureLines("pro"), "Cancel anytime, no lock-in"];
const VIP_FEATURES = [...planFeatureLines("vip"), "Cancel anytime, no lock-in"];

const GROWING_BULLETS = [
  "Turn new viewers into bingers with ordered series",
  "Show your combined fanbase across every platform",
  "Start collecting brand reviews from your very first collab",
  "Answer \"which camera?\" once, with your setup page",
];

const ESTABLISHED_BULLETS = [
  "Promote tours, live shows and ticket links in one place",
  "Show brand reviews and collab packages to new brands",
  "Share your total reach across Instagram, YouTube and Facebook",
  "Add your manager or editor with team seats (VIP)",
];

function cleanHandle(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function SectionHeading({
  eyebrow,
  title,
  sub,
  light = false,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-2 text-center">
      <p className={`text-[12px] font-bold uppercase tracking-wider ${light ? "text-white/70" : "text-[#7A2253]"}`}>
        {eyebrow}
      </p>
      <h2
        className={`text-[32px] sm:text-[48px] font-extrabold leading-tight tracking-tight ${
          light ? "text-white" : "text-[#18181B]"
        }`}
      >
        {title}
      </h2>
      {sub && <p className={`text-[16px] ${light ? "text-white/90" : "text-[#52525B]"}`}>{sub}</p>}
    </div>
  );
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
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
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
      : LANDING_DEMO_SOCIALS;
  }, [previewHandle, username]);

  // Combined fanbase shown in the demo header (IG + YT + FB)
  const previewTotalFans =
    (previewSocials.instagram?.followers || 0) +
    (previewSocials.youtube?.subscribers || 0) +
    (previewSocials.facebook?.followers || 0);

  const navClass = (id: string) =>
    `text-[14px] font-semibold transition-colors ${
      activeNav === id ? "text-[#7A2253]" : "text-[#52525B] hover:text-[#18181B]"
    }`;

  const primaryBtn =
    "inline-flex h-11 items-center justify-center rounded-xl bg-[#7A2253] hover:bg-[#631841] px-5 text-[14px] font-bold text-white shadow-md shadow-[#7A2253]/25 transition-all";
  const outlineBtn =
    "inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#E4E4E7] bg-white text-[14px] font-bold text-[#18181B] hover:bg-[#fdf2f8] hover:border-[#7A2253] transition-colors cursor-pointer";

  if (checkingAuth && isLoggedIn) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FFFCFB]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#7A2253] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="landing-scope min-h-dvh overflow-x-hidden antialiased selection:bg-[#F7EDEF] selection:text-[#7A2253]">
      {/* Target for Top scroll */}
      <div id="top" className="absolute top-0 h-px w-px" />

      {/* ── HEADER / NAVIGATION ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#E4E4E7] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
          <Logo size="sm" />

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-5 lg:gap-6 md:flex" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => (
              <a key={link.id} href={link.href} className={navClass(link.id)}>
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/login"
              className="text-[14px] font-semibold text-[#52525B] hover:text-[#18181B] transition-colors"
            >
              Log in
            </Link>
            <Link href="/login" className={primaryBtn}>
              <span>Claim your link</span>
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
              {NAV_LINKS.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[16px] font-semibold text-[#18181B] py-1"
                >
                  {link.label}
                </a>
              ))}
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
                  className={`${primaryBtn} w-full`}
                >
                  Claim your link
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
              Your Part 1 is buried under 200 reels. Inflixo turns your YouTube, Instagram &amp; Facebook videos into bingeable series, and brings your links, total fanbase, brand reviews and creator setup into one link in bio.
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
          <p className="mt-2.5 text-[12px] text-[#71717A]">
            Takes 2 minutes. Your fans don&apos;t need any app or signup.
          </p>

          {/* Trust Highlights Row */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-semibold text-[#52525B]">
            {HERO_CHECKS.map((item) => (
              <span key={item}>✓ {item}</span>
            ))}
          </div>

          {/* Made in India Badge */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E4E4E7] bg-white px-4 py-2 text-[14px] font-semibold text-[#18181B] shadow-xs">
              <span className="text-base" role="img" aria-label="Indian Flag">🇮🇳</span>
              <span>Made in India, by a creator, for creators</span>
            </div>
          </div>

          {/* What you can do strip */}
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-xs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 divide-y divide-zinc-100 sm:divide-y-0 sm:divide-x sm:divide-zinc-100">
              {HERO_STRIP.map((item, i) => (
                <div key={item.big} className={`sm:px-3 text-center ${i === 0 ? "pt-2 sm:pt-0" : "pt-4 sm:pt-0"}`}>
                  <p className="text-[24px] font-extrabold text-[#7A2253]">{item.big}</p>
                  <p className="text-[14px] font-bold text-[#18181B]">{item.label}</p>
                  <p className="text-[12px] text-[#52525B]">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM SECTION (`#problem`) ── */}
      <section id="problem" className="scroll-mt-24 border-t border-[#E4E4E7] bg-[#FFFCFB] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Creator Problems"
            title="Your content is great. Finding it shouldn't be hard."
            sub="Every creator we spoke to has at least three of these problems."
          />

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS.map((problem) => (
              <div
                key={problem.title}
                className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xs hover:border-[#7A2253] transition-colors"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7EDEF] text-[#7A2253]">
                  <problem.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[18px] font-bold text-[#18181B]">{problem.title}</h3>
                <p className="mt-2 text-[14px] text-[#52525B] leading-relaxed">{problem.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-[18px] sm:text-[20px] font-bold text-[#7A2253]">
            Inflixo is built to solve all six, in one link.
          </p>
        </div>
      </section>

      {/* ── OUR STORY SECTION (`#our-story`) ── */}
      <section id="our-story" className="scroll-mt-24 border-t border-[#E4E4E7] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="mx-auto max-w-[640px] text-left">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#7A2253]">Our Story</p>
            <h2 className="mt-2 text-[32px] sm:text-[44px] font-extrabold leading-tight tracking-tight text-[#18181B]">
              Your fans want Part 2. They just can&apos;t find it.
            </h2>

            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-[#52525B]">
              <p>
                Before building Inflixo, we sat down with creators across India — food vloggers, comedians, educators, travellers. Almost all of them already had a link-in-bio tool. And almost all of them said the same thing: &ldquo;Our videos get lost.&rdquo;
              </p>
              <p>
                Here&apos;s what happens. A viewer is scrolling Instagram, YouTube or Facebook. Your Part 3 shows up in their feed. They love it. They open your profile to find Part 1 or Part 4… and can&apos;t. Five minutes later they leave — or DM you, and the DM gets buried too. A potential fan, lost.
              </p>
            </div>

            {/* Pull Quote */}
            <div className="my-8 border-l-4 border-[#7A2253] bg-[#F7EDEF]/50 py-4 pl-5 pr-4 rounded-r-xl">
              <p className="text-[20px] sm:text-[24px] font-extrabold text-[#7A2253] leading-snug tracking-tight">
                &ldquo;Great content shouldn&apos;t get lost in the feed.&rdquo;
              </p>
            </div>

            <p className="text-[16px] leading-relaxed text-[#52525B]">
              So we built Inflixo: one link where your series play in order, like a show. When fans can easily binge your work, viewers become fans — and fans become your biggest supporters.
            </p>

            {/* Founder Avatar & Name */}
            <div className="mt-8 pt-6 border-t border-[#E4E4E7] flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7A2253] text-white font-bold text-sm shadow-xs select-none">
                D
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#18181B] leading-tight">Devom</p>
                <p className="text-[12px] font-medium text-[#71717A]">Founder, Inflixo</p>
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
            {username.trim() ? `See @${previewHandle}'s Live Profile` : "This is what your fans will see."}
          </h2>
          <p className="mt-2 text-[16px] text-[#52525B] max-w-xl mx-auto">
            Ordered series, your total fanbase, tour &amp; ticket links, your gear setup and brand reviews, all on one page that feels like your own channel.
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
                series={LANDING_DEMO_SERIES}
                customLinks={LANDING_DEMO_LINKS}
                mediaKitPackages={LANDING_DEMO_GIGS}
                reviews={LANDING_DEMO_REVIEWS}
                products={LANDING_DEMO_PRODUCTS}
                setupItems={LANDING_DEMO_SETUP}
                totalAudience={previewTotalFans}
                themeKey={EXPERT_DEMO_THEME}
                variant="full"
                seriesOpenMode="internal"
                landingDemo
              />
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Link href="/demo_creator" className={primaryBtn}>
              View full demo profile →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS SECTION (`#how-it-works`) ── */}
      <section id="how-it-works" className="scroll-mt-24 border-t border-[#E4E4E7] bg-[#FFFCFB] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#7A2253]">Simple Process</p>
              <h2 className="mt-2 text-[32px] sm:text-[48px] font-extrabold leading-tight tracking-tight text-[#18181B]">
                Set up your creator home in 4 simple steps.
              </h2>
              <p className="mt-3 text-[16px] text-[#52525B]">
                No re-uploading. No tech skills. Paste, arrange, share.
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
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-[18px] font-bold text-[#18181B]">{step.title}</h3>
                    <p className="text-[14px] text-[#52525B] leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY INFLIXO (`#why-inflixo`) ── */}
      <section id="why-inflixo" className="scroll-mt-24 border-t border-[#E4E4E7] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Why Inflixo"
            title="Other bio links show buttons. Inflixo shows your story."
          />

          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-[#E4E4E7] shadow-xs">
            <div className="grid grid-cols-2">
              <div className="bg-zinc-100 px-3 py-3 text-[12px] font-bold uppercase tracking-wider text-zinc-500 sm:px-6 sm:text-[13px]">
                A regular link in bio
              </div>
              <div className="bg-[#7A2253] px-3 py-3 text-[12px] font-bold uppercase tracking-wider text-white sm:px-6 sm:text-[13px]">
                Inflixo
              </div>
            </div>
            {COMPARISON.map((row) => (
              <div key={row.inflixo} className="grid grid-cols-2">
                <div className="flex items-start gap-2 border-t border-[#E4E4E7] bg-zinc-50 px-3 py-4 text-[13px] leading-snug text-zinc-500 sm:px-6 sm:text-[14px]">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <span>{row.regular}</span>
                </div>
                <div className="flex items-start gap-2 border-t border-white/15 bg-[#7A2253] px-3 py-4 text-[13px] font-semibold leading-snug text-white sm:px-6 sm:text-[14px]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                  <span>{row.inflixo}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-[16px] sm:text-[18px] font-bold text-[#18181B]">
            Your fans don&apos;t just want your links. They want your journey.
          </p>
        </div>
      </section>

      {/* ── CREATOR TOOLS / PILLARS (`#features`) ── */}
      <section id="features" className="scroll-mt-24 border-t border-[#E4E4E7] bg-[#FFFCFB] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Creator Tools"
            title="Everything your fans and brands look for, in one place."
            sub="Built around how Indian creators actually work: series, shows, collabs and a lot of DMs."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* ── FOR EVERY CREATOR (`#for-creators`) ── */}
      <section id="for-creators" className="scroll-mt-24 border-t border-[#E4E4E7] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading eyebrow="For Every Creator" title="Whether you have 1K fans or 1M." />

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Card A: Growing creators */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between sm:p-8">
              <div>
                <span className="inline-flex rounded-full bg-[#F7EDEF] px-3 py-1 text-[12px] font-bold text-[#7A2253]">
                  Growing creators (1K–50K)
                </span>
                <h3 className="mt-4 text-[24px] font-bold text-[#18181B]">Look like a pro before you&apos;re big.</h3>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {GROWING_BULLETS.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#7A2253] mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleClaim(username)}
                className={`${primaryBtn} mt-8 w-full cursor-pointer`}
              >
                Claim your link
              </button>
            </div>

            {/* Card B: Established creators */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between sm:p-8">
              <div>
                <span className="inline-flex rounded-full bg-[#F7EDEF] px-3 py-1 text-[12px] font-bold text-[#7A2253]">
                  Established creators (100K+)
                </span>
                <h3 className="mt-4 text-[24px] font-bold text-[#18181B]">Run your creator business from one link.</h3>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {ESTABLISHED_BULLETS.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#7A2253] mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a href="#pricing" className={`${outlineBtn} mt-8`}>
                See VIP plan
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDING CREATORS SECTION (`#founding`) ── */}
      <section id="founding" className="scroll-mt-24 border-t border-[#E4E4E7] bg-[#FFFCFB] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Founding Creators"
            title="Be one of the first 1,000."
            sub="Inflixo is new — and that's your advantage. Founding creators help shape the product and get recognised for it."
          />

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FOUNDING_BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between hover:border-[#7A2253] transition-colors"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7EDEF] text-[#7A2253]">
                    <benefit.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-[18px] font-bold text-[#18181B]">{benefit.title}</h3>
                  <p className="mt-2 text-[14px] text-[#52525B] leading-relaxed">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <button
              onClick={() => handleClaim(username)}
              className={`${primaryBtn} cursor-pointer`}
            >
              Become a Founding Creator
            </button>
          </div>
        </div>
      </section>

      {/* ── WHAT CREATORS SAY (`#testimonials`) ── */}
      {CREATOR_TESTIMONIALS.length > 0 && (
        <section id="testimonials" className="scroll-mt-24 border-t border-[#E4E4E7] bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
            <SectionHeading
              eyebrow="What Creators Say"
              title="Loved by creators who build series."
              sub="Here's what early creators have to say about Inflixo."
            />

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CREATOR_TESTIMONIALS.map((t) => (
                <div
                  key={t.handle}
                  className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between hover:border-[#7A2253] transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {t.avatar ? (
                        <Image
                          src={t.avatar}
                          alt={t.name}
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-full object-cover border border-[#E4E4E7]"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#7A2253] text-white font-bold text-sm select-none">
                          {t.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-[#18181B]">{t.name}</p>
                        <p className="truncate text-[12px] text-[#71717A]">
                          @{t.handle.replace(/^@/, "")} {t.niche ? `· ${t.niche}` : ""}
                        </p>
                      </div>
                      {t.followers && (
                        <span className="shrink-0 rounded-full bg-[#F7EDEF] px-2 py-0.5 text-[11px] font-bold text-[#7A2253]">
                          {t.followers}
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] leading-relaxed text-[#52525B] italic">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>
                  {t.disclosure && (
                    <p className="mt-4 pt-3 border-t border-[#E4E4E7] text-[11px] text-[#A1A1AA]">
                      {t.disclosure}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CREATOR SUMMIT 2027 VISION (`#summit`) ── */}
      <section id="summit" className="scroll-mt-24 border-t border-[#E4E4E7] bg-[#7A2253] py-16 sm:py-24 text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p className="text-[12px] font-bold uppercase tracking-wider text-white/70">Our Vision</p>
          <h2 className="mt-2 text-[32px] sm:text-[48px] font-extrabold leading-tight tracking-tight text-white">
            Made by a creator, for creators.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-white/90">
            Inflixo wasn&apos;t built in a boardroom. It was built by a creator who faced the same problems you do: scattered series, endless DMs, and no single place to show the work. It&apos;s our way of supporting the Indian creator industry, one creator at a time.
          </p>

          <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-6 text-left sm:p-8">
            <h3 className="text-[24px] sm:text-[32px] font-extrabold tracking-tight text-white">
              Inflixo Creator Summit 2027
            </h3>
            <p className="mt-3 text-[16px] leading-relaxed text-white/90">
              Our dream: bring <strong className="font-bold text-white">10,000 Indian creators</strong> together in one place in 2027 to learn, collaborate and grow together. Every creator who builds their home on Inflixo is part of that journey.
            </p>

            {/* Road to 10,000 creators: static illustration, no live count */}
            <div className="mt-6" role="img" aria-label="Road to 10,000 creators">
              <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-wider text-white/70">
                <span>Road to 10,000 creators</span>
                <span>10,000</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full bg-white" />
                <span className="h-0 flex-1 border-t-2 border-dashed border-white/40" />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#7A2253]">
                  <Users className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[12px] text-white/70">
                <span>Your first step</span>
                <span>The vision</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => handleClaim(username)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[14px] font-bold text-[#7A2253] shadow-md hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Be part of the journey →
            </button>
            <a
              href="https://instagram.com/inflixo_app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-semibold text-white underline underline-offset-4 hover:no-underline"
            >
              Follow updates on Instagram @inflixo_app
            </a>
          </div>
        </div>
      </section>

      {/* ── PRICING SECTION (`#pricing`) ── */}
      <section id="pricing" className="scroll-mt-24 border-t border-[#E4E4E7] bg-[#FFFCFB] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#7A2253]">Simple Pricing</p>
            <h2 className="text-[32px] sm:text-[48px] font-extrabold leading-tight tracking-tight text-[#18181B]">
              Pick a plan that grows with you.
            </h2>
            <p className="text-[16px] text-[#52525B]">
              Plans designed for Indian creators, priced less than a cup of chai a day.
            </p>
            <div className="mx-auto mt-6 max-w-full rounded-full bg-[#7A2253]/10 border border-[#7A2253]/20 px-4 py-1.5 text-center text-[12px] font-bold text-[#7A2253]">
              💡 Series-first · Cancel anytime · Built for Indian creators
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Plan 1: 7-Day Trial */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-[24px] font-bold text-[#18181B]">7-Day Trial</h3>
                <p className="mt-1 text-[14px] text-[#52525B]">Set up your page and see how fans react before choosing a plan.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-[48px] font-extrabold text-[#18181B]">{PLANS.trial.trialDays} days</span>
                </div>
                <p className="text-[12px] font-semibold text-[#7A2253]">Try Inflixo with your real profile</p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {TRIAL_FEATURES.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#7A2253] mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => handleClaim(username)} className={`${outlineBtn} mt-8`}>
                Start {PLANS.trial.trialDays}-day trial
              </button>
            </div>

            {/* Plan 2: Pro (Recommended) */}
            <div className="relative rounded-2xl border-2 border-[#7A2253] bg-white p-6 shadow-sm flex flex-col justify-between">
              <span className="absolute -top-3.5 right-6 rounded-full bg-[#7A2253] px-3 py-0.5 text-[12px] font-bold text-white uppercase tracking-wider">
                Popular
              </span>
              <div>
                <h3 className="text-[24px] font-bold text-[#18181B]">Pro</h3>
                <p className="mt-1 text-[14px] text-[#52525B]">For active creators publishing series and working with brands.</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-[48px] font-extrabold text-[#18181B]">
                    {formatPlanPrice("pro", "monthly", pricingCurrency)}
                  </span>
                  <span className="text-[14px] text-[#52525B]">/ month</span>
                </div>
                <p className="text-[12px] font-semibold text-[#7A2253]">Or {formatPlanPrice("pro", "yearly", pricingCurrency)}/year (Save {yearlySavingsPercent("pro", pricingCurrency)}%)</p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {PRO_FEATURES.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#7A2253] mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleClaim(username)}
                className={`${primaryBtn} mt-8 w-full cursor-pointer`}
              >
                Claim your link
              </button>
            </div>

            {/* Plan 3: VIP */}
            <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-[24px] font-bold text-[#18181B]">VIP</h3>
                <p className="mt-1 text-[14px] text-[#52525B]">For top creators, touring artists and creator teams.</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-[48px] font-extrabold text-[#18181B]">
                    {formatPlanPrice("vip", "monthly", pricingCurrency)}
                  </span>
                  <span className="text-[14px] text-[#52525B]">/ month</span>
                </div>
                <p className="text-[12px] font-semibold text-[#7A2253]">Or {formatPlanPrice("vip", "yearly", pricingCurrency)}/year (Save {yearlySavingsPercent("vip", pricingCurrency)}%)</p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {VIP_FEATURES.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#7A2253] mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => handleClaim(username)} className={`${outlineBtn} mt-8`}>
                Claim your link
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
            Your journey deserves one home.
          </h2>
          <p className="text-[16px] text-white/90 max-w-xl mx-auto leading-relaxed">
            Organise your series, show your total fanbase, share your tour &amp; collab links, and let fans see the creator behind the content. Claim your link in 2 minutes.
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleClaim(username)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-[14px] font-bold text-[#7A2253] shadow-md hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <span>Claim your link</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 text-[12px] text-white/80">
              Join the road to the Inflixo Creator Summit 2027 🇮🇳
            </p>
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
                Made by a creator, for creators. Supporting India&apos;s creator industry.
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
                <li><a href="#features" className="hover:text-[#7A2253] transition-colors">Creator Tools</a></li>
                <li><a href="#pricing" className="hover:text-[#7A2253] transition-colors">Pricing</a></li>
                <li><a href="#summit" className="hover:text-[#7A2253] transition-colors">Summit 2027</a></li>
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
