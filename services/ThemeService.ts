import { themeRepository, authRepository, subscriptionRepository } from "@/repositories/localRepository";
import { ThemeKey, ThemeMeta } from "@/types";

export const THEME_LIST: ThemeMeta[] = [
  // ---------------------------------------------------------------------------
  // 1. LIGHT BACKGROUND THEMES (10 Themes)
  // ---------------------------------------------------------------------------
  {
    key: "minimal-white",
    name: "Minimal White",
    description: "Clean, crisp and distraction-free white canvas.",
    swatch: ["#FFFFFF", "#F8FAFC", "#0F172A"],
    group: "light",
  },
  {
    key: "signature-purple",
    name: "Signature Purple",
    description: "Light lavender card with Inflixo signature purple typography.",
    swatch: ["#faf5ff", "#7c3aed", "#e9d5ff"],
    group: "light",
  },
  {
    key: "pastel-dream",
    name: "Pastel Dream",
    description: "Soft blush pink & warm cream pastel gradient.",
    swatch: ["#e9d5ff", "#bbf7d0", "#fed7aa"],
    group: "light",
  },
  {
    key: "matcha-cream",
    name: "Matcha Cream",
    description: "Soft Japanese green matcha & warm vanilla cream.",
    swatch: ["#dcfce7", "#fef3c7", "#14532d"],
    group: "light",
  },
  {
    key: "cloud-fluff",
    name: "Cloud Fluff",
    description: "Airy sky blue & soft white marshmallow gradient.",
    swatch: ["#e0f2fe", "#f0f9ff", "#0369a1"],
    group: "light",
  },
  {
    key: "boba-milk",
    name: "Boba Milk",
    description: "Warm brown sugar boba & cozy milk tea cream tones.",
    swatch: ["#fef3c7", "#ffedd5", "#78350f"],
    group: "light",
  },
  {
    key: "sakura-pink",
    name: "Sakura Pink",
    description: "Soft Japanese cherry blossom pink with warm spring aesthetic.",
    swatch: ["#fce7f3", "#fbcfe8", "#831843"],
    group: "light",
  },
  {
    key: "nordic-frost",
    name: "Nordic Frost",
    description: "Clean Scandinavian snow white & icy blue layout.",
    swatch: ["#f0f9ff", "#e0f2fe", "#0284c7"],
    group: "light",
  },
  {
    key: "sand-linen",
    name: "Sand Linen",
    description: "Minimalist beige linen & warm sand cream aesthetic.",
    swatch: ["#f5f5f4", "#fafaf9", "#44403c"],
    group: "light",
  },
  {
    key: "golden-hour",
    name: "Golden Hour",
    description: "Sunset champagne gold display name shimmer with warm cream card.",
    swatch: ["#fef3c7", "#f59e0b", "#78350f"],
    group: "light",
    isShimmer: true,
  },

  // ---------------------------------------------------------------------------
  // 2. SHIMMER & GLOW HIGHLIGHT THEMES (10 Themes)
  // ---------------------------------------------------------------------------
  {
    key: "shimmer-gold",
    name: "Shimmer Gold",
    description: "Champagne gold display name shimmer with golden particle glow.",
    swatch: ["#fef3c7", "#f59e0b", "#78350f"],
    group: "shimmer",
    isShimmer: true,
  },
  {
    key: "holographic-wave",
    name: "Holographic Wave",
    description: "Iridescent rainbow shimmer display name effect.",
    swatch: ["#e0e7ff", "#a855f7", "#ec4899"],
    group: "shimmer",
    isShimmer: true,
  },
  {
    key: "aurora-borealis",
    name: "Aurora Glow",
    description: "Emerald & violet display name glow with dark aura card.",
    swatch: ["#022c22", "#10b981", "#8b5cf6"],
    group: "shimmer",
    isShimmer: true,
  },
  {
    key: "electric-cyber",
    name: "Electric Cyber",
    description: "Neon cyan fanbase counter pulse ring with obsidian dark card.",
    swatch: ["#09090b", "#06b6d4", "#3b82f6"],
    group: "shimmer",
    isShimmer: true,
  },
  {
    key: "luminous-pearl",
    name: "Luminous Pearl",
    description: "Soft pearl white display name shimmer for premium luxury feel.",
    swatch: ["#ffffff", "#f1f5f9", "#cbd5e1"],
    group: "shimmer",
    isShimmer: true,
  },
  {
    key: "cosmic-pulse",
    name: "Cosmic Pulse",
    description: "Starry violet fanbase counter pulse with cosmic dust.",
    swatch: ["#1e1b4b", "#c084fc", "#e879f9"],
    group: "shimmer",
    isShimmer: true,
  },
  {
    key: "neon-pulse",
    name: "Neon Pulse",
    description: "Electric cyber fanbase counter pulse for tech & gaming creators.",
    swatch: ["#0a0a12", "#22d3ee", "#e879f9"],
    group: "shimmer",
    isShimmer: true,
  },
  {
    key: "cyberpunk",
    name: "Cyberpunk",
    description: "Magenta & cyan neon display name shimmer with dark obsidian card.",
    swatch: ["#09090b", "#ec4899", "#06b6d4"],
    group: "shimmer",
    isShimmer: true,
  },
  {
    key: "tokyo-drift",
    name: "Tokyo Drift",
    description: "Hot pink neon display name glow with Tokyo street dark mode.",
    swatch: ["#030712", "#f43f5e", "#8b5cf6"],
    group: "shimmer",
    isShimmer: true,
  },
  {
    key: "retro-synth",
    name: "Retro Synth",
    description: "80s synthwave sunset display name gradient pulse.",
    swatch: ["#581c87", "#f43f5e", "#14b8a6"],
    group: "shimmer",
    isShimmer: true,
  },

  // ---------------------------------------------------------------------------
  // 3. DARK & RICH TONES (10 Themes)
  // ---------------------------------------------------------------------------
  {
    key: "modern-purple",
    name: "Modern Purple",
    description: "Inflixo's signature bold purple dark look.",
    swatch: ["#7c3aed", "#ede9fe", "#14121a"],
    group: "dark",
  },
  {
    key: "midnight",
    name: "Midnight",
    description: "Deep navy with electric highlights.",
    swatch: ["#0f0b1e", "#7c3aed", "#f3f0fb"],
    group: "dark",
  },
  {
    key: "ocean-blue",
    name: "Ocean Blue",
    description: "Fresh blues for a calm, trustworthy feel.",
    swatch: ["#3b82f6", "#eaf2ff", "#0b1220"],
    group: "dark",
  },
  {
    key: "sunset",
    name: "Sunset",
    description: "Warm gradient tones for bold creators.",
    swatch: ["#f97316", "#ec4899", "#fff7ed"],
    group: "dark",
  },
  {
    key: "forest",
    name: "Forest",
    description: "Earthy sage greens for outdoors & wellness creators.",
    swatch: ["#2f6b4f", "#eef5ec", "#132a1c"],
    group: "dark",
  },
  {
    key: "mono",
    name: "Mono",
    description: "Stark black & white, high-contrast and editorial.",
    swatch: ["#000000", "#ffffff", "#a3a3a3"],
    group: "dark",
  },
  {
    key: "emerald-luxe",
    name: "Emerald Luxe",
    description: "Deep royal emerald green with polished gold foil accents.",
    swatch: ["#064e3b", "#e6c583", "#022c22"],
    group: "dark",
  },
  {
    key: "crimson-velvet",
    name: "Crimson Velvet",
    description: "Rich dark velvet red with warm amber glow.",
    swatch: ["#881337", "#fbbf24", "#4c0519"],
    group: "dark",
  },
  {
    key: "solar-flare",
    name: "Solar Flare",
    description: "High energy warm amber yellow & coral orange gradient.",
    swatch: ["#f59e0b", "#ea580c", "#fffbeb"],
    group: "dark",
  },
  {
    key: "lavender-haze",
    name: "Lavender Haze",
    description: "Soft dreamy lilac gradient with glassmorphic glow.",
    swatch: ["#a855f7", "#e9d5ff", "#faf5ff"],
    group: "dark",
  },
];

