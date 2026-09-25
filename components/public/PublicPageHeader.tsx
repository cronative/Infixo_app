"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublicTheme, PUBLIC_ICON_BUTTON } from "@/components/public/publicTheme";

interface PublicPageHeaderProps {
  themeKey: string;
  /** Where "back" goes when there is no in-app history (direct links). */
  backHref: string;
  backLabel: string;
  creatorName?: string;
  creatorHandle?: string;
  creatorPhoto?: string | null;
  /** Page name shown under the creator identity, e.g. "Series", "Media kit". */
  pageLabel?: string;
  /** Right-side actions (share, export...). Use PublicIconButton. */
  actions?: ReactNode;
  /** Prefer router.back() when the visitor came from inside Inflixo. */
  preferHistoryBack?: boolean;
  className?: string;
}

/**
 * Header for secondary public pages: [←]  ...  [actions]
 * Always sits inside the centered card. Creator identity props are accepted
 * for compatibility but not rendered.
 */
export function PublicPageHeader({
  themeKey,
  backHref,
  backLabel,
  pageLabel,
  actions,
  preferHistoryBack = false,
  className = "",
}: PublicPageHeaderProps) {
  const router = useRouter();
  const t = getPublicTheme(themeKey);

  const goBack = () => {
    if (
      preferHistoryBack &&
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer &&
      new URL(document.referrer).origin === window.location.origin
    ) {
      router.back();
      return;
    }
    router.push(backHref);
  };

  return (
    <header className={`relative z-20 flex shrink-0 items-center gap-2.5 ${className}`}>
      <button
        type="button"
        onPointerEnter={() => router.prefetch(backHref)}
        onClick={goBack}
        style={t.controlStyle}
        className={PUBLIC_ICON_BUTTON}
        title={backLabel}
        aria-label={backLabel}
      >
        <ArrowLeft className="h-[18px] w-[18px]" />
      </button>

      {pageLabel ? (
        <div className="min-w-0 flex-1 text-center">
          <span
            style={{ color: t.colors.primaryText }}
            className="text-xs sm:text-sm font-bold tracking-tight truncate block"
          >
            {pageLabel}
          </span>
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
    </header>
  );
}

interface PublicIconButtonProps {
  themeKey: string;
  onClick?: () => void;
  label: string;
  children: ReactNode;
  /** Glass style for use on top of cover images. */
  onImage?: boolean;
}

export function PublicIconButton({ themeKey, onClick, label, children, onImage = false }: PublicIconButtonProps) {
  const t = getPublicTheme(themeKey);
  return (
    <button
      type="button"
      onClick={onClick}
      style={onImage ? undefined : t.controlStyle}
      className={`${PUBLIC_ICON_BUTTON} ${onImage ? "bg-black/40 hover:bg-black/60 backdrop-blur-md border-white/25 text-white" : ""}`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
