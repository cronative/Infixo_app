import { MediaKitPackage, MediaKitSettings } from "@/types";

const PACKAGES_STORAGE_KEY = "inflixo_mediakit_packages";
const SETTINGS_STORAGE_KEY = "inflixo_mediakit_settings";

export const DEFAULT_PACKAGES: MediaKitPackage[] = [
  {
    id: "pkg_yt_dedicated",
    title: "Dedicated YouTube Video Sponsor",
    platform: "YouTube",
    deliverables: [
      "60-90s Dedicated Integration in Main Video",
      "Custom Link & Promo Code in Top of Description",
      "Pinned Comment with Tracked Sponsor Link",
      "Social Story Announcement",
    ],
    price: "₹35,000",
    turnaroundDays: 7,
    isPopular: true,
    isActive: true,
  },
  {
    id: "pkg_insta_bundle",
    title: "Instagram Reel + Story Spotlight Bundle",
    platform: "Instagram",
    deliverables: [
      "1x 30-60s High-Engagement Instagram Reel",
      "2x Instagram Story Slides with Direct Swipe-up Link",
      "Collaborator Tag & Brand Co-Authoring",
      "Usage Rights for 30 Days",
    ],
    price: "₹18,000",
    turnaroundDays: 4,
    isPopular: false,
    isActive: true,
  },
  {
    id: "pkg_series_sponsor",
    title: "Full OTT Series Sponsorship Placement",
    platform: "Multi-Platform",
    deliverables: [
      "Title Sponsor Badge across entire OTT Video Series",
      "Opening & Closing Brand Bumpers (5-10s)",
      "Featured Banner on Public Series Detail Page",
      "Cross-Platform Distribution (YouTube + Insta + FB)",
    ],
    price: "₹50,000",
    turnaroundDays: 10,
    isPopular: true,
    isActive: true,
  },
];

export const DEFAULT_SETTINGS: MediaKitSettings = {
  sponsorEmail: "business@inflixo.com",
  bioHighlight: "Open for brand sponsorships, video integrations, and series placements.",
  acceptingSponsors: true,
  minBudget: "₹10,000",
  preferredCategories: ["Technology & AI", "Entertainment", "Lifestyle", "Gaming"],
};

export class MediaKitService {
  static DEFAULT_PACKAGES = DEFAULT_PACKAGES;
  static DEFAULT_SETTINGS = DEFAULT_SETTINGS;

  static getPackages(): MediaKitPackage[] {
    if (typeof window === "undefined") return DEFAULT_PACKAGES;
    try {
      const stored = localStorage.getItem(PACKAGES_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(DEFAULT_PACKAGES));
        return DEFAULT_PACKAGES;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PACKAGES;
    }
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
}
