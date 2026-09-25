import fs from "fs";
import path from "path";
import { buildStorageKey, isR2Configured, uploadBufferToR2 } from "@/lib/r2Storage";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const IMAGE_SIGNATURES = {
  jpg: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  png: (buffer: Buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  webp: (buffer: Buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP",
} as const;

export type SafeImageExtension = keyof typeof IMAGE_SIGNATURES;

export function validateImageBuffer(buffer: Buffer, requestedExtension?: string): SafeImageExtension {
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error("Image must be between 1 byte and 5MB");
  }

  const detected = (Object.entries(IMAGE_SIGNATURES) as Array<[SafeImageExtension, (value: Buffer) => boolean]>)
    .find(([, matches]) => matches(buffer))?.[0];
  if (!detected) throw new Error("Only valid JPEG, PNG, and WebP images are allowed");

  const normalized = requestedExtension?.toLowerCase() === "jpeg" ? "jpg" : requestedExtension?.toLowerCase();
  if (normalized && normalized !== detected) throw new Error("Image contents do not match the declared file type");
  return detected;
}

export type ImageFolder =
  | "avatars"
  | "posters"
  | "brands"
  | "team"
  | "collaborations"
  | "reviews"
  | "uploads"
  | "products";

/**
 * Saves a base64 Data URL to a disk file in public/uploads/<folder>/,
 * returning the relative path (e.g., /uploads/avatars/avatar_123.jpg).
 *
 * If the input is already a relative URL (/uploads/...), external URL (http/https),
 * or null/empty, it returns it directly without re-saving.
 */
export function saveBase64Image(
  dataUrlOrPath: string | null | undefined,
  folder: ImageFolder = "avatars",
  prefix: string = "img"
): string | null {
  if (!dataUrlOrPath || typeof dataUrlOrPath !== "string") {
    return null;
  }

  const trimmed = dataUrlOrPath.trim();
  if (!trimmed) return null;

  // Already a relative server path or external URL
  if (
    trimmed.startsWith("/uploads/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  // Check if it's a data URL (e.g., data:image/png;base64,...)
  const matches = trimmed.match(/^data:image\/([a-zA-Z0-9\+\-]+);base64,(.+)$/);
  if (!matches) {
    // If not a data URL and not an absolute path, return null to avoid junk base64 in DB
    return null;
  }

  try {
    let extension = matches[1].toLowerCase();
    if (extension === "jpeg") extension = "jpg";
    if (!(["jpg", "png", "webp"] as string[]).includes(extension)) return null;

    const base64Data = matches[2];
    const fileBuffer = Buffer.from(base64Data, "base64");
    validateImageBuffer(fileBuffer, extension);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, fileBuffer);
    const relativeUrl = `/uploads/${folder}/${fileName}`;

    console.log(`💾 [imageStorage] Saved base64 image to disk: ${relativeUrl}`);
    return relativeUrl;
  } catch (err) {
    console.error("❌ [imageStorage] Failed to save base64 image to disk:", err);
    return null;
  }
}

function getImageExtension(mimeExtension: string) {
  let extension = mimeExtension.toLowerCase();
  if (extension === "jpeg") extension = "jpg";
  return extension;
}

/**
 * Saves a base64 image to the configured object storage when R2 env is present.
 * Falls back to local /public/uploads for local development.
 */
export async function saveBase64ImageToStorage(
  dataUrlOrPath: string | null | undefined,
  folder: ImageFolder = "avatars",
  prefix: string = "img"
): Promise<string | null> {
  if (!dataUrlOrPath || typeof dataUrlOrPath !== "string") {
    return null;
  }

  const trimmed = dataUrlOrPath.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("/uploads/") ||
    trimmed.startsWith("/api/assets/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  const matches = trimmed.match(/^data:image\/([a-zA-Z0-9\+\-]+);base64,(.+)$/);
  if (!matches) return null;

  const extension = getImageExtension(matches[1]);
  const fileBuffer = Buffer.from(matches[2], "base64");
  validateImageBuffer(fileBuffer, extension);
  const contentType = `image/${extension === "jpg" ? "jpeg" : extension}`;

  if (isR2Configured()) {
    try {
      const key = buildStorageKey(folder, prefix, extension);
      return await uploadBufferToR2(key, fileBuffer, contentType);
    } catch (err) {
      console.error("[imageStorage] R2 upload failed:", err);
      if (process.env.NODE_ENV === "production") return null;
    }
  }

  return saveBase64Image(trimmed, folder, prefix);
}

export async function saveImageBufferToStorage(
  fileBuffer: Buffer,
  folder: ImageFolder = "avatars",
  prefix: string = "img",
  extension: string = "png",
  contentType: string = "image/png"
): Promise<string | null> {
  const cleanExtension = getImageExtension(extension);
  const detectedExtension = validateImageBuffer(fileBuffer, cleanExtension);
  const safeContentType = `image/${detectedExtension === "jpg" ? "jpeg" : detectedExtension}`;

  if (isR2Configured()) {
    try {
      const key = buildStorageKey(folder, prefix, detectedExtension);
      return await uploadBufferToR2(key, fileBuffer, safeContentType);
    } catch (err) {
      console.error("[imageStorage] R2 buffer upload failed:", err);
      if (process.env.NODE_ENV === "production") return null;
    }
  }

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads", folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${detectedExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, fileBuffer);
    return `/uploads/${folder}/${fileName}`;
  } catch (err) {
    console.error("❌ [imageStorage] Failed to save image buffer:", err);
    return null;
  }
}
