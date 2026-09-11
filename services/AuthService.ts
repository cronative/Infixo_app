import {
  authRepository,
  profileRepository,
  socialRepository,
  themeRepository,
  seriesRepository,
  subscriptionRepository,
  onboardingRepository,
} from "@/repositories/localRepository";
import { AuthSession, EMPTY_SOCIAL_ACCOUNTS } from "@/types";
import { storage } from "@/utils/storage";
import { debugLog } from "@/lib/debugLogger";

export const AuthService = {
  async requestOtp(email: string): Promise<{ success: boolean; demoOtp?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    // Only wipe local storage if switching to a completely different email
    const prevEmail = authRepository.getPendingEmail();
    if (prevEmail && prevEmail.toLowerCase() !== cleanEmail) {
      storage.clearAll();
    }
    authRepository.savePendingEmail(cleanEmail);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: true };
    }
  },

  getPendingEmail(): string {
    return authRepository.getPendingEmail();
  },

  async verifyOtp(otp: string): Promise<{ session: AuthSession; isExistingProfile: boolean; onboardingStep: string }> {
    const email = authRepository.getPendingEmail();

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Invalid OTP code");
    }

    debugLog("AUTH_SERVICE", "verifyOtp response received:", {
      isExistingProfile: data.isExistingProfile,
      onboardingStep: data.onboardingStep,
      creatorId: data.creator?.id,
    });

    const hasCreator = Boolean(data.creator && data.creator.id);
    const isExistingProfile = Boolean(data.isExistingProfile);
    const onboardingStep = isExistingProfile ? "finish" : (data.onboardingStep || data.creator?.onboardingStep || "profile");


    // If brand new creator, clear all stale local storage so nothing bleeds into the new profile!
    if (!hasCreator) {
      storage.clearAll();
    }

    // Save pending email & session (ONLY email & session for new creator until profile is created)
    authRepository.savePendingEmail(email);

    const session: AuthSession = {
      email,
      isLoggedIn: true,
      loggedInAt: new Date().toISOString(),
      provider: "email",
    };
    authRepository.save(session);
    debugLog("AUTH_SERVICE", `Session saved for ${email}. Next onboarding step: ${onboardingStep}`);

    // ONLY IF existing creator profile exists in DB, hydrate local repos
    if (data.creator && (data.creator.displayName || data.creator.username)) {
      onboardingRepository.saveStep(onboardingStep);
      profileRepository.save({
        id: data.creator.id ? String(data.creator.id) : undefined,
        email: data.creator.email || email,
        photoDataUrl: data.creator.photoUrl || null,
        displayName: data.creator.displayName || "",
        username: data.creator.username || "",
        category: data.creator.category || null,
        bio: data.creator.bio || "",
        updatedAt: new Date().toISOString(),
      });

      if (Array.isArray(data.creator.socials) && data.creator.socials.length > 0) {
        const accs = { ...EMPTY_SOCIAL_ACCOUNTS };
        data.creator.socials.forEach((s: any) => {
          const platform = (s.platform || "").toLowerCase().trim();
          const handle = (s.username || s.account_name || "").replace(/^@/, "").trim();
          if (platform === "instagram" && handle) {
            accs.instagram = {
              ...accs.instagram,
              username: handle,
              name: s.account_name || handle,
              followers: s.follower_count ?? 0,
              posts: s.media_count ?? 0,
              isVerified: Boolean(s.is_verified),
              url: `https://instagram.com/${handle}`,
              lastSyncedAt: s.last_synced_at || new Date().toISOString(),
            };
          } else if (platform === "youtube" && handle) {
            accs.youtube = {
              ...accs.youtube,
              username: handle,
              channelTitle: s.account_name || handle,
              subscribers: s.follower_count ?? 0,
              videos: s.media_count ?? 0,
              isVerified: Boolean(s.is_verified),
              url: `https://youtube.com/@${handle}`,
              lastSyncedAt: s.last_synced_at || new Date().toISOString(),
            };
          } else if (platform === "facebook" && handle) {
            accs.facebook = {
              ...accs.facebook,
              username: handle,
              name: s.account_name || handle,
              followers: s.follower_count ?? 0,
              posts: s.media_count ?? 0,
              isVerified: Boolean(s.is_verified),
              url: `https://facebook.com/${handle}`,
              lastSyncedAt: s.last_synced_at || new Date().toISOString(),
            };
          }
        });
        socialRepository.save(accs);
      }

      if (data.creator.themeKey) {
        themeRepository.save(data.creator.themeKey);
      }

      if (data.creator.subscription) {
        subscriptionRepository.save({
          planKey: data.creator.subscription.planKey || "early_access",
          planName: data.creator.subscription.planName || "Free Trial",
          billingCycle: data.creator.subscription.billingCycle || "yearly",
          status: data.creator.subscription.status || "active",
          activatedAt: new Date().toISOString(),
        });
      }
    }
    // Brand new user: NO profile, socials, series, theme, or subscription in localStorage


    return { session, isExistingProfile, onboardingStep };
  },

  loginWithProvider(provider: "google" | "apple"): AuthSession {
    storage.clearAll();
    const session: AuthSession = {
      email: provider === "google" ? "creator@gmail.com" : "creator@icloud.com",
      isLoggedIn: true,
      loggedInAt: new Date().toISOString(),
      provider,
    };
    authRepository.save(session);
    return session;
  },

  getSession(): AuthSession | null {
    return authRepository.get();
  },

  isLoggedIn(): boolean {
    return authRepository.get()?.isLoggedIn ?? false;
  },

  logout(): void {
    storage.clearAll();
  },
};
