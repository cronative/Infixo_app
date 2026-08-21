"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCreator } from "@/contexts/CreatorContext";
import { ThemeCard } from "@/themes/registry";
import { THEME_PAGE_BACKGROUNDS } from "@/services/ThemeService";
import { MediaKitService } from "@/services/MediaKitService";
import { MediaKitPackage, MediaKitSettings } from "@/types";
import { formatCount } from "@/utils/format";
import {
  Film,
  Briefcase,
  ShieldCheck,
  Zap,
  MessageCircle,
  Mail,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Tv,
} from "lucide-react";

export default function DashboardPreviewPage() {
  const { profile, socials, series, totalAudience, theme } = useCreator();
  const [activeTab, setActiveTab] = useState<"series" | "mediakit">("series");
  const [packages, setPackages] = useState<MediaKitPackage[]>([]);
  const [settings, setSettings] = useState<MediaKitSettings>(MediaKitService.DEFAULT_SETTINGS);

  const pageBgStyle = THEME_PAGE_BACKGROUNDS[theme] || THEME_PAGE_BACKGROUNDS["minimal-white"];

  useEffect(() => {
    async function loadMediaKit() {
      const identifier = profile.id || profile.email || profile.username;
      if (identifier) {
        const { settings: dbSettings, packages: dbPackages } = await MediaKitService.fetchFromDb(identifier, profile.id);
        setPackages(dbPackages);
        setSettings(dbSettings);
      }
    }
    loadMediaKit();
  }, [profile.id, profile.email, profile.username]);

  const activePackages = packages.filter((p) => p.isActive);
  const cleanPhone = settings.whatsappNumber ? settings.whatsappNumber.replace(/[^0-9]/g, "") : "";
  const handleStr = profile.username ? profile.username.replace(/^@/, "") : "creator";

  const totalSeriesCount = series ? series.length : 0;
  const totalEpisodesCount = series
    ? series.reduce((acc: number, ser: any) => {
        const epCount = ser.seasons
          ? ser.seasons.reduce((sAcc: number, season: any) => sAcc + (season.episodes?.length || 0), 0)
          : (ser.episodesCount || 0);
        return acc + epCount;
      }, 0)
    : 0;

  return (
    <div className="w-full px-3 sm:px-8 py-4 sm:py-8 space-y-6 text-left">
      {/* 2-Tab Navigation Switcher Header */}
      <div className="max-w-4xl mx-auto flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("series")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "series"
              ? "bg-[#803D63] text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Film className="h-4 w-4" />
          <span>🎬 Series &amp; Shows</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mediakit")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "mediakit"
              ? "bg-[#803D63] text-white shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          <span>💼 Media Kit &amp; Collabs</span>
        </button>
      </div>

      {/* TAB 1: 🎬 SERIES & SHOWS (DEFAULT ACTIVE FOR FANS) */}
      {activeTab === "series" && (
        <div className={`w-full rounded-3xl p-4 sm:p-8 transition-colors duration-300 shadow-2xs ${pageBgStyle} animate-in fade-in duration-200`}>
          <div className="w-full max-w-4xl mx-auto">
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
      )}

      {/* TAB 2: 💼 MEDIA KIT & COLLABS (FOR BRAND MANAGERS & SPONSORS) */}
      {activeTab === "mediakit" && (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
          {/* Public Header Preview */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 space-y-5 relative shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl sm:text-3xl font-black">{profile.displayName || "Creator"}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-0.5 text-xs font-black">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified by Inflixo
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-indigo-200 font-medium mt-1">
                  @{handleStr} • {profile.category || "Digital Creator"}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-5 py-2.5 rounded-2xl text-left sm:text-right shrink-0">
                <p className="text-[10px] text-slate-300 uppercase font-extrabold tracking-wider">Total Aggregated Reach</p>
                <p className="text-3xl font-black text-white">{formatCount(totalAudience)}</p>
              </div>
            </div>

            {settings.bioHighlight && (
              <p className="text-xs sm:text-sm text-slate-300 font-medium pt-3 border-t border-white/10 leading-relaxed">
                "{settings.bioHighlight}"
              </p>
            )}

            {/* Direct Contact Routing Bar */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-400" /> Direct Brand Inquiry Routing (0% Commission):
              </span>
              <div className="flex items-center gap-2">
                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md"
                  >
                    <MessageCircle className="h-4 w-4 fill-white" />
                    <span>💬 WhatsApp Chat</span>
                  </a>
                )}
                {settings.sponsorEmail && (
                  <a
                    href={`mailto:${settings.sponsorEmail}`}
                    className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-md"
                  >
                    <Mail className="h-4 w-4 text-[#803D63]" />
                    <span>✉️ Send Email</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Public Gigs Grid (Active Only - 2 per row) */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#803D63]" />
              <span>Official Collaboration Rate Cards ({activePackages.length})</span>
            </h4>

            {activePackages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-xs text-slate-500 font-medium">
                No active rate card packages published currently.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {activePackages.map((pkg) => {
                  const waText = encodeURIComponent(
                    `Hi ${profile.displayName || "Creator"}, I saw your "${pkg.title}" (${pkg.price}) package on Inflixo and want to collaborate.`
                  );
                  const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`;
                  const mailSubject = encodeURIComponent(`[Inflixo Collab Inquiry] - ${pkg.title}`);
                  const mailBody = encodeURIComponent(`Hi ${profile.displayName || "Creator"},\n\nI would like to inquire about collaborating on your "${pkg.title}" package listed on Inflixo.\n\nBest regards,\n[Brand Representative]`);
                  const mailUrl = `mailto:${settings.sponsorEmail}?subject=${mailSubject}&body=${mailBody}`;

                  return (
                    <div key={pkg.id} className="border border-gray-200 rounded-2xl p-6 space-y-4 bg-white hover:border-[#803D63] transition-all flex flex-col justify-between shadow-2xs relative">
                      {(pkg.badge || pkg.packageName || pkg.isPopular) && (
                        <span className="absolute -top-3 right-4 bg-[#803D63] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                          {pkg.badge || pkg.packageName || "⭐ MOST POPULAR"}
                        </span>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase">
                            {pkg.platform}
                          </span>
                          <span className="font-black text-[#803D63] text-xl">{pkg.price}</span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-base leading-snug">{pkg.title}</h5>
                        <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#803D63]" /> Turnaround: {pkg.turnaroundDays} Days
                        </p>
                        <ul className="text-xs text-slate-600 space-y-2 pt-1">
                          {pkg.deliverables.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Frictionless Direct Lead Actions */}
                      <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <MessageCircle className="h-4 w-4 fill-white" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={mailUrl}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all inline-flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <Mail className="h-4 w-4" />
                          <span>Send Email</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* OTT Series & Episodes Track Record Summary */}
          <div className="pt-3 border-t border-gray-200 space-y-3 bg-white p-6 rounded-2xl border border-gray-200">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="h-4 w-4 text-[#803D63]" /> Production Portfolio Track Record
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-slate-50 border border-gray-200 rounded-xl p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F6EBF1] text-[#803D63] border border-[#E8DCE4] shrink-0">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Series</p>
                  <p className="font-display text-lg font-black text-slate-900">{totalSeriesCount} Series</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border border-gray-200 rounded-xl p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                  <Tv className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Episodes</p>
                  <p className="font-display text-lg font-black text-slate-900">{totalEpisodesCount} Episodes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
