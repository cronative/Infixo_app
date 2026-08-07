"use client";

import { useState, useMemo } from "react";
import { Search, MapPin, X, Check, Globe, Building, Navigation } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 animate-slide-up flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 font-bold">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Select Location</h3>
              <p className="text-xs text-slate-500 font-medium">Search city, state & country</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector: Quick Search vs Custom Location Entry */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 px-6 gap-2">
          <button
            type="button"
            onClick={() => setMode("search")}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
              mode === "search"
                ? "bg-white text-purple-700 shadow-2xs border border-purple-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🔍 Search Popular Cities
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
              mode === "custom"
                ? "bg-white text-purple-700 shadow-2xs border border-purple-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ✍️ Type Custom Location
          </button>
        </div>

        {/* Content Body */}
        {mode === "search" ? (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto no-scrollbar">
            {/* Search Input Field */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search city, state, or country..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Results List */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                {query ? `Matching Results (${filteredLocations.length})` : "Popular Locations"}
              </p>

              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    className="w-full flex items-center justify-between rounded-2xl p-3 text-left border border-slate-100 bg-white hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <Building className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {loc.city}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {loc.state}, {loc.country}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Select →
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-700">No matching location found</p>
                  <p className="text-xs text-slate-500">
                    Try switching to the <b>Custom Location</b> tab above to enter your exact city!
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setMode("custom")}>
                    Type Custom Location
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <p className="text-xs text-slate-500 font-medium">
              Enter your exact City, State, and Country below:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Surat, Austin, Kyoto"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State / Region (Optional)</label>
                <div className="relative">
                  <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. Gujarat, California"
                    value={customState}
                    onChange={(e) => setCustomState(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Country *</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. India, United States, Japan"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <Button fullWidth onClick={handleSaveCustom} disabled={!customCity.trim() || !customCountry.trim()}>
                Save Location
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
