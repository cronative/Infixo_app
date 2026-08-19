"use client";

import { useState } from "react";
import { Film } from "lucide-react";
import { getInitials } from "@/lib/avatar";

interface SeriesPosterProps {
  src?: string | null;
  title?: string;
  className?: string;
  textClassName?: string;
  fallbackBgClass?: string;
  iconSize?: number;
  style?: React.CSSProperties;
}

export function SeriesPoster({
  src,
  title = "Series",
  className = "h-32 w-full rounded-2xl",
  textClassName = "text-xs font-bold text-white",
  fallbackBgClass = "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border border-purple-800/40",
  iconSize = 20,
  style,
}: SeriesPosterProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(title);

  if (!src || imgError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-3 text-center select-none shadow-md shrink-0 overflow-hidden relative ${fallbackBgClass} ${className}`}
        style={style}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        <Film className="h-5 w-5 text-purple-400 mb-1 z-10 opacity-90" style={{ width: iconSize, height: iconSize }} />
        <span className={`z-10 tracking-wider truncate max-w-full ${textClassName}`}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      onError={() => setImgError(true)}
      className={`object-cover shrink-0 ${className}`}
      style={style}
    />
  );
}
