import React, { memo } from "react";
import { ThemeAnimationType } from "@/types";
import { AmbientParticles } from "./AmbientParticles";

interface AmbientAnimationProps {
  type?: ThemeAnimationType;
  colors?: string[];
  themeKey?: string;
  contained?: boolean;
}

// 24 deterministic glittering sparkles
const DETERMINISTIC_SPARKLES = [
  { id: 1, x: 12, y: 15, size: 18, colorIdx: 0, duration: 3.2, delay: 0, opacity: 0.85 },
  { id: 2, x: 85, y: 22, size: 22, colorIdx: 1, duration: 3.8, delay: 0.8, opacity: 0.9 },
  { id: 3, x: 25, y: 38, size: 14, colorIdx: 2, duration: 2.8, delay: 1.5, opacity: 0.75 },
  { id: 4, x: 75, y: 45, size: 16, colorIdx: 0, duration: 3.5, delay: 0.4, opacity: 0.8 },
  { id: 5, x: 8, y: 62, size: 20, colorIdx: 1, duration: 4.0, delay: 2.1, opacity: 0.85 },
  { id: 6, x: 92, y: 68, size: 15, colorIdx: 2, duration: 3.0, delay: 1.2, opacity: 0.75 },
  { id: 7, x: 35, y: 82, size: 18, colorIdx: 0, duration: 3.6, delay: 2.5, opacity: 0.8 },
  { id: 8, x: 80, y: 88, size: 22, colorIdx: 1, duration: 4.2, delay: 0.6, opacity: 0.9 },
  { id: 9, x: 50, y: 18, size: 12, colorIdx: 2, duration: 2.6, delay: 1.8, opacity: 0.7 },
  { id: 10, x: 68, y: 28, size: 16, colorIdx: 0, duration: 3.4, delay: 3.0, opacity: 0.8 },
  { id: 11, x: 18, y: 78, size: 14, colorIdx: 1, duration: 2.9, delay: 0.9, opacity: 0.75 },
  { id: 12, x: 62, y: 72, size: 20, colorIdx: 2, duration: 3.7, delay: 2.2, opacity: 0.85 },
  { id: 13, x: 40, y: 52, size: 12, colorIdx: 0, duration: 3.1, delay: 1.4, opacity: 0.7 },
  { id: 14, x: 88, y: 10, size: 16, colorIdx: 1, duration: 3.9, delay: 2.7, opacity: 0.8 },
  { id: 15, x: 5, y: 28, size: 15, colorIdx: 2, duration: 2.7, delay: 0.3, opacity: 0.75 },
  { id: 16, x: 95, y: 40, size: 18, colorIdx: 0, duration: 3.5, delay: 1.6, opacity: 0.85 },
  { id: 17, x: 28, y: 92, size: 14, colorIdx: 1, duration: 3.3, delay: 3.2, opacity: 0.75 },
  { id: 18, x: 72, y: 8, size: 20, colorIdx: 2, duration: 4.1, delay: 0.5, opacity: 0.9 },
  { id: 19, x: 15, y: 48, size: 13, colorIdx: 0, duration: 2.8, delay: 2.0, opacity: 0.7 },
  { id: 20, x: 82, y: 55, size: 17, colorIdx: 1, duration: 3.6, delay: 1.1, opacity: 0.8 },
  { id: 21, x: 45, y: 95, size: 15, colorIdx: 2, duration: 3.0, delay: 2.8, opacity: 0.75 },
  { id: 22, x: 55, y: 38, size: 12, colorIdx: 0, duration: 2.5, delay: 0.7, opacity: 0.7 },
  { id: 23, x: 3, y: 90, size: 16, colorIdx: 1, duration: 3.8, delay: 1.9, opacity: 0.8 },
  { id: 24, x: 90, y: 82, size: 14, colorIdx: 2, duration: 3.2, delay: 3.4, opacity: 0.75 },
];

