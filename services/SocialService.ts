import { socialRepository, authRepository } from "@/repositories/localRepository";
import { SocialAccounts, EMPTY_SOCIAL_ACCOUNTS } from "@/types";

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
    }

    return updated;
  },

  calculateTotalAudience(accounts: SocialAccounts): number {
    return (
      (accounts.instagram?.followers ?? 0) +
      (accounts.youtube?.subscribers ?? 0) +
      (accounts.facebook?.followers ?? 0)
    );
  },

  reset(): SocialAccounts {
    socialRepository.save(EMPTY_SOCIAL_ACCOUNTS);
    return EMPTY_SOCIAL_ACCOUNTS;
  },
};
