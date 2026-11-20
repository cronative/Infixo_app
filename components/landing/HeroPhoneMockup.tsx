"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Play } from "lucide-react";
import { EXPERT_DEMO_SERIES } from "@/data/expertDemoCreator";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

/** "Ep 01: The Bootstrapped Broker — How We Built…" → "The Bootstrapped Broker" */
function shortEpisodeTitle(title: string) {
  return title.replace(/^Ep\s*\d+\s*:\s*/i, "").split(/\s+[—–-]\s+/)[0].trim();
}

function PlatformGlyph({ platform, className = "h-3 w-3" }: { platform?: string; className?: string }) {
  const p = (platform || "").toLowerCase();
  if (p.includes("insta")) return <InstagramIcon className={`${className} text-[#E1306C]`} />;
  if (p.includes("face")) return <FacebookIcon className={`${className} text-[#1877F2]`} />;
  return <YoutubeIcon className={`${className} text-[#FF0000]`} />;
}

/**
 * Self-playing demo of the fan journey, looped:
 *   series listing (scrolls) → tap a series → episodes in order → tap the next
 *   episode → it opens on the creator's platform (YouTube).
 * Decorative only (aria-hidden). With reduced motion it rests on the episode page.
 */
type Phase = "list" | "scrolled" | "back" | "tapSeries" | "details" | "tapEpisode" | "player";

const TIMELINE: { phase: Phase; ms: number }[] = [
  { phase: "list", ms: 1000 },
  { phase: "scrolled", ms: 2000 },
  { phase: "back", ms: 1300 },
  { phase: "tapSeries", ms: 700 },
  { phase: "details", ms: 1700 },
  { phase: "tapEpisode", ms: 700 },
  { phase: "player", ms: 4200 },
];

const SCREEN_H = 470;