// 8 deterministic round glowing orbs + pulse rings
const DETERMINISTIC_ROUND_ORBS = [
  { id: 1, x: 10, y: 15, size: 180, colorIdx: 0, duration: 14, delay: 0, driftX: 25, driftY: -30, opacity: 0.35 },
  { id: 2, x: 80, y: 25, size: 220, colorIdx: 1, duration: 18, delay: 2, driftX: -30, driftY: 25, opacity: 0.3 },
  { id: 3, x: 15, y: 65, size: 200, colorIdx: 2, duration: 16, delay: 4, driftX: 20, driftY: -20, opacity: 0.32 },
  { id: 4, x: 75, y: 70, size: 190, colorIdx: 0, duration: 20, delay: 1, driftX: -25, driftY: -25, opacity: 0.3 },
  { id: 5, x: 50, y: 40, size: 160, colorIdx: 1, duration: 15, delay: 3, driftX: 15, driftY: 20, opacity: 0.28 },
  { id: 6, x: 85, y: 8, size: 140, colorIdx: 2, duration: 17, delay: 5, driftX: -15, driftY: 20, opacity: 0.25 },
  { id: 7, x: 5, y: 45, size: 150, colorIdx: 0, duration: 19, delay: 2, driftX: 18, driftY: -15, opacity: 0.28 },
  { id: 8, x: 45, y: 85, size: 210, colorIdx: 1, duration: 16, delay: 6, driftX: -20, driftY: -20, opacity: 0.3 },
];

// 24 deterministic galaxy stardust points
const DETERMINISTIC_GALAXY_DUST = [
  { id: 1, radius: 90, size: 3, colorIdx: 0, duration: 22, delay: 0, opacity: 0.7 },
  { id: 2, radius: 140, size: 2.5, colorIdx: 1, duration: 28, delay: 3, opacity: 0.65 },
  { id: 3, radius: 190, size: 3.5, colorIdx: 2, duration: 34, delay: 6, opacity: 0.8 },
  { id: 4, radius: 240, size: 2, colorIdx: 0, duration: 40, delay: 2, opacity: 0.6 },
  { id: 5, radius: 110, size: 4, colorIdx: 1, duration: 25, delay: 8, opacity: 0.85 },
  { id: 6, radius: 160, size: 3, colorIdx: 2, duration: 31, delay: 5, opacity: 0.75 },
  { id: 7, radius: 210, size: 2.5, colorIdx: 0, duration: 37, delay: 1, opacity: 0.65 },
  { id: 8, radius: 270, size: 3, colorIdx: 1, duration: 45, delay: 9, opacity: 0.7 },
  { id: 9, radius: 75, size: 3.5, colorIdx: 2, duration: 20, delay: 4, opacity: 0.9 },
  { id: 10, radius: 125, size: 2.5, colorIdx: 0, duration: 27, delay: 7, opacity: 0.65 },
  { id: 11, radius: 175, size: 4, colorIdx: 1, duration: 33, delay: 11, opacity: 0.85 },
  { id: 12, radius: 225, size: 2, colorIdx: 2, duration: 39, delay: 3, opacity: 0.6 },
  { id: 13, radius: 300, size: 3, colorIdx: 0, duration: 48, delay: 12, opacity: 0.7 },
  { id: 14, radius: 95, size: 3, colorIdx: 1, duration: 23, delay: 6, opacity: 0.8 },
  { id: 15, radius: 150, size: 2.5, colorIdx: 2, duration: 30, delay: 10, opacity: 0.7 },
  { id: 16, radius: 200, size: 3.5, colorIdx: 0, duration: 36, delay: 14, opacity: 0.8 },
  { id: 17, radius: 250, size: 2, colorIdx: 1, duration: 42, delay: 8, opacity: 0.6 },
  { id: 18, radius: 85, size: 4, colorIdx: 2, duration: 21, delay: 2, opacity: 0.9 },
  { id: 19, radius: 135, size: 3, colorIdx: 0, duration: 29, delay: 7, opacity: 0.75 },
  { id: 20, radius: 185, size: 2.5, colorIdx: 1, duration: 35, delay: 13, opacity: 0.7 },
  { id: 21, radius: 235, size: 3.5, colorIdx: 2, duration: 41, delay: 4, opacity: 0.8 },
  { id: 22, radius: 280, size: 2, colorIdx: 0, duration: 46, delay: 15, opacity: 0.6 },
  { id: 23, radius: 105, size: 3, colorIdx: 1, duration: 26, delay: 9, opacity: 0.8 },
  { id: 24, radius: 165, size: 3.5, colorIdx: 2, duration: 32, delay: 1, opacity: 0.85 },
];

