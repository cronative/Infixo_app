"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Sparkles, Tag, X } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedCategories = value
    ? value.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const isOtherSelected = selectedCategories.includes("Other");
  const selectedLabel = selectedCategories.length > 0
    ? selectedCategories.map((category) => category === "Other" && customValue ? customValue : category).join(", ")
    : "Select creator categories";

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

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

  function removeCategory(catName: string) {
    const updated = selectedCategories.filter((c) => c !== catName);
    const updatedCustom = updated.includes("Other") ? customValue || "" : "";
    onChange(updated.join(", "), updatedCustom);
  }

  function handleCustomChange(newCustomText: string) {
    const trimmed = newCustomText.slice(0, 40); // Max 40 chars
    onChange(selectedCategories.join(", "), trimmed);
  }

  return (
    <div className="w-full space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div>
          <label className="text-sm font-extrabold text-[#151933] flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-[#151933]" />
            What do you create?
          </label>
          <p className="text-xs italic text-[#64748b]">Choose up to {max} categories that best describe your content.</p>
        </div>
        <span className="bg-[#151933]/[0.08] text-[#151933] border border-[#151933]/20 text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
          {selectedCategories.length} / {max} selected
        </span>
      </div>

      {error && <p className="text-xs font-bold text-rose-500">{error}</p>}

      <div ref={dropdownRef} className="relative space-y-2">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-left shadow-xs transition-all cursor-pointer ${isOpen
            ? "border-[#151933] ring-2 ring-[#151933]/[0.06]"
            : error
              ? "border-rose-300"
              : "border-[#dbe3ee] hover:border-[#cbd5e1] hover:shadow-sm"
            }`}
          aria-expanded={isOpen}
        >
          <span className={`min-w-0 flex-1 truncate text-sm font-bold ${selectedCategories.length > 0 ? "text-[#151933]" : "text-[#94a3b8]"}`}>
            {selectedLabel}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[#64748b] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => removeCategory(category)}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#dbe3ee] bg-[#f8fafc] px-2.5 text-[11px] font-bold text-[#151933] transition-colors hover:border-[#cbd5e1] hover:bg-[#f1f5f9]"
              >
                <span>{category === "Other" && customValue ? customValue : category}</span>
                <X className="h-3 w-3 stroke-[3] text-[#64748b]" />
              </button>
            ))}
          </div>
        )}

        {isOpen && (
          <div className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-xl border border-[#dbe3ee] bg-white shadow-xl shadow-[#151933]/10">
            <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
              <p className="text-[11px] font-bold text-[#475569]">
                Select up to {max}. Tap again to remove.
              </p>
            </div>
            <div className="max-h-56 overflow-y-auto p-1.5">
              {CREATOR_TAXONOMY.map((item) => {
                const isSelected = selectedCategories.includes(item.category);
                const isMaxReached = !isSelected && selectedCategories.length >= max;

                return (
                  <button
                    key={item.category}
                    type="button"
                    disabled={isMaxReached}
                    onClick={() => toggleCategory(item.category)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all cursor-pointer ${isSelected
                      ? "bg-[#151933]/[0.06] text-[#151933]"
                      : isMaxReached
                        ? "cursor-not-allowed opacity-40"
                        : "text-[#475569] hover:bg-[#f1f5f9] hover:text-[#151933]"
                      }`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f8fafc] text-sm">
                      {item.emoji}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {item.category}
                    </span>
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${isSelected
                        ? "border-[#151933] bg-[#151933] text-white"
                        : "border-[#cbd5e1] bg-white"
                        }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Custom input field when "Other" is selected */}
      {isOtherSelected && (
        <div className="animate-fade-in space-y-1.5 rounded-xl border border-[#dbe3ee] bg-[#f8fafc] p-3">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#151933]" />
            What type of content do you create? <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            maxLength={40}
            placeholder="e.g. Magic, Farming, ASMR, Collectibles, Local Culture"
            value={customValue || ""}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="w-full rounded-xl border border-[#dbe3ee] bg-white px-3.5 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:border-[#151933] focus:outline-none focus:ring-2 focus:ring-[#151933]/10"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Will be displayed on your public profile instead of &ldquo;Other&rdquo;.</span>
            <span>{(customValue || "").length} / 40</span>
          </div>
        </div>
      )}
    </div>
  );
}
