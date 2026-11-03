"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { X, Check, ChevronDown } from "lucide-react";
import type { CreatorEra } from "@/lib/creatorEra";
import { ERA_CONFIG, ERA_ORDER, eraAlpha, eraInk, eraSoftBg, getEraConfig } from "@/lib/eraConfig";
import { EraAwardMedal } from "@/components/shared/EraBadge";
import { TAGLINE } from "@/lib/brand";

export interface CreatorEraBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  era: CreatorEra | null;
  /** Kept for call-site compatibility; the modal intentionally shows no numbers. */
  totalFans?: number | null;
  creatorName?: string;
  creatorUsername?: string;
  isCreatorView?: boolean;
  primaryAccounts?: Array<{ platform: string; username: string; count?: number; url?: string }>;
}

const STORY =
  "Every creator's story starts the same way — a phone, an idea, and the courage to hit 'post'. Then come the late-night edits, the videos nobody watched, and the one that suddenly did. Slowly, one fan becomes a hundred, and a hundred becomes a community. We kept seeing these journeys and asked: why does the world only see a follower count? So, with Inflixo AI, we built Creator Era — a way to tell every creator's journey, stage by stage. ✨";

const WHY = [
  "A number doesn't tell a story — an Era does.",
  "Every stage deserves recognition, not just the top.",
  "It gives every creator a next level to reach.",
  "Fans and brands instantly understand where a creator stands.",
];
const HOW = [
  "Inflixo AI reads Total Fans from your primary connected accounts.",
  "Our proprietary algorithm places you in your Era automatically.",
  "Every Era has its own colour, icon and award.",
  "As your fans grow, you unlock the next Era — earned, never bought.",
];
const FAQ = [
  { q: "Do I need to apply?", a: "No, your Era is calculated automatically." },
  { q: "Can I buy a higher Era?", a: "No — every Era is earned through your real audience." },
  { q: "Does it update?", a: "Yes, your Era moves up as your fans grow." },
];

