import fs from "fs";
import path from "path";

export type ImageFolder =
  | "avatars"
  | "posters"
  | "brands"
  | "team"
  | "collaborations"
  | "reviews"
  | "uploads";

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
    if (extension === "svg+xml") extension = "svg";

    const base64Data = matches[2];
    const fileBuffer = Buffer.from(base64Data, "base64");

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
