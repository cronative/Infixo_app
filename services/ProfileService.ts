import { profileRepository, authRepository, themeRepository } from "@/repositories/localRepository";
import { CreatorProfile } from "@/types";
import { ThemeService } from "@/services/ThemeService";
import { debugLog, debugError } from "@/lib/debugLogger";


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

    return { ...EMPTY_PROFILE, email };
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
          id: data.profile.id ? String(data.profile.id) : (currentLocal.id || undefined),
          email: data.profile.email || currentLocal.email || email,
          photoDataUrl: data.profile.photoDataUrl || currentLocal.photoDataUrl || null,
          displayName: data.profile.displayName || currentLocal.displayName || "",
          username: data.profile.username || currentLocal.username || "",
          category: data.profile.category || currentLocal.category || null,
          customCategory: data.profile.customCategory || currentLocal.customCategory || "",
          profession: data.profile.profession || currentLocal.profession || "",
          bio: data.profile.bio ?? currentLocal.bio ?? "",
          city: data.profile.city || currentLocal.city || "",
          state: data.profile.state || currentLocal.state || "",
          country: data.profile.country || currentLocal.country || "",
          visibilitySettings: data.profile.visibilitySettings || currentLocal.visibilitySettings || null,
          updatedAt: new Date().toISOString(),
        } as CreatorProfile;

        // Only save to localStorage if creator actually exists in DB (not a brand new user)
        if (!data.isNewUser && data.profile.id) {
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
      id: profile.id || current.id,
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
        debugLog("PROFILE_SERVICE", "Saving profile to DB on Next click:", {
          email: email || `${updated.username}@inflixo.com`,
          displayName: updated.displayName,
          username: updated.username,
        });

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
          debugLog("PROFILE_SERVICE", "✅ Profile saved to MySQL Database successfully:", data.profile);
        } else {
          debugError("PROFILE_SERVICE", "❌ Profile save response failed:", data.error);
        }
      } catch (e: any) {
        debugError("PROFILE_SERVICE", "Failed to save profile to MySQL DB:", e);
      }
    }

    return updated;
  },

  hasProfile(): boolean {
    const p = profileRepository.get();
    return !!p && Boolean((p.displayName || "").trim()) && Boolean((p.username || "").trim());
  },

};
