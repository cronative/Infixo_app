import { profileRepository, authRepository } from "@/repositories/localRepository";
import { CreatorProfile } from "@/types";

const EMPTY_PROFILE: CreatorProfile = {
  photoDataUrl: null,
  displayName: "",
  username: "",
  category: null,
  bio: "",
  updatedAt: new Date().toISOString(),
};

export const ProfileService = {
  getProfile(): CreatorProfile {
    const email = authRepository.getPendingEmail();
    const local = profileRepository.get();
    if (local && local.displayName) return local;

    // Fetch from backend API if email is present
    if (email) {
      fetch(`/api/creator/profile?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            profileRepository.save({
              photoDataUrl: data.profile.photoDataUrl || null,
              displayName: data.profile.displayName || "",
              username: data.profile.username || "",
              category: data.profile.category || null,
              profession: data.profile.profession || "",
              bio: data.profile.bio || "",
              city: data.profile.city || "",
              state: data.profile.state || "",
              country: data.profile.country || "",
              updatedAt: data.profile.updatedAt || new Date().toISOString(),
            });
          }
        })
        .catch((e) => console.warn("Failed to sync profile from DB:", e));
    }

    return local ?? EMPTY_PROFILE;
  },

  // Updates local component state during typing (0 network calls)
  saveLocal(profile: Partial<CreatorProfile>): CreatorProfile {
    const current = ProfileService.getProfile();
    const updated: CreatorProfile = {
      ...current,
      ...profile,
      updatedAt: new Date().toISOString(),
    };
    profileRepository.save(updated);
    return updated;
  },

  // Upload avatar to local storage directory /uploads/avatars/
  async uploadAvatar(photoDataUrl: string): Promise<string | null> {
    if (!photoDataUrl || photoDataUrl.startsWith("/uploads/")) return photoDataUrl;
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoDataUrl }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        return data.url;
      }
    } catch (e: any) {
      console.error("Failed to upload profile avatar file:", e);
    }
    return photoDataUrl;
  },

  // Called ONLY when clicking Next button to save complete profile to MySQL Database
  async saveToDb(profile: Partial<CreatorProfile>): Promise<CreatorProfile> {
    let updated = this.saveLocal(profile);
    const email = authRepository.getPendingEmail();

    // Upload photo to storage directory if it's base64 data
    if (updated.photoDataUrl && updated.photoDataUrl.startsWith("data:image/")) {
      const uploadedUrl = await this.uploadAvatar(updated.photoDataUrl);
      if (uploadedUrl) {
        updated = this.saveLocal({ photoDataUrl: uploadedUrl });
      }
    }

    if (email || updated.username) {
      try {
        const res = await fetch("/api/creator/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email || `${updated.username}@inflixo.com`,
            displayName: updated.displayName,
            username: updated.username,
            category: updated.category,
            profession: updated.profession || "",
            bio: updated.bio,
            city: updated.city || "",
            state: updated.state || "",
            country: updated.country || "",
            photoDataUrl: updated.photoDataUrl,
          }),
        });
        const data = await res.json();
        if (data.success && data.profile) {
          console.log("✅ Profile saved to MySQL Database on Next click:", data.profile);
        }
      } catch (e: any) {
        console.error("Failed to save profile to MySQL DB:", e);
      }
    }

    return updated;
  },

  hasProfile(): boolean {
    const p = profileRepository.get();
    return !!p && p.displayName.trim().length > 0 && p.username.trim().length > 0;
  },
};
