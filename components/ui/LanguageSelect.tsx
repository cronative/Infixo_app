"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe, Search, Check } from "lucide-react";
import languagesData from "@/data/languages.json";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

interface LanguageSelectProps {
  label?: string;
  value: string;
  onChange: (languageName: string) => void;
  placeholder?: string;
  error?: string;
}

export function LanguageSelect({
  label = "Language",
  value,
  onChange,
  placeholder = "Select series language...",
  error,
}: LanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const languages: Language[] = languagesData;

  const filtered = languages.filter((l) => {
    const q = search.toLowerCase().trim();
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const selectedLang = languages.find(
    (l) => l.name.toLowerCase() === value.toLowerCase() || l.code.toLowerCase() === value.toLowerCase()
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

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-[13px] font-medium text-[#0f172a]">
          {label}
        </label>
      )}

      {/* Select Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-11 w-full items-center justify-between rounded-[5px] border bg-white px-4 text-left shadow-xs transition-all focus:outline-none ${
          isOpen
            ? "border-[#7A2253] ring-2 ring-[#7A2253]/10"
            : error
            ? "border-rose-400"
            : "border-[#e2e8f0] hover:border-[#7A2253]/40"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Globe className="h-4 w-4 text-[#7A2253] shrink-0" />
          {value ? (
            <span className="truncate text-sm font-medium text-[#0f172a]">
              {selectedLang ? `${selectedLang.name} (${selectedLang.nativeName})` : value}
            </span>
          ) : (
            <span className="text-sm text-[#94a3b8]">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-[#64748b] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {error && <p className="mt-1.5 text-xs font-medium text-rose-500">{error}</p>}

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 w-full overflow-hidden rounded-[5px] border border-[#e2e8f0] bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 slide-in-from-top-2">
          {/* Search Box */}
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#94a3b8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language..."
              className="h-9 w-full rounded-[5px] border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-medium text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#7A2253] focus:bg-white focus:outline-none"
              autoFocus
            />
          </div>

          {/* Languages List */}
          <div className="no-scrollbar max-h-52 overflow-y-auto space-y-0.5 pr-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#94a3b8]">No language found for &quot;{search}&quot;</div>
            ) : (
              filtered.map((l) => {
                const isSelected =
                  value.toLowerCase() === l.name.toLowerCase() ||
                  value.toLowerCase() === l.code.toLowerCase();
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      onChange(l.name);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between rounded-[5px] px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#FFF0F5] text-[#7A2253] font-bold"
                        : "text-[#0f172a] hover:bg-[#f1f5f9]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{l.name}</span>
                      <span className="text-[#94a3b8] font-normal">({l.nativeName})</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-[#7A2253] stroke-[3]" />}
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