type PanelId = "why" | "how" | "eras" | "faq";

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 px-3.5 py-3">
      {items.map((t) => (
        <li key={t} className="flex gap-2 text-[12.5px] leading-snug text-[#334155]">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#94a3b8]" aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function CreatorEraBottomSheet({ isOpen, onClose, era, creatorName }: CreatorEraBottomSheetProps) {
  const [open, setOpen] = useState<PanelId | null>("eras");
  const [storyOpen, setStoryOpen] = useState(false);
  const currentRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setOpen("eras");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Bring the creator's current Era into view whenever the list is shown.
  useEffect(() => {
    if (isOpen && open === "eras") {
      const t = window.setTimeout(() => currentRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 120);
      return () => window.clearTimeout(t);
    }
  }, [isOpen, open]);

  if (!isOpen || !era) return null;

  const cfg = getEraConfig(era.era);
  const ink = eraInk(cfg.color);
  const currentIndex = ERA_ORDER.indexOf(era.era);
  const fullName = creatorName?.trim() || "This creator";
  const firstName = fullName.split(/\s+/)[0] || fullName;

  const panel = (id: PanelId, title: string, body: ReactNode) => {
    const isOpenPanel = open === id;
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen(isOpenPanel ? null : id)}
          aria-expanded={isOpenPanel}
          className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#0f172a] cursor-pointer"
          style={{ backgroundColor: "color-mix(in srgb, var(--accent, #7A2253) 7%, transparent)" }}
        >
          <span>{title}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[#64748b] transition-transform duration-200 ${isOpenPanel ? "rotate-180" : ""}`} />
        </button>
        {isOpenPanel && <div className="border-t border-[#e2e8f0] animate-in fade-in duration-150">{body}</div>}
      </div>
    );
  };

  const erasList = (
    <ul className="divide-y divide-[#f1f5f9] py-1">
      {ERA_ORDER.map((name, i) => {
        const e = ERA_CONFIG[name];
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        const isNext = i === currentIndex + 1;
        return (
          <li key={name} ref={isCurrent ? currentRef : undefined} aria-current={isCurrent ? "step" : undefined}>
            <div
              className={`flex min-h-9 items-center gap-2.5 px-3.5 py-1.5 ${!isCurrent && !isPast ? "opacity-55" : ""}`}
              style={isCurrent ? { background: eraAlpha(e.color, 0.12) } : undefined}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: e.color }} aria-hidden />
              <e.Icon size={15} color={eraInk(e.color)} strokeWidth={2.1} />
              <span className={`shrink-0 text-[13px] ${isCurrent ? "font-bold" : "font-semibold"} text-[#0f172a]`}>{name}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-[#64748b]">{e.award}</span>
              {isCurrent ? (
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold text-white" style={{ background: eraInk(e.color) }}>
                  {firstName} is here ✨
                </span>
              ) : isPast ? (
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-[#94a3b8]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.6} style={{ color: eraInk(e.color) }} aria-hidden />
                  <span className="hidden min-[380px]:inline">{firstName} has been here</span>
                </span>
              ) : isNext ? (
                <span className="shrink-0 text-[11px] font-medium text-[#64748b]">{firstName}&apos;s next chapter →</span>
              ) : null}
            </div>
            {isCurrent && (
              <p className="px-3.5 pb-2 pt-1 text-[11.5px] italic text-[#64748b]" style={{ background: eraAlpha(e.color, 0.12) }}>
                Every fan brought {firstName} here — and the journey isn&apos;t over yet.
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs sm:items-center sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${fullName} is in the ${era.era} Era`}
        className="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[16px] border border-[#e2e8f0] bg-white text-left shadow-2xl sm:max-w-[440px] sm:rounded-[16px] animate-in slide-in-from-bottom-4 duration-200"
      >
        {/* Sticky header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#f1f5f9] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <EraAwardMedal era={era.era} stage={era.stage} size={42} />
            <div className="min-w-0">
              <h3 className="break-words text-[16px] font-bold leading-tight text-[#0f172a]">{fullName}</h3>
              <p className="mt-0.5 text-[13.5px] font-semibold leading-snug" style={{ color: ink }}>
                is in the {era.era} Era 👑
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrolling body */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <div className="rounded-[8px] border px-3 py-2.5" style={{ background: eraSoftBg(cfg), borderColor: eraAlpha(cfg.color, 0.25) }}>
            <p className={`text-[13px] leading-[1.5] text-[#334155] ${storyOpen ? "" : "line-clamp-5 sm:line-clamp-none"}`}>{STORY}</p>
            {!storyOpen && (
              <button type="button" onClick={() => setStoryOpen(true)} className="mt-1 text-[12px] font-semibold sm:hidden cursor-pointer" style={{ color: ink }}>
                Read more
              </button>
            )}
          </div>

          <div className="divide-y divide-[#e2e8f0] overflow-hidden rounded-[8px] border border-[#e2e8f0]">
            {panel("why", "Why we built Creator Era", <Bullets items={WHY} />)}
            {panel("how", "How Creator Era works", <Bullets items={HOW} />)}
            {panel("eras", "Our Creator Eras", erasList)}
            {panel(
              "faq",
              "FAQ",
              <dl className="divide-y divide-[#f1f5f9]">
                {FAQ.map((f) => (
                  <div key={f.q} className="px-3.5 py-2.5">
                    <dt className="text-[12.5px] font-semibold text-[#0f172a]">{f.q}</dt>
                    <dd className="mt-0.5 text-[12.5px] text-[#475569]">{f.a}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t border-[#f1f5f9] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
          <p className="mb-2 text-center text-[11px] font-medium text-[#94a3b8]">Inflixo · {TAGLINE}</p>
          <Link
            href="/signup"
            onClick={onClose}
            className="tap-scale block w-full rounded-[8px] bg-[#7A2253] px-4 py-2.5 text-center text-white hover:bg-[#681c46] transition-colors"
          >
            <span className="block text-[13px] font-bold">Are you a creator? Your Era is waiting. ✨</span>
            <span className="mt-0.5 block text-[11.5px] font-medium text-white/85">
              Create your free Inflixo profile and discover your{" "}<span className="whitespace-nowrap">journey →</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
