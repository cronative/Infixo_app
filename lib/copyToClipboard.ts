/**
 * Universal & Bulletproof Copy-to-Clipboard helper
 * Works in secure contexts (HTTPS/localhost) AND non-secure HTTP contexts (local network IPs, dev servers),
 * iOS Safari, Android Chrome, and all desktop browsers.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // Method 1: Modern navigator.clipboard API (available in HTTPS or localhost)
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, falling back to execCommand", err);
    }
  }

  // Method 2: Legacy document.execCommand('copy') fallback (works on HTTP, older iOS/Android)
  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;

      // Position off-screen to avoid layout shifts or scrolling
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "-9999px";
      textarea.style.width = "2em";
      textarea.style.height = "2em";
      textarea.style.padding = "0";
      textarea.style.border = "none";
      textarea.style.outline = "none";
      textarea.style.boxShadow = "none";
      textarea.style.background = "transparent";
      textarea.setAttribute("readonly", "");

      document.body.appendChild(textarea);
      
      // Select text for iOS compatibility
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (successful) return true;
    } catch (err) {
      console.error("document.execCommand('copy') fallback failed:", err);
    }
  }

  return false;
}
