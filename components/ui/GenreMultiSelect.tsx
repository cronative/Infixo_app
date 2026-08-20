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
        <label className="block text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-[#803D63]" />
          Series Genres
        </label>
        <span className={`text-xs font-semibold ${selectedGenres.length >= max ? "text-amber-600 font-bold" : "text-slate-400"}`}>
          {selectedGenres.length} / {max} selected
        </span>
      </div>

      {/* Direct Interactive Chips List */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-indigo-100 bg-slate-50/60 p-3 max-h-48 overflow-y-auto">
        {ALL_SERIES_GENRES.map((g) => {
          const isSelected = selectedGenres.includes(g);
          const isMaxReached = !isSelected && selectedGenres.length >= max;

          return (
            <button
              key={g}
              type="button"
              disabled={isMaxReached}
              onClick={() => toggleGenre(g)}
              className={`tap-scale flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#F6EBF1] text-[#803D63] border border-[#803D63] font-semibold shadow-2xs"
                  : isMaxReached
                  ? "opacity-40 cursor-not-allowed bg-white border border-slate-200 text-slate-400"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-[#803D63]"
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="h-3 w-3 stroke-[3] text-[#803D63] shrink-0" />
                  <span>{g}</span>
                </>
              ) : (
                <>
                  <span className="text-slate-400 text-xs leading-none">+</span>
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
