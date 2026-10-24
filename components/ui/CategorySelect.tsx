"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Layers, Search, Tag, TrendingUp, X } from "lucide-react";
import { CREATOR_TAXONOMY, getCategoryEmoji } from "@/data/categories";
import { Modal } from "@/components/ui/Modal";

interface CategorySelectProps {
  value: string | null; // Comma separated string e.g. "Food & Cooking, Travel"
  customValue?: string | null; // Custom category text if "Other" is selected
  onChange: (categoryString: string, customCategory?: string) => void;
  error?: string;
  max?: number;
}

const POPULAR_NICHES_CONFIG = [
  { name: "Food & Cooking", emoji: "🍕", bg: "bg-[#FFF5F0] border-[#FFEDD5] text-[#9A3412]" },
  { name: "Comedy & Entertainment", emoji: "😀", bg: "bg-[#FFF0F5] border-[#FCE7F3] text-[#831843]" },
  { name: "Travel & Adventure", emoji: "✈️", bg: "bg-[#F0F9FF] border-[#E0F2FE] text-[#0369A1]" },
  { name: "Technology & AI", emoji: "💻", bg: "bg-[#F5F3FF] border-[#EDE9FE] text-[#6D28D9]" },
  { name: "Fashion & Beauty", emoji: "👗", bg: "bg-[#FFF0F5] border-[#FCE7F3] text-[#9D174D]" },
  { name: "Fitness & Wellness", emoji: "🏋️", bg: "bg-[#FDF2F8] border-[#FCE7F3] text-[#831843]" },
  { name: "Gaming & Esports", emoji: "🎮", bg: "bg-[#FAF5FF] border-[#F3E8FF] text-[#7E22CE]" },
  { name: "Daily Vlogger", emoji: "📹", bg: "bg-[#FFF1F2] border-[#FFE4E6] text-[#BE123C]" },
];

const CATEGORY_THEMES: Record<string, { headerBg: string; textColor: string; borderColor: string }> = {
  "Comedy & Entertainment": {
    headerBg: "bg-[#FFF0F5]",
    textColor: "text-[#7A2253]",
    borderColor: "border-[#FCE7F3]",
  },
  "Food & Cooking": {
    headerBg: "bg-[#FFF0F5]",
    textColor: "text-[#7A2253]",
    borderColor: "border-[#FCE7F3]",
  },
  "Travel & Adventure": {
    headerBg: "bg-[#F0F9FF]",
    textColor: "text-[#0369A1]",
    borderColor: "border-[#E0F2FE]",
  },
  "Technology & AI": {
    headerBg: "bg-[#F5F3FF]",
    textColor: "text-[#581C87]",
    borderColor: "border-[#EDE9FE]",
  },
  "Fashion & Beauty": {
    headerBg: "bg-[#FFF0F5]",
    textColor: "text-[#831843]",
    borderColor: "border-[#FCE7F3]",
  },
  "Fitness & Wellness": {
    headerBg: "bg-[#F0FDF4]",
    textColor: "text-[#15803D]",
    borderColor: "border-[#DCFCE7]",
  },
  "Gaming & Esports": {
    headerBg: "bg-[#FAF5FF]",
    textColor: "text-[#7E22CE]",
    borderColor: "border-[#F3E8FF]",
  },
  "Lifestyle & Vlogs": {
    headerBg: "bg-[#FFF1F2]",
    textColor: "text-[#BE123C]",
    borderColor: "border-[#FFE4E6]",
  },
};

const DEFAULT_THEME = {
  headerBg: "bg-[#FFF0F5]",
  textColor: "text-[#7A2253]",
  borderColor: "border-[#FCE7F3]",
};

