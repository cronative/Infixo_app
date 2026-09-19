"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Camera,
  Captions,
  Clapperboard,
  Check,
  ExternalLink,
  Film,
  Globe,
  ImageIcon,
  MessageSquareText,
  Mic2,
  Music2,
  PenLine,
  Play,
  Scissors,
  ShieldCheck,
  Share2,
  Users,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { AuthService } from "@/services/AuthService";
import { OnboardingService } from "@/services/OnboardingService";
import { ProfileService } from "@/services/ProfileService";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { CreatorProfile, CreatorReview, MediaKitPackage, Series, SocialAccounts, ThemeKey } from "@/types";
import { openCookiePreferences } from "@/lib/cookieConsent";
import { formatPlanPrice, usePricingCurrency } from "@/lib/pricing";
import {
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_GIGS,
  EXPERT_DEMO_CUSTOM_LINKS,
  EXPERT_DEMO_REVIEWS,
  EXPERT_DEMO_THEME,
} from "@/data/expertDemoCreator";

const DEFAULT_THEME: ThemeKey = EXPERT_DEMO_THEME;

const PILLARS = [
  {
    icon: Film,
    title: "Video Series & Playlists",
    text: "Group videos into ordered playlists so fans can easily watch Part 1, 2, and 3 without searching your feed.",
  },
  {
    icon: Play,
    title: "Views Stay Yours",
    text: "Videos open directly on your original YouTube, Instagram, or Facebook post. Views, likes, and comments grow on your platform.",
  },
  {
    icon: Users,
    title: "Total Fanbase Counter",
    text: "Combine your YouTube subscribers, Instagram followers, and Facebook audience into one verified trust number.",
  },
  {
    icon: MessageSquareText,
    title: "Collabs & Rate Cards",
    text: "Add sponsorship packages, pricing, and contact options so brands can quickly book you.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Reviews",
    text: "Show testimonials from brands and collaborators to build instant credibility before deals.",
  },
  {
    icon: Globe,
    title: "One Clean Link",
    text: "Replace messy link trees with a sleek, video-first portfolio at inflixo.com/yourname.",
  },
];

const FAQS = [
  {
    q: "How does Inflixo fetch my followers and subscribers?",
    a: "Just enter your public profile link or username. Inflixo reads only public follower and subscriber counts. We never ask for passwords or private account access.",
  },
  {
    q: "Do my fans need an app or account to watch?",
    a: "No. Anyone can open your Inflixo link directly in any mobile or desktop browser without signing up.",
  },
  {
    q: "Does Inflixo host or re-upload my videos?",
    a: "No. Your videos stay on YouTube, Instagram, or Facebook. Inflixo only organizes your video links into a clean playlist format.",
  },
  {
    q: "Will my YouTube or Instagram views be affected?",
    a: "Not at all. When fans click a video, it opens your original post. All views, watch time, likes, and comments count directly on your channel.",
  },
  {
    q: "What is Total Fanbase?",
    a: "It is the sum of your public audience across Instagram, Facebook, and YouTube, displayed as one combined reach metric for fans and brands.",
  },
  {
    q: "Can I create multiple series and playlists?",
    a: "Yes! Organize your tutorials, vlogs, podcasts, or comedy sketches into separate series with sequential episodes.",
  },
  {
    q: "Can I keep my collab rates private?",
    a: "Yes. You can keep your profile public while sharing your rate cards only with brands when you choose.",
  },
  {
    q: "How do client reviews work?",
    a: "Send your review link to any brand or client. They can submit feedback in seconds without creating an Inflixo account.",
  },
  {
    q: "Can I customize what appears on my profile?",
    a: "Yes. Easily toggle and reorder your social accounts, series, links, collab packages, and theme colors anytime.",
  },
  {
    q: "Who is Inflixo built for?",
    a: "Any video creator — vloggers, educators, podcasters, comedy creators, artists, reviewers, and influencers who want an organized portfolio.",
  },
];

