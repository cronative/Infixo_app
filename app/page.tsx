"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUp,
  Check,
  CircleCheck,
  ExternalLink,
  Globe,
  Menu,
  Minus,
  Play,
  Plus,
  Sparkles,
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
  { id: "links", href: "#links", label: "Links" },
  { id: "shop", href: "#shop", label: "Shop" },
  { id: "mediakit", href: "#mediakit", label: "Media Kit" },
  { id: "pricing", href: "#pricing", label: "Pricing" },
  { id: "faq", href: "#faq", label: "FAQ" },
];

const SECTION_IDS = ["top", "series", "links", "shop", "mediakit", "why", "pricing", "vision", "faq"];

// ── Why Inflixo is different ─────────────────────────────
const DIFFERENCES: { label: string; other: boolean | string }[] = [
  { label: "Links to your socials and website", other: true },
  { label: "Video series with episodes in order", other: false },
  { label: "One series across Instagram, YouTube & Facebook", other: false },
  { label: "Shop for affiliate & brand products", other: "Basic" },
  { label: "Media kit with past collabs, reviews & packages", other: false },
  { label: "Total fans across all platforms", other: false },
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
  { key: "starter", blurb: "Start organising your series, links and shop." },
  { key: "pro", blurb: "More series, products and links as you grow." },
  { key: "vip", blurb: "Unlimited series, shop and links, plus team seats." },
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

/** A creator-benefit point: plain text, or a bold title with a short line after it. */
type Benefit = string | { title: string; text: string };

/** "What you get" checklist used in every landing section (green ticks, no box). */
function Benefits({ items, className = "" }: { items: Benefit[]; className?: string }) {
  return (
    <ul className={`space-y-2.5 text-left ${className}`}>
      {items.map((b) => {
        const key = typeof b === "string" ? b : b.title;
        return (
          <li key={key} className="flex items-start gap-2.5 text-[14px] leading-snug text-[#1C1917] sm:text-[15px]">
            <CircleCheck aria-hidden className="mt-px h-[18px] w-[18px] shrink-0 text-[#15803D]" />
            {typeof b === "string" ? (
              <span>{b}</span>
            ) : (
              <span>
                <strong className="font-bold">{b.title}</strong> <span className="text-[#52525B]">— {b.text}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** One feature section in the landing story format: you do this → the problem → how Inflixo helps → advantages. */
function FeatureSection({
  id,
  tint = false,
  previewFirst = false,
  eyebrow,
  title,
  story,
  problem,
  help,
  benefits,
  closing,
  closingAccent,
  cta,
  preview,
}: {
  id: string;
  tint?: boolean;
  previewFirst?: boolean;
  eyebrow: string;
  title: string;
  story: string;
  problem: string;
  help: string;
  benefits: Benefit[];
  closing: string;
  closingAccent: string;
  cta: ReactNode;
  preview: ReactNode;
}) {
  return (
    <section id={id} className={`scroll-mt-20 border-t border-[#F6E0DC] py-16 sm:py-24 ${tint ? "bg-[#FFF8F4]" : "bg-white"}`}>
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className={`${previewFirst ? "order-2 lg:order-1" : "order-2"} min-w-0 space-y-6`}>{preview}</div>
        <div className={previewFirst ? "order-1 lg:order-2" : "order-1"}>
          <SectionHeading center={false} eyebrow={eyebrow} title={title} />
          <div className="mt-4 space-y-3 text-[16px] leading-relaxed text-[#52525B]">
            <p>{story}</p>
            <p>
              <span className="font-bold text-[#1C1917]">But here&apos;s the problem.</span> {problem}
            </p>
            <p>
              <span className="font-bold text-[#C21B5C]">That&apos;s where Inflixo helps.</span> {help}
            </p>
          </div>
          <Benefits className="mt-6" items={benefits} />
          <p className="mt-6 text-[17px] font-extrabold leading-snug text-[#1C1917]">
            {closing} <span className="text-[#C21B5C]">{closingAccent}</span>
          </p>
          <div className="mt-4">{cta}</div>
        </div>
      </div>
    </section>
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
              Turn your videos into <span className="bg-gradient-to-r from-[#FF6A1A] to-[#E8246F] bg-clip-text text-transparent">series fans can binge.</span>
            </h1>
            <p className="landing-text-18 mx-auto mt-5 max-w-xl text-[#52525B] lg:mx-0">
              You post on Instagram, YouTube and Facebook every day, but your best work gets lost in the feed. Inflixo gives you one profile for your series, links, shop and media kit.
            </p>
            <Benefits
              className="mx-auto mt-6 max-w-xl lg:mx-0"
              items={[
                { title: "Series in Order", text: "Fans start at Part 1 and keep watching." },
                { title: "Views Stay Yours", text: "Every view and like counts on the original platform." },
                { title: "One Link for Everything", text: "Series, links, shop and media kit together." },
              ]}
            />
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

      {/* ── 03. SERIES ── */}
      <section id="series" className="scroll-mt-20 border-t border-[#F6E0DC] bg-[#FFF8F4] py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <ProfileSectionPreview kind="series" />
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading center={false} eyebrow="01. Series & Episodes" title="Every Series. Every Episode. All in One Place." />
            <div className="mt-4 space-y-3 text-[16px] leading-relaxed text-[#52525B]">
              <p>
                You create food series, travel vlogs, challenges, and more. Each series has many parts. Some are on Instagram, some on YouTube, and others on Facebook. You might share a short Reel on Instagram and the full video on YouTube.
              </p>
              <p>
                <span className="font-bold text-[#1C1917]">But here&apos;s the problem.</span> Some of your videos get thousands or even millions of views, while others hardly get noticed. Your followers may watch Part 5 but never find Part 1. And with videos spread across different platforms, finding the full series isn&apos;t always easy.
              </p>
              <p>
                <span className="font-bold text-[#C21B5C]">That&apos;s where Inflixo helps.</span> Bring all your series and episodes together in one place, so your followers can easily find every part and enjoy the full series.
              </p>
            </div>
            <Benefits
              className="mt-6"
              items={[
                { title: "All Your Series Together", text: "Food, travel, challenges, and more, in one place." },
                { title: "No More Missing Parts", text: "Help followers find Part 1, Part 2, Part 3, and so on." },
                { title: "Instagram, YouTube & Facebook", text: "Connect videos from all three platforms." },
                { title: "Give Old Videos Another Chance", text: "Help followers discover episodes they may have missed." },
                { title: "Views Stay on Your Platforms", text: "Followers watch and like your videos on the original platform." },
              ]}
            />
            <p className="mt-6 text-[17px] font-extrabold leading-snug text-[#1C1917]">
              You Create the Series. <span className="text-[#C21B5C]">Inflixo Helps Your Followers Find Every Part.</span>
            </p>
            <div className="mt-4">{ctaRow("Organize my video series", () => handleClaim(username))}</div>
          </div>
        </div>
      </section>

      {/* ── 02. LINKS ── */}
      <FeatureSection
        id="links"
        eyebrow="02. Links"
        title="One Link. Everything Your Followers Need."
        story="You share your Instagram, YouTube, website, latest campaign and favourite tools, each with a different link."
        problem="Your bio allows only one link. Followers keep asking “link please?” in DMs, and important links get lost under new posts."
        help="Keep every link on one profile, grouped and easy to find, right next to your series and shop."
        benefits={[
          { title: "All Links Together", text: "Socials, website, campaigns and more." },
          { title: "Folders & Pins", text: "Group related links and pin the important one." },
          { title: "Next to Your Content", text: "Links sit beside your series, shop and media kit." },
          { title: "Update Anytime", text: "Change a link once; your profile updates instantly." },
        ]}
        closing="One Link in Your Bio."
        closingAccent="Everything Your Followers Need."
        cta={ctaRow("Organize my links", () => handleClaim(username))}
        preview={<ProfileSectionPreview kind="links" />}
      />

      {/* ── 03. CREATOR SHOP ── */}
      <FeatureSection
        id="shop"
        tint
        previewFirst
        eyebrow="03. Creator Shop"
        title="Every Product You Promote. One Shop."
        story="You promote products all the time: affiliate links, brand collaborations, and things you genuinely use and love."
        problem="The product from last month's reel gets buried. Followers DM “link please?” and your affiliate clicks drop after the first day."
        help="Every product you promote stays live in one shop with the right link, so followers can buy anytime and you keep earning."
        benefits={[
          { title: "Affiliate Links", text: "Add affiliate links from any store." },
          { title: "Brand Promotions", text: "Products from your brand collabs, with their link." },
          { title: "Your Recommendations", text: "Gear, outfits and products you personally use." },
          { title: "Honest Labels", text: "Mark affiliate links so followers know." },
          { title: "No Commission Cut", text: "Inflixo takes nothing; your earnings stay yours." },
        ]}
        closing="You Promote It. Followers Find It."
        closingAccent="You Keep Earning."
        cta={ctaRow("Build my Creator Shop", () => handleClaim(username))}
        preview={<ProfileSectionPreview kind="shop" />}
      />

      {/* ── 04. MEDIA KIT ── */}
      <FeatureSection
        id="mediakit"
        eyebrow="04. Media Kit"
        title="Your Brand Collabs, Ready to Share."
        story="You work with brands: sponsored reels, product shoots, cafe visits and more."
        problem="Every new brand asks the same things: your reach, past work, reviews and rates. You send screenshots, PDFs and long DMs, and deals still slip away."
        help="Your media kit shows a brand everything on one page: past collaborations, brand reviews and your collab packages."
        benefits={[
          { title: "Past Collaborations", text: "Show the brands you've already worked with." },
          { title: "Brand Reviews", text: "Let past brands vouch for your work." },
          { title: "Collab Packages", text: "Deliverables and pricing, clear upfront." },
          { title: "Total Reach", text: "Followers across Instagram, YouTube and Facebook in one number." },
          { title: "Collab Requests", text: "Brands can send you a request directly." },
        ]}
        closing="One Link."
        closingAccent="Every Brand Gets the Full Picture."
        cta={ctaRow("Create my media kit", () => handleClaim(username))}
        preview={
          <>
            <ProfileSectionPreview kind="packages" />
            <ProfileSectionPreview kind="reviews" />
          </>
        }
      />

      {/* ── WHY INFLIXO IS DIFFERENT ── */}
      <section id="why" className="scroll-mt-20 border-t border-[#F6E0DC] bg-[#FFF8F4] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Why Inflixo is different"
            title="Built for video creators. Not just links."
            sub="A link-in-bio gives followers a list of buttons. Inflixo gives them your series, your shop and your brand work, organised."
          />
          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-[5px] border border-[#F6E0DC] bg-white">
            <div className="grid grid-cols-[1fr_60px_60px] items-center gap-2 border-b border-[#F6E0DC] bg-[#FFF8F4] px-4 py-3 text-[12px] font-bold uppercase tracking-wide text-[#71717A] sm:grid-cols-[1fr_140px_140px] sm:text-[13px]">
              <span>Feature</span>
              <span className="text-center"><span className="sm:hidden">Others</span><span className="hidden sm:inline">Typical link-in-bio</span></span>
              <span className="text-center text-[#C21B5C]">Inflixo</span>
            </div>
            {DIFFERENCES.map((row) => (
              <div key={row.label} className="grid grid-cols-[1fr_60px_60px] items-center gap-2 border-b border-[#F6E0DC] px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_140px_140px]">
                <span className="text-[14px] font-semibold leading-snug text-[#1C1917] sm:text-[15px]">{row.label}</span>
                <span className="flex justify-center">
                  {row.other === true ? (
                    <Check aria-label="Yes" className="h-5 w-5 text-[#15803D]" />
                  ) : row.other === false ? (
                    <X aria-label="No" className="h-5 w-5 text-[#A1A1AA]" />
                  ) : (
                    <span className="text-[12px] font-semibold text-[#71717A]">{row.other}</span>
                  )}
                </span>
                <span className="flex justify-center">
                  <Check aria-label="Yes" className="h-5 w-5 text-[#15803D]" />
                </span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[17px] font-extrabold text-[#1C1917]">
            Other tools list your links. <span className="text-[#C21B5C]">Inflixo organises your creator world.</span>
          </p>
          <div className="mt-4 text-center">{ctaRow("Claim my Inflixo profile", () => handleClaim(username))}</div>
        </div>
      </section>

      {/* ── 12. PRICING ── */}
      <section id="pricing" className="scroll-mt-20 border-t border-[#F6E0DC] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading eyebrow="Pricing" title="Start Free. Grow When You're Ready." />
          <div className="mx-auto mt-4 max-w-2xl space-y-3 text-center text-[16px] leading-relaxed text-[#52525B]">
            <p>You want a professional creator profile, but you&apos;re not sure it&apos;s worth paying for yet.</p>
            <p>
              <span className="font-bold text-[#1C1917]">But here&apos;s the problem.</span> A website or a designer costs time and money you&apos;d rather spend on your content.
            </p>
            <p>
              <span className="font-bold text-[#C21B5C]">That&apos;s where Inflixo helps.</span> Try it free for {PLANS.trial.trialDays} days, then pick a plan from {starterMonthly}/month, about {starterPerDay} a day.
            </p>
          </div>
          <Benefits
            className="mx-auto mt-6 max-w-md"
            items={[
              { title: `Free for ${PLANS.trial.trialDays} Days`, text: "Build your real profile, no card needed." },
              { title: "Less Than a Cup of Chai", text: `Plans from ${starterMonthly}/month.` },
              { title: "Pay Your Way", text: "UPI, cards or netbanking." },
              { title: "Cancel Anytime", text: "Nothing you add is deleted." },
            ]}
          />
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
          <p className="mt-10 text-center text-[17px] font-extrabold text-[#1C1917]">
            Big Dreams Don&apos;t Need <span className="text-[#C21B5C]">an Expensive Start.</span>
          </p>
          <p className="mt-2 text-center text-[13px] text-[#52525B]">Secure payments via Razorpay. Plan features and usage limits vary.</p>
        </div>
      </section>

      {/* ── 13. FUTURE VISION: OTT-STYLE DISCOVERY ── */}
      <section id="vision" className="scroll-mt-20 border-t border-[#F6E0DC] bg-[#FFF8F4] py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFEDE6] px-3 py-1 text-[12px] font-bold text-[#C21B5C]">
              <Sparkles className="h-3.5 w-3.5" /> Our vision · Coming in the future
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
        <div className="mx-auto mt-20 max-w-3xl px-4 text-center sm:px-6">
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

