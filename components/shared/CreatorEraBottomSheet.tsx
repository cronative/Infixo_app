"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Check, Sparkles, ChevronDown } from "lucide-react";
import type { CreatorEra } from "@/lib/creatorEra";
import { ERA_CONFIG, ERA_ORDER, eraAlpha, eraInk, eraSoftBg, getEraConfig } from "@/lib/eraConfig";
import { EraAwardMedal } from "@/components/shared/EraBadge";

export interface CreatorEraBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  era: CreatorEra | null;
  /** Kept for call-site compatibility; the modal intentionally shows no follower numbers. */
  totalFans?: number | null;
  creatorName?: string;
  creatorUsername?: string;
  isCreatorView?: boolean;
  primaryAccounts?: Array<{
    platform: string;
    username: string;
    count?: number;
    url?: string;
  }>;
}

const STORY =
  "Every creator deserves a stage — not just a follower count, but a story of how far they've come. At Inflixo AI, we believe every journey, from the very first upload to the day millions tune in, deserves to be seen and celebrated. That's why we built Creator Era: 10 stages that recognise where a creator stands today, from Rising all the way to Legendary. Powered by Inflixo AI's proprietary algorithm, every Era is calculated from a creator's Total Fans across their connected platforms — and each one comes with its own award. Earned, never bought. 💜";

export function CreatorEraBottomSheet({ isOpen, onClose, era, creatorName, isCreatorView = false }: CreatorEraBottomSheetProps) {
  const [howOpen, setHowOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !era) return null;

  const cfg = getEraConfig(era.era);
  const ink = eraInk(cfg.color);
  const currentIndex = ERA_ORDER.indexOf(era.era);
  const name = creatorName?.trim() || "This creator";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 pt-[30px] animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Creator Era"
        className="relative z-10 flex w-full max-w-[440px] max-h-[85vh] flex-col overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white p-4 sm:p-5 text-left shadow-2xl animate-in slide-in-from-top-4 duration-200"
      >
        {/* Header: award + name / era */}
        <div className="flex shrink-0 items-start justify-between gap-3 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <EraAwardMedal era={era.era} stage={era.stage} size={44} />
            <div className="min-w-0">
              <h3 className="break-words text-[16px] sm:text-[17px] font-bold leading-tight text-[#0f172a]">
                {isCreatorView ? "You" : name}
              </h3>
              <p className="mt-0.5 text-[14px] font-semibold leading-snug" style={{ color: ink }}>
                {isCreatorView ? "are" : "is"} in the {era.era} Era 👑
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Story */}
        <div className="shrink-0 rounded-[8px] border px-3 py-2.5" style={{ background: eraSoftBg(cfg), borderColor: eraAlpha(cfg.color, 0.25) }}>
          <p className="text-[13px] font-semibold text-[#0f172a]">Why Creator Era?</p>
          <p className={`mt-1 text-[13px] leading-[1.45] text-[#334155] ${storyOpen ? "" : "line-clamp-5 sm:line-clamp-none"}`}>{STORY}</p>
          {!storyOpen && (
            <button
              type="button"
              onClick={() => setStoryOpen(true)}
              className="mt-1 text-[12px] font-semibold sm:hidden cursor-pointer"
              style={{ color: ink }}
            >
              Read more
            </button>
          )}
        </div>

        {/* The 10 Creator Eras */}
        <p className="mt-3 mb-1.5 shrink-0 px-1 text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">The 10 Creator Eras</p>
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
          {ERA_ORDER.map((name, i) => {
            const e = ERA_CONFIG[name];
            const isCurrent = i === currentIndex;
            const isPast = i < currentIndex;
            return (
              <li
                key={name}
                className={`flex h-9 items-center gap-2.5 rounded-[6px] border px-2.5 ${isCurrent ? "" : "border-transparent"} ${!isCurrent && !isPast ? "opacity-50" : ""}`}
                style={isCurrent ? { background: eraAlpha(e.color, 0.1), borderColor: eraAlpha(e.color, 0.45) } : undefined}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: e.color }} aria-hidden />
                <e.Icon size={16} color={eraInk(e.color)} strokeWidth={2.1} />
                <span className={`text-[13px] ${isCurrent ? "font-bold" : "font-semibold"} text-[#0f172a]`}>{name}</span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-[#64748b]">{e.award}</span>
                {isCurrent ? (
                  <span className="shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10.5px] font-bold text-white" style={{ background: eraInk(e.color) }}>
                    You are here
                  </span>
                ) : isPast ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" strokeWidth={2.6} aria-label="Reached" />
                ) : null}
              </li>
            );
          })}
        </ul>

        {/* How Creator Era works */}
        <div className="mt-2 shrink-0 border-t border-[#f1f5f9] pt-2">
          <button
            type="button"
            onClick={() => setHowOpen((v) => !v)}
            aria-expanded={howOpen}
            className="flex w-full items-center justify-between px-1 py-1 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors cursor-pointer select-none"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" style={{ color: ink }} />
              <span>How Creator Era works</span>
            </span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${howOpen ? "rotate-180" : ""}`} />
          </button>
          {howOpen && (
            <div className="space-y-1.5 px-2 pb-1 pt-2 text-[11.5px] leading-relaxed text-[#64748b]">
              <p>• <strong className="text-[#0f172a]">Primary accounts count:</strong> only the primary account on each platform counts toward Total Fans and Creator Era.</p>
              <p>• <strong className="text-[#0f172a]">One unified community:</strong> YouTube subscribers, Instagram followers and Facebook supporters, united into one real digital footprint.</p>
              <p>• <strong className="text-[#0f172a]">Public &amp; authentic:</strong> counted from public profiles on connected platforms — no passwords or logins needed.</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-2 shrink-0 border-t border-[#f1f5f9] pt-3">
          {isCreatorView ? (
            <Link
              href="/eras"
              onClick={onClose}
              className="tap-scale flex w-full items-center justify-center rounded-[6px] bg-[#7A2253] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#681c46] transition-colors"
            >
              Explore all Creator Eras →
            </Link>
          ) : (
            <Link
              href="/signup"
              onClick={onClose}
              className="tap-scale block w-full rounded-[6px] bg-[#7A2253] px-4 py-2.5 text-center text-white hover:bg-[#681c46] transition-colors"
            >
              <span className="block text-[13px] font-bold">Are you a creator? Your Era is waiting. ✨</span>
              <span className="mt-0.5 block text-[11.5px] font-medium text-white/85">
                Create your free Inflixo profile and discover where your journey stands →
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