// 4 firework burst centers with 8 directional sparks each
const FIREWORK_BURSTS = [
  { id: 1, x: 22, y: 22, colorIdx: 0, duration: 2.4, delay: 0 },
  { id: 2, x: 78, y: 28, colorIdx: 1, duration: 2.6, delay: 0.7 },
  { id: 3, x: 35, y: 60, colorIdx: 2, duration: 2.5, delay: 1.4 },
  { id: 4, x: 82, y: 72, colorIdx: 0, duration: 2.7, delay: 2.1 },
];

const SPARK_DIRECTIONS = [
  { angle: 0, dx: 55, dy: 0 },
  { angle: 45, dx: 40, dy: -40 },
  { angle: 90, dx: 0, dy: -55 },
  { angle: 135, dx: -40, dy: -40 },
  { angle: 180, dx: -55, dy: 0 },
  { angle: 225, dx: -40, dy: 40 },
  { angle: 270, dx: 0, dy: 55 },
  { angle: 315, dx: 40, dy: 40 },
];

// 16 deterministic rising firework embers
const DETERMINISTIC_EMBERS = [
  { id: 1, x: 15, y: 90, size: 3.5, colorIdx: 0, duration: 12, delay: 0, driftX: 18, driftY: -140, opacity: 0.65 },
  { id: 2, x: 30, y: 85, size: 2.5, colorIdx: 1, duration: 15, delay: 2, driftX: -14, driftY: -130, opacity: 0.55 },
  { id: 3, x: 48, y: 95, size: 4, colorIdx: 2, duration: 11, delay: 4, driftX: 12, driftY: -160, opacity: 0.7 },
  { id: 4, x: 65, y: 88, size: 3, colorIdx: 0, duration: 16, delay: 1, driftX: -18, driftY: -125, opacity: 0.6 },
  { id: 5, x: 82, y: 92, size: 4.5, colorIdx: 1, duration: 13, delay: 3, driftX: 15, driftY: -150, opacity: 0.7 },
  { id: 6, x: 92, y: 86, size: 2.5, colorIdx: 2, duration: 14, delay: 5, driftX: -10, driftY: -135, opacity: 0.55 },
  { id: 7, x: 22, y: 55, size: 3, colorIdx: 0, duration: 13, delay: 2, driftX: 16, driftY: -120, opacity: 0.6 },
  { id: 8, x: 40, y: 65, size: 4, colorIdx: 1, duration: 12, delay: 4, driftX: -12, driftY: -145, opacity: 0.7 },
  { id: 9, x: 58, y: 50, size: 2.5, colorIdx: 2, duration: 16, delay: 6, driftX: 14, driftY: -130, opacity: 0.6 },
  { id: 10, x: 76, y: 58, size: 3.5, colorIdx: 0, duration: 12, delay: 1, driftX: -16, driftY: -150, opacity: 0.65 },
  { id: 11, x: 8, y: 70, size: 3, colorIdx: 1, duration: 17, delay: 3, driftX: 20, driftY: -140, opacity: 0.55 },
  { id: 12, x: 88, y: 45, size: 4, colorIdx: 2, duration: 11, delay: 5, driftX: -22, driftY: -135, opacity: 0.7 },
  { id: 13, x: 28, y: 35, size: 2.5, colorIdx: 0, duration: 14, delay: 2, driftX: 12, driftY: -120, opacity: 0.6 },
  { id: 14, x: 52, y: 25, size: 3.5, colorIdx: 1, duration: 13, delay: 4, driftX: -15, driftY: -130, opacity: 0.65 },
  { id: 15, x: 70, y: 30, size: 3, colorIdx: 2, duration: 15, delay: 1, driftX: 10, driftY: -125, opacity: 0.6 },
  { id: 16, x: 85, y: 20, size: 4, colorIdx: 0, duration: 11, delay: 6, driftX: -14, driftY: -140, opacity: 0.7 },
];

