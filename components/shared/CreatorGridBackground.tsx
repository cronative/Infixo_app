"use client";

import { type CSSProperties } from "react";
import {
  BarChart3,
  Camera,
  Captions,
  Clapperboard,
  ImageIcon,
  Mic2,
  Music2,
  PenLine,
  Scissors,
  Share2,
  Video,
  WandSparkles,
} from "lucide-react";
import { InflixoLogoIcon } from "@/components/shared/Logo";

const CREATOR_TOOLS = [
  { icon: Camera, label: "Camera", className: "left-[6%] top-[12%] rotate-[-6deg]", duration: "17s", delay: "-1s" },
  { icon: Video, label: "Video", className: "right-[7%] top-[14%] rotate-[5deg]", duration: "19s", delay: "-5s" },
  { icon: Clapperboard, label: "Shoot", className: "left-[16%] top-[26%] rotate-[4deg]", duration: "15s", delay: "-8s" },
  { icon: Scissors, label: "Edit", className: "right-[16%] top-[30%] rotate-[-5deg]", duration: "18s", delay: "-3s" },
  { icon: Captions, label: "Captions", className: "left-[8%] top-[52%] rotate-[5deg]", duration: "21s", delay: "-11s" },
  { icon: Mic2, label: "Voice", className: "right-[10%] top-[54%] rotate-[-4deg]", duration: "16s", delay: "-6s" },
  { icon: ImageIcon, label: "Thumbnail", className: "left-[18%] bottom-[18%] rotate-[-3deg]", duration: "20s", delay: "-13s" },
  { icon: Music2, label: "Audio", className: "right-[18%] bottom-[18%] rotate-[4deg]", duration: "14s", delay: "-4s" },
  { icon: PenLine, label: "Script", className: "left-[7%] bottom-[8%] rotate-[6deg]", duration: "22s", delay: "-9s" },
  { icon: Share2, label: "Share", className: "right-[7%] bottom-[9%] rotate-[-5deg]", duration: "18s", delay: "-12s" },
  { icon: BarChart3, label: "Stats", className: "left-[28%] top-[44%] rotate-[-5deg]", duration: "23s", delay: "-16s" },
  { icon: WandSparkles, label: "Polish", className: "right-[28%] top-[46%] rotate-[5deg]", duration: "16s", delay: "-7s" },
];

export function CreatorGridBackground({
  showWordmark = false,
  variant = "default",
  wordmarkPlacement = "bottom-left",
}: {
  showWordmark?: boolean;
  variant?: "default" | "soft";
  wordmarkPlacement?: "bottom-left" | "center" | "center-bottom";
}) {
  const isSoft = variant === "soft";
  const isCenteredWordmark = wordmarkPlacement === "center";
  const isCenterBottomWordmark = wordmarkPlacement === "center-bottom";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
      <div className="absolute inset-0 bg-[#f4f6f8]" />
      <div className={`absolute inset-0 bg-[linear-gradient(to_right,rgba(21,25,51,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(21,25,51,0.045)_1px,transparent_1px)] bg-[size:44px_44px] ${isSoft ? "opacity-70" : ""}`} />
      <div className={`absolute left-0 top-0 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(21,25,51,0.45),transparent)] [animation:infixo-scan-x_5s_ease-in-out_infinite] ${isSoft ? "opacity-25" : ""}`} />

      {showWordmark && (
        <div
          className={
            isCenteredWordmark
              ? "absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center"
              : isCenterBottomWordmark
                ? "absolute inset-x-0 bottom-[9%] flex items-center justify-center"
              : "absolute bottom-[10%] left-[-7%] flex items-center justify-start sm:bottom-[8%] md:left-[2%] lg:left-[5%]"
          }
        >
          <div className={`creator-tool-float flex items-center ${(isCenteredWordmark || isCenterBottomWordmark) ? "gap-3 sm:gap-5" : ""}`}>
            {(isCenteredWordmark || isCenterBottomWordmark) && (
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/70 bg-white/10 shadow-[0_10px_40px_rgba(21,25,51,0.05)] sm:h-16 sm:w-16 sm:rounded-[18px]">
                <InflixoLogoIcon
                  light
                  className="h-8 w-8 opacity-75 drop-shadow-[0_10px_24px_rgba(21,25,51,0.08)] sm:h-11 sm:w-11"
                />
              </div>
            )}
            <span
              className={`font-display text-[42px] font-black uppercase leading-none tracking-[0.12em] text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.95)] [text-shadow:0_10px_40px_rgba(21,25,51,0.08)] sm:text-[60px] md:text-[80px] lg:text-[100px] ${isSoft ? "opacity-45" : "opacity-75"
                } ${isCenteredWordmark ? "text-[44px] sm:text-[72px] md:text-[100px] lg:text-[128px]" : ""} ${isCenterBottomWordmark ? "text-[40px] sm:text-[64px] md:text-[84px] lg:text-[104px]" : ""}`}
            >
              INFLIXO
            </span>
          </div>
        </div>
      )}

      {CREATOR_TOOLS.map((tool) => (
        <div key={tool.label} className={`absolute hidden md:block ${tool.className}`}>
          <div
            className={`creator-tool-float flex h-12 w-12 items-center justify-center rounded-[10px] border backdrop-blur-md ${isSoft
              ? "border-[#151933]/5 bg-white/42 text-[#151933]/26 shadow-[0_14px_35px_rgba(21,25,51,0.035)] opacity-70"
              : "border-[#151933]/10 bg-white/65 text-[#151933]/45 shadow-[0_14px_35px_rgba(21,25,51,0.06)]"
              }`}
            style={{
              "--float-duration": tool.duration,
              "--float-delay": tool.delay,
            } as CSSProperties}
            aria-label={tool.label}
          >
            <tool.icon className="h-5 w-5" />
          </div>
        </div>
      ))}
    </div>
  );
}
