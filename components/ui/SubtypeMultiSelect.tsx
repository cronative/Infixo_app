"use client";

import { Check, Sparkles } from "lucide-react";
import { getSubtypesForCategories } from "@/data/categories";

interface SubtypeMultiSelectProps {
  category: string | null; // Comma separated selected categories
  value: string | null; // Comma separated selected sub-types
  onChange: (value: string | null) => void;
  max?: number;
  label?: string;
}

export function SubtypeMultiSelect({
  category,
  value,
  onChange,
  max = 5,
  label = "Tell us more about your content",
}: SubtypeMultiSelectProps) {
  const selectedSubtypes = value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const availableSubtypes = getSubtypesForCategories(category);

  if (!category || availableSubtypes.length === 0) return null;

  function toggleSubtype(subtype: string) {
    if (selectedSubtypes.includes(subtype)) {
      const updated = selectedSubtypes.filter((s) => s !== subtype);
      onChange(updated.length > 0 ? updated.join(", ") : null);
    } else {
      if (selectedSubtypes.length >= max) return; // Max 5 limit
      const updated = [...selectedSubtypes, subtype];
      onChange(updated.join(", "));
    }
  }

  return (
    <div className="w-full space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#181716] flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#151933]" />
          <span>{label}</span>
        </label>
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all shrink-0 ${selectedSubtypes.length >= max
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-[#151933]/[0.08] text-[#151933] border-[#151933]/25"
            }`}
        >
          {selectedSubtypes.length} / {max} selected
        </span>
      </div>

      {/* Chips Container */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E7E3DC] bg-[#FAF8F5] p-3 max-h-48 overflow-y-auto">
        {availableSubtypes.map((st) => {
          const isSelected = selectedSubtypes.includes(st);
          const isMaxReached = !isSelected && selectedSubtypes.length >= max;

          return (
            <button
              key={st}
              type="button"
              disabled={isMaxReached}
              onClick={() => toggleSubtype(st)}
              className={`tap-scale flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${isSelected
                ? "bg-[#151933] text-white shadow-xs ring-2 ring-[#151933]/25"
                : isMaxReached
                  ? "opacity-40 cursor-not-allowed bg-white border border-[#E7E3DC] text-[#797570]"
                  : "bg-white border border-[#E7E3DC] text-[#54514D] hover:border-[#151933]/30 hover:text-[#151933]"
                }`}
            >
              {isSelected ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3] text-white shrink-0" />
                  <span>{st}</span>
                </>
              ) : (
                <>
                  <span className="text-slate-400 text-sm leading-none">+</span>
                  <span>{st}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
