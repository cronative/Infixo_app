"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Copy, Play, Share2 } from "lucide-react";
import { EXPERT_DEMO_PROFILE, EXPERT_DEMO_SERIES } from "@/data/expertDemoCreator";
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

const SCREEN_H = 480;

/** Gulab theme tokens, as used on the public demo profile. */
const G = {
  accent: "#A44452",
  soft: "#F8E1E3",
  card: "#FFFBF7",
  surface: "#FBF3EE",
  border: "#F0E3DC",
  header: "#FFFFFF",
  page: "#F6EEE6",
  text: "#1F1A1B",
  muted: "#52525B",
};

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
  const listY = phase === "scrolled" ? -170 : 0;
  const motion = still ? "" : "transition-transform duration-[650ms] ease-[cubic-bezier(.2,.8,.2,1)]";

  return (
    <div ref={rootRef} className="relative mx-auto w-[280px] sm:w-[300px]" aria-hidden="true">
      <div className="relative overflow-hidden rounded-[40px] border-[10px] border-[#1C1917] bg-white shadow-2xl shadow-black/15">
        {/* notch */}
        <div className="absolute left-1/2 top-0 z-30 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#1C1917]" />

        <div className="relative overflow-hidden" style={{ height: SCREEN_H }}>
          <div className={`flex h-full w-[300%] ${motion}`} style={{ transform: `translateX(${sceneX})` }}>
            {/* ── Scene 1: public series listing (same design as /[username]/series, Gulab theme) ── */}
            <div className="relative h-full w-1/3 overflow-hidden" style={{ background: G.page }}>
              <div
                className={still ? "" : "transition-transform duration-[1600ms] ease-in-out"}
                style={{ transform: `translateY(${listY}px)` }}
              >
                <div className="mx-1.5 mt-6 overflow-hidden rounded-[5px]" style={{ background: G.header }}>
                  {/* top bar */}
                  <div className="flex items-center justify-between px-2 py-1.5" style={{ borderBottom: `1px solid ${G.border}` }}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-[5px]" style={{ background: G.surface }}>
                      <ArrowLeft className="h-3 w-3" style={{ color: G.text }} />
                    </span>
                    <span className="flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[8.5px] font-semibold" style={{ background: G.soft, color: G.accent }}>
                      <Share2 className="h-2.5 w-2.5" /> Share
                    </span>
                  </div>
                  {/* creator header */}
                  <div className="flex flex-col items-center px-3 pb-2.5 pt-2 text-center">
                    <span className="relative h-11 w-11 rounded-full p-[2px]" style={{ background: G.accent }}>
                      {EXPERT_DEMO_PROFILE.photoDataUrl && (
                        <Image src={EXPERT_DEMO_PROFILE.photoDataUrl} alt="" width={44} height={44} className="h-full w-full rounded-full border-2 border-white object-cover" />
                      )}
                    </span>
                    <p className="mt-1 text-[12px] font-extrabold" style={{ color: G.text }}>{EXPERT_DEMO_PROFILE.displayName}</p>
                    <p className="text-[8.5px]" style={{ color: G.muted }}>@{EXPERT_DEMO_PROFILE.username}</p>
                    <span className="mt-1 rounded-[5px] px-1.5 py-[1px] text-[8px] font-semibold" style={{ background: G.soft, color: G.accent }}>
                      {EXPERT_DEMO_PROFILE.category}
                    </span>
                    <div className="mt-1.5 flex gap-1">
                      {[InstagramIcon, YoutubeIcon, FacebookIcon].map((Icon, k) => (
                        <span key={k} className="flex h-5 w-5 items-center justify-center rounded-[5px]" style={{ background: G.soft, border: `1px solid ${G.border}` }}>
                          <Icon className="h-2.5 w-2.5" style={{ color: G.accent }} />
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* My Series */}
                  <div className="px-2 pb-3 pt-2" style={{ background: G.card }}>
                    <p className="text-center text-[12px] font-extrabold" style={{ color: G.text }}>
                      My Series{" "}
                      <span className="ml-0.5 rounded-full px-1.5 text-[8.5px]" style={{ background: G.soft, color: G.accent }}>{allSeries.length}</span>
                    </p>
                    <p className="text-center text-[8px]" style={{ color: G.muted }}>All my shows in one place. Start from Ep 1.</p>
                    <div className="mt-1.5 flex justify-center gap-1">
                      <span className="rounded-[5px] px-2 py-1 text-[8.5px] font-semibold text-white" style={{ background: G.accent }}>All</span>
                      <span className="flex items-center gap-1 rounded-[5px] bg-white px-1.5 py-1 text-[8.5px] font-semibold" style={{ border: `1px solid ${G.border}`, color: G.text }}>
                        <YoutubeIcon className="h-2.5 w-2.5 text-[#FF0000]" /> YouTube
                      </span>
                      <span className="flex items-center gap-1 rounded-[5px] bg-white px-1.5 py-1 text-[8.5px] font-semibold" style={{ border: `1px solid ${G.border}`, color: G.text }}>
                        <InstagramIcon className="h-2.5 w-2.5 text-[#E1306C]" /> Instagram
                      </span>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {allSeries.map((s, i) => {
                        const eps = s.seasons?.reduce((n, se) => n + se.episodes.length, 0) ?? 0;
                        const tapped = i === 0 && phase === "tapSeries";
                        const genres = (s.genre || "").split(",").map((g) => g.trim()).filter(Boolean).slice(0, 2);
                        return (
                          <div
                            key={s.id}
                            className={`relative flex items-center gap-2 rounded-[5px] bg-white p-1.5 transition-transform duration-200 ${tapped ? "scale-[0.97]" : ""}`}
                            style={{ border: `1px solid ${tapped ? G.accent : G.border}` }}
                          >
                            <span className="relative h-[34px] w-[56px] shrink-0 overflow-hidden rounded-[5px]">
                              {s.posterDataUrl && (
                                <Image src={s.posterDataUrl} alt="" fill sizes="60px" priority={i === 0} className="object-cover" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-[9.5px] font-bold leading-tight" style={{ color: G.text }}>{s.title}</p>
                              <p className="mt-0.5 flex items-center gap-1 text-[8px]" style={{ color: G.muted }}>
                                {eps} episodes · {s.language} <PlatformGlyph platform={s.platform} className="h-2.5 w-2.5" />
                              </p>
                              <div className="mt-0.5 flex gap-0.5">
                                {genres.map((g) => (
                                  <span key={g} className="rounded-[3px] px-1 text-[7px] font-semibold" style={{ background: G.soft, color: G.accent }}>{g}</span>
                                ))}
                              </div>
                            </div>
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-white" style={{ border: `1px solid ${G.accent}55` }}>
                              <ChevronRight className="h-3 w-3" style={{ color: G.accent }} />
                            </span>
                            {tapped && <TapDot className="left-1/2 top-1/2" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Scene 2: public series page (episodes in order) ── */}
            <div className="relative h-full w-1/3 overflow-hidden" style={{ background: G.page }}>
              <div className="mx-1.5 mt-6 overflow-hidden rounded-[5px]" style={{ background: G.card }}>
                <div className="relative h-[128px] w-full">
                  {series.posterDataUrl && <Image src={series.posterDataUrl} alt="" fill sizes="280px" className="object-cover" />}
                  <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-[5px] bg-black/45 text-white">
                    <ArrowLeft className="h-3 w-3" />
                  </span>
                  <span className="absolute right-1.5 top-1.5 flex gap-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-black/45 text-white"><Copy className="h-2.5 w-2.5" /></span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-black/45 text-white"><Share2 className="h-2.5 w-2.5" /></span>
                  </span>
                  <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-[5px] bg-black/60 px-1.5 py-0.5 text-[7.5px] font-semibold text-white">
                    <Play className="h-2 w-2 fill-current" /> {total} Episodes | {(series.genre || "").split(",").map((g) => g.trim()).join(" · ")}
                  </span>
                </div>
                <div className="px-2.5 pb-3 pt-2 text-center">
                  <p className="text-[12px] font-extrabold leading-tight" style={{ color: G.text }}>{series.title}</p>
                  <p className="mt-1 flex items-center justify-center gap-1 text-[8.5px]" style={{ color: G.muted }}>
                    {total} episodes · {series.language} · <PlatformGlyph platform={series.platform} className="h-2.5 w-2.5" /> {series.platform}
                  </p>
                  <div className="mt-1 flex justify-center gap-1">
                    {(series.genre || "").split(",").map((g) => g.trim()).filter(Boolean).map((g) => (
                      <span key={g} className="rounded-[3px] px-1 text-[7.5px] font-semibold" style={{ background: G.soft, color: G.accent, border: `1px solid ${G.border}` }}>{g}</span>
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-left">
                    <p className="text-[11px] font-extrabold" style={{ color: G.text }}>
                      Episodes <span className="ml-0.5 rounded-full px-1.5 text-[8px]" style={{ background: G.soft, color: G.accent }}>{total}</span>
                    </p>
                    <span className="text-[8px]" style={{ color: G.muted }}>Watch in order</span>
                  </div>
                  <ol className="mt-1.5 space-y-1.5 text-left">
                    {episodes.map((ep, i) => {
                      const tapped = i === 1 && phase === "tapEpisode";
                      return (
                        <li
                          key={ep.id}
                          className={`relative flex items-center gap-2 rounded-[5px] bg-white p-1.5 transition-transform duration-200 ${tapped ? "scale-[0.97]" : ""}`}
                          style={{ border: `1px solid ${tapped ? G.accent : G.border}` }}
                        >
                          <span
                            className="flex h-7 w-8 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-extrabold"
                            style={i === 0 ? { background: G.soft, color: G.accent } : { background: G.surface, color: G.text }}
                          >
                            {String(ep.episodeNumber).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-[9.5px] font-bold leading-tight" style={{ color: G.text }}>{ep.title}</p>
                            <p className="text-[7.5px]" style={{ color: G.muted }}>{ep.platform}</p>
                          </div>
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px]"
                            style={i === 0 ? { background: G.accent, color: "#fff" } : { border: `1px solid ${G.accent}66`, color: G.accent, background: "#fff" }}
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                          </span>
                          {tapped && <TapDot className="left-[85%] top-1/2" />}
                        </li>
                      );
                    })}
                  </ol>
                </div>
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
