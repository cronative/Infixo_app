"use client";

import type { CSSProperties, ReactNode } from "react";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { getPublicTheme, PUBLIC_MAIN_CLASS, PUBLIC_RADIUS } from "@/components/public/publicTheme";

interface CreatorPublicShellProps {
  themeKey: string;
  children: ReactNode;
  /** Extra classes for <main> (e.g. print overrides on the media kit). */
  mainClassName?: string;
  /** Extra props for the outer wrapper (e.g. data-media-kit-print). */
  wrapperProps?: Record<string, unknown>;
  /** Rendered outside <main> (modals, <style> tags). */
  outside?: ReactNode;
}

/**
 * One layout for every public creator page:
 *   theme background  →  centered 600px card  →  page content
 */
export function CreatorPublicShell({
  themeKey,
  children,
  mainClassName = "",
  wrapperProps,
  outside,
}: CreatorPublicShellProps) {
  const t = getPublicTheme(themeKey);
  const { meta } = t;

  return (
    <div
      {...wrapperProps}
      style={{ backgroundColor: meta.colors.pageBackground }}
      className="relative min-h-dvh flex flex-col antialiased transition-colors duration-500"
    >
      {/* 1. Full-screen theme background (photo themes get a soft blurred backdrop) */}
      <div
        className={`fixed inset-0 pointer-events-none transition-colors duration-500 z-0 ${t.pageBgClass} ${t.hasPhotoBackdrop ? "theme-photo-backdrop" : ""}`}
        style={{ backgroundColor: meta.colors.pageBackground }}
        aria-hidden="true"
      >
        {!t.hasPhotoBackdrop && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[650px] bg-gradient-radial from-white/[0.06] to-transparent blur-3xl pointer-events-none" />
        )}
      </div>

      {/* 2. Ambient animation for animated themes */}
      {meta.animation?.type !== "none" && (
        <AmbientAnimation
          type={meta.animation?.type || meta.animationType}
          colors={meta.animation?.colors || meta.particleColors}
          themeKey={meta.key}
        />
      )}

      {/* 3. Focus overlay (skipped on photo themes; the backdrop has its own tint) */}
      {!t.hasPhotoBackdrop && <FocusOverlay overlay={meta.focusOverlay} />}

      {/* 4. Centered card column */}
      <main className={`${PUBLIC_MAIN_CLASS} ${mainClassName}`}>{children}</main>

      {outside}
    </div>
  );
}

interface PublicCardProps {
  themeKey: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** The centered main card surface, identical on every public page. */
export function PublicCard({ themeKey, children, className = "", style }: PublicCardProps) {
  const t = getPublicTheme(themeKey);
  return (
    <div
      style={{ ...t.surfaceStyle, ...style }}
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden border backdrop-blur-xl transition-all ${PUBLIC_RADIUS.card} ${className}`}
    >
      {children}
    </div>
  );
}
