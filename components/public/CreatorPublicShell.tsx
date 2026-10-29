"use client";

import type { CSSProperties, ReactNode } from "react";
import { AmbientAnimation } from "@/components/theme/AmbientAnimation";
import { FocusOverlay } from "@/components/theme/FocusOverlay";
import { getPublicTheme, PUBLIC_MAIN_CLASS, PUBLIC_RADIUS } from "@/components/public/publicTheme";
import { MadeWithInflixo } from "@/components/shared/MadeWithInflixo";
import { getThemeDefinition, themeTokenStyle } from "@/themes/config";
import { ThemeBackgroundAnim } from "@/components/theme/ThemeBackgroundAnim";

interface CreatorPublicShellProps {
  themeKey: string;
  children: ReactNode;
  /** Extra classes for <main> (e.g. print overrides on the media kit). */
  mainClassName?: string;
  /** Extra props for the outer wrapper (e.g. data-media-kit-print). */
  wrapperProps?: Record<string, unknown>;
  /** Rendered outside <main> (modals, <style> tags). */
  outside?: ReactNode;
  /** Optional flag to suppress footer branding if needed */
  hideFooter?: boolean;
  /** Lock viewport to screen height with internal scrolling */
  fixedViewport?: boolean;
}

/**
 * One layout for every public creator page:
 *   theme background  →  centered 600px card (full-height with 20px top/bottom padding)  →  page content
 */
export function CreatorPublicShell({
  themeKey,
  children,
  mainClassName = "",
  wrapperProps,
  outside,
  hideFooter = false,
  fixedViewport = true,
}: CreatorPublicShellProps) {
  const t = getPublicTheme(themeKey);
  const { meta } = t;

  return (
    <div
      {...wrapperProps}
      style={{ ...themeTokenStyle(meta.key), background: "var(--page-bg)", ...((wrapperProps as any)?.style || {}) }}
      className="relative h-screen h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between antialiased transition-colors duration-500"
    >
      {/* 1. Full-screen theme background (photo themes get a soft blurred backdrop) */}
      <div
        className={`fixed inset-0 pointer-events-none transition-colors duration-500 z-0 ${t.pageBgClass} ${t.hasPhotoBackdrop ? "theme-photo-backdrop" : ""}`}
        style={{ background: "var(--page-bg)" }}
        aria-hidden="true"
      >
        {/* Optional tint over image backgrounds */}
        <div className="absolute inset-0" style={{ background: "var(--page-overlay)" }} />
        {/* Theme background animation (--page-anim); the card above stays solid */}
        <ThemeBackgroundAnim name={getThemeDefinition(meta.key).tokens["--page-anim"]} />
        {!t.hasPhotoBackdrop && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[650px] bg-gradient-radial from-(--card-bg)/[0.06] to-transparent blur-3xl pointer-events-none" />
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

      {/* 4. Centered card column with 20px top & bottom padding */}
      <main
        className={`relative z-10 flex-1 flex flex-col mx-auto w-full max-w-[620px] px-2.5 sm:px-3 py-[20px] h-full max-h-full min-h-0 overflow-hidden animate-fade-in-up ${mainClassName}`}
      >
        {children}
      </main>

      {outside}
    </div>
  );
}

interface PublicCardProps {
  themeKey: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  showFooter?: boolean;
  creatorUsername?: string;
  creatorDisplayName?: string;
}

/** The centered main card surface, identical on every public page. */
export function PublicCard({
  themeKey,
  children,
  className = "",
  style,
  showFooter = true,
  creatorUsername,
  creatorDisplayName,
}: PublicCardProps) {
  const t = getPublicTheme(themeKey);
  return (
    <div
      data-card-glass={getThemeDefinition(t.meta.key).tokens["--card-blur"] !== "0px"}
      style={{ ...t.surfaceStyle, boxShadow: "none", ...style }}
      className={`relative flex-1 min-h-0 h-full max-h-full flex flex-col border profile-card-glass transition-all overflow-hidden ${PUBLIC_RADIUS.card} ${className}`}
    >
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>

      {showFooter && (
        <div
          className="relative z-30 shrink-0 select-none py-2.5 sm:py-3 border-t border-(--divider) bg-transparent flex items-center justify-center"
          style={{ boxShadow: "0 -2px 6px rgba(0,0,0,.04)" }}
        >
          <MadeWithInflixo
            variant="card-footer"
            creatorUsername={creatorUsername}
            creatorDisplayName={creatorDisplayName}
          />
        </div>
      )}
    </div>
  );
}