// 18 deterministic paper confetti pieces
const DETERMINISTIC_CONFETTI = [
  { id: 1, x: 10, y: 88, w: 7, h: 5, colorIdx: 0, duration: 18, delay: 0, driftX: 18, driftY: -130, opacity: 0.35, rot: 25 },
  { id: 2, x: 25, y: 75, w: 6, h: 8, colorIdx: 1, duration: 22, delay: 3, driftX: -14, driftY: -110, opacity: 0.3, rot: -40 },
  { id: 3, x: 42, y: 92, w: 8, h: 6, colorIdx: 2, duration: 16, delay: 6, driftX: 12, driftY: -150, opacity: 0.4, rot: 60 },
  { id: 4, x: 60, y: 68, w: 6, h: 6, colorIdx: 0, duration: 24, delay: 1, driftX: -18, driftY: -120, opacity: 0.3, rot: -15 },
  { id: 5, x: 75, y: 82, w: 9, h: 5, colorIdx: 1, duration: 19, delay: 4, driftX: 15, driftY: -140, opacity: 0.35, rot: 45 },
  { id: 6, x: 88, y: 95, w: 5, h: 7, colorIdx: 2, duration: 21, delay: 7, driftX: -10, driftY: -130, opacity: 0.3, rot: -30 },
  { id: 7, x: 15, y: 40, w: 7, h: 6, colorIdx: 0, duration: 20, delay: 2, driftX: 16, driftY: -115, opacity: 0.3, rot: 50 },
  { id: 8, x: 32, y: 48, w: 6, h: 8, colorIdx: 1, duration: 17, delay: 5, driftX: -12, driftY: -135, opacity: 0.35, rot: -20 },
  { id: 9, x: 52, y: 35, w: 8, h: 5, colorIdx: 2, duration: 23, delay: 8, driftX: 14, driftY: -125, opacity: 0.3, rot: 35 },
  { id: 10, x: 70, y: 42, w: 6, h: 6, colorIdx: 0, duration: 18, delay: 3, driftX: -16, driftY: -145, opacity: 0.3, rot: -45 },
  { id: 11, x: 85, y: 28, w: 7, h: 5, colorIdx: 1, duration: 22, delay: 5, driftX: 10, driftY: -120, opacity: 0.25, rot: 15 },
  { id: 12, x: 92, y: 65, w: 6, h: 7, colorIdx: 2, duration: 19, delay: 2, driftX: -15, driftY: -130, opacity: 0.35, rot: -60 },
  { id: 13, x: 5, y: 60, w: 8, h: 6, colorIdx: 0, duration: 25, delay: 4, driftX: 20, driftY: -150, opacity: 0.25, rot: 30 },
  { id: 14, x: 38, y: 20, w: 5, h: 8, colorIdx: 1, duration: 21, delay: 1, driftX: -10, driftY: -110, opacity: 0.3, rot: -10 },
  { id: 15, x: 65, y: 15, w: 7, h: 5, colorIdx: 2, duration: 24, delay: 6, driftX: 15, driftY: -135, opacity: 0.35, rot: 75 },
  { id: 16, x: 80, y: 10, w: 6, h: 6, colorIdx: 0, duration: 17, delay: 3, driftX: -12, driftY: -125, opacity: 0.3, rot: -25 },
  { id: 17, x: 48, y: 75, w: 8, h: 5, colorIdx: 1, duration: 20, delay: 7, driftX: 14, driftY: -140, opacity: 0.35, rot: 40 },
  { id: 18, x: 20, y: 18, w: 6, h: 7, colorIdx: 2, duration: 23, delay: 4, driftX: -18, driftY: -120, opacity: 0.25, rot: -55 },
];

