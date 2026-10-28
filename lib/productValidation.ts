export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_BODY_BYTES = 7 * 1024 * 1024;

const MAX_PRICE_RUPEES = 10_000_000;

export class ProductValidationError extends Error {
  constructor(message: string, public code = "VALIDATION_ERROR", public status = 422) { super(message); }
}

export function validateProductId(value: unknown): string {
  if (typeof value !== "string" || !/^prod_[a-f0-9-]{36}$/.test(value)) {
    throw new ProductValidationError("Invalid product ID.");
  }
  return value;
}

/** Whole rupees (0 to 10,000,000) → paise. Decimals, strings and out-of-range values are rejected. */
export function parseProductPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_PRICE_RUPEES) {
    throw new ProductValidationError("Price must be a whole number of rupees between 0 and 1,00,00,000.", "INVALID_PRICE", 400);
  }
  return value * 100;
}

export function validateProductFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProductValidationError("Invalid product details.");
  const body = value as Record<string, unknown>;
  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  if (!rawName) {
    throw new ProductValidationError("Product name is required.");
  }
  if (rawName.length > 80) {
    throw new ProductValidationError("Product name must be 80 characters or fewer.");
  }

  const rawUrl = typeof body.url === "string" ? body.url.trim() : (typeof body.productUrl === "string" ? body.productUrl.trim() : "");
  if (!rawUrl) {
    throw new ProductValidationError("Product link is required.");
  }
  let cleanUrl = rawUrl;
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = "https://" + cleanUrl;
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl);
  } catch {
    throw new ProductValidationError("Enter a valid https product link.");
  }
  if (parsedUrl.protocol !== "https:") {
    throw new ProductValidationError("Product link must use https://");
  }

  const rawNote = typeof body.note === "string" ? body.note.trim() : "";
  if (rawNote.length > 120) {
    throw new ProductValidationError("Recommendation note must be 120 characters or fewer.");
  }

  const isAffiliate = body.isAffiliate !== undefined ? Boolean(body.isAffiliate) : true;
  const rawImage = typeof body.image === "string" ? body.image.trim() : (typeof body.imageUrl === "string" ? body.imageUrl.trim() : "");

  return {
    name: rawName,
    url: cleanUrl,
    pricePaise: parseProductPrice(body.price),
    note: rawNote || null,
    isAffiliate,
    image: rawImage,
  };
}

export async function readProductBody(req: Request): Promise<unknown> {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    throw new ProductValidationError("Send product details as JSON.");
  }
  try {
    return await req.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes("too large")) {
      throw new ProductValidationError("Product image is too large. Choose an image under 5MB.");
    }
    throw new ProductValidationError("Invalid product details.");
  }
}
