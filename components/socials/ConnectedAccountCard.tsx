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
    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50/90 via-white to-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Brand Icon Container */}
          <div className="relative shrink-0">
            <div className={`flex h-13 w-13 items-center justify-center rounded-2xl shadow-2xs ${accentClass}`}>
              {icon}
            </div>
            {isVerified && (
              <BadgeCheck className="absolute -bottom-1 -right-1 h-5 w-5 fill-sky-500 text-white shadow-xs" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-display text-base font-black text-slate-900 truncate">
                {displayTitle}
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">
                <Check className="h-3 w-3 stroke-[3]" />
                Connected &amp; Verified
              </span>
            </div>

            <p className="text-xs font-bold text-slate-600 mt-0.5">
              {handle && !handle.startsWith("@") ? `@${handle}` : handle}{" "}
              &middot;{" "}
              <span className="font-extrabold text-purple-700">
                {formatCount(count)} {countLabel}
              </span>
            </p>

            {/* Last Sync Date */}
            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Last synced: <span className="font-bold text-slate-700">{formattedSyncDate}</span></span>
            </div>
          </div>
        </div>

        {/* Remove Option Button */}
        <button
          type="button"
          onClick={onDisconnect}
          disabled={loading}
          className="tap-scale inline-flex items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all self-start sm:self-auto shrink-0 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Remove Connection
        </button>
      </div>
    </div>
  );
}
