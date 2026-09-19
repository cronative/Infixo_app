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
  textClassName = "text-xl font-extrabold text-white",
  textStyle,
  fallbackBgClass = "bg-[#043084]",
  style,
}: CreatorAvatarProps) {
  const [imageState, setImageState] = useState({ src: src || "", loaded: false, error: false });
  const initials = getInitials(name);
  const currentSrc = src || "";
  const isCurrentImage = imageState.src === currentSrc;
  const imgLoaded = isCurrentImage && imageState.loaded;
  const imgError = isCurrentImage && imageState.error;

  if (!src || imgError) {
    return (
      <div
        className={`flex items-center justify-center font-display select-none shadow-md shrink-0 border border-white/20 ${fallbackBgClass} ${className}`}
        style={style}
      >
        <span className={textClassName} style={textStyle}>{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden font-display select-none shadow-md shrink-0 border border-white/20 ${fallbackBgClass} ${className}`}
      style={style}
    >
      <span
        className={`${textClassName} transition-opacity duration-200 ${imgLoaded ? "opacity-0" : "opacity-100"}`}
        style={textStyle}
      >
        {initials}
      </span>
      {/* Keep initials visible until the remote/local avatar has fully loaded. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        onLoad={() => setImageState({ src: currentSrc, loaded: true, error: false })}
        onError={() => setImageState({ src: currentSrc, loaded: false, error: true })}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
