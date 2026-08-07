"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Play,
  Tv,
  Share2,
  Palette,
  CheckCircle2,
  Zap,
  Heart,
  UserCheck,
  Clapperboard,
  Flame,
  Layers,
  ChevronDown,
  HelpCircle,
  TrendingUp,
  Eye,
  Star,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { CreatorCollage } from "@/components/shared/CreatorCollage";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import { Button } from "@/components/ui/Button";
import { AuthService } from "@/services/AuthService";
import { DEMO_PROFILE, DEMO_SOCIALS } from "@/data/demoCreator";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

const HERO_TAGLINES = [
  "✨ Give your videos a home your fans will actually love",
  "🎬 Turn your multi-part reels into clean OTT show series",
  "📈 Show your total combined reach across Instagram, YouTube & FB",
  "👑 Match your creator brand with 20+ aesthetic light & dark themes",
  "🚀 One simple bio link for all your videos, socials, and content",
  "📊 Keep track of your growing audience in real time",
  "🎥 Turn casual video viewers into loyal show subscribers",
  "⚡ Instant cloud sync • fast, reliable & simple to manage",
  "🌐 Set up your complete creator page in under 2 minutes",
  "📺 A TV-style watching experience for your YouTube & Instagram content",
  "💬 Share your bio, city location, socials, and series in one link",
  "🎯 Built specifically for vloggers, sketch creators & video makers",
];

