import React from "react";

export interface PlatformInfo {
  id: string;
  name: string;
  destinationLabel: string;
  isKnownApp: boolean;
  bgClass: string;
  textClass: string;
  renderIcon: (compact?: boolean) => React.ReactNode;
}

/**
 * Extracts the bare domain from a URL (e.g. "https://www.inflixo.com/path" -> "inflixo.com")
 */
export function extractBareDomain(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const urlStr = rawUrl.startsWith("http://") || rawUrl.startsWith("https://") ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(urlStr);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    return host;
  } catch {
    return rawUrl
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0] || rawUrl;
  }
}

/**
 * Clean domain→platform mapping using local SVGs.
 * Style rule: Consistent solid brand-color tile + white icon across all platforms.
 */
export function getPlatformFromUrl(rawUrl: string): PlatformInfo {
  const bare = extractBareDomain(rawUrl);
  const urlLower = (rawUrl || "").toLowerCase();

  // 1. Google Maps: Solid Red tile + White pin icon
  if (
    bare === "maps.google.com" ||
    bare === "maps.app.goo.gl" ||
    bare === "goo.gl" ||
    bare.includes("google.com/maps") ||
    urlLower.includes("/maps") ||
    urlLower.includes("maps.google")
  ) {
    return {
      id: "google_maps",
      name: "Google Maps",
      destinationLabel: "Opens in Google Maps",
      isKnownApp: true,
      bgClass: "bg-[#EA4335] text-white",
      textClass: "text-[#EA4335]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={compact ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-white"}
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
        </svg>
      ),
    };
  }

  // 2. WhatsApp: Solid Green tile + White icon
  if (
    bare === "wa.me" ||
    bare.includes("whatsapp.com") ||
    urlLower.includes("chat.whatsapp.com") ||
    urlLower.includes("wa.me")
  ) {
    return {
      id: "whatsapp",
      name: "WhatsApp",
      destinationLabel: "Opens in WhatsApp",
      isKnownApp: true,
      bgClass: "bg-[#25D366] text-white",
      textClass: "text-[#25D366]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={compact ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-white"}
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    };
  }

  // 3. Amazon: Solid Dark Navy/Slate tile + White icon
  if (
    bare.includes("amazon.") ||
    bare.includes("amzn.to") ||
    bare.includes("amzn.in") ||
    urlLower.includes("amazon.in")
  ) {
    return {
      id: "amazon",
      name: "Amazon",
      destinationLabel: "Opens on Amazon",
      isKnownApp: true,
      bgClass: "bg-[#232F3E] text-white",
      textClass: "text-[#232F3E]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={compact ? "w-3.5 h-3.5 text-white" : "w-4.5 h-4.5 text-white"}
        >
          <path d="M15.42 16.48c-.28-.21-.49-.49-.49-.91 0-.67.56-1.19 1.4-1.19.46 0 .8.1 1.05.28v.82c-.42.63-1.22 1-1.96 1zm1.96-3.85c-.46-.35-1.19-.53-2.1-.53-1.68 0-3.08.77-3.43 2.1-.07.28.1.53.38.56.28.03.49-.14.56-.42.21-.84 1.19-1.33 2.38-1.33.67 0 1.23.14 1.54.38.31.24.46.59.46 1.05v.35c-.42-.14-.98-.24-1.64-.24-1.89 0-3.15.91-3.15 2.45 0 1.4 1.05 2.31 2.52 2.31 1.15 0 2.03-.49 2.48-1.33v1.08c0 .28.21.49.49.49h.73c.28 0 .49-.21.49-.49v-4.9c0-1.12-.46-1.99-1.46-2.52zM21.7 18.73c-2.8 2.06-6.86 3.15-10.36 3.15-4.9 0-9.31-1.82-12.67-4.83-.28-.24-.07-.63.28-.46 3.5 1.75 7.7 2.8 12.04 2.8 3.08 0 6.51-.77 9.66-2.38.49-.24.87.28.46.72z" />
        </svg>
      ),
    };
  }

  // 4. YouTube: Solid Red tile + White icon
  if (
    bare === "youtube.com" ||
    bare.endsWith(".youtube.com") ||
    bare === "youtu.be"
  ) {
    return {
      id: "youtube",
      name: "YouTube",
      destinationLabel: "Opens on YouTube",
      isKnownApp: true,
      bgClass: "bg-[#FF0000] text-white",
      textClass: "text-[#FF0000]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={compact ? "w-3 h-3 text-white" : "w-3.5 h-3.5 text-white"}
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    };
  }

  // 5. Instagram: Solid Gradient tile + White icon
  if (
    bare === "instagram.com" ||
    bare.endsWith(".instagram.com") ||
    bare === "instagr.am"
  ) {
    return {
      id: "instagram",
      name: "Instagram",
      destinationLabel: "Opens on Instagram",
      isKnownApp: true,
      bgClass: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white",
      textClass: "text-[#E1306C]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={compact ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-white"}
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    };
  }

  // 6. Facebook: Solid Blue tile + White icon
  if (
    bare === "facebook.com" ||
    bare.endsWith(".facebook.com") ||
    bare === "fb.com" ||
    bare === "fb.me"
  ) {
    return {
      id: "facebook",
      name: "Facebook",
      destinationLabel: "Opens on Facebook",
      isKnownApp: true,
      bgClass: "bg-[#1877F2] text-white",
      textClass: "text-[#1877F2]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={compact ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-white"}
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    };
  }

  // 7. Telegram: Solid Cyan tile + White icon
  if (
    bare === "t.me" ||
    bare.includes("telegram.me") ||
    bare.includes("telegram.org")
  ) {
    return {
      id: "telegram",
      name: "Telegram",
      destinationLabel: "Opens in Telegram",
      isKnownApp: true,
      bgClass: "bg-[#24A1DE] text-white",
      textClass: "text-[#24A1DE]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={compact ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-white"}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
        </svg>
      ),
    };
  }

  // 8. Spotify: Solid Spotify Green tile + White icon
  if (
    bare === "spotify.com" ||
    bare.endsWith(".spotify.com") ||
    bare === "spoti.fi"
  ) {
    return {
      id: "spotify",
      name: "Spotify",
      destinationLabel: "Opens in Spotify",
      isKnownApp: true,
      bgClass: "bg-[#1DB954] text-white",
      textClass: "text-[#1DB954]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={compact ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-white"}
        >
          <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.521 17.341c-.218.358-.684.474-1.042.256-2.858-1.747-6.456-2.142-10.695-1.172-.405.093-.811-.161-.904-.566-.093-.404.162-.81.566-.903 4.636-1.06 8.599-.61 11.819 1.343.358.218.474.684.256 1.042zm1.474-3.277c-.275.447-.862.589-1.309.314-3.27-2.01-8.256-2.593-12.126-1.418-.501.152-1.03-.134-1.182-.635-.152-.501.134-1.03.635-1.182 4.417-1.34 9.907-.69 13.668 1.622.447.275.589.862.314 1.309zm.126-3.414C15.228 8.423 8.799 8.21 5.034 9.354c-.613.186-1.266-.164-1.452-.777-.186-.613.164-1.266.777-1.452 4.316-1.31 11.411-1.063 15.82 1.554.552.327.734 1.041.407 1.593-.327.552-1.04.734-1.593.407z" />
        </svg>
      ),
    };
  }

  // 9. Google Drive / Docs: Solid Green/Blue tile + White icon
  if (
    bare.includes("drive.google.com") ||
    bare.includes("docs.google.com")
  ) {
    const isDocs = bare.includes("docs.google.com");
    return {
      id: isDocs ? "google_docs" : "google_drive",
      name: isDocs ? "Google Docs" : "Google Drive",
      destinationLabel: isDocs ? "Opens in Google Docs" : "Opens in Google Drive",
      isKnownApp: true,
      bgClass: isDocs ? "bg-[#4285F4] text-white" : "bg-[#0F9D58] text-white",
      textClass: isDocs ? "text-[#4285F4]" : "text-[#0F9D58]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={compact ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-white"}
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    };
  }

  // 10. Notion: Solid Black tile + White letter
  if (bare.includes("notion.so") || bare.includes("notion.site")) {
    return {
      id: "notion",
      name: "Notion",
      destinationLabel: "Opens in Notion",
      isKnownApp: true,
      bgClass: "bg-black text-white",
      textClass: "text-slate-900 dark:text-white",
      renderIcon: (compact?: boolean) => (
        <span className={compact ? "text-xs font-serif font-black text-white" : "text-sm font-serif font-black text-white"}>
          N
        </span>
      ),
    };
  }

  // 11. Flipkart: Solid Blue tile + White letter
  if (bare.includes("flipkart.com")) {
    return {
      id: "flipkart",
      name: "Flipkart",
      destinationLabel: "Opens on Flipkart",
      isKnownApp: true,
      bgClass: "bg-[#2874F0] text-white",
      textClass: "text-[#2874F0]",
      renderIcon: (compact?: boolean) => (
        <span className={compact ? "text-xs font-bold text-white" : "text-sm font-bold text-white"}>
          f
        </span>
      ),
    };
  }

  // 12. Meesho: Solid Magenta/Pink tile + White letter
  if (bare.includes("meesho.com")) {
    return {
      id: "meesho",
      name: "Meesho",
      destinationLabel: "Opens on Meesho",
      isKnownApp: true,
      bgClass: "bg-[#9B277B] text-white",
      textClass: "text-[#9B277B]",
      renderIcon: (compact?: boolean) => (
        <span className={compact ? "text-xs font-extrabold text-white" : "text-sm font-extrabold text-white"}>
          m
        </span>
      ),
    };
  }

  // 13. Zomato: Solid Red tile + White letter
  if (bare.includes("zomato.com")) {
    return {
      id: "zomato",
      name: "Zomato",
      destinationLabel: "Opens on Zomato",
      isKnownApp: true,
      bgClass: "bg-[#E23744] text-white",
      textClass: "text-[#E23744]",
      renderIcon: (compact?: boolean) => (
        <span className={compact ? "text-xs font-black tracking-tight text-white" : "text-sm font-black tracking-tight text-white"}>
          Z
        </span>
      ),
    };
  }

  // 14. Swiggy: Solid Orange tile + White letter
  if (bare.includes("swiggy.com")) {
    return {
      id: "swiggy",
      name: "Swiggy",
      destinationLabel: "Opens on Swiggy",
      isKnownApp: true,
      bgClass: "bg-[#FC8019] text-white",
      textClass: "text-[#FC8019]",
      renderIcon: (compact?: boolean) => (
        <span className={compact ? "text-xs font-black text-white" : "text-sm font-black text-white"}>
          S
        </span>
      ),
    };
  }

  // 15. X / Twitter: Solid Black tile + White logo
  if (
    bare === "twitter.com" ||
    bare.endsWith(".twitter.com") ||
    bare === "x.com" ||
    bare.endsWith(".x.com")
  ) {
    return {
      id: "x_twitter",
      name: "X",
      destinationLabel: "Opens on X",
      isKnownApp: true,
      bgClass: "bg-black text-white",
      textClass: "text-black dark:text-white",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={compact ? "w-3 h-3 text-white" : "w-3.5 h-3.5 text-white"}
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    };
  }

  // 16. LinkedIn: Solid Blue tile + White logo
  if (
    bare === "linkedin.com" ||
    bare.endsWith(".linkedin.com")
  ) {
    return {
      id: "linkedin",
      name: "LinkedIn",
      destinationLabel: "Opens on LinkedIn",
      isKnownApp: true,
      bgClass: "bg-[#0A66C2] text-white",
      textClass: "text-[#0A66C2]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={compact ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-white"}
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94z" />
        </svg>
      ),
    };
  }

  // 17. Linktree-like generic: Solid Forest Green tile + White icon
  if (
    bare.includes("linktr.ee") ||
    bare.includes("beacons.ai") ||
    bare.includes("bio.link") ||
    bare.includes("campsite.bio")
  ) {
    return {
      id: "linktree",
      name: "Linktree",
      destinationLabel: "Opens on Linktree",
      isKnownApp: true,
      bgClass: "bg-[#198844] text-white",
      textClass: "text-[#198844]",
      renderIcon: (compact?: boolean) => (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={compact ? "w-3.5 h-3.5 text-white" : "w-4 h-4 text-white"}
        >
          <path d="M13.5 13.5h5.25L15 9.75h3.75L12 3 5.25 9.75H9L5.25 13.5H10.5v6.75h3V13.5z" />
        </svg>
      ),
    };
  }

  // Fallback: Unknown domain -> Solid maroon brand tile + white initial letter
  const initialLetter = (bare[0] || "L").toUpperCase();
  return {
    id: "unknown",
    name: bare || "Link",
    destinationLabel: bare || "External Link",
    isKnownApp: false,
    bgClass: "bg-[#7A2253] text-white",
    textClass: "text-[#7A2253]",
    renderIcon: (compact?: boolean) => (
      <span className={compact ? "text-[11px] font-bold uppercase text-white" : "text-xs font-bold uppercase text-white"}>
        {initialLetter}
      </span>
    ),
  };
}
