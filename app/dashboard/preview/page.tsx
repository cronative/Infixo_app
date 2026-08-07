"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { ThemeCard } from "@/themes/registry";
import { THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";

export default function DashboardPreviewPage() {
  const { profile, socials, series, totalAudience, theme } = useCreator();
  const pageBgStyle = THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["modern-purple"];

  return (
    <div className="mx-auto max-w-2xl px-5 py-6 sm:px-8 sm:py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black text-slate-900">Live Profile Preview</h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500">
            This is exactly how your public Inflixo page looks to your fans &amp; subscribers.
          </p>
        </div>
        <Link
          href={`/${profile.username || "you"}`}
          target="_blank"
          className="tap-scale flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-black text-white shadow-md transition-all hover:opacity-95"
          style={{ backgroundImage: "var(--gradient-premium)" }}
        >
          <ExternalLink className="h-4 w-4" /> Open Public Page
        </Link>
      </div>

      {/* Theme Ambient Preview Wrapper */}
      <div className={`rounded-3xl p-6 sm:p-8 transition-colors duration-300 ${pageBgStyle}`}>
        {/* Main Theme Card */}
        <ThemeCard
          themeKey={theme}
          profile={profile}
          socials={socials}
          series={series}
          totalAudience={totalAudience}
          variant="full"
        />
      </div>
    </div>
  );
}
