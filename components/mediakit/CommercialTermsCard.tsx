"use client";

import { useEffect, useState } from "react";
import { IndianRupee, Plus, X } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import type { BarterPolicy, CommercialTerms } from "@/types";

const PAYMENT_PRESETS = [
  "50% advance, 50% after posting",
  "100% advance",
  "Full payment after posting",
  "Within 15 days of invoice",
  "Within 30 days of invoice",
];

/** Extras Indian brands ask for most often (creator sets the price). */
const ADD_ON_SUGGESTIONS = [
  "Usage rights for ads (30 days)",
  "Exclusivity: no competitor (30 days)",
  "Link in bio (7 days)",
  "Raw footage",
  "Extra revision",
  "Regional language version",
];

const BARTER_OPTIONS: { value: BarterPolicy; label: string }[] = [
  { value: "no", label: "Paid only" },
  { value: "yes", label: "Barter OK" },
  { value: "hybrid", label: "Paid + barter" },
];

const GSTIN_RE = /^[0-9]{2}[A-Z0-9]{13}$/;
const input =
  "h-9 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-[13px] text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#C21B5C] focus:outline-none";
const label = "block text-[12px] font-semibold text-[#18181B]";

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[#18181B]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#C21B5C]" />
      {children}
    </label>
  );
}

/**
 * Dashboard editor for the India-specific commercial terms shown on the media kit and PDF:
 * GST, payment terms, barter policy and priced add-ons.
 */
