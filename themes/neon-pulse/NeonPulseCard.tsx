import { Users, Play } from "lucide-react";
import { ThemeCardProps } from "@/themes/types";
import { formatCount, initials } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

export function NeonPulseCard({ profile, socials, series, totalAudience, variant = "compact" }: ThemeCardProps) {
  const full = variant === "full";
  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl bg-[#0a0a12] ${full ? "p-8" : "p-6"} text-white`}
      style={{ boxShadow: "0 1px 1px rgba(34,211,238,0.15), 0 30px 60px -24px rgba(217,70,239,0.35)" }}
    >
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="relative flex flex-col items-center text-center">
        {profile.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.photoDataUrl}
            alt={profile.displayName}
            className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full object-cover ring-2`}
            style={{ boxShadow: "0 0 0 2px #22d3ee, 0 0 24px rgba(34,211,238,0.5)" }}
          />
        ) : (
          <div
            className={`flex ${full ? "h-28 w-28 text-2xl" : "h-20 w-20 text-lg"} items-center justify-center rounded-full bg-white/5 font-black`}
            style={{ boxShadow: "0 0 0 2px #22d3ee, 0 0 24px rgba(34,211,238,0.5)" }}
          >
            {initials(profile.displayName) || "IN"}
          </div>
        )}
        <p className={`mt-4 ${full ? "text-2xl" : "text-lg"} font-extrabold tracking-tight`}>
          {profile.displayName || "Your name"}
        </p>
        <p className="text-sm text-white/45">
          @{profile.username || "username"} {profile.category ? `· ${profile.category}` : ""}
        </p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">{profile.bio}</p>

        <div
          className="mt-4 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-black"
          style={{ backgroundImage: "linear-gradient(90deg, #22d3ee 0%, #e879f9 100%)" }}
        >
          <Users className="h-3.5 w-3.5" />
          <span className="text-xs font-black">{formatCount(totalAudience)} total fanbase</span>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-3 gap-2">
        <StatCell icon={<InstagramIcon className="h-4 w-4 text-cyan-300" />} value={socials.instagram.followers} />
        <StatCell icon={<YoutubeIcon className="h-4 w-4 text-cyan-300" />} value={socials.youtube.subscribers} />
        <StatCell icon={<FacebookIcon className="h-4 w-4 text-cyan-300" />} value={socials.facebook.followers} />
      </div>

      {series.length > 0 && (
        <div className="relative mt-6 space-y-2">
          {series.slice(0, full ? undefined : 2).map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-white/[0.04] px-3 py-2.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundImage: "linear-gradient(135deg, #22d3ee 0%, #e879f9 100%)" }}
              >
                <Play className="h-4 w-4 fill-black text-black" />
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
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-cyan-400/20 bg-white/[0.04] py-3">
      {icon}
      <span className="text-xs font-bold">{value > 0 ? formatCount(value) : "—"}</span>
    </div>
  );
}
