"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Lock, Sparkles, Play, Check, ExternalLink, Film, Share2 } from "lucide-react";
import { InflixoLogoIcon } from "@/components/shared/Logo";
import { InstagramIcon, YoutubeIcon, XTwitterIcon } from "@/components/shared/BrandIcons";

interface UsernamePhonePreviewProps {
  username?: string;
  displayName?: string;
}

export function UsernamePhonePreview({
  username = "",
  displayName = "Creator",
}: UsernamePhonePreviewProps) {
  const handle = username.trim() || "yourname";

  return (
    <div className="w-full flex flex-col items-center py-2 animate-fade-in select-none">
      {/* Floating Badge Header */}
      <div className="mb-3 flex items-center gap-2 rounded-full border border-[#7A2253]/20 bg-white/95 px-3 py-1 shadow-xs backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A2253]">
          Live Inflixo Profile Preview
        </span>
      </div>

      {/* Modern Smartphone Mockup Frame */}
      <div className="relative w-full max-w-[340px] sm:max-w-[360px] rounded-[44px] bg-[#0f172a] p-2.5 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35)] ring-1 ring-slate-800">
        {/* Dynamic Island / Speaker Pill */}
        <div className="absolute left-1/2 top-4.5 z-30 -translate-x-1/2 flex items-center justify-center">
          <div className="h-4 w-24 rounded-full bg-black flex items-center justify-end pr-2">
            <span className="h-2 w-2 rounded-full bg-[#1e293b]" />
          </div>
        </div>

        {/* Screen Bezel Container */}
        <div className="relative overflow-hidden rounded-[36px] bg-[#FAFAF9] border border-slate-200/80 text-slate-900">
          {/* Top Browser / URL Bar inside phone */}
          <div className="pt-7 pb-2 px-3 bg-white border-b border-slate-100 flex items-center justify-between gap-1.5">
            {/* 3D Inflixo Logo pill */}
            <div className="flex items-center gap-1.5 shrink-0">
              <InflixoLogoIcon className="h-4 w-4" />
              <span className="text-[10px] font-black tracking-tight text-[#18181B]">Inflixo</span>
            </div>

            {/* Simulated Safe Browser Pill */}
            <div className="flex-1 max-w-[210px] mx-auto flex items-center justify-center gap-1 bg-slate-100/90 py-1 px-2.5 rounded-full border border-slate-200/70 text-[10.5px]">
              <Lock className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
              <span className="text-slate-500 font-medium truncate">inflixo.com/</span>
              <span className="text-[#7A2253] font-bold truncate max-w-[100px]">{handle}</span>
            </div>

            {/* Share action icon */}
            <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
              <Share2 className="h-3 w-3" />
            </div>
          </div>

          {/* Phone Scrollable Body (Simulated Profile View) */}
          <div className="p-3.5 space-y-3.5 max-h-[520px] overflow-hidden text-center">
            {/* Creator Identity */}
            <div className="flex flex-col items-center space-y-1.5 pt-1">
              {/* Avatar with Gradient Ring */}
              <div className="relative">
                <div className="h-16 w-16 rounded-full p-[2px] bg-gradient-to-tr from-[#7A2253] via-[#B0437A] to-amber-400 shadow-md">
                  <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[#7A2253] font-black text-xl overflow-hidden">
                    {displayName.charAt(0).toUpperCase() || "C"}
                  </div>
                </div>
                {/* Verification badge */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#7A2253] text-white ring-2 ring-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              </div>

              {/* Names */}
              <div>
                <h3 className="text-sm font-extrabold text-[#18181B] tracking-tight">
                  {displayName}
                </h3>
                <p className="text-[11.5px] font-bold text-[#7A2253] tracking-tight">
                  @{handle}
                </p>
              </div>

              <p className="text-[10px] text-slate-500 max-w-[240px] leading-relaxed line-clamp-2">
                Video series, podcast episodes, behind-the-scenes &amp; brand collabs in one place.
              </p>
            </div>

            {/* TOTAL FANBASE HERO STAT (Centerpiece with animated shimmer sweep) */}
            <div className="rounded-2xl bg-white border border-slate-200/90 p-2.5 shadow-xs flex flex-col items-center justify-center">
              <div className="text-2xl font-black tracking-tight leading-none fanbase-shimmer-light">
                1.2M
              </div>
              <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#7A2253] mt-1">
                Total Fanbase
              </span>

              {/* Social Channels Mini-Row */}
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-center gap-3 w-full">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                  <InstagramIcon className="h-3 w-3" />
                  <span>650K</span>
                </div>
                <div className="h-2.5 w-px bg-slate-200" />
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                  <YoutubeIcon className="h-3 w-3" />
                  <span>420K</span>
                </div>
                <div className="h-2.5 w-px bg-slate-200" />
                <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                  <XTwitterIcon className="h-2.5 w-2.5" />
                  <span>130K</span>
                </div>
              </div>
            </div>

            {/* VIDEO-FIRST SERIES TILES (The Inflixo Signature Difference) */}
            <div className="text-left space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Film className="h-3 w-3 text-[#7A2253]" />
                  Video Series (OTT)
                </span>
                <span className="text-[9px] font-bold text-[#7A2253]">2 Series</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Series Tile 1 */}
                <div className="rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-2xs group cursor-default">
                  <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-white/90 flex items-center justify-center shadow-xs">
                      <Play className="h-3 w-3 fill-[#7A2253] text-[#7A2253] ml-0.5" />
                    </div>
                    <span className="absolute bottom-1 right-1 rounded-sm bg-black/75 px-1 py-0.2 text-[8px] font-bold text-white">
                      12 Ep
                    </span>
                  </div>
                  <div className="p-1.5 text-left">
                    <p className="text-[10px] font-bold text-slate-800 truncate">Behind The Scenes</p>
                    <p className="text-[8.5px] font-medium text-slate-500">Season 1 · Official</p>
                  </div>
                </div>

                {/* Series Tile 2 */}
                <div className="rounded-xl overflow-hidden bg-white border border-slate-200/80 shadow-2xs group cursor-default">
                  <div className="relative aspect-video bg-gradient-to-br from-[#7A2253] to-[#45122F] flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-white/90 flex items-center justify-center shadow-xs">
                      <Play className="h-3 w-3 fill-[#7A2253] text-[#7A2253] ml-0.5" />
                    </div>
                    <span className="absolute bottom-1 right-1 rounded-sm bg-black/75 px-1 py-0.2 text-[8px] font-bold text-white">
                      8 Ep
                    </span>
                  </div>
                  <div className="p-1.5 text-left">
                    <p className="text-[10px] font-bold text-slate-800 truncate">Creator Masterclass</p>
                    <p className="text-[8.5px] font-medium text-slate-500">Weekly Series</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Links Box */}
            <div className="space-y-1.5 text-left">
              <div className="rounded-xl bg-white border border-slate-200/80 px-2.5 py-1.5 flex items-center justify-between text-[10.5px] font-semibold text-slate-800 shadow-2xs">
                <span>Exclusive Collab Inquiry 🤝</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </div>
              <div className="rounded-xl bg-white border border-slate-200/80 px-2.5 py-1.5 flex items-center justify-between text-[10.5px] font-semibold text-slate-800 shadow-2xs">
                <span>My Filmmaking Gear &amp; Presets 🛍️</span>
                <ExternalLink className="h-3 w-3 text-slate-400" />
              </div>
            </div>

            {/* Single Powered by Inflixo Footer */}
            <div className="pt-1 pb-1 flex items-center justify-center gap-1.5 text-[9.5px] font-medium text-slate-400">
              <InflixoLogoIcon className="h-3 w-3" />
              <span>Powered by <strong className="font-bold text-slate-700">Inflixo</strong></span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2.5 text-[11px] font-medium text-slate-500">
        Updates in real-time as you type your link ✨
      </p>
    </div>
  );
}
