"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Briefcase,
  Check,
  Film,
  Laptop,
  Link2,
  Menu,
  MessageCircle,
  Minus,
  Palette,
  Play,
  Plus,
  ShoppingBag,
  SkipForward,
  Star,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { HeroPhoneMockup } from "@/components/landing/HeroPhoneMockup";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { CreatorProfile, SocialAccounts, type ThemeKey } from "@/types";
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

/** The embedded demo uses Inflixo's own light maroon theme, matching the landing page. */
const LANDING_DEMO_THEME: ThemeKey = EXPERT_DEMO_THEME;

const NAV_LINKS = [
  { id: "story", href: "#story", label: "Why Inflixo" },
  { id: "series", href: "#series", label: "Series" },
  { id: "compare", href: "#compare", label: "Compare" },
  { id: "pricing", href: "#pricing", label: "Pricing" },
  { id: "faq", href: "#faq", label: "FAQ" },
];

const SECTION_IDS = ["top", "story", "series", "demo", "compare", "features", "pricing", "summit", "faq"];

/** Illustrative only (labelled "Example" on the page): how views fall part by part when fans can't find the next one. */
const VIEW_DROP = [
  { part: "Part 1", views: "1.2M", pct: 100 },
  { part: "Part 2", views: "310K", pct: 26 },
  { part: "Part 3", views: "96K", pct: 8 },
  { part: "Part 4", views: "41K", pct: 4 },
];

const FAN_COMMENTS = [
  { name: "rohit_22", text: "Bhai Part 2 kahan hai? 😭" },
  { name: "sneha.vlogs", text: "Profile pe dhoondha, mila hi nahi" },
  { name: "foodie_ankit", text: "Part 1 ka link do please" },
];

const STORY_STEPS = [
  {
    n: "1",
    title: "You make a series.",
    text: "Part 1, Part 2, Part 3… One story told across many videos.",
  },
  {
    n: "2",
    title: "Part 1 blows up. Part 2 doesn't.",
    text: "Fans love Part 1, but the next parts get a fraction of the views.",
  },
  {
    n: "3",
    title: "\"Part 2 kahan hai?\"",
    text: "Fans search your profile, scroll through 200 reels, give up, and comment instead.",
  },
];

const OTT_POINTS = [
  { icon: Film, title: "Every part, in order", text: "Season, episodes, cover and language, like a show on an OTT app." },
  { icon: Play, title: "Start from Ep 1", text: "New fans always begin at the start of the story, not the middle." },
  { icon: SkipForward, title: "Next episode, one tap", text: "Finished Part 1? Part 2 is right there. No searching." },
  { icon: BarChart3, title: "Views stay on your platform", text: "Videos open on YouTube, Instagram or Facebook, so every view counts there." },
];

const HOW_STEPS = [
  { n: "01", title: "Paste your video links", text: "From YouTube, Instagram or Facebook. Nothing is re-uploaded." },
  { n: "02", title: "Arrange them as a series", text: "Put the parts in order and add a name and cover." },
  { n: "03", title: "Put one link in bio", text: "Share inflixo.com/yourname. Fans binge from Part 1." },
];

const COMPARISON = [
  { other: "A list of buttons", inflixo: "Your series, shown like an OTT show" },
  { other: "Part 2 is just one more link", inflixo: "Episodes in order, with \"Start from Ep 1\"" },
  { other: "Fans leave after one video", inflixo: "Next episode is one tap away" },
  { other: "Same template for everyone", inflixo: "Desi themes made for Indian creators" },
  { other: "Followers split across apps", inflixo: "One total fanbase: IG + YT + FB" },
  { other: "Brand deals lost in DMs", inflixo: "Media kit, packages and brand reviews" },
  { other: "No idea which video fans want", inflixo: "Opens and clicks for every episode" },
];

const MORE_FEATURES = [
  { icon: Link2, label: "Links & folders" },
  { icon: ShoppingBag, label: "Shop, 0% cut" },
  { icon: Briefcase, label: "Media kit & packages" },
  { icon: Star, label: "Brand reviews" },
  { icon: Laptop, label: "My Setup (gear)" },
  { icon: BarChart3, label: "Click analytics" },
  { icon: Palette, label: "Desi themes" },
  { icon: Users, label: "Total fanbase" },
];

