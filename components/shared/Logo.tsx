"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  authRepository,
  onboardingRepository,
} from "@/repositories/localRepository";

/**
 * ============================================================
 * PRIMARY ACTIVE LOGO
 * ============================================================
 *
 * Uses exact approved Inflixo logo image.
 * No SVG recreation, so the logo shape stays exactly the same.
 */
export function LogoStadiumLinkI({
  className = "h-6 w-6",
  color = "dark",
  style,
}: {
  className?: string;
  color?: "dark" | "white" | "color" | "current";
  style?: React.CSSProperties;
}) {
  if (color === "current") {
    return (
      <span
        className={`${className} inline-block shrink-0`}
        style={{
          maskImage: "url(/images/inflixo-logo-icon-043084.png)",
          WebkitMaskImage: "url(/images/inflixo-logo-icon-043084.png)",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          backgroundColor: "currentColor",
          ...style,
        }}
        aria-hidden="true"
      />
    );
  }

  const imageSrc =
    color === "white"
      ? "/images/inflixo-logo-icon-white-transparent.png"
      : color === "color"
      ? "/images/inflixo-logo-icon.png"
      : "/images/inflixo-logo-icon-043084.png";

  return (
    <Image
      src={imageSrc}
      alt="Inflixo"
      width={100}
      height={100}
      className={`${className} object-contain`}
      style={style}
      priority
    />
  );
}

/**
 * ============================================================
 * BACKUP ICON
 * ============================================================
 *
 * Keeping your previous universal-link icon as fallback.
 */
export function LogoUniversalLinkI({
  className = "h-6 w-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g
        transform="rotate(-45 50 50)"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M 34 46 L 34 20 A 16 16 0 0 1 66 20 L 66 54 A 16 16 0 0 1 50 70 L 44 70" />

        <path d="M 66 54 L 66 80 A 16 16 0 0 1 34 80 L 34 46 A 16 16 0 0 1 50 30 L 56 30" />
      </g>

      <g fill="currentColor">
        <rect
          x="33"
          y="22"
          width="34"
          height="8.5"
          rx="4.25"
        />

        <rect
          x="44"
          y="30.5"
          width="12"
          height="39"
          rx="6"
        />

        <rect
          x="33"
          y="69.5"
          width="34"
          height="8.5"
          rx="4.25"
        />
      </g>
    </svg>
  );
}

/**
 * ============================================================
 * DEFAULT INFLIXO LOGO ICON
 * ============================================================
 */
export function InflixoLogoIcon({
  className = "h-6 w-6",
  light = false,
  color,
  style,
}: {
  className?: string;
  light?: boolean;
  color?: "dark" | "white" | "color" | "current";
  style?: React.CSSProperties;
}) {
  const resolvedColor = color || (light ? "white" : "current");

  return (
    <LogoStadiumLinkI
      className={className}
      color={resolvedColor}
      style={style}
    />
  );
}

/**
 * ============================================================
 * MAIN LOGO COMPONENT
 * ============================================================
 */
