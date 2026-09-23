"use client";

import { useEffect, useState, useMemo, ChangeEvent } from "react";
import Image from "next/image";
import {
  Laptop,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Search,
  Camera,
  Mic,
  Lightbulb,
  Sparkles,
  Layers,
  UploadCloud,
  X,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorSetupCategory, CreatorSetupItem } from "@/types";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { creatorSetupRepository } from "@/repositories/localRepository";
import { EmptyState } from "@/components/ui/EmptyState";

const CATEGORIES: CreatorSetupCategory[] = [
  "Camera / Phone",
  "Lens",
  "Mic",
  "Light",
  "Tripod / Stand",
  "Gimbal / Stabilizer",
  "Drone",
  "Editing Software",
  "AI Tool",
  "Design Tool",
  "Audio Tool",
  "Analytics Tool",
  "Scheduling Tool",
  "Storage / Backup",
  "Studio / Accessory",
  "Other",
];

const CATEGORY_GROUPS: { label: string; categories: CreatorSetupCategory[] }[] = [
  {
    label: "Hardware & Gear",
    categories: [
      "Camera / Phone",
      "Lens",
      "Mic",
      "Light",
      "Tripod / Stand",
      "Gimbal / Stabilizer",
      "Drone",
      "Studio / Accessory",
    ],
  },
  {
    label: "Software & AI",
    categories: [
      "Editing Software",
      "AI Tool",
      "Design Tool",
      "Audio Tool",
      "Analytics Tool",
      "Scheduling Tool",
      "Storage / Backup",
      "Other",
    ],
  },
];

function getCategoryIcon(category: string) {
  switch (category) {
    case "Camera / Phone":
    case "Lens":
    case "Drone":
      return Camera;
    case "Mic":
    case "Audio Tool":
      return Mic;
    case "Light":
      return Lightbulb;
    case "AI Tool":
      return Sparkles;
    case "Editing Software":
    case "Design Tool":
    case "Analytics Tool":
    case "Scheduling Tool":
      return Laptop;
    default:
      return Layers;
  }
}

