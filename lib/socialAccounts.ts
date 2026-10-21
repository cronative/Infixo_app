import { SocialAccounts, EMPTY_SOCIAL_ACCOUNTS, GenericSocialStats } from "@/types";
const PLATFORMS_LIST: { key: keyof SocialAccounts; platform: string; urlPrefix: string }[] = [
  { key: "twitter", platform: "twitter", urlPrefix: "https://x.com/" },
  { key: "linkedin", platform: "linkedin", urlPrefix: "https://linkedin.com/in/" },
  { key: "threads", platform: "threads", urlPrefix: "https://threads.net/@" },
  { key: "snapchat", platform: "snapchat", urlPrefix: "https://snapchat.com/add/" },
  { key: "pinterest", platform: "pinterest", urlPrefix: "https://pinterest.com/" },
  { key: "twitch", platform: "twitch", urlPrefix: "https://twitch.tv/" },
  { key: "spotify", platform: "spotify", urlPrefix: "https://open.spotify.com/artist/" },
];

export interface SocialAccountRecord { platform: string; username?: string; accountName?: string; followerCount?: number; mediaCount?: number; isVerified?: boolean; lastSyncedAt?: string; }
export function mapSocialAccounts(socials: SocialAccountRecord[], base: SocialAccounts = EMPTY_SOCIAL_ACCOUNTS): SocialAccounts {
        const updated: SocialAccounts = { ...base, updatedAt: "" };

        socials.forEach((s: SocialAccountRecord) => {
          const platform = (s.platform || "").toLowerCase().trim();
          const handle = (s.username || s.accountName || "").replace(/^@/, "").trim();

          const dbFollowerCount = Number(s.followerCount ?? 0);

          if (platform === "instagram" && handle) {
            const currentFollowers = Number(base.instagram?.followers ?? 0);
            updated.instagram = {
              ...base.instagram,
              username: handle,
              name: s.accountName || handle,
              followers: dbFollowerCount > 0 ? dbFollowerCount : currentFollowers,
              posts: s.mediaCount ?? updated.instagram?.posts ?? base.instagram?.posts ?? 0,
              isVerified: Boolean(s.isVerified ?? base.instagram?.isVerified),
              url: `https://instagram.com/${handle}`,
              lastSyncedAt: s.lastSyncedAt || base.instagram?.lastSyncedAt || "",
            };
          } else if (platform === "youtube" && handle) {
            const currentSubs = Number(base.youtube?.subscribers ?? 0);
            updated.youtube = {
              ...base.youtube,
              username: handle,
              channelTitle: s.accountName || handle,
              subscribers: dbFollowerCount > 0 ? dbFollowerCount : currentSubs,
              videos: s.mediaCount ?? updated.youtube?.videos ?? base.youtube?.videos ?? 0,
              isVerified: Boolean(s.isVerified ?? base.youtube?.isVerified),
              url: `https://youtube.com/@${handle}`,
              lastSyncedAt: s.lastSyncedAt || base.youtube?.lastSyncedAt || "",
            };
          } else if (platform === "facebook" && handle) {
            const currentFollowers = Number(base.facebook?.followers ?? 0);
            updated.facebook = {
              ...base.facebook,
              username: handle,
              name: s.accountName || handle,
              followers: dbFollowerCount > 0 ? dbFollowerCount : currentFollowers,
              posts: s.mediaCount ?? updated.facebook?.posts ?? base.facebook?.posts ?? 0,
              isVerified: Boolean(s.isVerified ?? base.facebook?.isVerified),
              url: `https://facebook.com/${handle}`,
              lastSyncedAt: s.lastSyncedAt || base.facebook?.lastSyncedAt || "",
            };
          } else if (handle) {
            const pInfo = PLATFORMS_LIST.find((p) => p.platform === platform);
            if (pInfo) {
              const key = pInfo.key;
              const prev = (base as any)?.[key];
              const prevFollowers = Number(prev?.followers ?? 0);
              (updated as any)[key] = {
                url: `${pInfo.urlPrefix}${handle}`,
                username: handle,
                name: s.accountName || handle,
                followers: dbFollowerCount > 0 ? dbFollowerCount : prevFollowers,
                isVerified: Boolean(s.isVerified ?? prev?.isVerified),
                lastSyncedAt: s.lastSyncedAt || prev?.lastSyncedAt || "",
              };
            }
          }
        });

const dates = socials.map(account => account.lastSyncedAt).filter((date): date is string => Boolean(date) && Number.isFinite(Date.parse(date!)));
if (dates.length) updated.updatedAt = new Date(Math.max(...dates.map(Date.parse))).toISOString();
return updated;
}
export function calculateTotalAudience(accounts: SocialAccounts): number {
    let total =
      (accounts.instagram?.followers ?? 0) +
      (accounts.youtube?.subscribers ?? 0) +
      (accounts.facebook?.followers ?? 0);

    PLATFORMS_LIST.forEach(({ key }) => {
      const item = accounts[key] as GenericSocialStats | undefined;
      if (item && item.followers) {
        total += item.followers;
      }
    });

    return total;
  }
