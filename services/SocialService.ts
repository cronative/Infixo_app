import { mapSocialAccounts, calculateTotalAudience } from "@/lib/socialAccounts";
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
    const updated: SocialAccounts = {
      ...current,
      ...accounts,
      updatedAt: new Date().toISOString(),
    };
    socialRepository.save(updated);
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
      const httpResponse = await fetch(`/api/creator/socials?${query}`);
      const apiResponse = await httpResponse.json();
      const socials = apiResponse.data?.socials || apiResponse.socials;
      const customLinks = apiResponse.data?.customLinks || apiResponse.customLinks;

      if ((apiResponse.status === 1 || apiResponse.success) && Array.isArray(socials)) {
        const updated = mapSocialAccounts(socials, this.getAccounts());

        socialRepository.save(updated);

        // Also sync custom links if returned by socials endpoint
        if (Array.isArray(customLinks) && customLinks.length > 0) {
          customLinksRepository.save(customLinks);
        }

        return updated;
      }
    } catch (err) {
      console.warn("Failed to fetch socials from DB:", err);
    }
    return null;
  },

  calculateTotalAudience,

  reset(): SocialAccounts {
    socialRepository.save(EMPTY_SOCIAL_ACCOUNTS);
    return EMPTY_SOCIAL_ACCOUNTS;
  },
};
