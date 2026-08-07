import { Users, Play, Sun } from "lucide-react";
import { ThemeCardProps } from "@/themes/types";
import { initials } from "@/utils/format";
import { InstagramIcon, YoutubeIcon, FacebookIcon } from "@/components/shared/BrandIcons";

function getHandle(url: string): string {
  if (!url) return "";
  const cleaned = url.trim();
  if (cleaned.includes("/")) {
    const parts = cleaned.split("/").filter(Boolean);
    return parts[parts.length - 1].replace(/^@/, "");
  }
  return cleaned.replace(/^@/, "");
}

export function SolarFlareCard({ profile, socials, series, variant = "compact" }: ThemeCardProps) {
  const full = variant === "full";
  const insta = getHandle(socials.instagram.url);
  const yt = getHandle(socials.youtube.url);
  const fb = getHandle(socials.facebook.url);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl ${full ? "p-8" : "p-6"} text-amber-950 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 shadow-[0_15px_35px_rgba(245,158,11,0.35)]`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
      
      <div className="relative flex flex-col items-center text-center">
        {profile.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoDataUrl} alt={profile.displayName} className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full border-4 border-amber-950/20 object-cover shadow-md`} />
        ) : (
          <div className={`flex ${full ? "h-28 w-28 text-2xl" : "h-20 w-20 text-lg"} items-center justify-center rounded-full border-4 border-amber-950/20 bg-amber-950/10 font-bold text-amber-950 shadow-md`}>
            {initials(profile.displayName) || "SF"}
          </div>
        )}
        <p className={`font-display mt-4 ${full ? "text-2xl" : "text-lg"} font-extrabold text-amber-950 tracking-tight`}>
          {profile.displayName || "Your name"}
        </p>
        <p className="text-xs text-amber-900/80 font-bold mt-0.5">
          @{profile.username || "username"} {profile.category ? `· ${profile.category}` : ""}
        </p>
        <p className="mt-3 max-w-sm text-xs leading-relaxed text-amber-950/90 font-medium">{profile.bio}</p>

        <div className="mt-4 flex items-center gap-1.5 rounded-full bg-amber-950/10 border border-amber-950/20 px-3.5 py-1 text-amber-950 text-xs font-black">
          <Sun className="h-3.5 w-3.5 text-amber-950" />
          <span>SOLAR ENERGY</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <SocialTile icon={<InstagramIcon className="h-4 w-4 text-amber-950" />} label="Insta" handle={insta} />
        <SocialTile icon={<YoutubeIcon className="h-4 w-4 text-amber-950" />} label="YouTube" handle={yt} />
        <SocialTile icon={<FacebookIcon className="h-4 w-4 text-amber-950" />} label="FB" handle={fb} />
      </div>

      {series.length > 0 && (
        <div className="mt-6 space-y-2">
          {series.slice(0, full ? undefined : 2).map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-amber-950/10 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950 text-amber-400">
                <Play className="h-4 w-4 fill-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-amber-950">{s.title}</p>
                <p className="text-[10px] text-amber-900/70 font-semibold">{s.seasons.length} season(s)</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SocialTile({ icon, label, handle }: { icon: React.ReactNode; label: string; handle: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-amber-950/15 bg-amber-950/10 py-2.5 px-1">
      {icon}
      <span className="text-[11px] font-bold text-amber-950 truncate max-w-full">{handle ? `@${handle}` : "—"}</span>
      <span className="text-[9px] text-amber-900/70 font-medium">{label}</span>
    </div>
  );
}
