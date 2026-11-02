"use client";

import { useState, useMemo } from "react";
import { Check, Tag, Search, X } from "lucide-react";

export const POPULAR_GENRES = [
  "Vlogs",
  "Travel",
  "Food & Cooking",
  "Comedy",
  "Tech & Gadgets",
  "Fitness",
  "Gaming",
  "Entertainment",
  "Lifestyle",
  "Drama",
  "Romance",
  "Education",
];

export const ALL_SERIES_GENRES = [
  "Vlogs",
  "Daily Vlogs",
  "Travel",
  "Travel Vlogs",
  "Food",
  "Food & Cooking",
  "Street Food",
  "Moto Vlogging",
  "Family Vlogs",
  "Road Trips",
  "Lifestyle",
  "Comedy",
  "Comedy & Sketches",
  "Tech & Gadgets",
  "Fitness",
  "Fitness & Health",
  "Gaming",
  "Podcast & Talk Shows",
  "Entertainment",
  "Documentary",
  "Drama",
  "Romance",
  "Action",
  "Adventure",
  "Horror",
  "Thriller",
  "Suspense",
  "Mystery",
  "Crime",
  "Sci-Fi",
  "Animation",
  "Education",
  "Finance & Business",
  "Music & Dance",
  "Sports",
  "Other",
];

interface GenreMultiSelectProps {
  value: string; // comma-separated or single string
  onChange: (value: string) => void;
  max?: number;
  error?: string | null;
}

export function GenreMultiSelect({ value, onChange, max = 3, error }: GenreMultiSelectProps) {
  const [search, setSearch] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const totalGenres = ALL_SERIES_GENRES.length;

  const selectedGenres = useMemo(() => {
    return value
      ? value
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
      : [];
  }, [value]);

  function toggleGenre(genre: string) {
    if (selectedGenres.includes(genre)) {
      const updated = selectedGenres.filter((g) => g !== genre);
      onChange(updated.join(", "));
    } else {
      if (selectedGenres.length >= max) {
        return;
      }
      const updated = [...selectedGenres, genre];
      onChange(updated.join(", "));
    }
  }

  const filteredGenres = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      if (isExpanded) {
        return ALL_SERIES_GENRES;
      }
      // Show top 12 chips plus any currently selected that aren't in top 12
      const top12 = POPULAR_GENRES.slice(0, 12);
      const base = [...top12];
      for (const sel of selectedGenres) {
        if (!base.includes(sel)) base.push(sel);
      }
      return base;
    }
    return ALL_SERIES_GENRES.filter((g) => g.toLowerCase().includes(q));
  }, [search, selectedGenres, isExpanded]);

  return (
    <div className="w-full space-y-2 text-left">
      {/* Header: Genres * · 0/3 selected · {TOTAL} genres */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0f172a]">
          <Tag className="h-3.5 w-3.5 text-[#94a3b8]" />
          <span>Genres</span>
          <span className="text-rose-500">*</span>
          <span className="text-[11px] font-normal text-[#64748b]">
            · {selectedGenres.length}/{max} selected · {totalGenres} genres
          </span>
        </label>
      </div>

      {/* Search Input */}
      <div
        className={`flex items-center rounded-[5px] border ${
          error ? "border-rose-400 bg-rose-50/10" : "border-[#e2e8f0]"
        } bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
          <Search className="h-3.5 w-3.5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${totalGenres} genres…`}
          className="h-9 flex-1 min-w-0 bg-transparent px-3 text-xs text-[#0f172a] placeholder:text-[#94a3b8] outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="pr-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            aria-label="Clear genre search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Genre Chips */}
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-0.5">
        {filteredGenres.map((g) => {
          const isSelected = selectedGenres.includes(g);
          const isMaxReached = !isSelected && selectedGenres.length >= max;

          return (
            <button
              key={g}
              type="button"
              disabled={isMaxReached}
              aria-pressed={isSelected}
              onClick={() => toggleGenre(g)}
              className={`inline-flex h-7 items-center gap-1 rounded-[5px] border px-2.5 text-xs transition-colors cursor-pointer shrink-0 ${
                isSelected
                  ? "border-[#7A2253] bg-[#7A2253]/[0.08] font-semibold text-[#7A2253]"
                  : isMaxReached
                  ? "opacity-40 cursor-not-allowed border-[#e2e8f0] bg-white text-[#64748b]"
                  : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:text-[#0f172a]"
              }`}
            >
              {isSelected && <Check className="h-3 w-3 stroke-[3] shrink-0" />}
              <span>{g}</span>
            </button>
          );
        })}
        {filteredGenres.length === 0 && (
          <p className="text-xs text-[#94a3b8] py-1 px-1">No matching genres found.</p>
        )}
      </div>

      {/* Show all {TOTAL} toggle */}
      {!search && (
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11.5px] font-semibold text-[#7A2253] hover:underline cursor-pointer"
          >
            {isExpanded ? "Show fewer genres" : `Show all ${totalGenres} genres`}
          </button>
        </div>
      )}

      {/* Error if 0 */}
      {error && (
        <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}
