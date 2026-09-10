import { socialRepository, authRepository, customLinksRepository, profileRepository } from "@/repositories/localRepository";
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

export const SocialService = {
  getAccounts(): SocialAccounts {
    return socialRepository.get();
  },

  saveAccounts(accounts: Partial<SocialAccounts>): SocialAccounts {
    const current = SocialService.getAccounts();
    const email = authRepository.getPendingEmail();
    const updated: SocialAccounts = {
      ...current,
      ...accounts,
      updatedAt: new Date().toISOString(),
    };
    socialRepository.save(updated);

    // Save platforms to MySQL Database via API
    if (email) {
      const igHandle = updated.instagram?.username || updated.instagram?.url?.split("/").filter(Boolean).pop();
      if (igHandle) {
        fetch("/api/creator/socials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            platform: "instagram",
            accountName: updated.instagram.name || igHandle,
            username: igHandle,
            followerCount: updated.instagram.followers || 0,
            mediaCount: updated.instagram.posts || 0,
            isVerified: updated.instagram.isVerified || false,
          }),
        }).catch((e) => console.error("Failed to save Instagram to MySQL DB:", e));
      }

      const ytHandle = updated.youtube?.username || updated.youtube?.channelTitle || updated.youtube?.url?.split("/").filter(Boolean).pop();
      if (ytHandle) {
        fetch("/api/creator/socials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            platform: "youtube",
            accountName: updated.youtube.channelTitle || ytHandle,
            username: ytHandle,
            followerCount: updated.youtube.subscribers || 0,
            mediaCount: updated.youtube.videos || 0,
            isVerified: updated.youtube.isVerified || false,
          }),
        }).catch((e) => console.error("Failed to save YouTube to MySQL DB:", e));
      }

      const fbHandle = updated.facebook?.username || updated.facebook?.name || updated.facebook?.url?.split("/").filter(Boolean).pop();
      if (fbHandle) {
        fetch("/api/creator/socials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            platform: "facebook",
            accountName: updated.facebook.name || fbHandle,
            username: fbHandle,
            followerCount: updated.facebook.followers || 0,
            mediaCount: updated.facebook.posts || 0,
            isVerified: updated.facebook.isVerified || false,
          }),
        }).catch((e) => console.error("Failed to save Facebook to MySQL DB:", e));
      }

      // Save additional platforms
      PLATFORMS_LIST.forEach(({ key, platform }) => {
        const item = updated[key] as GenericSocialStats | undefined;
        const handle = item?.username || item?.name || item?.url?.split("/").filter(Boolean).pop();
        if (handle) {
          fetch("/api/creator/socials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              platform,
              accountName: item?.name || handle,
              username: handle,
              followerCount: item?.followers || 0,
              isVerified: item?.isVerified || false,
            }),
          }).catch((e) => console.error(`Failed to save ${platform} to DB:`, e));
        }
      });
    }

    return updated;
  },

  async fetchFromDb(options?: { email?: string; username?: string }): Promise<SocialAccounts | null> {
    const email = options?.email || authRepository.getPendingEmail() || profileRepository.get()?.email;
    const username = options?.username || profileRepository.get()?.username;
    if (!email && !username) return null;

    try {
      const query = email
        ? `email=${encodeURIComponent(email)}`
        : `username=${encodeURIComponent(username || "")}`;
      const res = await fetch(`/api/creator/socials?${query}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.socials)) {
        const current = this.getAccounts();
        const updated: SocialAccounts = { ...current };

        data.socials.forEach((s: any) => {
          const platform = (s.platform || "").toLowerCase().trim();
          const handle = (s.username || s.accountName || "").replace(/^@/, "").trim();

          if (platform === "instagram" && handle) {
            updated.instagram = {
              ...updated.instagram,
              username: handle,
              name: s.accountName || handle,
              followers: s.followerCount ?? updated.instagram.followers ?? 0,
              posts: s.mediaCount ?? updated.instagram.posts ?? 0,
              isVerified: Boolean(s.isVerified),
              url: `https://instagram.com/${handle}`,
              lastSyncedAt: s.lastSyncedAt || new Date().toISOString(),
            };
          } else if (platform === "youtube" && handle) {
            updated.youtube = {
              ...updated.youtube,
              username: handle,
              channelTitle: s.accountName || handle,
              subscribers: s.followerCount ?? updated.youtube.subscribers ?? 0,
              videos: s.mediaCount ?? updated.youtube.videos ?? 0,
              isVerified: Boolean(s.isVerified),
              url: `https://youtube.com/@${handle}`,
              lastSyncedAt: s.lastSyncedAt || new Date().toISOString(),
            };
          } else if (platform === "facebook" && handle) {
            updated.facebook = {
              ...updated.facebook,
              username: handle,
              name: s.accountName || handle,
              followers: s.followerCount ?? updated.facebook.followers ?? 0,
              posts: s.mediaCount ?? updated.facebook.posts ?? 0,
              isVerified: Boolean(s.isVerified),
              url: `https://facebook.com/${handle}`,
              lastSyncedAt: s.lastSyncedAt || new Date().toISOString(),
            };
          } else if (handle) {
            const pInfo = PLATFORMS_LIST.find((p) => p.platform === platform);
            if (pInfo) {
              const key = pInfo.key;
              (updated as any)[key] = {
                url: `${pInfo.urlPrefix}${handle}`,
                username: handle,
                name: s.accountName || handle,
                followers: s.followerCount || 0,
                isVerified: Boolean(s.isVerified),
                lastSyncedAt: s.lastSyncedAt || new Date().toISOString(),
              };
            }
          }
        });

        socialRepository.save(updated);

        // Also sync custom links if returned by socials endpoint
        if (Array.isArray(data.customLinks) && data.customLinks.length > 0) {
          customLinksRepository.save(data.customLinks);
        }

        return updated;
      }
    } catch (err) {
      console.warn("Failed to fetch socials from DB:", err);
    }
    return null;
  },

  calculateTotalAudience(accounts: SocialAccounts): number {
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
  },

  reset(): SocialAccounts {
    socialRepository.save(EMPTY_SOCIAL_ACCOUNTS);
    return EMPTY_SOCIAL_ACCOUNTS;
  },
};
