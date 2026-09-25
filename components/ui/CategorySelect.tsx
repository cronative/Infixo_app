"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, Tag, X } from "lucide-react";
import { CREATOR_TAXONOMY } from "@/data/categories";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";

interface CategorySelectProps {
  value: string | null; // Comma separated string e.g. "Food & Cooking, Travel"
  customValue?: string | null; // Custom category text if "Other" is selected
  onChange: (categoryString: string, customCategory?: string) => void;
  error?: string;
  max?: number;
}

export function CategorySelect({
  value,
  customValue = "",
  onChange,
  error,
  max = 3,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCategories = value
    ? value.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const selectedLabel = selectedCategories.length > 0
    ? selectedCategories.map((category) => category === "Other" && customValue ? customValue : category).join(", ")
    : "Select creator type";

  const filteredTaxonomy = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return CREATOR_TAXONOMY;

    return CREATOR_TAXONOMY
      .map((group) => ({
        ...group,
        subtypes: group.subtypes.filter((type) =>
          type.toLowerCase().includes(query) || group.category.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.subtypes.length > 0);
  }, [searchQuery]);

  function toggleCategory(catName: string) {
    let updated: string[];
    if (selectedCategories.includes(catName)) {
      updated = selectedCategories.filter((c) => c !== catName);
    } else {
      if (selectedCategories.length >= max) return; // Limit max 3
      updated = [...selectedCategories, catName];
    }
    onChange(updated.join(", "), "");
  }

  function removeCategory(catName: string) {
    const updated = selectedCategories.filter((c) => c !== catName);
    onChange(updated.join(", "), "");
  }

  function openPicker() {
    setIsOpen(true);
  }

  function closePicker() {
    setIsOpen(false);
    setSearchQuery("");
  }

  return (
    <div className="w-full space-y-1.5 text-left">
      <div className="flex items-center justify-between gap-1.5">
        <label className="text-xs font-semibold text-[#181716] flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-[#043084]" />
          <span>Creator type (profession/category) <span className="text-red-500">*</span></span>
        </label>
        <span className="bg-[#043084]/[0.06] text-[#043084] border border-[#043084]/15 text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0">
          {selectedCategories.length} / {max} selected
        </span>
      </div>

      {error && <p className="text-xs font-medium text-rose-500">{error}</p>}

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={openPicker}
          className={`flex h-10.5 sm:h-11 w-full items-center justify-between gap-2.5 rounded-xl border bg-white px-3 text-left shadow-xs transition-all cursor-pointer ${isOpen
            ? "border-[#043084] ring-2 ring-[#043084]/10"
            : error
              ? "border-rose-400"
              : "border-[#cbd5e1] hover:border-[#94a3b8]"
            }`}
          aria-expanded={isOpen}
        >
          <span className={`min-w-0 flex-1 truncate text-xs sm:text-sm font-semibold ${selectedCategories.length > 0 ? "text-[#043084]" : "text-[#94a3b8]"}`}>
            {selectedLabel}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[#64748b] transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {selectedCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => removeCategory(category)}
                className="inline-flex h-6.5 items-center gap-1.5 rounded-lg border border-[#dbe3ee] bg-[#f8fafc] px-2 text-[11px] font-semibold text-[#043084] transition-colors hover:border-[#cbd5e1] hover:bg-[#f1f5f9]"
              >
                <span>{category === "Other" && customValue ? customValue : category}</span>
                <X className="h-3 w-3 stroke-[2.5] text-[#64748b]" />
              </button>
            ))}
          </div>
        )}

        <Modal
          isOpen={isOpen}
          onClose={closePicker}
          size="xl"
          title="Choose creator type"
          description={`Select up to ${max} professions/types that best describe you.`}
          icon={<Tag className="h-4 w-4" />}
          className="max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none sm:max-w-3xl"
          headerClassName="px-4 py-3 sm:px-5"
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 sm:px-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search actor, singer, YouTuber, food reviewer..."
                  className="h-10 w-full rounded-xl border border-[#dbe3ee] bg-white pl-9 pr-3 text-sm font-medium text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#043084] focus:outline-none focus:ring-2 focus:ring-[#043084]/10"
                  autoFocus
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-[#475569]">
                  Tap selected type again to remove.
                </p>
                <span className="rounded-full border border-[#043084]/20 bg-[#043084]/[0.08] px-2.5 py-0.5 text-xs font-bold text-[#043084]">
                  {selectedCategories.length} / {max} selected
                </span>
              </div>
            </div>

            <ModalBody className="p-3 sm:p-4">
              {selectedCategories.length > 0 && (
                <div className="mb-3 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5">
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#64748b]">
                    Selected creator types
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => removeCategory(category)}
                        className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[#043084]/20 bg-white px-2.5 py-1 text-[11px] font-bold text-[#043084] transition-colors hover:bg-[#f1f5f9]"
                      >
                        <span>{category === "Other" && customValue ? customValue : category}</span>
                        <X className="h-3 w-3 stroke-[3] text-[#64748b]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredTaxonomy.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#cbd5e1] px-3 py-8 text-center text-xs font-semibold text-[#64748b]">
                  No creator types found.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTaxonomy.map((group) => (
                    <div key={group.category} className="rounded-xl border border-[#e2e8f0] bg-white p-2.5">
                      <div className="mb-2 flex items-center gap-2 px-1">
                        <span className="text-sm">{group.emoji}</span>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#64748b]">
                          {group.category}
                        </p>
                      </div>
                      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {group.subtypes.map((type) => {
                          const isSelected = selectedCategories.includes(type);
                          const isMaxReached = !isSelected && selectedCategories.length >= max;

                          return (
                            <button
                              key={`${group.category}-${type}`}
                              type="button"
                              disabled={isMaxReached}
                              onClick={() => toggleCategory(type)}
                              className={`flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all cursor-pointer ${isSelected
                                  ? "bg-[#043084] text-white shadow-xs"
                                  : isMaxReached
                                    ? "cursor-not-allowed opacity-35"
                                    : "bg-[#f8fafc] text-[#475569] hover:bg-[#f1f5f9] hover:text-[#043084]"
                                }`}
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${isSelected ? "border-white bg-white text-[#043084]" : "border-[#cbd5e1] bg-white"
                                  }`}
                              >
                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              </span>
                              <span className="min-w-0 flex-1 text-xs font-bold leading-snug">
                                {type}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ModalBody>

            <ModalFooter className="px-4 sm:px-5 py-2.5">
              <span className="mr-auto text-xs font-bold text-[#64748b]">
                {selectedCategories.length} / {max} selected
              </span>
              <button
                type="button"
                onClick={closePicker}
                className="rounded-xl bg-[#043084] px-5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:-translate-y-0.5 hover:bg-brand-hover"
              >
                Done
              </button>
            </ModalFooter>
          </div>
        </Modal>
      </div>
    </div>
  );
}
