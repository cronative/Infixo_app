"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUp,
  Award,
  Briefcase,
  Check,
  CircleCheck,
  Clapperboard,
  ExternalLink,
  Globe,
  Handshake,
  Laptop,
  Link2,
  Menu,
  MessageCircle,
  Minus,
  Package,
  Palette,
  Play,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Tv,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { HeroPhoneMockup } from "@/components/landing/HeroPhoneMockup";
import { ProfileSectionPreview } from "@/components/landing/ProfileSectionPreview";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { formatPlanPrice, usePricingCurrency } from "@/lib/pricing";
import { PLANS, planFeatureLines, planPrice, yearlySavingsPercent, type PaidPlanKey } from "@/config/plans";

const NAV_LINKS = [
  { id: "series", href: "#series", label: "Series" },
  { id: "features", href: "#features", label: "Features" },
  { id: "pricing", href: "#pricing", label: "Pricing" },
  { id: "summit", href: "#summit", label: "Vision 2027" },
  { id: "faq", href: "#faq", label: "FAQ" },
];

const SECTION_IDS = ["top", "problem", "features", "series", "links", "shop", "brands", "identity", "demo", "how", "pricing", "vision", "summit", "faq"];

// ── 01. The problem ──────────────────────────────────────────
const SCATTERED: { icon: LucideIcon; text: string }[] = [
  { icon: Clapperboard, text: "A follower who discovers Episode 4 may never find Episode 1." },
  { icon: Tv, text: "Someone who loves your travel videos may not know you've made an entire food series." },
  { icon: ShoppingBag, text: "A viewer who wants a product you recommended last month can't find the original link." },
  { icon: Briefcase, text: "A brand that wants to work with you has to visit several platforms to understand your work." },
];

// ── 02. Meet Inflixo ─────────────────────────────────────────
const CAN_DO: { icon: LucideIcon; text: string }[] = [
  { icon: Clapperboard, text: "Organize multiple video series and their episodes" },
  { icon: ShoppingBag, text: "Showcase products you use, love or recommend" },
  { icon: Link2, text: "Keep your important links in one place" },
  { icon: Briefcase, text: "Present your professional media kit" },
  { icon: Package, text: "Display your collaboration packages" },
  { icon: Users, text: "Show your social presence and total fanbase" },
  { icon: Star, text: "Share reviews and feedback" },
  { icon: Handshake, text: "Introduce your creative team" },
  { icon: Laptop, text: "Showcase your creator setup and favorite tools" },
  { icon: Palette, text: "Personalize your profile to reflect your identity" },
];

// ── 05. Shop: the DMs every creator gets ────────────────────
const SHOP_DMS = [
  "Which camera do you use?",
  "Where did you buy that outfit?",
  "Can you share the microphone link?",
  "Which product was in your last video?",
];

// ── 06. Brands ───────────────────────────────────────────────
const BRAND_CARDS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Briefcase,
    title: "Your Media Kit",
    text: "Your creator introduction, social presence, total fanbase, previous collaborations and relevant work, without scattered screenshots and documents.",
  },
  {
    icon: Package,
    title: "Your Collaboration Packages",
    text: "A sponsored Reel, a product showcase, a dedicated video: present package details, deliverables and pricing.",
  },
  {
    icon: Award,
    title: "Your Previous Work",
    text: "Highlight the collaborations and projects that show your experience.",
  },
];

// ── 11. Getting started ─────────────────────────────────────
const STEPS = [
  { title: "Claim your username", text: "Choose a unique Inflixo username that represents you." },
  { title: "Create your profile", text: "Add your photo, creator details, categories and social accounts." },
  { title: "Choose your theme", text: "Personalize how your profile looks." },
  { title: "Organize your creator world", text: "Series, episodes, products, links, media kit and packages." },
  { title: "Share your Inflixo", text: "Put your link in your bios and invite your audience to explore." },
];

