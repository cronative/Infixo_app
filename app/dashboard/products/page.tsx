"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent } from "react";
import {
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  Tag,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
  Search,
  Sparkles,
} from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage } from "@/components/products/ProductImage";
import { ProductLimitModal } from "@/components/products/ProductLimitModal";
import { useToast } from "@/contexts/ToastContext";
import { getPlanQuota } from "@/services/subscriptionLimits";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import { ProductApiError, ProductService } from "@/services/ProductService";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { useCreator } from "@/contexts/CreatorContext";
import { PhonePreview } from "@/components/dashboard/PhonePreview";
import type { ShopProduct } from "@/types";
import { OverLimitBadge } from "@/components/ui/OverLimitBadge";

interface ProductForm { url: string; name: string; image: string; price: string; note: string; isAffiliate: boolean }

const blank: ProductForm = { url: "", name: "", image: "", price: "", note: "", isAffiliate: true };
const FETCH_FAILED = "Couldn't fetch details. Please add them manually.";
const SEARCH_THRESHOLD = 6;
const fieldClass = "flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors";
const iconBoxClass = "flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]";
const inputClass = "flex-1 min-w-0 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none";
const primaryButton = "dash-btn-primary";

const formatRupees = (price: number) => `₹${price.toLocaleString("en-IN")}`;

/** Keeps digits and one decimal point while typing; commas, ₹ and spaces are dropped. */
function sanitizePrice(raw: string) {
  const [whole, ...rest] = raw.replace(/[^\d.]/g, "").split(".");
  return (rest.length ? `${whole}.${rest.join("")}` : whole).slice(0, 12);
}

/** Rounds to the nearest whole rupee: "22900.50" → "22901". Never joins the decimal digits on. */
function roundPrice(raw: string) {
  const value = parseFloat(sanitizePrice(raw));
  return Number.isFinite(value) ? String(Math.round(value)) : "";
}

function looksLikeUrl(value: string) {
  return /^(https?:\/\/)?[^\s/]+\.[^\s]+/i.test(value.trim());
}

