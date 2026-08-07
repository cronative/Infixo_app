import { Users, Play } from "lucide-react";
import { ThemeCardProps } from "@/themes/types";
import { formatCount, initials } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

export function MidnightCard({ profile, socials, series, totalAudience, variant = "compact" }: ThemeCardProps) {
  const full = variant === "full";
  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl ${full ? "p-8" : "p-6"} text-white`}
      style={{
        backgroundImage: "radial-gradient(120% 140% at 50% -10%, #241a3f 0%, #0f0b1e 55%)",
        boxShadow: "0 1px 1px rgba(184,147,76,0.12), 0 30px 60px -24px rgba(0,0,0,0.7)",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-inflixo-gold/40 to-transparent" />
      <div className="relative flex flex-col items-center text-center">
        {profile.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoDataUrl} alt={profile.displayName} className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full object-cover ring-2 ring-inflixo-gold/60`} />
        ) : (
          <div className={`flex ${full ? "h-28 w-28 text-2xl" : "h-20 w-20 text-lg"} items-center justify-center rounded-full bg-white/5 font-bold ring-2 ring-inflixo-gold/60`}>
            {initials(profile.displayName) || "IN"}
          </div>
        )}
        <p className={`font-display mt-4 ${full ? "text-2xl" : "text-lg"} font-medium`}>{profile.displayName || "Your name"}</p>
        <p className="text-sm text-white/45">
          @{profile.username || "username"} {profile.category ? `· ${profile.category}` : ""}
        </p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">{profile.bio}</p>

        <div className="mt-4 flex items-center gap-1.5 rounded-full border border-inflixo-gold/25 bg-white/5 px-3.5 py-1.5">
          <Users className="h-3.5 w-3.5" style={{ color: "#e6c583" }} />
          <span className="text-xs font-bold" style={{ color: "#e6c583" }}>{formatCount(totalAudience)} total fanbase</span>
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
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-inflixo-purple">
                <Play className="h-4 w-4 fill-white text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{s.title}</p>
                <p className="text-xs text-white/40">{s.seasons.length} season{s.seasons.length !== 1 ? "s" : ""}</p>
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
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] py-3">
      {icon}
      <span className="text-xs font-bold">{value > 0 ? formatCount(value) : "—"}</span>
    </div>
  );
}
