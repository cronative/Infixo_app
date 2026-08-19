import { Play, Users } from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

export function CreatorCollage() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden p-10">
      {/* Ambient gradient blobs */}
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl" />

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md space-y-6">
        {/* Headline card */}
        <div className="max-w-sm space-y-2">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            More than a link. <br />
            <span className="italic font-normal text-purple-200">Your creator world.</span>
          </h2>
          <p className="text-sm font-medium text-purple-100/80 leading-relaxed pt-1">
            Your socials, total fanbase and content series together in one beautiful profile.
          </p>
        </div>

        {/* Profile card — Maya */}
        <div className="animate-slide-up w-72 rounded-3xl bg-white p-4 shadow-2xl text-left space-y-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt="Maya"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-purple-100 shadow-sm"
            />
            <div>
              <p className="text-sm font-black text-[#0F172A]">Maya</p>
              <p className="text-xs font-semibold text-slate-400">@maya · Travel Creator</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-purple-50 px-3.5 py-2 border border-purple-100/80">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#651FFF]" />
              <span className="text-xs font-extrabold text-[#651FFF]">126K total fanbase</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Stat pills row */}
        <div className="flex gap-2.5">
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
            <InstagramIcon className="h-4 w-4 text-pink-500" />
            <span className="text-xs font-black text-[#0F172A]">48.7K</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
            <YoutubeIcon className="h-4 w-4 text-red-500" />
            <span className="text-xs font-black text-[#0F172A]">62.3K</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
            <FacebookIcon className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-black text-[#0F172A]">15K</span>
          </div>
        </div>

        {/* Creator Series row card */}
        <div className="animate-slide-up flex w-72 items-center gap-3.5 rounded-3xl bg-slate-900 text-white p-3.5 shadow-2xl border border-slate-800">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#651FFF]">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">Kashmir Diaries</p>
            <p className="text-xs font-semibold text-purple-300">Season 1 · 5 Episodes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
