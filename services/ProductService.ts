import type { CreatorProduct, ShopProduct } from "@/types";

export interface ProductInput { url: string; name: string; image: string; price: number | null; note: string; isAffiliate: boolean }
export interface ShopList { items: ShopProduct[]; used: number; limit: number | null; plan: string }
export interface LinkPreview { name: string; image: string; price: number | null }

/** Error from /api/products, carrying the API's `error.code` (e.g. LIMIT_REACHED). */
export class ProductApiError extends Error {
  constructor(message: string, public code: string, public status: number) { super(message); }
}

async function call<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...options, cache: "no-store" });
  } catch {
    throw new ProductApiError("Network request failed. Please check your connection.", "NETWORK", 0);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // /api/products uses { error: { code, message } }; auth guards use { status: 0, message }.
    const message = body?.error?.message || body?.message || `Request failed with status ${response.status}. Please try again.`;
    throw new ProductApiError(message, body?.error?.code || "ERROR", response.status);
  }
  return body as T;
}

function json(method: string, input?: ProductInput): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: input ? JSON.stringify(input) : undefined };
}

export const ProductService = {
  /** Legacy list (paise) used by the dashboard home, preview and subscription pages. */
  async list(signal?: AbortSignal) {
    const body = await call<{ status: number; message?: string; data: { products: CreatorProduct[] } }>("/api/creator/products", { signal });
    return body.data.products;
  },
  shopList: (signal?: AbortSignal) => call<ShopList>("/api/products", { signal }),
  create: (input: ProductInput) => call<ShopProduct>("/api/products", json("POST", input)),
  update: (id: string, input: ProductInput) => call<ShopProduct>(`/api/products/${encodeURIComponent(id)}`, json("PATCH", input)),
  remove: (id: string) => call<{ id: string }>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
  restore: (id: string) => call<ShopProduct>(`/api/products/${encodeURIComponent(id)}/restore`, { method: "POST" }),
  async preview(url: string, signal?: AbortSignal): Promise<LinkPreview> {
    const body = await call<{ name: string | null; image: string | null; price: number | null }>(`/api/link-preview?type=product&url=${encodeURIComponent(url)}`, { signal });
    return { name: body.name || "", image: body.image || "", price: typeof body.price === "number" ? body.price : null };
  },
};
