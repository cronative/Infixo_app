"use client";

import { useState, useMemo } from "react";
import {
  Check,
  Tag,
  Search,
  X,
  Video,
  Compass,
  Utensils,
  Zap,
  Tv,
  Laugh,
  Heart,
  ShieldAlert,
  Film,
  Music,
  GraduationCap,
  Sparkles,
  Gamepad2,
  Sun,
  Landmark,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";
import {
  GENRE_GROUPS,
  ALL_SERIES_GENRES,
  GenreGroup,
  GenreItem,
} from "@/lib/seriesGenres";

// Re-export constants for backwards compatibility
export { ALL_SERIES_GENRES, GENRE_GROUPS } from "@/lib/seriesGenres";

const GROUP_ICONS: Record<string, LucideIcon> = {
  "vlogs-life": Video,
  "travel-adventure": Compass,
  food: Utensils,
  "challenges-experiments": Zap,
  "shows-formats": Tv,
  comedy: Laugh,
  "bollywood-style-stories": Heart,
  "thriller-action-more": ShieldAlert,
  "web-series-films": Film,
  "music-performance": Music,
  learning: GraduationCap,
  "lifestyle-hobbies": Sparkles,
  "sports-gaming": Gamepad2,
  "culture-spiritual": Sun,
  "real-india": Landmark,
  "other-group": MoreHorizontal,
};

function matchesGenre(item: GenreItem, groupName: string, query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (item.name.toLowerCase().includes(q)) return true;
  if (item.slug.toLowerCase().includes(q)) return true;
  if (groupName.toLowerCase().includes(q)) return true;
  return item.aliases.some(
    (alias) => alias.toLowerCase().includes(q) || q.includes(alias.toLowerCase())
  );
}

interface GenreMultiSelectProps {
  value: string; // comma-separated
  onChange: (value: string) => void;
  max?: number;
  error?: string | null;
}

export function GenreMultiSelect({
  value,
  onChange,
  max = 3,
  error,
}: GenreMultiSelectProps) {
  const [search, setSearch] = useState("");
  const totalGenres = ALL_SERIES_GENRES.length;

  const selectedGenres = useMemo(() => {
    return value
      ? value
          .split(/[,•|/]/)
          .map((g) => g.trim().replace(/^Genre:\s*/i, ""))
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

  // Filter groups and their genres live
  const filteredGroups = useMemo(() => {
    const q = search.trim();
    if (!q) {
      return GENRE_GROUPS;
    }

    const result: GenreGroup[] = [];
    for (const group of GENRE_GROUPS) {
      const matchingGenres = group.genres.filter((item) =>
        matchesGenre(item, group.name, q)
      );
      if (matchingGenres.length > 0) {
        result.push({
          ...group,
          genres: matchingGenres,
        });
      }
    }
    return result;
  }, [search]);

  return (
    <div className="w-full space-y-2 text-left">
      {/* Header: Genres * · {selected}/3 selected · {TOTAL} genres */}
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

      {/* Main Container with Sticky Search Bar and Scrollable Groups */}
      <div
        className={`rounded-[6px] border ${
          error ? "border-rose-400 bg-rose-50/10" : "border-[#e2e8f0]"
        } bg-white overflow-hidden shadow-2xs`}
      >
        {/* Sticky search on top */}
        <div className="sticky top-0 z-10 border-b border-[#f1f5f9] bg-white p-2 sm:p-2.5">
          <div className="flex items-center rounded-[5px] border border-[#e2e8f0] bg-[#f8fafc] focus-within:bg-white focus-within:border-[#7A2253] focus-within:ring-2 focus-within:ring-[#7A2253]/10 overflow-hidden transition-colors">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border-r border-[#e2e8f0] bg-white text-[#64748b]">
              <Search className="h-3.5 w-3.5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${totalGenres} genres…`}
              className="h-8 flex-1 min-w-0 bg-transparent px-2.5 text-xs text-[#0f172a] placeholder:text-[#94a3b8] outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="pr-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Clear genre search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable area: max-height ~360px desktop / ~300px mobile */}
        <div className="max-h-[300px] sm:max-h-[360px] overflow-y-auto p-2.5 sm:p-3 space-y-4">
          {filteredGroups.map((group) => {
            const IconComponent = GROUP_ICONS[group.slug] || Tag;

            return (
              <div key={group.slug} className="space-y-1.5">
                {/* Small group label: icon + name, muted, uppercase-ish */}
                <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-[#64748b]">
                  <IconComponent className="h-3 w-3 text-[#94a3b8] shrink-0" />
                  <span>{group.name}</span>
                </div>

                {/* Chips in current chip layout/style */}
                <div className="flex flex-wrap gap-1.5">
                  {group.genres.map((item) => {
                    const g = item.name;
                    const isSelected = selectedGenres.includes(g);
                    const isMaxReached = !isSelected && selectedGenres.length >= max;

                    return (
                      <button
                        key={item.slug}
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
                </div>
              </div>
            );
          })}

          {filteredGroups.length === 0 && (
            <p className="text-xs text-[#94a3b8] py-6 text-center">
              No matching genres found for &ldquo;{search}&rdquo;.
            </p>
          )}
        </div>
      </div>

      {/* Error if 0 */}
      {error && (
        <p className="text-xs text-rose-500 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}
