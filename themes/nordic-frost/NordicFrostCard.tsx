import { Users, Play, Compass } from "lucide-react";
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

export function NordicFrostCard({ profile, socials, series, variant = "compact" }: ThemeCardProps) {
  const full = variant === "full";
  const insta = getHandle(socials.instagram.url);
  const yt = getHandle(socials.youtube.url);
  const fb = getHandle(socials.facebook.url);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl ${full ? "p-8" : "p-6"} text-sky-950 bg-gradient-to-br from-slate-50 via-sky-50 to-blue-100 border border-sky-200 shadow-[0_15px_35px_rgba(2,132,199,0.15)]`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-200/50 blur-3xl" />
      
      <div className="relative flex flex-col items-center text-center">
        {profile.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoDataUrl} alt={profile.displayName} className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full border-4 border-sky-200 object-cover shadow-md`} />
        ) : (
          <div className={`flex ${full ? "h-28 w-28 text-2xl" : "h-20 w-20 text-lg"} items-center justify-center rounded-full border-4 border-sky-200 bg-sky-100 font-bold text-sky-800 shadow-md`}>
            {initials(profile.displayName) || "NF"}
          </div>
        )}
        <p className={`font-sans mt-4 ${full ? "text-2xl" : "text-lg"} font-extrabold text-sky-950 tracking-tight`}>
          {profile.displayName || "Your name"}
        </p>
        <p className="text-xs text-sky-700 font-semibold mt-0.5">
          @{profile.username || "username"} {profile.category ? `· ${profile.category}` : ""}
        </p>
        <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-700">{profile.bio}</p>

        <div className="mt-4 flex items-center gap-1.5 rounded-full bg-sky-100 border border-sky-300 px-3.5 py-1 text-sky-900 text-xs font-bold">
          <Compass className="h-3.5 w-3.5 text-sky-600" />
          <span>NORDIC FROST</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <SocialTile icon={<InstagramIcon className="h-4 w-4 text-sky-600" />} label="Insta" handle={insta} />
        <SocialTile icon={<YoutubeIcon className="h-4 w-4 text-sky-600" />} label="YouTube" handle={yt} />
        <SocialTile icon={<FacebookIcon className="h-4 w-4 text-sky-600" />} label="FB" handle={fb} />
      </div>

      {series.length > 0 && (
        <div className="mt-6 space-y-2">
          {series.slice(0, full ? undefined : 2).map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-white/80 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white">
                <Play className="h-4 w-4 fill-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-sky-950">{s.title}</p>
                <p className="text-[10px] text-sky-700">{s.seasons.length} season(s)</p>
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
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-sky-200 bg-white/70 py-2.5 px-1">
      {icon}
      <span className="text-[11px] font-bold text-sky-950 truncate max-w-full">{handle ? `@${handle}` : "—"}</span>
      <span className="text-[9px] text-sky-700/70">{label}</span>
    </div>
  );
}