// ── 16. FAQ ──────────────────────────────────────────────────
const FAQS = [
  {
    q: "What is Inflixo?",
    a: "Inflixo is a creator profile platform that helps you organize and showcase your video series, episodes, products, links, media kit, collaborations, social presence, reviews, team and creator setup in one place.",
  },
  {
    q: "Is Inflixo just another link-in-bio platform?",
    a: "Inflixo includes link-in-bio features, but it goes beyond a list of links. It organizes your content into series and episodes and shows a more complete creator identity.",
  },
  {
    q: "Do I need to upload my videos to Inflixo?",
    a: "No. Your videos stay on their original platforms. You add episode links to Inflixo, and viewers follow those links to watch your content.",
  },
  {
    q: "Will Inflixo increase my video views?",
    a: "Inflixo makes your existing content easier to discover and can create more opportunities for views and engagement. It does not guarantee more views, reach or revenue.",
  },
  {
    q: "Can I organize multiple series?",
    a: "Yes. Create multiple series, add episodes to each one and arrange them so viewers can explore easily. The number of series depends on your plan.",
  },
  {
    q: "Can I showcase products?",
    a: "Yes. Inflixo Creator Shop shows product details and links to external shopping destinations, so buyers pay on the original store and Inflixo takes no cut.",
  },
  {
    q: "Can I use Inflixo for brand collaborations?",
    a: "Yes. Show your media kit, previous work and collaboration packages so brands understand what you offer.",
  },
  {
    q: "What is Inflixo Creator Era?",
    a: "Creator Era is a profile feature that celebrates the different stages of a creator's journey, from just starting out to an established presence.",
  },
  {
    q: "What is the upcoming Inflixo OTT-style platform?",
    a: "It's our future vision for a discovery destination where viewers explore series from many creators and follow episode links to the original platforms. It is not available yet.",
  },
  {
    q: "Is Inflixo free?",
    a: `Inflixo offers a ${PLANS.trial.trialDays}-day free trial with no card needed. Paid plans start at ₹${PLANS.starter.price.monthly!.INR}/month, and a paid plan keeps your profile public after the trial. Your data stays saved either way.`,
  },
  {
    q: "Is Inflixo only for Indian creators?",
    a: "No. Inflixo is made in India and built for creators around the world.",
  },
  {
    q: "What is Inflixo Vision 2027?",
    a: "Our goal is to build a community of more than 10,000 paid creators by 2027 and work toward a future Global Creator Summit that brings creators together.",
  },
];

const PAID: { key: PaidPlanKey; blurb: string }[] = [
  { key: "starter", blurb: "For creators beginning to organize and showcase their content." },
  { key: "pro", blurb: "For growing creators who need more space for series, products, links and tools." },
  { key: "vip", blurb: "For creators who want the most extensive profile and room to grow." },
];
const TRIAL_FEATURES = planFeatureLines("trial");

function cleanHandle(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#C21B5C]">{children}</p>;
}

