"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  Tag,
  Link as LinkIcon,
  X,
  Image as ImageIcon,
  Search,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";
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
const primaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-[5px] bg-[#7A2253] px-4.5 text-xs font-semibold text-white shadow-md shadow-[#7A2253]/20 hover:opacity-95 disabled:opacity-50 cursor-pointer transition-all";
const inputClass = "mt-1.5 w-full min-w-0 rounded-[5px] border border-[#e2e8f0] bg-white px-3 py-2.5 text-xs sm:text-sm text-[#0f172a] outline-none focus:border-[#7A2253] focus:ring-2 focus:ring-[#7A2253]/10";

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
  const [activeTab, setActiveTab] = useState<"all" | "active" | "draft" | "hidden">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "price-high" | "price-low">("latest");
  const [sortOpen, setSortOpen] = useState(false);
  const operation = useRef(false);
  const imageVersion = useRef(0);

  const planKey = subscription?.planKey || "early_access";
  const quota = getPlanQuota(planKey);
  const maxProducts = quota.maxProducts;
  const isUnlimited = maxProducts === Infinity;
  const isLimitReached = !isUnlimited && products.length >= maxProducts;

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

  const filteredProducts = products.filter((p) => {
    if (activeTab === "draft" || activeTab === "hidden") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchUrl = (p.productUrl || "").toLowerCase().includes(q);
      if (!matchName && !matchUrl) return false;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-high") {
      return (b.pricePaise || 0) - (a.pricePaise || 0);
    }
    if (sortBy === "price-low") {
      return (a.pricePaise || 0) - (b.pricePaise || 0);
    }
    return 0;
  });

  const displayProducts = sortBy === "oldest" ? [...sortedProducts].reverse() : sortedProducts;

  return (
    <div className="w-full min-w-0 space-y-4 pb-8 text-left">
      {/* 1. Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0f172a]">
            My Products
          </h1>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#64748b]">
            Products you recommend, displayed in your public Shop.
          </p>
        </div>
        <button
          type="button"
          onClick={() => edit()}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[5px] bg-[#7A2253] text-white text-xs font-bold hover:bg-[#681c46] shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* 2. Filter tabs + Search + Sort */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
        {/* Left Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-[5px] px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-[#FFF5F7] text-[#7A2253] font-bold"
                : "text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            All ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`rounded-[5px] px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "active"
                ? "bg-[#FFF5F7] text-[#7A2253] font-bold"
                : "text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            Active ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("draft")}
            className={`rounded-[5px] px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "draft"
                ? "bg-[#FFF5F7] text-[#7A2253] font-bold"
                : "text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            Draft (0)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("hidden")}
            className={`rounded-[5px] px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === "hidden"
                ? "bg-[#FFF5F7] text-[#7A2253] font-bold"
                : "text-[#64748b] hover:text-[#0f172a]"
            }`}
          >
            Hidden (0)
          </button>
        </div>

        {/* Right: Search + Sort Dropdown */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex items-center h-9 rounded-[5px] border border-[#e2e8f0] bg-white px-3 gap-2 flex-1 sm:w-64 focus-within:border-[#7A2253] shadow-2xs transition-colors">
            <Search className="h-4 w-4 text-[#94a3b8] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full text-xs text-[#0f172a] placeholder:text-[#94a3b8] bg-transparent outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc] shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-[#64748b]" />
              <span>
                {sortBy === "latest"
                  ? "Latest First"
                  : sortBy === "oldest"
                    ? "Oldest First"
                    : sortBy === "price-high"
                      ? "Price: High to Low"
                      : "Price: Low to High"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#64748b]" />
            </button>
            {sortOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-44 rounded-[5px] border border-[#e2e8f0] bg-white p-1 shadow-lg z-30 text-xs space-y-0.5"
                onClick={() => setSortOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setSortBy("latest")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[5px] font-medium transition-colors ${
                    sortBy === "latest"
                      ? "bg-[#FFF5F7] text-[#7A2253] font-bold"
                      : "text-[#0f172a] hover:bg-[#f1f5f9]"
                  }`}
                >
                  Latest First
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("oldest")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[5px] font-medium transition-colors ${
                    sortBy === "oldest"
                      ? "bg-[#FFF5F7] text-[#7A2253] font-bold"
                      : "text-[#0f172a] hover:bg-[#f1f5f9]"
                  }`}
                >
                  Oldest First
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("price-high")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[5px] font-medium transition-colors ${
                    sortBy === "price-high"
                      ? "bg-[#FFF5F7] text-[#7A2253] font-bold"
                      : "text-[#0f172a] hover:bg-[#f1f5f9]"
                  }`}
                >
                  Price: High to Low
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("price-low")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[5px] font-medium transition-colors ${
                    sortBy === "price-low"
                      ? "bg-[#FFF5F7] text-[#7A2253] font-bold"
                      : "text-[#0f172a] hover:bg-[#f1f5f9]"
                  }`}
                >
                  Price: Low to High
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Products Grid */}
      {loading ? (
        <div role="status" aria-label="Loading products" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((id) => (
            <div key={id} className="h-64 animate-pulse rounded-[5px] border border-[#e2e8f0] bg-slate-100" />
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
        searchQuery ? (
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            title="No matching products"
            description="Try a different search term."
            action={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[5px] bg-[#7A2253] text-white text-xs font-bold hover:bg-[#681c46] shadow-2xs transition-colors cursor-pointer"
                onClick={() => setSearchQuery("")}
              >
                <Plus className="h-4 w-4" />
                <span>Clear Search</span>
              </button>
            }
          />
        ) : (
          <div className="rounded-[5px] border-2 border-dashed border-[#e2e8f0] bg-white/40 p-8 sm:p-10 text-center flex flex-col items-center justify-center">
            <div className="relative mb-3 flex items-center justify-center">
              <span className="absolute -top-2 -left-3 text-sm text-[#F43F5E] opacity-70">✦</span>
              <span className="absolute -bottom-1 -right-3 text-xs text-[#F43F5E] opacity-70">✦</span>
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF5F7] text-[#7A2253] border border-[#FCE7F3]">
                <ShoppingBag className="h-6 w-6" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#7A2253] text-[10px] font-bold text-white shadow-xs">
                  +
                </span>
              </div>
            </div>
            <h4 className="font-bold text-sm sm:text-base text-[#0f172a]">
              Add your first product
            </h4>
            <p className="mt-1 text-xs text-[#64748b] max-w-sm">
              Show the tools, gadgets and products you use and recommend to your audience.
            </p>
            <button
              type="button"
              onClick={() => edit()}
              className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-[5px] bg-[#7A2253] text-white text-xs font-bold hover:bg-[#681c46] shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayProducts.map((product) => (
            <article
              key={product.id}
              className="group rounded-[5px] border border-[#e2e8f0] bg-white overflow-hidden shadow-2xs flex flex-col transition-all hover:shadow-xs"
            >
              {/* Product Image */}
              <div className="relative w-full aspect-[16/10] bg-[#f8fafc] overflow-hidden border-b border-[#f1f5f9]">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                )}
              </div>

              {/* Product Details & Actions */}
              <div className="p-3.5 flex flex-col flex-1 justify-between gap-3 text-left">
                <div>
                  <h2
                    className="font-bold text-sm text-[#0f172a] line-clamp-1"
                    title={product.name}
                  >
                    {product.name}
                  </h2>
                  <p className="font-bold text-base text-[#7A2253] mt-1">
                    {product.pricePaise !== null ? formatProductPrice(product.pricePaise) : ""}
                  </p>
                </div>

                {/* Bottom Action Row matching screenshot */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={product.productUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex-1 h-8 rounded-[5px] border border-[#FCE7F3] bg-[#FFF5F7] hover:bg-[#FCE7F3]/70 text-[#7A2253] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>View Product</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    type="button"
                    aria-label={`Edit ${product.name}`}
                    onClick={() => edit(product)}
                    className="h-8 w-8 rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-slate-50 text-[#64748b] hover:text-[#0f172a] flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
                    title="Edit product"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    aria-label={`Delete ${product.name}`}
                    onClick={() => setDeleting(product)}
                    className="h-8 w-8 rounded-[5px] border border-[#FCE7F3] bg-[#FFF5F7] hover:bg-rose-50 text-[#ef4444] hover:text-red-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer shrink-0"
                    title="Delete product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <Modal
        isOpen={open}
        onClose={() => {
          if (!busy) {
            imageVersion.current++;
            setOpen(false);
          }
        }}
        title={editing ? "Edit Product" : "Add Product"}
        description="Show a product you use or recommend on your profile."
        icon={<ShoppingBag className="h-5 w-5" />}
        size="lg"
        showCloseButton={!busy}
        closeOnEscape={!busy}
      >
        <form onSubmit={save} className="flex min-h-0 flex-col">
          <ModalBody className="p-4 sm:p-5 space-y-4 text-left">
            <fieldset disabled={busy} className="min-w-0 space-y-4">
              {/* Product Image + Tips Card */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-medium text-[#0f172a]">
                    Product Image <span className="text-[#C2414B]">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748b]">Use a clear, high-quality product image.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                  {/* Upload Dropzone */}
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
                        <ProductImage src={form.image} name="Product preview" className="h-16 w-16 rounded-[5px] shrink-0 border border-[#e2e8f0]" />
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-[#0f172a]">{imageBusy ? "Preparing..." : "Image selected"}</span>
                          <span className="block text-[11px] text-[#7A2253] font-medium">Click to replace image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#64748b] group-hover:text-[#7A2253] mb-1">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-semibold text-[#0f172a]">{imageBusy ? "Preparing..." : "Upload Image"}</span>
                        <span className="text-[11px] text-[#94a3b8]">JPG, PNG or WebP · Max 5MB</span>
                      </div>
                    )}
                  </label>

                  {/* Tips Card */}
                  <div className="flex flex-col justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] p-3 text-left">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#7A2253] mb-1">
                      <span>💡</span>
                      <span>Tips</span>
                    </div>
                    <ul className="text-[11px] text-[#64748b] space-y-0.5 leading-snug list-disc list-inside">
                      <li>Use a clean product image (no text or watermark).</li>
                      <li>Square image looks best (1:1 ratio).</li>
                      <li>Recommended size: 1000 × 1000 px.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Product Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-medium text-[#0f172a]">
                    Product Name <span className="text-[#C2414B]">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748b]">Enter the exact product name.</span>
                </div>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <Tag className="h-4 w-4" />
                  </div>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    maxLength={180}
                    placeholder="e.g. Sony A7 IV, iPhone 15 Pro, Final Cut Pro"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-medium text-[#0f172a]">
                    Price <span className="font-normal text-[#94a3b8]">(₹, optional)</span>
                  </label>
                  <span className="text-[11px] text-[#64748b]">Enter the price you paid or current price.</span>
                </div>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-sm font-semibold text-[#64748b]">
                    ₹
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    max="21474836.47"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="e.g. 1499"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>

              {/* Product / Affiliate Link */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-medium text-[#0f172a]">
                    Product / Affiliate Link <span className="text-[#C2414B]">*</span>
                  </label>
                  <span className="text-[11px] text-[#64748b]">Add a direct product or affiliate link.</span>
                </div>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    value={form.productUrl}
                    onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
                    required
                    maxLength={2048}
                    placeholder="https://..."
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
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
              onClick={() => {
                imageVersion.current++;
                setOpen(false);
              }}
              className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || imageBusy}
              className="h-10 px-5 rounded-[5px] bg-[#7A2253] text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-[#7A2253]/20 hover:opacity-95 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <span>{busy ? "Saving…" : editing ? "Save Changes" : "+ Add Product"}</span>
            </button>
          </ModalFooter>
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
