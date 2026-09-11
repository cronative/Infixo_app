"use client";

import { Check, Tag } from "lucide-react";

export const ALL_SERIES_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Love",
  "Romance",
  "Romantic Comedy",
  "Romantic Drama",
  "Horror",
  "Thriller",
  "Suspense",
  "Mystery",
  "Crime",
  "Sci-Fi",
  "Fantasy",
  "Supernatural",
  "Psychological",
  "Emotional",
  "Family",
  "Friendship",
  "Kids",
  "Animation",
  "Documentary",
  "Biography",
  "History",
  "Mythology",
  "Spiritual",
  "Musical",
  "Sports",
  "Reality",
  "Slice of Life",
  "Survival",
  "Personal Vlogs",
  "Daily Life",
  "Lifestyle",
  "Travel Diaries",
  "Behind the Scenes",
  "Other",
];

interface GenreMultiSelectProps {
  value: string; // comma-separated or single string
  onChange: (value: string) => void;
  max?: number;
}

export function GenreMultiSelect({ value, onChange, max = 5 }: GenreMultiSelectProps) {
  // Parse existing selected genres
  const selectedGenres = value
    ? value
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean)
    : [];

  function toggleGenre(genre: string) {
    if (selectedGenres.includes(genre)) {
      const updated = selectedGenres.filter((g) => g !== genre);
      onChange(updated.join(", "));
    } else {
      if (selectedGenres.length >= max) {
        return; // limit to max (5)
      }
      const updated = [...selectedGenres, genre];
      onChange(updated.join(", "));
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-bold text-[#151933] flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-[#151933]" />
          Series Genres
        </label>
        <span className={`text-xs font-semibold ${selectedGenres.length >= max ? "text-[#B7791F] font-bold" : "text-[#64748b]"}`}>
          {selectedGenres.length} / {max} selected
        </span>
      </div>

      {/* Direct Interactive Chips List (Natural Expansion, No Clipping) */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
        {ALL_SERIES_GENRES.map((g) => {
          const isSelected = selectedGenres.includes(g);
          const isMaxReached = !isSelected && selectedGenres.length >= max;

          return (
            <button
              key={g}
              type="button"
              disabled={isMaxReached}
              onClick={() => toggleGenre(g)}
              className={`tap-scale flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer shrink-0 ${isSelected
                ? "bg-[#151933]/[0.09] text-[#151933] border border-[#151933] font-bold shadow-xs"
                : isMaxReached
                  ? "opacity-40 cursor-not-allowed bg-white border border-[#e2e8f0] text-[#64748b]"
                  : "bg-white border border-[#e2e8f0] text-[#475569] hover:border-[#cbd5e1] hover:bg-[#f1f5f9] hover:text-[#151933]"
                }`}
            >
              {isSelected ? (
                <>
                  <Check className="h-3 w-3 stroke-[3] text-[#151933] shrink-0" />
                  <span>{g}</span>
                </>
              ) : (
                <>
                  <span className="text-[#64748b] text-xs leading-none">+</span>
                  <span>{g}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
