import Image from "next/image";
import { Play } from "lucide-react";
import { EXPERT_DEMO_SERIES } from "@/data/expertDemoCreator";

/** "Ep 01: The Bootstrapped Broker — How We Built…" → "The Bootstrapped Broker" */
function shortEpisodeTitle(title: string) {
  return title.replace(/^Ep\s*\d+\s*:\s*/i, "").split(/\s+[—–-]\s+/)[0].trim();
}

/**
 * Static, lightweight phone mockup for the landing page: one demo series shown
 * like an OTT title page (poster, "Start from Ep 1", episodes in order).
 * Pure markup (no client JS). Light maroon accents to match the landing page.
 */
export function HeroPhoneMockup() {
  const series = EXPERT_DEMO_SERIES[0];
  const episodes = (series?.seasons?.[0]?.episodes ?? []).slice(0, 4);
  const total = series?.seasons?.reduce((n, s) => n + s.episodes.length, 0) ?? 0;

  if (!series) return null;

  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]" aria-hidden="true">
      <div className="relative overflow-hidden rounded-[40px] border-[10px] border-[#1C1917] bg-white shadow-2xl shadow-black/15">
        {/* notch */}
        <div className="absolute left-1/2 top-0 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#1C1917]" />

        {/* poster */}
        <div className="relative h-[160px] w-full">
          {series.posterDataUrl && (
            <Image src={series.posterDataUrl} alt="" fill sizes="300px" priority className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute inset-x-3 bottom-2.5 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Season 1 · {total} episodes · {series.language}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[14px] font-extrabold leading-tight text-white">{series.title}</p>
          </div>
        </div>

        <div className="px-3 pb-4 pt-3 text-left">
          <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#C2410C] text-[12px] font-bold text-white">
            <Play className="h-3.5 w-3.5 fill-current" />
            Start from Ep 1
          </div>

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#71717A]">Episodes, in order</p>
          <ol className="mt-1.5 space-y-1.5">
            {episodes.map((ep, i) => (
              <li
                key={ep.id}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                  i === 1 ? "border-[#C2410C]/30 bg-[#FFEAD9]" : "border-[#E4E4E7] bg-white"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${
                    i === 0 ? "bg-zinc-200 text-[#52525B]" : i === 1 ? "bg-[#C2410C] text-white" : "bg-zinc-100 text-[#52525B]"
                  }`}
                >
                  {ep.episodeNumber}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#1C1917]">
                  {shortEpisodeTitle(ep.title)}
                </span>
                {i === 0 && <span className="shrink-0 text-[9px] font-bold uppercase text-emerald-600">Watched</span>}
                {i === 1 && <span className="shrink-0 rounded bg-[#C2410C] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Next</span>}
              </li>
            ))}
          </ol>
          {total > episodes.length && (
            <p className="mt-2 text-center text-[10px] font-semibold text-[#71717A]">
              + {total - episodes.length} more episode{total - episodes.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
