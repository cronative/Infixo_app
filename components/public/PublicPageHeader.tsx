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
  /** Show creator avatar and name in header (typically when scrolled down). */
  showCreatorIdentity?: boolean;
  className?: string;
}

/**
 * Header for secondary public pages: [←]  ...  [actions]
 * Shows page title by default; transitions to creator identity when scrolled.
 */
export function PublicPageHeader({
  themeKey,
  backHref,
  backLabel,
  creatorName,
  creatorHandle,
  creatorPhoto,
  pageLabel,
  actions,
  preferHistoryBack = false,
  showCreatorIdentity = false,
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

      <div className="min-w-0 flex-1 flex items-center justify-center gap-1.5 px-1">
        {showCreatorIdentity ? (
          <div className="flex items-center justify-center gap-1.5 min-w-0 animate-in fade-in duration-200">
            {creatorPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creatorPhoto}
                alt={creatorName || "Creator"}
                className="h-6 w-6 sm:h-7 sm:w-7 rounded-full aspect-square object-cover border border-white/70 shadow-xs shrink-0"
              />
            )}
            <div className="min-w-0 text-center truncate">
              <span
                style={{ color: t.colors.primaryText }}
                className="text-xs sm:text-sm font-bold tracking-tight truncate block leading-tight"
              >
                {creatorName || pageLabel}
              </span>
              {pageLabel && (
                <span
                  style={{ color: t.colors.secondaryText }}
                  className="text-[10px] sm:text-[11px] font-medium opacity-80 truncate block leading-tight"
                >
                  {pageLabel}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center truncate">
            <span
              style={{ color: t.colors.primaryText }}
              className="text-xs sm:text-sm font-bold tracking-tight truncate block"
            >
              {pageLabel || creatorName}
            </span>
          </div>
        )}
      </div>

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