// 8 deterministic soft studio shapes
const DETERMINISTIC_SHAPES = [
  { id: 1, x: 8, y: 15, w: 140, h: 140, rounded: "rounded-full", colorIdx: 0, duration: 16, delay: 0, driftX: 25, driftY: -35, opacity: 0.25 },
  { id: 2, x: 80, y: 25, w: 180, h: 110, rounded: "rounded-3xl", colorIdx: 1, duration: 20, delay: 2, driftX: -30, driftY: 20, opacity: 0.2 },
  { id: 3, x: 12, y: 65, w: 160, h: 100, rounded: "rounded-full", colorIdx: 2, duration: 18, delay: 4, driftX: 20, driftY: -25, opacity: 0.22 },
  { id: 4, x: 75, y: 70, w: 150, h: 150, rounded: "rounded-full", colorIdx: 0, duration: 22, delay: 1, driftX: -25, driftY: -30, opacity: 0.2 },
  { id: 5, x: 85, y: 8, w: 100, h: 100, rounded: "rounded-2xl", colorIdx: 1, duration: 19, delay: 3, driftX: -15, driftY: 25, opacity: 0.18 },
  { id: 6, x: 5, y: 45, w: 110, h: 110, rounded: "rounded-full", colorIdx: 2, duration: 21, delay: 5, driftX: 18, driftY: -20, opacity: 0.2 },
  { id: 7, x: 45, y: 5, w: 220, h: 120, rounded: "rounded-full", colorIdx: 0, duration: 24, delay: 2, driftX: 15, driftY: 20, opacity: 0.15 },
  { id: 8, x: 48, y: 85, w: 170, h: 130, rounded: "rounded-3xl", colorIdx: 1, duration: 17, delay: 6, driftX: -20, driftY: -15, opacity: 0.18 },
];

