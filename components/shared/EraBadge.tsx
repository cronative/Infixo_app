"use client";

import type { CSSProperties } from "react";
import { Info } from "lucide-react";
import type { EraName, EraStage } from "@/lib/creatorEra";
import { TIER_METAL, eraAlpha, eraFill, eraInk, eraSoftBg, getEraConfig } from "@/lib/eraConfig";

/** Round award medal: era colour fill + award icon, wrapped in a tier-metal ring. */
export function EraAwardMedal({ era, stage, size = 24, className = "" }: { era: EraName; stage?: EraStage | null; size?: number; className?: string }) {
  const cfg = getEraConfig(era);
  const ring = stage ? TIER_METAL[stage].ring : "transparent";
  const pad = Math.max(1.5, Math.round(size * 0.09));
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, padding: pad, background: ring, boxShadow: "0 1px 2px rgba(0,0,0,0.12)" }}
      aria-hidden
    >
      <span className="flex h-full w-full items-center justify-center rounded-full" style={{ background: eraFill(cfg) }}>
        <cfg.Icon size={Math.round(size * 0.52)} color="#FFFFFF" strokeWidth={2.2} />
      </span>
    </span>
  );
}

export interface EraBadgeProps {
  era: EraName;
  stage: EraStage;
  /** Full label, e.g. "Legendary Gold Creator". */
  label: string;
  onClick?: () => void;
  /** Small ⓘ after the label (signals the modal). */
  showInfo?: boolean;
  size?: "sm" | "md";
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/** Premium Creator Era badge: soft era-colour gradient, era-tinted border, metal-ringed award medal. */
export function EraBadge({ era, stage, label, onClick, showInfo = false, size = "md", className = "", style, title }: EraBadgeProps) {
  const cfg = getEraConfig(era);
  const ink = eraInk(cfg.color);
  const md = size === "md";
  const cls = `inline-flex min-w-0 items-center gap-1.5 rounded-[5px] border ${md ? "h-9 pl-1 pr-2" : "h-7 pl-1 pr-2"} ${className}`;
  const css: CSSProperties = {
    background: eraSoftBg(cfg),
    borderColor: eraAlpha(cfg.accent ?? cfg.color, 0.45),
    color: ink,
    ...style,
  };
  const content = (
    <>
      <EraAwardMedal era={era} stage={stage} size={md ? 26 : 20} />
      <span className={`truncate font-semibold leading-none tracking-[-0.01em] ${md ? "text-[12px] sm:text-[13px]" : "text-[11.5px]"}`}>{label}</span>
      {showInfo && <Info className={`${md ? "h-3.5 w-3.5" : "h-3 w-3"} shrink-0 opacity-70`} aria-hidden />}
    </>
  );
  if (!onClick) {
    return (
      <span className={cls} style={css} title={title ?? `${label} · ${cfg.award}`}>
        {content}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${cls} tap-scale cursor-pointer transition-[filter] hover:brightness-[1.03] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1`}
      style={css}
      title={title ?? "View Creator Era"}
      aria-label={`${label} — view Creator Era`}
    >
      {content}
    </button>
  );
}