export function Logo({
  size = "md",
  href = "/",
  light = false,
  variant = "brand",
  styleName = "stadium-link-i",
  orientation = "horizontal",
  showText = true,
  className = "",
  casing = "uppercase",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  light?: boolean;
  variant?: "gradient" | "black" | "white" | "brand" | "color" | "transparent";
  styleName?: "stadium-link-i" | "universal-link-i";
  orientation?: "horizontal" | "vertical";
  showText?: boolean;
  className?: string;
  casing?: "uppercase" | "title";
}) {
  const router = useRouter();

  /**
   * ============================================================
   * LOGO CLICK HANDLING
   * ============================================================
   */
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const session = authRepository.get();

    if (session && session.isLoggedIn) {
      e.preventDefault();

      const step = onboardingRepository.getStep();

      if (step === "finish") {
        router.push("/dashboard");
        return;
      }

      const stepRoutes: Record<string, string> = {
        profile: "/onboarding/profile",
        socials: "/onboarding/socials",

        theme: "/onboarding/themes",
        themes: "/onboarding/themes",

        series: "/onboarding/subscription",
        subscription: "/onboarding/subscription",
      };

      const targetRoute =
        stepRoutes[step] || "/onboarding/profile";

      router.push(targetRoute);
    } else if (href === "/" && typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  /**
   * ============================================================
   * SIZES
   * ============================================================
   */
  const isTransparent = variant === "transparent";

  const badgeSize = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: isTransparent ? "h-20 w-20" : "h-[100px] w-[100px]",
  }[size];

  const iconSize = {
    sm: isTransparent ? "h-8 w-8" : "h-[21px] w-[21px]",
    md: isTransparent ? "h-10 w-10" : "h-[27px] w-[27px]",
    lg: isTransparent ? "h-12 w-12" : "h-[33px] w-[33px]",
    xl: isTransparent ? "h-20 w-20" : "h-[68px] w-[68px]",
  }[size];

  const textSize = {
    sm: "text-[21px]",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }[size];

  /**
   * ============================================================
   * BADGE RADIUS
   * ============================================================
   */
  const radius = {
    sm: "rounded-[10px]",
    md: "rounded-[10px]",
    lg: "rounded-[10px]",
    xl: "rounded-[10px]",
  }[size];

  /**
   * ============================================================
   * BADGE STYLE
   * ============================================================
   */
  const badgeStyles = isTransparent
    ? "bg-transparent"
    : ({
        gradient: "bg-[#043084]",
        black: "bg-[#043084]",
        brand: "bg-[#043084]",
        white: "bg-white border border-[#e2e8f0]",
        color: "bg-[#eff6ff] border border-[#dbeafe]",
      }[variant] || "bg-[#043084]");

  /**
   * ============================================================
   * CHOOSE LOGO COLOR
   * ============================================================
   *
   * Dark badge -> white logo
   * White badge -> #043084 logo
   * Color badge -> full 3D color logo
   * Transparent badge -> #043084 primary logo
   */
  const primaryLogoColor: "dark" | "white" | "color" =
    variant === "color"
      ? "color"
      : variant === "white"
      ? "dark"
      : variant === "transparent"
      ? (light ? "white" : "dark")
      : "white";

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`
        group
        flex
        cursor-pointer
        select-none
        ${orientation === "vertical"
          ? "flex-col items-center gap-2 text-center"
          : "items-center gap-2.5"
        }
        ${className}
      `}
    >
      {/* =====================================================
          ICON BADGE
         ===================================================== */}
      <div
        className={`
          ${badgeSize}
          ${isTransparent
            ? "flex shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105"
            : `${radius} ${badgeStyles} flex shrink-0 items-center justify-center overflow-hidden transition-all duration-200 shadow-sm group-hover:shadow-md`
          }
        `}
      >
        {styleName === "universal-link-i" ? (
          <LogoUniversalLinkI
            className={`
              ${iconSize}
              ${variant === "white"
                ? "text-[#043084]"
                : variant === "transparent"
                ? (light ? "text-white" : "text-[#043084]")
                : "text-white"
              }
            `}
          />
        ) : (
          <LogoStadiumLinkI
            className={iconSize}
            color={primaryLogoColor}
          />
        )}
      </div>

      {/* =====================================================
          BRAND NAME
         ===================================================== */}
      {showText && (
        <span
          className={`
            font-[family-name:var(--font-outfit)]
            ${textSize}
            font-black
            ${casing === "uppercase" ? "uppercase tracking-[0.05em]" : "tracking-tight"}
            leading-none
            transition-colors
            ${light
              ? "text-white"
              : "text-[#043084]"
            }
          `}
        >
          {casing === "uppercase" ? "INFLIXO" : "Inflixo"}
        </span>
      )}
    </Link>
  );
}
