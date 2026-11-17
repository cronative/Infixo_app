"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Ban, BarChart3, Check, Handshake, HeartHandshake, Languages, MapPin, Pencil, Tag, User, X } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { MEDIAKIT_PROMISE_PRESETS, type MediaKitSettings } from "@/types";
import { CONTENT_LANGUAGES } from "@/lib/collabPackage";

const input =
  "h-10 w-full rounded-[5px] border border-[#ECECF0] bg-white px-3 text-[13px] text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none";
const label = "block text-[12px] font-semibold text-[#18181B]";
const muted = "text-[13px] text-[#A1A1AA]";

const toList = (v: string[] | string | undefined) =>
  (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter(Boolean);

export function EditButton({ onClick, label: text = "Edit" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-[12px] font-semibold text-[#7A2253] hover:bg-[#F7EEF2] cursor-pointer"
    >
      <Pencil className="h-3.5 w-3.5" />
      {text}
    </button>
  );
}

/** Label column + value column; stacks on phones. */
function InfoRow({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-[#F4F4F5] py-3 first:border-t-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-3">
      <span className="flex items-center gap-2 text-[13px] font-semibold text-[#18181B]">
        <span className="text-[#7A2253]">{icon}</span>
        {title}
      </span>
      <div className="min-w-0 text-[13px] leading-5 text-[#3F3F46]">{children}</div>
    </div>
  );
}

/** Chips with ✕ plus an input; Enter or comma adds. */
function TagInput({ value, onChange, max, placeholder, suggestions = [] }: { value: string[]; onChange: (v: string[]) => void; max: number; placeholder: string; suggestions?: string[] }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const parts = raw.split(",").map((x) => x.trim().slice(0, 40)).filter(Boolean);
    const next = [...value];
    parts.forEach((p) => {
      if (next.length < max && !next.some((x) => x.toLowerCase() === p.toLowerCase())) next.push(p);
    });
    onChange(next);
    setDraft("");
  };
  const unused = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[5px] border border-[#ECECF0] bg-white px-2 py-1.5 focus-within:border-[#7A2253]">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-[5px] bg-[#F7EEF2] px-2 py-1 text-[12px] font-semibold text-[#7A2253]">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="cursor-pointer text-[#7A2253]/70 hover:text-[#7A2253]">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {value.length < max && (
          <input
            value={draft}
            onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (draft.trim()) add(draft);
              } else if (e.key === "Backspace" && !draft && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            onBlur={() => draft.trim() && add(draft)}
            placeholder={value.length ? "Add more…" : placeholder}
            className="h-7 min-w-[120px] flex-1 bg-transparent px-1 text-[13px] text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none"
          />
        )}
      </div>
      {value.length < max && unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unused.slice(0, 8).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-[5px] border border-dashed border-[#D4D4D8] px-2 py-0.5 text-[12px] font-medium text-[#52525B] hover:border-[#7A2253] hover:text-[#7A2253] cursor-pointer">
              + {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-[#A1A1AA]">Up to {max}. Press Enter or comma to add.</p>
    </div>
  );
}

function SaveFooter({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <ModalFooter className="px-4 py-3 sm:px-5">
      <button type="button" onClick={onCancel} className="h-10 rounded-[5px] border border-[#ECECF0] bg-white px-4 text-[12px] font-semibold text-[#6B6B76] hover:bg-[#F4F4F5] cursor-pointer">
        Cancel
      </button>
      <button type="submit" disabled={saving} className="h-10 rounded-[5px] bg-[#7A2253] px-5 text-[12px] font-semibold text-white hover:opacity-95 cursor-pointer disabled:opacity-60">
        {saving ? "Saving…" : "Save"}
      </button>
    </ModalFooter>
  );
}

type SaveFn = (patch: Partial<MediaKitSettings>, toast: string) => Promise<void>;

// ── About Me for Brands ────────────────────────────────────────

const NICHE_SUGGESTIONS = ["Food", "Cafe Hopping", "Local Discovery", "Travel", "Lifestyle", "Fashion", "Beauty", "Tech", "Fitness", "Comedy"];

export function AboutBrandsCard({ settings, defaultLocation, defaultSignature, onSave }: { settings: MediaKitSettings; defaultLocation?: string; defaultSignature?: string; onSave: SaveFn }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [intro, setIntro] = useState("");
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [niche, setNiche] = useState<string[]>([]);
  const [audience, setAudience] = useState("");
  const [nowMaking, setNowMaking] = useState("");
  const [availability, setAvailability] = useState<"open" | "busy">("open");
  const [replyTime, setReplyTime] = useState("");
  const [signature, setSignature] = useState("");

  const languagesList = toList(settings.contentLanguages);
  const nicheList = toList(settings.categories);
  const shownLocation = settings.location || defaultLocation || "";

  useEffect(() => {
    if (!open) return;
    setIntro(settings.intro || "");
    setLocation(settings.location || defaultLocation || "");
    setLanguages(toList(settings.contentLanguages));
    setNiche(toList(settings.categories));
    setAudience(settings.audienceDesc || "");
    setNowMaking(settings.nowMaking || "");
    setAvailability(settings.availability === "busy" ? "busy" : "open");
    setReplyTime(settings.replyTime || "Within 24h");
    setSignature(settings.signatureName || defaultSignature || "");
  }, [open, settings, defaultLocation, defaultSignature]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(
        {
          intro: intro.trim().slice(0, 300),
          location: location.trim().slice(0, 120),
          contentLanguages: languages.slice(0, 6),
          categories: niche.slice(0, 6),
          audienceDesc: audience.trim().slice(0, 200),
          nowMaking: nowMaking.trim().slice(0, 80),
          availability,
          replyTime: replyTime.trim().slice(0, 50) || "Within 24h",
          signatureName: signature.trim().slice(0, 120),
        },
        "About Me for Brands saved"
      );
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionCard title="About Me for Brands" icon={User} action={<EditButton onClick={() => setOpen(true)} />} bodyClassName="px-4 pb-2 pt-4">
        {settings.intro ? (
          <p className="whitespace-pre-line break-words text-[14px] leading-[22px] text-[#3F3F46]">{settings.intro}</p>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="w-full rounded-[5px] border border-dashed border-[#D4D4D8] p-3 text-left text-[13px] text-[#6B6B76] hover:border-[#7A2253] cursor-pointer">
            Add a short intro brands read first: what you create, where, and for whom.
          </button>
        )}
        <div className="mt-3">
          <InfoRow icon={<MapPin className="h-4 w-4" />} title="Location">
            {shownLocation || <span className={muted}>Not added</span>}
          </InfoRow>
          <InfoRow icon={<Languages className="h-4 w-4" />} title="Languages">
            {languagesList.length ? languagesList.join(", ") : <span className={muted}>Not added</span>}
          </InfoRow>
          <InfoRow icon={<Tag className="h-4 w-4" />} title="Content niche">
            {nicheList.length ? (
              <span className="flex flex-wrap gap-1.5">
                {nicheList.map((n) => (
                  <span key={n} className="rounded-[5px] bg-[#F7EEF2] px-2 py-0.5 text-[12px] font-semibold text-[#7A2253]">
                    {n}
                  </span>
                ))}
              </span>
            ) : (
              <span className={muted}>Not added</span>
            )}
          </InfoRow>
        </div>
      </SectionCard>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="About Me for Brands" description="Shown at the top of your public media kit and PDF." icon={<User className="h-4 w-4" />} size="lg">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <ModalBody className="space-y-4 p-4 sm:p-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={label} htmlFor="mk-intro">Intro for brands</label>
                <span className="text-[11px] text-[#A1A1AA]">{intro.length}/300</span>
              </div>
              <textarea id="mk-intro" rows={4} maxLength={300} value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Food creator exploring hidden gems and cafe culture in Ahmedabad…" className={`${input} h-auto resize-none py-2.5 leading-5`} />
            </div>
            <div className="space-y-1.5">
              <label className={label} htmlFor="mk-location">Location</label>
              <input id="mk-location" maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Ahmedabad, Gujarat" className={input} />
            </div>
            <div className="space-y-1.5">
              <span className={label}>Languages</span>
              <TagInput value={languages} onChange={setLanguages} max={6} placeholder="e.g. Hindi" suggestions={CONTENT_LANGUAGES} />
            </div>
            <div className="space-y-1.5">
              <span className={label}>Content niche</span>
              <TagInput value={niche} onChange={setNiche} max={6} placeholder="e.g. Food" suggestions={NICHE_SUGGESTIONS} />
            </div>

            <div className="space-y-3 rounded-[5px] border border-[#ECECF0] bg-[#FAFAFB] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B76]">Also on your media kit</p>
              <div className="space-y-1.5">
                <label className={label} htmlFor="mk-audience">Who follows along <span className="font-normal text-[#6B6B76]">(audience)</span></label>
                <textarea id="mk-audience" rows={2} maxLength={200} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="The people who watch your work…" className={`${input} h-auto resize-none py-2.5 leading-5`} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={label} htmlFor="mk-now">Currently making</label>
                  <input id="mk-now" maxLength={80} value={nowMaking} onChange={(e) => setNowMaking(e.target.value)} placeholder="e.g. A 6-part series on hidden cafes" className={input} />
                </div>
                <div className="space-y-1.5">
                  <label className={label} htmlFor="mk-reply">Typical reply time</label>
                  <input id="mk-reply" maxLength={50} value={replyTime} onChange={(e) => setReplyTime(e.target.value)} placeholder="Within 24h" className={input} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={label} htmlFor="mk-sign">Sign-off name <span className="font-normal text-[#6B6B76]">(closes your media kit)</span></label>
                <input id="mk-sign" maxLength={120} value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="e.g. Nikunj" className={input} />
              </div>
              <div className="space-y-1.5">
                <span className={label}>Availability</span>
                <div className="inline-flex rounded-[5px] border border-[#ECECF0] bg-white p-0.5">
                  {(["open", "busy"] as const).map((a) => (
                    <button key={a} type="button" aria-pressed={availability === a} onClick={() => setAvailability(a)} className={`h-8 rounded-[5px] px-3 text-[12px] font-semibold cursor-pointer ${availability === a ? "bg-[#7A2253] text-white" : "text-[#52525B]"}`}>
                      {a === "open" ? "Open for collabs" : "Busy"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <SaveFooter saving={saving} onCancel={() => setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}

// ── Collaboration Preferences ──────────────────────────────────

const FIT_SUGGESTIONS = ["Cafes", "Restaurants", "Food Brands", "Beverages", "Food Delivery Apps", "D2C Brands", "Hotels"];
const NOFIT_SUGGESTIONS = ["Betting apps", "Crypto tokens", "Hard scripts", "Alcohol", "Tobacco"];

export function PreferencesCard({ settings, onSave }: { settings: MediaKitSettings; onSave: SaveFn }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fit, setFit] = useState<string[]>([]);
  const [nofit, setNofit] = useState<string[]>([]);
  const [promises, setPromises] = useState<string[]>([]);

  const fitList = settings.fitTags || [];
  const nofitList = settings.nofitTags || [];
  const promiseList = settings.promises || [];

  useEffect(() => {
    if (!open) return;
    setFit(settings.fitTags || []);
    setNofit(settings.nofitTags || []);
    setPromises(settings.promises || []);
  }, [open, settings]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ fitTags: fit.slice(0, 6), nofitTags: nofit.slice(0, 6), promises: promises.slice(0, 4) }, "Collaboration preferences saved");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SectionCard title="Collaboration Preferences" icon={BarChart3} action={<EditButton onClick={() => setOpen(true)} />} bodyClassName="px-4 py-1">
        <InfoRow icon={<Handshake className="h-4 w-4" />} title="Work with">
          {fitList.length ? fitList.join(", ") : <span className={muted}>Not added</span>}
        </InfoRow>
        <InfoRow icon={<Ban className="h-4 w-4" />} title="Not a fit for">
          {nofitList.length ? nofitList.join(", ") : <span className={muted}>Not added</span>}
        </InfoRow>
        <InfoRow icon={<HeartHandshake className="h-4 w-4" />} title="My commitments">
          {promiseList.length ? (
            <ul className="space-y-1.5">
              {promiseList.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7A2253]" strokeWidth={3} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className={muted}>Not added</span>
          )}
        </InfoRow>
      </SectionCard>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Collaboration Preferences" description="Helps brands know quickly if you're the right fit." icon={<BarChart3 className="h-4 w-4" />} size="lg">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <ModalBody className="space-y-4 p-4 sm:p-5">
            <div className="space-y-1.5">
              <span className={label}>Work with</span>
              <TagInput value={fit} onChange={setFit} max={6} placeholder="e.g. Cafes" suggestions={FIT_SUGGESTIONS} />
            </div>
            <div className="space-y-1.5">
              <span className={label}>Not a fit for</span>
              <TagInput value={nofit} onChange={setNofit} max={6} placeholder="e.g. Betting apps" suggestions={NOFIT_SUGGESTIONS} />
            </div>
            <div className="space-y-1.5">
              <span className={label}>My commitments <span className="font-normal text-[#6B6B76]">(pick up to 4)</span></span>
              <div className="grid grid-cols-1 gap-2">
                {MEDIAKIT_PROMISE_PRESETS.map((p) => {
                  const on = promises.includes(p);
                  return (
                    <label key={p} className={`flex cursor-pointer items-center gap-2.5 rounded-[5px] border px-3 py-2.5 text-[13px] ${on ? "border-[#7A2253] bg-[#F7EEF2] text-[#18181B]" : "border-[#ECECF0] bg-white text-[#3F3F46]"}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setPromises(on ? promises.filter((x) => x !== p) : promises.length < 4 ? [...promises, p] : promises)}
                        className="h-4 w-4 accent-[#7A2253]"
                      />
                      {p}
                    </label>
                  );
                })}
              </div>
            </div>
          </ModalBody>
          <SaveFooter saving={saving} onCancel={() => setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}
