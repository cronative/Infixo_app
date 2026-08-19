"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Copy, Check, Sparkles, ArrowLeft, Eye } from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { ThemeCard } from "@/themes/registry";
import { THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { QRCodeWidget } from "@/components/shared/QRCodeWidget";

export default function DashboardPreviewPage() {
  const { profile, socials, series, totalAudience, theme } = useCreator();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const pageBgStyle = THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];
  const cleanUsername = profile.username || "username";
  const fullUrl = `https://inflixo.com/${cleanUsername}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      showToast("Link copied to clipboard! ✨");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy link", "error");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-5 space-y-5">
      {/* Proper Top Navigation Bar */}
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-white/95 p-4 sm:p-5 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="tap-scale flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-black text-slate-900 leading-none sm:text-xl">
                Live Profile Preview
              </h1>
              <span className="flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200/80 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700">
                <Eye className="h-3 w-3 text-purple-600" />
                Live Preview
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Exact interactive view of <span className="font-bold text-slate-800">inflixo.com/{cleanUsername}</span>
            </p>
          </div>
        </div>

        {/* Navbar Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleCopy}
            className="tap-scale flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition-all"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-purple-600" /> Copy Link
              </>
            )}
          </button>

          <Link
            href={`/${cleanUsername}`}
            target="_blank"
            className="tap-scale flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:shadow-lg transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Public Page
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Static QR Code Sidebar + Main Profile View */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Static Fixed/Sticky QR Code Sidebar (Doesn't scroll away!) */}
        <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-28 space-y-4">
          <QRCodeWidget username={cleanUsername} />
        </div>

        {/* Right Side: Theme Ambient Preview Wrapper */}
        <div className={`lg:col-span-8 xl:col-span-9 rounded-3xl p-5 sm:p-8 transition-colors duration-300 shadow-sm ${pageBgStyle}`}>
          <div className="mx-auto max-w-2xl">
            <ThemeCard
              themeKey={theme}
              profile={profile}
              socials={socials}
              series={series}
              totalAudience={totalAudience}
              variant="full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
