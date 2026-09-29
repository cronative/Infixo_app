import { Subscription } from "@/types";

const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getFreeTrialStatus(subscription?: Subscription | null, nowMs = Date.now()) {
  if (!subscription) {
    return {
      isFreeTrial: false,
      isExpired: false,
      daysLeft: null as number | null,
      shouldWarn: false,
    };
  }

  // Only real free trials (early_access or status === 'trial' when not a paid plan)
  const isFreeTrial =
    subscription.planKey === "early_access" ||
    (subscription.status === "trial" &&
      subscription.planKey !== "starter" &&
      subscription.planKey !== "pro" &&
      subscription.planKey !== "vip" &&
      subscription.planKey !== "creator_pro" &&
      subscription.planKey !== "creator_VIP");

  if (!isFreeTrial) {
    const isPaidExpired = Boolean(
      subscription.status && !["active", "trial"].includes(subscription.status)
    );
    const endMs = subscription.currentPeriodEndsAt
      ? new Date(subscription.currentPeriodEndsAt).getTime()
      : subscription.endsAt
      ? new Date(subscription.endsAt).getTime()
      : 0;
    const isPastEnd = Boolean(endMs && nowMs > endMs);

    return {
      isFreeTrial: false,
      isExpired: isPaidExpired || isPastEnd,
      daysLeft: null as number | null,
      shouldWarn: false,
    };
  }

  if (subscription.status && !["active", "trial"].includes(subscription.status)) {
    return {
      isFreeTrial: true,
      isExpired: true,
      daysLeft: 0,
      shouldWarn: true,
    };
  }

  const activatedMs = subscription.activatedAt ? new Date(subscription.activatedAt).getTime() : nowMs;
  const safeActivatedMs = Number.isNaN(activatedMs) ? nowMs : activatedMs;
  const explicitExpiresAt = subscription.trialEndsAt || subscription.endsAt || subscription.currentPeriodEndsAt;
  const explicitExpiresAtMs = explicitExpiresAt ? new Date(explicitExpiresAt).getTime() : Number.NaN;
  const expiresAtMs = Number.isNaN(explicitExpiresAtMs)
    ? safeActivatedMs + TRIAL_DAYS * DAY_MS
    : explicitExpiresAtMs;
  const daysLeft = Math.max(0, Math.ceil((expiresAtMs - nowMs) / DAY_MS));

  return {
    isFreeTrial: true,
    isExpired: daysLeft <= 0,
    daysLeft,
    shouldWarn: daysLeft <= 3,
  };
}

export function getTrialHeaderMessage(subscription?: Subscription | null, nowMs = Date.now()) {
  const status = getFreeTrialStatus(subscription, nowMs);

  if (!status.isFreeTrial) {
    return "Here's how your Inflixo profile is looking today.";
  }

  if (status.isExpired) {
    return "Your Free Trial has ended. Your profile is private now, so fans cannot view it until you choose a plan.";
  }

  if (status.shouldWarn) {
    const dayText = status.daysLeft === 1 ? "1 day" : `${status.daysLeft} days`;
    return `Your Free Trial has ${dayText} left. After 7 days, your profile will become private. Choose a plan to keep it live.`;
  }

  return "Here's how your Inflixo profile is looking today.";
}

export type PlanDisplayTier = "trial" | "starter" | "pro" | "vip" | "expired";

export interface PlanDisplayInfo {
  label: string;
  tier: PlanDisplayTier;
  isFreeTrial: boolean;
  isExpired: boolean;
}

export function getPlanDisplayInfo(
  subscription?: Subscription | null,
  nowMs = Date.now()
): PlanDisplayInfo {
  const trialStatus = getFreeTrialStatus(subscription, nowMs);

  if (!subscription) {
    return {
      label: "Free Trial",
      tier: "trial",
      isFreeTrial: true,
      isExpired: false,
    };
  }

  const planKey = (subscription.planKey || "").toLowerCase();
  const planName = (subscription.planName || "").toLowerCase();
  const status = (subscription.status || "").toLowerCase();

  const isVip = planKey === "vip" || planKey === "creator_vip" || planName.includes("vip");
  const isPro = planKey === "pro" || planKey === "creator_pro" || planName.includes("pro");
  const isStarter = planKey === "starter" || planName.includes("starter");

  // Check if paid plan
  if (isVip || isPro || isStarter) {
    if (trialStatus.isExpired || status === "expired" || status === "cancelled") {
      return {
        label: "Choose Plan",
        tier: "expired",
        isFreeTrial: false,
        isExpired: true,
      };
    }

    if (isVip) {
      return {
        label: "VIP Plan",
        tier: "vip",
        isFreeTrial: false,
        isExpired: false,
      };
    }

    if (isPro) {
      return {
        label: "Pro Plan",
        tier: "pro",
        isFreeTrial: false,
        isExpired: false,
      };
    }

    if (isStarter) {
      return {
        label: "Starter Plan",
        tier: "starter",
        isFreeTrial: false,
        isExpired: false,
      };
    }
  }

  // Any other active paid plan name
  if (
    subscription.planName &&
    !planName.includes("trial") &&
    planKey !== "early_access" &&
    planKey !== "free"
  ) {
    if (trialStatus.isExpired || status === "expired" || status === "cancelled") {
      return {
        label: "Choose Plan",
        tier: "expired",
        isFreeTrial: false,
        isExpired: true,
      };
    }
    return {
      label: subscription.planName,
      tier: "starter",
      isFreeTrial: false,
      isExpired: false,
    };
  }

  // Free trial
  if (trialStatus.isExpired || status === "expired" || status === "cancelled") {
    return {
      label: "Choose Plan",
      tier: "expired",
      isFreeTrial: true,
      isExpired: true,
    };
  }

  return {
    label: "Free Trial",
    tier: "trial",
    isFreeTrial: true,
    isExpired: false,
  };
}
