import { Subscription } from "@/types";

const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getFreeTrialStatus(subscription?: Subscription | null, nowMs = Date.now()) {
  if (!subscription || subscription.planKey !== "early_access") {
    return {
      isFreeTrial: false,
      isExpired: false,
      daysLeft: null as number | null,
      shouldWarn: false,
    };
  }

  if (subscription.status && subscription.status !== "active") {
    return {
      isFreeTrial: true,
      isExpired: true,
      daysLeft: 0,
      shouldWarn: true,
    };
  }

  const activatedMs = subscription.activatedAt ? new Date(subscription.activatedAt).getTime() : nowMs;
  const safeActivatedMs = Number.isNaN(activatedMs) ? nowMs : activatedMs;
  const expiresAtMs = safeActivatedMs + TRIAL_DAYS * DAY_MS;
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
    return `You are creating good content. Your Free Trial has ${dayText} left. After 7 days, tamari profile private thai jase, so fans tamaru public profile nahi joi sake. Choose a plan to keep it live.`;
  }

  return "Here's how your Inflixo profile is looking today.";
}

