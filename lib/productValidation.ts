export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_BODY_BYTES = 7 * 1024 * 1024;

export class ProductValidationError extends Error {}

export function validateProductId(value: unknown): string {
  if (typeof value !== "string" || !/^prod_[a-f0-9-]{36}$/.test(value)) {
    throw new ProductValidationError("Invalid product ID.");
  }
  return value;
}

export function parseProductPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" && typeof value !== "number") throw new ProductValidationError("Enter a valid price.");
  const input = String(value).trim();
  if (!input) return null;
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(input)) throw new ProductValidationError("Price must be a positive amount with up to two decimal places.");
  const [rupees, fraction = ""] = input.split(".");
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  if (paise <= 0 || paise > 2147483647) throw new ProductValidationError("Price must be between ₹0.01 and ₹21,474,836.47.");
  return paise;
}

export function validateProductFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProductValidationError("Invalid product details.");
  const body = value as Record<string, unknown>;
  if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 180) {
    throw new ProductValidationError("Product name must be between 1 and 180 characters.");
  }
  if (typeof body.productUrl !== "string" || !body.productUrl.trim() || body.productUrl.trim().length > 2048) {
    throw new ProductValidationError("Enter a valid http or https product link.");
  }
  let cleanUrl = body.productUrl.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = "https://" + cleanUrl;
  }
  let url: URL;
  try {
    url = new URL(cleanUrl);
  } catch {
    throw new ProductValidationError("Enter a valid http or https product link.");
  }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new ProductValidationError("Enter a valid http or https product link without embedded credentials.");
  }
  // Preserve the original affiliate query string rather than rewriting its encoding.
  return { name: body.name.trim(), productUrl: cleanUrl, pricePaise: parseProductPrice(body.price), image: body.image };
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
