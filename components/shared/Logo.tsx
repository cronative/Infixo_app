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
}: {
  className?: string;
  color?: "dark" | "white";
}) {
  return (
    <Image
      src={
        color === "white"
          ? "/images/inflixo-logo-icon-white-transparent.png"
          : "/images/inflixo-logo-icon-151933-transparent.png"
      }
      alt="Inflixo"
      width={100}
      height={100}
      className={`${className} object-contain`}
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
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <LogoStadiumLinkI
      className={className}
      color={light ? "white" : "dark"}
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
}: {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  light?: boolean;
  variant?: "gradient" | "black" | "white" | "brand";
  styleName?: "stadium-link-i" | "universal-link-i";
  orientation?: "horizontal" | "vertical";
  showText?: boolean;
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
    }
  }

  /**
   * ============================================================
   * SIZES
   * ============================================================
   */
  const badgeSize = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-[100px] w-[100px]",
  }[size];

  const iconSize = {
    sm: "h-[21px] w-[21px]",
    md: "h-[27px] w-[27px]",
    lg: "h-[33px] w-[33px]",
    xl: "h-[68px] w-[68px]",
  }[size];

  const textSize = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
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
  const badgeStyles = {
    gradient: "bg-[#151933]",
    black: "bg-[#151933]",
    brand: "bg-[#151933]",
    white: "bg-white border border-[#e5e7eb]",
  }[variant];

  /**
   * ============================================================
   * CHOOSE LOGO COLOR
   * ============================================================
   *
   * Dark badge -> white logo
   * White badge -> #151933 logo
   */
  const primaryLogoColor =
    variant === "white" ? "dark" : "white";

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
      `}
    >
      {/* =====================================================
          ICON BADGE
         ===================================================== */}
      <div
        className={`
          ${badgeSize}
          ${radius}
          ${badgeStyles}
          flex
          shrink-0
          items-center
          justify-center
          overflow-hidden
          transition-all
          duration-200
          shadow-sm
        `}
      >
        {styleName === "universal-link-i" ? (
          <LogoUniversalLinkI
            className={`
              ${iconSize}
              ${variant === "white"
                ? "text-[#151933]"
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
            font-display
            ${textSize}
            font-bold
            tracking-tight
            transition-colors
            ${light
              ? "text-white"
              : "text-[#151933]"
            }
          `}
        >
          Inflixo
        </span>
      )}
    </Link>
  );
}
