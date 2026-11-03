"use client";

import { useSyncExternalStore } from "react";

/**
 * Client-side setup-checklist steps that have no server field of their own.
 * Writes broadcast an in-page event so the dashboard checklist updates live,
 * and the `storage` event keeps other open tabs in sync.
 */
export type SetupStep = "shared" | "theme";

const KEYS: Record<SetupStep, string> = {
  shared: "inflixo_profile_shared_once", // existing key, kept for continuity
  theme: "inflixo_theme_confirmed",
};
const EVENT = "inflixo:setup-progress";

export function isSetupStepDone(step: SetupStep): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(KEYS[step]) === "true";
  } catch {
    return false;
  }
}

export function markSetupStep(step: SetupStep): void {
  if (typeof window === "undefined" || isSetupStepDone(step)) return;
  try {
    localStorage.setItem(KEYS[step], "true");
  } catch {
    // Storage blocked: nothing to persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useSetupStep(step: SetupStep): boolean {
  return useSyncExternalStore(subscribe, () => isSetupStepDone(step), () => false);
}
