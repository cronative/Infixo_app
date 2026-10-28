import sharp from "sharp";
import { saveImageBufferToStorage } from "@/lib/imageStorage";
import { ProductValidationError, MAX_PRODUCT_BODY_BYTES, MAX_PRODUCT_IMAGE_BYTES } from "@/lib/productValidation";
import { readLimitedBody, safeFetch } from "@/lib/safeFetch";

const MAX_REMOTE_IMAGE_BYTES = 10 * 1024 * 1024;
const PRODUCT_IMAGE_SIZE = 800;

/** Normalises any accepted input to an 800px WebP so we never serve originals or hotlinked store images. */
async function resizeToWebp(input: Buffer): Promise<Buffer> {
  try {
    return await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_SIZE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ProductValidationError("Invalid image. Choose a JPEG, PNG or WebP under 5MB.");
  }
}

async function store(buffer: Buffer): Promise<string> {
  const saved = await saveImageBufferToStorage(await resizeToWebp(buffer), "products", "prod", "webp", "image/webp");
  if (!saved) throw new Error("Product image storage failed");
  return saved;
}

export async function saveProductImage(value: unknown, existingImage?: string): Promise<string> {
  // An update can retain its own saved image, but cannot attach arbitrary URLs or another creator's asset.
  if (existingImage && value === existingImage) return existingImage;
  if (typeof value !== "string" || !value.trim()) {
    throw new ProductValidationError("Choose a valid product image.");
  }
  const trimmed = value.trim();

  // Image auto-filled from the product link: download it into our own storage.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const res = await safeFetch(trimmed, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", Accept: "image/*" },
      });
      if (!res.ok || !(res.headers.get("content-type") || "").startsWith("image/")) throw new Error(`HTTP ${res.status}`);
      return await store(await readLimitedBody(res, MAX_REMOTE_IMAGE_BYTES));
    } catch (err) {
      console.warn("Failed to save remote product image:", err);
      throw new ProductValidationError("Couldn't save the image from this link. Please upload it instead.");
    }
  }

  if (trimmed.length > MAX_PRODUCT_BODY_BYTES) {
    throw new ProductValidationError("Choose a valid product image under 5MB.");
  }
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([\s\S]+)$/i.exec(trimmed);
  if (!match) {
    throw new ProductValidationError("Choose a JPEG, PNG or WebP product image.");
  }
  const fileBuffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  if (!fileBuffer.length || fileBuffer.length > MAX_PRODUCT_IMAGE_BYTES) {
    throw new ProductValidationError("Invalid image. Choose a JPEG, PNG or WebP under 5MB.");
  }
  return store(fileBuffer);
}
