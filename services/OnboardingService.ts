import { onboardingRepository, profileRepository } from "@/repositories/localRepository";
import { ProfileService } from "@/services/ProfileService";
import { SocialService } from "@/services/SocialService";
import { ThemeService } from "@/services/ThemeService";
import { SubscriptionService } from "@/services/SubscriptionService";
import {
  seriesRepository,
  socialRepository,
  subscriptionRepository,
  themeRepository,
} from "@/repositories/localRepository";
import {
  DEMO_PROFILE,
  DEMO_SOCIALS,
  DEMO_THEME,
  DEMO_SERIES,
  DEMO_SUBSCRIPTION,
} from "@/data/demoCreator";
import { OnboardingStep } from "@/types";

export const OnboardingService = {
  getStep(): OnboardingStep {
    return onboardingRepository.getStep() as OnboardingStep;
  },
  setStep(step: OnboardingStep): void {
    onboardingRepository.saveStep(step);
  },

  isComplete(): boolean {
    return SubscriptionService.get().status === "active" && ProfileService.hasProfile();
  },

  /** Seeds the entire app with the demo creator (used by "View demo" / first run). */
  seedDemoData(): void {
    profileRepository.save(DEMO_PROFILE);
    socialRepository.save(DEMO_SOCIALS);
    themeRepository.save(DEMO_THEME);
    seriesRepository.saveAll(DEMO_SERIES);
    subscriptionRepository.save(DEMO_SUBSCRIPTION);
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
    ThemeService.setSelectedTheme("modern-purple");
    seriesRepository.saveAll([]);
    subscriptionRepository.save({
      planKey: "pro",
      planName: "Pro Plan",
      billingCycle: "yearly",
      status: "trial",
      activatedAt: null,
    });
    onboardingRepository.saveStep("profile");
  },
};
