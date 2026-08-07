import { Play, TrendingUp, Users } from "lucide-react";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

export function CreatorCollage() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden p-10">
      {/* Ambient gradient blobs */}
      <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-inflixo-blue/25 blur-3xl" />
      <div className="absolute right-10 top-1/3 h-40 w-40 rounded-full bg-inflixo-gold/25 blur-3xl" />

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Headline card */}
        <div className="mb-6 max-w-xs">
          <p className="font-display text-3xl font-medium italic leading-tight text-white">
            One link.
            <br />
            Every creator stat.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            Profiles, stats and OTT-style series — organized in one shareable Inflixo page.
          </p>
        </div>

        {/* Profile card */}
        <div className="animate-slide-up mb-4 w-64 rounded-3xl bg-white p-4" style={{ boxShadow: "var(--shadow-premium)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundImage: "var(--gradient-premium)" }}>
              TS
            </div>
            <div>
              <p className="text-sm font-bold text-inflixo-navy">Tony Stark</p>
              <p className="text-xs text-muted">@tonystark &middot; Technology</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-inflixo-purple-light px-3 py-2">
            <Users className="h-3.5 w-3.5 text-inflixo-purple" />
            <span className="text-xs font-bold text-inflixo-purple-dark">126K total fanbase</span>
          </div>
        </div>

        {/* Stat pills row */}
        <div className="mb-4 flex gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-xl">
            <InstagramIcon className="h-4 w-4 text-pink-500" />
            <span className="text-xs font-bold text-inflixo-navy">48.7K</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-xl">
            <YoutubeIcon className="h-4 w-4 text-red-500" />
            <span className="text-xs font-bold text-inflixo-navy">62.3K</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-xl">
            <FacebookIcon className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-inflixo-navy">15K</span>
          </div>
        </div>

        {/* Series row card */}
        <div className="animate-slide-up flex w-72 items-center gap-3 rounded-3xl bg-white/95 p-3" style={{ boxShadow: "var(--shadow-premium)" }}>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-inflixo-navy to-inflixo-purple-dark">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-inflixo-navy">Kashmir Diaries</p>
            <p className="text-xs text-muted">5 episodes</p>
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-full bg-inflixo-gold-light px-2 py-1">
            <TrendingUp className="h-3 w-3 text-inflixo-gold" />
          </div>
        </div>
      </div>
    </div>
  );
}
