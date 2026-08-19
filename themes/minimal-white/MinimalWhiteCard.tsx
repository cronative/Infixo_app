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

        {/* 4. Category & Profession Badges */}
        {(profile.category || profile.profession) && (
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
            {profile.category && (
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-2xs">
                {profile.category}
              </span>
            )}
            {profile.profession && (
              <span className="rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-[11px] font-bold text-purple-700">
                ✨ {profile.profession}
              </span>
            )}
          </div>
        )}

        {/* 5. Short Bio */}
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">{profile.bio}</p>

        {/* 6. Total Audience Stats */}
        <div className="mt-4 flex items-center gap-1.5 rounded-full border border-inflixo-gold/40 bg-inflixo-gold-light px-3.5 py-1.5">
          <Users className="h-3.5 w-3.5 text-inflixo-gold" />
          <span className="text-xs font-bold text-inflixo-navy">{formatCount(totalAudience)} fanbase</span>
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
