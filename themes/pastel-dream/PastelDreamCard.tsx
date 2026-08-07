import { Users, Play } from "lucide-react";
import { ThemeCardProps } from "@/themes/types";
import { formatCount, initials } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

export function PastelDreamCard({ profile, socials, series, totalAudience, variant = "compact" }: ThemeCardProps) {
  const full = variant === "full";
  return (
    <div
      className={`w-full rounded-3xl border border-white/60 ${full ? "p-8" : "p-6"}`}
      style={{
        backgroundImage: "linear-gradient(135deg, #e9d5ff 0%, #fbcfe8 35%, #bbf7d0 70%, #fed7aa 100%)",
        boxShadow: "0 1px 1px rgba(255,255,255,0.4) inset, 0 24px 48px -22px rgba(168,85,247,0.35)",
      }}
    >
      <div className="flex flex-col items-center text-center">
        {profile.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoDataUrl} alt={profile.displayName} className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full border-4 border-white object-cover`} />
        ) : (
          <div className={`flex ${full ? "h-28 w-28 text-2xl" : "h-20 w-20 text-lg"} items-center justify-center rounded-full border-4 border-white bg-white/60 font-extrabold text-[#5b3a6b]`}>
            {initials(profile.displayName) || "IN"}
          </div>
        )}
        <p className={`mt-4 ${full ? "text-2xl" : "text-lg"} font-extrabold text-[#3a2447]`}>
          {profile.displayName || "Your name"}
        </p>
        <p className="text-sm text-[#3a2447]/55">
          @{profile.username || "username"} {profile.category ? `· ${profile.category}` : ""}
        </p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#3a2447]/75">{profile.bio}</p>

        <div className="mt-4 flex items-center gap-1.5 rounded-full bg-white/70 px-3.5 py-1.5 shadow-sm">
          <Users className="h-3.5 w-3.5 text-[#5b3a6b]" />
          <span className="text-xs font-bold text-[#3a2447]">{formatCount(totalAudience)} total fanbase</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <StatCell icon={<InstagramIcon className="h-4 w-4 text-[#5b3a6b]" />} value={socials.instagram.followers} />
        <StatCell icon={<YoutubeIcon className="h-4 w-4 text-[#5b3a6b]" />} value={socials.youtube.subscribers} />
        <StatCell icon={<FacebookIcon className="h-4 w-4 text-[#5b3a6b]" />} value={socials.facebook.followers} />
      </div>

      {series.length > 0 && (
        <div className="mt-6 space-y-2">
          {series.slice(0, full ? undefined : 2).map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                <Play className="h-4 w-4 fill-[#5b3a6b] text-[#5b3a6b]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#3a2447]">{s.title}</p>
                <p className="text-xs text-[#3a2447]/50">{s.seasons.length} season{s.seasons.length !== 1 ? "s" : ""}</p>
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
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white/70 py-3 text-[#3a2447] shadow-sm">
      {icon}
      <span className="text-xs font-bold">{value > 0 ? formatCount(value) : "—"}</span>
    </div>
  );
}