export function CommercialTermsCard({
  value,
  onSave,
}: {
  value?: CommercialTerms;
  onSave: (terms: CommercialTerms) => Promise<void>;
}) {
  const [gstRegistered, setGstRegistered] = useState(false);
  const [gstin, setGstin] = useState("");
  const [pricesPlusGst, setPricesPlusGst] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [barter, setBarter] = useState<BarterPolicy | "">("");
  const [barterMinValue, setBarterMinValue] = useState("");
  const [addOns, setAddOns] = useState<{ label: string; price: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // Load saved terms (they arrive after the page fetches settings).
  useEffect(() => {
    setGstRegistered(Boolean(value?.gstRegistered));
    setGstin(value?.gstin || "");
    setPricesPlusGst(Boolean(value?.pricesPlusGst));
    setPaymentTerms(value?.paymentTerms || "");
    setBarter(value?.barter || "");
    setBarterMinValue(value?.barterMinValue || "");
    setAddOns(value?.addOns || []);
  }, [value]);

  const gstinClean = gstin.trim().toUpperCase();
  const gstinInvalid = gstRegistered && gstinClean.length > 0 && !GSTIN_RE.test(gstinClean);
  const unusedSuggestions = ADD_ON_SUGGESTIONS.filter((s) => !addOns.some((a) => a.label === s));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gstinInvalid) return;
    setSaving(true);
    try {
      await onSave({
        gstRegistered,
        gstin: gstRegistered && gstinClean ? gstinClean : undefined,
        pricesPlusGst,
        paymentTerms: paymentTerms.trim() || undefined,
        barter: barter || undefined,
        barterMinValue: barter && barter !== "no" ? barterMinValue.trim() || undefined : undefined,
        addOns: addOns.map((a) => ({ label: a.label.trim(), price: a.price.trim() })).filter((a) => a.label).slice(0, 6),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title="Rates, GST & payment"
      subtitle="The terms Indian brands and agencies ask first. Shown on your public media kit and PDF."
      icon={<IndianRupee className="h-4 w-4" />}
    >
      <form onSubmit={submit} className="space-y-5">
        {/* GST */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Toggle checked={gstRegistered} onChange={setGstRegistered}>GST registered</Toggle>
            {gstRegistered && (
              <div className="space-y-1">
                <label className={label} htmlFor="mk-gstin">GSTIN <span className="font-normal text-[#6B6B76]">(optional, shown to brands)</span></label>
                <input
                  id="mk-gstin"
                  value={gstin}
                  maxLength={15}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  aria-invalid={gstinInvalid}
                  className={`${input} w-full font-mono uppercase ${gstinInvalid ? "border-[#C2414B]" : ""}`}
                />
                {gstinInvalid && <p className="text-[12px] text-[#C2414B]">GSTIN is 15 characters, e.g. 22AAAAA0000A1Z5.</p>}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Toggle checked={pricesPlusGst} onChange={setPricesPlusGst}>Package prices are + 18% GST</Toggle>
            <p className="text-[12px] text-[#6B6B76]">Brands see “+ GST” next to every package price.</p>
          </div>
        </div>

        {/* Payment terms */}
        <div className="space-y-1.5">
          <label className={label} htmlFor="mk-payment">Payment terms</label>
          <input
            id="mk-payment"
            value={paymentTerms}
            maxLength={120}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder="e.g. 50% advance, 50% after posting"
            className={`${input} w-full`}
          />
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPaymentTerms(p)}
                className={`rounded-[5px] border px-2 py-1 text-[12px] font-medium transition-colors cursor-pointer ${
                  paymentTerms === p ? "border-[#C21B5C] bg-[#FFEDE6] text-[#C21B5C]" : "border-[#ECECF0] bg-white text-[#52525B] hover:bg-[#FAFAFB]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Barter */}
        <div className="space-y-1.5">
          <span className={label}>Barter / product collabs</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] p-0.5">
              {BARTER_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={barter === o.value}
                  onClick={() => setBarter(barter === o.value ? "" : o.value)}
                  className={`h-8 rounded-[5px] px-3 text-[12px] font-semibold transition-colors cursor-pointer ${
                    barter === o.value ? "bg-[#C21B5C] text-white" : "text-[#52525B] hover:text-[#18181B]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {barter && barter !== "no" && (
              <input
                value={barterMinValue}
                maxLength={30}
                onChange={(e) => setBarterMinValue(e.target.value)}
                placeholder="Min product value, e.g. ₹5,000"
                aria-label="Minimum product value for barter"
                className={`${input} w-full max-w-[240px]`}
              />
            )}
          </div>
        </div>

        {/* Add-ons */}
        <div className="space-y-2">
          <span className={label}>Add-ons <span className="font-normal text-[#6B6B76]">(up to 6, priced extras on any package)</span></span>
          {addOns.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={a.label}
                maxLength={60}
                onChange={(e) => setAddOns(addOns.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                placeholder="Add-on"
                aria-label={`Add-on ${i + 1}`}
                className={`${input} min-w-0 flex-1`}
              />
              <input
                value={a.price}
                maxLength={30}
                onChange={(e) => setAddOns(addOns.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                placeholder="₹ price"
                aria-label={`Price for add-on ${i + 1}`}
                className={`${input} w-28 shrink-0`}
              />
              <button
                type="button"
                onClick={() => setAddOns(addOns.filter((_, j) => j !== i))}
                aria-label={`Remove add-on ${i + 1}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] border border-[#ECECF0] text-[#6B6B76] hover:text-[#C2414B] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {addOns.length < 6 && (
            <div className="flex flex-wrap gap-1.5">
              {unusedSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAddOns([...addOns, { label: s, price: "" }])}
                  className="inline-flex items-center gap-1 rounded-[5px] border border-dashed border-[#D4D4D8] px-2 py-1 text-[12px] font-medium text-[#52525B] hover:border-[#C21B5C] hover:text-[#C21B5C] cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAddOns([...addOns, { label: "", price: "" }])}
                className="inline-flex items-center gap-1 rounded-[5px] border border-dashed border-[#D4D4D8] px-2 py-1 text-[12px] font-medium text-[#52525B] hover:border-[#C21B5C] hover:text-[#C21B5C] cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Custom
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-[#F4F4F5] pt-2">
          <button type="submit" disabled={saving || gstinInvalid} className="dash-btn-primary disabled:opacity-60">
            <span>{saving ? "Saving..." : "Save terms"}</span>
          </button>
        </div>
      </form>
    </SectionCard>
  );
}
