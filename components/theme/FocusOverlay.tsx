import React, { memo } from "react";
import { ThemeFocusOverlay } from "@/types";

interface FocusOverlayProps {
  overlay?: ThemeFocusOverlay;
  contained?: boolean;
}

export const FocusOverlay = memo(function FocusOverlay({
  overlay,
  contained = false,
}: FocusOverlayProps) {
  if (!overlay) return null;

  const { color = "#000000", centerOpacity = 0.04, edgeOpacity = 0.18 } = overlay;
  const midOpacity = Number(((centerOpacity + edgeOpacity) / 2).toFixed(3));
  const positionClass = contained ? "absolute inset-0" : "fixed inset-0";

  // Convert hex color to rgba string
  const getRgba = (opacity: number) => {
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16) || 0;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return `rgba(0, 0, 0, ${opacity})`;
  };

  return (
    <div
      className={`pointer-events-none ${positionClass} overflow-hidden z-[1] transition-opacity duration-300`}
      style={{
        background: `radial-gradient(circle at 50% 35%, ${getRgba(centerOpacity)} 0%, ${getRgba(midOpacity)} 55%, ${getRgba(edgeOpacity)} 100%)`,
      }}
      aria-hidden="true"
    />
  );
});
