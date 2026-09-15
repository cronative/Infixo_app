import { onboardingRepository, profileRepository, authRepository } from "@/repositories/localRepository";
import { ProfileService } from "@/services/ProfileService";
import { SocialService } from "@/services/SocialService";
import { ThemeService } from "@/services/ThemeService";
import { SubscriptionService, createSubscriptionLifecycle } from "@/services/SubscriptionService";
import {
  seriesRepository,
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
        // Finishing onboarding starts the free-trial subscription lifecycle.
        const subscription = createSubscriptionLifecycle("early_access", "yearly");
        fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            ...subscription,
          }),
        }).catch(() => {});
      }
    }
  },

  isComplete(): boolean {
    const status = SubscriptionService.get().status;
    // Trial users should enter the dashboard immediately after onboarding.
    return (status === "active" || status === "trial") && ProfileService.hasProfile();
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
      ...createSubscriptionLifecycle("early_access", "yearly"),
    });
    onboardingRepository.saveStep("profile");
  },
};
