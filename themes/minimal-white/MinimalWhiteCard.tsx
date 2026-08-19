import { Users, Play } from "lucide-react";
import { ThemeCardProps } from "@/themes/types";
import { formatCount } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";

export function MinimalWhiteCard({ profile, socials, series, totalAudience, variant = "compact" }: ThemeCardProps) {
  const full = variant === "full";
  return (
    <div
      className={`w-full rounded-3xl border border-inflixo-border bg-white ${full ? "p-8" : "p-6"}`}
      style={{ boxShadow: "var(--shadow-premium)" }}
    >
      <div className="flex flex-col items-center text-center">
        {/* 1. Profile Picture */}
        <CreatorAvatar
          src={profile.photoDataUrl}
          name={profile.displayName || "Creator"}
          className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full ring-4 ring-purple-100 shadow-md`}
          textClassName={`${full ? "text-3xl" : "text-xl"} font-extrabold text-white`}
        />

        {/* 2. Name */}
        <p className={`font-display mt-4 ${full ? "text-2xl" : "text-lg"} font-bold tracking-tight text-slate-900`}>
          {profile.displayName || "Your name"}
        </p>

        {/* 3. Link of Inflixo */}
        <p className="text-xs font-bold text-purple-600 mt-0.5">
          {profile.username ? `inflixo.com/${profile.username}` : "inflixo.com/username"}
        </p>

        {/* 4. Category & Sub-category Badges */}
        {(profile.category || profile.profession) && (() => {
          const catItems: string[] = [];
          if (profile.category) {
            const cats = profile.category.split(",").map((c) => c.trim()).filter(Boolean);
            cats.forEach((c) => {
              if (c.toLowerCase() === "other") {
                if (profile.customCategory?.trim()) catItems.push(profile.customCategory.trim());
              } else {
                catItems.push(c);
              }
            });
          }
          const profItems: string[] = [];
          if (profile.profession) {
            const profs = profile.profession.split(",").map((s) => s.trim()).filter(Boolean);
            profItems.push(...profs);
          }
          if (catItems.length === 0 && profItems.length === 0) return null;
          return (
            <div className="mt-2.5 space-y-1 flex flex-col items-center">
              {catItems.length > 0 && (
                <span className="rounded-full bg-slate-900 px-4 py-1 text-xs font-extrabold text-white shadow-2xs">
                  {catItems.join(" · ")}
                </span>
              )}
              {profItems.length > 0 && (
                <p className="text-xs font-bold text-slate-500">
                  {profItems.join(" · ")}
                </p>
              )}
            </div>
          );
        })()}

        {/* 5. Short Bio */}
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">{profile.bio}</p>

        {/* 6. Total Fanbase Card */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-center w-full shadow-2xs">
          <div className="flex items-center justify-center gap-2">
            <span className="text-base">❤️</span>
            <span className="font-display text-lg sm:text-xl font-black text-slate-900">
              {formatCount(totalAudience)}
            </span>
          </div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest mt-0.5 text-slate-500">
            TOTAL FANBASE
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <StatCell icon={<InstagramIcon className="h-4 w-4" />} value={socials.instagram.followers} />
        <StatCell icon={<YoutubeIcon className="h-4 w-4" />} value={socials.youtube.subscribers} />
        <StatCell icon={<FacebookIcon className="h-4 w-4" />} value={socials.facebook.followers} />
      </div>

      {series.length > 0 && (
        <div className="mt-6 space-y-2">
          {series.slice(0, full ? undefined : 2).map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-inflixo-border px-3 py-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundImage: "var(--gradient-premium)" }}>
                <Play className="h-4 w-4 fill-white text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-inflixo-navy">{s.title}</p>
                <p className="text-xs text-muted">{s.seasons.length} season{s.seasons.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCell({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-inflixo-border py-3 text-inflixo-navy">
      {icon}
      <span className="text-xs font-bold">{value > 0 ? formatCount(value) : "—"}</span>
    </div>
  );
}
