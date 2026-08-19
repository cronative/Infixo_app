"use client";

import { useState } from "react";
import { getInitials } from "@/lib/avatar";

interface CreatorAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  textClassName?: string;
  fallbackBgClass?: string;
  style?: React.CSSProperties;
}

export function CreatorAvatar({
  src,
  name = "Creator",
  className = "h-20 w-20 rounded-full",
  textClassName = "text-xl font-extrabold text-white",
  fallbackBgClass = "bg-gradient-to-br from-[#651FFF] to-purple-800",
  style,
}: CreatorAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);

  // If no source provided or error encountered while loading image
  if (!src || imgError) {
    return (
      <div
        className={`flex items-center justify-center font-display select-none shadow-md shrink-0 border border-white/20 ${fallbackBgClass} ${className}`}
        style={style}
      >
        <span className={textClassName}>{initials}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className={`object-cover shrink-0 ${className}`}
      style={style}
    />
  );
}
