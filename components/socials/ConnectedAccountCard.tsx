"use client";

import React from "react";
import { Check, Trash2, Clock, BadgeCheck } from "lucide-react";
import { formatCount, formatSyncDate } from "@/utils/format";

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
  const displayTitle = displayName || (handle ? `@${handle}` : name);
  const formattedSyncDate = formatSyncDate(lastSyncedAt);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        {/* Brand Icon Container */}
        <div className="relative shrink-0">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}>
            {icon}
          </div>
          {isVerified && (
            <BadgeCheck className="absolute -bottom-1 -right-1 h-4 w-4 fill-sky-500 text-white" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-sm font-bold text-slate-900 truncate">
              {displayTitle}
            </h4>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Check className="h-3 w-3 stroke-[3]" />
              Connected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
            <span>{handle && !handle.startsWith("@") ? `@${handle}` : handle}</span>
            <span>&middot;</span>
            <span className="text-sm font-bold text-gray-900">
              {formatCount(count)} {countLabel}
            </span>
          </div>

          {/* Last Sync Date & Sync Now Button */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-0.5">
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Clock className="h-3 w-3 text-slate-400" />
              Synced {formattedSyncDate}
            </span>
            <span>&middot;</span>
            <button
              type="button"
              onClick={() => {}}
              className="text-xs font-semibold text-[#6366F1] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>Sync Now</span>
              <span>↻</span>
            </button>
          </div>
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
