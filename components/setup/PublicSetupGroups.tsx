"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, Camera, Mic, Sun, Laptop, Sparkles, Layers } from "lucide-react";
import { CreatorSetupItem } from "@/types";
import { trackPublicEvent } from "@/lib/publicTrack";

export type SetupStage = "Shoot" | "Sound" | "Light" | "Edit" | "Ideas & AI" | "Other";

export interface StageDefinition {
  id: SetupStage;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

export const STAGES: StageDefinition[] = [
  { id: "Shoot", label: "Shoot", icon: Camera },
  { id: "Sound", label: "Sound", icon: Mic },
  { id: "Light", label: "Light", icon: Sun },
  { id: "Edit", label: "Edit", icon: Laptop },
  { id: "Ideas & AI", label: "Ideas & AI", icon: Sparkles },
  { id: "Other", label: "Other", icon: Layers },
];

export function getStageForCategory(category?: string): SetupStage {
  const c = (category || "").toLowerCase();
  if (
    c.includes("camera") ||
    c.includes("phone") ||
    c.includes("lens") ||
    c.includes("gimbal") ||
    c.includes("stabilizer") ||
    c.includes("tripod") ||
    c.includes("stand") ||
    c.includes("drone")
  ) {
    return "Shoot";
  }
  if (c.includes("mic") || c.includes("sound") || c.includes("audio")) {
    return "Sound";
  }
  if (c.includes("light")) {
    return "Light";
  }
  if (c.includes("editing") || c.includes("design")) {
    return "Edit";
  }
  if (c.includes("ai") || c.includes("analytic") || c.includes("schedul") || c.includes("idea")) {
    return "Ideas & AI";
  }
  return "Other";
}

export interface PublicSetupCardProps {
  item: CreatorSetupItem;
  primaryTextColor?: string;
  secondaryTextColor?: string;
  mutedTextColor?: string;
  accentColor?: string;
  borderColor?: string;
  cardBgColor?: string;
  isInformational?: boolean;
}

export function PublicSetupCard({
  item,
  primaryTextColor,
  secondaryTextColor,
  mutedTextColor,
  accentColor = "#7A2253",
  borderColor,
  cardBgColor,
  isInformational = false,
}: PublicSetupCardProps) {
  const stage = getStageForCategory(item.category);
  const stageDef = STAGES.find((s) => s.id === stage) || STAGES[5];
  const IconComponent = stageDef.icon;
  const whyLoveIt = (item.whyLoveIt || item.note || item.usedFor || "").trim();
  const usingSince = (item.usingSince || item.modelOrPlan || "").trim();

  return (
    <div
      style={{
        backgroundColor: cardBgColor || "var(--surface)",
        borderColor: borderColor || "var(--surface-border)",
      }}
      className="rounded-[5px] border p-3 sm:p-3.5 flex flex-col justify-between text-left transition-colors hover:border-(--surface-border)/80 shadow-none w-full"
    >
      <div>
        <div className="flex items-start gap-3">
          {/* Photo on left: 72x72px square with light bg and object-contain */}
          <div
            style={{
              borderColor: borderColor || "var(--surface-border)",
              backgroundColor: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
            }}
            className="relative h-18 w-18 shrink-0 rounded-[5px] border overflow-hidden flex items-center justify-center p-1"
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="72px"
                className="object-contain p-1"
              />
            ) : (
              <IconComponent
                className="h-7 w-7 text-(--accent-text)"
                style={{ color: accentColor }}
              />
            )}
          </div>

          {/* Details on right: Brand/using since, Name, Why I love it */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.brand && (
                <span
                  style={{ color: mutedTextColor || "var(--text-muted)" }}
                  className="text-[10.5px] font-bold uppercase tracking-wider truncate"
                >
                  {item.brand}
                </span>
              )}
              {usingSince && (
                <span
                  style={{ color: mutedTextColor || "var(--text-muted)" }}
                  className="text-[10.5px] font-medium opacity-80"
                >
                  {item.brand ? "·" : ""} Using since {usingSince}
                </span>
              )}
            </div>

            <h4
              style={{ color: primaryTextColor || "var(--text)" }}
              className="text-sm font-bold tracking-tight leading-snug line-clamp-2"
              title={item.name}
            >
              {item.name}
            </h4>

