import { saveBase64ImageToStorage, validateImageBuffer } from "@/lib/imageStorage";
import { ProductValidationError, MAX_PRODUCT_BODY_BYTES } from "@/lib/productValidation";

export async function saveProductImage(value: unknown, existingImage?: string): Promise<string> {
  // An update can retain its own saved image, but cannot attach arbitrary URLs or another creator's asset.
  if (existingImage && value === existingImage) return existingImage;
  if (typeof value !== "string" || !value.trim()) {
    throw new ProductValidationError("Choose a valid product image.");
  }
  const trimmed = value.trim();
  // Already saved image path or asset URL
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/api/assets/") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.length > MAX_PRODUCT_BODY_BYTES) {
    throw new ProductValidationError("Choose a valid product image under 5MB.");
  }
  const match = /^data:image\/(jpeg|jpg|png|webp);base64,([\s\S]+)$/i.exec(trimmed);
  if (!match) {
    throw new ProductValidationError("Choose a JPEG, PNG or WebP product image.");
  }
  const ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  const rawBase64 = match[2].replace(/\s+/g, "");
  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(rawBase64, "base64");
    validateImageBuffer(fileBuffer, ext);
  } catch {
    throw new ProductValidationError("Invalid image. Choose a JPEG, PNG or WebP under 5MB.");
  }
  const saved = await saveBase64ImageToStorage(trimmed, "products", "product");
  if (!saved) throw new Error("Product image storage failed");
  return saved;
}