export default function ProductsPage() {
  const { profile } = useCreator();
  const { showToast } = useToast();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [limit, setLimit] = useState<number | null>(null);
  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [previewState, setPreviewState] = useState<"idle" | "loading" | "failed">("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFocused, setPriceFocused] = useState(false);
  const operation = useRef(false);
  const imageVersion = useRef(0);
  const previewController = useRef<AbortController | null>(null);
  // Last link we fetched details for (or the saved link when editing), so unchanged links are never re-fetched.
  const previewedUrl = useRef("");

  const used = products.length;
  const isLimitReached = limit !== null && used >= limit;
  const planName = getPlanQuota(plan).name;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError("");
    ProductService.shopList(controller.signal).then((data) => {
      setProducts(data.items); setLimit(data.limit); setPlan(data.plan);
    }).catch((err) => {
      if (!controller.signal.aborted) setLoadError(err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  function closeForm() {
    imageVersion.current++;
    previewController.current?.abort();
    setOpen(false);
  }

  function edit(product?: ShopProduct) {
    if (!product && isLimitReached) {
      setShowLimitModal(true);
      return;
    }
    imageVersion.current++;
    previewController.current?.abort();
    previewedUrl.current = product?.url.trim() || "";
    setEditing(product || null);
    setForm(product ? {
      url: product.url,
      name: product.name,
      image: product.image,
      price: product.price === null ? "" : String(product.price),
      note: product.note,
      isAffiliate: product.isAffiliate,
    } : blank);
    setError(""); setImageBusy(false); setPreviewState("idle"); setOpen(true);
  }

  async function fetchPreview(rawUrl: string) {
    const url = rawUrl.trim();
    if (!looksLikeUrl(url) || url === previewedUrl.current) return;
    previewController.current?.abort();
    const controller = new AbortController();
    previewController.current = controller;
    previewedUrl.current = url;
    setPreviewState("loading");
    try {
      const preview = await ProductService.preview(url, controller.signal);
      if (controller.signal.aborted) return;
      if (!preview.name && !preview.image) { setPreviewState("failed"); return; }
      // Only fill what the creator hasn't typed yet.
      setForm((value) => ({
        ...value,
        name: value.name || preview.name.slice(0, 80),
        image: value.image || preview.image,
        price: value.price || (preview.price !== null ? String(preview.price) : ""),
      }));
      setPreviewState(preview.image ? "idle" : "failed");
    } catch {
      if (!controller.signal.aborted) setPreviewState("failed");
    }
  }

  function linkPasted(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").trim();
    if (!pasted) return;
    event.preventDefault();
    setForm((value) => ({ ...value, url: pasted }));
    void fetchPreview(pasted);
  }

  async function imageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024 || file.size === 0) {
      setError("Choose a JPEG, PNG or WebP image under 5MB."); return;
    }
    const version = ++imageVersion.current;
    setImageBusy(true); setError("");
    try {
      const image = await resizeImageToDataUrl(file, 800);
      if (version === imageVersion.current) setForm((value) => ({ ...value, image }));
    } catch { if (version === imageVersion.current) setError("Could not read this image. Please choose another."); }
    finally { if (version === imageVersion.current) setImageBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operation.current || imageBusy) return;
    if (!form.url.trim()) { setError("Paste a product link."); return; }
    if (!form.name.trim()) { setError("Enter a product name."); return; }
    if (!form.image) { setError("Add a product image."); return; }
    operation.current = true; setBusy(true); setError("");
    const input = {
      url: form.url.trim(),
      name: form.name.trim(),
      image: form.image,
      price: roundPrice(form.price) ? Number(roundPrice(form.price)) : null,
      note: form.note.trim(),
      isAffiliate: form.isAffiliate,
    };
    try {
      const product = editing ? await ProductService.update(editing.id, input) : await ProductService.create(input);
      setProducts((items) => editing ? items.map((item) => item.id === product.id ? product : item) : [...items, product]);
      closeForm();
      showToast(editing ? "Product updated" : "Product added");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save product.", "error");
      if (err instanceof ProductApiError && err.code === "LIMIT_REACHED") setShowLimitModal(true);
    } finally { operation.current = false; setBusy(false); }
  }

  async function restore(product: ShopProduct, index: number) {
    try {
      const restored = await ProductService.restore(product.id);
      setProducts((items) => {
        const next = items.filter((item) => item.id !== restored.id);
        next.splice(Math.min(index, next.length), 0, restored);
        return next;
      });
      showToast("Product restored");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not restore product.", "error");
    }
  }

  async function remove(product: ShopProduct) {
    const index = products.findIndex((item) => item.id === product.id);
    setProducts((items) => items.filter((item) => item.id !== product.id));
    try {
      await ProductService.remove(product.id);
      showToast("Product deleted", "success", { label: "Undo", onClick: () => void restore(product, index) }, 5000);
    } catch (err) {
      setProducts((items) => {
        if (items.some((item) => item.id === product.id)) return items;
        const next = [...items];
        next.splice(Math.min(index, next.length), 0, product);
        return next;
      });
      showToast(err instanceof Error ? err.message : "Could not delete product.", "error");
    }
  }

  const query = searchQuery.trim().toLowerCase();
  const showSearch = products.length > SEARCH_THRESHOLD;
  const displayProducts = showSearch && query
    ? products.filter((p) => p.name.toLowerCase().includes(query) || p.note.toLowerCase().includes(query))
    : products;

  return (
    <PageContainer className="text-left">
      <PageHeader
        {...PAGE_COPY.shop}
        meta={!loading && !loadError ? `${limit === null ? used : `${used} of ${limit}`} · ${planName}` : undefined}
        actions={
          <>
            {isLimitReached ? (
              <button type="button" onClick={() => setShowLimitModal(true)} className={primaryButton}>
                <Sparkles className="h-4 w-4" />
                <span>Upgrade to add more</span>
              </button>
            ) : (
              <button type="button" onClick={() => edit()} disabled={loading} className={`${primaryButton} disabled:opacity-50`}>
                <Plus className="h-4 w-4" />
                <span>Add product</span>
              </button>
            )}
          </>
        }
      />

      <div className="flex items-start gap-8">
        <div className="flex-1 min-w-0 space-y-5">
          {showSearch && (
        <div className="relative flex items-center h-9 rounded-[5px] border border-[#ECECF0] bg-white px-3 gap-2 w-full sm:w-64 focus-within:border-[#7A2253] transition-colors">
          <Search className="h-4 w-4 text-[#94a3b8] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full text-[13px] text-[#18181B] placeholder:text-[#94a3b8] bg-transparent outline-none"
          />
          {searchQuery && (
            <button type="button" aria-label="Clear search" onClick={() => setSearchQuery("")} className="text-[#94a3b8] hover:text-[#18181B]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div role="status" aria-label="Loading products" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((id) => (
            <div key={id} className="h-64 animate-pulse rounded-[5px] border border-[#ECECF0] bg-slate-100" />
          ))}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-[5px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{loadError}</p>
          <button className="mt-2 min-h-10 font-semibold underline" onClick={() => setReload((value) => value + 1)}>
            Try again
          </button>
        </div>
      ) : displayProducts.length === 0 ? (
        query ? (
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            title="No matching products"
            description="Try a different search term."
            action={
              <button type="button" className={primaryButton} onClick={() => setSearchQuery("")}>
                <X className="h-4 w-4" />
                <span>Clear search</span>
              </button>
            }
          />
        ) : (
          <div className="rounded-[5px] border-2 border-dashed border-[#ECECF0] bg-white/40 p-8 sm:p-10 text-center flex flex-col items-center justify-center">
            <div className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-[5px] bg-[#F7EEF2] text-[#7A2253]">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-[16px] text-[#18181B]">Add your first product</h4>
            <p className="mt-1 text-[12px] text-[#6B6B76] max-w-sm">
              Paste a product link and we&apos;ll fill in the details.
            </p>
            <button type="button" onClick={() => edit()} className={`mt-4 ${primaryButton}`}>
              <Plus className="h-4 w-4" />
              <span>Add product</span>
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-[5px] border border-[#ECECF0] bg-white overflow-hidden shadow-none flex flex-col"
            >
              <ProductImage
                src={product.image}
                name={product.name}
                className="w-full aspect-[4/3] rounded-none border-b border-[#ECECF0] bg-[#FAFAFB]"
              />
              <div className="p-3.5 flex flex-col flex-1 gap-1 text-left">
                <h2 className="font-semibold text-[14px] text-[#18181B] line-clamp-1" title={product.name}>
                  {product.name}
                </h2>
                {limit !== null && products.indexOf(product) >= limit && <OverLimitBadge className="self-start" />}
                {product.price !== null && (
                  <p className="font-bold text-base text-[#7A2253] tabular-nums">{formatRupees(product.price)}</p>
                )}
                {product.note && (
                  <p className="text-[12px] text-[#6B6B76] line-clamp-1" title={product.note}>{product.note}</p>
                )}
                <div className="mt-auto flex items-center gap-2 pt-2">
                  {product.isAffiliate && (
                    <span className="h-6 inline-flex items-center rounded-[5px] bg-[#FAFAFB] border border-[#ECECF0] px-2 text-[12px] font-medium text-[#6B6B76]">Affiliate</span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Edit ${product.name}`}
                      title="Edit product"
                      onClick={() => edit(product)}
                      className="h-8 w-8 rounded-[5px] border border-[#ECECF0] bg-white hover:bg-[#FAFAFB] text-[#6B6B76] hover:text-[#18181B] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${product.name}`}
                      title="Delete product"
                      onClick={() => void remove(product)}
                      className="h-8 w-8 rounded-[5px] border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
        </div>

        <PhonePreview username={profile.username} subpath="products" refreshTrigger={products} products={products} />
      </div>

      <Modal
        isOpen={open}
        onClose={() => { if (!busy) closeForm(); }}
        title={editing ? "Edit product" : "Add product"}
        description={editing ? "Update your product details." : "Paste a link and we'll fill in the details."}
        icon={<ShoppingBag className="h-5 w-5" />}
        size="lg"
        showCloseButton={!busy}
        closeOnEscape={!busy}
      >
        <form onSubmit={save} noValidate className="flex min-h-0 flex-col">
          <ModalBody className="p-4 sm:p-5 space-y-4 text-left">
            <fieldset disabled={busy} className="min-w-0 space-y-4">
              {/* 1. Product link */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="product-url" className="block text-[13px] font-medium text-[#0f172a]">
                    Product link <span className="text-[#C2414B]">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748b] text-right">
                    {previewState === "loading" ? "Fetching details…" : "Paste the link first."}
                  </span>
                </div>
                <div className={fieldClass}>
                  <div className={iconBoxClass}>
                    {previewState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                  </div>
                  <input
                    id="product-url"
                    autoFocus
                    type="url"
                    inputMode="url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    onPaste={linkPasted}
                    onBlur={() => void fetchPreview(form.url)}
                    maxLength={2048}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
                {previewState === "failed" && (
                  <p className="text-[11px] text-[#b45309]">{FETCH_FAILED}</p>
                )}
              </div>

              {/* 2. Product name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="product-name" className="block text-[13px] font-medium text-[#0f172a]">
                    Product name <span className="text-[#C2414B]">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748b]">{form.name.length}/80</span>
                </div>
                <div className={fieldClass}>
                  <div className={iconBoxClass}>
                    <Tag className="h-4 w-4" />
                  </div>
                  <input
                    id="product-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={80}
                    placeholder="e.g. Sony ZV-E10 camera"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* 3. Product image */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="block text-[13px] font-medium text-[#0f172a]">
                    Product image <span className="text-[#C2414B]">*</span>
                  </span>
                  <span className="text-[11px] text-[#64748b]">JPG, PNG or WebP · Max 5MB</span>
                </div>
                <label className="relative flex flex-col items-center justify-center p-4 border border-dashed border-[#cbd5e1] rounded-[5px] bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors cursor-pointer min-h-[108px] group">
                  <input
                    aria-label="Product image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={imageSelected}
                    disabled={busy || imageBusy}
                    className="sr-only"
                  />
                  {form.image ? (
                    <div className="flex items-center gap-3 w-full">
                      <ProductImage src={form.image} name="Product preview" className="h-16 w-16 rounded-[5px] shrink-0 border border-[#e2e8f0] bg-white" />
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-[#0f172a]">{imageBusy ? "Preparing..." : "Image added"}</span>
                        <span className="block text-[11px] text-[#7A2253] font-medium">Replace</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#64748b] group-hover:text-[#7A2253] mb-1">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-[#0f172a]">{imageBusy ? "Preparing..." : "Upload image"}</span>
                      <span className="text-[11px] text-[#94a3b8]">Filled automatically from the link when available</span>
                    </div>
                  )}
                </label>
              </div>

              {/* 4. Price */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="product-price" className="block text-[13px] font-medium text-[#0f172a]">
                    Price <span className="font-normal text-[#94a3b8]">(₹, optional)</span>
                  </label>
                  <span className="text-[11px] text-[#64748b]">Whole rupees.</span>
                </div>
                <div className={fieldClass}>
                  <div className={`${iconBoxClass} text-sm font-semibold`}>₹</div>
                  <input
                    id="product-price"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={priceFocused || !form.price ? form.price : Number(form.price).toLocaleString("en-IN")}
                    onFocus={() => setPriceFocused(true)}
                    onBlur={() => { setPriceFocused(false); setForm((value) => ({ ...value, price: roundPrice(value.price) })); }}
                    onPaste={(e) => { e.preventDefault(); setForm({ ...form, price: roundPrice(e.clipboardData.getData("text")) }); }}
                    onChange={(e) => setForm({ ...form, price: sanitizePrice(e.target.value) })}
                    placeholder="e.g. 22,900"
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
              </div>

              {/* 5. Why I recommend it */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="product-note" className="block text-[13px] font-medium text-[#0f172a]">
                    Why I recommend it <span className="font-normal text-[#94a3b8]">(optional)</span>
                  </label>
                  <span className="text-[11px] text-[#64748b]">{form.note.length}/120</span>
                </div>
                <div className={fieldClass}>
                  <div className={iconBoxClass}>
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <input
                    id="product-note"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    maxLength={120}
                    placeholder="e.g. My daily vlogging camera for 2 years"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* 6. Affiliate link */}
              <div className="flex items-center justify-between gap-3 rounded-[5px] border border-[#e2e8f0] bg-white px-3.5 py-3">
                <div className="min-w-0">
                  <p id="product-affiliate-label" className="text-[13px] font-medium text-[#0f172a]">Affiliate link</p>
                  <p className="text-[11px] text-[#64748b]">Shows a small &quot;Affiliate&quot; label on the card.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.isAffiliate}
                  aria-labelledby="product-affiliate-label"
                  onClick={() => setForm({ ...form, isAffiliate: !form.isAffiliate })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 ${
                    form.isAffiliate ? "bg-[#7A2253]" : "bg-[#e2e8f0]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      form.isAffiliate ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </fieldset>

            {error && (
              <p role="alert" className="rounded-[5px] bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-100">
                {error}
              </p>
            )}
          </ModalBody>

          <ModalFooter className="px-5 sm:px-6 py-4">
            <button
              type="button"
              disabled={busy}
              onClick={closeForm}
              className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || imageBusy}
              className="h-10 px-5 rounded-[5px] bg-[#7A2253] text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-[#7A2253]/20 hover:opacity-95 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{editing ? (busy ? "Saving…" : "Save changes") : (busy ? "Adding…" : "Add product")}</span>
            </button>
          </ModalFooter>
        </form>
      </Modal>

      <ProductLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        used={used}
        limit={limit ?? used}
        plan={plan}
      />
    </PageContainer>
  );
}
