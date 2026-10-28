"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Chip } from "@/components/ui/Chip";

interface AuthCardProps {
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  className?: string;
}

export function AuthCard({
  eyebrow,
  eyebrowIcon,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-[420px]",
  className = "",
}: AuthCardProps) {
  return (
    <div
      className={`relative flex min-h-[500px] w-full ${maxWidth} flex-col justify-between rounded-[5px] border border-[#E4E4E7] bg-white/95 p-6 text-center shadow-[0_20px_60px_-15px_rgba(122,34,83,0.1)] backdrop-blur-xl transition-all sm:p-7 ${className}`}
    >
      {/* TOP HEADER BLOCK */}
      <div>
        {/* Single Logo: Wordmark with Tagline linking to / */}
        <div className="flex justify-center">
          <Link
            href="/"
            className="group inline-flex flex-col items-center justify-center transition-transform duration-200 hover:scale-[1.02]"
            aria-label="Inflixo home"
          >
            <Image
              src="/images/inflixo-wordmark-title.png"
              alt="Inflixo"
              width={628}
              height={186}
              className="h-[42px] sm:h-[48px] w-auto object-contain select-none"
              priority
            />
            <span className="mt-1.5 text-[13px] sm:text-[14px] font-extrabold tracking-[0.08em] text-[#7A2253] select-none">
              For Creators. By Creators.
            </span>
          </Link>
        </div>

        {/* Eyebrow chip */}
        {eyebrow && (
          <div className="mt-3 flex justify-center">
            <Chip variant="eyebrow" icon={eyebrowIcon}>
              {eyebrow}
            </Chip>
          </div>
        )}

        {/* Title & Subtitle */}
        <div className="mt-4 space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#18181B] sm:text-[26px]">
            {title}
          </h1>
          {subtitle && (
            <div className="mx-auto max-w-[360px] text-xs font-medium leading-relaxed text-[#52525B] sm:text-sm">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE BODY BLOCK */}
      <div className="my-auto py-3">{children}</div>

      {/* BOTTOM FOOTER BLOCK */}
      {footer && (
        <div className="border-t border-[#E4E4E7] pt-3.5 text-xs text-[#71717A]">
          {footer}
        </div>
      )}
    </div>
  );
}
