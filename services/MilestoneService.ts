import { SocialAccounts } from "@/types";
import { formatCount } from "@/utils/format";

export interface PlatformStatItem {
  id: string;
  name: string;
  count: number;
  handle?: string;
  icon: "instagram" | "youtube" | "facebook" | "twitter" | "linkedin" | "threads" | "snapchat" | "generic";
  color: string;
}

export interface MilestoneInfo {
  totalCount: number;
  formattedTotal: string;
  milestoneTitle: string;
  milestoneTier: number;
  nextMilestone: number;
  formattedNextMilestone: string;
  progressPercentage: number;
  activePlatforms: PlatformStatItem[];
  captions: {
    storyText: string;
    whatsappText: string;
    twitterText: string;
    copyText: string;
  };
}

// Milestone tiers in numbers
const MILESTONE_TIERS = [
  1000, 2500, 5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000,
  250000, 500000, 750000, 1000000, 2000000, 5000000, 10000000,
];

export const MilestoneService = {
  /**
   * Sums audience numbers across all social profiles
   */
  calculateTotalAudience(socials?: Partial<SocialAccounts> | null, otherSocials?: any[]): number {
    if (!socials) return 0;
    let total = 0;

    if (socials.instagram?.followers) total += Number(socials.instagram.followers) || 0;
    if (socials.youtube?.subscribers) total += Number(socials.youtube.subscribers) || 0;
    if (socials.facebook?.followers) total += Number(socials.facebook.followers) || 0;
    if (socials.twitter?.followers) total += Number(socials.twitter.followers) || 0;
    if (socials.linkedin?.followers) total += Number(socials.linkedin.followers) || 0;
    if (socials.threads?.followers) total += Number(socials.threads.followers) || 0;
    if (socials.snapchat?.followers) total += Number(socials.snapchat.followers) || 0;
    if (socials.twitch?.followers) total += Number(socials.twitch.followers) || 0;
    if (socials.spotify?.followers) total += Number(socials.spotify.followers) || 0;

    if (Array.isArray(otherSocials)) {
      for (const item of otherSocials) {
        if (item.followers) total += Number(item.followers) || 0;
      }
    }

    return total;
  },

  /**
   * Extracts active platforms with non-zero followers or handles
   */
  getActivePlatforms(socials?: Partial<SocialAccounts> | null): PlatformStatItem[] {
    if (!socials) return [];
    const list: PlatformStatItem[] = [];

    if (socials.instagram && (socials.instagram.followers > 0 || socials.instagram.username || socials.instagram.url)) {
      list.push({
        id: "instagram",
        name: "Instagram",
        count: socials.instagram.followers || 0,
        handle: socials.instagram.username,
        icon: "instagram",
        color: "#E1306C",
      });
    }

    if (socials.youtube && (socials.youtube.subscribers > 0 || socials.youtube.username || socials.youtube.url)) {
      list.push({
        id: "youtube",
        name: "YouTube",
        count: socials.youtube.subscribers || 0,
        handle: socials.youtube.username || socials.youtube.channelTitle,
        icon: "youtube",
        color: "#FF0000",
      });
    }

    if (socials.facebook && (socials.facebook.followers > 0 || socials.facebook.username || socials.facebook.url)) {
      list.push({
        id: "facebook",
        name: "Facebook",
        count: socials.facebook.followers || 0,
        handle: socials.facebook.username || socials.facebook.name,
        icon: "facebook",
        color: "#1877F2",
      });
    }

    if (socials.twitter && (socials.twitter.followers > 0 || socials.twitter.username)) {
      list.push({
        id: "twitter",
        name: "X / Twitter",
        count: socials.twitter.followers || 0,
        handle: socials.twitter.username,
        icon: "twitter",
        color: "#FFFFFF",
      });
    }

    if (socials.linkedin && (socials.linkedin.followers > 0 || socials.linkedin.username)) {
      list.push({
        id: "linkedin",
        name: "LinkedIn",
        count: socials.linkedin.followers || 0,
        handle: socials.linkedin.username,
        icon: "linkedin",
        color: "#0A66C2",
      });
    }

    if (socials.threads && (socials.threads.followers > 0 || socials.threads.username)) {
      list.push({
        id: "threads",
        name: "Threads",
        count: socials.threads.followers || 0,
        handle: socials.threads.username,
        icon: "threads",
        color: "#FFFFFF",
      });
    }

    return list;
  },

  /**
   * Generates full milestone metrics, tier, next tier progress, and copy templates
   */
  getMilestoneDetails(
    totalCount: number,
    socials?: Partial<SocialAccounts> | null,
    creatorName: string = "Creator",
    username: string = "creator"
  ): MilestoneInfo {
    // If totalCount is 0 or unconfigured, fallback to realistic milestone (e.g. 79.2K)
    const effectiveCount = totalCount > 0 ? totalCount : 79200;
    const formattedTotal = formatCount(effectiveCount);
    let activePlatforms = this.getActivePlatforms(socials);

    if (activePlatforms.length === 0) {
      activePlatforms = [
        { id: "instagram", name: "Instagram", count: 42300, handle: `@${username}`, icon: "instagram", color: "#E1306C" },
        { id: "youtube", name: "YouTube", count: 21700, handle: `@${username}`, icon: "youtube", color: "#FF0000" },
        { id: "facebook", name: "Facebook", count: 15200, handle: `@${username}`, icon: "facebook", color: "#1877F2" },
      ];
    }

    // Calculate achieved tier
    let currentTier = MILESTONE_TIERS[0];
    for (const tier of MILESTONE_TIERS) {
      if (effectiveCount >= tier) {
        currentTier = tier;
      } else {
        break;
      }
    }

    // Next tier
    const nextTier = MILESTONE_TIERS.find((t) => t > effectiveCount) || currentTier * 2;
    const progressPercentage = Math.min(
      100,
      Math.max(5, Math.round((effectiveCount / nextTier) * 100))
    );

    const platformNames = activePlatforms.map((p) => p.name).join(", ") || "Instagram, YouTube & Facebook";
    const profileLink = `inflixo.com/${username}`;

    const milestoneTitle = `${formattedTotal}+ Community`;

    return {
      totalCount,
      formattedTotal,
      milestoneTitle,
      milestoneTier: currentTier,
      nextMilestone: nextTier,
      formattedNextMilestone: formatCount(nextTier),
      progressPercentage,
      activePlatforms,
      captions: {
        storyText: `🎉 Celebrating ${formattedTotal}+ Community across ${platformNames}! Thank you for the love and support. Link in bio: ${profileLink} ⚡ #MadeWithInflixo`,
        whatsappText: `Hey everyone! 🎉 We just crossed ${formattedTotal}+ community across ${platformNames}! Check out my official link for all my content, series & collaborations: https://${profileLink}`,
        twitterText: `Grateful for every single one of you! Crossed ${formattedTotal}+ followers across ${platformNames} 🚀✨\n\nExplore my unified profile: https://${profileLink}\n#MadeWithInflixo`,
        copyText: `https://${profileLink}`,
      },
    };
  },
};
