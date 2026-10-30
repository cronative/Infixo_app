"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingService } from "@/services/OnboardingService";
import { ONBOARDING_STEPS } from "@/types";

export default function OnboardingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // If onboarding is already completed, go to dashboard
    if (OnboardingService.isComplete()) {
      router.replace("/dashboard");
      return;
    }

    const currentStep = OnboardingService.getStep();
    if (currentStep === "finish") {
      router.replace("/onboarding/finish");
      return;
    }

    const matched = ONBOARDING_STEPS.find((s) => s.key === currentStep);
    if (matched) {
      router.replace(matched.path);
    } else {
      router.replace("/onboarding/username");
    }
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E4DAD5] border-t-[#7A2253]" />
    </div>
  );
}