const SERIES_STEPS = [
  {
    label: "01 Paste",
    title: "Paste your video links",
    text: "Add links from YouTube, Instagram, or Facebook. Zero re-uploading needed.",
  },
  {
    label: "02 Group",
    title: "Create ordered series",
    text: "Arrange Part 1, 2, 3 in sequence so fans always know what to watch next.",
  },
  {
    label: "03 Share",
    title: "Put one link in bio",
    text: "Share inflixo.com/yourname so fans can watch your best work in one place.",
  },
];

const CREATOR_TOOL_FLOATS = [
  { icon: Camera, label: "Camera", className: "left-[4%] top-24 rotate-[-6deg]", duration: "17s", delay: "-1s" },
  { icon: Video, label: "Video", className: "right-[5%] top-28 rotate-[5deg]", duration: "19s", delay: "-5s" },
  { icon: Clapperboard, label: "Shoot", className: "left-[12%] top-44 rotate-[4deg]", duration: "15s", delay: "-8s" },
  { icon: Scissors, label: "Edit", className: "right-[12%] top-52 rotate-[-5deg]", duration: "18s", delay: "-3s" },
  { icon: Captions, label: "Captions", className: "left-[5%] top-[315px] rotate-[5deg]", duration: "21s", delay: "-11s" },
  { icon: Mic2, label: "Voice", className: "right-[7%] top-[335px] rotate-[-4deg]", duration: "16s", delay: "-6s" },
  { icon: ImageIcon, label: "Thumbnail", className: "left-[16%] bottom-24 rotate-[-3deg]", duration: "20s", delay: "-13s" },
  { icon: Music2, label: "Audio", className: "right-[17%] bottom-24 rotate-[4deg]", duration: "14s", delay: "-4s" },
  { icon: PenLine, label: "Script", className: "left-[5%] bottom-10 rotate-[6deg]", duration: "22s", delay: "-9s" },
  { icon: Share2, label: "Share", className: "right-[5%] bottom-12 rotate-[-5deg]", duration: "18s", delay: "-12s" },
  { icon: BarChart3, label: "Stats", className: "left-[23%] top-[285px] rotate-[-5deg]", duration: "23s", delay: "-16s" },
  { icon: WandSparkles, label: "Polish", className: "right-[23%] top-[295px] rotate-[5deg]", duration: "16s", delay: "-7s" },
];

