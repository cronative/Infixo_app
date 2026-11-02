"use client";

import { useEffect, useState, useMemo, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Laptop,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Camera,
  Mic,
  Sun,
  Sparkles,
  Layers,
  X,
  Briefcase,
  Tag,
  Building2,
  List,
  Link as LinkIcon,
  ExternalLink,
  FileText,
  Globe,
  Disc,
  Compass,
  Sliders,
  MonitorPlay,
  PenTool,
  Headphones,
  BarChart2,
  Calendar,
  Cloud,
  ShoppingBag,
  MoreHorizontal,
  ArrowUpRight,
} from "lucide-react";
import { useCreator } from "@/contexts/CreatorContext";
import { useToast } from "@/contexts/ToastContext";
import { CreatorSetupCategory, CreatorSetupItem } from "@/types";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { creatorSetupRepository } from "@/repositories/localRepository";
import { EmptyState } from "@/components/ui/EmptyState";
import { resizeImageToDataUrl } from "@/lib/imageResize";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PAGE_COPY } from "@/components/dashboard/pageCopy";
import { OverLimitBadge } from "@/components/ui/OverLimitBadge";
import { getPlanQuota } from "@/services/subscriptionLimits";

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

function getCategoryDisplayLabel(category: string): string {
  if (category === "Mic") return "Microphone";
  if (category === "Light") return "Lighting";
  return category;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Camera / Phone":
    case "Lens":
    case "Drone":
      return Camera;
    case "Mic":
    case "Microphone":
    case "Audio Tool":
      return Mic;
    case "Light":
    case "Lighting":
      return Sun;
    case "Tripod / Stand":
      return Compass;
    case "Gimbal / Stabilizer":
      return Sliders;
    case "AI Tool":
      return Sparkles;
    case "Editing Software":
      return Laptop;
    case "Design Tool":
      return PenTool;
    case "Analytics Tool":
      return BarChart2;
    case "Scheduling Tool":
      return Calendar;
    case "Storage / Backup":
      return Cloud;
    case "Studio / Accessory":
      return ShoppingBag;
    default:
      return Layers;
  }
}

const DEFAULT_SETUP_ITEMS: CreatorSetupItem[] = [
  {
    id: "setup_sony_a73",
    creatorId: "demo",
    category: "Camera / Phone",
    name: "A7 III",
    brand: "SONY",
    usingSince: "2023",
    whyLoveIt: "Best camera for vlogging, low light and cinematic 4K shots.",
    budgetAlt: "Sony ZV-E10 or your phone with a basic gimbal",
    isAffiliate: true,
    linkUrl: "https://amazon.com",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=80",
    sortOrder: 0,
    isActive: true,
  },
  {
    id: "setup_rode_mic",
    creatorId: "demo",
    category: "Microphone",
    name: "VideoMic Pro",
    brand: "RØDE",
    usingSince: "2023",
    whyLoveIt: "Crystal clear audio recording for all outdoor and indoor shoots.",
    budgetAlt: "Boya BY-M1 lapel microphone",
    isAffiliate: true,
    linkUrl: "https://amazon.com",
    imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&auto=format&fit=crop&q=80",
    sortOrder: 1,
    isActive: true,
  },
  {
    id: "setup_manfrotto",
    creatorId: "demo",
    category: "Tripod / Stand",
    name: "Carbon Tripod",
    brand: "Manfrotto",
    usingSince: "2022",
    whyLoveIt: "Lightweight and rock-solid for studio and travel setups.",
    isAffiliate: false,
    linkUrl: "https://amazon.com",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&auto=format&fit=crop&q=80",
    sortOrder: 2,
    isActive: true,
  },
  {
    id: "setup_godox",
    creatorId: "demo",
    category: "Lighting",
    name: "LED SL60W",
    brand: "Godox",
    usingSince: "2022",
    whyLoveIt: "Affordable studio key light with soft daylight balance.",
    budgetAlt: "Desk lamp bounced off a white wall or ring light",
    isAffiliate: true,
    linkUrl: "https://amazon.com",
    imageUrl: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=400&auto=format&fit=crop&q=80",
    sortOrder: 3,
    isActive: true,
  },
  {
    id: "setup_premiere",
    creatorId: "demo",
    category: "Editing Software",
    name: "Premiere Pro",
    brand: "Adobe",
    usingSince: "2021",
    whyLoveIt: "My go-to video editing software for all long-form and short-form videos.",
    budgetAlt: "CapCut Desktop or DaVinci Resolve (free)",
    isAffiliate: false,
    linkUrl: "https://adobe.com",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/40/Adobe_Premiere_Pro_CC_icon.svg",
    sortOrder: 4,
    isActive: true,
  },
  {
    id: "setup_chatgpt",
    creatorId: "demo",
    category: "AI Tool",
    name: "ChatGPT Plus",
    brand: "OpenAI",
    usingSince: "2023",
    whyLoveIt: "Invaluable for researching hooks, structuring outlines and brainstorming titles.",
    budgetAlt: "ChatGPT Free tier",
    isAffiliate: false,
    linkUrl: "https://chatgpt.com",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
    sortOrder: 5,
    isActive: true,
  },
];

