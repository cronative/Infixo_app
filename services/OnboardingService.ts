import { onboardingRepository, profileRepository, authRepository } from "@/repositories/localRepository";
import { ProfileService } from "@/services/ProfileService";
import { SocialService } from "@/services/SocialService";
import { ThemeService } from "@/services/ThemeService";
import { SubscriptionService } from "@/services/SubscriptionService";
import {
  seriesRepository,
  socialRepository,
  subscriptionRepository,
} from "@/repositories/localRepository";
import { OnboardingStep } from "@/types";

export const OnboardingService = {
  getStep(): OnboardingStep {
    return onboardingRepository.getStep() as OnboardingStep;
  },
  setStep(step: OnboardingStep): void {
    onboardingRepository.saveStep(step);

    const email = authRepository.getPendingEmail() || profileRepository.get()?.email;
    if (email) {
      fetch("/api/creator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, onboardingStep: step }),
      }).catch(() => {});

      if (step === "finish") {
        fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            planKey: "early_access",
            planName: "Early Access",
            billingCycle: "yearly",
          }),
        }).catch(() => {});
      }
    }
  },

  isComplete(): boolean {
    return SubscriptionService.get().status === "active" && ProfileService.hasProfile();
  },

  reset(): void {
    profileRepository.save({
      photoDataUrl: null,
      displayName: "",
      username: "",
      category: null,
      bio: "",
      updatedAt: new Date().toISOString(),
    });
    SocialService.reset();
    ThemeService.setSelectedTheme("minimal-white");
    seriesRepository.saveAll([]);
    subscriptionRepository.save({
      planKey: "early_access",
      planName: "Early Access",
      billingCycle: "yearly",
      status: "active",
      activatedAt: new Date().toISOString(),
    });
    onboardingRepository.saveStep("profile");
  },
};
