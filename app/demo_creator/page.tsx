import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import {
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_GIGS,
  EXPERT_DEMO_CUSTOM_LINKS,
  EXPERT_DEMO_THEME,
} from "@/data/expertDemoCreator";
import { Logo } from "@/components/shared/Logo";

export const metadata: Metadata = {
  title: "Aarav Sharma (@demo_creator) — Expert Creator Profile & Media Kit | Inflixo",
  description:
    "Explore Aarav Sharma's expert creator media kit, 5 OTT Web Series, 1.3M+ AI-synced reach, and 5 verified rate card collab gigs on Inflixo.",
  openGraph: {
    title: "Aarav Sharma (@demo_creator) — Creator Media Kit & Web Series",
    description: "5 Web Series • 1.3M+ Live Reach • 5 Verified Rate Cards",
  },
};

export default function DemoCreatorPage() {
  return (
    <div className="min-h-dvh bg-slate-950 text-white selection:bg-purple-900 selection:text-white">
      {/* Top Demo Banner */}
      <header className="sticky top-0 z-50 border-b border-purple-900/40 bg-slate-950/90 backdrop-blur-md px-4 py-2.5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo light size="sm" />
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-purple-950/80 border border-purple-500/30 px-3 py-1 text-[11px] font-bold text-purple-200">
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>Live Expert Creator Profile Demo</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>1.3M+ AI-Synced Reach</span>
              <span className="text-slate-600">•</span>
              <span>5 OTT Web Series</span>
              <span className="text-slate-600">•</span>
              <span>5 Rate Cards</span>
            </div>

            <Link
              href="/#hero-input"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:from-purple-500 hover:to-rose-500 transition-all cursor-pointer"
            >
              <span>Create My Page</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Intro Explainer Header */}
        <div className="mb-8 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 px-3 py-1 text-xs font-bold text-purple-300">
            <Zap className="h-3.5 w-3.5 text-rose-400" />
            <span>Expert Creator Showcase</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            See How India&apos;s Top Creators Use Inflixo
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-medium">
            This is a live demo of @demo_creator featuring 5 multi-platform Web Series, 1.3M+ live reach, and 5 direct rate cards with zero commission.
          </p>
        </div>

        {/* Live Profile Card */}
        <LivePreviewCard
          profile={EXPERT_DEMO_PROFILE}
          socials={EXPERT_DEMO_SOCIALS}
          series={EXPERT_DEMO_SERIES}
          customLinks={EXPERT_DEMO_CUSTOM_LINKS}
          mediaKitPackages={EXPERT_DEMO_GIGS}
          totalAudience={1345000}
          themeKey={EXPERT_DEMO_THEME}
          variant="full"
        />

        {/* Bottom CTA Banner */}
        <div className="mt-12 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 p-6 sm:p-10 text-center space-y-4 shadow-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>100% Free Setup • Ready in 60s</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white">
            Ready to Build Your Own Cinema-Style Creator Page?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            Organize your Reels and YouTube uploads into playlists, display your live fanbase, and receive direct brand deals on WhatsApp.
          </p>

          <div className="pt-2">
            <Link
              href="/#hero-input"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-rose-600 px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg hover:from-purple-500 hover:to-rose-500 transition-all cursor-pointer"
            >
              <span>Create Your Free Inflixo Page Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
