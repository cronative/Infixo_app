import type { CreatorProduct } from "@/types";

export interface ProductInput { name: string; image: string; price: string; productUrl: string }

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...options, cache: "no-store" });
  } catch (err) {
    throw new Error(err instanceof Error && err.message ? err.message : "Network request failed. Please check your connection.");
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.status !== 1) {
    throw new Error(body?.message || `Request failed with status ${response.status}. Please try again.`);
  }
  return body.data as T;
}

export const ProductService = {
  async list(signal?: AbortSignal) {
    return (await request<{ products: CreatorProduct[] }>("/api/creator/products", { signal })).products;
  },
  async save(input: ProductInput, id?: string) {
    return (await request<{ product: CreatorProduct }>(`/api/creator/products${id ? `?id=${encodeURIComponent(id)}` : ""}`, {
      method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
    })).product;
  },
  async remove(id: string) { await request(`/api/creator/products?id=${encodeURIComponent(id)}`, { method: "DELETE" }); },
};
