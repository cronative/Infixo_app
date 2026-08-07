import { authRepository } from "@/repositories/localRepository";
import { AuthSession } from "@/types";

export const AuthService = {
  async requestOtp(email: string): Promise<{ success: boolean; demoOtp?: string }> {
    authRepository.savePendingEmail(email);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: true, demoOtp: "1234" };
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

    const isExistingProfile = Boolean(data.isExistingProfile);
    const onboardingStep = data.creator?.onboardingStep || "profile";

    const session: AuthSession = {
      email,
      isLoggedIn: true,
      loggedInAt: new Date().toISOString(),
      provider: "email",
    };
    authRepository.save(session);

    return { session, isExistingProfile, onboardingStep };
  },

  loginWithProvider(provider: "google" | "apple"): AuthSession {
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
    authRepository.clear();
  },
};
