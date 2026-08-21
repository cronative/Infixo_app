"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Zap, Palette, RefreshCw } from "lucide-react";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import {
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_GIGS,
  EXPERT_DEMO_CUSTOM_LINKS,
} from "@/data/expertDemoCreator";
import { Logo } from "@/components/shared/Logo";
import { ThemeKey } from "@/types";

// 5 Curated Light Themes that Auto-Rotate Every 10 Seconds
const LIGHT_THEMES: { key: ThemeKey; name: string; badgeColor: string }[] = [
  { key: "minimal-white", name: "Minimal White", badgeColor: "bg-slate-100 text-slate-800 border-slate-300" },
  { key: "signature-purple", name: "Signature Purple", badgeColor: "bg-purple-100 text-purple-800 border-purple-300" },
  { key: "pastel-dream", name: "Pastel Dream", badgeColor: "bg-pink-100 text-pink-800 border-pink-300" },
  { key: "matcha-cream", name: "Matcha Cream", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { key: "cloud-fluff", name: "Cloud Fluff", badgeColor: "bg-sky-100 text-sky-800 border-sky-300" },
];

export default function DemoCreatorPage() {
  const [themeIndex, setThemeIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(10);

  // Auto-Rotate through 5 Light Themes Every 10 Seconds
  useEffect(() => {
    const themeTimer = setInterval(() => {
      setThemeIndex((prev) => (prev + 1) % LIGHT_THEMES.length);
      setSecondsRemaining(10);
    }, 10000);

    const countdownTimer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 10 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(themeTimer);
      clearInterval(countdownTimer);
    };
  }, []);

  const currentTheme = LIGHT_THEMES[themeIndex] || LIGHT_THEMES[0];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-indigo-50/70 via-slate-50 to-purple-50/60 text-slate-900 selection:bg-[#803D63]/20">
      {/* Top Light Header Bar */}
      <header className="sticky top-0 z-50 border-b border-purple-100 bg-white/90 backdrop-blur-md px-4 py-2.5 shadow-2xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-[11px] font-bold text-[#803D63]">
              <Sparkles className="h-3 w-3 text-[#803D63]" />
              <span>Live Expert Creator Profile</span>
            </div>
          </div>

          {/* 10-Second Light Theme Rotation Indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold shadow-2xs">
              <Palette className="h-3.5 w-3.5 text-[#803D63] animate-spin" />
              <span className="hidden xs:inline text-slate-700">Theme:</span>
              <span className={`px-2 py-0.5 rounded-md border text-[11px] font-extrabold ${currentTheme.badgeColor}`}>
                {currentTheme.name}
              </span>
              <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
                ({secondsRemaining}s)
              </span>
            </div>

            <Link
              href="/#hero-input"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#803D63] hover:bg-[#6d3354] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
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
        <div className="mb-8 text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100/80 border border-purple-200 px-3.5 py-1 text-xs font-bold text-[#803D63]">
            <Zap className="h-3.5 w-3.5 text-[#803D63]" />
            <span>AI-Synced Media Kit & OTT Series</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            See How Top Creators Showcase Their Work
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium leading-relaxed">
            Explore Aarav Sharma&apos;s live creator profile — featuring 5 OTT Web Series playlists, 1.3M+ AI-synced reach, and 5 direct rate cards.
          </p>

          {/* Light Theme Manual Switcher Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
            {LIGHT_THEMES.map((th, idx) => (
              <button
                key={th.key}
                type="button"
                onClick={() => {
                  setThemeIndex(idx);
                  setSecondsRemaining(10);
                }}
                className={`text-[11px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  themeIndex === idx
                    ? "bg-[#803D63] text-white border-[#803D63] shadow-xs scale-105"
                    : "bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:text-[#803D63]"
                }`}
              >
                {th.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live Profile Card rendered in Active Light Theme */}
        <LivePreviewCard
          profile={EXPERT_DEMO_PROFILE}
          socials={EXPERT_DEMO_SOCIALS}
          series={EXPERT_DEMO_SERIES}
          customLinks={EXPERT_DEMO_CUSTOM_LINKS}
          mediaKitPackages={EXPERT_DEMO_GIGS}
          totalAudience={1345000}
          themeKey={currentTheme.key}
          variant="full"
        />

        {/* Bottom CTA Card */}
        <div className="mt-12 rounded-3xl border border-purple-200 bg-white p-6 sm:p-10 text-center space-y-4 shadow-xl shadow-purple-500/5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>100% Free Setup • Live in 60 seconds</span>
          </div>
          <h2 className="font-display text-xl sm:text-3xl font-extrabold text-slate-900">
            Build Your Own Inflixo Creator Profile Today
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto font-medium">
            Turn your YouTube uploads and Instagram Reels into ordered playlists, showcase your fanbase, and get 0% commission brand leads.
          </p>

          <div className="pt-2">
            <Link
              href="/#hero-input"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#803D63] hover:bg-[#6d3354] px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-lg transition-all cursor-pointer"
            >
              <span>Create Your Free Creator Page Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
