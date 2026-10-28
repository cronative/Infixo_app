"use client";

import { useState } from "react";
import { getInitials } from "@/lib/avatar";

interface CreatorAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  textClassName?: string;
  textStyle?: React.CSSProperties;
  fallbackBgClass?: string;
  style?: React.CSSProperties;
}

export function CreatorAvatar({
  src,
  name = "Creator",
  className = "h-20 w-20 rounded-full",
  textClassName = "text-xl font-extrabold text-(--on-accent)",
  textStyle,
  fallbackBgClass = "bg-(--accent)",
  style,
}: CreatorAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(name);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center font-display select-none shadow-xs shrink-0 border border-(--card-bg)/20 ${fallbackBgClass} ${className}`}
        style={style}
      >
        <span className={textClassName} style={textStyle}>{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden font-display select-none shadow-xs shrink-0 border border-(--card-bg)/20 ${fallbackBgClass} ${className}`}
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
    </div>
  );
}
