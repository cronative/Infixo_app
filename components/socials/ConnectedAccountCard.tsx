"use client";

import React from "react";
import { Check, Trash2, BadgeCheck } from "lucide-react";
import { formatCount } from "@/utils/format";

interface ConnectedAccountCardProps {
  platform: "instagram" | "youtube" | "facebook";
  icon: React.ReactNode;
  accentClass: string;
  name: string;
  handle: string;
  displayName?: string;
  isVerified?: boolean;
  count: number;
  countLabel: string;
  lastSyncedAt?: string;
  onDisconnect: () => void;
  loading?: boolean;
}

export function ConnectedAccountCard({
  platform,
  icon,
  accentClass,
  name,
  handle,
  displayName,
  isVerified = false,
  count,
  countLabel,
  lastSyncedAt,
  onDisconnect,
  loading = false,
}: ConnectedAccountCardProps) {
  const cleanHandle = handle ? (handle.startsWith("@") ? handle : `@${handle}`) : (displayName || name);

  return (
    <div className="flex items-center justify-between gap-3 w-full">
      <div className="flex items-center gap-3 min-w-0">
        {/* Brand Icon Container */}
        <div className="relative shrink-0">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass} shadow-2xs`}>
            {icon}
          </div>
          {isVerified && (
            <BadgeCheck className="absolute -bottom-1 -right-1 h-4 w-4 fill-sky-500 text-white" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-[#181716] truncate">
              {cleanHandle}
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
              <Check className="h-3 w-3 stroke-[3]" />
              Connected
            </span>
          </div>

          <p className="text-xs font-semibold text-[#64748b] mt-0.5">
            <span className="font-bold text-[#181716]">{formatCount(count)}</span> {countLabel}
          </p>
        </div>
      </div>

      {/* Disconnect Ghost Button */}
      <button
        type="button"
        onClick={onDisconnect}
        disabled={loading}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0 disabled:opacity-50 inline-flex items-center gap-1"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Disconnect</span>
      </button>
    </div>
  );
}
