"use client";

import { Check, Tag, Sparkles } from "lucide-react";
import { CREATOR_TAXONOMY } from "@/data/categories";

interface CategorySelectProps {
  value: string | null; // Comma separated string e.g. "Food & Cooking, Travel"
  customValue?: string | null; // Custom category text if "Other" is selected
  onChange: (categoryString: string, customCategory?: string) => void;
  error?: string;
  max?: number;
}

export function CategorySelect({
  value,
  customValue = "",
  onChange,
  error,
  max = 3,
}: CategorySelectProps) {
  const selectedCategories = value
    ? value.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const isOtherSelected = selectedCategories.includes("Other");

  function toggleCategory(catName: string) {
    let updated: string[];
    if (selectedCategories.includes(catName)) {
      updated = selectedCategories.filter((c) => c !== catName);
    } else {
      if (selectedCategories.length >= max) return; // Limit max 3
      updated = [...selectedCategories, catName];
    }
    const updatedCustom = updated.includes("Other") ? customValue || "" : "";
    onChange(updated.join(", "), updatedCustom);
  }

  function handleCustomChange(newCustomText: string) {
    const trimmed = newCustomText.slice(0, 40); // Max 40 chars
    onChange(selectedCategories.join(", "), trimmed);
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div>
          <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-[#6366F1]" />
            What do you create?
          </label>
          <p className="text-xs text-slate-500">Choose up to {max} categories that best describe your content.</p>
        </div>
        <span className="bg-[#EEF2FF] text-[#6366F1] border border-[#E0E7FF] text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
          {selectedCategories.length} / {max} selected
        </span>
      </div>

      {error && <p className="text-xs font-bold text-rose-500">{error}</p>}

      {/* Compact Chip Pills of Categories */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-[#E5E7EB] bg-slate-50/50 p-3">
        {CREATOR_TAXONOMY.map((item) => {
          const isSelected = selectedCategories.includes(item.category);
          const isMaxReached = !isSelected && selectedCategories.length >= max;

          return (
            <button
              key={item.category}
              type="button"
              disabled={isMaxReached}
              onClick={() => toggleCategory(item.category)}
              className={`tap-scale inline-flex items-center gap-1.5 text-xs py-1 px-3 rounded-full transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#EEF2FF] border border-[#6366F1] text-[#6366F1] font-semibold shadow-2xs"
                  : isMaxReached
                  ? "opacity-40 cursor-not-allowed bg-white border border-[#E5E7EB] text-gray-400"
                  : "bg-white border border-[#E5E7EB] text-[#4B5563] hover:border-gray-300"
              }`}
            >
              <span className="text-xs shrink-0">{item.emoji}</span>
              <span className="truncate">{item.category}</span>
              {isSelected && <Check className="h-3 w-3 stroke-[3] text-[#6366F1] shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Custom input field when "Other" is selected */}
      {isOtherSelected && (
        <div className="animate-fade-in space-y-1.5 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3.5">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#6366F1]" />
            What type of content do you create? <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            maxLength={40}
            placeholder="e.g. Magic, Farming, ASMR, Collectibles, Local Culture"
            value={customValue || ""}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Will be displayed on your public profile instead of "Other".</span>
            <span>{(customValue || "").length} / 40</span>
          </div>
        </div>
      )}
    </div>
  );
}