function SectionHeading({ eyebrow, title, sub, center = true }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={`max-w-2xl space-y-3 ${center ? "mx-auto text-center" : ""}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-[30px] font-extrabold leading-tight tracking-tight text-[#1C1917] sm:text-[42px]">{title}</h2>
      {sub && <p className="text-[16px] leading-relaxed text-[#52525B]">{sub}</p>}
    </div>
  );
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFEDE6] text-[#C21B5C]">
      <Icon className="h-5 w-5" />
    </span>
  );
}

/** A mini version of a profile section, like the real page: icon, title, subtitle, count, then rows. */
/** "What you get" checklist used in every landing section (creator benefits, 3 points). */
function Benefits({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`space-y-2.5 text-left ${className}`}>
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-[14px] leading-snug text-[#1C1917] sm:text-[15px]">
          <CircleCheck aria-hidden className="mt-px h-[18px] w-[18px] shrink-0 text-[#15803D]" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
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
    if (!footerRef.current) return;
    const obs = new IntersectionObserver((entries) => entries.forEach((e) => setFooterInView(e.isIntersecting)), { threshold: 0.1 });
    obs.observe(footerRef.current);
    return () => obs.disconnect();
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

  // "Starting at ₹99/month … ₹3.30 per day", from config/plans.ts.
  const starterMonthly = formatPlanPrice("starter", "monthly", pricingCurrency);
  const starterPerDay = `${pricingCurrency === "INR" ? "₹" : "$"}${(planPrice("starter", "monthly", pricingCurrency) / 30).toFixed(2)}`;

  const navClass = (id: string) =>
    `text-[14px] font-semibold transition-colors ${activeNav === id ? "text-[#C21B5C]" : "text-[#71717A] hover:text-[#1C1917]"}`;

  const primaryBtn =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D9420F] to-[#C21B5C] px-5 text-[14px] font-bold text-white shadow-md shadow-[#E8246F]/20 transition-[filter,box-shadow] hover:brightness-95 hover:shadow-lg cursor-pointer";
  const secondaryBtn =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#F0CFCB] bg-white px-5 text-[14px] font-bold text-[#C21B5C] transition-colors hover:bg-[#FFEDE6] cursor-pointer";
  const textLink = "inline-flex items-center gap-1.5 text-[14px] font-bold text-[#C21B5C] hover:underline underline-offset-4 cursor-pointer";

  if (redirecting) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#C21B5C] border-t-transparent" />
      </div>
    );
  }

  const claimForm = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleClaim(username);
      }}
      className="flex w-full max-w-md items-center rounded-xl border border-[#F6E0DC] bg-white p-1.5 shadow-sm transition-all focus-within:border-[#C21B5C] focus-within:ring-2 focus-within:ring-[#C21B5C]/15"
    >
      <span className="shrink-0 pl-3 text-[14px] font-semibold text-[#71717A]">inflixo.com/</span>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="yourname"
        aria-label="Your desired handle"
        className="min-w-0 flex-1 bg-transparent px-2 text-[14px] font-semibold text-[#1C1917] outline-none placeholder:text-zinc-400"
      />
      <button type="submit" className={`${primaryBtn} shrink-0`}>
        <span>Claim</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );

  const ctaRow = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className={textLink}>
      {label} <ArrowRight className="h-4 w-4" />
    </button>
  );

  return (
    <div className="landing-scope min-h-dvh overflow-x-hidden bg-white antialiased selection:bg-[#FFEDE6] selection:text-[#C21B5C]">
      <div id="top" className="absolute top-0 h-px w-px" />

      {/* ── HEADER ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#F6E0DC] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
          <Logo size="lg" showIcon={false} tone="gulaal" />
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => (
              <a key={link.id} href={link.href} className={navClass(link.id)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <Link href="/login" className="text-[14px] font-semibold text-[#52525B] transition-colors hover:text-[#1C1917]">
              Log in
            </Link>
            <Link href="/login" className={primaryBtn}>
              Claim your profile
            </Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/login" className="px-2 py-1 text-[14px] font-semibold text-[#52525B]">
              Log in
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#F6E0DC] text-[#1C1917] hover:bg-zinc-50"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-b border-[#F6E0DC] bg-white px-4 py-6 md:hidden">
            <nav className="flex flex-col gap-4" aria-label="Mobile Navigation">
              {NAV_LINKS.map((link) => (
                <a key={link.id} href={link.href} onClick={() => setMobileMenuOpen(false)} className="py-1 text-[16px] font-semibold text-[#1C1917]">
                  {link.label}
                </a>
              ))}
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={`${primaryBtn} mt-2 w-full`}>
                Claim your profile
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24">
        <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div className="min-w-0 text-center lg:text-left">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F6E0DC] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#1C1917]">
              🇮🇳 Made in India. Built for creators worldwide.
            </p>
            <h1 className="landing-text-hero font-extrabold tracking-tight text-[#1C1917]">
              Your content deserves more than <span className="bg-gradient-to-r from-[#FF6A1A] to-[#E8246F] bg-clip-text text-transparent">a social media feed.</span>
            </h1>
            <p className="landing-text-18 mx-auto mt-5 max-w-xl text-[#52525B] lg:mx-0">
              You create the content. Inflixo brings your creator world together: one profile where your audience discovers your series, products, links and the creator behind them.
            </p>
            <p className="mt-4 text-[13px] font-bold tracking-wide text-[#C21B5C]">
              One profile · Every series · Every episode · Every product
            </p>
            <Benefits className="mx-auto mt-5 max-w-md lg:mx-0" items={["Fans find Episode 1 and binge your series in order.","Every view and like still counts on YouTube & Instagram.","One link for your series, shop, links and brand collabs."]} />
            <div className="mt-7 flex justify-center lg:justify-start">{claimForm}</div>
            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/demo_creator" className={secondaryBtn}>
                Explore demo profile <ExternalLink className="h-4 w-4" />
              </Link>
              <p className="text-[12px] text-[#71717A]">
                {PLANS.trial.trialDays}-day free trial · Plans from {starterMonthly}/month
              </p>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroPhoneMockup />
          </div>
        </div>
      </section>

      {/* ── 01. THE PROBLEM ── */}
      <section id="problem" className="scroll-mt-20 border-t border-[#F6E0DC] bg-[#FFF8F4] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Sound familiar?"
            title="You've created so much. How much have your followers discovered?"
            sub="You've made series with many episodes, hundreds of videos, product picks and brand collabs. But every new post pushes the older ones further down your feed."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
            {SCATTERED.map((s) => (
              <div key={s.text} className="flex items-start gap-4 rounded-2xl border border-[#F6E0DC] bg-white p-5">
                <IconTile icon={s.icon} />
                <p className="text-[15px] leading-relaxed text-[#1C1917]">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-2xl text-center">
            <p className="text-[20px] font-extrabold leading-snug text-[#1C1917] sm:text-[24px]">
              Your content isn&apos;t missing. <span className="text-[#C21B5C]">It&apos;s simply scattered.</span>
            </p>
            <p className="mt-2 text-[15px] text-[#52525B]">What if your audience could discover more of your work without searching through hundreds of posts? That&apos;s why we built Inflixo.</p>
            <Benefits className="mx-auto mt-6 max-w-md" items={["Older episodes keep getting found instead of getting buried.","Fans see all your series, not just your latest post.","Brands understand your work from one page."]} />
          </div>
        </div>
      </section>

      {/* ── 02. MEET INFLIXO ── */}
      <section id="features" className="scroll-mt-20 border-t border-[#F6E0DC] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Meet Inflixo"
            title="More than a link in bio."
            sub="Your content. Your identity. Your creator world. Instead of different links for different purposes, give your audience and brand partners one organized destination."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2">
            {CAN_DO.map((c) => (
              <div key={c.text} className="flex items-center gap-3 rounded-xl border border-[#F6E0DC] bg-white px-4 py-3">
                <c.icon className="h-5 w-5 shrink-0 text-[#C21B5C]" />
                <span className="text-[14px] font-semibold text-[#1C1917]">{c.text}</span>
              </div>
            ))}
          </div>
          <Benefits className="mx-auto mt-10 max-w-md" items={["Replace a dozen scattered links with one creator profile.","Fans explore more of your work in a single visit.","Brands get everything they need to say yes."]} />
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="text-[16px] font-bold text-[#1C1917]">You focus on creating. Inflixo helps people explore what you&apos;ve created.</p>
            {ctaRow("Create my Inflixo profile", () => handleClaim(username))}
          </div>
        </div>
      </section>

      {/* ── 03. SERIES ── */}
      <section id="series" className="scroll-mt-20 border-t border-[#F6E0DC] bg-[#FFF8F4] py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <ProfileSectionPreview kind="series" />
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading
              center={false}
              eyebrow="Series & episodes"
              title="Every series has a story. Make every episode easy to find."
              sub="Food, travel, comedy, tutorials: five series, many episodes each. When a new follower lands on your profile, can they find all five and know where to start? With Inflixo, each series gets a home of its own, with episodes in the right order."
            />
            <div className="mt-6 rounded-2xl border border-[#F6E0DC] bg-white p-5">
              <p className="flex items-center gap-2 text-[15px] font-bold text-[#1C1917]">
                <Play className="h-4 w-4 fill-[#C21B5C] text-[#C21B5C]" /> Your videos stay on their original platforms.
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#52525B]">
                Tapping an episode opens the original video on Instagram, YouTube or Facebook. Nothing is re-uploaded, so older episodes and other series get more chances to be watched where your content already lives.
              </p>
            </div>
            <Benefits className="mt-5" items={["Help followers discover more of your series.","Send viewers to the original video, so views stay yours.","Give older episodes a second chance to be watched."]} />
            <p className="mt-5 text-[15px] font-bold text-[#C21B5C]">More content discovered. More opportunities to be watched.</p>
            <div className="mt-4">{ctaRow("Organize my video series", () => handleClaim(username))}</div>
          </div>
        </div>
      </section>

      {/* ── LINKS ── */}
      <section id="links" className="scroll-mt-20 border-t border-[#F6E0DC] bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHeading
              center={false}
              eyebrow="Links"
              title="One link. Everything your audience needs."
              sub="Instagram, YouTube, Facebook, your website, your latest campaign, your favorite resources. Why make your audience search for each one? Keep them all on one creator profile, and group related links into folders."
            />
            <Benefits className="mt-5" items={["Fans find every link without DMing you.","Group links into folders and pin the one that matters.","Your links sit right next to your series, shop and media kit."]} />
            <p className="mt-5 text-[15px] font-bold text-[#C21B5C]">Less searching. Easier access. One Inflixo link.</p>
            <div className="mt-4">{ctaRow("Organize my links", () => handleClaim(username))}</div>
          </div>
          <ProfileSectionPreview kind="links" />
        </div>
      </section>

      {/* ── CREATOR SHOP ── */}
      <section id="shop" className="scroll-mt-20 border-t border-[#F6E0DC] bg-[#FFF8F4] py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <ProfileSectionPreview kind="shop" />
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading center={false} eyebrow="Creator Shop" title="Your recommendations deserve their own shop." />
            <div className="mt-5 space-y-2">
              {SHOP_DMS.map((q) => (
                <p key={q} className="flex w-fit items-center gap-2 rounded-xl rounded-bl-sm bg-white px-3 py-1.5 text-[13px] text-[#1C1917] shadow-sm">
                  <MessageCircle className="h-3.5 w-3.5 text-[#C21B5C]/60" /> {q}
                </p>
              ))}
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-[#52525B]">
              Add product images, names, prices and shopping links. Fans browse your picks and buy from the original store, and Inflixo takes no cut. Fashion, food, tech, beauty or lifestyle: your recommendations become easy to find.
            </p>
            <Benefits className="mt-5" items={["Answer “which camera?” once, not in a hundred DMs.","Earn from your affiliate links; Inflixo takes no cut.","Fans buy straight from the original store."]} />
            <div className="mt-4">{ctaRow("Build my Creator Shop", () => handleClaim(username))}</div>
          </div>
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section id="brands" className="scroll-mt-20 border-t border-[#F6E0DC] bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHeading
              center={false}
              eyebrow="For brand collabs"
              title="Turn your profile into a professional introduction."
              sub="When a brand discovers you, it should be easy to understand who you are, what you create and how to work with you."
            />
            <ul className="mt-6 space-y-4">
              {BRAND_CARDS.map((c) => (
                <li key={c.title} className="flex gap-3">
                  <IconTile icon={c.icon} />
                  <span>
                    <span className="block text-[15px] font-bold text-[#1C1917]">{c.title}</span>
                    <span className="block text-[14px] leading-relaxed text-[#52525B]">{c.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Benefits className="mt-6" items={["Share one link instead of PDFs and screenshots.","Brands see your packages and send you collab requests.","Look professional from the very first message."]} />
            <div className="mt-6">{ctaRow("Create my media kit", () => handleClaim(username))}</div>
          </div>
          <ProfileSectionPreview kind="packages" />
        </div>
      </section>

      {/* ── IDENTITY: fanbase, era, reviews, setup, team ── */}
      <section id="identity" className="scroll-mt-20 border-t border-[#F6E0DC] bg-[#FFF8F4] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                center={false}
                eyebrow="Your creator identity"
                title="Your influence is bigger than one platform."
                sub="Followers on Instagram, subscribers on YouTube, a community on Facebook. Inflixo adds them up into one total fanbase, so fans and brands see your real reach at a glance."
              />
              <div className="mt-6 flex gap-3 rounded-2xl border border-[#F6E0DC] bg-white p-5">
                <IconTile icon={Sparkles} />
                <span>
                  <span className="block text-[15px] font-bold text-[#1C1917]">Celebrate your Creator Era</span>
                  <span className="block text-[14px] leading-relaxed text-[#52525B]">
                    Just beginning, growing or established: Creator Era celebrates where you are, because your identity is more than one follower count.
                  </span>
                </span>
              </div>
              <Benefits className="mt-5" items={["Show your total reach across every platform.","Reviews and your crew build trust with new brands.","Celebrate your growth with your Creator Era."]} />
            </div>
            <ProfileSectionPreview kind="fans" />
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-[24px] font-extrabold leading-tight tracking-tight text-[#1C1917] sm:text-[32px]">Show the people, passion and tools behind your work.</h3>
            <p className="mx-auto mt-2 max-w-2xl text-[15px] text-[#52525B]">Reviews add confidence, your setup answers the &ldquo;which camera?&rdquo; DMs, and your crew gets the credit they deserve.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ProfileSectionPreview kind="reviews" />
            <ProfileSectionPreview kind="setup" />
            <ProfileSectionPreview kind="crew" />
          </div>
          <p className="mt-8 text-center text-[14px] text-[#52525B]">
            <Palette className="mr-1.5 inline h-4 w-4 text-[#C21B5C]" />
            Pick a theme that feels like you. Mobile-friendly, no website to build.
          </p>
          <div className="mt-4 text-center">{ctaRow("Showcase my creator identity", () => handleClaim(username))}</div>
        </div>
      </section>

      {/* ── LIVE DEMO: invite to open the real demo profile (the sections above already preview it) ── */}
      <section id="demo" className="scroll-mt-20 border-t border-[#F6E0DC] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="mx-auto flex max-w-[620px] flex-col items-center rounded-[5px] border border-[#F6E0DC] bg-[#FFF8F4] px-5 py-10 text-center sm:px-10">
            <Eyebrow>Live demo</Eyebrow>
            <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-[#1C1917] sm:text-[34px]">
              Do you want to see how your profile will look?
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#52525B]">
              Open a real Inflixo creator profile: series in order, links, shop, media kit and reviews, all on one page.
            </p>
            <a href="/demo_creator" target="_blank" rel="noopener noreferrer" className={`${primaryBtn} mt-6`}>
              See the demo profile <ExternalLink className="h-4 w-4" />
            </a>
            <p className="mt-3 text-[12px] text-[#71717A]">Opens in a new tab · inflixo.com/demo_creator</p>
          </div>
        </div>
      </section>

      {/* ── 11. GETTING STARTED ── */}
      <section id="how" className="scroll-mt-20 border-t border-[#F6E0DC] bg-[#FFF8F4] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Getting started"
            title="Your creator profile is a few steps away."
            sub="No website to build. No complicated setup."
          />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-[#F6E0DC] bg-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C21B5C] text-[13px] font-extrabold text-white">{i + 1}</span>
                <h3 className="mt-3 text-[16px] font-bold text-[#1C1917]">{s.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#52525B]">{s.text}</p>
              </li>
            ))}
          </ol>
          <Benefits className="mx-auto mt-10 max-w-md" items={["Set up in minutes; no website or coding.","Paste your video links; there's nothing to upload.","Update anytime; changes show on your profile instantly."]} />
          <div className="mt-10 flex justify-center">
            <button onClick={() => handleClaim(username)} className={primaryBtn}>
              Get started free <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 12. PRICING ── */}
      <section id="pricing" className="scroll-mt-20 border-t border-[#F6E0DC] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Pricing"
            title="A professional creator profile for less than your daily cup of chai."
            sub={`Big dreams don't need an expensive beginning. Plans start at ${starterMonthly}/month, about ${starterPerDay} a day.`}
          />

          <Benefits className="mx-auto mt-8 max-w-md" items={["Every plan includes series, shop, links and a media kit.","Pay with UPI, cards or netbanking.","Switch or cancel anytime; nothing you add is deleted."]} />
          <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-[#F0CFCB] bg-white p-5 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-[18px] font-extrabold text-[#1C1917]">Try Inflixo free for {PLANS.trial.trialDays} days</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#52525B]">
                No card needed. Build your real profile and see how it looks. After the trial, pick a plan to keep it public; nothing is deleted.
              </p>
              <p className="mt-1 text-[12px] text-[#71717A]">Trial includes: {TRIAL_FEATURES.slice(0, 3).join(" · ")}</p>
            </div>
            <button onClick={() => handleClaim(username)} className={`${primaryBtn} shrink-0`}>
              Start free trial
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PAID.map(({ key, blurb }) => {
              const plan = PLANS[key];
              const popular = Boolean(plan.popular);
              const features = [...planFeatureLines(key), "Cancel anytime, no lock-in"];
              return (
                <div
                  key={key}
                  className={`relative flex flex-col justify-between rounded-2xl bg-white p-6 ${popular ? "border-2 border-[#C21B5C]" : "border border-[#F6E0DC]"}`}
                >
                  {popular && (
                    <span className="absolute -top-3.5 right-6 rounded-full bg-[#C21B5C] px-3 py-0.5 text-[12px] font-bold uppercase tracking-wider text-white">Popular</span>
                  )}
                  <div>
                    <h3 className="text-[22px] font-bold text-[#1C1917]">{plan.name}</h3>
                    <p className="mt-1 min-h-[42px] text-[14px] text-[#52525B]">{blurb}</p>
                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="text-[40px] font-extrabold leading-none text-[#1C1917]">{formatPlanPrice(key, "monthly", pricingCurrency)}</span>
                      <span className="text-[14px] text-[#52525B]">/ month</span>
                    </div>
                    <p className="mt-1 text-[12px] font-semibold text-[#C21B5C]">
                      Or {formatPlanPrice(key, "yearly", pricingCurrency)}/year (save {yearlySavingsPercent(key, pricingCurrency)}%)
                    </p>
                    <ul className="mt-5 space-y-2 text-[14px] text-zinc-700">
                      {features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C21B5C]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => handleClaim(username)}
                    className={popular ? `${primaryBtn} mt-7 w-full` : `${secondaryBtn} mt-7 w-full`}
                  >
                    Choose {plan.name}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-center text-[13px] text-[#52525B]">
            Pay securely with UPI, cards or netbanking via Razorpay. Plan features and usage limits vary.
          </p>
        </div>
      </section>

      {/* ── 13. FUTURE VISION: OTT-STYLE DISCOVERY ── */}
      <section id="vision" className="scroll-mt-20 border-t border-[#F6E0DC] bg-[#FFF8F4] py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFEDE6] px-3 py-1 text-[12px] font-bold text-[#C21B5C]">
              <Sparkles className="h-3.5 w-3.5" /> Coming in the future
            </span>
            <h2 className="mt-4 text-[30px] font-extrabold leading-tight tracking-tight text-[#1C1917] sm:text-[42px]">
              We&apos;re building something bigger: OTT-style content discovery.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#52525B]">
              Today, Inflixo helps you organize your content for your existing audience. Tomorrow, imagine one destination where viewers discover series from many creators, by category: food lovers finding food series, travellers finding travel stories, comedy fans finding comedy, without needing to know a creator&apos;s username first.
            </p>
            <p className="mt-4 text-[16px] font-bold text-[#1C1917]">Discover on Inflixo. Watch on the original platform.</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#52525B]">
              Episodes would still open on Instagram, YouTube or Facebook, giving creators a chance to reach audiences beyond their current followers.
            </p>
            <Benefits className="mt-5" items={["Get discovered by people who don't follow you yet.","Views would still go to your original platform.","Your series will be ready the day discovery launches."]} />
            <p className="mt-5 text-[12px] text-[#71717A]">The OTT-style discovery experience is part of our future roadmap and is not available yet.</p>
          </div>
          <div className="grid grid-cols-2 gap-3" aria-hidden="true">
            {[
              { cat: "Food", title: "Street food trails" },
              { cat: "Travel", title: "Road trips & stories" },
              { cat: "Comedy", title: "Sketch series" },
              { cat: "Tutorials", title: "Learn in parts" },
            ].map((t) => (
              <div key={t.cat} className="rounded-2xl border border-[#F6E0DC] bg-gradient-to-br from-[#FFEDE6] to-white p-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#C21B5C] text-white">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[#C21B5C]">{t.cat}</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#1C1917]">{t.title}</p>
                <p className="text-[12px] text-[#71717A]">Series from many creators</p>
              </div>
            ))}
            <p className="col-span-2 text-center text-[11px] text-[#A1A1AA]">Illustration of a future idea</p>
          </div>
        </div>
      </section>

      {/* ── 14 + 15. VISION 2027 & GLOBAL CREATOR SUMMIT ── */}
      <section id="summit" className="scroll-mt-20 border-t border-[#F6E0DC] bg-[#FFEDE6] py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Eyebrow>Vision 2027</Eyebrow>
          <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-[#1C1917] sm:text-[44px]">
            10,000+ paid creators. One global community.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#52525B]">
            Every creator begins somewhere: a phone and an idea, years of building an audience, a passion turning into a profession. Our goal is to bring more than 10,000 paid creators into the Inflixo community by 2027, a place to discover one another, learn, collaborate and grow.
          </p>

          <div className="mt-10 rounded-3xl border border-[#F0CFCB] bg-white p-6 text-left sm:p-8">
            <div className="flex items-center gap-3">
              <IconTile icon={Globe} />
              <h3 className="text-[20px] font-extrabold leading-snug text-[#1C1917] sm:text-[24px]">Imagine 10,000+ creators at one Global Creator Summit.</h3>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-[#52525B]">
              Creators from different cities, countries and languages on one stage. Creators who started with an idea, worked late nights on the next video, and built communities one follower at a time. Not competing for attention, but celebrating creativity and inspiring the next generation.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#52525B]">
              A vision this big can&apos;t be built by one company alone. It needs creators like you, from the beginning.
            </p>
            <Benefits className="mt-5" items={["Meet and collaborate with other creators.","Learn from creators who have grown before you.","Be part of the community from the very beginning."]} />
            <p className="mt-5 text-[18px] font-extrabold italic text-[#C21B5C]">&ldquo;We started building this dream together.&rdquo;</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button onClick={() => handleClaim(username)} className={primaryBtn}>
                Join as a VIP Creator <ArrowRight className="h-4 w-4" />
              </button>
              <a href="https://instagram.com/inflixo_app" target="_blank" rel="noopener noreferrer" className={textLink}>
                Follow @inflixo_app
              </a>
            </div>
            <p className="mt-5 text-[12px] leading-relaxed text-[#71717A]">
              The Global Creator Summit is an aspiration for the future, not a confirmed or scheduled event. VIP membership does not guarantee summit participation.
            </p>
          </div>
        </div>
      </section>

      {/* ── 16. FAQ ── */}
      <section id="faq" className="scroll-mt-20 border-t border-[#F6E0DC] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
          <div className="mt-10 space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={faq.q} className="overflow-hidden rounded-2xl border border-[#F6E0DC] bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[16px] font-bold text-[#1C1917]">{faq.q}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFEDE6] text-[#C21B5C]">
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

      {/* ── 17. FINAL CTA ── */}
      <section className="border-t border-[#F6E0DC] bg-[#FFF8F4] py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl space-y-5 px-4 sm:px-6">
          <h2 className="text-[30px] font-extrabold leading-tight tracking-tight text-[#1C1917] sm:text-[44px]">
            You&apos;ve already created the content. <span className="text-[#C21B5C]">Now help people discover it.</span>
          </h2>
          <p className="text-[16px] leading-relaxed text-[#52525B]">
            Your series, your recommendations, your collaborations and the community you&apos;ve built. Bring it all together with Inflixo.
          </p>
          <Benefits className="mx-auto max-w-md" items={["Fans find and binge your series in order.","Brands see your work and packages in one place.","Start free and set up in minutes."]} />
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={() => handleClaim(username)} className={primaryBtn}>
              Claim your creator profile <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => handleClaim(username)} className={secondaryBtn}>
              Join as a VIP Creator
            </button>
          </div>
          <p className="text-[12px] text-[#71717A]">{PLANS.trial.trialDays}-day free trial · Made in India · Built for creators worldwide</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer ref={footerRef} className="border-t border-[#F6E0DC] bg-white py-14">
        <div className="mx-auto max-w-[1120px] space-y-10 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <Logo size="md" showIcon={false} tone="gulaal" />
              <p className="text-[14px] leading-relaxed text-[#52525B]">Your content. Your identity. Your creator world.</p>
              <p className="text-[12px] font-semibold text-zinc-500">Made in India 🇮🇳</p>
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#1C1917]">Product</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><a href="#series" className="hover:text-[#C21B5C]">Series</a></li>
                <li><a href="#features" className="hover:text-[#C21B5C]">Features</a></li>
                <li><a href="#demo" className="hover:text-[#C21B5C]">Live demo</a></li>
                <li><a href="#pricing" className="hover:text-[#C21B5C]">Pricing</a></li>
                <li><a href="#summit" className="hover:text-[#C21B5C]">Vision 2027</a></li>
                <li><a href="#faq" className="hover:text-[#C21B5C]">FAQ</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#1C1917]">Company</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><a href="mailto:support@inflixo.com?subject=Inflixo%20Support" className="hover:text-[#C21B5C]">Contact Support</a></li>
                <li>
                  <a href="https://instagram.com/inflixo_app" target="_blank" rel="noopener noreferrer" className="hover:text-[#C21B5C]">
                    Instagram (@inflixo_app)
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#1C1917]">Legal</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><Link href="/privacy" className="hover:text-[#C21B5C]">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#C21B5C]">Terms of Service</Link></li>
                <li><Link href="/creator-terms" className="hover:text-[#C21B5C]">Creator Terms &amp; Conditions</Link></li>
                <li><Link href="/cookies" className="hover:text-[#C21B5C]">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#F6E0DC] pt-8 text-[12px] text-[#52525B] sm:flex-row">
            <p>© 2026 Inflixo. All rights reserved.</p>
            <Link href="/login" className="font-medium underline hover:text-[#C21B5C]">
              Log in to Dashboard
            </Link>
          </div>
        </div>
      </footer>

      {showScrollTop && !footerInView && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#F6E0DC] bg-white text-[#C21B5C] shadow-md hover:bg-zinc-50"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

