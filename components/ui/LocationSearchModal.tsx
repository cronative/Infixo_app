"use client";

import { useState, useMemo } from "react";
import { Search, MapPin, Building, Navigation, Globe } from "lucide-react";
import { Modal, ModalBody } from "@/components/ui/Modal";

export interface LocationData {
  city: string;
  state: string;
  country: string;
}

const POPULAR_LOCATIONS: LocationData[] = [
  { city: "Mumbai", state: "Maharashtra", country: "India" },
  { city: "Delhi", state: "Delhi", country: "India" },
  { city: "Bengaluru", state: "Karnataka", country: "India" },
  { city: "Hyderabad", state: "Telangana", country: "India" },
  { city: "Pune", state: "Maharashtra", country: "India" },
  { city: "Ahmedabad", state: "Gujarat", country: "India" },
  { city: "Jaipur", state: "Rajasthan", country: "India" },
  { city: "Surat", state: "Gujarat", country: "India" },
  { city: "Kolkata", state: "West Bengal", country: "India" },
  { city: "Chennai", state: "Tamil Nadu", country: "India" },
  { city: "Lucknow", state: "Uttar Pradesh", country: "India" },
  { city: "Chandigarh", state: "Punjab", country: "India" },
  { city: "Indore", state: "Madhya Pradesh", country: "India" },
  { city: "Nagpur", state: "Maharashtra", country: "India" },
  { city: "Kochi", state: "Kerala", country: "India" },
  { city: "Goa", state: "Goa", country: "India" },
  { city: "Dehradun", state: "Uttarakhand", country: "India" },
  { city: "New York", state: "New York", country: "United States" },
  { city: "Los Angeles", state: "California", country: "United States" },
  { city: "San Francisco", state: "California", country: "United States" },
  { city: "London", state: "England", country: "United Kingdom" },
  { city: "Toronto", state: "Ontario", country: "Canada" },
  { city: "Dubai", state: "Dubai", country: "United Arab Emirates" },
  { city: "Singapore", state: "Central Region", country: "Singapore" },
  { city: "Sydney", state: "New South Wales", country: "Australia" },
];

export function LocationSearchModal({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocation,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: LocationData) => void;
  initialLocation?: LocationData;
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"search" | "custom">("search");
  
  const [customCity, setCustomCity] = useState(initialLocation?.city || "");
  const [customState, setCustomState] = useState(initialLocation?.state || "");
  const [customCountry, setCustomCountry] = useState(initialLocation?.country || "India");

  const filteredLocations = useMemo(() => {
    if (!query.trim()) return POPULAR_LOCATIONS;
    const q = query.toLowerCase().trim();
    return POPULAR_LOCATIONS.filter(
      (loc) =>
        loc.city.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q)
    );
  }, [query]);

  function handleSelect(loc: LocationData) {
    onSelectLocation(loc);
    onClose();
  }

  function handleSaveCustom() {
    if (!customCity.trim() || !customCountry.trim()) return;
    onSelectLocation({
      city: customCity.trim(),
      state: customState.trim(),
      country: customCountry.trim(),
    });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Select Location"
      description="Search city, state & country for your creator profile"
      icon={<MapPin className="h-4 w-4" />}
    >
      {/* Mode Tabs */}
      <div className="flex border-b border-[#ECE8EB] bg-[#FAF8FA] p-1 px-4 gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            mode === "search"
              ? "bg-white text-[#803D63] shadow-2xs border border-[#ECE8EB]"
              : "text-[#6F6872] hover:text-[#17131A]"
          }`}
        >
          Search Cities
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            mode === "custom"
              ? "bg-white text-[#803D63] shadow-2xs border border-[#ECE8EB]"
              : "text-[#6F6872] hover:text-[#17131A]"
          }`}
        >
          Custom Location
        </button>
      </div>

      <ModalBody className="p-4 sm:p-5 space-y-4">
        {mode === "search" ? (
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6F6872]" />
              <input
                type="text"
                autoFocus
                placeholder="Search city, state, or country..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] py-2.5 pl-10 pr-4 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {/* Results List */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6F6872] mb-1.5 text-left">
                {query ? `Matching Results (${filteredLocations.length})` : "Popular Locations"}
              </p>

              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    className="w-full flex items-center justify-between rounded-xl p-2.5 text-left border border-[#ECE8EB] bg-white hover:border-[#803D63]/30 hover:bg-[#FAF8FA] transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF8FA] text-[#6F6872] group-hover:bg-[#F7EDF3] group-hover:text-[#803D63] transition-colors shrink-0">
                        <Building className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#17131A] group-hover:text-[#803D63] transition-colors">
                          {loc.city}
                        </p>
                        <p className="text-[11px] text-[#6F6872] font-medium">
                          {loc.state}, {loc.country}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#803D63] opacity-0 group-hover:opacity-100 transition-opacity">
                      Select →
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs font-bold text-[#17131A]">No matching location found</p>
                  <p className="text-xs text-[#6F6872]">
                    Switch to the <b>Custom Location</b> tab above to enter your exact city.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 text-left">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#17131A]">City <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6F6872]" />
                <input
                  type="text"
                  placeholder="e.g. Surat, Austin, Kyoto"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] py-2.5 pl-10 pr-3.5 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#17131A]">State or Region <span className="text-[#6F6872] font-normal">(Optional)</span></label>
              <div className="relative">
                <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6F6872]" />
                <input
                  type="text"
                  placeholder="e.g. Gujarat, California"
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value)}
                  className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] py-2.5 pl-10 pr-3.5 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#17131A]">Country <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6F6872]" />
                <input
                  type="text"
                  placeholder="e.g. India, United States, Japan"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  className="w-full rounded-xl border border-[#ECE8EB] bg-[#FAF8FA] py-2.5 pl-10 pr-3.5 text-xs font-semibold text-[#17131A] placeholder:text-[#6F6872]/50 focus:border-[#803D63] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#ECE8EB] text-xs font-semibold text-[#6F6872] hover:bg-[#FAF8FA] hover:text-[#17131A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                disabled={!customCity.trim() || !customCountry.trim()}
                className="bg-[#803D63] hover:bg-[#6F3456] text-white font-semibold text-xs py-2 px-4.5 rounded-xl transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                Save Location
              </button>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
