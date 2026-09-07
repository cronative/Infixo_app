"use client";

import React, { forwardRef } from "react";
import { Sparkles, ShieldCheck, ArrowUpRight, Award, Zap } from "lucide-react";
import {
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  XTwitterIcon,
  LinkedinIcon,
  ThreadsIcon,
  SnapchatIcon,
} from "@/components/shared/BrandIcons";
import { PlatformStatItem } from "@/services/MilestoneService";
import { initials } from "@/utils/format";

export type StoryThemeKey = "midnight-gold" | "neon-cyber" | "sunset-velvet" | "minimal-luxe";

export interface MilestoneStoryCardProps {
  displayName: string;
  username: string;
  category?: string | null;
  photoUrl?: string | null;
  totalFanbaseFormatted: string;
  milestoneTitle?: string;
  customNote?: string;
  platforms: PlatformStatItem[];
  theme?: StoryThemeKey;
  showPlatforms?: boolean;
  showQr?: boolean;
  scale?: number;
}

const THEME_STYLES: Record<
  StoryThemeKey,
  {
    wrapperBg: string;
    glow1: string;
    glow2: string;
    accentColor: string;
    accentGradient: string;
    cardBg: string;
    cardBorder: string;
    badgeBg: string;
    badgeText: string;
    textColor: string;
    subtextColor: string;
    statGradient: string;
    platformPillBg: string;
  }
> = {
  "midnight-gold": {
    wrapperBg: "radial-gradient(135% 150% at 50% 0%, #201736 0%, #0c0915 50%, #05040a 100%)",
    glow1: "radial-gradient(circle, rgba(230, 197, 131, 0.25) 0%, transparent 70%)",
    glow2: "radial-gradient(circle, rgba(140, 63, 77, 0.35) 0%, transparent 70%)",
    accentColor: "#E6C583",
    accentGradient: "linear-gradient(135deg, #FFF0D0 0%, #E6C583 50%, #C99738 100%)",
    cardBg: "rgba(255, 255, 255, 0.04)",
    cardBorder: "rgba(230, 197, 131, 0.2)",
    badgeBg: "rgba(230, 197, 131, 0.12)",
    badgeText: "#F0D59E",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255, 255, 255, 0.65)",
    statGradient: "linear-gradient(180deg, #FFFFFF 20%, #E6C583 100%)",
    platformPillBg: "rgba(255, 255, 255, 0.05)",
  },
  "neon-cyber": {
    wrapperBg: "radial-gradient(135% 150% at 50% 0%, #150930 0%, #090918 55%, #03030a 100%)",
    glow1: "radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, transparent 70%)",
    glow2: "radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, transparent 70%)",
    accentColor: "#38BDF8",
    accentGradient: "linear-gradient(135deg, #C084FC 0%, #38BDF8 100%)",
    cardBg: "rgba(255, 255, 255, 0.04)",
    cardBorder: "rgba(168, 85, 247, 0.25)",
    badgeBg: "rgba(168, 85, 247, 0.15)",
    badgeText: "#C084FC",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255, 255, 255, 0.65)",
    statGradient: "linear-gradient(180deg, #FFFFFF 15%, #38BDF8 60%, #C084FC 100%)",
    platformPillBg: "rgba(255, 255, 255, 0.05)",
  },
  "sunset-velvet": {
    wrapperBg: "radial-gradient(135% 150% at 50% 0%, #2e0d19 0%, #170710 50%, #0a0307 100%)",
    glow1: "radial-gradient(circle, rgba(251, 113, 133, 0.3) 0%, transparent 70%)",
    glow2: "radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)",
    accentColor: "#FDA4AF",
    accentGradient: "linear-gradient(135deg, #FDA4AF 0%, #FB7185 50%, #F59E0B 100%)",
    cardBg: "rgba(255, 255, 255, 0.04)",
    cardBorder: "rgba(251, 113, 133, 0.25)",
    badgeBg: "rgba(251, 113, 133, 0.15)",
    badgeText: "#FDA4AF",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255, 255, 255, 0.65)",
    statGradient: "linear-gradient(180deg, #FFFFFF 20%, #FDA4AF 70%, #FB7185 100%)",
    platformPillBg: "rgba(255, 255, 255, 0.05)",
  },
  "minimal-luxe": {
    wrapperBg: "radial-gradient(135% 150% at 50% 0%, #1e2029 0%, #101115 50%, #08090b 100%)",
    glow1: "radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%)",
    glow2: "radial-gradient(circle, rgba(148, 163, 184, 0.15) 0%, transparent 70%)",
    accentColor: "#F8FAFC",
    accentGradient: "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)",
    cardBg: "rgba(255, 255, 255, 0.03)",
    cardBorder: "rgba(255, 255, 255, 0.12)",
    badgeBg: "rgba(255, 255, 255, 0.08)",
    badgeText: "#E2E8F0",
    textColor: "#FFFFFF",
    subtextColor: "rgba(255, 255, 255, 0.6)",
    statGradient: "linear-gradient(180deg, #FFFFFF 40%, #94A3B8 100%)",
    platformPillBg: "rgba(255, 255, 255, 0.04)",
  },
};

function renderPlatformIcon(icon: string) {
  const iconProps = { className: "w-4 h-4 shrink-0" };
  switch (icon) {
    case "instagram":
      return <InstagramIcon {...iconProps} />;
    case "youtube":
      return <YoutubeIcon {...iconProps} />;
    case "facebook":
      return <FacebookIcon {...iconProps} />;
    case "twitter":
      return <XTwitterIcon {...iconProps} />;
    case "linkedin":
      return <LinkedinIcon {...iconProps} />;
    case "threads":
      return <ThreadsIcon {...iconProps} />;
    case "snapchat":
      return <SnapchatIcon {...iconProps} />;
    default:
      return <Zap {...iconProps} />;
  }
}