export function CategorySelect({
  value,
  customValue = "",
  onChange,
  error,
  max = 3,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const selectedCategories = useMemo(() => {
    return value
      ? value.split(",").map((c) => c.trim()).filter(Boolean)
      : [];
  }, [value]);

  const selectedLabel = selectedCategories.length > 0
    ? selectedCategories.map((category) => category === "Other" && customValue ? customValue : category).join(", ")
    : "e.g. Food, Comedy, Tech";

  const filteredTaxonomy = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return CREATOR_TAXONOMY;

    return CREATOR_TAXONOMY
      .map((group) => ({
        ...group,
        subtypes: group.subtypes.filter((type) =>
          type.toLowerCase().includes(query) || group.category.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.subtypes.length > 0);
  }, [searchQuery]);

  function toggleCategory(catName: string) {
    let updated: string[];
    if (selectedCategories.includes(catName)) {
      updated = selectedCategories.filter((c) => c !== catName);
    } else {
      if (selectedCategories.length >= max) return; // Limit max 3
      updated = [...selectedCategories, catName];
    }
    onChange(updated.join(", "), "");
  }

  function removeCategory(catName: string) {
    const updated = selectedCategories.filter((c) => c !== catName);
    onChange(updated.join(", "), "");
  }

  function toggleAccordion(catName: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  }

  function openPicker() {
    setIsOpen(true);
  }

  function closePicker() {
    setIsOpen(false);
    setSearchQuery("");
  }

  return (
    <div className="w-full space-y-3.5 text-left">
      {/* Field Label & Count Badge Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F3] text-[#7A2253] shrink-0">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-[#0f172a]">
              What do you create? <span className="text-red-500">*</span>
            </h2>
            <p className="text-xs text-[#64748b] font-normal mt-0.5">
              Select up to {max} niches or creator types that best describe you.
            </p>
          </div>
        </div>
        <span className="bg-[#FFF0F5] text-[#7A2253] border border-[#FCE7F3] text-xs font-semibold px-2.5 py-0.5 rounded-[5px] shrink-0">
          {selectedCategories.length} / {max} selected
        </span>
      </div>

      {error && <p className="text-xs font-medium text-rose-500">{error}</p>}

      {/* Select Trigger Box with Selected Chips Inside */}
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        className={`flex min-h-[46px] w-full items-center justify-between gap-2.5 rounded-[5px] border bg-white px-3 py-2 text-left shadow-2xs transition-all cursor-pointer ${
          isOpen
            ? "border-[#7A2253] ring-1 ring-[#7A2253]/20"
            : error
              ? "border-rose-400"
              : "border-[#fbcfe8] hover:border-[#7A2253]"
        }`}
        aria-expanded={isOpen}
      >
        <div className="min-w-0 flex-1 flex flex-wrap gap-1.5 items-center">
          {selectedCategories.length === 0 ? (
            <span className="text-xs sm:text-sm font-semibold text-[#94a3b8]">
              Select niches or creator types... (e.g. Food, Comedy, Tech)
            </span>
          ) : (
            selectedCategories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#FCE7F3] bg-[#FFF0F5] px-2.5 py-1 text-xs font-semibold text-[#7A2253]"
              >
                <span>{getCategoryEmoji(category)}</span>
                <span>{category === "Other" && customValue ? customValue : category}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCategory(category);
                  }}
                  className="hover:opacity-75 cursor-pointer ml-0.5"
                  aria-label={`Remove ${category}`}
                >
                  <X className="h-3 w-3 stroke-[2.5]" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#64748b] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {/* Popular Niches Quick Row */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f172a]">
          <TrendingUp className="h-3.5 w-3.5 text-[#e11d48]" />
          <span>Popular niches</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_NICHES_CONFIG.map((niche) => {
            const isSelected = selectedCategories.includes(niche.name);
            return (
              <button
                key={niche.name}
                type="button"
                onClick={() => toggleCategory(niche.name)}
                className={`rounded-[5px] border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#7A2253] text-white border-[#7A2253] shadow-xs"
                    : "bg-[#f8fafc] hover:bg-[#f1f5f9] border-[#e2e8f0] text-[#1e293b]"
                }`}
              >
                {niche.name}
              </button>
            );
          })}
        </div>
      </div>

        {/* Picker Modal */}
        <Modal
          isOpen={isOpen}
          onClose={closePicker}
          showCloseButton={false}
          size="xl"
          className="max-sm:h-[100dvh] max-sm:max-h-[100dvh] sm:max-h-[90dvh] max-w-3xl rounded-[5px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F1F5F9] bg-white px-5 sm:px-6 py-4 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0 pr-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F3] text-[#7A2253] shrink-0">
                <Tag className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                  What do you create?
                </h2>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 truncate sm:overflow-visible sm:whitespace-normal">
                  Select up to {max} niches or specific creator types that best describe you.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closePicker}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-[5px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search niches... (e.g. Food, Comedy, Tech, Gaming)"
                className="h-11 w-full rounded-[5px] border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#7A2253] focus:outline-none focus:ring-1 focus:ring-[#7A2253]"
                autoFocus
              />
            </div>

            {/* Popular Niches Section */}
            {!searchQuery && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🔥</span>
                    <span className="text-sm font-bold text-[#0F172A]">Popular Niches</span>
                  </div>
                  <span className="text-xs text-[#94A3B8] font-normal">Tap to select</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_NICHES_CONFIG.map((niche) => {
                    const isSelected = selectedCategories.includes(niche.name);
                    return (
                      <button
                        key={niche.name}
                        type="button"
                        onClick={() => toggleCategory(niche.name)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[5px] border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#7A2253] text-white border-[#7A2253] shadow-xs"
                            : `${niche.bg} hover:border-[#7A2253]/30`
                        }`}
                      >
                        <span className="text-sm">{niche.emoji}</span>
                        <span>{niche.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Creator Types Section */}
            {selectedCategories.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-[#7A2253]" />
                    <span className="text-sm font-bold text-[#0F172A]">Selected Creator Types</span>
                  </div>
                  <span className="rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F3] px-2.5 py-0.5 text-xs font-semibold text-[#7A2253]">
                    {selectedCategories.length} / {max} selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((cat) => (
                    <div
                      key={cat}
                      className="inline-flex items-center gap-2 rounded-[5px] border border-[#FCE7F3] bg-[#FFF0F5] px-3 py-1 text-xs font-semibold text-[#7A2253]"
                    >
                      <span className="text-sm">{getCategoryEmoji(cat)}</span>
                      <span>{cat === "Other" && customValue ? customValue : cat}</span>
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="hover:opacity-75 transition-opacity cursor-pointer p-0.5 ml-0.5"
                        aria-label={`Remove ${cat}`}
                      >
                        <X className="h-3 w-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categories Accordion Groups */}
            {filteredTaxonomy.length === 0 ? (
              <div className="rounded-[5px] border border-dashed border-[#CBD5E1] px-4 py-10 text-center text-xs font-medium text-[#64748B]">
                No creator types found matching &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTaxonomy.map((group) => {
                  const theme = CATEGORY_THEMES[group.category] || DEFAULT_THEME;
                  const isExpanded = !collapsedCategories.has(group.category) || searchQuery.trim().length > 0;

                  return (
                    <div
                      key={group.category}
                      className={`rounded-[5px] border ${theme.borderColor} overflow-hidden bg-white shadow-2xs`}
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleAccordion(group.category)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors cursor-pointer ${theme.headerBg} ${theme.textColor}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{group.emoji}</span>
                          <span className="text-xs sm:text-sm font-bold tracking-tight">
                            {group.category}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {/* Accordion Body Grid */}
                      {isExpanded && (
                        <div className="p-3 bg-white border-t border-[#F1F5F9]">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {group.subtypes.map((type) => {
                              const isSelected = selectedCategories.includes(type);
                              const isMaxReached = !isSelected && selectedCategories.length >= max;

                              return (
                                <button
                                  key={`${group.category}-${type}`}
                                  type="button"
                                  disabled={isMaxReached}
                                  onClick={() => toggleCategory(type)}
                                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[5px] text-left transition-all cursor-pointer border ${
                                    isSelected
                                      ? "bg-[#7A2253] border-[#7A2253] text-white shadow-xs"
                                      : isMaxReached
                                        ? "bg-white border-[#E2E8F0] opacity-40 cursor-not-allowed text-[#94A3B8]"
                                        : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1] text-[#1E293B]"
                                  }`}
                                >
                                  <div
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
                                      isSelected
                                        ? "border-white bg-[#7A2253] text-white"
                                        : "border-[#CBD5E1] bg-white"
                                    }`}
                                  >
                                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                  </div>
                                  <span className={`text-xs ${isSelected ? "font-semibold text-white" : "font-medium text-[#1E293B]"} truncate`}>
                                    {type}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="flex items-center justify-between border-t border-[#F1F5F9] bg-white px-5 sm:px-6 py-3.5 shrink-0">
            <span className="text-sm font-bold text-[#7A2253]">
              {selectedCategories.length} / {max} selected
            </span>
            <button
              type="button"
              onClick={closePicker}
              className="rounded-[5px] bg-[#7A2253] hover:bg-[#681B46] px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </Modal>
    </div>
  );
}
