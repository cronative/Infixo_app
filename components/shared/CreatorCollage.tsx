import { Play, Users } from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

export function CreatorCollage() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden p-8 sm:p-12">
      {/* Ambient soft background orbs */}
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />

      {/* Softened Mesh Grid Lines (10% Opacity) */}
      <div
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative w-full max-w-md space-y-6">
        {/* Balanced Headline Sizing */}
        <div className="max-w-sm space-y-1.5 text-left">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            More than a link. <br />
            <span className="italic font-normal text-indigo-200">Your creator world.</span>
          </h2>
          <p className="text-xs sm:text-sm font-medium text-indigo-100/90 leading-relaxed">
            Your socials, total fanbase and content series together in one beautiful profile.
          </p>
        </div>

        {/* Unified Vertical Mobile Mockup Frame */}
        <div className="w-full max-w-[340px] mx-auto rounded-[32px] bg-white p-5 border-4 border-white/20 shadow-2xl text-left space-y-4">
          {/* Profile Header */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt="Maya"
              className="h-11 w-11 rounded-full object-cover border-2 border-slate-100 shadow-xs"
            />
            <div>
              <p className="text-sm font-extrabold text-[#0F172A]">Maya</p>
              <p className="text-xs font-semibold text-slate-500">@maya · Travel Creator</p>
            </div>
          </div>

          {/* Total Fanbase Badge Pill */}
          <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-3.5 py-2 border border-indigo-200">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#6366F1]" />
              <span className="text-xs font-extrabold text-[#6366F1]">126K total fanbase</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Crisp 1px Border Platform Follower Pills */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200 p-2 text-center">
              <InstagramIcon className="h-4 w-4 text-pink-500 mb-0.5" />
              <span className="text-xs font-black text-[#0F172A]">48.7K</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200 p-2 text-center">
              <YoutubeIcon className="h-4 w-4 text-red-500 mb-0.5" />
              <span className="text-xs font-black text-[#0F172A]">62.3K</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-200 p-2 text-center">
              <FacebookIcon className="h-4 w-4 text-blue-600 mb-0.5" />
              <span className="text-xs font-black text-[#0F172A]">15K</span>
            </div>
          </div>

          {/* Creator Series Preview Card (Solid Dark Surface #0F172A) */}
          <div className="flex items-center gap-3 rounded-2xl bg-[#0F172A] text-white p-3 border border-slate-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6366F1]">
              <Play className="h-4 w-4 fill-white text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-white">Kashmir Diaries</p>
              <p className="text-[11px] font-semibold text-indigo-300">Season 1 · 5 Episodes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
