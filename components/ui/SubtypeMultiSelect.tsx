"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, Search, Check, X, AlertCircle } from "lucide-react";
import { getProfessionsForCategory } from "@/data/categories";

interface SubtypeMultiSelectProps {
  category: string | null;
  value: string | null;
  onChange: (value: string | null) => void;
  max?: number;
  label?: string;
}

export function SubtypeMultiSelect({
  category,
  value,
  onChange,
  max = 3,
  label,
}: SubtypeMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItems = value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const availableProfessions = getProfessionsForCategory(category);

  const filtered = availableProfessions.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase().trim())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleItem(item: string) {
    if (selectedItems.includes(item)) {
      const updated = selectedItems.filter((i) => i !== item);
      onChange(updated.length > 0 ? updated.join(", ") : null);
    } else {
      if (selectedItems.length >= max) return;
      const updated = [...selectedItems, item];
      onChange(updated.join(", "));
    }
  }

  function removeItem(item: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = selectedItems.filter((i) => i !== item);
    onChange(updated.length > 0 ? updated.join(", ") : null);
  }

  const isMaxReached = selectedItems.length >= max;

  if (!category) return null;

  return (
    <div className="relative w-full space-y-2" ref={containerRef}>
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
          <span>{label || `Sub-types (${category})`}</span>
        </label>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all shrink-0 ${
            isMaxReached
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-purple-50 text-purple-700 border-purple-200"
          }`}
        >
          Max {max} selected ({selectedItems.length}/{max})
        </span>
      </div>

      {/* Select Trigger Box & Interactive Chips */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs transition-all hover:border-slate-300">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border bg-slate-50/80 px-3.5 py-2 text-left transition-all focus:outline-none ${
            isOpen
              ? "border-purple-600 bg-white ring-4 ring-purple-100"
              : "border-slate-200 hover:border-purple-300 hover:bg-white"
          }`}
        >
          <span className="text-xs font-medium text-slate-500">
            {selectedItems.length === 0
              ? `Select sub-types (max ${max})...`
              : `${selectedItems.length} of ${max} selected`}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? "rotate-180 text-purple-600" : ""
            }`}
          />
        </button>

        {/* Selected Items Badges */}
        {selectedItems.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 pt-0.5">
            {selectedItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 text-white px-3 py-1 text-xs font-bold shadow-2xs animate-fade-in"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={(e) => removeItem(item, e)}
                  className="rounded-full p-0.5 hover:bg-purple-700 active:scale-90 transition-all text-white/80 hover:text-white"
                  title="Remove"
                >
                  <X className="h-3 w-3 stroke-[3]" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 slide-in-from-top-2">
          {/* Search Box */}
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sub-types..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
              autoFocus
            />
          </div>

          {/* Max Reached Alert Banner */}
          {isMaxReached && (
            <div className="mb-2 mx-1 flex items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 border border-amber-200">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>Max {max} sub-types selected. Deselect one to add another.</span>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No sub-types found matching &quot;{search}&quot;
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedItems.includes(item);
                const isDisabled = !isSelected && isMaxReached;

                return (
                  <button
                    key={item}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleItem(item)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all ${
                      isSelected
                        ? "bg-purple-50 text-purple-700 font-extrabold"
                        : isDisabled
                        ? "opacity-40 cursor-not-allowed text-slate-400 bg-slate-50/50"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-md border transition-all ${
                          isSelected
                            ? "border-purple-600 bg-purple-600 text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span>{item}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
