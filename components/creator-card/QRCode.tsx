"use client";

import { useMemo } from "react";
import { encode } from "uqr";

interface QRCodeProps {
  value: string;
  /** Target rendered size in CSS px. Snapped down so every module is a whole pixel. */
  size: number;
  /** Quiet zone in modules. The QR spec requires at least 4. */
  quietZone?: number;
  className?: string;
}

/**
 * Locally-rendered, vector QR code. Always dark-on-white regardless of theme so
 * it stays scannable on screen, in exports and in print.
 */
export function QRCode({ value, size, quietZone = 4, className }: QRCodeProps) {
  const { path, modules } = useMemo(() => {
    const qr = encode(value, { ecc: "M", border: 0 });
    let d = "";
    qr.data.forEach((row, y) => {
      row.forEach((dark, x) => {
        if (dark) d += `M${x + quietZone} ${y + quietZone}h1v1h-1z`;
      });
    });
    return { path: d, modules: qr.size + quietZone * 2 };
  }, [value, quietZone]);

  const pixelSize = Math.max(modules, Math.floor(size / modules) * modules);

  return (
    <svg
      role="img"
      aria-label={`QR code for ${value}`}
      width={pixelSize}
      height={pixelSize}
      viewBox={`0 0 ${modules} ${modules}`}
      shapeRendering="crispEdges"
      className={className}
      style={{ display: "block" }}
    >
      <rect width={modules} height={modules} fill="#FFFFFF" />
      <path d={path} fill="#0B1220" />
    </svg>
  );
}
