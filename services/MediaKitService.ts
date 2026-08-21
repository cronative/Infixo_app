import { MediaKitPackage, MediaKitSettings } from "@/types";

const PACKAGES_STORAGE_KEY = "inflixo_mediakit_packages";
const SETTINGS_STORAGE_KEY = "inflixo_mediakit_settings";

export const DEFAULT_PACKAGES: MediaKitPackage[] = [];

export const SAMPLE_PACKAGES: MediaKitPackage[] = [
  {
    id: "pkg_insta_single",
    title: "1x High-Engagement Instagram Reel",
    platform: "Instagram Reel",
    deliverables: [
      "1x 30–60s Dedicated/Integrated Reel",
      "Brand Collaborator Tag & Co-authoring",
      "Direct Link/Promo Code in Bio (24 Hours)",
      "30 Days Digital Usage Rights",
    ],
    price: "₹2,000",
    turnaroundDays: 2,
    badge: "Starter",
    isPopular: false,
    isActive: true,
  },
  {
    id: "pkg_insta_3x_bundle",
    title: "3x Reels Mini-Campaign Pack",
    platform: "Instagram Bundle",
    deliverables: [
      "3x Targeted Instagram Reels (Storyline/Trend sequence)",
      "3x Supporting Instagram Story Slides with Direct Swipe/Link",
      "Collaborator Tag & Audio License",
      "45 Days Brand Usage Rights",
    ],
    price: "₹5,400",
    turnaroundDays: 5,
    badge: "⚡ Save 10%",
    isPopular: false,
    isActive: true,
  },
  {
    id: "pkg_insta_5x_bundle",
    title: "5x Reels Brand Growth Bundle",
    platform: "Instagram Bundle",
    deliverables: [
      "5x High-Retention Instagram Reels",
      "5x Companion Instagram Stories with Links",
      "Pinned Comment with Tracked Promo Link",
      "Priority 7-Day Fast Turnaround",
      "60 Days Brand Usage Rights",
    ],
    price: "₹8,500",
    turnaroundDays: 7,
    badge: "⭐ MOST POPULAR (15% OFF)",
    isPopular: true,
    isActive: true,
  },
  {
    id: "pkg_insta_10x_retainer",
    title: "10x Bulk Reels Monthly Sponsorship",
    platform: "Monthly Retainer",
    deliverables: [
      "10x Full Production Reels across the month",
      "Dedicated Show/Series Title Sponsorship Branding",
      "Permanent Bio Link Placement for 30 Days",
      "Raw High-Res Footage Access for Brand Ads",
      "Full Commercial & Whitelisting Rights (90 Days)",
    ],
    price: "₹15,000",
    turnaroundDays: 15,
    badge: "🔥 BEST VALUE (25% OFF)",
    isPopular: false,
    isActive: true,
  },
];

export const DEFAULT_SETTINGS: MediaKitSettings = {
  sponsorEmail: "",
  whatsappNumber: "",
  bioHighlight: "",
  acceptingSponsors: true,
  minBudget: "",
  preferredCategories: ["Technology & AI", "Entertainment", "Lifestyle", "Gaming"],
};

export class MediaKitService {
  static DEFAULT_PACKAGES = DEFAULT_PACKAGES;
  static DEFAULT_SETTINGS = DEFAULT_SETTINGS;

  static getPackages(): MediaKitPackage[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(PACKAGES_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      const parsed: MediaKitPackage[] = JSON.parse(stored);
      // Strip out seed packages if present
      const seedIds = ["pkg_insta_single", "pkg_insta_3x_bundle", "pkg_insta_5x_bundle", "pkg_insta_10x_retainer", "pkg_yt_dedicated", "pkg_insta_bundle", "pkg_series_sponsor"];
      const cleaned = parsed.filter((p) => !seedIds.includes(p.id));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
    }
  }

  static resetToDefaults(): MediaKitPackage[] {
    if (typeof window !== "undefined") {
      localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }
    return [];
  }

  static savePackages(packages: MediaKitPackage[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(packages));
    } catch (e) {
      console.error("Error saving media kit packages to localStorage:", e);
    }
  }

  static addPackage(pkg: Omit<MediaKitPackage, "id">): MediaKitPackage {
    const packages = this.getPackages();
    const newPkg: MediaKitPackage = {
      ...pkg,
      id: `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    const updated = [newPkg, ...packages];
    this.savePackages(updated);
    return newPkg;
  }

  static updatePackage(id: string, updates: Partial<MediaKitPackage>): MediaKitPackage[] {
    const packages = this.getPackages();
    const updated = packages.map((p) => (p.id === id ? { ...p, ...updates } : p));
    this.savePackages(updated);
    return updated;
  }

  static deletePackage(id: string): MediaKitPackage[] {
    const packages = this.getPackages();
    const updated = packages.filter((p) => p.id !== id);
    this.savePackages(updated);
    return updated;
  }

  static getSettings(): MediaKitSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: MediaKitSettings): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Error saving media kit settings to localStorage:", e);
    }
  }

  static async fetchFromDb(identifier: string): Promise<{ settings: MediaKitSettings; packages: MediaKitPackage[] }> {
    try {
      const paramKey = identifier.includes("@") ? "email" : "username";
      const res = await fetch(`/api/creator/mediakit?${paramKey}=${encodeURIComponent(identifier)}`);
      if (!res.ok) throw new Error("DB fetch failed");
      const data = await res.json();
      if (data.success) {
        return {
          settings: data.settings || { sponsorEmail: "", whatsappNumber: "", minBudget: "", bioHighlight: "", acceptingSponsors: true, preferredCategories: [] },
          packages: data.packages || [],
        };
      }
    } catch (e) {
      console.warn("MediaKit DB fetch error:", e);
    }
    return {
      settings: { sponsorEmail: "", whatsappNumber: "", minBudget: "", bioHighlight: "", acceptingSponsors: true, preferredCategories: [] },
      packages: [],
    };
  }

  static async saveToDb(email: string, settings: MediaKitSettings, packages: MediaKitPackage[]): Promise<boolean> {
    try {
      const res = await fetch("/api/creator/mediakit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, settings, packages }),
      });
      return res.ok;
    } catch (e) {
      console.warn("MediaKit DB save error:", e);
      return false;
    }
  }
}