            {whyLoveIt && (
              <p
                style={{ color: secondaryTextColor || "var(--text-muted)" }}
                className="text-xs leading-relaxed line-clamp-2 italic pt-0.5"
              >
                &ldquo;{whyLoveIt}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Budget Alternative Muted Callout Box */}
        {item.budgetAlt?.trim() && (
          <div
            style={{
              backgroundColor: "color-mix(in srgb, var(--accent) 4%, var(--surface))",
              borderColor: borderColor || "var(--surface-border)",
            }}
            className="mt-2.5 rounded-[4px] border px-2.5 py-1.5 text-[11px] leading-snug"
          >
            <span
              style={{ color: accentColor }}
              className="font-bold text-(--accent-text)"
            >
              Starting out? Try this instead:{" "}
            </span>
            <span style={{ color: secondaryTextColor || "var(--text-muted)" }}>
              {item.budgetAlt.trim()}
            </span>
          </div>
        )}
      </div>

      {/* Footer Row: Affiliate tag + View Product */}
      <div
        style={{ borderColor: borderColor || "var(--surface-border)" }}
        className="mt-3 pt-2 border-t flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-1.5">
          {item.isAffiliate ? (
            <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 px-1.5 py-0.5 rounded-[3px] border border-amber-200/60">
              Affiliate
            </span>
          ) : (
            <span
              style={{ color: mutedTextColor || "var(--text-muted)" }}
              className="text-[11px] font-medium opacity-70"
            >
              {item.category}
            </span>
          )}
        </div>

        {item.linkUrl ? (
          <a
            href={item.linkUrl}
            target="_blank"
            rel={item.isAffiliate ? "sponsored noopener" : "noopener noreferrer"}
            onClick={(e) => {
              if (isInformational) {
                e.preventDefault();
              } else {
                trackPublicEvent("setup_click", String(item.id));
              }
            }}
            style={{ color: accentColor }}
            className="inline-flex items-center gap-1 text-xs font-bold hover:underline cursor-pointer transition-colors"
          >
            <span>View product</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        ) : (
          <span
            style={{ color: mutedTextColor || "var(--text-muted)" }}
            className="text-xs font-medium opacity-60"
          >
            No link
          </span>
        )}
      </div>
    </div>
  );
}

export interface PublicSetupGroupsProps {
  items: CreatorSetupItem[];
  variant?: "profile" | "standalone";
  whereIStarted?: string | null;
  primaryTextColor?: string;
  secondaryTextColor?: string;
  mutedTextColor?: string;
  accentColor?: string;
  borderColor?: string;
  cardBgColor?: string;
  isInformational?: boolean;
}

export function PublicSetupGroups({
  items,
  variant = "profile",
  whereIStarted,
  primaryTextColor,
  secondaryTextColor,
  mutedTextColor,
  accentColor = "#7A2253",
  borderColor,
  cardBgColor,
  isInformational = false,
}: PublicSetupGroupsProps) {
  const activeItems = (items || []).filter((it) => it.isActive !== false && it.name?.trim());

  if (activeItems.length === 0) return null;

  // Group by stage in the required order: Shoot -> Sound -> Light -> Edit -> Ideas & AI -> Other
  const stageGroups: Array<{ stage: StageDefinition; items: CreatorSetupItem[] }> = [];

  for (const def of STAGES) {
    const stageItems = activeItems.filter((it) => getStageForCategory(it.category) === def.id);
    if (stageItems.length > 0) {
      stageGroups.push({ stage: def, items: stageItems });
    }
  }

  return (
    <div className="space-y-6 w-full text-left">
      {/* Optional "Where I started" quote card */}
      {whereIStarted?.trim() && (
        <div
          style={{
            backgroundColor: "color-mix(in srgb, var(--accent) 5%, var(--surface))",
            borderColor: borderColor || "var(--surface-border)",
          }}
          className="rounded-[5px] border p-3.5 sm:p-4 text-left"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              style={{ color: accentColor }}
              className="text-[11px] font-bold uppercase tracking-[0.12em]"
            >
              Where I started
            </span>
          </div>
          <p
            style={{ color: primaryTextColor || "var(--text)" }}
            className="text-xs sm:text-sm font-medium leading-relaxed italic"
          >
            &ldquo;{whereIStarted.trim()}&rdquo;
          </p>
        </div>
      )}

      {/* Stage groups */}
      {stageGroups.map(({ stage, items: stageItems }) => {
        const Icon = stage.icon;

        return (
          <div key={stage.id} className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2">
                <Icon
                  className="h-4 w-4"
                  style={{ color: accentColor }}
                />
                <h3
                  style={{ color: primaryTextColor || "var(--text)" }}
                  className="text-sm font-bold uppercase tracking-[0.08em]"
                >
                  {stage.label}
                </h3>
              </div>
              <span
                style={{
                  color: mutedTextColor || "var(--text-muted)",
                  borderColor: borderColor || "var(--surface-border)",
                }}
                className="text-[10.5px] font-bold px-2 py-0.5 rounded-[4px] border"
              >
                {stageItems.length} {stageItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {stageItems.map((item) => (
                <PublicSetupCard
                  key={item.id}
                  item={item}
                  primaryTextColor={primaryTextColor}
                  secondaryTextColor={secondaryTextColor}
                  mutedTextColor={mutedTextColor}
                  accentColor={accentColor}
                  borderColor={borderColor}
                  cardBgColor={cardBgColor}
                  isInformational={isInformational}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

