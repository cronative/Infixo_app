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
        const updated: SocialAccounts = { ...EMPTY_SOCIAL_ACCOUNTS, updatedAt: "" };

        socials.forEach((s: SocialAccountRecord) => {
          const platform = (s.platform || "").toLowerCase().trim();
          const handle = (s.username || s.accountName || "").replace(/^@/, "").trim();

          if (platform === "instagram" && handle) {
            updated.instagram = {
              ...base.instagram,
              username: handle,
              name: s.accountName || handle,
              followers: Number(s.followerCount ?? 0),
              posts: s.mediaCount ?? updated.instagram.posts ?? 0,
              isVerified: Boolean(s.isVerified),
              url: `https://instagram.com/${handle}`,
              lastSyncedAt: s.lastSyncedAt || "",
            };
          } else if (platform === "youtube" && handle) {
            updated.youtube = {
              ...base.youtube,
              username: handle,
              channelTitle: s.accountName || handle,
              subscribers: Number(s.followerCount ?? 0),
              videos: s.mediaCount ?? updated.youtube.videos ?? 0,
              isVerified: Boolean(s.isVerified),
              url: `https://youtube.com/@${handle}`,
              lastSyncedAt: s.lastSyncedAt || "",
            };
          } else if (platform === "facebook" && handle) {
            updated.facebook = {
              ...base.facebook,
              username: handle,
              name: s.accountName || handle,
              followers: Number(s.followerCount ?? 0),
              posts: s.mediaCount ?? updated.facebook.posts ?? 0,
              isVerified: Boolean(s.isVerified),
              url: `https://facebook.com/${handle}`,
              lastSyncedAt: s.lastSyncedAt || "",
            };
          } else if (handle) {
            const pInfo = PLATFORMS_LIST.find((p) => p.platform === platform);
            if (pInfo) {
              const key = pInfo.key;
              (updated as any)[key] = {
                url: `${pInfo.urlPrefix}${handle}`,
                username: handle,
                name: s.accountName || handle,
                followers: Number(s.followerCount || 0),
                isVerified: Boolean(s.isVerified),
                lastSyncedAt: s.lastSyncedAt || "",
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