export default function DashboardSetupPage() {
  const { profile, subscription } = useCreator();
  const { showToast } = useToast();

  const [items, setItems] = useState<CreatorSetupItem[]>([]);
  const [whereIStarted, setWhereIStarted] = useState("");
  const [isSavingIntro, setIsSavingIntro] = useState(false);
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
  const [usingSince, setUsingSince] = useState("");
  const [whyLoveIt, setWhyLoveIt] = useState("");
  const [budgetAlt, setBudgetAlt] = useState("");
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const creatorLookup = profile.id || profile.email || profile.username;
  const cleanHandle = (profile.username || "").replace(/^@/, "");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        if (creatorLookup) {
          const httpResponse = await fetch(
            `/api/creator/setup?creatorId=${encodeURIComponent(creatorLookup)}`
          );
          const apiResponse = await httpResponse.json();
          const fetchedItems = apiResponse.data?.items || apiResponse.items;
          const fetchedSettings = apiResponse.data?.settings || apiResponse.settings;

          if (!cancelled && apiResponse.status === 1) {
            if (fetchedSettings?.whereIStarted) {
              setWhereIStarted(fetchedSettings.whereIStarted);
            }
            if (Array.isArray(fetchedItems) && fetchedItems.length > 0) {
              setItems(fetchedItems);
              creatorSetupRepository.saveAll(fetchedItems);
              return;
            }
          }
        }

        const local = creatorSetupRepository.getAll();
        if (!cancelled) {
          const finalItems = local.length > 0 ? local : DEFAULT_SETUP_ITEMS;
          setItems(finalItems);
          if (local.length === 0) {
            creatorSetupRepository.saveAll(DEFAULT_SETUP_ITEMS);
          }
        }
      } catch {
        const local = creatorSetupRepository.getAll();
        if (!cancelled) {
          const finalItems = local.length > 0 ? local : DEFAULT_SETUP_ITEMS;
          setItems(finalItems);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [creatorLookup]);

  const handleSaveIntro = async () => {
    setIsSavingIntro(true);
    try {
      const res = await fetch("/api/creator/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_intro",
          whereIStarted: whereIStarted.trim().slice(0, 150),
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 1) {
        showToast("Where I started intro saved! ✨");
      } else {
        showToast(data.message || "Could not save intro.", "error");
      }
    } catch {
      showToast("Could not save intro. Please try again.", "error");
    } finally {
      setIsSavingIntro(false);
    }
  };

  const handleOpenModal = (item?: CreatorSetupItem) => {
    if (item) {
      setEditingItem(item);
      setCategory(item.category as CreatorSetupCategory);
      setName(item.name);
      setBrand(item.brand || "");
      setUsingSince(item.usingSince || item.modelOrPlan || "");
      setWhyLoveIt(item.whyLoveIt || item.note || item.usedFor || "");
      setBudgetAlt(item.budgetAlt || "");
      setIsAffiliate(Boolean(item.isAffiliate));
      setLinkUrl(item.linkUrl || "");
      setImageUrl(item.imageUrl || null);
      setIsActive(item.isActive !== false);
    } else {
      setEditingItem(null);
      setCategory("Camera / Phone");
      setName("");
      setBrand("");
      setUsingSince("");
      setWhyLoveIt("");
      setBudgetAlt("");
      setIsAffiliate(false);
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

    resizeImageToDataUrl(file, 800)
      .then(setImageUrl)
      .catch(() => showToast("Could not read that image.", "error"));
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
      const newItem: CreatorSetupItem = {
        id: editingItem?.id || `setup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        creatorId: creatorLookup || "anonymous",
        category,
        name: name.trim(),
        brand: brand.trim() || undefined,
        usingSince: usingSince.trim() || undefined,
        modelOrPlan: usingSince.trim() || undefined,
        whyLoveIt: whyLoveIt.trim().slice(0, 120) || undefined,
        note: whyLoveIt.trim().slice(0, 120) || undefined,
        budgetAlt: budgetAlt.trim().slice(0, 80) || undefined,
        isAffiliate,
        linkUrl: linkUrl.trim() || undefined,
        imageUrl: imageUrl || undefined,
        isActive,
        sortOrder: editingItem ? editingItem.sortOrder : items.length,
      };

      const res = await fetch("/api/creator/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_item",
          item: newItem,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.status === 0) {
        showToast(data.message || "Could not save setup item.", "error");
        return;
      }

      const updated = editingItem
        ? items.map((it) => (it.id === editingItem.id ? newItem : it))
        : [newItem, ...items];

      setItems(updated);
      creatorSetupRepository.saveAll(updated);

      showToast(editingItem ? "Gear updated successfully! ✨" : "Gear added to your setup! ✨");
      setIsModalOpen(false);
    } catch {
      showToast("Could not save setup item. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/creator/setup?id=${encodeURIComponent(itemToDelete.id)}`, {
        method: "DELETE",
      });

      const updated = items.filter((it) => it.id !== itemToDelete.id);
      setItems(updated);
      creatorSetupRepository.saveAll(updated);

      showToast("Gear item removed.");
      setItemToDelete(null);
    } catch {
      showToast("Could not remove item.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: CreatorSetupItem) => {
    try {
      await fetch("/api/creator/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_active",
          id: item.id,
        }),
      });

      const updated = items.map((it) =>
        it.id === item.id ? { ...it, isActive: !it.isActive } : it
      );
      setItems(updated);
      creatorSetupRepository.saveAll(updated);

      showToast(item.isActive ? "Item hidden from profile." : "Item visible on profile.");
    } catch {
      showToast("Could not toggle visibility.", "error");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = it.name.toLowerCase().includes(q);
        const matchesBrand = it.brand?.toLowerCase().includes(q);
        const matchesCategory = it.category.toLowerCase().includes(q);
        const matchesWhy = (it.whyLoveIt || it.note || it.usedFor || "").toLowerCase().includes(q);
        const matchesUsing = (it.usingSince || it.modelOrPlan || "").toLowerCase().includes(q);
        const matchesBudget = it.budgetAlt?.toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesCategory && !matchesWhy && !matchesUsing && !matchesBudget) {
          return false;
        }
      }

      // Category Group Filter
      if (selectedCategoryFilter === "All") return true;

      const group = CATEGORY_GROUPS.find((g) => g.label === selectedCategoryFilter);
      if (group) {
        return (
          group.categories.includes(it.category as CreatorSetupCategory) ||
          (selectedCategoryFilter === "Hardware & Gear" &&
            (it.category === "Microphone" || it.category === "Lighting"))
        );
      }

      return it.category === selectedCategoryFilter;
    });
  }, [items, searchQuery, selectedCategoryFilter]);

  const maxGear = getPlanQuota(subscription?.planKey).maxGearItems;

  return (
    <PageContainer>
      <PageHeader
        {...PAGE_COPY.setup}
        meta={`${items.length} ${items.length === 1 ? "item" : "items"}`}
        actions={
          <div className="flex items-center gap-2">
            {cleanHandle && (
              <Link
                href={`/${cleanHandle}/setup`}
                target="_blank"
                className="dash-btn-secondary"
              >
                <span>View setup</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
            <button type="button" onClick={() => handleOpenModal()} className="dash-btn-primary">
              <Plus className="h-4 w-4" />
              <span>Add gear or tool</span>
            </button>
          </div>
        }
      />

      {/* Section intro: Where I started (150 chars max) */}
      <div className="rounded-[5px] border border-[#ECECF0] bg-white p-3.5 sm:p-4 text-left shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#7A2253]" />
              <h3 className="text-xs sm:text-sm font-bold text-[#0f172a]">Where I started</h3>
            </div>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              Tell your audience how you started creating (max 150 chars). Shown at the top of your setup page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#94a3b8] font-mono">{whereIStarted.length}/150</span>
            <button
              type="button"
              onClick={handleSaveIntro}
              disabled={isSavingIntro}
              className="h-8 px-3 rounded-[5px] bg-[#7A2253] text-white text-xs font-semibold hover:bg-[#601b41] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSavingIntro ? "Saving..." : "Save intro"}
            </button>
          </div>
        </div>
        <textarea
          value={whereIStarted}
          onChange={(e) => setWhereIStarted(e.target.value.slice(0, 150))}
          placeholder="e.g. I shot my first 50 videos on an iPhone 8 with window light. Upgrade only when your gear holds you back."
          rows={2}
          maxLength={150}
          className="w-full rounded-[5px] border border-[#e2e8f0] p-2.5 text-xs text-[#0f172a] placeholder-[#94a3b8] focus:border-[#7A2253] focus:outline-hidden transition-colors resize-none"
        />
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter("All")}
            className={`shrink-0 rounded-[5px] px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategoryFilter === "All"
                ? "bg-[#7A2253] text-white shadow-xs"
                : "border border-[#e2e8f0] bg-white text-[#475569] hover:border-[#cbd5e1] hover:text-[#0f172a]"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span>All</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategoryFilter("Hardware & Gear")}
            className={`shrink-0 rounded-[5px] border px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategoryFilter === "Hardware & Gear"
                ? "border-[#7A2253] bg-[#7A2253] text-white shadow-xs"
                : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#cbd5e1] hover:text-[#0f172a]"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Hardware &amp; Gear</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategoryFilter("Software & AI")}
            className={`shrink-0 rounded-[5px] border px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategoryFilter === "Software & AI"
                ? "border-[#7A2253] bg-[#7A2253] text-white shadow-xs"
                : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#cbd5e1] hover:text-[#0f172a]"
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>Software &amp; AI</span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gear or software..."
            className="h-9 w-full rounded-[5px] border border-[#e2e8f0] bg-white pl-9 pr-8 text-xs text-[#0f172a] placeholder-[#94a3b8] focus:border-[#7A2253] focus:outline-hidden transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#7A2253] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Items Listing Cards Grid */}
      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-[5px] border border-[#e2e8f0] bg-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7A2253] border-t-transparent" />
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
                className="inline-flex items-center gap-2 rounded-[5px] bg-[#7A2253] h-9 px-4 text-xs font-semibold text-white shadow-md shadow-[#7A2253]/20 transition-all hover:opacity-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Your First Gear</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {filteredItems.map((item) => {
            const IconComponent = getCategoryIcon(item.category);
            const displayCategory = getCategoryDisplayLabel(item.category);
            const isOverLimit = items.indexOf(item) >= maxGear;
            const usingText = item.usingSince || item.modelOrPlan;
            const whyText = item.whyLoveIt || item.note || item.usedFor;

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col justify-between rounded-[5px] border bg-white p-3.5 sm:p-4 shadow-none transition-all ${
                  item.isActive ? "border-[#ECECF0]" : "border-[#ECECF0] opacity-65 bg-[#FAFAFB]"
                }`}
              >
                <div>
                  {/* Top Bar: Category Chip + OverLimit Chip + Visibility Toggle */}
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <span className="inline-flex items-center gap-1.5 h-6 rounded-[5px] bg-[#FAFAFB] border border-[#ECECF0] px-2 text-[12px] font-medium text-[#3F3F46]">
                      <IconComponent className="h-3.5 w-3.5 text-[#6B6B76]" />
                      <span>{displayCategory}</span>
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOverLimit && <OverLimitBadge />}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        title={item.isActive ? "Visible on profile. Click to hide." : "Hidden from profile. Click to show."}
                        className="cursor-pointer text-emerald-500 hover:text-emerald-600 transition-colors p-0.5"
                      >
                        {item.isActive ? (
                          <Eye className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-[#94a3b8]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Product Image on Left + Info on Right */}
                  <div className="flex items-start gap-3 pt-2.5 pb-1.5">
                    {/* Image Container */}
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-[#fafafa] p-1.5 border border-[#f1f5f9]">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <IconComponent className="h-7 w-7 text-[#cbd5e1]" />
                      )}
                    </div>

                    {/* Product Details: Brand, Name, Using since */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      {item.brand && (
                        <p className="line-clamp-1 break-words text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                          {item.brand}
                        </p>
                      )}
                      <h3 className="font-display text-sm sm:text-[15px] font-bold text-[#0f172a] leading-tight line-clamp-2 break-words" title={item.name}>
                        {item.name}
                      </h3>
                      {usingText && (
                        <p className="line-clamp-1 break-words text-[11px] text-[#94a3b8] font-normal leading-tight">
                          Using since {usingText}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Why I love it (120 chars) */}
                  {whyText && (
                    <p className="mt-1 text-xs text-[#64748b] leading-relaxed line-clamp-2 italic">
                      &ldquo;{whyText}&rdquo;
                    </p>
                  )}

                  {/* Budget alternative callout */}
                  {item.budgetAlt && (
                    <div className="mt-2 rounded-[4px] border border-[#f1f5f9] bg-[#f8fafc] px-2 py-1 text-[11px] leading-tight text-[#475569]">
                      <span className="font-semibold text-[#7A2253]">Starting out? Try this instead: </span>
                      <span>{item.budgetAlt}</span>
                    </div>
                  )}
                </div>

                {/* Footer: View Gear + Affiliate tag on left, Edit & Delete on right */}
                <div className="mt-3 flex items-center justify-between border-t border-[#f1f5f9] pt-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.isAffiliate && (
                      <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[3px] border border-amber-200/60 shrink-0">
                        Affiliate
                      </span>
                    )}
                    {item.linkUrl ? (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel={item.isAffiliate ? "sponsored noopener" : "noopener noreferrer"}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#7A2253] transition-colors hover:underline cursor-pointer truncate"
                      >
                        <span>View Product</span>
                        <span className="text-sm font-bold">&rarr;</span>
                      </a>
                    ) : (
                      <span className="text-xs text-[#94a3b8]">No link</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white text-[#6B6B76] hover:bg-[#FAFAFB] hover:text-[#18181B] transition-colors cursor-pointer"
                      title="Edit item"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-[#ECECF0] bg-white text-[#C2414B] hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
        title={editingItem ? "Edit setup item" : "Add gear or tool"}
        description="Show the tools, gadgets and software you use to create your content."
        icon={<Briefcase className="h-5 w-5" />}
        size="lg"
      >
        <form onSubmit={handleSaveItem} className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-4 sm:p-5 space-y-4 text-left">
            {/* Category Grid */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#0f172a]">
                Category <span className="text-rose-500">*</span>
                <span className="block text-xs font-normal text-[#64748b]">Select the category that best fits your item.</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  const icon =
                    cat === "Camera / Phone" ? <Camera className="h-4 w-4" /> :
                    cat === "Lens" ? <Disc className="h-4 w-4" /> :
                    cat === "Mic" ? <Mic className="h-4 w-4" /> :
                    cat === "Light" ? <Sun className="h-4 w-4" /> :
                    cat === "Tripod / Stand" ? <Compass className="h-4 w-4" /> :
                    cat === "Gimbal / Stabilizer" ? <Sliders className="h-4 w-4" /> :
                    cat === "Drone" ? <Laptop className="h-4 w-4" /> :
                    cat === "Editing Software" ? <MonitorPlay className="h-4 w-4" /> :
                    cat === "AI Tool" ? <Sparkles className="h-4 w-4" /> :
                    cat === "Design Tool" ? <PenTool className="h-4 w-4" /> :
                    cat === "Audio Tool" ? <Headphones className="h-4 w-4" /> :
                    cat === "Analytics Tool" ? <BarChart2 className="h-4 w-4" /> :
                    cat === "Scheduling Tool" ? <Calendar className="h-4 w-4" /> :
                    cat === "Storage / Backup" ? <Cloud className="h-4 w-4" /> :
                    cat === "Studio / Accessory" ? <ShoppingBag className="h-4 w-4" /> :
                    <MoreHorizontal className="h-4 w-4" />;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex flex-col items-center justify-center p-2.5 h-16 rounded-[5px] border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#7A2253] bg-[#FFF0F5] text-[#7A2253] ring-1 ring-[#7A2253]"
                          : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc] hover:border-[#cbd5e1]"
                      }`}
                    >
                      <div className={`mb-1 shrink-0 ${isSelected ? "text-[#7A2253]" : "text-[#64748b]"}`}>
                        {icon}
                      </div>
                      <span className="text-[11px] font-semibold line-clamp-2 break-words w-full leading-tight">
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name & Brand */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <Tag className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. A7 III, VideoMic Pro, Tripod"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Brand / Maker
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Sony, RØDE, Manfrotto, Godox"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Using since & Budget alternative */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Using since
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <List className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={usingSince}
                    onChange={(e) => setUsingSince(e.target.value)}
                    placeholder="e.g. 2023, 2024, or 2 years"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-medium text-[#0f172a]">
                    Budget alternative <span className="font-normal text-[#94a3b8]">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-[#94a3b8] font-mono">{budgetAlt.length}/80</span>
                </div>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={budgetAlt}
                    maxLength={80}
                    onChange={(e) => setBudgetAlt(e.target.value.slice(0, 80))}
                    placeholder="e.g. Sony ZV-E10 or your phone with a lapel mic"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Why I love it (Merged: Used for + Note, 120 chars) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Why I love it
                </label>
                <span className="text-[11px] text-[#94a3b8] font-mono">{whyLoveIt.length}/120</span>
              </div>
              <div className="flex rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                <div className="flex w-10 shrink-0 items-start justify-center pt-2.5 border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                  <FileText className="h-4 w-4" />
                </div>
                <textarea
                  value={whyLoveIt}
                  maxLength={120}
                  onChange={(e) => setWhyLoveIt(e.target.value.slice(0, 120))}
                  placeholder="e.g. Best camera for vlogging, low light and cinematic 4K shots."
                  rows={2}
                  className="flex-1 p-2.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none resize-none"
                />
              </div>
            </div>

            {/* Link URL & Affiliate toggle */}
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="block text-[13px] font-medium text-[#0f172a]">
                  Product / Affiliate / Store Link
                </label>
                <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://amazon.com/... or https://company.com"
                    className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-medium text-[#0f172a] placeholder:text-[#64748b]/50 bg-transparent outline-none"
                  />
                  <div className="pr-3 text-[#64748b]">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Affiliate Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-0.5">
                <input
                  type="checkbox"
                  checked={isAffiliate}
                  onChange={(e) => setIsAffiliate(e.target.checked)}
                  className="h-4 w-4 rounded-[3px] border-[#cbd5e1] text-[#7A2253] focus:ring-[#7A2253] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#0f172a]">
                  This is an affiliate link{" "}
                  <span className="text-[11px] font-normal text-[#64748b]">(displays an honest &quot;Affiliate&quot; badge)</span>
                </span>
              </label>
            </div>

            {/* Image Upload + Tips Container */}
            <div className="space-y-1">
              <label className="block text-[13px] font-medium text-[#0f172a]">
                Item Photo / Icon <span className="font-normal text-[#94a3b8]">(Optional)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                {/* Upload Dropzone */}
                <div className="relative flex flex-col items-center justify-center p-4 border border-dashed border-[#cbd5e1] rounded-[5px] bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors cursor-pointer min-h-[96px] group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    aria-label="Upload item image"
                  />
                  {imageUrl ? (
                    <div className="relative flex items-center gap-3 w-full">
                      <div className="relative h-14 w-14 shrink-0 rounded-[5px] overflow-hidden border border-[#e2e8f0] bg-white">
                        <Image
                          src={imageUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-[#0f172a]">Image selected</span>
                        <span className="block text-[11px] text-[#64748b]">Click to change image</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageUrl(null);
                        }}
                        className="relative z-20 h-7 w-7 flex items-center justify-center rounded-[5px] text-[#64748b] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#7A2253] mb-1">
                        <Camera className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold text-[#0f172a]">Upload Image</span>
                      <span className="text-[11px] text-[#94a3b8]">JPG, PNG (Max 5MB)</span>
                    </div>
                  )}
                </div>

                {/* Tips Box */}
                <div className="flex flex-col justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] p-3 text-left">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#7A2253] mb-1">
                    <span>💡</span>
                    <span>Tips</span>
                  </div>
                  <ul className="text-[11px] text-[#64748b] space-y-0.5 leading-snug list-disc list-inside">
                    <li>Use a clean product photo or company logo</li>
                    <li>Square 1:1 image works best</li>
                    <li>Leave empty to use category icon</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Show on public profile Switch Banner */}
            <div className="flex items-center justify-between rounded-[5px] border border-[#FCE7F1] bg-[#FFF0F5] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-white border border-[#FCE7F1] text-[#7A2253]">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#7A2253]">Show on public profile</p>
                  <p className="text-[11px] text-[#64748b]">Turn off to keep as private gear reference.</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? "bg-[#7A2253]" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    isActive ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </ModalBody>

          <ModalFooter className="px-5 sm:px-6 py-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-[5px] border border-[#e2e8f0] bg-white text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-[5px] bg-[#7A2253] text-white font-semibold text-xs transition-all cursor-pointer shadow-md shadow-[#7A2253]/20 hover:bg-[#601b41] disabled:opacity-60"
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
    </PageContainer>
  );
}