export const AmbientAnimation = memo(function AmbientAnimation({
  type = "floating-particles",
  colors = ["#151933", "#C084FC", "#60A5FA"],
  themeKey,
  contained = false,
}: AmbientAnimationProps) {
  if (type === "none") {
    return null;
  }

  const containerPosition = contained ? "absolute inset-0" : "fixed inset-0";

  // 1. Sparkles / Twinkling Stars Animation
  if (type === "sparkles") {
    return (
      <div className={`pointer-events-none ${containerPosition} overflow-hidden z-0`} aria-hidden="true">
        {DETERMINISTIC_SPARKLES.map((s) => {
          const color = colors[s.colorIdx % colors.length];
          return (
            <div
              key={s.id}
              className="sparkle-item absolute flex items-center justify-center pointer-events-none"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                ["--p-duration" as any]: `${s.duration}s`,
                ["--p-delay" as any]: `${s.delay}s`,
                ["--p-opacity" as any]: s.opacity,
              }}
            >
              {/* 4-point Diamond Star Sparkle SVG */}
              <svg viewBox="0 0 24 24" fill={color} className="w-full h-full drop-shadow-[0_0_8px_currentColor]">
                <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
              </svg>
            </div>
          );
        })}
      </div>
    );
  }

  // 2. Round Orbs / Pulsing Concentric Rings
  if (type === "round-orbs") {
    return (
      <div className={`pointer-events-none ${containerPosition} overflow-hidden z-0`} aria-hidden="true">
        {DETERMINISTIC_ROUND_ORBS.map((o) => {
          const color = colors[o.colorIdx % colors.length];
          return (
            <div
              key={o.id}
              className="round-orb-item absolute rounded-full pointer-events-none"
              style={{
                left: `${o.x}%`,
                top: `${o.y}%`,
                width: `${o.size}px`,
                height: `${o.size}px`,
                background: `radial-gradient(circle, ${color} 0%, ${color}44 45%, transparent 70%)`,
                filter: "blur(20px)",
                ["--drift-x" as any]: `${o.driftX}px`,
                ["--drift-y" as any]: `${o.driftY}px`,
                ["--p-duration" as any]: `${o.duration}s`,
                ["--p-delay" as any]: `${o.delay}s`,
                ["--p-opacity" as any]: o.opacity,
              }}
            />
          );
        })}
        {/* Pulsing Concentric Expanding Rings */}
        <div
          className="round-orb-ring absolute top-[25%] left-[20%] w-[160px] h-[160px] rounded-full border border-teal-400/30 pointer-events-none"
          style={{ ["--p-duration" as any]: "7s", ["--p-delay" as any]: "0s" }}
        />
        <div
          className="round-orb-ring absolute top-[60%] right-[18%] w-[200px] h-[200px] rounded-full border border-cyan-400/30 pointer-events-none"
          style={{ ["--p-duration" as any]: "9s", ["--p-delay" as any]: "2.5s" }}
        />
      </div>
    );
  }

  // 3. Galaxy Cosmic Swirl & Nebula Dust
  if (type === "galaxy") {
    return (
      <div className={`pointer-events-none ${containerPosition} overflow-hidden z-0`} aria-hidden="true">
        {/* Central Rotating Cosmic Nebula Core */}
        <div className="galaxy-core absolute top-[35%] left-1/2 w-[650px] h-[650px] sm:w-[900px] sm:h-[900px] rounded-full pointer-events-none opacity-40 blur-[80px]">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${colors[0] || "#A855F7"} 0%, ${colors[1] || "#6366F1"} 35%, ${colors[2] || "#EC4899"} 70%, ${colors[0] || "#A855F7"} 100%)`,
            }}
          />
        </div>
        {/* Orbiting Stardust Particles */}
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none">
          {DETERMINISTIC_GALAXY_DUST.map((d) => {
            const color = colors[d.colorIdx % colors.length];
            return (
              <span
                key={d.id}
                className="galaxy-dust-item absolute rounded-full pointer-events-none"
                style={{
                  width: `${d.size}px`,
                  height: `${d.size}px`,
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}`,
                  ["--dust-r" as any]: `${d.radius}px`,
                  ["--p-duration" as any]: `${d.duration}s`,
                  ["--p-delay" as any]: `${d.delay}s`,
                  ["--p-opacity" as any]: d.opacity,
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // 4. Firecrackers & Celebratory Fireworks Bursts
  if (type === "firecrackers") {
    return (
      <div className={`pointer-events-none ${containerPosition} overflow-hidden z-0`} aria-hidden="true">
        {/* Burst Centers */}
        {FIREWORK_BURSTS.map((b) => {
          const burstColor = colors[b.colorIdx % colors.length];
          return (
            <div
              key={b.id}
              className="absolute pointer-events-none"
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
            >
              {SPARK_DIRECTIONS.map((dir, i) => (
                <span
                  key={i}
                  className="firework-spark-item absolute rounded-full"
                  style={{
                    width: "4px",
                    height: "4px",
                    backgroundColor: burstColor,
                    boxShadow: `0 0 10px ${burstColor}`,
                    ["--spark-x" as any]: `${dir.dx}px`,
                    ["--spark-y" as any]: `${dir.dy}px`,
                    ["--p-duration" as any]: `${b.duration}s`,
                    ["--p-delay" as any]: `${b.delay}s`,
                    ["--p-opacity" as any]: 0.9,
                  }}
                />
              ))}
            </div>
          );
        })}
        {/* Rising Glowing Celebratory Embers */}
        {DETERMINISTIC_EMBERS.map((e) => {
          const color = colors[e.colorIdx % colors.length];
          return (
            <span
              key={e.id}
              className="firework-ember-item absolute rounded-full"
              style={{
                left: `${e.x}%`,
                top: `${e.y}%`,
                width: `${e.size}px`,
                height: `${e.size}px`,
                backgroundColor: color,
                boxShadow: `0 0 ${e.size * 2}px ${color}`,
                ["--drift-x" as any]: `${e.driftX}px`,
                ["--drift-y" as any]: `${e.driftY}px`,
                ["--p-duration" as any]: `${e.duration}s`,
                ["--p-delay" as any]: `${e.delay}s`,
                ["--p-opacity" as any]: e.opacity,
              }}
            />
          );
        })}
      </div>
    );
  }

  // 5. Neon Grid Animation Layer
  if (type === "neon-grid") {
    return (
      <div className={`pointer-events-none ${containerPosition} overflow-hidden z-0`} aria-hidden="true">
        {/* Soft overhead cyan ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#06B6D4]/10 blur-[100px] rounded-full pointer-events-none" />
        {/* Moving perspective grid on bottom viewport */}
        <div className="absolute -bottom-24 inset-x-0 h-[65vh] overflow-hidden pointer-events-none opacity-45">
          <div className="ambient-neon-grid absolute inset-x-[-50%] top-0 bottom-[-50%] origin-bottom" />
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-[#050814]/70 to-[#050814] pointer-events-none" />
        </div>
      </div>
    );
  }

  // 6. Liquid Aurora Animation Layer
  if (type === "liquid-aurora") {
    return (
      <div className={`pointer-events-none ${containerPosition} overflow-hidden z-0`} aria-hidden="true">
        {/* Aurora Glowing Wave 1 */}
        <div className="aurora-ribbon-1 absolute -top-32 -left-20 w-[600px] h-[500px] sm:w-[800px] sm:h-[600px] bg-gradient-to-tr from-teal-500/25 via-cyan-400/20 to-indigo-500/15 rounded-full blur-[90px]" />
        {/* Aurora Glowing Wave 2 */}
        <div className="aurora-ribbon-2 absolute top-1/3 -right-24 w-[550px] h-[550px] sm:w-[750px] sm:h-[700px] bg-gradient-to-bl from-indigo-500/20 via-teal-400/18 to-emerald-400/15 rounded-full blur-[100px]" />
      </div>
    );
  }

  // 7. Spotlight Stage Animation Layer
  if (type === "spotlight-stage") {
    return (
      <div className={`pointer-events-none ${containerPosition} overflow-hidden z-0`} aria-hidden="true">
        {/* Sweeping Soft Spotlight behind the Creator Header */}
        <div className="ambient-spotlight absolute top-0 left-1/2 w-[550px] h-[550px] sm:w-[750px] sm:h-[650px] rounded-full bg-gradient-radial from-amber-400/20 via-rose-400/10 to-transparent blur-[85px]" />
      </div>
    );
  }

  // 8. Floating Studio Abstract Shapes
  if (type === "floating-shapes") {
    return (
      <div className={`pointer-events-none ${containerPosition} overflow-hidden z-0`} aria-hidden="true">
        {DETERMINISTIC_SHAPES.map((s) => {
          const color = colors[s.colorIdx % colors.length];
          return (
            <div
              key={s.id}
              className={`floating-shape-item absolute ${s.rounded} blur-[35px] pointer-events-none`}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.w}px`,
                height: `${s.h}px`,
                backgroundColor: color,
                ["--drift-x" as any]: `${s.driftX}px`,
                ["--drift-y" as any]: `${s.driftY}px`,
                ["--p-duration" as any]: `${s.duration}s`,
                ["--p-delay" as any]: `${s.delay}s`,
                ["--p-opacity" as any]: s.opacity,
              }}
            />
          );
        })}
      </div>
    );
  }

  // 9. Paper Confetti Animation Layer
  if (type === "paper-confetti") {
    return (
      <div className={`pointer-events-none ${containerPosition} overflow-hidden z-0`} aria-hidden="true">
        {DETERMINISTIC_CONFETTI.map((c) => {
          const color = colors[c.colorIdx % colors.length];
          return (
            <span
              key={c.id}
              className="paper-confetti-item absolute rounded-xs"
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: `${c.w}px`,
                height: `${c.h}px`,
                backgroundColor: color,
                transform: `rotate(${c.rot}deg)`,
                ["--drift-x" as any]: `${c.driftX}px`,
                ["--drift-y" as any]: `${c.driftY}px`,
                ["--p-duration" as any]: `${c.duration}s`,
                ["--p-delay" as any]: `${c.delay}s`,
                ["--p-opacity" as any]: c.opacity,
              }}
            />
          );
        })}
      </div>
    );
  }

  // 10. Floating Particles (Default)
  return <AmbientParticles particleColors={colors} themeKey={themeKey} contained={contained} />;
});
