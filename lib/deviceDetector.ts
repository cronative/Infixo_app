// Lightweight User-Agent & Device Parser for Infixo

export interface DeviceInfo {
  deviceType: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
}

export function parseUserAgent(userAgentStr?: string | null): DeviceInfo {
  const ua = (userAgentStr || "").toLowerCase();

  // 1. Detect Device Type
  let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "tablet";
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    deviceType = "mobile";
  }

  // 2. Detect Operating System
  let os = "Unknown OS";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    os = "iOS";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("mac os") || ua.includes("macintosh")) {
    os = "macOS";
  } else if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("linux")) {
    os = "Linux";
  }

  // 3. Detect Browser
  let browser = "Unknown Browser";
  if (ua.includes("edg/")) {
    browser = "Microsoft Edge";
  } else if (ua.includes("chrome") && !ua.includes("chromium") && !ua.includes("edg/")) {
    browser = "Chrome";
  } else if (ua.includes("safari") && !ua.includes("chrome")) {
    browser = "Safari";
  } else if (ua.includes("firefox")) {
    browser = "Firefox";
  } else if (ua.includes("opera") || ua.includes("opr/")) {
    browser = "Opera";
  }

  return {
    deviceType,
    browser,
    os,
  };
}