export default function DashboardSetupPage() {
  const { profile } = useCreator();
  const { showToast } = useToast();

  const [items, setItems] = useState<CreatorSetupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CreatorSetupItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CreatorSetupItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [category, setCategory] = useState<CreatorSetupCategory>("Camera / Phone");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [modelOrPlan, setModelOrPlan] = useState("");
  const [usedFor, setUsedFor] = useState("");
  const [note, setNote] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const creatorLookup = profile.id || profile.email || profile.username;

  const loadSetupItems = async () => {
    if (!creatorLookup) return;
    setLoading(true);
    try {
      const httpResponse = await fetch(
        `/api/creator/setup?creatorId=${encodeURIComponent(creatorLookup)}`
      );
      const apiResponse = await httpResponse.json();
      const items = apiResponse.data?.items || apiResponse.items;

      if (apiResponse.status === 1 && Array.isArray(items)) {
        setItems(items);
        creatorSetupRepository.saveAll(items);
      } else {
        const local = creatorSetupRepository.getAll();
        setItems(local);
      }
    } catch {
      const local = creatorSetupRepository.getAll();
      setItems(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!creatorLookup) return;

    let cancelled = false;

    fetch(`/api/creator/setup?creatorId=${encodeURIComponent(creatorLookup)}`)
      .then((httpResponse) => httpResponse.json())
      .then((apiResponse) => {
        if (cancelled) return;
        const items = apiResponse.data?.items || apiResponse.items;
        if (apiResponse.status === 1 && Array.isArray(items)) {
          setItems(items);
          creatorSetupRepository.saveAll(items);
          return;
        }
        setItems(creatorSetupRepository.getAll());
      })
      .catch(() => {
        if (!cancelled) setItems(creatorSetupRepository.getAll());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [creatorLookup]);

  const handleOpenModal = (item?: CreatorSetupItem) => {
    if (item) {
      setEditingItem(item);
      setCategory(item.category as CreatorSetupCategory);
      setName(item.name);
      setBrand(item.brand || "");
      setModelOrPlan(item.modelOrPlan || "");
      setUsedFor(item.usedFor || "");
      setNote(item.note || "");
      setLinkUrl(item.linkUrl || "");
      setImageUrl(item.imageUrl || null);
      setIsActive(item.isActive !== false);
    } else {
      setEditingItem(null);
      setCategory("Camera / Phone");
      setName("");
      setBrand("");
      setModelOrPlan("");
      setUsedFor("");
      setNote("");
      setLinkUrl("");
      setImageUrl(null);
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Item name is required", "error");
      return;
    }
    if (!category) {
      showToast("Category is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payloadItem = {
        id: editingItem?.id,
        category,
        name: name.trim(),
        brand: brand.trim() || undefined,
        modelOrPlan: modelOrPlan.trim() || undefined,
        usedFor: usedFor.trim() || undefined,
        note: note.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        imageUrl: imageUrl || null,
        sortOrder: editingItem ? editingItem.sortOrder : items.length,
        isActive,
      };

      const httpResponse = await fetch("/api/creator/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          item: payloadItem,
        }),
      });
      const apiResponse = await httpResponse.json();

      if (apiResponse.status === 1) {
        showToast(editingItem ? "Setup item updated! ✨" : "Gear added to your setup! 🚀");
        setIsModalOpen(false);
        loadSetupItems();
      } else {
        showToast(apiResponse.message || "Failed to save item", "error");
      }
    } catch {
      showToast("An error occurred while saving item", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: CreatorSetupItem) => {
    try {
      const updated = { ...item, isActive: !item.isActive };
      const httpResponse = await fetch("/api/creator/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.id || creatorLookup,
          email: profile.email,
          item: updated,
        }),
      });
      const apiResponse = await httpResponse.json();

      if (apiResponse.status === 1) {
        showToast(updated.isActive ? "Item visible on profile" : "Item hidden from profile");
        setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
      }
    } catch {
      showToast("Failed to toggle visibility", "error");
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    try {
      const httpResponse = await fetch(
        `/api/creator/setup?id=${encodeURIComponent(itemToDelete.id)}&creatorId=${encodeURIComponent(
          creatorLookup || ""
        )}`,
        { method: "DELETE" }
      );
      const apiResponse = await httpResponse.json();

      if (apiResponse.status === 1) {
        showToast("Item removed from your setup");
        setItemToDelete(null);
        loadSetupItems();
      } else {
        showToast(apiResponse.message || "Failed to delete item", "error");
      }
    } catch {
      showToast("Failed to remove item", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchesSearch =
        !searchQuery.trim() ||
        it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.brand && it.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (it.modelOrPlan && it.modelOrPlan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        it.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategoryFilter === "All") return true;
      if (selectedCategoryFilter === "Hardware & Gear") {
        return CATEGORY_GROUPS[0].categories.includes(it.category as CreatorSetupCategory);
      }
      if (selectedCategoryFilter === "Software & AI") {
        return CATEGORY_GROUPS[1].categories.includes(it.category as CreatorSetupCategory);
      }
      return it.category === selectedCategoryFilter;
    });
  }, [items, searchQuery, selectedCategoryFilter]);

  return (
    <div className="w-full space-y-4 sm:space-y-4.5 pb-8 text-left">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#043084]">
              Creator Setup &amp; Gear
            </h1>
            <span className="rounded-full bg-[#043084]/10 px-2.5 py-0.5 text-xs font-bold text-[#043084]">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#475569] font-medium">
            Showcase your cameras, mics, editing software, AI tools, and desk gear on your public profile.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#043084] px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Gear / Tool</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-[#e2e8f0] bg-white p-2.5 sm:p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["All", "Hardware & Gear", "Software & AI"].map((tab) => {
            const active = selectedCategoryFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedCategoryFilter(tab)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${active
                    ? "bg-[#043084] text-white shadow-xs"
                    : "bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#043084]"
                  }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gear or software..."
            className="h-8.5 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] pl-8.5 pr-3 text-xs text-[#043084] placeholder-[#94a3b8] focus:border-[#043084] focus:bg-white focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#043084]"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Items Listing */}
      {loading ? (
        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-[#e2e8f0] bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#043084] border-t-transparent" />
            <span>Loading your creator setup...</span>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Laptop className="h-7 w-7" />}
          title={searchQuery ? "No matching gear or tools found" : "No gear or tools added yet"}
          description={
            searchQuery
              ? "Try adjusting your search query or clear the filter to view all items."
              : "Add your camera, microphone, studio lighting, or editing software so your community and brands know your setup."
          }
          action={
            !searchQuery ? (
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#043084] h-9 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Your First Gear</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => {
            const IconComponent = getCategoryIcon(item.category);
            return (
              <div
                key={item.id}
                className={`group relative flex flex-col justify-between rounded-xl border bg-white p-3.5 shadow-xs transition-all hover:shadow-sm ${item.isActive ? "border-[#e2e8f0]" : "border-[#e2e8f0] opacity-60 bg-[#f8fafc]"
                  }`}
              >
                <div>
                  {/* Card Header: Category & Visibility Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold text-[#475569]">
                      <IconComponent className="h-3 w-3" />
                      <span>{item.category}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      title={item.isActive ? "Visible on profile. Click to hide." : "Hidden from profile. Click to show."}
                      className="cursor-pointer text-[#64748b] transition-colors hover:text-[#043084]"
                    >
                      {item.isActive ? (
                        <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-[#94a3b8]" />
                      )}
                    </button>
                  </div>

                  {/* Thumbnail & Item Title */}
                  <div className="mt-2.5 flex items-start gap-2.5">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <IconComponent className="h-5 w-5 text-[#94a3b8]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {item.brand && (
                        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                          {item.brand}
                        </p>
                      )}
                      <h4 className="truncate font-display text-xs sm:text-[13px] font-bold text-[#043084]" title={item.name}>
                        {item.name}
                      </h4>
                      {item.modelOrPlan && (
                        <p className="truncate text-[11px] text-[#64748b]" title={item.modelOrPlan}>
                          {item.modelOrPlan}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Usage / Note */}
                  {item.usedFor && (
                    <div className="mt-2.5 rounded-lg bg-[#f8fafc] px-2.5 py-1 border border-[#f1f5f9]">
                      <p className="text-[11px] font-medium text-[#475569]">
                        <span className="font-semibold text-[#043084]">Used for: </span>
                        {item.usedFor}
                      </p>
                    </div>
                  )}

                  {item.note && (
                    <p className="mt-1.5 text-[11px] text-[#64748b] line-clamp-2">
                      {item.note}
                    </p>
                  )}
                </div>

                {/* Footer: Link & Actions */}
                <div className="mt-3 flex items-center justify-between border-t border-[#f1f5f9] pt-2.5">
                  {item.linkUrl ? (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#043084] transition-colors hover:underline"
                    >
                      <span>View Gear</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#94a3b8]">No link</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(item)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#043084] cursor-pointer shadow-2xs"
                      title="Edit item"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 bg-white text-[#C2414B] transition-colors hover:bg-rose-50 cursor-pointer shadow-2xs"
                      title="Delete item"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingItem ? "Edit Setup Item" : "Add Gear or Tool"}
        size="md"
      >
        <form onSubmit={handleSaveItem}>
          <ModalBody className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#043084] mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CreatorSetupCategory)}
                className="h-10 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-xs font-medium text-[#043084] focus:border-[#043084] focus:outline-hidden"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Name & Brand */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#043084] mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. FX3, SM7B, Final Cut Pro"
                  className="h-10 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-xs text-[#043084] placeholder-[#94a3b8] focus:border-[#043084] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#043084] mb-1">
                  Brand / Maker
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Sony, Shure, Apple, Adobe"
                  className="h-10 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-xs text-[#043084] placeholder-[#94a3b8] focus:border-[#043084] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Model / Plan & Used For */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#043084] mb-1">
                  Model / Version / Plan
                </label>
                <input
                  type="text"
                  value={modelOrPlan}
                  onChange={(e) => setModelOrPlan(e.target.value)}
                  placeholder="e.g. Cinema Line, Studio, v18"
                  className="h-10 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-xs text-[#043084] placeholder-[#94a3b8] focus:border-[#043084] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#043084] mb-1">
                  What do you use it for?
                </label>
                <input
                  type="text"
                  value={usedFor}
                  onChange={(e) => setUsedFor(e.target.value)}
                  placeholder="e.g. Main 4K A-cam, Podcast mic"
                  className="h-10 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-xs text-[#043084] placeholder-[#94a3b8] focus:border-[#043084] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-xs font-bold text-[#043084] mb-1">
                Product / Affiliate / Store Link
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://amazon.in/... or https://company.com"
                className="h-10 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-xs text-[#043084] placeholder-[#94a3b8] focus:border-[#043084] focus:outline-hidden"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold text-[#043084] mb-1">
                Item Photo / Icon (Optional)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Camera className="h-5 w-5 text-[#94a3b8]" />
                  )}
                </div>

                <div className="flex flex-1 items-center gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-xs font-semibold text-[#043084] transition-all hover:bg-[#f8fafc]">
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="rounded-[10px] border border-[#e2e8f0] p-2 text-xs font-semibold text-[#64748b] hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Note / Advice */}
            <div>
              <label className="block text-xs font-bold text-[#043084] mb-1">
                Note or Recommendation
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Best microphone for untreated rooms. Highly recommend pairing with a Cloudlifter."
                rows={2}
                className="w-full rounded-[10px] border border-[#e2e8f0] bg-white p-3 text-xs text-[#043084] placeholder-[#94a3b8] focus:border-[#043084] focus:outline-hidden"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-2.5">
              <div>
                <p className="text-xs font-bold text-[#043084]">Show on public profile</p>
                <p className="text-[11px] text-[#64748b]">Turn off to keep as private gear reference</p>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded-sm border-[#cbd5e1] text-[#043084] focus:ring-[#043084] cursor-pointer"
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="h-9 rounded-lg border border-[#e2e8f0] bg-white px-4 text-xs font-semibold text-[#64748b] transition-colors hover:bg-[#f8fafc] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 rounded-lg bg-[#043084] px-5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-hover hover:shadow-sm cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : editingItem ? "Update Gear" : "Add to Setup"}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        title="Remove Gear / Tool"
        description={`Are you sure you want to remove "${itemToDelete?.name}" from your creator setup?`}
        confirmText="Remove"
        cancelText="Cancel"
        loading={isSubmitting}
        isDestructive={true}
      />
    </div>
  );
}
