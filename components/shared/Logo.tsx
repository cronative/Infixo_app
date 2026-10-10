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
  color?: "dark" | "white" | "color" | "current" | "gradient" | "3d";
  style?: React.CSSProperties;
}) {
  const imageSrc =
    color === "3d"
      ? "/images/inflixo-logo-3d.png"
      : color === "white"
      ? "/images/inflixo-logo-icon-white-transparent.png"
      : color === "color"
      ? "/images/inflixo-logo-3d.png"
      : "/images/inflixo-logo-icon-brand.png";

  return (
    <Image
      src={imageSrc}
      alt="Inflixo"
      width={120}
      height={120}
      className={`${className} object-contain select-none`}
      style={style}
      priority
    />
  );
}

/**
 * ============================================================
 * BACKUP ICON (3D Fallback)
 * ============================================================
 */
export function LogoUniversalLinkI({
  className = "h-6 w-6",
}: {
  className?: string;
}) {
  return (
    <LogoStadiumLinkI
      className={className}
      color="dark"
    />
  );
}

/**
 * ============================================================
 * DEFAULT INFLIXO LOGO ICON
 * ============================================================
 */
export function InflixoLogoIcon({
  className = "h-6 w-6",
  style,
}: {
  className?: string;
  light?: boolean;
  color?: "dark" | "white" | "color" | "current" | "3d";
  style?: React.CSSProperties;
}) {
  return (
    <Image
      src="/images/inflixo-logo-3d.png"
      alt="Inflixo"
      width={120}
      height={120}
      className={`${className} rounded-[22%] object-cover select-none shrink-0 shadow-2xs`}
      style={style}
      priority
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
    md: "rounded-[11px]",
    lg: "rounded-[14px]",
    xl: "rounded-[22px]",
  }[size];

  /**
   * ============================================================
   * BADGE STYLE
   * ============================================================
   */
  const badgeStyles = isTransparent
    ? "bg-transparent"
    : ({
        gradient: "bg-[#7A2253]",
        black: "bg-[#7A2253]",
        brand: "bg-[#7A2253]",
        white: "bg-white border border-[#e2e8f0]",
        color: "bg-[#fdf2f8] border border-[#fbcfe8]",
      }[variant] || "bg-[#7A2253]");

  /**
   * ============================================================
   * CHOOSE LOGO COLOR
   * ============================================================
   *
   * Dark badge -> white logo
   * White badge -> #7A2253 logo
   * Color badge -> full 3D color logo
   * Transparent badge -> #7A2253 primary logo
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
          ICON BADGE (3D EMBOSSED)
         ===================================================== */}
      <div
        className={`
          ${badgeSize}
          ${radius}
          flex shrink-0 items-center justify-center overflow-hidden transition-all duration-200 shadow-sm group-hover:shadow-md group-hover:scale-[1.03]
        `}
      >
        <Image
          src="/images/inflixo-logo-3d.png"
          alt="Inflixo"
          width={120}
          height={120}
          className="h-full w-full object-cover select-none"
          priority
        />
      </div>

      {/* =====================================================
          BRAND NAME
         ===================================================== */}
      {showText && (
        <span
          className={`
            font-[family-name:var(--font-plus-jakarta)]
            ${textSize}
            font-black
            ${casing === "uppercase" ? "uppercase tracking-[0.05em]" : "tracking-tight"}
            leading-none
            transition-colors
            ${light
              ? "text-white"
              : "text-[#7A2253]"
            }
          `}
        >
          {casing === "uppercase" ? "INFLIXO" : "Inflixo"}
        </span>
      )}
    </Link>
  );
}