export const MilestoneStoryCard = forwardRef<HTMLDivElement, MilestoneStoryCardProps>(
  (
    {
      displayName,
      username,
      category,
      photoUrl,
      totalFanbaseFormatted,
      milestoneTitle,
      customNote,
      platforms,
      theme = "midnight-gold",
      showPlatforms = true,
      showQr = true,
    },
    ref
  ) => {
    const s = THEME_STYLES[theme] || THEME_STYLES["midnight-gold"];
    const cleanUsername = (username || "creator").replace(/^@/, "");
    const profileUrl = `inflixo.com/${cleanUsername}`;

    return (
      <div
        ref={ref}
        data-milestone-story="true"
        className="relative overflow-hidden select-none flex flex-col justify-between"
        style={{
          width: "540px",
          height: "960px",
          background: s.wrapperBg,
          color: s.textColor,
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          boxSizing: "border-box",
          padding: "48px 40px 40px 40px",
        }}
      >
        {/* Ambient Glow Lights */}
        <div
          className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-80"
          style={{ background: s.glow1 }}
        />
        <div
          className="pointer-events-none absolute top-1/3 -right-20 w-96 h-96 rounded-full blur-3xl opacity-70"
          style={{ background: s.glow2 }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-50"
          style={{ background: s.glow1 }}
        />

        {/* Top Header Section */}
        <div className="relative z-10">
          {/* Top Inflixo Brand Bar */}
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-black"
                style={{ background: s.accentGradient }}
              >
                IX
              </div>
              <span className="font-bold text-sm tracking-widest text-white/80 uppercase">
                Inflixo
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase"
              style={{ background: s.badgeBg, color: s.badgeText }}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Verified Creator Milestone</span>
            </div>
          </div>

          {/* Creator Profile Spotlight */}
          <div className="flex items-center gap-4 mt-8">
            <div className="relative shrink-0">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={displayName}
                  crossOrigin="anonymous"
                  className="w-18 h-18 rounded-full object-cover shadow-2xl"
                  style={{ boxShadow: `0 0 0 3px ${s.accentColor}` }}
                />
              ) : (
                <div
                  className="w-18 h-18 rounded-full flex items-center justify-center font-bold text-xl shadow-2xl text-white bg-white/10"
                  style={{ boxShadow: `0 0 0 3px ${s.accentColor}` }}
                >
                  {initials(displayName) || "CR"}
                </div>
              )}
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-black"
                style={{ background: s.accentGradient }}
              >
                <ShieldCheck className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-white truncate max-w-xs">
                  {displayName || "Creator Name"}
                </h1>
              </div>
              <p className="text-sm font-medium mt-0.5" style={{ color: s.subtextColor }}>
                @{cleanUsername} {category ? `· ${category}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Hero Milestone Centerpiece */}
        <div className="relative z-10 my-auto py-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-md mb-4 bg-white/5">
            <Sparkles className="w-3.5 h-3.5" style={{ color: s.accentColor }} />
            <span className="text-xs font-bold tracking-wider uppercase text-white/90">
              Official Fanbase Milestone
            </span>
          </div>

          {/* Big Hero Number */}
          <div className="my-1">
            <span
              className="text-7xl font-black tracking-tight leading-none block drop-shadow-2xl"
              style={{
                background: s.statGradient,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {totalFanbaseFormatted}+
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white mt-2">
            {milestoneTitle || "Community & Growing"}
          </h2>

          <p className="text-sm max-w-xs mx-auto mt-2 leading-relaxed" style={{ color: s.subtextColor }}>
            {customNote || "Across connected creator channels & official series."}
          </p>

          {/* Social Breakdown Pills */}
          {showPlatforms && platforms.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 max-w-md mx-auto">
              {platforms.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border backdrop-blur-md transition-all shadow-sm"
                  style={{
                    background: s.platformPillBg,
                    borderColor: s.cardBorder,
                  }}
                >
                  <span style={{ color: p.color }}>{renderPlatformIcon(p.icon)}</span>
                  <span className="text-xs font-medium text-white/70">{p.name}</span>
                  <span className="text-xs font-black text-white ml-0.5">
                    {p.count > 0 ? `${(p.count / 1000).toFixed(p.count >= 10000 ? 0 : 1)}K` : "Active"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Call to Action & Inflixo Virality Footer */}
        <div className="relative z-10 space-y-4">
          {/* Creator Hub Callout Card */}
          <div
            className="rounded-2xl p-4 flex items-center justify-between border backdrop-blur-xl"
            style={{
              background: s.cardBg,
              borderColor: s.cardBorder,
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold shrink-0"
                style={{ background: s.accentGradient }}
              >
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  Official Creator Link
                </p>
                <p className="text-sm font-black text-white truncate tracking-tight">
                  {profileUrl}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full text-black"
                style={{ background: s.accentGradient }}
              >
                Watch Series & Collab
              </span>
            </div>
          </div>

          {/* Subtle Virality Watermark (THE VIRAL ENGINE) */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-white/60">
            <div className="flex items-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 fill-current text-white/80" />
              <span className="font-semibold text-white/80">Made with Inflixo</span>
            </div>
            <span className="text-[11px] text-white/50">
              Claim your link at <strong className="text-white/80">inflixo.com</strong>
            </span>
          </div>
        </div>
      </div>
    );
  }
);

MilestoneStoryCard.displayName = "MilestoneStoryCard";
