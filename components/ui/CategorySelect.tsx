"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Tag, Search, Check } from "lucide-react";
import { BROAD_CATEGORIES } from "@/data/categories";

export const CATEGORY_EMOJIS: Record<string, string> = {
  Gaming: "🎮",
  Technology: "💻",
  Entertainment: "🎬",
  Travel: "✈️",
  Food: "🍔",
  "Fashion & Beauty": "🎨",
  "Health & Fitness": "🏋️",
  "Business & Finance": "🚀",
  Music: "🎵",
  Education: "📚",
  Lifestyle: "🌿",
  Photography: "📸",
  News: "📰",
  Podcast: "🎙️",
  "Art & Creativity": "🎨",
  "Motivation & Self Growth": "🔥",
  Automobile: "🏎️",
  "Pets & Animals": "🐶",
  Parenting: "👶",
  Spirituality: "🕉️",
  Sports: "⚽",
};

interface CategorySelectProps {
  value: string | null;
  onChange: (category: string) => void;
  error?: string;
  label?: string;
}

export function CategorySelect({
  value,
  onChange,
  error,
  label = "Content Category",
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const categories = BROAD_CATEGORIES;

  const filtered = categories.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase().trim())
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

  const selectedEmoji = value ? CATEGORY_EMOJIS[value] || "✨" : "";

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-purple-600" />
          <span>{label}</span>
        </label>
        {error && <span className="text-xs font-bold text-rose-500">{error}</span>}
      </div>

      {/* Select Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-12 w-full items-center justify-between rounded-2xl border bg-white px-4 text-left shadow-2xs transition-all focus:outline-none ${
          isOpen
            ? "border-purple-600 ring-4 ring-purple-100"
            : error
            ? "border-rose-400"
            : "border-slate-200 hover:border-purple-300"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {value ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{selectedEmoji}</span>
              <span className="truncate text-sm font-bold text-slate-900">{value}</span>
            </div>
          ) : (
            <span className="text-sm text-slate-400">Select content category...</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-purple-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 slide-in-from-top-2">
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No categories found</div>
            ) : (
              filtered.map((cat) => {
                const isSelected = value === cat;
                const emoji = CATEGORY_EMOJIS[cat] || "✨";
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onChange(cat);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-all ${
                      isSelected
                        ? "bg-purple-50 text-purple-700 font-extrabold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{emoji}</span>
                      <span>{cat}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-purple-600 stroke-[3]" />}
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
