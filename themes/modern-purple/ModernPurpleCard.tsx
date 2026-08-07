import { Users, Play } from "lucide-react";
import { ThemeCardProps } from "@/themes/types";
import { formatCount, initials } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

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
        {profile.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoDataUrl} alt={profile.displayName} className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full border-4 border-white/25 object-cover shadow-md`} />
        ) : (
          <div className={`flex ${full ? "h-28 w-28 text-2xl" : "h-20 w-20 text-lg"} items-center justify-center rounded-full border-4 border-white/25 bg-white/10 font-bold shadow-md`}>
            {initials(profile.displayName) || "IN"}
          </div>
        )}

        {/* 2. Name */}
        <p className={`font-display mt-4 ${full ? "text-2xl" : "text-lg"} font-bold tracking-tight`}>{profile.displayName || "Your name"}</p>

        {/* 3. Link of Inflixo */}
        <p className="text-xs font-semibold text-white/80 mt-0.5">
          {profile.username ? `inflixo.com/${profile.username}` : "inflixo.com/username"}
        </p>

        {/* 4. Category & Profession Badges */}
        {(profile.category || profile.profession) && (
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
            {profile.category && (
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs backdrop-blur-md">
                {profile.category}
              </span>
            )}
            {profile.profession && (
              <span className="rounded-full bg-inflixo-gold/20 border border-inflixo-gold/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-200 backdrop-blur-md">
                ✨ {profile.profession}
              </span>
            )}
          </div>
        )}

        {/* 5. Short Bio */}
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">{profile.bio}</p>

        {/* 6. Total Audience Stats */}
        <div className="mt-4 flex items-center gap-1.5 rounded-full border border-inflixo-gold/30 bg-white/10 px-3.5 py-1.5">
          <Users className="h-3.5 w-3.5" style={{ color: "#e6c583" }} />
          <span className="text-xs font-bold">{formatCount(totalAudience)} total fanbase</span>
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
