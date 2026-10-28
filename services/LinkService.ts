export interface LinkChildDto { id: string; title: string; url: string; iconUrl: string | null }
export interface LinkDto {
  id: string;
  kind: "link" | "group";
  title: string;
  url: string;
  pinned: boolean;
  iconUrl: string | null;
  position: number;
  children: LinkChildDto[];
}
export interface LinkInputDto {
  kind: "link" | "group";
  title: string;
  url?: string;
  pinned?: boolean;
  children?: { id?: string; title: string; url: string }[];
}
export interface LinksList { items: LinkDto[]; used: number; limit: number | null; plan: string }

export class LinkApiError extends Error {
  constructor(message: string, public code: string, public status: number) { super(message); }
}

async function call<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...options, cache: "no-store" });
  } catch {
    throw new LinkApiError("Network request failed. Please check your connection.", "NETWORK", 0);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message || body?.message || `Request failed with status ${response.status}. Please try again.`;
    throw new LinkApiError(message, body?.error?.code || "ERROR", response.status);
  }
  return body as T;
}

const json = (method: string, data: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export const LinkService = {
  list: (signal?: AbortSignal) => call<LinksList>("/api/links", { signal }),
  create: (input: LinkInputDto) => call<LinkDto>("/api/links", json("POST", input)),
  update: (id: string, input: LinkInputDto) => call<LinkDto>(`/api/links/${encodeURIComponent(id)}`, json("PATCH", input)),
  remove: (id: string) => call<{ id: string }>(`/api/links/${encodeURIComponent(id)}`, { method: "DELETE" }),
  reorder: (ids: string[]) => call<{ ids: string[] }>("/api/links/order", json("PUT", { ids })),
};
