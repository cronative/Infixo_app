import { themeRepository, authRepository, subscriptionRepository } from "@/repositories/localRepository";
import { ThemeKey, ThemeMeta } from "@/types";

export const THEME_LIST: ThemeMeta[] = [
  {
    key: "minimal-white",
    name: "Minimal White",
    description: "Clean, airy and distraction-free.",
    swatch: ["#ffffff", "#14121a", "#ece9f4"],
  },
  {
    key: "modern-purple",
    name: "Modern Purple",
    description: "Inflixo's signature bold purple look.",
    swatch: ["#7c3aed", "#ede9fe", "#14121a"],
  },
  {
    key: "midnight",
    name: "Midnight",
    description: "Deep navy with electric highlights.",
    swatch: ["#0f0b1e", "#7c3aed", "#f3f0fb"],
  },
  {
    key: "ocean-blue",
    name: "Ocean Blue",
    description: "Fresh blues for a calm, trustworthy feel.",
    swatch: ["#3b82f6", "#eaf2ff", "#0b1220"],
  },
  {
    key: "sunset",
    name: "Sunset",
    description: "Warm gradient tones for bold creators.",
    swatch: ["#f97316", "#ec4899", "#fff7ed"],
  },
  {
    key: "forest",
    name: "Forest",
    description: "Earthy sage greens for outdoors & wellness creators.",
    swatch: ["#2f6b4f", "#eef5ec", "#132a1c"],
  },
  {
    key: "rose-gold",
    name: "Rose Gold",
    description: "Blush pink and champagne gold, editorial and soft.",
    swatch: ["#e6c583", "#fbe9ec", "#3a1f24"],
  },
  {
    key: "mono",
    name: "Mono",
    description: "Stark black & white, high-contrast and editorial.",
    swatch: ["#000000", "#ffffff", "#a3a3a3"],
  },
  {
    key: "neon-pulse",
    name: "Neon Pulse",
    description: "Dark and electric — built for gaming & tech creators.",
    swatch: ["#0a0a12", "#22d3ee", "#e879f9"],
  },
  {
    key: "pastel-dream",
    name: "Pastel Dream",
    description: "Soft lavender, mint & peach — a gentle GenZ gradient.",
    swatch: ["#e9d5ff", "#bbf7d0", "#fed7aa"],
  },
  {
    key: "cyberpunk",
    name: "Cyberpunk",
    description: "Dark obsidian with electric magenta & cyan neon highlights.",
    swatch: ["#09090b", "#ec4899", "#06b6d4"],
  },
  {
    key: "emerald-luxe",
    name: "Emerald Luxe",
    description: "Deep royal emerald green with polished gold foil accents.",
    swatch: ["#064e3b", "#e6c583", "#022c22"],
  },
  {
    key: "crimson-velvet",
    name: "Crimson Velvet",
    description: "Rich dark velvet red with warm amber glow.",
    swatch: ["#881337", "#fbbf24", "#4c0519"],
  },
  {
    key: "solar-flare",
    name: "Solar Flare",
    description: "High energy warm amber yellow & coral orange gradient.",
    swatch: ["#f59e0b", "#ea580c", "#fffbeb"],
  },
  {
    key: "lavender-haze",
    name: "Lavender Haze",
    description: "Soft dreamy lilac gradient with glassmorphic glow.",
    swatch: ["#a855f7", "#e9d5ff", "#faf5ff"],
  },
  {
    key: "nordic-frost",
    name: "Nordic Frost",
    description: "Icy blue and crisp snow-white Scandinavian design.",
    swatch: ["#0284c7", "#e0f2fe", "#0c4a6e"],
  },
  {
    key: "golden-hour",
    name: "Golden Hour",
    description: "Warm sunset champagne gold with bronze typography.",
    swatch: ["#d97706", "#fef3c7", "#78350f"],
  },
  {
    key: "cosmic-galaxy",
    name: "Cosmic Galaxy",
    description: "Deep purple cosmos nebula with starry violet sparkle.",
    swatch: ["#312e81", "#c084fc", "#1e1b4b"],
  },
  {
    key: "tokyo-drift",
    name: "Tokyo Drift",
    description: "Midnight dark mode with hot neon pink & purple lighting.",
    swatch: ["#030712", "#f43f5e", "#8b5cf6"],
  },
  {
    key: "retro-synth",
    name: "Retro Synth",
    description: "80s synthwave sunset with neon purple, hot pink & teal.",
    swatch: ["#581c87", "#f43f5e", "#14b8a6"],
  },
];

