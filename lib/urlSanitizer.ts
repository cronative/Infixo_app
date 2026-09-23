/**
 * Production URL Sanitizer & Protocol Validator
 *
 * Protects against Stored XSS and malicious protocol injection (javascript:, data:, vbscript:)
 * in creator-submitted links, portfolio links, and external social URLs.
 */

const DANGEROUS_PROTOCOL_REGEX = /^(?:javascript|data|vbscript|file):/i;
const ALLOWED_PROTOCOLS = new Set(["https:", "http:", "mailto:", "tel:"]);

export interface SanitizeUrlOptions {
  allowEmpty?: boolean;
  defaultProtocol?: "https:" | "http:";
}

/**
 * Sanitizes and validates an external URL.
 *
 * - Strips control characters and whitespace.
 * - Rejects dangerous protocols (javascript:, data:, vbscript:, etc.).
 * - Automatically prepends https:// if a user inputs a domain without protocol (e.g., "instagram.com/user").
 * - Returns sanitized URL string, or null (or empty string if allowEmpty is true) if invalid/dangerous.
 */
export function sanitizeUrl(
  input: unknown,
  options: SanitizeUrlOptions = {}
): string | null {
  if (typeof input !== "string") {
    return options.allowEmpty ? "" : null;
  }

  // Strip control characters and whitespace
  let cleaned = input.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();

  if (!cleaned) {
    return options.allowEmpty ? "" : null;
  }

  // Remove interior spaces in protocol check (e.g., "java script:")
  const protocolCheck = cleaned.replace(/\s+/g, "");
  if (DANGEROUS_PROTOCOL_REGEX.test(protocolCheck)) {
    return options.allowEmpty ? "" : null;
  }

  // If input starts with // (protocol-relative), prepend https:
  if (cleaned.startsWith("//")) {
    cleaned = `https:${cleaned}`;
  } else if (
    !cleaned.startsWith("http://") &&
    !cleaned.startsWith("https://") &&
    !cleaned.startsWith("mailto:") &&
    !cleaned.startsWith("tel:")
  ) {
    // If user provided a domain/handle like "instagram.com/myname" or "www.site.com"
    const defaultProto = options.defaultProtocol || "https:";
    cleaned = `${defaultProto}//${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return options.allowEmpty ? "" : null;
    }
    return parsed.toString();
  } catch {
    // mailto: and tel: may have edge-case parsing in URL depending on format
    if (cleaned.startsWith("mailto:") || cleaned.startsWith("tel:")) {
      return cleaned;
    }
    return options.allowEmpty ? "" : null;
  }
}

/**
 * Returns true if the URL is safe to render in an <a href={...}> tag.
 */
export function isSafeUrl(input: unknown): boolean {
  return sanitizeUrl(input) !== null;
}
