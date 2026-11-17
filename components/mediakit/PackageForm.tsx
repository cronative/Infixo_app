"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Briefcase, ChevronDown, Eye, Minus, PencilLine, Plus, X } from "lucide-react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/shared/BrandIcons";
import { PackageCard } from "@/components/mediakit/PackageCard";
import { WorkWithMe } from "@/components/public/collab/CollabSections";
import { FullBleedSectionsProvider, SolidSectionsProvider } from "@/components/public/ui";
import { themeTokenStyle } from "@/themes/config";
import { ThemeService } from "@/services/ThemeService";
import { MEDIAKIT_PACKAGE_CATEGORIES, type MediaKitPackage } from "@/types";
import {
  COLLAB_TYPES,
  CONTENT_LANGUAGES,
  GST_OPTIONS,
  PACKAGE_INCLUSIONS,
  PACKAGE_PLATFORMS,
  TRAVEL_OPTIONS,
  USAGE_DURATIONS,
  USAGE_RIGHTS,
  VIDEO_TYPES,
  describeItem,
  platformsSummary,
  supportsCollabPost,
  supportsLink,
  type CollabType,
  type PackageDeliverableItem,
  type PackageDetails,
  type PackagePlatform,
} from "@/lib/collabPackage";

// ── Shared field styles (same as the rest of the Media Kit page) ──
const input =
  "h-10 w-full rounded-[5px] border border-[#ECECF0] bg-white px-3 text-[13px] font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none";
const label = "block text-[12px] font-semibold text-[#18181B]";
const hint = "text-[11px] text-[#6B6B76]";

const PLATFORM_ICON: Record<PackagePlatform, ReactNode> = {
  instagram: <InstagramIcon className="h-4 w-4 text-[#E1306C]" />,
  youtube: <YoutubeIcon className="h-4 w-4 text-[#FF0000]" />,
  facebook: <FacebookIcon className="h-4 w-4 text-[#1877F2]" />,
};
const REVISION_OPTIONS = ["0", "1", "2", "3"];
const uid = () => Math.random().toString(36).slice(2, 9);