export const THEME_PAGE_BACKGROUNDS: Record<string, string> = {
  "minimal-white": "bg-slate-100/90 text-slate-900",
  "modern-purple": "bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-slate-900/90 text-white",
  midnight: "bg-slate-950/90 text-white",
  "ocean-blue": "bg-gradient-to-br from-blue-900/80 via-sky-900/80 to-slate-900/90 text-white",
  sunset: "bg-gradient-to-br from-orange-600/80 via-rose-600/80 to-purple-700/85 text-white",
  forest: "bg-gradient-to-br from-emerald-900/80 via-teal-900/80 to-slate-900/90 text-white",
  "rose-gold": "bg-gradient-to-br from-rose-100/80 via-pink-50/80 to-amber-50/85 text-slate-900",
  mono: "bg-slate-950/95 text-white",
  "neon-pulse": "bg-gradient-to-br from-purple-950/85 via-slate-950/90 to-fuchsia-950/85 text-white",
  "pastel-dream": "bg-gradient-to-br from-purple-100/80 via-pink-100/80 to-amber-50/85 text-slate-900",
  cyberpunk: "bg-gradient-to-br from-zinc-950/90 via-slate-900/90 to-cyan-950/85 text-white",
  "emerald-luxe": "bg-gradient-to-br from-emerald-950/85 via-teal-950/85 to-emerald-900/90 text-white",
  "crimson-velvet": "bg-gradient-to-br from-rose-950/85 via-red-950/85 to-rose-900/90 text-white",
  "solar-flare": "bg-gradient-to-br from-amber-600/80 via-orange-600/80 to-yellow-600/85 text-white",
  "lavender-haze": "bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-fuchsia-950/85 text-white",
  "nordic-frost": "bg-gradient-to-br from-sky-900/80 via-blue-950/85 to-slate-900/90 text-white",
  "golden-hour": "bg-gradient-to-br from-amber-600/80 via-orange-600/80 to-amber-700/85 text-white",
  "cosmic-galaxy": "bg-gradient-to-br from-indigo-950/85 via-purple-950/85 to-slate-950/90 text-white",
  "tokyo-drift": "bg-gradient-to-br from-rose-950/85 via-purple-950/85 to-slate-950/90 text-white",
  "retro-synth": "bg-gradient-to-br from-fuchsia-950/85 via-purple-950/85 to-pink-950/90 text-white",
};

export const ThemeService = {
  getSelectedTheme(): ThemeKey {
    return themeRepository.get();
  },

  setSelectedTheme(themeKey: ThemeKey, isDashboardChange = false): void {
    themeRepository.save(themeKey);
    const email = authRepository.getPendingEmail();
    if (email) {
      fetch("/api/creator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          themeKey,
          incrementThemeCount: isDashboardChange,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && typeof data.profile?.themeChangesCount === "number") {
            this.syncThemeChangesCount(data.profile.themeChangesCount);
          }
        })
        .catch((e) => console.error("Failed to save themeKey to MySQL DB:", e));
    }
  },

  syncThemeChangesCount(count: number): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("inflixo_theme_changes_count", count.toString());
    }
  },

  getThemeChangesCount(): number {
    if (typeof window === "undefined") return 0;
    const val = localStorage.getItem("inflixo_theme_changes_count");
    return val ? parseInt(val, 10) || 0 : 0;
  },

  incrementThemeChangesCount(): number {
    if (typeof window === "undefined") return 0;
    const current = this.getThemeChangesCount();
    const updated = current + 1;
    localStorage.setItem("inflixo_theme_changes_count", updated.toString());
    return updated;
  },

  checkThemeChangeLimit(): { allowed: boolean; isPro: boolean; remaining: number; count: number } {
    return { allowed: true, isPro: true, remaining: Infinity, count: 0 };
  },

  getThemeMeta(themeKey: ThemeKey): ThemeMeta {
    return THEME_LIST.find((t) => t.key === themeKey) ?? THEME_LIST[1];
  },

  list(): ThemeMeta[] {
    return THEME_LIST;
  },
};