export const THEME_PAGE_BACKGROUNDS: Record<string, string> = {
  "minimal-white": "bg-slate-100/90 text-slate-900",
  "signature-purple": "bg-purple-50/90 text-slate-900",
  "pastel-dream": "bg-gradient-to-br from-purple-100/80 via-pink-100/80 to-amber-50/85 text-slate-900",
  "matcha-cream": "bg-gradient-to-br from-emerald-50/90 via-green-50/80 to-amber-50/80 text-slate-900",
  "cloud-fluff": "bg-gradient-to-br from-sky-50/90 via-blue-50/80 to-indigo-50/80 text-slate-900",
  "boba-milk": "bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-stone-100/80 text-slate-900",
  "sakura-pink": "bg-gradient-to-br from-pink-50/90 via-rose-50/80 to-purple-50/80 text-slate-900",
  "nordic-frost": "bg-gradient-to-br from-sky-50/90 via-blue-50/80 to-slate-100/90 text-slate-900",
  "sand-linen": "bg-gradient-to-br from-stone-100/90 via-amber-50/80 to-neutral-100/80 text-slate-900",
  "golden-hour": "bg-gradient-to-br from-amber-50/90 via-yellow-50/90 to-amber-100/80 text-slate-900",
  "modern-purple": "bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-slate-900/90 text-white",
  midnight: "bg-slate-950/90 text-white",
  "ocean-blue": "bg-gradient-to-br from-blue-900/80 via-sky-900/80 to-slate-900/90 text-white",
  sunset: "bg-gradient-to-br from-orange-600/80 via-rose-600/80 to-purple-700/85 text-white",
  forest: "bg-gradient-to-br from-emerald-900/80 via-teal-900/80 to-slate-900/90 text-white",
  "rose-gold": "bg-gradient-to-br from-rose-100/80 via-pink-50/80 to-amber-50/85 text-slate-900",
  mono: "bg-slate-950/95 text-white",
  "neon-pulse": "bg-gradient-to-br from-purple-950/85 via-slate-950/90 to-fuchsia-950/85 text-white",
  cyberpunk: "bg-gradient-to-br from-zinc-950/90 via-slate-900/90 to-cyan-950/85 text-white",
  "emerald-luxe": "bg-gradient-to-br from-emerald-950/85 via-teal-950/85 to-emerald-900/90 text-white",
  "crimson-velvet": "bg-gradient-to-br from-rose-950/85 via-red-950/85 to-rose-900/90 text-white",
  "solar-flare": "bg-gradient-to-br from-amber-600/80 via-orange-600/80 to-yellow-600/85 text-white",
  "lavender-haze": "bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-fuchsia-950/85 text-white",
  "cosmic-galaxy": "bg-gradient-to-br from-indigo-950/85 via-purple-950/85 to-slate-950/90 text-white",
  "tokyo-drift": "bg-gradient-to-br from-rose-950/85 via-purple-950/85 to-slate-950/90 text-white",
  "retro-synth": "bg-gradient-to-br from-fuchsia-950/85 via-purple-950/85 to-pink-950/90 text-white",
  "shimmer-gold": "bg-gradient-to-br from-amber-100/90 via-yellow-50/90 to-amber-200/80 text-slate-900",
  "holographic-wave": "bg-gradient-to-br from-indigo-100/90 via-purple-100/90 to-pink-100/90 text-slate-900",
  "aurora-borealis": "bg-gradient-to-br from-emerald-950/90 via-teal-950/90 to-purple-950/90 text-white",
  "electric-cyber": "bg-gradient-to-br from-slate-950/95 via-cyan-950/90 to-blue-950/90 text-white",
  "luminous-pearl": "bg-gradient-to-br from-slate-100/90 via-white to-purple-50/80 text-slate-900",
  "cosmic-pulse": "bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/95 text-white",
  "sakura-blossom": "bg-gradient-to-br from-pink-50/90 via-rose-50/80 to-purple-50/80 text-slate-900",
  "sand-dune": "bg-gradient-to-br from-stone-100/90 via-amber-50/80 to-neutral-100/80 text-slate-900",
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