function Segmented<T extends string>({ value, options, onChange }: { value: T | ""; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 rounded-[5px] border px-3 text-[12px] font-semibold transition-colors cursor-pointer ${
            value === o.value ? "border-[#7A2253] bg-[#7A2253] text-white" : "border-[#ECECF0] bg-white text-[#52525B] hover:bg-[#FAFAFB]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium text-[#18181B]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#7A2253]" />
      {children}
    </label>
  );
}

/** Collapsible form group; summary shows what's filled while closed. */
function Group({ title, summary, defaultOpen, children }: { title: string; summary?: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <section className="rounded-[5px] border border-[#ECECF0] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 bg-[#FAFAFB] px-3.5 py-2.5 text-left cursor-pointer"
      >
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-[#18181B]">{title}</span>
          {!open && summary && <span className="block truncate text-[11px] text-[#6B6B76]">{summary}</span>}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#6B6B76] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 border-t border-[#ECECF0] p-3.5">{children}</div>}
    </section>
  );
}

/** Guess a starting deliverable for packages created before the v2 form. */
function legacyItems(pkg: MediaKitPackage | null | undefined): PackageDeliverableItem[] {
  if (!pkg) return [];
  if (pkg.details?.items?.length) return pkg.details.items.map((i) => ({ ...i }));
  const p = (pkg.platform || "").toLowerCase();
  const platform: PackagePlatform = p.includes("youtube") ? "youtube" : p.includes("facebook") ? "facebook" : "instagram";
  const type = platform === "youtube" ? "Video Integration" : "Reel";
  return [{ id: uid(), platform, type, qty: 1 }];
}

export interface PackageFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Package being edited (or a template to start from); null for a blank form. */
  initial?: MediaKitPackage | null;
  isEdit?: boolean;
  /** Creator-wide "+ GST" for the preview. */
  pricesPlusGst?: boolean;
  /** Creator's profile theme, so the "Profile" preview matches the public page. */
  themeKey?: string;
  onSubmit: (pkg: MediaKitPackage, mode: "draft" | "publish") => Promise<void>;
}

export function PackageForm({ isOpen, onClose, initial, isEdit = false, pricesPlusGst, themeKey, onSubmit }: PackageFormProps) {
  // Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collabType, setCollabType] = useState<CollabType>("paid");
  const [category, setCategory] = useState("");
  // Deliverables
  const [items, setItems] = useState<PackageDeliverableItem[]>([]);
  const [customLines, setCustomLines] = useState<string[]>([]);
  const [inclusions, setInclusions] = useState<string[]>([]);
  // Pricing
  const [price, setPrice] = useState("");
  const [priceVisibility, setPriceVisibility] = useState<"show" | "quote">("show");
  const [barterDetails, setBarterDetails] = useState("");
  const [gst, setGst] = useState<PackageDetails["gst"] | "">("");
  const [travel, setTravel] = useState<PackageDetails["travel"] | "">("");
  const [extraCharges, setExtraCharges] = useState("");
  // Delivery & terms
  const [days, setDays] = useState(5);
  const [revisions, setRevisions] = useState("1");
  const [customRevisions, setCustomRevisions] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [usageRights, setUsageRights] = useState<PackageDetails["usageRights"] | "">("");
  const [usageDuration, setUsageDuration] = useState("");
  const [exclusivity, setExclusivity] = useState("");
  const [postRetention, setPostRetention] = useState("");
  // Requirements
  const [productProvided, setProductProvided] = useState(false);
  const [briefRequired, setBriefRequired] = useState(false);
  const [visitRequired, setVisitRequired] = useState(false);
  const [shipping, setShipping] = useState("");
  const [location, setLocation] = useState("");
  const [conditions, setConditions] = useState("");
  // Display
  const [isPopular, setIsPopular] = useState(false);
  const [storyPitch, setStoryPitch] = useState("");

  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [previewMode, setPreviewMode] = useState<"profile" | "mediakit">("profile");
  const profileColors = useMemo(() => {
    const meta = ThemeService.getThemeMeta(themeKey as Parameters<typeof ThemeService.getThemeMeta>[0]);
    return { primary: meta.colors.primaryText, secondary: meta.colors.secondaryText, muted: meta.colors.mutedText, headingFont: meta.typography.headingFontFamily };
  }, [themeKey]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<"" | "draft" | "publish">("");

  // Load the package (or reset) whenever the form opens.
  useEffect(() => {
    if (!isOpen) return;
    const d = initial?.details;
    const its = legacyItems(initial);
    const described = new Set(its.map(describeItem));
    setTitle(initial?.title || "");
    setDescription(initial?.description || (d ? "" : initial?.storyPitch || ""));
    setCollabType(d?.collabType || "paid");
    setCategory(initial?.category || "");
    setItems(its);
    // Old free-text deliverables are kept as extra lines.
    setCustomLines((initial?.deliverables || []).filter((l) => l && !described.has(l)));
    setInclusions(d?.inclusions || []);
    setPrice(((initial?.price || initial?.minPrice || "") as string).replace(/[^\d,.–-]/g, "").split(/[–-]/)[0] || "");
    setPriceVisibility(d?.priceVisibility || "show");
    setBarterDetails(d?.barterDetails || "");
    setGst(d?.gst || "");
    setTravel(d?.travel || "");
    setExtraCharges(d?.extraCharges || "");
    setDays(initial?.turnaroundDays || 5);
    const rev = d?.revisions || "1";
    setRevisions(REVISION_OPTIONS.includes(rev) ? rev : "custom");
    setCustomRevisions(REVISION_OPTIONS.includes(rev) ? "" : rev);
    setLanguages(d?.languages || []);
    setUsageRights(d?.usageRights || "");
    setUsageDuration(d?.usageDuration || "");
    setExclusivity(d?.exclusivity || "");
    setPostRetention(d?.postRetention || "");
    setProductProvided(Boolean(d?.requirements?.productProvided));
    setBriefRequired(Boolean(d?.requirements?.briefRequired));
    setVisitRequired(Boolean(d?.requirements?.visitRequired));
    setShipping(d?.requirements?.shipping || "");
    setLocation(d?.requirements?.location || "");
    setConditions(d?.requirements?.conditions || "");
    setIsPopular(Boolean(initial?.isPopular));
    setStoryPitch(d ? initial?.storyPitch || "" : "");
    setTab("edit");
    setError("");
    setSaving("");
  }, [isOpen, initial]);

  const priceRequired = collabType !== "barter" && priceVisibility === "show";
  const selectedPlatforms = PACKAGE_PLATFORMS.filter((p) => items.some((i) => i.platform === p.value)).map((p) => p.value);

  const togglePlatform = (p: PackagePlatform) => {
    if (selectedPlatforms.includes(p)) setItems((prev) => prev.filter((i) => i.platform !== p));
    else setItems((prev) => [...prev, { id: uid(), platform: p, type: PACKAGE_PLATFORMS.find((x) => x.value === p)!.types[0], qty: 1 }]);
  };
  // Keep each platform's deliverables together so the preview and saved list read in order.
  const addItem = (p: PackagePlatform, type: string) =>
    setItems((prev) => {
      const next = { id: uid(), platform: p, type, qty: 1 };
      let at = -1;
      prev.forEach((i, idx) => { if (i.platform === p) at = idx; });
      return at < 0 ? [...prev, next] : [...prev.slice(0, at + 1), next, ...prev.slice(at + 1)];
    });
  const patchItem = (id: string, patch: Partial<PackageDeliverableItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const toggleIn = (v: string, set: React.Dispatch<React.SetStateAction<string[]>>) =>
    set((list) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]));

  /** Builds the package (new fields + the legacy columns older screens read). */
  const draftPackage = useMemo((): MediaKitPackage => {
    const amount = price.trim().replace(/^₹\s*/, "");
    const priceStr = amount ? `₹${amount}` : "";
    const details: PackageDetails = {
      collabType,
      items,
      inclusions,
      priceVisibility,
      barterDetails: collabType !== "paid" ? barterDetails.trim() || undefined : undefined,
      gst: gst || undefined,
      travel: travel || undefined,
      extraCharges: extraCharges.trim() || undefined,
      revisions: revisions === "custom" ? customRevisions.trim() || undefined : revisions,
      languages: languages.length ? languages : undefined,
      usageRights: usageRights || undefined,
      usageDuration: usageDuration.trim() || undefined,
      exclusivity: exclusivity.trim() || undefined,
      postRetention: postRetention.trim() || undefined,
      requirements: {
        productProvided: productProvided || undefined,
        briefRequired: briefRequired || undefined,
        visitRequired: visitRequired || undefined,
        shipping: shipping.trim() || undefined,
        location: location.trim() || undefined,
        conditions: conditions.trim() || undefined,
      },
    };
    return {
      ...(initial || {}),
      id: initial?.id || "",
      title: title.trim(),
      description: description.trim(),
      category: category || undefined,
      storyPitch: storyPitch.trim().slice(0, 120) || undefined,
      platform: platformsSummary(items),
      price: priceStr,
      minPrice: priceStr || undefined,
      maxPrice: undefined,
      priceUnit: "per_package",
      isStartingPrice: false,
      turnaroundDays: Math.max(1, Number(days) || 1),
      deliverables: [...items.map(describeItem), ...customLines.map((l) => l.trim()).filter(Boolean)],
      isPopular,
      isActive: initial?.isActive ?? true,
      details,
    };
  }, [
    initial, title, description, category, storyPitch, collabType, items, customLines, inclusions, price, priceVisibility,
    barterDetails, gst, travel, extraCharges, days, revisions, customRevisions, languages, usageRights, usageDuration,
    exclusivity, postRetention, productProvided, briefRequired, visitRequired, shipping, location, conditions, isPopular,
  ]);

  const submit = async (mode: "draft" | "publish") => {
    setError("");
    if (!title.trim()) return setError("Add a package title.");
    if (mode === "publish") {
      if (!description.trim()) return setError("Add a short description of what the brand gets.");
      if (items.length === 0 && customLines.every((l) => !l.trim())) return setError("Add at least one deliverable.");
      if (priceRequired && !price.trim()) return setError("Add a package price, or choose “Request quote”.");
    }
    setSaving(mode);
    try {
      await onSubmit({ ...draftPackage, isDraft: mode === "draft" }, mode);
    } finally {
      setSaving("");
    }
  };

  const termsSummary = [`${days} days`, revisions === "custom" ? customRevisions : `${revisions} rev`, languages.join(", ")].filter(Boolean).join(" · ");
  const reqSummary = [productProvided && "Product", briefRequired && "Brief", visitRequired && "Visit"].filter(Boolean).join(" · ");

  const form = (
    <div className="space-y-3">
      {/* 1. Basics */}
      <Group title="Package basics" defaultOpen summary={title}>
        <div className="space-y-1">
          <label className={label} htmlFor="pk-title">Package title <span className="text-[#C2414B]">*</span></label>
          <input id="pk-title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cafe Visit Reel, Brand Promotion Package" className={input} />
        </div>
        <div className="space-y-1">
          <label className={label} htmlFor="pk-desc">Description <span className="text-[#C2414B]">*</span></label>
          <textarea
            id="pk-desc"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What the brand gets and how you'll promote the product or place."
            className={`${input} h-auto resize-none py-2`}
          />
        </div>
        <div className="space-y-1">
          <span className={label}>Collaboration type <span className="text-[#C2414B]">*</span></span>
          <Segmented value={collabType} options={COLLAB_TYPES.map((t) => ({ value: t.value, label: t.short }))} onChange={setCollabType} />
        </div>
        <div className="space-y-1">
          <label className={label} htmlFor="pk-cat">Content category <span className="font-normal text-[#6B6B76]">(optional)</span></label>
          <select id="pk-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={`${input} cursor-pointer`}>
            <option value="">Select a category…</option>
            {MEDIAKIT_PACKAGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </Group>

      {/* 2. Platforms & deliverables */}
      <Group title="Platforms & deliverables" defaultOpen summary={items.map(describeItem).join(" + ")}>
        <div className="flex flex-wrap gap-1.5">
          {PACKAGE_PLATFORMS.map((p) => {
            const on = selectedPlatforms.includes(p.value);
            return (
              <button
                key={p.value}
                type="button"
                aria-pressed={on}
                onClick={() => togglePlatform(p.value)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-[5px] border px-3 text-[12px] font-semibold cursor-pointer ${
                  on ? "border-[#7A2253] bg-[#F7EEF2] text-[#7A2253]" : "border-[#ECECF0] bg-white text-[#52525B] hover:bg-[#FAFAFB]"
                }`}
              >
                {PLATFORM_ICON[p.value]}
                {p.label}
              </button>
            );
          })}
        </div>

        {selectedPlatforms.map((pv) => {
          const p = PACKAGE_PLATFORMS.find((x) => x.value === pv)!;
          const rows = items.filter((i) => i.platform === pv);
          return (
            <div key={pv} className="space-y-2 rounded-[5px] border border-[#ECECF0] p-2.5">
              <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#18181B]">{PLATFORM_ICON[pv]}{p.label}</p>
              {rows.map((it) => (
                <div key={it.id} className="space-y-2 rounded-[5px] bg-[#FAFAFB] p-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-[5px] border border-[#ECECF0] bg-white">
                      <button type="button" aria-label="Fewer" onClick={() => setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))} className="flex h-8 w-8 items-center justify-center text-[#52525B] cursor-pointer"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-6 text-center text-[13px] font-bold tabular-nums text-[#18181B]">{it.qty}</span>
                      <button type="button" aria-label="More" onClick={() => setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, qty: Math.min(50, x.qty + 1) } : x)))} className="flex h-8 w-8 items-center justify-center text-[#52525B] cursor-pointer"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <select
                      value={it.type}
                      onChange={(e) => patchItem(it.id, { type: e.target.value })}
                      aria-label="Deliverable type"
                      className="h-8 min-w-0 flex-1 rounded-[5px] border border-[#ECECF0] bg-white px-2 text-[13px] font-semibold text-[#18181B] cursor-pointer"
                    >
                      {p.types.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {VIDEO_TYPES.has(it.type) && (
                      <input
                        value={it.duration || ""}
                        maxLength={30}
                        onChange={(e) => patchItem(it.id, { duration: e.target.value })}
                        placeholder="Duration, e.g. 30–60 sec"
                        aria-label="Video duration"
                        className="h-8 w-40 rounded-[5px] border border-[#ECECF0] bg-white px-2 text-[12px] text-[#18181B]"
                      />
                    )}
                    <button type="button" aria-label="Remove deliverable" onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))} className="ml-auto flex h-8 w-8 items-center justify-center rounded-[5px] text-[#6B6B76] hover:text-[#C2414B] cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    <Check checked={Boolean(it.tagging)} onChange={(v) => patchItem(it.id, { tagging: v })}>Brand tagging / mention</Check>
                    {supportsCollabPost(pv, it.type) && <Check checked={Boolean(it.collabPost)} onChange={(v) => patchItem(it.id, { collabPost: v })}>Collab post</Check>}
                    {supportsLink(pv, it.type) && <Check checked={Boolean(it.link)} onChange={(v) => patchItem(it.id, { link: v })}>Link included</Check>}
                  </div>
                  <input
                    value={it.notes || ""}
                    maxLength={160}
                    onChange={(e) => patchItem(it.id, { notes: e.target.value })}
                    placeholder="Notes (optional), e.g. shot on location, Hindi voiceover"
                    aria-label="Deliverable notes"
                    className="h-8 w-full rounded-[5px] border border-[#ECECF0] bg-white px-2 text-[12px] text-[#18181B]"
                  />
                </div>
              ))}
              <div className="flex flex-wrap gap-1.5">
                {p.types.map((t) => (
                  <button key={t} type="button" onClick={() => addItem(pv, t)} className="inline-flex items-center gap-1 rounded-[5px] border border-dashed border-[#D4D4D8] px-2 py-1 text-[11px] font-medium text-[#52525B] hover:border-[#7A2253] hover:text-[#7A2253] cursor-pointer">
                    <Plus className="h-3 w-3" />{t}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {selectedPlatforms.length === 0 && <p className={hint}>Pick one or more platforms, then add the posts, stories or videos this package includes.</p>}

        {customLines.length > 0 && (
          <div className="space-y-1.5">
            <span className={label}>Other deliverables</span>
            {customLines.map((l, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={l} maxLength={120} onChange={(e) => setCustomLines(customLines.map((x, j) => (j === i ? e.target.value : x)))} className={`${input} h-8`} aria-label={`Other deliverable ${i + 1}`} />
                <button type="button" aria-label="Remove" onClick={() => setCustomLines(customLines.filter((_, j) => j !== i))} className="flex h-8 w-8 shrink-0 items-center justify-center text-[#6B6B76] hover:text-[#C2414B] cursor-pointer"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setCustomLines([...customLines, ""])} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#7A2253] cursor-pointer">
          <Plus className="h-3.5 w-3.5" /> Add another deliverable (free text)
        </button>
      </Group>

      {/* 3. What's included */}
      <Group title="What's included" defaultOpen summary={inclusions.join(", ")}>
        <div className="flex flex-wrap gap-1.5">
          {PACKAGE_INCLUSIONS.map((inc) => {
            const on = inclusions.includes(inc);
            return (
              <button
                key={inc}
                type="button"
                aria-pressed={on}
                onClick={() => toggleIn(inc, setInclusions)}
                className={`rounded-[5px] border px-2.5 py-1.5 text-[12px] font-medium cursor-pointer ${
                  on ? "border-[#7A2253] bg-[#F7EEF2] text-[#7A2253]" : "border-[#ECECF0] bg-white text-[#52525B] hover:bg-[#FAFAFB]"
                }`}
              >
                {on ? "✓ " : ""}{inc}
              </button>
            );
          })}
        </div>
      </Group>

      {/* 4. Pricing & commercial */}
      <Group title="Pricing & commercial" defaultOpen summary={priceVisibility === "quote" ? "Request quote" : price ? `₹${price}` : ""}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={label} htmlFor="pk-price">
              Package price (₹) {priceRequired && <span className="text-[#C2414B]">*</span>}
            </label>
            <div className="flex items-center rounded-[5px] border border-[#ECECF0] bg-white focus-within:border-[#7A2253]">
              <span className="flex h-10 w-9 items-center justify-center border-r border-[#ECECF0] bg-[#FAFAFB] text-[13px] font-semibold text-[#6B6B76]">₹</span>
              <input
                id="pk-price"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d,]/g, ""))}
                placeholder={collabType === "barter" ? "Optional for barter" : "8,000"}
                className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[13px] font-semibold text-[#18181B] outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className={label}>Price visibility</span>
            <Segmented value={priceVisibility} options={[{ value: "show", label: "Show price" }, { value: "quote", label: "Request quote" }]} onChange={setPriceVisibility} />
          </div>
        </div>
        {collabType !== "paid" && (
          <div className="space-y-1">
            <label className={label} htmlFor="pk-barter">Barter details</label>
            <input id="pk-barter" value={barterDetails} maxLength={300} onChange={(e) => setBarterDetails(e.target.value)} placeholder="e.g. Products worth ₹10,000+, sent before the shoot" className={input} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <span className={label}>GST</span>
            <Segmented value={gst || ""} options={GST_OPTIONS} onChange={setGst} />
          </div>
          <div className="space-y-1">
            <span className={label}>Travel expenses</span>
            <Segmented value={travel || ""} options={TRAVEL_OPTIONS} onChange={setTravel} />
          </div>
        </div>
        <div className="space-y-1">
          <label className={label} htmlFor="pk-extra">Additional charges <span className="font-normal text-[#6B6B76]">(optional)</span></label>
          <input id="pk-extra" value={extraCharges} maxLength={200} onChange={(e) => setExtraCharges(e.target.value)} placeholder="e.g. Outstation shoots: travel + stay billed at actuals" className={input} />
        </div>
      </Group>

      {/* 5. Delivery & content terms */}
      <Group title="Delivery & content terms" defaultOpen summary={termsSummary}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={label} htmlFor="pk-days">Delivery timeline (working days)</label>
            <input id="pk-days" type="number" min={1} max={120} value={days} onChange={(e) => setDays(Number(e.target.value))} className={input} />
          </div>
          <div className="space-y-1">
            <span className={label}>Revisions included</span>
            <Segmented value={revisions} options={[...REVISION_OPTIONS.map((r) => ({ value: r, label: r })), { value: "custom", label: "Custom" }]} onChange={setRevisions} />
            {revisions === "custom" && (
              <input value={customRevisions} maxLength={40} onChange={(e) => setCustomRevisions(e.target.value)} placeholder="e.g. Unlimited minor edits" className={`${input} h-8`} aria-label="Custom revisions" />
            )}
          </div>
        </div>
        <div className="space-y-1">
          <span className={label}>Content language</span>
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_LANGUAGES.map((l) => {
              const on = languages.includes(l);
              return (
                <button key={l} type="button" aria-pressed={on} onClick={() => toggleIn(l, setLanguages)} className={`rounded-[5px] border px-2.5 py-1 text-[12px] font-medium cursor-pointer ${on ? "border-[#7A2253] bg-[#F7EEF2] text-[#7A2253]" : "border-[#ECECF0] bg-white text-[#52525B]"}`}>
                  {l}
                </button>
              );
            })}
          </div>
        </div>
        <Group title="Usage rights, exclusivity & post retention" summary={[usageRights && USAGE_RIGHTS.find((u) => u.value === usageRights)?.label, usageDuration, exclusivity && `Exclusive ${exclusivity}`].filter(Boolean).join(" · ")}>
          <div className="space-y-1">
            <span className={label}>Content usage rights</span>
            <Segmented value={usageRights || ""} options={USAGE_RIGHTS} onChange={setUsageRights} />
          </div>
          <div className="space-y-1">
            <span className={label}>Usage duration</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <Segmented value={USAGE_DURATIONS.includes(usageDuration) ? usageDuration : ""} options={USAGE_DURATIONS.map((u) => ({ value: u, label: u }))} onChange={setUsageDuration} />
              <input value={USAGE_DURATIONS.includes(usageDuration) ? "" : usageDuration} maxLength={40} onChange={(e) => setUsageDuration(e.target.value)} placeholder="Custom" aria-label="Custom usage duration" className={`${input} h-9 w-32`} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className={label} htmlFor="pk-excl">Exclusivity <span className="font-normal text-[#6B6B76]">(leave empty for none)</span></label>
              <input id="pk-excl" value={exclusivity} maxLength={40} onChange={(e) => setExclusivity(e.target.value)} placeholder="e.g. 30 days, no competitor" className={input} />
            </div>
            <div className="space-y-1">
              <label className={label} htmlFor="pk-ret">Post stays published for</label>
              <input id="pk-ret" value={postRetention} maxLength={40} onChange={(e) => setPostRetention(e.target.value)} placeholder="e.g. 6 months, Forever" className={input} />
            </div>
          </div>
        </Group>
      </Group>

      {/* 6. Additional requirements */}
      <Group title="Additional requirements" summary={reqSummary}>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Check checked={productProvided} onChange={setProductProvided}>Brand provides the product</Check>
          <Check checked={briefRequired} onChange={setBriefRequired}>Brand shares a campaign brief</Check>
          <Check checked={visitRequired} onChange={setVisitRequired}>Restaurant / store visit</Check>
        </div>
        <input value={shipping} maxLength={200} onChange={(e) => setShipping(e.target.value)} placeholder="Product shipping or return arrangements" aria-label="Shipping or returns" className={input} />
        <input value={location} maxLength={200} onChange={(e) => setLocation(e.target.value)} placeholder="Location or travel requirements" aria-label="Location or travel" className={input} />
        <textarea value={conditions} maxLength={300} rows={2} onChange={(e) => setConditions(e.target.value)} placeholder="Special conditions (optional)" aria-label="Special conditions" className={`${input} h-auto resize-none py-2`} />
      </Group>

      {/* 7. Display */}
      <Group title="Display options" summary={isPopular ? "Most popular" : ""}>
        <Check checked={isPopular} onChange={setIsPopular}>Show as “Most popular”</Check>
        <div className="space-y-1">
          <label className={label} htmlFor="pk-pitch">One-line story pitch <span className="font-normal text-[#6B6B76]">(optional)</span></label>
          <input id="pk-pitch" value={storyPitch} maxLength={120} onChange={(e) => setStoryPitch(e.target.value)} placeholder="e.g. Your cafe as the star of a slow Sunday food walk." className={input} />
        </div>
      </Group>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={isEdit ? "Edit collab package" : "Create collab package"}
      description="Combine platforms and deliverables into one package with one price."
      icon={<Briefcase className="h-4 w-4" />}
    >
      <ModalBody className="p-0 text-left">
        {/* Phones: switch between the form and the preview */}
        <div className="sticky top-0 z-10 flex gap-1 border-b border-[#ECECF0] bg-white p-2 lg:hidden">
          {(["edit", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[5px] text-[12px] font-semibold cursor-pointer ${tab === t ? "bg-[#7A2253] text-white" : "text-[#52525B]"}`}
            >
              {t === "edit" ? <PencilLine className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {t === "edit" ? "Details" : "Preview"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className={`p-3 sm:p-4 ${tab === "preview" ? "hidden lg:block" : ""}`}>{form}</div>
          <aside className={`border-l border-[#ECECF0] bg-[#FAFAFB] p-3 sm:p-4 ${tab === "edit" ? "hidden lg:block" : ""}`} aria-label="Package preview">
            <div className="space-y-2 lg:sticky lg:top-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B76]">Live preview · how brands see it</p>
              <div className="flex rounded-[5px] border border-[#ECECF0] bg-white p-0.5" role="tablist" aria-label="Preview where">
                {(["profile", "mediakit"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={previewMode === m}
                    onClick={() => setPreviewMode(m)}
                    className={`h-7 flex-1 rounded-[5px] text-[12px] font-semibold cursor-pointer ${previewMode === m ? "bg-[#7A2253] text-white" : "text-[#52525B] hover:text-[#18181B]"}`}
                  >
                    {m === "profile" ? "Profile" : "Media kit"}
                  </button>
                ))}
              </div>
              {previewMode === "profile" ? (
                // Same "Work With Me" section the public profile renders, in the creator's theme.
                <div style={{ ...themeTokenStyle(themeKey), background: "var(--page-bg)" }} className="rounded-[5px] p-2.5">
                  <FullBleedSectionsProvider>
                    <SolidSectionsProvider>
                      <WorkWithMe packages={[draftPackage]} colors={profileColors} pricesPlusGst={pricesPlusGst} preview onEnquire={() => {}} />
                    </SolidSectionsProvider>
                  </FullBleedSectionsProvider>
                </div>
              ) : (
                <div style={{ ["--card-bg" as string]: "#FFFFFF", ["--header-bg" as string]: "#FFFFFF" }}>
                  <PackageCard pkg={draftPackage} pricesPlusGst={pricesPlusGst} preview />
                </div>
              )}
            </div>
          </aside>
        </div>
      </ModalBody>

      <ModalFooter className="flex-wrap px-4 py-3 sm:px-5">
        {error && <p role="alert" className="mr-auto w-full text-[12px] font-medium text-[#C2414B] sm:w-auto">{error}</p>}
        <button type="button" onClick={onClose} className="h-10 rounded-[5px] border border-[#ECECF0] bg-white px-4 text-[12px] font-semibold text-[#6B6B76] hover:bg-[#F4F4F5] cursor-pointer">
          Cancel
        </button>
        <button type="button" disabled={Boolean(saving)} onClick={() => submit("draft")} className="h-10 rounded-[5px] border border-[#7A2253]/40 bg-white px-4 text-[12px] font-semibold text-[#7A2253] hover:bg-[#F7EEF2] cursor-pointer disabled:opacity-60">
          {saving === "draft" ? "Saving…" : "Save draft"}
        </button>
        <button type="button" disabled={Boolean(saving)} onClick={() => submit("publish")} className="h-10 rounded-[5px] bg-[#7A2253] px-5 text-[12px] font-semibold text-white hover:opacity-95 cursor-pointer disabled:opacity-60">
          {saving === "publish" ? "Publishing…" : isEdit && !initial?.isDraft ? "Save & publish" : "Publish package"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
