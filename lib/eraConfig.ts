import type { ComponentType, CSSProperties } from "react";
import { Crown, Flame, Flower2, Rocket, Shield, Sparkle, Star, TreePine } from "lucide-react";
import { LaurelIcon, TorchIcon } from "@/components/shared/EraAwardIcons";
import type { EraName, EraStage } from "@/lib/creatorEra";

/**
 * Creator Era visual config — the single source for era colours, award names and award icons.
 * Era *thresholds* stay in lib/creatorEra.ts. Bronze / Silver / Gold are used for badge metal only.
 */

export type EraAwardIcon = ComponentType<{
  className?: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number | string;
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
}>;

export interface EraConfig {
  name: EraName;
  /** Main era colour (avatar ring, dots, badge tint). */
  color: string;
  /** Optional second colour (Legendary's gold). */
  accent?: string;
  award: string;
  Icon: EraAwardIcon;
}

export const ERA_CONFIG: Record<EraName, EraConfig> = {
  Rising: { name: "Rising", color: "#4BA3E3", award: "First Spark", Icon: Sparkle },
  Blooming: { name: "Blooming", color: "#E86AA6", award: "Bloom Badge", Icon: Flower2 },
  Shining: { name: "Shining", color: "#F2B233", award: "Shining Star", Icon: Star },
  Glowing: { name: "Glowing", color: "#F07B3F", award: "Glow Flame", Icon: Flame },
  Growing: { name: "Growing", color: "#3BAE6B", award: "Growth Tree", Icon: TreePine },
  Thriving: { name: "Thriving", color: "#14A3A3", award: "Thrive Rocket", Icon: Rocket },
  Flourishing: { name: "Flourishing", color: "#8B5CF6", award: "Flourish Laurel", Icon: LaurelIcon },
  Inspiring: { name: "Inspiring", color: "#4F46E5", award: "Inspire Torch", Icon: TorchIcon },
  Leading: { name: "Leading", color: "#DC2626", award: "Leader Shield", Icon: Shield },
  Legendary: { name: "Legendary", color: "#7A1F4F", accent: "#D4AF37", award: "Legend Crown", Icon: Crown },
};

/** Rising → Legendary. */
export const ERA_ORDER: EraName[] = [
  "Rising", "Blooming", "Shining", "Glowing", "Growing",
  "Thriving", "Flourishing", "Inspiring", "Leading", "Legendary",
];

/** Badge metal (tier) colours. */
export const TIER_METAL: Record<EraStage, { color: string; ring: string }> = {
  Bronze: { color: "#B87333", ring: "linear-gradient(135deg, #E3A774 0%, #B87333 50%, #7E4A1E 100%)" },
  Silver: { color: "#A8A9AD", ring: "linear-gradient(135deg, #F1F1F3 0%, #A8A9AD 50%, #6E6F73 100%)" },
  Gold: { color: "#D4AF37", ring: "linear-gradient(135deg, #F7E08A 0%, #D4AF37 50%, #9C7A12 100%)" },
};

export function getEraConfig(era?: EraName | string | null): EraConfig {
  return ERA_CONFIG[(era as EraName) ?? "Rising"] ?? ERA_CONFIG.Rising;
}

/** "Legendary Gold Creator" → { era: "Legendary", stage: "Gold" }. */
export function parseEraBadge(badge?: string | null): { era: EraName; stage: EraStage } {
  const text = badge || "";
  const era = ERA_ORDER.find((name) => text.startsWith(name)) ?? "Rising";
  const stage: EraStage = text.includes("Gold") ? "Gold" : text.includes("Silver") ? "Silver" : "Bronze";
  return { era, stage };
}

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

export function eraAlpha(hex: string, a: number) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Readable text colour for an era on a light tint (darkens light hues like Shining yellow). */
export function eraInk(hex: string) {
  const [r, g, b] = hexRgb(hex);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const k = lum > 0.55 ? 0.45 : lum > 0.4 ? 0.25 : 0;
  return `rgb(${Math.round(r * (1 - k))}, ${Math.round(g * (1 - k))}, ${Math.round(b * (1 - k))})`;
}

/** Soft era-colour gradient for badge / story backgrounds. */
export function eraSoftBg(cfg: EraConfig) {
  return `linear-gradient(135deg, ${eraAlpha(cfg.color, 0.08)} 0%, ${eraAlpha(cfg.accent ?? cfg.color, 0.2)} 100%)`;
}

/** Solid era fill for award medals (Legendary blends into gold). */
export function eraFill(cfg: EraConfig) {
  return cfg.accent
    ? `linear-gradient(135deg, ${cfg.color} 0%, ${cfg.color} 55%, ${cfg.accent} 100%)`
    : `linear-gradient(135deg, ${cfg.color} 0%, ${eraInk(cfg.color)} 100%)`;
}

/** Avatar ring in the era colour. */
export function eraRing(cfg: EraConfig) {
  return cfg.accent
    ? `linear-gradient(135deg, ${cfg.accent} 0%, ${cfg.color} 60%, ${cfg.color} 100%)`
    : `linear-gradient(135deg, ${eraAlpha(cfg.color, 0.55)} 0%, ${cfg.color} 60%, ${eraInk(cfg.color)} 100%)`;
}
