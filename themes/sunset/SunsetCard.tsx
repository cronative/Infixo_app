import { Users, Play } from "lucide-react";
import { ThemeCardProps } from "@/themes/types";
import { formatCount, initials } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

export function SunsetCard({ profile, socials, series, totalAudience, variant = "compact" }: ThemeCardProps) {
  const full = variant === "full";
  return (
    <div
      className={`w-full rounded-3xl bg-gradient-to-br from-orange-400 via-pink-400 to-pink-500 ${full ? "p-8" : "p-6"} text-white`}
      style={{ boxShadow: "0 1px 1px rgba(255,255,255,0.2) inset, 0 26px 50px -22px rgba(236,72,153,0.55)" }}
    >
      <div className="flex flex-col items-center text-center">
        {profile.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoDataUrl} alt={profile.displayName} className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full border-4 border-white/40 object-cover`} />
        ) : (
          <div className={`flex ${full ? "h-28 w-28 text-2xl" : "h-20 w-20 text-lg"} items-center justify-center rounded-full border-4 border-white/40 bg-white/20 font-bold`}>
            {initials(profile.displayName) || "IN"}
          </div>
        )}
        <p className={`font-display mt-4 ${full ? "text-2xl" : "text-lg"} font-medium`}>{profile.displayName || "Your name"}</p>
        <p className="text-sm text-white/80">
          @{profile.username || "username"} {profile.category ? `· ${profile.category}` : ""}
        </p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/90">{profile.bio}</p>

        <div className="mt-4 flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5">
          <Users className="h-3.5 w-3.5" />
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
            <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white/15 px-3 py-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/25">
                <Play className="h-4 w-4 fill-white text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{s.title}</p>
                <p className="text-xs text-white/70">{s.seasons.length} season{s.seasons.length !== 1 ? "s" : ""}</p>
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
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 py-3">
      {icon}
      <span className="text-xs font-bold">{value > 0 ? formatCount(value) : "—"}</span>
    </div>
  );
}
