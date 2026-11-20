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
  Briefcase,
  Camera,
  Check,
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
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { CreatorProfile, SocialAccounts, type ThemeKey } from "@/types";
import { formatPlanPrice, usePricingCurrency } from "@/lib/pricing";
import { PLANS, planFeatureLines, planPrice, yearlySavingsPercent, type PaidPlanKey } from "@/config/plans";
import {
  EXPERT_DEMO_CUSTOM_LINKS,
  EXPERT_DEMO_GIGS,
  EXPERT_DEMO_PRODUCTS,
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_REVIEWS,
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_SETUP_ITEMS,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_TEAM,
  EXPERT_DEMO_THEME,
} from "@/data/expertDemoCreator";
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
  return <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#7A2253]">{children}</p>;
}

function SectionHeading({ eyebrow, title, sub, center = true }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={`max-w-2xl space-y-3 ${center ? "mx-auto text-center" : ""}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-[30px] font-extrabold leading-tight tracking-tight text-[#18181B] sm:text-[42px]">{title}</h2>
      {sub && <p className="text-[16px] leading-relaxed text-[#52525B]">{sub}</p>}
    </div>
  );
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7EDF2] text-[#7A2253]">
      <Icon className="h-5 w-5" />
    </span>
  );
}

/** A mini version of a profile section, like the real page: icon, title, subtitle, count, then rows. */
function MockCard({ icon: Icon, title, subtitle, count, children }: { icon: LucideIcon; title: string; subtitle: string; count?: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[440px] rounded-3xl border border-[#EFE3EA] bg-white p-4 shadow-xl shadow-[#7A2253]/5" aria-hidden="true">
      <div className="flex items-start justify-between gap-3 px-1 pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7A2253] text-white">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-bold leading-5 text-[#18181B]">{title}</span>
            <span className="block text-[12px] leading-4 text-[#71717A]">{subtitle}</span>
          </span>
        </div>
        {count && <span className="shrink-0 rounded-md border border-[#EFE3EA] px-2 py-0.5 text-[12px] font-semibold text-[#7A2253]">{count}</span>}
      </div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

/** One row inside a MockCard: thumbnail (image or icon), title, meta line, trailing element. */
function MockRow({ image, icon: Icon, title, meta, trailing }: { image?: string; icon?: LucideIcon; title: string; meta?: ReactNode; trailing?: ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[#F3EAEF] p-2">
      {image ? (
        <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F7EDF2]">
          <Image src={image} alt="" fill sizes="80px" className="object-cover" />
        </span>
      ) : Icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F7EDF2] text-[#7A2253]">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-[#18181B]">{title}</span>
        {meta && <span className="block truncate text-[11px] text-[#71717A]">{meta}</span>}
      </span>
      {trailing ?? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7EDF2] text-[#7A2253]">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </li>
  );
}

const rupees = (paise: number | null | undefined) => (paise == null ? "" : `₹${Math.round(paise / 100).toLocaleString("en-IN")}`);
const fans = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));
const playBtn = (
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7EDF2] text-[#7A2253]">
    <Play className="h-3.5 w-3.5 fill-current" />
  </span>
);

function SeriesMock() {
  return (
    <MockCard icon={Clapperboard} title="My Series" subtitle="Start at Ep 1 & binge in order." count={`${EXPERT_DEMO_SERIES.length} Series`}>
      {EXPERT_DEMO_SERIES.map((s) => {
        const eps = s.seasons?.reduce((n, se) => n + se.episodes.length, 0) ?? 0;
        return <MockRow key={s.id} image={s.posterDataUrl || undefined} title={s.title} meta={`${eps} episodes · ${s.language}`} trailing={playBtn} />;
      })}
    </MockCard>
  );
}

function LinksMock() {
  const links = EXPERT_DEMO_CUSTOM_LINKS.slice(0, 5);
  return (
    <MockCard icon={Link2} title="My Links" subtitle="Things I want you to see." count={`${EXPERT_DEMO_CUSTOM_LINKS.length} links`}>
      {links.map((l) => (
        <MockRow
          key={l.id}
          icon={l.kind === "collection" ? Package : Link2}
          title={l.title.replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "")}
          meta={l.kind === "collection" ? `${l.items?.length ?? 0} links inside` : (l.url || "").replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
          trailing={
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F7EDF2] text-[#7A2253]">
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          }
        />
      ))}
    </MockCard>
  );
}

function ShopMock() {
  return (
    <MockCard icon={ShoppingBag} title="My Shop" subtitle="Products I proudly recommend." count={`${EXPERT_DEMO_PRODUCTS.length} products`}>
      {EXPERT_DEMO_PRODUCTS.slice(0, 4).map((p) => (
        <MockRow
          key={p.id}
          image={p.imageUrl}
          title={p.name.split(" — ")[0]}
          meta={p.name.split(" — ")[1] || (p.isAffiliate ? "Affiliate link" : "Creator product")}
          trailing={<span className="shrink-0 text-[13px] font-extrabold text-[#7A2253]">{rupees(p.pricePaise)}</span>}
        />
      ))}
    </MockCard>
  );
}

function PackagesMock() {
  return (
    <MockCard icon={Briefcase} title="Work With Me" subtitle="Brands, let's create together." count={`${EXPERT_DEMO_GIGS.length} packages`}>
      {EXPERT_DEMO_GIGS.slice(0, 4).map((g) => (
        <MockRow
          key={g.id}
          icon={Package}
          title={g.title}
          meta={g.platform}
          trailing={<span className="shrink-0 text-[13px] font-extrabold text-[#7A2253]">₹{g.price}</span>}
        />
      ))}
    </MockCard>
  );
}

function FansMock() {
  const yt = EXPERT_DEMO_SOCIALS.youtube?.subscribers ?? 0;
  const ig = EXPERT_DEMO_SOCIALS.instagram?.followers ?? 0;
  const fb = EXPERT_DEMO_SOCIALS.facebook?.followers ?? 0;
  const rows = [
    { label: "Instagram", n: ig, unit: "followers" },
    { label: "YouTube", n: yt, unit: "subscribers" },
    { label: "Facebook", n: fb, unit: "followers" },
  ];
  return (
    <MockCard icon={Users} title="Total Fans" subtitle="Across Instagram, YouTube & Facebook." count={fans(ig + yt + fb)}>
      {rows.map((r) => (
        <MockRow key={r.label} icon={Users} title={r.label} meta={r.unit} trailing={<span className="shrink-0 text-[14px] font-extrabold text-[#18181B]">{fans(r.n)}</span>} />
      ))}
    </MockCard>
  );
}

function ReviewsMock() {
  return (
    <MockCard icon={Star} title="Brand Love" subtitle="Kind words from my collabs." count={`${EXPERT_DEMO_REVIEWS.length} reviews`}>
      {EXPERT_DEMO_REVIEWS.slice(0, 3).map((r) => (
        <MockRow
          key={r.id}
          icon={Star}
          title={r.clientName}
          meta={r.projectTitle}
          trailing={<span className="shrink-0 text-[12px] font-bold text-[#7A2253]">★ {r.rating}</span>}
        />
      ))}
    </MockCard>
  );
}

function SetupMock() {
  return (
    <MockCard icon={Camera} title="My Setup" subtitle="The gear behind my videos." count={`${EXPERT_DEMO_SETUP_ITEMS.length} items`}>
      {EXPERT_DEMO_SETUP_ITEMS.slice(0, 3).map((it) => (
        <MockRow key={it.id} icon={Laptop} title={it.name} meta={it.category} />
      ))}
    </MockCard>
  );
}

function TeamMock() {
  const members = EXPERT_DEMO_TEAM.members || [];
  return (
    <MockCard icon={Handshake} title="My Crew" subtitle="The people behind my videos." count={`${members.length} members`}>
      {members.slice(0, 3).map((m) => (
        <MockRow key={m.id} icon={Users} title={m.name} meta={m.role} />
      ))}
    </MockCard>
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

  // "Starting at ₹99/month … ₹3.30 per day", from config/plans.ts.
  const starterMonthly = formatPlanPrice("starter", "monthly", pricingCurrency);
  const starterPerDay = `${pricingCurrency === "INR" ? "₹" : "$"}${(planPrice("starter", "monthly", pricingCurrency) / 30).toFixed(2)}`;

  const navClass = (id: string) =>
    `text-[14px] font-semibold transition-colors ${activeNav === id ? "text-[#7A2253]" : "text-[#71717A] hover:text-[#18181B]"}`;

  const primaryBtn =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#7A2253] px-5 text-[14px] font-bold text-white transition-colors hover:bg-[#631841] cursor-pointer";
  const secondaryBtn =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E6D3DE] bg-white px-5 text-[14px] font-bold text-[#7A2253] transition-colors hover:bg-[#F7EDF2] cursor-pointer";
  const textLink = "inline-flex items-center gap-1.5 text-[14px] font-bold text-[#7A2253] hover:underline underline-offset-4 cursor-pointer";

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

  const ctaRow = (label: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className={textLink}>
      {label} <ArrowRight className="h-4 w-4" />
    </button>
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
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#EFE3EA] bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#18181B]">
              🇮🇳 Made in India. Built for creators worldwide.
            </p>
            <h1 className="landing-text-hero font-extrabold tracking-tight text-[#18181B]">
              Your content deserves more than <span className="text-[#7A2253]">a social media feed.</span>
            </h1>
            <p className="landing-text-18 mx-auto mt-5 max-w-xl text-[#52525B] lg:mx-0">
              You create the content. Inflixo brings your creator world together: one profile where your audience discovers your series, products, links and the creator behind them.
            </p>
            <p className="mt-4 text-[13px] font-bold tracking-wide text-[#7A2253]">
              One profile · Every series · Every episode · Every product
            </p>
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
      <section id="problem" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Sound familiar?"
            title="You've created so much. How much have your followers discovered?"
            sub="You've made series with many episodes, hundreds of videos, product picks and brand collabs. But every new post pushes the older ones further down your feed."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
            {SCATTERED.map((s) => (
              <div key={s.text} className="flex items-start gap-4 rounded-2xl border border-[#EFE3EA] bg-white p-5">
                <IconTile icon={s.icon} />
                <p className="text-[15px] leading-relaxed text-[#18181B]">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-2xl text-center">
            <p className="text-[20px] font-extrabold leading-snug text-[#18181B] sm:text-[24px]">
              Your content isn&apos;t missing. <span className="text-[#7A2253]">It&apos;s simply scattered.</span>
            </p>
            <p className="mt-2 text-[15px] text-[#52525B]">What if your audience could discover more of your work without searching through hundreds of posts? That&apos;s why we built Inflixo.</p>
          </div>
        </div>
      </section>

      {/* ── 02. MEET INFLIXO ── */}
      <section id="features" className="scroll-mt-20 border-t border-[#EFE3EA] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Meet Inflixo"
            title="More than a link in bio."
            sub="Your content. Your identity. Your creator world. Instead of different links for different purposes, give your audience and brand partners one organized destination."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2">
            {CAN_DO.map((c) => (
              <div key={c.text} className="flex items-center gap-3 rounded-xl border border-[#EFE3EA] bg-white px-4 py-3">
                <c.icon className="h-5 w-5 shrink-0 text-[#7A2253]" />
                <span className="text-[14px] font-semibold text-[#18181B]">{c.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="text-[16px] font-bold text-[#18181B]">You focus on creating. Inflixo helps people explore what you&apos;ve created.</p>
            {ctaRow("Create my Inflixo profile", () => handleClaim(username))}
          </div>
        </div>
      </section>

      {/* ── 03. SERIES ── */}
      <section id="series" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <SeriesMock />
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading
              center={false}
              eyebrow="Series & episodes"
              title="Every series has a story. Make every episode easy to find."
              sub="Food, travel, comedy, tutorials: five series, many episodes each. When a new follower lands on your profile, can they find all five and know where to start? With Inflixo, each series gets a home of its own, with episodes in the right order."
            />
            <div className="mt-6 rounded-2xl border border-[#EFE3EA] bg-white p-5">
              <p className="flex items-center gap-2 text-[15px] font-bold text-[#18181B]">
                <Play className="h-4 w-4 fill-[#7A2253] text-[#7A2253]" /> Your videos stay on their original platforms.
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#52525B]">
                Tapping an episode opens the original video on Instagram, YouTube or Facebook. Nothing is re-uploaded, so older episodes and other series get more chances to be watched where your content already lives.
              </p>
            </div>
            <p className="mt-5 text-[15px] font-bold text-[#7A2253]">More content discovered. More opportunities to be watched.</p>
            <div className="mt-4">{ctaRow("Organize my video series", () => handleClaim(username))}</div>
          </div>
        </div>
      </section>

      {/* ── LINKS ── */}
      <section id="links" className="scroll-mt-20 border-t border-[#EFE3EA] bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHeading
              center={false}
              eyebrow="Links"
              title="One link. Everything your audience needs."
              sub="Instagram, YouTube, Facebook, your website, your latest campaign, your favorite resources. Why make your audience search for each one? Keep them all on one creator profile, and group related links into folders."
            />
            <p className="mt-5 text-[15px] font-bold text-[#7A2253]">Less searching. Easier access. One Inflixo link.</p>
            <div className="mt-4">{ctaRow("Organize my links", () => handleClaim(username))}</div>
          </div>
          <LinksMock />
        </div>
      </section>

      {/* ── CREATOR SHOP ── */}
      <section id="shop" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <ShopMock />
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading center={false} eyebrow="Creator Shop" title="Your recommendations deserve their own shop." />
            <div className="mt-5 space-y-2">
              {SHOP_DMS.map((q) => (
                <p key={q} className="flex w-fit items-center gap-2 rounded-xl rounded-bl-sm bg-white px-3 py-1.5 text-[13px] text-[#18181B] shadow-sm">
                  <MessageCircle className="h-3.5 w-3.5 text-[#7A2253]/60" /> {q}
                </p>
              ))}
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-[#52525B]">
              Add product images, names, prices and shopping links. Fans browse your picks and buy from the original store, and Inflixo takes no cut. Fashion, food, tech, beauty or lifestyle: your recommendations become easy to find.
            </p>
            <div className="mt-4">{ctaRow("Build my Creator Shop", () => handleClaim(username))}</div>
          </div>
        </div>
      </section>

      {/* ── BRANDS ── */}
      <section id="brands" className="scroll-mt-20 border-t border-[#EFE3EA] bg-white py-16 sm:py-24">
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
                    <span className="block text-[15px] font-bold text-[#18181B]">{c.title}</span>
                    <span className="block text-[14px] leading-relaxed text-[#52525B]">{c.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6">{ctaRow("Create my media kit", () => handleClaim(username))}</div>
          </div>
          <PackagesMock />
        </div>
      </section>

      {/* ── IDENTITY: fanbase, era, reviews, setup, team ── */}
      <section id="identity" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                center={false}
                eyebrow="Your creator identity"
                title="Your influence is bigger than one platform."
                sub="Followers on Instagram, subscribers on YouTube, a community on Facebook. Inflixo adds them up into one total fanbase, so fans and brands see your real reach at a glance."
              />
              <div className="mt-6 flex gap-3 rounded-2xl border border-[#EFE3EA] bg-white p-5">
                <IconTile icon={Sparkles} />
                <span>
                  <span className="block text-[15px] font-bold text-[#18181B]">Celebrate your Creator Era</span>
                  <span className="block text-[14px] leading-relaxed text-[#52525B]">
                    Just beginning, growing or established: Creator Era celebrates where you are, because your identity is more than one follower count.
                  </span>
                </span>
              </div>
            </div>
            <FansMock />
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-[24px] font-extrabold leading-tight tracking-tight text-[#18181B] sm:text-[32px]">Show the people, passion and tools behind your work.</h3>
            <p className="mx-auto mt-2 max-w-2xl text-[15px] text-[#52525B]">Reviews add confidence, your setup answers the &ldquo;which camera?&rdquo; DMs, and your crew gets the credit they deserve.</p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ReviewsMock />
            <SetupMock />
            <TeamMock />
          </div>
          <p className="mt-8 text-center text-[14px] text-[#52525B]">
            <Palette className="mr-1.5 inline h-4 w-4 text-[#7A2253]" />
            Pick a theme that feels like you. Mobile-friendly, no website to build.
          </p>
          <div className="mt-4 text-center">{ctaRow("Showcase my creator identity", () => handleClaim(username))}</div>
        </div>
      </section>

      {/* ── LIVE DEMO ── */}
      <section id="demo" className="scroll-mt-20 border-t border-[#EFE3EA] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 text-center sm:px-6">
          <SectionHeading
            eyebrow="Live demo"
            title={username.trim() ? `This could be @${previewHandle}.` : "Make your first impression count."}
            sub="This is a real Inflixo profile. Tap a series to see its episodes in order."
          />
          <div className="mx-auto mt-10 max-w-[620px] rounded-3xl border border-[#EFE3EA] bg-white p-2 shadow-sm sm:p-3">
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
              Explore the full demo profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 11. GETTING STARTED ── */}
      <section id="how" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Getting started"
            title="Your creator profile is a few steps away."
            sub="No website to build. No complicated setup."
          />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-[#EFE3EA] bg-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7A2253] text-[13px] font-extrabold text-white">{i + 1}</span>
                <h3 className="mt-3 text-[16px] font-bold text-[#18181B]">{s.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#52525B]">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <button onClick={() => handleClaim(username)} className={primaryBtn}>
              Get started free <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 12. PRICING ── */}
      <section id="pricing" className="scroll-mt-20 border-t border-[#EFE3EA] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
          <SectionHeading
            eyebrow="Pricing"
            title="A professional creator profile for less than your daily cup of chai."
            sub={`Big dreams don't need an expensive beginning. Plans start at ${starterMonthly}/month, about ${starterPerDay} a day.`}
          />

          <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-[#E6D3DE] bg-white p-5 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-[18px] font-extrabold text-[#18181B]">Try Inflixo free for {PLANS.trial.trialDays} days</p>
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
                  className={`relative flex flex-col justify-between rounded-2xl bg-white p-6 ${popular ? "border-2 border-[#7A2253]" : "border border-[#EFE3EA]"}`}
                >
                  {popular && (
                    <span className="absolute -top-3.5 right-6 rounded-full bg-[#7A2253] px-3 py-0.5 text-[12px] font-bold uppercase tracking-wider text-white">Popular</span>
                  )}
                  <div>
                    <h3 className="text-[22px] font-bold text-[#18181B]">{plan.name}</h3>
                    <p className="mt-1 min-h-[42px] text-[14px] text-[#52525B]">{blurb}</p>
                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="text-[40px] font-extrabold leading-none text-[#18181B]">{formatPlanPrice(key, "monthly", pricingCurrency)}</span>
                      <span className="text-[14px] text-[#52525B]">/ month</span>
                    </div>
                    <p className="mt-1 text-[12px] font-semibold text-[#7A2253]">
                      Or {formatPlanPrice(key, "yearly", pricingCurrency)}/year (save {yearlySavingsPercent(key, pricingCurrency)}%)
                    </p>
                    <ul className="mt-5 space-y-2 text-[14px] text-zinc-700">
                      {features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A2253]" />
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
      <section id="vision" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7EDF2] px-3 py-1 text-[12px] font-bold text-[#7A2253]">
              <Sparkles className="h-3.5 w-3.5" /> Coming in the future
            </span>
            <h2 className="mt-4 text-[30px] font-extrabold leading-tight tracking-tight text-[#18181B] sm:text-[42px]">
              We&apos;re building something bigger: OTT-style content discovery.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#52525B]">
              Today, Inflixo helps you organize your content for your existing audience. Tomorrow, imagine one destination where viewers discover series from many creators, by category: food lovers finding food series, travellers finding travel stories, comedy fans finding comedy, without needing to know a creator&apos;s username first.
            </p>
            <p className="mt-4 text-[16px] font-bold text-[#18181B]">Discover on Inflixo. Watch on the original platform.</p>
            <p className="mt-2 text-[14px] leading-relaxed text-[#52525B]">
              Episodes would still open on Instagram, YouTube or Facebook, giving creators a chance to reach audiences beyond their current followers.
            </p>
            <p className="mt-5 text-[12px] text-[#71717A]">The OTT-style discovery experience is part of our future roadmap and is not available yet.</p>
          </div>
          <div className="grid grid-cols-2 gap-3" aria-hidden="true">
            {[
              { cat: "Food", title: "Street food trails" },
              { cat: "Travel", title: "Road trips & stories" },
              { cat: "Comedy", title: "Sketch series" },
              { cat: "Tutorials", title: "Learn in parts" },
            ].map((t) => (
              <div key={t.cat} className="rounded-2xl border border-[#EFE3EA] bg-gradient-to-br from-[#F7EDF2] to-white p-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#7A2253] text-white">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[#7A2253]">{t.cat}</p>
                <p className="mt-0.5 text-[14px] font-bold text-[#18181B]">{t.title}</p>
                <p className="text-[12px] text-[#71717A]">Series from many creators</p>
              </div>
            ))}
            <p className="col-span-2 text-center text-[11px] text-[#A1A1AA]">Illustration of a future idea</p>
          </div>
        </div>
      </section>

      {/* ── 14 + 15. VISION 2027 & GLOBAL CREATOR SUMMIT ── */}
      <section id="summit" className="scroll-mt-20 border-t border-[#EFE3EA] bg-[#F7EDF2] py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Eyebrow>Vision 2027</Eyebrow>
          <h2 className="mt-3 text-[30px] font-extrabold leading-tight tracking-tight text-[#18181B] sm:text-[44px]">
            10,000+ paid creators. One global community.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#52525B]">
            Every creator begins somewhere: a phone and an idea, years of building an audience, a passion turning into a profession. Our goal is to bring more than 10,000 paid creators into the Inflixo community by 2027, a place to discover one another, learn, collaborate and grow.
          </p>

          <div className="mt-10 rounded-3xl border border-[#E6D3DE] bg-white p-6 text-left sm:p-8">
            <div className="flex items-center gap-3">
              <IconTile icon={Globe} />
              <h3 className="text-[20px] font-extrabold leading-snug text-[#18181B] sm:text-[24px]">Imagine 10,000+ creators at one Global Creator Summit.</h3>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-[#52525B]">
              Creators from different cities, countries and languages on one stage. Creators who started with an idea, worked late nights on the next video, and built communities one follower at a time. Not competing for attention, but celebrating creativity and inspiring the next generation.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[#52525B]">
              A vision this big can&apos;t be built by one company alone. It needs creators like you, from the beginning.
            </p>
            <p className="mt-5 text-[18px] font-extrabold italic text-[#7A2253]">&ldquo;We started building this dream together.&rdquo;</p>
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
      <section id="faq" className="scroll-mt-20 border-t border-[#EFE3EA] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
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

      {/* ── 17. FINAL CTA ── */}
      <section className="border-t border-[#EFE3EA] bg-[#FBF6F9] py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl space-y-5 px-4 sm:px-6">
          <h2 className="text-[30px] font-extrabold leading-tight tracking-tight text-[#18181B] sm:text-[44px]">
            You&apos;ve already created the content. <span className="text-[#7A2253]">Now help people discover it.</span>
          </h2>
          <p className="text-[16px] leading-relaxed text-[#52525B]">
            Your series, your recommendations, your collaborations and the community you&apos;ve built. Bring it all together with Inflixo.
          </p>
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
      <footer ref={footerRef} className="border-t border-[#EFE3EA] bg-white py-14">
        <div className="mx-auto max-w-[1120px] space-y-10 px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <Logo size="sm" />
              <p className="text-[14px] leading-relaxed text-[#52525B]">Your content. Your identity. Your creator world.</p>
              <p className="text-[12px] font-semibold text-zinc-500">Made in India 🇮🇳</p>
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#18181B]">Product</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><a href="#series" className="hover:text-[#7A2253]">Series</a></li>
                <li><a href="#features" className="hover:text-[#7A2253]">Features</a></li>
                <li><a href="#demo" className="hover:text-[#7A2253]">Live demo</a></li>
                <li><a href="#pricing" className="hover:text-[#7A2253]">Pricing</a></li>
                <li><a href="#summit" className="hover:text-[#7A2253]">Vision 2027</a></li>
                <li><a href="#faq" className="hover:text-[#7A2253]">FAQ</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#18181B]">Company</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><a href="mailto:support@inflixo.com?subject=Inflixo%20Support" className="hover:text-[#7A2253]">Contact Support</a></li>
                <li>
                  <a href="https://instagram.com/inflixo_app" target="_blank" rel="noopener noreferrer" className="hover:text-[#7A2253]">
                    Instagram (@inflixo_app)
                  </a>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-[#18181B]">Legal</p>
              <ul className="space-y-2 text-[14px] text-[#52525B]">
                <li><Link href="/privacy" className="hover:text-[#7A2253]">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-[#7A2253]">Terms of Service</Link></li>
                <li><Link href="/creator-terms" className="hover:text-[#7A2253]">Creator Terms &amp; Conditions</Link></li>
                <li><Link href="/cookies" className="hover:text-[#7A2253]">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#EFE3EA] pt-8 text-[12px] text-[#52525B] sm:flex-row">
            <p>© 2026 Inflixo. All rights reserved.</p>
            <Link href="/login" className="font-medium underline hover:text-[#7A2253]">
              Log in to Dashboard
            </Link>
          </div>
        </div>
      </footer>

      {showScrollTop && !footerInView && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#EFE3EA] bg-white text-[#7A2253] shadow-md hover:bg-zinc-50"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

