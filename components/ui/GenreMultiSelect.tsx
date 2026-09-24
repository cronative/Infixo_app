"use client";

import { useState } from "react";
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

const COLLAPSED_COUNT = 12;

export function GenreMultiSelect({ value, onChange, max = 5 }: GenreMultiSelectProps) {
  const [showAll, setShowAll] = useState(false);
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

  // Collapsed: the most common genres plus anything already selected (so selections never hide).
  const visibleGenres = showAll
    ? ALL_SERIES_GENRES
    : ALL_SERIES_GENRES.filter((g, i) => i < COLLAPSED_COUNT || selectedGenres.includes(g));
  const hiddenCount = ALL_SERIES_GENRES.length - visibleGenres.length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-[#0f172a]">
          <Tag className="h-3.5 w-3.5 text-[#94a3b8]" />
          Genres
        </p>
        <span className={`text-xs ${selectedGenres.length >= max ? "font-semibold text-[#B7791F]" : "text-[#64748b]"}`}>
          {selectedGenres.length} / {max} selected
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {visibleGenres.map((g) => {
          const isSelected = selectedGenres.includes(g);
          const isMaxReached = !isSelected && selectedGenres.length >= max;

          return (
            <button
              key={g}
              type="button"
              disabled={isMaxReached}
              aria-pressed={isSelected}
              onClick={() => toggleGenre(g)}
              className={`tap-scale inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] transition-colors cursor-pointer shrink-0 ${isSelected
                ? "border-[#043084] bg-[#043084]/[0.06] font-medium text-[#043084]"
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
        {(hiddenCount > 0 || showAll) && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium text-[#043084] hover:bg-[#043084]/[0.06] cursor-pointer"
          >
            {showAll ? "Show fewer" : `+${hiddenCount} more`}
          </button>
        )}
      </div>
    </div>
  );
}
