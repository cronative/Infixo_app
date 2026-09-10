// Centralized debug logger for Inflixo onboarding and auth flows.
// Set ENABLE_DEBUG_LOGS to true to enable console logs in terminal and browser, or false to disable.
export function isDebugEnabled(): boolean {
  if (typeof window !== "undefined") {
    const local = window.localStorage.getItem("ENABLE_DEBUG_LOGS");
    if (local !== null) return local === "true";
  }
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_DEBUG_LOGS !== undefined) {
    return process.env.NEXT_PUBLIC_DEBUG_LOGS === "true";
  }
  return true; // Enabled by default as requested to track errors, toggleable via ENABLE_DEBUG_LOGS
}

export function debugLog(tag: string, ...args: any[]) {
  if (isDebugEnabled()) {
    console.log(`🔍 [${tag}]`, ...args);
  }
}

export function debugError(tag: string, ...args: any[]) {
  if (isDebugEnabled()) {
    console.error(`🚨 [${tag}]`, ...args);
  }
}

