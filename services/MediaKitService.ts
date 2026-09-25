import { MediaKitPackage, MediaKitSettings } from "@/types";

const PACKAGES_STORAGE_KEY = "inflixo_mediakit_packages";
const SETTINGS_STORAGE_KEY = "inflixo_mediakit_settings";

export const DEFAULT_PACKAGES: MediaKitPackage[] = [];

export const SAMPLE_PACKAGES: MediaKitPackage[] = [
  {
    id: "pkg_insta_single",
    title: "Instagram Reel",
    platform: "Instagram Reel",
    deliverables: [
      "1 x 30–60s Dedicated Reel",
      "Brand Collaborator Tag",
      "Direct Promo Link in Bio (24 Hours)",
      "Pinned Comment with Tracked Link",
      "Raw Video Footage (Optional)",
    ],
    price: "₹10,000",
    turnaroundDays: 2,
    badge: "Most Popular",
    isPopular: true,
    isActive: true,
  },
  {
    id: "pkg_yt_integration",
    title: "YouTube Integration",
    platform: "YouTube Video Integration",
    deliverables: [
      "60–90s Brand Integration",
      "Product Mention & Showcase",
      "Link in Description",
      "Community Post (Optional)",
      "Raw Footage (Optional)",
    ],
    price: "₹25,000",
    turnaroundDays: 4,
    badge: "",
    isPopular: false,
    isActive: true,
  },
  {
    id: "pkg_insta_bundle",
    title: "Instagram Bundle",
    platform: "Instagram Bundle",
    deliverables: [
      "1 x Reel (30–60s)",
      "2 x Instagram Stories",
      "Brand Tag & Location Tag",
      "Exclusive Discount Code",
      "Link in Bio (24 Hours)",
    ],
    price: "₹18,000",
    turnaroundDays: 2,
    badge: "",
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

  static async fetchFromDb(identifier: string, creatorId?: string): Promise<{ settings: MediaKitSettings; packages: MediaKitPackage[] }> {
    try {
      if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
        return {
          settings: { sponsorEmail: "", whatsappNumber: "", minBudget: "", bioHighlight: "", acceptingSponsors: true, preferredCategories: [] },
          packages: [],
        };
      }
      let queryUrl = `/api/creator/mediakit?`;
      if (creatorId) {
        queryUrl += `creatorId=${encodeURIComponent(creatorId)}&`;
      }
      const paramKey = identifier.includes("@") ? "email" : "username";
      queryUrl += `${paramKey}=${encodeURIComponent(identifier.trim())}`;


      const httpResponse = await fetch(queryUrl);
      if (!httpResponse.ok) throw new Error("DB fetch failed");
      const apiResponse = await httpResponse.json();
      if (apiResponse.status === 1 || apiResponse.success) {
        const settings = apiResponse.data?.settings || apiResponse.settings;
        const packages = apiResponse.data?.packages || apiResponse.packages;
        return {
          settings: settings || { sponsorEmail: "", whatsappNumber: "", minBudget: "", bioHighlight: "", acceptingSponsors: true, preferredCategories: [] },
          packages: packages || [],
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

  static async saveToDb(email: string, settings: MediaKitSettings, packages: MediaKitPackage[], creatorId?: string): Promise<boolean> {
    try {
      const httpResponse = await fetch("/api/creator/mediakit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId, email, settings, packages }),
      });
      const apiResponse = await httpResponse.json().catch(() => null);
      return httpResponse.ok && (apiResponse?.status === 1 || apiResponse?.success === true);
    } catch (e) {
      console.warn("MediaKit DB save error:", e);
      return false;
    }
  }
}
