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

    // Accurate check: If creator has username/displayName or finish step, they are an existing creator -> dashboard
    const hasDbProfile = Boolean(
      (data.creator?.username && data.creator.username.trim() !== "") ||
      (data.creator?.displayName && data.creator.displayName.trim() !== "")
    );
    const isExistingProfile = Boolean(data.isExistingProfile || hasDbProfile || data.creator?.onboardingStep === "finish");
    const onboardingStep = isExistingProfile ? "finish" : (data.creator?.onboardingStep || "profile");

    // Re-save pending email & session
    authRepository.savePendingEmail(email);

    const session: AuthSession = {
      email,
      isLoggedIn: true,
      loggedInAt: new Date().toISOString(),
      provider: "email",
    };
    authRepository.save(session);
    onboardingRepository.saveStep(onboardingStep);

    // If existing creator profile returned from MySQL DB, hydrate local repos with DB data
    if (data.creator && (data.creator.displayName || data.creator.username)) {
      profileRepository.save({
        email: data.creator.email || email,
        photoDataUrl: data.creator.photoUrl || null,
        displayName: data.creator.displayName || "",
        username: data.creator.username || "",
        category: data.creator.category || null,
        bio: data.creator.bio || "",
        updatedAt: new Date().toISOString(),
      });

      if (data.creator.themeKey) {
        themeRepository.save(data.creator.themeKey);
      }

      if (data.creator.subscription) {
        subscriptionRepository.save({
          planKey: data.creator.subscription.planKey || "early_access",
          planName: data.creator.subscription.planName || "Early Access",
          billingCycle: data.creator.subscription.billingCycle || "yearly",
          status: data.creator.subscription.status || "active",
          activatedAt: new Date().toISOString(),
        });
      }
    } else {
      // BRAND NEW USER: Ensure completely blank fresh profile (NO DEMO DATA!)
      profileRepository.save({
        email,
        photoDataUrl: null,
        displayName: "",
        username: "",
        category: null,
        bio: "",
        updatedAt: new Date().toISOString(),
      });
      socialRepository.save(EMPTY_SOCIAL_ACCOUNTS);
      seriesRepository.saveAll([]);
      themeRepository.save("minimal-white");
      subscriptionRepository.save({
        planKey: "early_access",
        planName: "Early Access",
        billingCycle: "yearly",
        status: "active",
        activatedAt: new Date().toISOString(),
      });
    }

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

