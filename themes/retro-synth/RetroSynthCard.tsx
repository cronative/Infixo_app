import { Users, Play, Radio } from "lucide-react";
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

export function RetroSynthCard({ profile, socials, series, variant = "compact" }: ThemeCardProps) {
  const full = variant === "full";
  const insta = getHandle(socials.instagram.url);
  const yt = getHandle(socials.youtube.url);
  const fb = getHandle(socials.facebook.url);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl ${full ? "p-8" : "p-6"} text-fuchsia-100 bg-gradient-to-br from-purple-950 via-fuchsia-950 to-teal-950 border border-fuchsia-500/30 shadow-[0_15px_35px_rgba(217,70,239,0.3)]`}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
      
      <div className="relative flex flex-col items-center text-center">
        {profile.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoDataUrl} alt={profile.displayName} className={`${full ? "h-28 w-28" : "h-20 w-20"} rounded-full border-4 border-teal-400/50 object-cover shadow-lg`} />
        ) : (
          <div className={`flex ${full ? "h-28 w-28 text-2xl" : "h-20 w-20 text-lg"} items-center justify-center rounded-full border-4 border-teal-400/50 bg-fuchsia-900/60 font-bold text-teal-300 shadow-lg`}>
            {initials(profile.displayName) || "RS"}
          </div>
        )}
        <p className={`font-display mt-4 ${full ? "text-2xl" : "text-lg"} font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-pink-300 to-teal-300 uppercase tracking-widest`}>
          {profile.displayName || "SYNTHWAVE"}
        </p>
        <p className="font-mono text-xs text-teal-300 mt-0.5">
          @{profile.username || "username"} {profile.category ? `· ${profile.category}` : ""}
        </p>
        <p className="mt-3 max-w-sm text-xs leading-relaxed text-fuchsia-100/85">{profile.bio}</p>

        <div className="mt-4 flex items-center gap-1.5 rounded-full bg-fuchsia-900/40 border border-teal-400/40 px-3.5 py-1 text-teal-300 text-xs font-mono">
          <Radio className="h-3.5 w-3.5 text-teal-400" />
          <span>SYNTH 1984</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <SocialTile icon={<InstagramIcon className="h-4 w-4 text-fuchsia-300" />} label="Insta" handle={insta} />
        <SocialTile icon={<YoutubeIcon className="h-4 w-4 text-teal-300" />} label="YouTube" handle={yt} />
        <SocialTile icon={<FacebookIcon className="h-4 w-4 text-pink-300" />} label="FB" handle={fb} />
      </div>

      {series.length > 0 && (
        <div className="mt-6 space-y-2">
          {series.slice(0, full ? undefined : 2).map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-950/60 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/20 text-teal-300">
                <Play className="h-4 w-4 fill-teal-300" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-fuchsia-100 font-mono">{s.title}</p>
                <p className="text-[10px] text-teal-300/70">{s.seasons.length} season(s)</p>
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
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-950/60 py-2.5 px-1 font-mono">
      {icon}
      <span className="text-[11px] font-bold text-fuchsia-100 truncate max-w-full">{handle ? `@${handle}` : "—"}</span>
      <span className="text-[9px] text-teal-300/60">{label}</span>
    </div>
  );
}