const FAQS = [
  {
    q: "Is the trial free? Do I need a card?",
    a: `Yes, the ${PLANS.trial.trialDays}-day trial is free and needs no card or UPI. Set up your real page first and decide later.`,
  },
  {
    q: "Does Inflixo re-upload my videos?",
    a: "No. You paste links to your existing YouTube, Instagram or Facebook videos. Inflixo organises them; your videos stay on your channels.",
  },
  {
    q: "Will my YouTube or Instagram views be affected?",
    a: "Videos open on your original post, so views, likes and comments are counted on your platform, not on Inflixo.",
  },
  {
    q: "I already use another link in bio. How do I switch?",
    a: "Sign up, add your videos and links (paste the same links you already use), then replace the link in your Instagram and YouTube bio with inflixo.com/yourname. Most creators finish in a few minutes.",
  },
  {
    q: "Do my fans need an app or account?",
    a: "No. Anyone can open your Inflixo link in any mobile or desktop browser, with no signup or app.",
  },
  {
    q: "Can I see which episodes fans open?",
    a: "Yes. Your dashboard shows series opens and clicks on every episode, link, product and gear item, plus views and requests on your collab packages.",
  },
  {
    q: "What happens when my trial ends?",
    a: "Your public page goes private, but nothing is deleted. Your series, links and settings stay saved, and your page goes live again as soon as you pick a plan.",
  },
  {
    q: "Does Inflixo take a cut from my shop?",
    a: "No. Shop and gear items link to your own store or affiliate link, so buyers pay you directly. Inflixo only charges the plan price.",
  },
];

// Plan cards list their limits straight from config/plans.ts.
const TRIAL_FEATURES = planFeatureLines("trial");
const PRO_FEATURES = [...planFeatureLines("pro"), "Cancel anytime, no lock-in"];
const VIP_FEATURES = [...planFeatureLines("vip"), "Cancel anytime, no lock-in"];

function cleanHandle(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function SectionHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7A2253]">{eyebrow}</p>
      <h2 className="text-[30px] font-extrabold leading-tight tracking-tight text-[#18181B] sm:text-[44px]">{title}</h2>
      {sub && <p className="text-[16px] leading-relaxed text-[#52525B]">{sub}</p>}
    </div>
  );
}