const HERO_MESSAGES = [
  {
    title: "All your video series in one link.",
    subtitle: "Organise your YouTube, Instagram, and Facebook videos into playlists. Fans easily find Part 1, 2, and 3 without getting lost in the feed.",
  },
  {
    title: "Never lose views on your best content.",
    subtitle: "Reels and Shorts disappear quickly in the algorithm. Keep your top videos organized so new fans can watch your best work anytime.",
  },
  {
    title: "Views and likes stay 100% yours.",
    subtitle: "When fans click, your original video opens. Your YouTube views, Instagram likes, and comments keep growing on your own channels.",
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
  const [heroMessageIndex, setHeroMessageIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 420);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroMessageIndex((current) => (current + 1) % HERO_MESSAGES.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    EXPERT_DEMO_SERIES.forEach((series) => {
      if (!series.posterDataUrl) return;
      const img = new window.Image();
      img.src = series.posterDataUrl;
    });
  }, []);

  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.14 },
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  function handleClaim(raw: string) {
    const handle = cleanHandle(raw);
    router.push(handle ? `/login?claim=${handle}` : "/login");
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const previewHandle = cleanHandle(username) || EXPERT_DEMO_PROFILE.username || "demo_creator";
  const previewProfile: CreatorProfile = username.trim()
    ? {
      displayName: username.trim().charAt(0).toUpperCase() + username.trim().slice(1),
      username: previewHandle,
      category: "Digital Creator",
      bio: `Videos, playlists, fan links and creator profile for @${previewHandle}.`,
      photoDataUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(previewHandle)}`,
      updatedAt: new Date().toISOString(),
    }
    : EXPERT_DEMO_PROFILE;

  const heroMessage = HERO_MESSAGES[heroMessageIndex];
  const previewSocials = useMemo<SocialAccounts>(() => (
    username.trim()
      ? {
        instagram: { url: `https://instagram.com/${previewHandle}`, followers: 100000, posts: 180, username: previewHandle },
        youtube: { url: `https://youtube.com/@${previewHandle}`, subscribers: 28000, videos: 72, totalViews: 5400000, username: previewHandle },
        facebook: { url: `https://facebook.com/${previewHandle}`, followers: 48400, posts: 112, username: previewHandle },
        updatedAt: new Date().toISOString(),
      }
      : EXPERT_DEMO_SOCIALS
  ), [previewHandle, username]);

  if (checkingAuth && isLoggedIn) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fafc]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#043084] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f8fafc] text-[#043084] antialiased selection:bg-[#04308414] selection:text-[#043084]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 text-xs font-bold text-[#64748b] sm:px-6">
          <Logo size="sm" />
          <nav className="hidden items-center gap-5 md:flex">
            <button onClick={() => previewRef.current?.scrollIntoView({ behavior: "smooth" })} className="transition-colors hover:text-brand-primary">Series Preview</button>
            <button onClick={() => scrollToSection("pillars")} className="transition-colors hover:text-brand-primary">Creator Tools</button>
            <button onClick={() => scrollToSection("pricing")} className="transition-colors hover:text-brand-primary">Pricing</button>
            <button onClick={() => scrollToSection("faq")} className="transition-colors hover:text-brand-primary">FAQ</button>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="tap-scale group relative inline-flex items-center gap-1.5 overflow-hidden rounded-[10px] bg-[#043084] px-4 py-2 text-xs font-bold text-white shadow-xs shadow-[#043084]/20 ring-2 ring-[#043084]/15 transition-all hover:-translate-y-0.5 hover:bg-[#03256c] hover:shadow-md hover:shadow-[#043084]/30 hover:ring-[#043084]/35 cursor-pointer"
            >
              <span className="absolute inset-0 -translate-x-full animate-[infixo-sheen_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="relative z-10 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-white pt-28 sm:pt-32">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-[0.55]" aria-hidden="true">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(21,25,51,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(21,25,51,0.055)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="absolute left-0 top-0 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(21,25,51,0.45),transparent)] [animation:infixo-scan-x_5s_ease-in-out_infinite]" />
          {CREATOR_TOOL_FLOATS.map((tool) => (
            <div
              key={tool.label}
              className={`absolute hidden md:block ${tool.className}`}
            >
              <div
                className="creator-tool-float flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#043084]/10 bg-white/65 text-[#043084]/45 shadow-[0_14px_35px_rgba(21,25,51,0.06)] backdrop-blur-md"
                style={{
                  "--float-duration": tool.duration,
                  "--float-delay": tool.delay,
                } as CSSProperties}
                aria-label={tool.label}
              >
                <tool.icon className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="mx-auto flex h-[270px] max-w-4xl flex-col justify-center sm:h-[260px] md:h-[240px]">
            <div key={heroMessage.title} className="hero-copy-slide">
              <h1 className="mx-auto max-w-3xl font-display text-4xl font-black leading-[0.98] tracking-tight text-[#043084] sm:text-6xl md:text-[76px]">
                {heroMessage.title}
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-sm font-medium leading-relaxed text-[#64748b] sm:text-base">
                {heroMessage.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2" aria-label="Hero message slides">
            {HERO_MESSAGES.map((message, index) => (
              <button
                key={message.title}
                type="button"
                onClick={() => setHeroMessageIndex(index)}
                className={`h-1.5 rounded-full transition-all ${index === heroMessageIndex ? "w-7 bg-[#043084]" : "w-1.5 bg-[#043084]/20 hover:bg-[#043084]/35"}`}
                aria-label={`Show message ${index + 1}`}
              />
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleClaim(username);
            }}
            className="mx-auto mt-7 flex max-w-md items-center rounded-[12px] border border-[#043084]/15 bg-white p-1.5 shadow-[0_18px_50px_rgba(21,25,51,0.10)] transition-all focus-within:-translate-y-0.5 focus-within:border-[#043084] focus-within:ring-4 focus-within:ring-[#043084]/10"
          >
            <span className="shrink-0 pl-3 text-xs font-semibold text-[#94a3b8] sm:text-sm">inflixo.com/</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="yourname"
              className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-xs font-semibold text-[#043084] outline-none placeholder:text-[#94a3b8] sm:text-sm"
            />
            <button
              type="submit"
              className="group inline-flex shrink-0 items-center gap-1 rounded-[9px] bg-[#043084] px-4 py-2 text-xs font-black text-white transition-all hover:bg-brand-hover cursor-pointer"
            >
              Claim
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pb-[24px] text-[11px] font-bold text-[#64748b]">
            <span>✓ No visitor signup needed</span>
            <span>✓ Views stay on your YouTube & Instagram</span>
            <span>✓ No video re-uploading</span>
            <span>✓ 7-day free trial</span>
          </div>
        </div>

      </section>

      <section ref={previewRef} className="relative overflow-hidden bg-[#f8fafc] py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-20 h-px bg-[linear-gradient(90deg,transparent,rgba(21,25,51,0.25),transparent)] [animation:infixo-scan-x_7s_ease-in-out_infinite]" aria-hidden="true" />
        <div data-scroll-reveal className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">Live Demo</p>
          <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-[#043084] sm:text-4xl">
            {username.trim() ? `See @${previewHandle}'s Live Profile` : "See Live Creator Profile"}
          </h2>
          <p className="mt-2 text-sm font-medium text-[#64748b]">
            Explore complete creator series, combined audience counter & brand collab cards.
          </p>

          <div data-scroll-reveal style={{ "--reveal-delay": "120ms" } as CSSProperties} className="group mx-auto mt-8 max-w-[650px] rounded-[24px] border border-[#043084]/12 bg-[#043084] p-2 shadow-[0_30px_90px_rgba(21,25,51,0.22)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_42px_110px_rgba(21,25,51,0.28)] sm:p-3">
            <div className="mb-3 flex items-center justify-between rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#043084]/25" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#043084]/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#043084]/60" />
              </div>
              <span className="rounded-full bg-white px-3 py-0.5 text-[11px] font-bold text-[#64748b] ring-1 ring-[#e2e8f0]">
                inflixo.com/{previewHandle}
              </span>
              <span className="w-10" />
            </div>

            <div className="rounded-[18px] bg-white p-2">
              <LivePreviewCard
                profile={previewProfile}
                socials={previewSocials}
                series={EXPERT_DEMO_SERIES}
                customLinks={EXPERT_DEMO_CUSTOM_LINKS}
                mediaKitPackages={EXPERT_DEMO_GIGS}
                reviews={EXPERT_DEMO_REVIEWS}
                totalAudience={1345000}
                themeKey={EXPERT_DEMO_THEME}
                variant="full"
                seriesOpenMode="internal"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div data-scroll-reveal>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">How It Works</p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-[#043084] sm:text-5xl">
                Make your videos easy to watch in order.
              </h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-[#64748b]">
                Paste your video links. Inflixo groups them into clean series so fans can easily watch Part 1, 2, and 3 without searching.
              </p>
            </div>

            <div className="grid gap-3">
              {SERIES_STEPS.map((step, index) => (
                <div
                  key={step.title}
                  data-scroll-reveal
                  style={{ "--reveal-delay": `${index * 90}ms` } as CSSProperties}
                  className="group relative overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-[#f8fafc] p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#043084]/25 hover:bg-white hover:shadow-[0_18px_45px_rgba(21,25,51,0.09)]"
                >
                  <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-[#043084]/5 to-transparent opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" aria-hidden="true" />
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#043084] font-display text-sm font-black text-white">
                      0{index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">{step.label}</p>
                      <h3 className="mt-1 font-display text-lg font-black text-[#043084]">{step.title}</h3>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-[#64748b]">{step.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="bg-[#f8fafc] py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div data-scroll-reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">The Problem</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-[#043084] sm:text-5xl">
              Your best videos get lost in the feed
            </h2>
            <p className="mt-3 text-sm font-medium text-[#64748b]">
              Reels and Shorts disappear after 24 hours. Inflixo gives your content a permanent, organized home.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div data-scroll-reveal style={{ "--reveal-delay": "80ms" } as CSSProperties} className="rounded-[16px] border border-[#e2e8f0] bg-[#f8fafc] p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#043084]/20 hover:shadow-[0_18px_45px_rgba(21,25,51,0.08)]">
              <h3 className="font-display text-base font-black text-[#043084]">Without Inflixo</h3>
              <ul className="mt-4 space-y-2 text-sm font-semibold text-[#64748b]">
                {["Part 1, 2, and 3 get scattered in your feed", "Fans keep asking 'Where is the next part?'", "Old videos stop getting new views", "Bio has too many messy, confusing links", "No simple way to prove total reach to brands"].map((item) => (
                  <li key={item} className="flex gap-2">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-[#043084]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div data-scroll-reveal style={{ "--reveal-delay": "160ms" } as CSSProperties} className="group relative overflow-hidden rounded-[16px] border border-[#043084] bg-white p-5 text-left shadow-[0_18px_45px_rgba(21,25,51,0.10)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(21,25,51,0.14)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#043084]" aria-hidden="true" />
              <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-[#043084]/5 to-transparent opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" aria-hidden="true" />
              <h3 className="font-display text-base font-black text-[#043084]">With Inflixo</h3>
              <ul className="mt-4 space-y-2 text-sm font-semibold text-[#334155]">
                {["Organized series with Part 1, 2, 3 in order", "One simple link: inflixo.com/yourname", "Old videos keep getting new views and fans", "Views stay 100% on your original platform", "Live fanbase counter and brand rate cards"].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#043084]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="pillars" className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div data-scroll-reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">Creator Tools</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-[#043084] sm:text-5xl">
              Everything a video creator needs
            </h2>
            <p className="mt-3 text-sm font-medium text-[#64748b]">
              First organize your series. Then showcase your fanbase, brand packages, and verified reviews.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((pillar, index) => (
              <div key={pillar.title} data-scroll-reveal style={{ "--reveal-delay": `${index * 70}ms` } as CSSProperties} className="group rounded-[16px] border border-[#e2e8f0] bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#043084]/25 hover:shadow-[0_18px_45px_rgba(21,25,51,0.08)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#043084] text-white transition-transform duration-300 group-hover:rotate-3">
                  <pillar.icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 font-display text-base font-black text-[#043084]">{pillar.title}</h3>
                <p className="mt-2 text-xs font-medium leading-relaxed text-[#64748b]">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f8fafc] py-14 text-[#043084] sm:py-20">
        <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(21,25,51,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(21,25,51,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="absolute inset-x-0 top-10 h-px bg-[linear-gradient(90deg,transparent,rgba(21,25,51,0.25),transparent)] [animation:infixo-scan-x_7s_ease-in-out_infinite]" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div data-scroll-reveal>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">Our Mission</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-5xl">
              Built for Indian creators.
            </h2>
          </div>
          <div data-scroll-reveal style={{ "--reveal-delay": "120ms" } as CSSProperties} className="rounded-[18px] border border-[#e2e8f0] bg-white p-5 text-left shadow-[0_20px_60px_rgba(21,25,51,0.08)] sm:p-7">
            <p className="text-sm font-medium leading-relaxed text-[#334155] sm:text-base">
              Our mission is to help creators organize their best work, reach new fans, and earn with confidence.
            </p>
            <p className="mt-4 text-sm font-medium leading-relaxed text-[#64748b]">
              Building towards 30,000+ creators and India&apos;s biggest creator summit by 2027.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div data-scroll-reveal className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">Simple Pricing</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-[#043084] sm:text-5xl">
              Start free. Grow with your fans.
            </h2>
            <p className="mt-3 text-sm font-medium text-[#64748b]">Try all features free for 7 days. Upgrade anytime to keep your creator profile live.</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div data-scroll-reveal style={{ "--reveal-delay": "80ms" } as CSSProperties} className="flex flex-col justify-between rounded-[14px] border border-[#e2e8f0] bg-[#f8fafc] p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#043084]/20 hover:shadow-[0_22px_60px_rgba(21,25,51,0.10)]">
              <div>
                <h3 className="font-display text-xl font-black text-[#043084]">Free Trial</h3>
                <p className="mt-1 text-sm font-medium text-[#64748b]">Try your public creator profile for 7 days.</p>
                <p className="mt-7 font-display text-5xl font-black text-[#043084]">₹0</p>
                <p className="mt-1 text-xs font-semibold text-[#64748b]">7 days public</p>
                <ul className="mt-7 space-y-2 text-sm font-semibold text-[#334155]">
                  {["7 days public profile", "3 series with 15 total episodes", "5 custom links", "1 collab package", "1 review", "Free themes", "Social stats fetch", "Inflixo branding"].map((item) => (
                    <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[#043084]" />{item}</li>
                  ))}
                </ul>
                <div className="mt-5 rounded-[8px] border border-amber-200 bg-amber-50/70 p-3 text-xs font-semibold text-amber-900 leading-relaxed">
                  After 7 days trial, your profile goes private, your fans can&apos;t see it.
                </div>
              </div>
              <button onClick={() => handleClaim(username)} className="group mt-7 w-full rounded-[8px] bg-[#043084] px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-[0_14px_35px_rgba(21,25,51,0.20)] cursor-pointer">
                Build Free Profile
              </button>
            </div>

            <div data-scroll-reveal style={{ "--reveal-delay": "120ms" } as CSSProperties} className="rounded-[14px] border border-[#e2e8f0] bg-white p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#043084]/20 hover:shadow-[0_22px_60px_rgba(21,25,51,0.10)]">
              <h3 className="font-display text-xl font-black text-[#043084]">Starter</h3>
              <p className="mt-1 text-sm font-medium text-[#64748b]">Keep your public profile live after trial.</p>
              <p className="mt-7 font-display text-5xl font-black text-[#043084]">{formatPlanPrice("starter", "monthly", pricingCurrency)}</p>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">/month or {formatPlanPrice("starter", "yearly", pricingCurrency)}/year</p>
              <ul className="mt-7 space-y-2 text-sm font-semibold text-[#334155]">
                {["Public profile always live", "3 series with 15 total episodes", "5 custom links", "1 collab package", "1 review", "Free themes", "Social stats fetch", "Inflixo branding"].map((item) => (
                  <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[#043084]" />{item}</li>
                ))}
              </ul>
              <button onClick={() => handleClaim(username)} className="group mt-7 w-full rounded-[8px] border border-[#043084] bg-white px-5 py-3 text-sm font-black text-[#043084] transition-all hover:-translate-y-0.5 hover:bg-[#043084] hover:text-white hover:shadow-[0_14px_35px_rgba(21,25,51,0.16)] cursor-pointer">
                Keep Profile Public
              </button>
            </div>

            <div data-scroll-reveal style={{ "--reveal-delay": "160ms" } as CSSProperties} className="group relative overflow-hidden rounded-[14px] border border-[#e2e8f0] bg-white p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#043084]/20 hover:shadow-[0_22px_60px_rgba(21,25,51,0.10)]">
              <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-[#043084]/5 to-transparent opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" aria-hidden="true" />
              <h3 className="font-display text-xl font-black text-[#043084]">Pro</h3>
              <p className="mt-1 text-sm font-medium text-[#64748b]">For active creators who publish regular series and work with brands.</p>
              <p className="mt-7 font-display text-5xl font-black text-[#043084]">{formatPlanPrice("pro", "monthly", pricingCurrency)}</p>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">/month or {formatPlanPrice("pro", "yearly", pricingCurrency)}/year</p>
              <ul className="mt-7 space-y-2 text-sm font-semibold text-[#334155]">
                {["20 series/playlists", "20 episodes per series", "20 custom links", "3 collab packages", "10 reviews", "Rate card access", "Default media kit", "Weekly social stats refresh"].map((item) => (
                  <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[#043084]" />{item}</li>
                ))}
              </ul>
              <button onClick={() => handleClaim(username)} className="mt-7 w-full rounded-[8px] bg-[#043084] px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-[0_14px_35px_rgba(21,25,51,0.20)] cursor-pointer">
                Get Started with Pro
              </button>
            </div>

            <div data-scroll-reveal style={{ "--reveal-delay": "200ms" } as CSSProperties} className="group relative overflow-hidden rounded-[14px] border-2 border-[#043084] bg-white p-7 text-left shadow-[0_16px_40px_rgba(15,23,42,0.10)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(21,25,51,0.16)]">
              <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-[#043084]/5 to-transparent opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" aria-hidden="true" />
              <span className="absolute top-5 right-5 rounded-full bg-[#043084] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">Recommended</span>
              <h3 className="font-display text-xl font-black text-[#043084]">VIP</h3>
              <p className="mt-1 text-sm font-medium text-[#64748b]">Unlimited series, custom media kit, and premium creator tools.</p>
              <p className="mt-7 font-display text-5xl font-black text-[#043084]">{formatPlanPrice("vip", "monthly", pricingCurrency)}</p>
              <p className="mt-1 text-xs font-semibold text-[#64748b]">/month or {formatPlanPrice("vip", "yearly", pricingCurrency)}/year</p>
              <ul className="mt-7 space-y-2 text-sm font-semibold text-[#334155]">
                {["Unlimited series and episodes", "Unlimited custom links", "Unlimited reviews", "10 collab packages", "Custom media kit", "Premium themes", "Daily stats refresh", "Priority support"].map((item) => (
                  <li key={item} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-[#043084]" />{item}</li>
                ))}
              </ul>
              <button onClick={() => handleClaim(username)} className="group mt-7 w-full rounded-[8px] bg-[#043084] px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-[0_14px_35px_rgba(21,25,51,0.20)] cursor-pointer">
                Go VIP
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#f8fafc] py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div data-scroll-reveal className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#94a3b8]">FAQ</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-[#043084] sm:text-5xl">Frequently Asked Questions</h2>
          </div>
          <div className="mt-9 space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={faq.q} data-scroll-reveal style={{ "--reveal-delay": `${index * 55}ms` } as CSSProperties} className="overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white text-left shadow-sm transition-all hover:border-[#043084]/20 hover:shadow-[0_14px_35px_rgba(21,25,51,0.07)]">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-sm font-black text-[#043084]">{faq.q}</span>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-lg font-black leading-none text-[#043084]">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-xs font-medium leading-relaxed text-[#64748b]">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#043084] py-16 text-center sm:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-25" aria-hidden="true">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] [animation:infixo-scan-x_6s_ease-in-out_infinite]" />
        </div>
        <div data-scroll-reveal className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="relative font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            Make it easy for fans to watch your videos.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-white/70">
            Create your custom link in 2 minutes. Organize your series, showcase your reach, and start your 7-day free trial.
          </p>
          <button onClick={() => handleClaim(username)} className="relative mt-8 inline-flex items-center gap-2 rounded-[10px] bg-white px-5 py-3 text-sm font-black text-[#043084] transition-transform hover:scale-[1.02] cursor-pointer">
            Create Your Inflixo
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-[#e2e8f0] bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs font-semibold text-[#64748b] sm:flex-row sm:px-6">
          <Logo size="sm" />
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => previewRef.current?.scrollIntoView({ behavior: "smooth" })} className="hover:text-brand-primary">Series Preview</button>
            <button onClick={() => scrollToSection("pillars")} className="hover:text-brand-primary">Creator Tools</button>
            <button onClick={() => scrollToSection("pricing")} className="hover:text-brand-primary">Pricing</button>
            <Link href="/login" className="hover:text-brand-primary">Get Started</Link>
            <Link href="/privacy" className="hover:text-brand-primary">Privacy</Link>
            <Link href="/terms" className="hover:text-brand-primary">Terms</Link>
            <button onClick={() => openCookiePreferences()} className="hover:text-brand-primary">Cookies</button>
          </div>
          <p>© 2026 Inflixo. The Complete Creator Profile.</p>
        </div>
      </footer>

      <div className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${showScrollTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-black text-[#043084] shadow-sm">
          <ArrowUp className="h-4 w-4" />
          <span className="hidden sm:inline">Top</span>
        </button>
      </div>
    </div>
  );
}
