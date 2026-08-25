import { profileRepository, authRepository, themeRepository } from "@/repositories/localRepository";
import { CreatorProfile } from "@/types";
import { ThemeService } from "@/services/ThemeService";

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

    // If local profile belongs to a different email, reset it so data doesn't leak
    if (local && local.email && email && local.email.toLowerCase() !== email.toLowerCase()) {
      const fresh = { ...EMPTY_PROFILE, email };
      profileRepository.save(fresh);
      return fresh;
    }

    if (local) return local;

    // Fetch from backend API if email is present and no local record exists yet
    if (email) {
      fetch(`/api/creator/profile?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.profile) {
            const currentLocal: Partial<CreatorProfile> = profileRepository.get() || {};
            profileRepository.save({
              ...currentLocal,
              email: data.profile.email || email,
              photoDataUrl: currentLocal.photoDataUrl || data.profile.photoDataUrl || null,
              displayName: currentLocal.displayName || data.profile.displayName || "",
              username: currentLocal.username || data.profile.username || "",
              category: currentLocal.category || data.profile.category || null,
              customCategory: currentLocal.customCategory || data.profile.customCategory || "",
              profession: currentLocal.profession || data.profile.profession || "",
              bio: currentLocal.bio || data.profile.bio || "",
              city: currentLocal.city || data.profile.city || "",
              state: currentLocal.state || data.profile.state || "",
              country: currentLocal.country || data.profile.country || "",
              visibilitySettings: currentLocal.visibilitySettings || data.profile.visibilitySettings || null,
              updatedAt: new Date().toISOString(),
            } as CreatorProfile);

            // Sync theme from DB only if local storage has no active user theme selection
            if (data.profile.themeKey) {
              const existingLocalTheme = themeRepository.get();
              if (!existingLocalTheme || existingLocalTheme === "minimal-white") {
                ThemeService.setSelectedTheme(data.profile.themeKey);
              }
            }
          }
        })
        .catch((e) => console.warn("Failed to sync profile from DB:", e));
    }

    return local ?? { ...EMPTY_PROFILE, email };
  },

  async fetchFromDb(): Promise<CreatorProfile | null> {
    const email = authRepository.getPendingEmail();
    if (!email) return null;

    try {
      const res = await fetch(`/api/creator/profile?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.profile) {
        const currentLocal: Partial<CreatorProfile> = profileRepository.get() || {};
        const updated: CreatorProfile = {
          ...currentLocal,
          email: data.profile.email || email,
          photoDataUrl: currentLocal.photoDataUrl || data.profile.photoDataUrl || null,
          displayName: currentLocal.displayName || data.profile.displayName || "",
          username: currentLocal.username || data.profile.username || "",
          category: currentLocal.category || data.profile.category || null,
          customCategory: currentLocal.customCategory || data.profile.customCategory || "",
          profession: currentLocal.profession || data.profile.profession || "",
          bio: currentLocal.bio || data.profile.bio || "",
          city: currentLocal.city || data.profile.city || "",
          state: currentLocal.state || data.profile.state || "",
          country: currentLocal.country || data.profile.country || "",
          visibilitySettings: data.profile.visibilitySettings || currentLocal.visibilitySettings || null,
          updatedAt: new Date().toISOString(),
        } as CreatorProfile;

        profileRepository.save(updated);

        if (typeof data.profile.themeChangesCount === "number") {
          ThemeService.syncThemeChangesCount(data.profile.themeChangesCount);
        }

        if (data.profile.themeKey) {
          const existingLocalTheme = themeRepository.get();
          if (!existingLocalTheme || existingLocalTheme === "minimal-white") {
            ThemeService.setSelectedTheme(data.profile.themeKey);
          }
        }

        return updated;
      }
    } catch (e) {
      console.warn("Failed to sync profile from DB:", e);
    }
    return null;
  },

  // Updates local component state during typing/upload (0 network calls)
  saveLocal(profile: Partial<CreatorProfile>): CreatorProfile {
    const email = authRepository.getPendingEmail();
    const current = profileRepository.get() || { ...EMPTY_PROFILE, email };
    const updated: CreatorProfile = {
      ...current,
      ...profile,
      email: profile.email || current.email || email,
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
    const currentTheme = ThemeService.getSelectedTheme();

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
            customCategory: updated.customCategory || "",
            profession: updated.profession || "",
            bio: updated.bio,
            city: updated.city || "",
            state: updated.state || "",
            country: updated.country || "",
            photoDataUrl: updated.photoDataUrl,
            themeKey: currentTheme,
            visibilitySettings: updated.visibilitySettings,
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
