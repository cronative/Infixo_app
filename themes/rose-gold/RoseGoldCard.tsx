import { Users, Play } from "lucide-react";
import { ThemeCardProps } from "@/themes/types";
import { formatCount, initials } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

export function RoseGoldCard({ profile, socials, series, totalAudience, variant = "compact" }: ThemeCardProps) {
  const full = variant === "full";
  return (
    <div
      className={`w-full rounded-3xl border border-[#f3d9c8]/60 bg-gradient-to-b from-[#fbe9ec] to-white ${full ? "p-8" : "p-6"}`}
      style={{ boxShadow: "0 1px 1px rgba(184,147,76,0.15), 0 24px 48px -22px rgba(214,132,151,0.4)" }}
    >
      <div className="flex flex-col items-center text-center">
        {profile.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoDataUrl} alt={profile.displayName} className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full object-cover ring-4 ring-[#e6c583]/50`} />
        ) : (
          <div
            className={`flex ${full ? "h-28 w-28 text-2xl" : "h-20 w-20 text-lg"} items-center justify-center rounded-full font-bold text-white ring-4 ring-[#e6c583]/50`}
            style={{ backgroundImage: "linear-gradient(135deg, #e6c583 0%, #d68497 100%)" }}
          >
            {initials(profile.displayName) || "IN"}
          </div>
        )}
        <p className={`mt-4 ${full ? "text-2xl" : "text-lg"} font-extrabold text-[#3a1f24]`}>
          {profile.displayName || "Your name"}
        </p>
        <p className="text-sm text-[#3a1f24]/50">
          @{profile.username || "username"} {profile.category ? `· ${profile.category}` : ""}
        </p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#3a1f24]/70">{profile.bio}</p>

        <div
          className="mt-4 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 shadow-[0_8px_16px_-8px_rgba(184,147,76,0.5)]"
          style={{ backgroundImage: "linear-gradient(135deg, #e6c583 0%, #d68497 100%)" }}
        >
          <Users className="h-3.5 w-3.5 text-white" />
          <span className="text-xs font-bold text-white">{formatCount(totalAudience)} total fanbase</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <StatCell icon={<InstagramIcon className="h-4 w-4 text-[#b8934c]" />} value={socials.instagram.followers} />
        <StatCell icon={<YoutubeIcon className="h-4 w-4 text-[#b8934c]" />} value={socials.youtube.subscribers} />
        <StatCell icon={<FacebookIcon className="h-4 w-4 text-[#b8934c]" />} value={socials.facebook.followers} />
      </div>

      {series.length > 0 && (
        <div className="mt-6 space-y-2">
          {series.slice(0, full ? undefined : 2).map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-sm">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundImage: "linear-gradient(135deg, #e6c583 0%, #d68497 100%)" }}
              >
                <Play className="h-4 w-4 fill-white text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#3a1f24]">{s.title}</p>
                <p className="text-xs text-[#3a1f24]/40">{s.seasons.length} season{s.seasons.length !== 1 ? "s" : ""}</p>
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
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-white py-3 text-[#3a1f24] shadow-sm">
      {icon}
      <span className="text-xs font-bold">{value > 0 ? formatCount(value) : "—"}</span>
    </div>
  );
}