const DEMO_THEMES = [
  { key: "navy", label: "🌌 Midnight Navy", bg: "bg-gradient-to-r from-slate-900 via-[#081028] to-blue-950 text-white" },
  { key: "purple", label: "💜 Glass Violet", bg: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" },
  { key: "dark", label: "🌙 Dark Velvet", bg: "bg-slate-900 text-white" },
  { key: "magenta", label: "💖 Hot Pink", bg: "bg-gradient-to-r from-rose-500 to-pink-600 text-white" },
];

function HeroTaglineRotator() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % HERO_TAGLINES.length);
        setVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white/95 px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 shadow-md shadow-slate-900/10 backdrop-blur-md min-h-[38px] transition-all hover:scale-105">
      <Sparkles className="h-4 w-4 text-blue-600 animate-pulse shrink-0" />
      <span
        className={`transition-all duration-300 transform ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
      >
        {HERO_TAGLINES[index]}
      </span>
    </div>
  );
}

const FAQS = [
  {
    q: "Is Inflixo free to use for creators?",
    a: "Yes! Creating your Inflixo page is 100% free. You can add your profile, connect your Instagram, YouTube & Facebook handles, organize video series into seasons & episodes, and share your link without any credit card.",
  },
  {
    q: "How does Inflixo help me organize multi-part video series?",
    a: "On social media feeds, Part 1, Part 2, & Part 3 of your comedy sketch or travel vlog get separated by algorithm recommendations. Inflixo lets you group those videos into clean Season & Episode cards so your fans can binge your full series in exact order.",
  },
  {
    q: "Can I connect Instagram, YouTube, and Facebook to show my total reach?",
    a: "Yes! Inflixo automatically fetches your follower counts and video view metrics across Instagram, YouTube, and Facebook to calculate your total combined creator audience.",
  },
  {
    q: "Where do I share my Inflixo link?",
    a: "Once you set up your page, you get a custom link like inflixo.com/yourname. Place this single link in your Instagram bio, YouTube video descriptions, TikTok bio, or Twitter profile!",
  },
  {
    q: "Can I customize the design and theme of my page?",
    a: "Absolutely! You can choose from over 20+ aesthetic designs—including Midnight Navy, Glassmorphism, Soft Violet, Cyberpunk, and Dark Mode themes—and switch between them anytime in a single tap.",
  },
  {
    q: "How long does it take to set up my page?",
    a: "It takes less than 2 minutes! Just log in with your email OTP, enter your name and category, link your social accounts, and your public creator page is live instantly.",
  },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all duration-300 hover:border-slate-400 hover:shadow-md"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between p-6 text-left font-extrabold text-slate-900 text-base sm:text-lg gap-4"
            >
              <span>{faq.q}</span>
              <ChevronDown
                className={`h-5 w-5 text-blue-600 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                  }`}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-6 pt-0 text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-1 animate-fade-in">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function LandingHomePage() {
  const router = useRouter();
  const isLoggedIn = AuthService.isLoggedIn();
  const [activeTab, setActiveTab] = useState<"card" | "series">("card");
  const [activeTheme, setActiveTheme] = useState("navy");

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-200 selection:text-slate-900 overflow-x-hidden">
      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl safe-top">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Logo size="md" />

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button
                onClick={() => router.push("/dashboard")}
                icon={<ArrowRight className="h-4 w-4" />}
                className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:scale-105 transition-all"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="tap-scale px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-purple-600 transition-colors"
                >
                  Log In
                </Link>
                <Button
                  onClick={() => router.push("/login")}
                  icon={<Sparkles className="h-4 w-4" />}
                  className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:scale-105 transition-all"
                >
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* High Energy Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 sm:pt-20 sm:pb-32 bg-gradient-to-b from-slate-100/80 via-white to-slate-50">
        {/* Animated Background Blobs & Glowing Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 h-[550px] w-[550px] rounded-full bg-gradient-to-tr from-blue-300/30 via-slate-200/50 to-indigo-200/30 blur-3xl pointer-events-none animate-blob" />
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none animate-blob" />

        {/* Floating GenZ Emoji Particles */}
        <div className="hidden sm:block absolute top-16 left-12 animate-float text-2xl pointer-events-none">🎬</div>
        <div className="hidden sm:block absolute top-28 right-16 animate-float-reverse text-2xl pointer-events-none">🔥</div>
        <div className="hidden sm:block absolute bottom-20 left-20 animate-float text-2xl pointer-events-none">🚀</div>
        <div className="hidden sm:block absolute bottom-32 right-12 animate-float-reverse text-2xl pointer-events-none">🍿</div>

        <div className="mx-auto max-w-6xl px-5 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left animate-slide-up">
              {/* Tagline Rotator Badge */}
              <HeroTaglineRotator />

              {/* Shimmer Headline */}
              <h1 className="font-display text-4xl sm:text-6xl font-extrabold leading-[1.12] tracking-tight text-slate-900">
                Give your videos a home <br />
                <span className="bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-purple-800 bg-clip-text text-transparent">
                  your fans will actually love
                </span>
              </h1>

              {/* Conversational Subheading */}
              <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                Stop letting feed algorithms scatter your hard work. Put your YouTube videos, Instagram Reels, and social links into one clean, TV-style creator page.
              </p>

              {/* High-Energy Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
                <Button
                  size="lg"
                  onClick={() => router.push("/login")}
                  icon={<Sparkles className="h-5 w-5 animate-spin-slow" />}
                  className="w-full sm:w-auto px-9 py-4 text-base bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] text-white shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:scale-105 transition-all"
                >
                  Create Your Free Page
                </Button>
                <Link
                  href="/tonystark"
                  className="w-full sm:w-auto tap-scale inline-flex items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-8 py-3.5 text-sm font-bold text-slate-800 shadow-md transition-all hover:border-purple-300 hover:bg-purple-50/70 hover:text-purple-600 hover:scale-105"
                >
                  <Play className="h-4 w-4 text-purple-600 fill-purple-600" />
                  <span>See Live Demo Page</span>
                </Link>
              </div>

              {/* Trust Points Badges */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm font-semibold text-slate-600">
                <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border border-slate-200 shadow-sm backdrop-blur-md hover:scale-105 transition-transform">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>100% Free to start</span>
                </div>
                <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border border-slate-200 shadow-sm backdrop-blur-md hover:scale-105 transition-transform">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Automatic Cloud Sync</span>
                </div>
                <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border border-slate-200 shadow-sm backdrop-blur-md hover:scale-105 transition-transform">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>20+ Aesthetic Themes</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Live Preview Card Column */}
            <div className="lg:col-span-5 flex flex-col items-center relative">
              {/* Floating Instagram Badge */}
              <div className="hidden sm:flex animate-float absolute -top-8 -left-8 z-30 items-center gap-2.5 rounded-2xl border border-pink-200 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur-md hover:scale-105 transition-transform">
                <InstagramIcon className="h-5 w-5 text-pink-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Instagram</span>
                  <span className="text-xs font-black text-slate-900">48.7K Followers</span>
                </div>
              </div>

              {/* Floating YouTube Badge */}
              <div className="hidden sm:flex animate-float-reverse absolute -bottom-8 -right-8 z-30 items-center gap-2.5 rounded-2xl border border-red-200 bg-white/95 px-4 py-2.5 shadow-xl backdrop-blur-md hover:scale-105 transition-transform">
                <YoutubeIcon className="h-5 w-5 text-red-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">YouTube</span>
                  <span className="text-xs font-black text-slate-900">62.3K Subs</span>
                </div>
              </div>

              {/* Tab Switcher Pills */}
              <div className="mb-4 inline-flex items-center rounded-full bg-white p-1.5 border border-slate-200 shadow-md relative z-10">
                <button
                  onClick={() => setActiveTab("card")}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${activeTab === "card"
                      ? "bg-gradient-to-r from-[#0B1536] to-[#081028] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Creator Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab("series")}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${activeTab === "series"
                      ? "bg-gradient-to-r from-[#0B1536] to-[#081028] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  <Tv className="h-3.5 w-3.5" />
                  <span>OTT Video Series</span>
                </button>
              </div>

              {/* Live Theme Switcher Pills Bar */}
              <div className="mb-3 flex items-center justify-center gap-1.5 relative z-10">
                {DEMO_THEMES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveTheme(t.key)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${t.bg} ${activeTheme === t.key ? "ring-2 ring-slate-900 scale-105 shadow-xs" : "opacity-75 hover:opacity-100"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Glowing Card Glass Container */}
              <div className="w-full max-w-md rounded-3xl border border-slate-300/80 bg-white p-4 shadow-[0_25px_60px_-15px_rgba(8,16,40,0.18)] relative transform transition-all duration-500 hover:shadow-slate-900/30 hover:-translate-y-1.5">
                {activeTab === "card" ? (
                  <div className="animate-fade-in py-2">
                    <LivePreviewCard
                      profile={{
                        ...DEMO_PROFILE,
                        displayName: "Tony Stark",
                        username: "tonystark",
                        category: "Technology",
                        bio: "Tech innovator creating video reviews, gadget teardowns, and series.",
                      }}
                      socials={DEMO_SOCIALS}
                      totalAudience={126000}
                    />
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <CreatorCollage />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Animated Stats Bar */}
      <section className="py-12 bg-white border-y border-slate-200/80 shadow-xs">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1 transform hover:scale-105 transition-transform p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-3xl sm:text-4xl font-black text-[#081028] font-display">1 Link</p>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">For All Your Content</p>
            </div>
            <div className="space-y-1 transform hover:scale-105 transition-transform p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-3xl sm:text-4xl font-black text-blue-600 font-display">20+</p>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Aesthetic Themes</p>
            </div>
            <div className="space-y-1 transform hover:scale-105 transition-transform p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-3xl sm:text-4xl font-black text-[#081028] font-display">3 Platforms</p>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">IG, YT &amp; FB Analytics</p>
            </div>
            <div className="space-y-1 transform hover:scale-105 transition-transform p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <p className="text-3xl sm:text-4xl font-black text-emerald-600 font-display">2 Mins</p>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Simple Setup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Creator Story Section */}
      <section className="py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-800 shadow-2xs">
              <Clapperboard className="h-3.5 w-3.5" />
              <span>Real Creator Problem Solved</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900">
              Ever noticed how fans miss Part 2 of your series?
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Social algorithms push multi-part reels out of order. Here is how Inflixo fixes it for your viewers.
            </p>
          </div>

          {/* Side-by-Side GenZ Bento Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* The Problem Card */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-8 space-y-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-200/80 px-3.5 py-1 text-xs font-black text-slate-800">
                  <span>❌ Social Media Algorithm Feeds</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  You edit a 3-part series, but your feed scatters it
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  You upload Part 1, Part 2, and Part 3 of a comedy series or travel vlog. Your audience sees Part 1 today, but tomorrow the algorithm recommends random videos instead of Part 2.
                </p>
                <div className="rounded-2xl bg-white p-4 border border-slate-200 space-y-2 text-xs text-slate-700 shadow-xs">
                  <div className="flex items-center justify-between font-extrabold text-slate-900">
                    <span>Part 1: Uploaded</span>
                    <span className="text-slate-500 font-normal">Watched by fans</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 line-through pt-1">
                    <span>Part 2 &amp; Part 3</span>
                    <span>Buried under algorithm recommendations</span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-extrabold text-slate-700">
                Your fans comment: &quot;Where is Part 2?&quot; because feeds don&apos;t keep episodes together.
              </p>
            </div>

            {/* The Inflixo Solution Card */}
            <div className="rounded-3xl border border-emerald-300 bg-emerald-50/50 p-8 space-y-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-200/80 px-3.5 py-1 text-xs font-black text-emerald-800">
                  <span>✨ The Inflixo OTT Solution</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  1 bio link lets fans binge your whole series in order
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Group Part 1, Part 2, &amp; Part 3 into clean Season &amp; Episode cards. When followers open your link, they watch your entire series seamlessly from start to finish.
                </p>
                <div className="rounded-2xl bg-white p-4 border border-emerald-200 space-y-2 text-xs text-slate-700 shadow-xs">
                  <div className="flex items-center justify-between font-extrabold text-emerald-600">
                    <span>🎬 Season 1: Comedy Web Series</span>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md font-bold">3 Episodes</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 pt-1 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Episode 1 • Episode 2 • Episode 3 presented together</span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-extrabold text-emerald-600">
                Result: 100% video completion, higher fan engagement, and zero lost episodes!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid Section */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-800 shadow-2xs">
              <Zap className="h-3.5 w-3.5 fill-slate-800" />
              <span>Features Creators Care About</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900">
              Everything built for how you create content
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Simple tools that make your link in bio look like a high-end creator portfolio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl hover:border-slate-400 transition-all duration-300 hover:-translate-y-2 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-[#081028] font-bold group-hover:scale-110 transition-transform">
                <Tv className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Organized OTT Series</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Group your reels, shorts, and full videos into seasons and episodes. Just like Netflix, but custom for your channel.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl hover:border-slate-400 transition-all duration-300 hover:-translate-y-2 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 font-bold group-hover:scale-110 transition-transform">
                <Share2 className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Combined Reach Counter</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Stop counting followers separately. See your total combined audience across Instagram, YouTube, and Facebook in one place.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-xl hover:border-slate-400 transition-all duration-300 hover:-translate-y-2 space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-[#081028] font-bold group-hover:scale-110 transition-transform">
                <Palette className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Themes That Fit Your Vibe</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Choose from 20+ aesthetic designs — whether you prefer Midnight Navy, clean light tones, or dark cyber looks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Accordion FAQs Section */}
      <section className="py-24 bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-slate-800 shadow-2xs">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Everything you need to know about Inflixo and setting up your creator page.
            </p>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* Deep Midnight Navy Call to Action Banner */}
      <section className="py-24 bg-gradient-to-br from-[#0B1536] via-[#081028] to-[#040817] text-white relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-5 sm:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold text-blue-300 backdrop-blur-md border border-white/10">
            <Heart className="h-4 w-4 text-blue-400 fill-blue-400 animate-pulse" />
            <span>Built For Video Creators</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Ready to give your audience <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
              a better watching experience?
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-medium">
            Set up your custom link page in under 2 minutes. Free forever to get started.
          </p>

          <div className="pt-4 flex justify-center">
            <Button
              size="lg"
              onClick={() => router.push("/login")}
              icon={<Sparkles className="h-5 w-5" />}
              className="px-10 py-4 text-base bg-white text-[#081028] font-black shadow-xl hover:bg-slate-100 hover:scale-105 transition-all"
            >
              Build Your Page Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs font-medium text-slate-500">
            &copy; {new Date().getFullYear()} Inflixo. All rights reserved. Built for video creators &amp; show builders.
          </p>
        </div>
      </footer>
    </div>
  );
}