export function HeroPhoneMockup() {
  const allSeries = EXPERT_DEMO_SERIES.slice(0, 5);
  const series = allSeries[0];
  const episodes = (series?.seasons?.[0]?.episodes ?? []).slice(0, 4);
  const total = series?.seasons?.reduce((n, s) => n + s.episodes.length, 0) ?? 0;
  const nextEp = episodes[1] ?? episodes[0];

  const [step, setStep] = useState(0);
  const [still, setStill] = useState(false);
  const visible = useRef(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) {
      const t = window.setTimeout(() => {
        setStill(true);
        setStep(TIMELINE.findIndex((s) => s.phase === "details"));
      }, 0);
      return () => window.clearTimeout(t);
    }

    // Only animate while the phone is on screen.
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
    });
    if (rootRef.current) io.observe(rootRef.current);

    let i = 0;
    let timer = 0;
    const tick = () => {
      timer = window.setTimeout(() => {
        if (visible.current && !document.hidden) {
          i = (i + 1) % TIMELINE.length;
          setStep(i);
        }
        tick();
      }, TIMELINE[i].ms);
    };
    tick();
    return () => {
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  if (!series) return null;

  const phase = TIMELINE[step].phase;
  const onList = phase === "list" || phase === "scrolled" || phase === "back" || phase === "tapSeries";
  const onPlayer = phase === "player";
  // Scenes sit side by side: list | details | player.
  const sceneX = onList ? "0%" : onPlayer ? "-66.6667%" : "-33.3333%";
  const listY = phase === "scrolled" ? -300 : 0;
  const motion = still ? "" : "transition-transform duration-[650ms] ease-[cubic-bezier(.2,.8,.2,1)]";

  return (
    <div ref={rootRef} className="relative mx-auto w-[280px] sm:w-[300px]" aria-hidden="true">
      <div className="relative overflow-hidden rounded-[40px] border-[10px] border-[#1C1917] bg-white shadow-2xl shadow-black/15">
        {/* notch */}
        <div className="absolute left-1/2 top-0 z-30 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#1C1917]" />

        <div className="relative overflow-hidden" style={{ height: SCREEN_H }}>
          <div className={`flex h-full w-[300%] ${motion}`} style={{ transform: `translateX(${sceneX})` }}>
            {/* ── Scene 1: series listing ── */}
            <div className="relative h-full w-1/3 overflow-hidden bg-[#FFF8F4]">
              <div
                className={still ? "" : "transition-transform duration-[1600ms] ease-in-out"}
                style={{ transform: `translateY(${listY}px)` }}
              >
                <div className="px-3 pb-2 pt-8 text-center">
                  <p className="text-[15px] font-extrabold text-[#1C1917]">
                    My Series <span className="ml-1 rounded-[5px] bg-[#FFEDE6] px-1.5 py-0.5 text-[10px] text-[#C21B5C]">{allSeries.length}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#71717A]">Start at Ep 1, binge in order.</p>
                </div>
                <div className="space-y-2.5 px-3 pb-4">
                  {allSeries.map((s, i) => {
                    const eps = s.seasons?.reduce((n, se) => n + se.episodes.length, 0) ?? 0;
                    const tapped = i === 0 && phase === "tapSeries";
                    return (
                      <div
                        key={s.id}
                        className={`relative overflow-hidden rounded-[5px] border bg-white transition-transform duration-200 ${
                          tapped ? "scale-[0.97] border-[#C21B5C]/40" : "border-[#F6E0DC]"
                        }`}
                      >
                        <div className="relative h-[92px] w-full">
                          {s.posterDataUrl && (
                            <Image src={s.posterDataUrl} alt="" fill sizes="280px" priority={i === 0} className="object-cover" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <span className="absolute bottom-1.5 left-2 inline-flex items-center gap-1 rounded-[5px] bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-[#1C1917]">
                            <PlatformGlyph platform={s.platform} className="h-2.5 w-2.5" />
                            {s.platform}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-2.5 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11.5px] font-bold text-[#1C1917]">{s.title}</p>
                            <p className="text-[9.5px] text-[#71717A]">
                              {eps} episodes · {s.language}
                            </p>
                          </div>
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C21B5C] text-white">
                            <Play className="h-3 w-3 fill-current" />
                          </span>
                        </div>
                        {tapped && <TapDot className="left-1/2 top-[46px]" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Scene 2: episode page ── */}
            <div className="relative h-full w-1/3 overflow-hidden bg-white">
              <div className="relative h-[160px] w-full">
                {series.posterDataUrl && (
                  <Image src={series.posterDataUrl} alt="" fill sizes="300px" className="object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                <span className="absolute left-2.5 top-7 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white">
                  <ChevronLeft className="h-4 w-4" />
                </span>
                <div className="absolute inset-x-3 bottom-2.5 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    Season 1 · {total} episodes · {series.language}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[14px] font-extrabold leading-tight text-white">{series.title}</p>
                </div>
              </div>

              <div className="px-3 pb-4 pt-3 text-left">
                <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[5px] bg-[#C21B5C] text-[12px] font-bold text-white">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Start from Ep 1
                </div>

                <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#71717A]">Episodes, in order</p>
                <ol className="mt-1.5 space-y-1.5">
                  {episodes.map((ep, i) => {
                    const tapped = i === 1 && phase === "tapEpisode";
                    return (
                      <li
                        key={ep.id}
                        className={`relative flex items-center gap-2 rounded-[5px] border px-2 py-1.5 transition-transform duration-200 ${
                          i === 1 ? "border-[#C21B5C]/30 bg-[#FFEDE6]" : "border-[#ECECF0] bg-white"
                        } ${tapped ? "scale-[0.97]" : ""}`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-extrabold ${
                            i === 1 ? "bg-[#C21B5C] text-white" : "bg-zinc-100 text-[#52525B]"
                          }`}
                        >
                          {ep.episodeNumber}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#1C1917]">
                          {shortEpisodeTitle(ep.title)}
                        </span>
                        {i === 0 && <span className="shrink-0 text-[9px] font-bold uppercase text-emerald-600">Watched</span>}
                        {i === 1 && (
                          <span className="shrink-0 rounded-[5px] bg-[#C21B5C] px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">Next</span>
                        )}
                        {tapped && <TapDot className="left-[60%] top-1/2" />}
                      </li>
                    );
                  })}
                </ol>
                {total > episodes.length && (
                  <p className="mt-2 text-center text-[10px] font-semibold text-[#71717A]">
                    + {total - episodes.length} more episode{total - episodes.length > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            {/* ── Scene 3: opens on the platform ── */}
            <div className="relative flex h-full w-1/3 flex-col bg-[#0F0F0F] text-left text-white">
              <div className="flex items-center gap-1.5 px-3 pb-2 pt-7">
                <PlatformGlyph platform={nextEp?.platform || series.platform} className="h-4 w-4" />
                <span className="text-[12px] font-bold">{nextEp?.platform || series.platform}</span>
                <span className="ml-auto rounded-[5px] bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white/80">
                  Opened from Inflixo
                </span>
              </div>
              <div className="relative aspect-video w-full bg-black">
                {series.posterDataUrl && (
                  <Image
                    src={series.posterDataUrl}
                    alt=""
                    fill
                    sizes="300px"
                    className={`object-cover ${onPlayer && !still ? "animate-[heroKen_4.2s_ease-out_forwards]" : ""}`}
                  />
                )}
                <span
                  className={`absolute left-1/2 top-1/2 flex h-10 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[10px] bg-[#FF0000] transition-opacity duration-500 ${
                    onPlayer ? "opacity-0 delay-700" : "opacity-100"
                  }`}
                >
                  <Play className="h-5 w-5 fill-white text-white" />
                </span>
                <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
                  <div
                    className="h-full bg-[#FF0000]"
                    style={{
                      width: onPlayer ? "62%" : "0%",
                      transition: onPlayer && !still ? "width 3.8s linear 0.4s" : "none",
                    }}
                  />
                </div>
              </div>
              <div className="px-3 pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  Ep {nextEp?.episodeNumber} · {series.title.split(":")[0]}
                </p>
                <p className="mt-1 line-clamp-2 text-[13px] font-bold leading-snug">{nextEp?.title}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6A1A] to-[#E8246F] text-[10px] font-extrabold">
                    AR
                  </span>
                  <span className="text-[11px] font-semibold text-white/90">Aarav Rathore</span>
                </div>
                <p className="mt-4 rounded-[5px] border border-white/10 bg-white/5 px-2.5 py-2 text-[10.5px] leading-snug text-white/80">
                  Views and likes still count on your channel. Inflixo just keeps the episodes in order.
                </p>
                {episodes[2] && (
                  <div className="mt-3 flex items-center gap-2 rounded-[5px] bg-white/5 px-2.5 py-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#FF8FB5]">Up next</span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-white/90">
                      Ep {episodes[2].episodeNumber}: {shortEpisodeTitle(episodes[2].title)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A finger-tap marker: solid dot with a ping ring. */
function TapDot({ className = "" }: { className?: string }) {
  return (
    <span className={`pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 ${className}`}>
      <span className="absolute -inset-3 animate-ping rounded-full bg-white/70" />
      <span className="relative block h-6 w-6 rounded-full border-2 border-white bg-[#1C1917]/35 shadow" />
    </span>
  );
}
