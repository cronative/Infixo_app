import React, { memo } from "react";

interface AmbientParticlesProps {
  particleColors?: string[];
  themeKey?: string;
  contained?: boolean;
}

// 24 deterministic particle positions, sizes, drifts, and delays to guarantee 0 hydration mismatch
const DETERMINISTIC_PARTICLES = [
  { id: 1, x: 12, y: 85, size: 3.5, colorIdx: 0, duration: 18, delay: 0, driftX: 18, driftY: -130, opacity: 0.55, desktopOnly: false },
  { id: 2, x: 28, y: 70, size: 2.5, colorIdx: 1, duration: 22, delay: 3, driftX: -14, driftY: -110, opacity: 0.45, desktopOnly: false },
  { id: 3, x: 45, y: 92, size: 4, colorIdx: 2, duration: 16, delay: 6, driftX: 12, driftY: -150, opacity: 0.6, desktopOnly: false },
  { id: 4, x: 62, y: 65, size: 3, colorIdx: 0, duration: 24, delay: 1, driftX: -18, driftY: -120, opacity: 0.45, desktopOnly: false },
  { id: 5, x: 78, y: 80, size: 4.5, colorIdx: 1, duration: 19, delay: 4, driftX: 15, driftY: -140, opacity: 0.55, desktopOnly: false },
  { id: 6, x: 88, y: 95, size: 2.5, colorIdx: 2, duration: 21, delay: 7, driftX: -10, driftY: -130, opacity: 0.5, desktopOnly: false },
  { id: 7, x: 18, y: 40, size: 3, colorIdx: 0, duration: 20, delay: 2, driftX: 16, driftY: -115, opacity: 0.45, desktopOnly: false },
  { id: 8, x: 35, y: 50, size: 4, colorIdx: 1, duration: 17, delay: 5, driftX: -12, driftY: -135, opacity: 0.55, desktopOnly: false },
  { id: 9, x: 55, y: 35, size: 2.5, colorIdx: 2, duration: 23, delay: 8, driftX: 14, driftY: -125, opacity: 0.5, desktopOnly: false },
  { id: 10, x: 72, y: 45, size: 3.5, colorIdx: 0, duration: 18, delay: 3, driftX: -16, driftY: -145, opacity: 0.45, desktopOnly: false },
  // Desktop-specific particles for wider screen ambient depth
  { id: 11, x: 5, y: 90, size: 3, colorIdx: 1, duration: 25, delay: 2, driftX: 20, driftY: -160, opacity: 0.4, desktopOnly: true },
  { id: 12, x: 94, y: 75, size: 4, colorIdx: 2, duration: 17, delay: 6, driftX: -22, driftY: -140, opacity: 0.5, desktopOnly: true },
  { id: 13, x: 8, y: 30, size: 2.5, colorIdx: 0, duration: 21, delay: 4, driftX: 12, driftY: -120, opacity: 0.35, desktopOnly: true },
  { id: 14, x: 92, y: 25, size: 3.5, colorIdx: 1, duration: 19, delay: 1, driftX: -15, driftY: -130, opacity: 0.45, desktopOnly: true },
  { id: 15, x: 22, y: 15, size: 3, colorIdx: 2, duration: 23, delay: 5, driftX: 10, driftY: -110, opacity: 0.4, desktopOnly: true },
  { id: 16, x: 42, y: 20, size: 4.5, colorIdx: 0, duration: 16, delay: 7, driftX: -14, driftY: -150, opacity: 0.5, desktopOnly: true },
  { id: 17, x: 65, y: 18, size: 2.5, colorIdx: 1, duration: 24, delay: 3, driftX: 18, driftY: -125, opacity: 0.4, desktopOnly: true },
  { id: 18, x: 82, y: 12, size: 3.5, colorIdx: 2, duration: 20, delay: 8, driftX: -12, driftY: -135, opacity: 0.45, desktopOnly: true },
  { id: 19, x: 50, y: 75, size: 3, colorIdx: 0, duration: 22, delay: 4, driftX: 15, driftY: -140, opacity: 0.35, desktopOnly: true },
  { id: 20, x: 15, y: 60, size: 4, colorIdx: 1, duration: 18, delay: 2, driftX: -18, driftY: -130, opacity: 0.45, desktopOnly: true },
  { id: 21, x: 85, y: 55, size: 3, colorIdx: 2, duration: 21, delay: 6, driftX: 16, driftY: -120, opacity: 0.4, desktopOnly: true },
  { id: 22, x: 38, y: 88, size: 2.5, colorIdx: 0, duration: 25, delay: 1, driftX: -10, driftY: -145, opacity: 0.35, desktopOnly: true },
  { id: 23, x: 3, y: 55, size: 3.5, colorIdx: 1, duration: 20, delay: 5, driftX: 14, driftY: -135, opacity: 0.4, desktopOnly: true },
  { id: 24, x: 96, y: 45, size: 3, colorIdx: 2, duration: 22, delay: 3, driftX: -15, driftY: -125, opacity: 0.45, desktopOnly: true },
];

export const AmbientParticles = memo(function AmbientParticles({
  particleColors = ["#151933", "#C084FC", "#60A5FA"],
  themeKey,
  contained = false,
}: AmbientParticlesProps) {
  const isMinimalSpark = themeKey === "minimal-spark";
  const containerClass = contained ? "absolute inset-0" : "fixed inset-0";

  return (
    <div
      className={`pointer-events-none ${containerClass} overflow-hidden z-0`}
      aria-hidden="true"
    >
      {DETERMINISTIC_PARTICLES.map((p) => {
        const color = particleColors[p.colorIdx % particleColors.length];
        const baseOpacity = isMinimalSpark ? p.opacity * 0.5 : p.opacity;

        return (
          <span
            key={p.id}
            className={`floating-particle absolute rounded-full ${p.desktopOnly ? "hidden sm:block" : ""}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: color,
              boxShadow: `0 0 ${p.size * 2.5}px ${color}`,
              ["--drift-x" as any]: `${p.driftX}px`,
              ["--drift-y" as any]: `${p.driftY}px`,
              ["--p-duration" as any]: `${p.duration}s`,
              ["--p-delay" as any]: `${p.delay}s`,
              ["--p-opacity" as any]: baseOpacity,
            }}
          />
        );
      })}
    </div>
  );
});
