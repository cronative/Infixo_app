"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { LivePreviewCard } from "@/components/onboarding/LivePreviewCard";
import {
  EXPERT_DEMO_PROFILE,
  EXPERT_DEMO_SOCIALS,
  EXPERT_DEMO_SERIES,
  EXPERT_DEMO_GIGS,
  EXPERT_DEMO_CUSTOM_LINKS,
} from "@/data/expertDemoCreator";
import { ThemeKey } from "@/types";

// 5 Curated Light Themes that Auto-Rotate Every 10 Seconds
const LIGHT_THEMES: { key: ThemeKey; name: string }[] = [
  { key: "minimal-white", name: "Minimal White" },
  { key: "modern-purple", name: "Modern Purple" },
  { key: "pastel-dream", name: "Pastel Dream" },
  { key: "ocean-blue", name: "Ocean Blue" },
  { key: "sunset", name: "Sunset" },
];

export default function DemoCreatorPage() {
  const [themeIndex, setThemeIndex] = useState(0);

  // Auto-Rotate through Light Themes Every 10 Seconds
  useEffect(() => {
    const themeTimer = setInterval(() => {
      setThemeIndex((prev) => (prev + 1) % LIGHT_THEMES.length);
    }, 10000);

    return () => clearInterval(themeTimer);
  }, []);

  const currentTheme = LIGHT_THEMES[themeIndex] || LIGHT_THEMES[0];

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 py-6 sm:py-10 px-4">
      <main className="mx-auto max-w-xl">
        {/* Live Profile Card */}
        <div className="w-full">
          <LivePreviewCard
            profile={EXPERT_DEMO_PROFILE}
            socials={EXPERT_DEMO_SOCIALS}
            series={EXPERT_DEMO_SERIES}
            customLinks={EXPERT_DEMO_CUSTOM_LINKS}
            mediaKitPackages={EXPERT_DEMO_GIGS}
            totalAudience={480000}
            themeKey={currentTheme.key}
            variant="full"
          />
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 text-center space-y-3.5 shadow-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>100% Free Setup • Live in 60 seconds</span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900">
            Build Your Own Inflixo Creator Profile Today
          </h2>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#803D63] hover:bg-[#6D3254] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all cursor-pointer w-full sm:w-auto"
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
