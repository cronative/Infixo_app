"use client";

import { useState } from "react";
import { Check, ChevronDown, X, Tag } from "lucide-react";

export const ALL_SERIES_GENRES = [
  "Travel & Vlogs",
  "Technology & Gadgets",
  "Gaming & Esports",
  "Comedy & Satire",
  "Fashion & Beauty",
  "Lifestyle",
  "Education & Learning",
  "Business & Finance",
  "Fitness & Health",
  "Music & Audio",
  "Movies & Drama",
  "Food & Cooking",
  "Automotive & Cars",
  "Podcast & Talks",
  "Short Film",
  "Documentary",
  "Anime & Animation",
  "Science",
  "Art & Photography",
  "Sports & Outdoors",
  "Reality Show",
  "Action & Adventure",
  "Horror & Thriller",
  "Romance",
  "Sci-Fi & Fantasy",
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
        <label className="block text-sm font-bold text-inflixo-navy flex items-center gap-1.5">
          <Tag className="h-4 w-4 text-inflixo-purple" />
          Series Genres
        </label>
        <span className={`text-xs font-semibold ${selectedGenres.length >= max ? "text-amber-600 font-bold" : "text-muted"}`}>
          {selectedGenres.length} / {max} selected
        </span>
      </div>

      {/* Direct Interactive Chips List — No Dropdown Needed */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-inflixo-border bg-slate-50/60 p-3.5">
        {ALL_SERIES_GENRES.map((g) => {
          const isSelected = selectedGenres.includes(g);
          const isMaxReached = !isSelected && selectedGenres.length >= max;

          return (
            <button
              key={g}
              type="button"
              disabled={isMaxReached}
              onClick={() => toggleGenre(g)}
              className={`tap-scale flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                isSelected
                  ? "bg-inflixo-purple text-white shadow-sm ring-2 ring-inflixo-purple/30"
                  : isMaxReached
                  ? "opacity-40 cursor-not-allowed bg-white border border-slate-200 text-slate-400"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-inflixo-purple/40 hover:bg-purple-50/50 hover:text-inflixo-purple"
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="h-3.5 w-3.5 stroke-[3] text-white shrink-0" />
                  <span>{g}</span>
                </>
              ) : (
                <>
                  <span className="text-slate-400 font-normal">+</span>
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
