import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { InflixoWordmark } from "@/components/brand/InflixoLogo";
import { MAIN_ERAS } from "@/lib/creatorEra";

export const metadata: Metadata = {
  title: "What's your Creator Era? — Inflixo",
  description:
    "Discover your Creator Era milestone ladder. Combine your fanbase across YouTube, Instagram, and Facebook to unlock your verified status.",
};

export default function CreatorErasPage() {
  return (
    <div className="min-h-screen bg-[#FFFBFD] text-slate-900 select-none flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="w-full border-b border-[#FCE7F3] bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="tap-scale flex items-center gap-2">
            <InflixoWordmark className="h-7" />
          </Link>

          <Link
            href="/login"
            className="tap-scale inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[5px] bg-[#7A2253] hover:bg-[#681c46] text-white text-xs font-bold shadow-2xs transition-colors"
          >
            <span>Claim Your Link</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0F5] border border-[#FCE7F3] text-xs font-bold text-[#7A2253]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>OFFICIAL FOLLOWER ACHIEVEMENT SYSTEM</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-2xl mx-auto">
          What&apos;s your Creator Era?
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
          Inflixo combines verified follower &amp; subscriber counts across Instagram, YouTube, and
          Facebook to celebrate creator milestones without downgrades.
        </p>

        {/* Primary CTA */}
        <div className="pt-2">
          <Link
            href="/login"
            className="tap-scale inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[8px] bg-[#7A2253] hover:bg-[#681c46] text-white text-sm font-bold shadow-lg shadow-[#7A2253]/20 transition-all hover:scale-[1.02]"
          >
            <span>Find yours — claim your Inflixo link</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 10-Era Ladder */}
        <section className="pt-8 sm:pt-12 text-left space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900">The 10 Creator Eras</h2>
            <span className="text-xs text-slate-500 font-medium">30 exact sub-levels</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {MAIN_ERAS.map((era, index) => (
              <div
                key={era.name}
                className="rounded-[8px] border border-[#FCE7F3] bg-white p-4 sm:p-5 shadow-xs space-y-3 hover:border-[#F472B6]/40 transition-colors"
              >
                {/* Era Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-[4px] bg-[#FFF0F5] text-[11px] font-black text-[#7A2253]">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{era.name} Era</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#7A2253] bg-[#FFF0F5] px-2 py-0.5 rounded-[4px]">
                    {era.range}
                  </span>
                </div>

                {/* 3 Sub-Levels */}
                <div className="space-y-1.5 pt-1">
                  {era.subLevels.map((sub) => (
                    <div
                      key={sub.badge}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-[4px] bg-slate-50/70"
                    >
                      <span className="font-semibold text-slate-800">{sub.badge}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{sub.range}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Highlights */}
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-4 rounded-[6px] border border-slate-200/80 bg-white">
            <ShieldCheck className="h-5 w-5 text-[#7A2253] mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Peak Fanbase Protected</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Your Creator Era badge reflects your highest reached milestone and never downgrades.
            </p>
          </div>
          <div className="p-4 rounded-[6px] border border-slate-200/80 bg-white">
            <Check className="h-5 w-5 text-[#7A2253] mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Multi-Platform Sum</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Connect 1, 2, or 3 platforms. Your audience is combined into one unified achievement.
            </p>
          </div>
          <div className="p-4 rounded-[6px] border border-slate-200/80 bg-white">
            <Sparkles className="h-5 w-5 text-[#7A2253] mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Story Share Cards</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Generate 1080×1920 Instagram Story cards in your profile&apos;s theme colors on every unlock.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="py-10 border-t border-[#FCE7F3] mt-8 text-center space-y-4">
          <h3 className="text-xl font-bold text-slate-900">
            Ready to find your Creator Era?
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Create your Inflixo profile in 60 seconds and sync your YouTube, Instagram, or Facebook.
          </p>
          <Link
            href="/login"
            className="tap-scale inline-flex items-center gap-2 px-6 py-3 rounded-[8px] bg-[#7A2253] hover:bg-[#681c46] text-white text-xs sm:text-sm font-bold shadow-md transition-colors"
          >
            <span>Find yours — claim your Inflixo link</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#FCE7F3] bg-white py-6 text-center text-xs text-slate-500">
        Inflixo · The Creator Operating System · #MyCreatorEra
      </footer>
    </div>
  );
}
