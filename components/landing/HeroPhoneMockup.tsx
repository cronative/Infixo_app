import Image from "next/image";
import { Play } from "lucide-react";
import { EXPERT_DEMO_SERIES } from "@/data/expertDemoCreator";

/** "Ep 01: The Bootstrapped Broker — How We Built…" → "The Bootstrapped Broker" */
function shortEpisodeTitle(title: string) {
  return title.replace(/^Ep\s*\d+\s*:\s*/i, "").split(/\s+[—–-]\s+/)[0].trim();
}

/**
 * Static, lightweight phone mockup for the landing hero: one demo series
 * with its episodes in order. Pure markup (no client JS) so it never delays LCP.
 */
export function HeroPhoneMockup() {
  const series = EXPERT_DEMO_SERIES[0];
  const episodes = (series?.seasons?.[0]?.episodes ?? []).slice(0, 4);
  const total = series?.seasons?.reduce((n, s) => n + s.episodes.length, 0) ?? 0;

  if (!series) return null;

  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]" aria-hidden="true">
      {/* soft glow */}
      <div className="absolute -inset-6 rounded-[48px] bg-[#7A2253]/10 blur-2xl" />

      <div className="relative rounded-[40px] border-[10px] border-[#18181B] bg-white shadow-2xl shadow-[#7A2253]/20 overflow-hidden">
        {/* notch */}
        <div className="absolute left-1/2 top-0 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#18181B]" />

        {/* poster */}
        <div className="relative h-[150px] w-full">
          {series.posterDataUrl && (
            <Image
              src={series.posterDataUrl}
              alt=""
              fill
              sizes="300px"
              priority
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-3 bottom-2.5 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
              Series · {total} episodes · {series.language}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[14px] font-extrabold leading-tight text-white">
              {series.title}
            </p>
          </div>
        </div>

        <div className="px-3 pb-4 pt-3 text-left">
          <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#7A2253] text-[12px] font-bold text-white">
            <Play className="h-3.5 w-3.5 fill-current" />
            Start from Ep 1
          </div>

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
            Episodes, in order
          </p>
          <ol className="mt-1.5 space-y-1.5">
            {episodes.map((ep, i) => (
              <li
                key={ep.id}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                  i === 0 ? "border-[#7A2253]/40 bg-[#F7EDEF]" : "border-[#E4E4E7] bg-white"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-extrabold ${
                    i === 0 ? "bg-[#7A2253] text-white" : "bg-zinc-100 text-[#52525B]"
                  }`}
                >
                  {ep.episodeNumber}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#18181B]">
                  {shortEpisodeTitle(ep.title)}
                </span>
                {i === 0 && <Play className="h-3 w-3 shrink-0 fill-[#7A2253] text-[#7A2253]" />}
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

      {/* floating chip: total fans */}
      <div className="absolute -left-10 top-8 hidden rounded-xl border border-[#E4E4E7] bg-white px-3 py-2 text-left shadow-lg sm:block">
        <p className="text-[15px] font-extrabold leading-none text-[#7A2253]">6.4M</p>
        <p className="mt-0.5 text-[10px] font-semibold text-[#52525B]">Total fans · IG + YT + FB</p>
      </div>
    </div>
  );
}
