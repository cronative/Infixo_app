"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, ShoppingBag, Trash2, UploadCloud } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductImage, formatProductPrice } from "@/components/products/ProductImage";
import { LimitReachedModal } from "@/components/ui/LimitReachedModal";
import { useToast } from "@/contexts/ToastContext";
import { useCreator } from "@/contexts/CreatorContext";
import { getPlanQuota } from "@/services/subscriptionLimits";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import { ProductService, type ProductInput } from "@/services/ProductService";
import type { CreatorProduct } from "@/types";

const blank: ProductInput = { name: "", image: "", price: "", productUrl: "" };
const primaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#043084] px-4 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 cursor-pointer";
const inputClass = "mt-1.5 w-full min-w-0 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#043084] focus:ring-2 focus:ring-[#043084]/10";

function safeHostname(urlStr?: string): string {
  if (!urlStr) return "";
  try {
    const raw = /^https?:\/\//i.test(urlStr.trim()) ? urlStr.trim() : `https://${urlStr.trim()}`;
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return urlStr;
  }
}

export default function ProductsPage() {
  const { showToast } = useToast();
  const { subscription } = useCreator();
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [editing, setEditing] = useState<CreatorProduct | null>(null);
  const [deleting, setDeleting] = useState<CreatorProduct | null>(null);
  const [form, setForm] = useState<ProductInput>(blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const operation = useRef(false);
  const imageVersion = useRef(0);

  const planKey = subscription?.planKey || "early_access";
  const quota = getPlanQuota(planKey);
  const maxProducts = quota.maxProducts;
  const isUnlimited = maxProducts === Infinity;
  const isLimitReached = !isUnlimited && products.length >= maxProducts;
  const percentage = isUnlimited ? 15 : Math.min(100, Math.round((products.length / maxProducts) * 100));

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError("");
    ProductService.list(controller.signal).then(setProducts).catch((err) => {
      if (!controller.signal.aborted) setLoadError(err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  function edit(product?: CreatorProduct) {
    if (!product && isLimitReached) {
      setShowLimitModal(true);
      return;
    }
    imageVersion.current++;
    setEditing(product || null);
    setForm(product ? { name: product.name, image: product.imageUrl, price: product.pricePaise === null ? "" : (product.pricePaise / 100).toFixed(2), productUrl: product.productUrl } : blank);
    setError(""); setImageBusy(false); setOpen(true);
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
    if (!form.image) { setError("Choose a product image."); return; }
    if (!form.name.trim()) { setError("Enter a product name."); return; }
    operation.current = true; setBusy(true); setError("");
    try {
      const product = await ProductService.save({ ...form, name: form.name.trim(), productUrl: form.productUrl.trim() }, editing?.id);
      setProducts((items) => editing ? items.map((item) => item.id === product.id ? product : item) : [product, ...items]);
      setForm(blank);
      setOpen(false); showToast(editing ? "Product updated" : "Product added");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save product.";
      if (msg.toLowerCase().includes("limit reached")) {
        setShowLimitModal(true);
      }
      setError(msg);
    }
    finally { operation.current = false; setBusy(false); }
  }

  async function remove() {
    if (!deleting || operation.current) return;
    operation.current = true; setBusy(true);
    try {
      await ProductService.remove(deleting.id);
      setProducts((items) => items.filter((item) => item.id !== deleting.id));
      setDeleting(null); showToast("Product deleted");
    } catch (err) { showToast(err instanceof Error ? err.message : "Could not delete product.", "error"); }
    finally { operation.current = false; setBusy(false); }
  }

  return (
    <div className="w-full min-w-0 space-y-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-[#0f172a] sm:text-2xl">My Products</h1>
          <p className="mt-1 text-xs text-[#64748b] sm:text-sm">Products you recommend, displayed in your public Shop.</p>
        </div>
        <button type="button" className={primaryButton} onClick={() => edit()}>
          <Plus className="h-4 w-4" />Add Product
        </button>
      </div>

      {/* Plan usage progress row */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white px-3 sm:px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-[#64748b]">
            <span className="font-semibold text-[#0f172a]">
              {isUnlimited ? "Unlimited products" : `${products.length} / ${maxProducts} products`}
            </span>
            <span aria-hidden="true"> · </span>
            {quota.name} Plan
            <span aria-hidden="true"> · </span>
            {isUnlimited
              ? "unlimited products in shop"
              : isLimitReached
                ? "plan limit reached"
                : `${maxProducts - products.length} ${maxProducts - products.length === 1 ? "slot" : "slots"} left`}
          </p>
          {isLimitReached && !isUnlimited && (
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center gap-1 rounded-lg border border-[#043084]/30 px-2.5 py-1 text-xs font-semibold text-[#043084] hover:bg-[#043084]/[0.06] transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>
        {!isUnlimited && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#eef2f7]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${percentage >= 100 ? "bg-rose-500" : percentage >= 80 ? "bg-amber-500" : "bg-[#043084]"}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div role="status" aria-label="Loading products" className="space-y-3">{[1, 2, 3].map((id) => <div key={id} className="h-28 animate-pulse rounded-xl border border-[#e2e8f0] bg-slate-100" />)}</div>
      ) : loadError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><p>{loadError}</p><button className="mt-2 min-h-10 font-semibold underline" onClick={() => setReload((value) => value + 1)}>Try again</button></div>
      ) : !products.length ? (
        <EmptyState icon={<ShoppingBag className="h-5 w-5" />} title="No products yet" description="Add products you recommend and display them on your Inflixo profile." action={<button className={primaryButton} onClick={() => edit()}><Plus className="h-4 w-4" />Add Product</button>} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white divide-y divide-[#e2e8f0]">
          {products.map((product) => (
            <article key={product.id} className="flex flex-wrap items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <ProductImage src={product.imageUrl} name={product.name} className="h-20 w-20" />
              <div className="min-w-0 flex-1"><h2 className="break-words text-sm font-semibold text-[#0f172a]">{product.name}</h2>{product.pricePaise !== null && <p className="mt-1 text-sm font-semibold text-[#043084]">{formatProductPrice(product.pricePaise)}</p>}<p className="mt-1 truncate text-xs text-[#64748b]">{safeHostname(product.productUrl)}</p></div>
              <div className="flex w-full items-center justify-end gap-1 border-t border-[#f1f5f9] pt-2 sm:w-auto sm:border-0 sm:pt-0">
                <a href={product.productUrl} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#043084] hover:bg-slate-50">View Product<ExternalLink className="h-3.5 w-3.5" /></a>
                <button type="button" aria-label={`Edit ${product.name}`} onClick={() => edit(product)} className="flex h-10 w-10 items-center justify-center rounded-lg text-[#64748b] hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                <button type="button" aria-label={`Delete ${product.name}`} onClick={() => setDeleting(product)} className="flex h-10 w-10 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Modal isOpen={open} onClose={() => { if (!busy) { imageVersion.current++; setOpen(false); } }} title={editing ? "Edit Product" : "Add Product"} size="md" showCloseButton={!busy} closeOnEscape={!busy}>
        <form onSubmit={save} className="flex min-h-0 flex-col">
          <ModalBody className="space-y-4">
            <fieldset disabled={busy} className="min-w-0 space-y-4">
              <div><span className="text-xs font-semibold text-[#475569]">Product Image *</span><div className="mt-2 flex items-center gap-3"><ProductImage src={form.image} name="Product image preview" className="h-24 w-24" /><div className="min-w-0"><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#e2e8f0] px-3 text-xs font-semibold text-[#043084] focus-within:ring-2 focus-within:ring-[#043084]"><UploadCloud className="h-4 w-4" />{imageBusy ? "Preparing…" : form.image ? "Replace image" : "Choose image"}<input aria-label="Product image" type="file" accept="image/jpeg,image/png,image/webp" onChange={imageSelected} disabled={busy || imageBusy} className="sr-only" /></label><p className="mt-2 text-xs text-[#64748b]">JPEG, PNG or WebP · up to 5MB</p></div></div></div>
              <label className="block text-xs font-semibold text-[#475569]">Product Name *<input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={180} className={inputClass} /></label>
              <label className="block text-xs font-semibold text-[#475569]">Price <span className="font-normal text-[#94a3b8]">(₹, optional)</span><input type="number" inputMode="decimal" min="0.01" max="21474836.47" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 1499" className={inputClass} /></label>
              <label className="block text-xs font-semibold text-[#475569]">Product / Affiliate Link *<input type="url" value={form.productUrl} onChange={(e) => setForm({ ...form, productUrl: e.target.value })} required maxLength={2048} placeholder="https://..." className={inputClass} /></label>
            </fieldset>
            {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          </ModalBody>
          <ModalFooter><button type="button" disabled={busy} onClick={() => { imageVersion.current++; setOpen(false); }} className="min-h-10 rounded-lg border border-[#e2e8f0] px-4 text-sm font-semibold text-[#64748b] disabled:opacity-50">Cancel</button><button type="submit" disabled={busy || imageBusy} className={primaryButton}>{busy ? "Saving…" : editing ? "Save Changes" : "Add Product"}</button></ModalFooter>
        </form>
      </Modal>
      <ConfirmModal isOpen={Boolean(deleting)} onClose={() => { if (!busy) setDeleting(null); }} onConfirm={remove} title="Delete Product?" description="This product will be removed from your public Shop." confirmText="Delete" isDestructive loading={busy} />
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        type="product"
        planKey={planKey}
      />
    </div>
  );
}