/** Hero visual: the creator's real problem, views falling part by part, and the comments that follow. */
function ViewDropCard() {
  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="rounded-2xl border border-[#EFE3EA] bg-white p-5 shadow-xl shadow-black/5">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-bold text-[#18181B]">Your 4-part series</p>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
            Example
          </span>
        </div>
        <ul className="mt-4 space-y-3">
          {VIEW_DROP.map((row, i) => (
            <li key={row.part} className="grid grid-cols-[52px_1fr_44px] items-center gap-3">
              <span className="text-[12px] font-semibold text-[#52525B]">{row.part}</span>
              <span className="h-3 rounded-full bg-zinc-100">
                <span
                  className={`block h-3 rounded-full ${i === 0 ? "bg-[#7A2253]" : "bg-[#7A2253]/35"}`}
                  style={{ width: `${Math.max(row.pct, 3)}%` }}
                />
              </span>
              <span className="text-right text-[12px] font-bold text-[#18181B]">{row.views}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center gap-1.5 text-[12px] font-semibold text-rose-600">
          <ArrowDownRight className="h-4 w-4" />
          Part 2 lost most of the audience
        </p>
      </div>

      <div className="mt-3 space-y-2 pl-6 sm:pl-12">
        {FAN_COMMENTS.map((c) => (
          <div key={c.name} className="flex items-start gap-2 rounded-xl border border-[#EFE3EA] bg-white px-3 py-2 shadow-md shadow-black/5">
            <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7A2253]/50" />
            <p className="text-[12px] leading-snug text-[#18181B]">
              <span className="font-bold">{c.name}</span> {c.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingHomePage() {
  const router = useRouter();
  const pricingCurrency = usePricingCurrency();
  // Logged-in visitors are sent to the app. Read in an effect (not during render) so server and client HTML match.
  const [redirecting, setRedirecting] = useState(false);
  const [username, setUsername] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("top");

  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (AuthService.isLoggedIn()) {
      setRedirecting(true);
      router.replace(OnboardingService.getStep() === "finish" ? "/dashboard" : "/onboarding");
    }
  }, [router]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      // Active nav: the last section whose top has passed 35% of the viewport.
      const line = window.innerHeight * 0.35;
      let current = "top";
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActiveNav(current);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide Back to Top over the footer
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    if (footerRef.current) {
      const footerObserver = new IntersectionObserver((entries) => entries.forEach((e) => setFooterInView(e.isIntersecting)), {
        threshold: 0.1,
      });
      footerObserver.observe(footerRef.current);
      observers.push(footerObserver);
    }
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) setMobileMenuOpen(false);
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

  const previewTotalFans =
    (previewSocials.instagram?.followers || 0) +
    (previewSocials.youtube?.subscribers || 0) +
    (previewSocials.facebook?.followers || 0);

  const navClass = (id: string) =>
    `text-[14px] font-semibold transition-colors ${activeNav === id ? "text-[#7A2253]" : "text-[#71717A] hover:text-[#18181B]"}`;

  const primaryBtn =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A2253] px-5 text-[14px] font-bold text-white transition-colors hover:bg-[#631841] cursor-pointer";
  const outlineBtn =
    "inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#EFE3EA] bg-white text-[14px] font-bold text-[#18181B] transition-colors hover:border-[#7A2253] cursor-pointer";

  if (redirecting) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#7A2253] border-t-transparent" />
      </div>
    );
  }

  const claimForm = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleClaim(username);
      }}
      className="flex w-full max-w-md items-center rounded-xl border border-[#EFE3EA] bg-white p-1.5 shadow-sm transition-all focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/15"
    >
      <span className="shrink-0 pl-3 text-[14px] font-semibold text-[#71717A]">inflixo.com/</span>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="yourname"
        aria-label="Your desired handle"
        className="min-w-0 flex-1 bg-transparent px-2 text-[14px] font-semibold text-[#18181B] outline-none placeholder:text-zinc-400"
      />
      <button type="submit" className={`${primaryBtn} shrink-0`}>
        <span>Claim</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );

  return (
    <div className="landing-scope min-h-dvh overflow-x-hidden bg-white antialiased selection:bg-[#F7EDF2] selection:text-[#7A2253]">
      <div id="top" className="absolute top-0 h-px w-px" />

      {/* ── HEADER ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#EFE3EA] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
          <Logo size="lg" showIcon={false} />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => (
              <a key={link.id} href={link.href} className={navClass(link.id)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/login" className="text-[14px] font-semibold text-[#52525B] transition-colors hover:text-[#18181B]">
              Log in
            </Link>
            <Link href="/login" className={primaryBtn}>
              Claim your link
            </Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/login" className="px-2 py-1 text-[14px] font-semibold text-[#52525B]">
              Log in
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EFE3EA] text-[#18181B] hover:bg-zinc-50"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-b border-[#EFE3EA] bg-white px-4 py-6 md:hidden">
            <nav className="flex flex-col gap-4" aria-label="Mobile Navigation">
              {NAV_LINKS.map((link) => (
                <a key={link.id} href={link.href} onClick={() => setMobileMenuOpen(false)} className="py-1 text-[16px] font-semibold text-[#18181B]">
                  {link.label}
                </a>
              ))}
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={`${primaryBtn} mt-2 w-full`}>
                Claim your link
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── HERO: the creator's problem ── */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="min-w-0 text-center lg:text-left">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#EFE3EA] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#18181B]">
              🇮🇳 For creators who make series
            </p>
            <h1 className="landing-text-hero font-extrabold tracking-tight text-[#18181B]">
              Part 1 got the views. <span className="text-[#B98AA5]">Part 2 got lost.</span>
            </h1>
            <p className="landing-text-18 mx-auto mt-5 max-w-xl text-[#52525B] lg:mx-0">
              Your fans didn&apos;t stop caring. They just couldn&apos;t find Part 2. Inflixo puts every part of your series in order, like a show on an OTT app, in one link in bio.
            </p>
            <div className="mt-8 flex justify-center lg:justify-start">{claimForm}</div>
            <p className="mt-3 text-[12px] text-[#71717A]">
              Free for {PLANS.trial.trialDays} days · No card needed · Fans don&apos;t need any app
            </p>
          </div>
          <div>
            <ViewDropCard />
          </div>
        </div>
      </section>

      {/* ── STORY: why views drop ── */}
      <section id="story" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading eyebrow="Sound familiar?" title="Your content isn't the problem. Your grid is." />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STORY_STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-[#EFE3EA] bg-white p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7A2253] text-[14px] font-extrabold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 text-[18px] font-bold text-[#18181B]">{s.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#52525B]">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-[18px] font-bold leading-snug text-[#18181B] sm:text-[20px]">
            Every fan who can&apos;t find the next part is a view you made but never got. We built Inflixo to fix exactly this.
          </p>
        </div>
      </section>

      {/* ── SERIES: OTT-style ── */}
      <section id="series" className="scroll-mt-20 border-t border-[#EFE3EA] bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <HeroPhoneMockup />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7A2253]">The fix</p>
            <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-[#18181B] sm:text-[44px]">
              Your series, like an OTT show.
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-[#52525B]">
              Fans open your link and see your series the way they see a show: a cover, a season, and every episode in order.
            </p>
            <ul className="mt-8 space-y-5">
              {OTT_POINTS.map((p) => (
                <li key={p.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7EDF2] text-[#7A2253]">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-[16px] font-bold text-[#18181B]">{p.title}</span>
                    <span className="block text-[14px] leading-relaxed text-[#52525B]">{p.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-20">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading eyebrow="2 minutes" title="Set up in 3 steps." />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {HOW_STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-[#EFE3EA] bg-white p-6">
                <p className="text-[13px] font-extrabold text-[#7A2253]">{s.n}</p>
                <h3 className="mt-2 text-[18px] font-bold text-[#18181B]">{s.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#52525B]">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ── */}
      <section id="demo" className="scroll-mt-20 border-t border-[#EFE3EA] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 text-center sm:px-6">
          <SectionHeading
            eyebrow="Live demo"
            title={username.trim() ? `This could be @${previewHandle}.` : "See a real creator page."}
            sub="Tap a series to see the episodes in order."
          />
          <div className="mx-auto mt-10 max-w-[620px] rounded-3xl border border-[#EFE3EA] bg-zinc-50 p-2 shadow-sm sm:p-3">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#EFE3EA] bg-white px-3.5 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              </div>
              <span className="text-[12px] font-semibold text-[#52525B]">inflixo.com/{previewHandle}</span>
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
                themeKey={LANDING_DEMO_THEME}
                variant="full"
                layoutMode="premium"
                seriesOpenMode="internal"
                landingDemo
              />
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <Link href="/demo_creator" className={primaryBtn}>
              Open the full demo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPARE: Inflixo vs other link tools ── */}
      <section id="compare" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Inflixo vs other link tools"
            title="Other link tools show buttons. Inflixo shows your series."
            sub="Everything a link-in-bio tool does, plus the one thing creators need most."
          />
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-[#EFE3EA] bg-white">
            <div className="grid grid-cols-2 border-b border-[#EFE3EA] text-[12px] font-bold uppercase tracking-wider sm:text-[13px]">
              <div className="bg-zinc-50 px-3 py-3 text-[#A1A1AA] sm:px-6">Other link tools</div>
              <div className="bg-[#F7EDF2] px-3 py-3 text-[#7A2253] sm:px-6">Inflixo</div>
            </div>
            {COMPARISON.map((row) => (
              <div key={row.inflixo} className="grid grid-cols-2 border-b border-[#F4F4F5] last:border-b-0">
                <div className="flex items-start gap-2 bg-zinc-50 px-3 py-4 text-[13px] leading-snug text-[#A1A1AA] sm:px-6 sm:text-[14px]">
                  <X className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{row.other}</span>
                </div>
                <div className="flex items-start gap-2 px-3 py-4 text-[13px] font-semibold leading-snug text-[#18181B] sm:px-6 sm:text-[14px]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A2253]" />
                  <span>{row.inflixo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AND MORE ── */}
      <section id="features" className="scroll-mt-20 border-t border-[#EFE3EA] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading eyebrow="Aur bhi hai" title="Series first. Everything else, in the same link." />
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {MORE_FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-[#EFE3EA] bg-white px-3.5 py-3">
                <f.icon className="h-4 w-4 shrink-0 text-[#7A2253]" />
                <span className="text-[13px] font-semibold text-[#18181B]">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Pricing"
            title="Less than a cup of chai a day."
            sub={`${PLANS.trial.trialDays}-day free trial · No card needed · Cancel anytime`}
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col justify-between rounded-2xl border border-[#EFE3EA] bg-white p-6">
              <div>
                <h3 className="text-[22px] font-bold text-[#18181B]">Free trial</h3>
                <p className="mt-1 text-[14px] text-[#52525B]">Build your real page and see how fans react.</p>
                <p className="mt-6 text-[44px] font-extrabold leading-none text-[#18181B]">{PLANS.trial.trialDays} days</p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {TRIAL_FEATURES.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A2253]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-6 rounded-lg bg-zinc-50 px-3 py-2 text-[12px] leading-[18px] text-[#52525B]">
                When the trial ends your page goes private, but nothing is deleted. Pick a plan anytime to go live again.
              </p>
              <button onClick={() => handleClaim(username)} className={`${outlineBtn} mt-4`}>
                Start free trial
              </button>
            </div>

            <div className="relative flex flex-col justify-between rounded-2xl border-2 border-[#7A2253] bg-white p-6">
              <span className="absolute -top-3.5 right-6 rounded-full bg-[#7A2253] px-3 py-0.5 text-[12px] font-bold uppercase tracking-wider text-white">
                Popular
              </span>
              <div>
                <h3 className="text-[22px] font-bold text-[#18181B]">Pro</h3>
                <p className="mt-1 text-[14px] text-[#52525B]">For creators publishing series and working with brands.</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-[44px] font-extrabold leading-none text-[#18181B]">{formatPlanPrice("pro", "monthly", pricingCurrency)}</span>
                  <span className="text-[14px] text-[#52525B]">/ month</span>
                </div>
                <p className="mt-1 text-[12px] font-semibold text-[#52525B]">
                  Or {formatPlanPrice("pro", "yearly", pricingCurrency)}/year (save {yearlySavingsPercent("pro", pricingCurrency)}%)
                </p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {PRO_FEATURES.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A2253]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => handleClaim(username)} className={`${primaryBtn} mt-8 w-full`}>
                Claim your link
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-[#EFE3EA] bg-white p-6">
              <div>
                <h3 className="text-[22px] font-bold text-[#18181B]">VIP</h3>
                <p className="mt-1 text-[14px] text-[#52525B]">For top creators, touring artists and teams.</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-[44px] font-extrabold leading-none text-[#18181B]">{formatPlanPrice("vip", "monthly", pricingCurrency)}</span>
                  <span className="text-[14px] text-[#52525B]">/ month</span>
                </div>
                <p className="mt-1 text-[12px] font-semibold text-[#52525B]">
                  Or {formatPlanPrice("vip", "yearly", pricingCurrency)}/year (save {yearlySavingsPercent("vip", pricingCurrency)}%)
                </p>
                <ul className="mt-6 space-y-2.5 text-[14px] text-zinc-700">
                  {VIP_FEATURES.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A2253]" />
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
          <p className="mt-8 text-center text-[13px] text-[#52525B]">
            Pay securely with UPI, cards or netbanking via Razorpay. Cancel anytime, no lock-in.
          </p>
        </div>
      </section>

      {/* ── MADE BY A CREATOR + SUMMIT ── */}
      <section id="summit" className="scroll-mt-20 border-t border-[#EFE3EA] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7A2253]">Made in India 🇮🇳</p>
          <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-[#18181B] sm:text-[44px]">
            Made by a creator, for creators.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#52525B]">
            Inflixo was built by a creator who faced the same thing: great series, lost in the feed. Our goal is to help Indian creators grow, and to bring{" "}
            <strong className="font-bold text-[#18181B]">10,000 creators together at the Inflixo Creator Summit 2027</strong>.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
            <button onClick={() => handleClaim(username)} className={primaryBtn}>
              Join the journey <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="https://instagram.com/inflixo_app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] font-semibold text-[#7A2253] underline underline-offset-4 hover:no-underline"
            >
              Follow @inflixo_app
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Questions creators ask." />
          <div className="mt-10 space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={faq.q} className="overflow-hidden rounded-2xl border border-[#EFE3EA] bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[16px] font-bold text-[#18181B]">{faq.q}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F7EDF2] text-[#7A2253]">
                      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                  </button>
                  {isOpen && <p className="px-5 pb-5 text-[15px] leading-[1.6] text-[#52525B]">{faq.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="border-t border-[#EFE3EA] bg-[#F7EDF2] py-16 text-center text-[#18181B] sm:py-24">
        <div className="mx-auto max-w-2xl space-y-5 px-4 sm:px-6">
          <h2 className="text-[30px] font-extrabold leading-tight tracking-tight sm:text-[44px]">Let fans find Part 2.</h2>
          <p className="text-[16px] leading-relaxed text-[#52525B]">Put your series in order and share one link. It takes 2 minutes.</p>
          <button
            onClick={() => handleClaim(username)}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#7A2253] px-6 text-[14px] font-bold text-white transition-colors hover:bg-[#631841]"
          >
            Claim your link <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-[12px] text-[#71717A]">Free for {PLANS.trial.trialDays} days · No card needed</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer ref={footerRef} className="border-t border-[#EFE3EA] bg-white py-14">
        <div className="mx-auto max-w-[1120px] space-y-10 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <Logo size="sm" />
              <p className="text-[14px] leading-relaxed text-[#52525B]">Your series, like a show. One link in bio.</p>
              <p className="text-[12px] font-semibold text-zinc-500">Made in India 🇮🇳</p>
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#18181B]">Product</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><a href="#series" className="hover:text-[#18181B]">Series</a></li>
                <li><a href="#demo" className="hover:text-[#18181B]">Live demo</a></li>
                <li><a href="#compare" className="hover:text-[#18181B]">Compare</a></li>
                <li><a href="#pricing" className="hover:text-[#18181B]">Pricing</a></li>
                <li><a href="#summit" className="hover:text-[#18181B]">Summit 2027</a></li>
                <li><a href="#faq" className="hover:text-[#18181B]">FAQ</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#18181B]">Company</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><a href="mailto:support@inflixo.com?subject=Inflixo%20Support" className="hover:text-[#18181B]">Contact Support</a></li>
                <li>
                  <a href="https://instagram.com/inflixo_app" target="_blank" rel="noopener noreferrer" className="hover:text-[#18181B]">
                    Instagram (@inflixo_app)
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#18181B]">Legal</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><Link href="/privacy" className="hover:text-[#18181B]">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#18181B]">Terms of Service</Link></li>
                <li><Link href="/creator-terms" className="hover:text-[#18181B]">Creator Terms &amp; Conditions</Link></li>
                <li><Link href="/cookies" className="hover:text-[#18181B]">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#EFE3EA] pt-8 text-[12px] text-[#52525B] sm:flex-row">
            <p>© 2026 Inflixo. All rights reserved.</p>
            <Link href="/login" className="font-medium underline hover:text-[#18181B]">
              Log in to Dashboard
            </Link>
          </div>
        </div>
      </footer>

      {showScrollTop && !footerInView && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#EFE3EA] bg-white text-[#18181B] shadow-md hover:bg-zinc-50"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
