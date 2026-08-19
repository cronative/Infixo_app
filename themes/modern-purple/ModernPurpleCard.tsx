import { Users, Play } from "lucide-react";
import { ThemeCardProps } from "@/themes/types";
import { formatCount } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";
import { CreatorAvatar } from "@/components/shared/CreatorAvatar";

export function ModernPurpleCard({ profile, socials, series, totalAudience, variant = "compact" }: ThemeCardProps) {
  const full = variant === "full";
  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl ${full ? "p-8" : "p-6"} text-white`}
      style={{ backgroundImage: "var(--gradient-premium)", boxShadow: "var(--shadow-premium)" }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-inflixo-gold/15 blur-3xl" />
      <div className="relative flex flex-col items-center text-center">
        {/* 1. Profile Picture */}
        <CreatorAvatar
          src={profile.photoDataUrl}
          name={profile.displayName || "Creator"}
          className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full border-4 border-white/25 shadow-md`}
          textClassName={`${full ? "text-3xl" : "text-xl"} font-extrabold text-white`}
          fallbackBgClass="bg-purple-900/60"
        />

        {/* 2. Name */}
        <p className={`font-display mt-4 ${full ? "text-2xl" : "text-lg"} font-bold tracking-tight`}>{profile.displayName || "Your name"}</p>

        {/* 3. Link of Inflixo */}
        <p className="text-xs font-semibold text-white/80 mt-0.5">
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
                <span className="rounded-full bg-white/20 px-4 py-1 text-xs font-black text-white shadow-2xs backdrop-blur-md">
                  {catItems.join(" · ")}
                </span>
              )}
              {profItems.length > 0 && (
                <p className="text-xs font-bold text-white/80">
                  {profItems.join(" · ")}
                </p>
              )}
            </div>
          );
        })()}

        {/* 5. Short Bio */}
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">{profile.bio}</p>

        {/* 6. Total Fanbase Card */}
        <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-3.5 text-center w-full shadow-2xs backdrop-blur-md">
          <div className="flex items-center justify-center gap-2">
            <span className="text-base">❤️</span>
            <span className="font-display text-lg sm:text-xl font-black text-white">
              {formatCount(totalAudience)}
            </span>
          </div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest mt-0.5 text-white/70">
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
            <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Play className="h-4 w-4 fill-white text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{s.title}</p>
                <p className="text-xs text-white/60">{s.seasons.length} season{s.seasons.length !== 1 ? "s" : ""}</p>
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
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 py-3">
      {icon}
      <span className="text-xs font-bold">{value > 0 ? formatCount(value) : "—"}</span>
    </div>
  );
}
