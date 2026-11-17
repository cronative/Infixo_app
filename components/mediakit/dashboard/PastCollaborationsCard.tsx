"use client";

import { useCallback, useEffect, useState } from "react";
import { EyeOff, ExternalLink, Megaphone, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/shared/BrandIcons";
import { useToast } from "@/contexts/ToastContext";
import type { CreatorCollaboration } from "@/types";

type Platform = NonNullable<CreatorCollaboration["platform"]>;

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "other", label: "Other" },
];
const CAMPAIGN_TYPES = ["Cafe Visit & Review", "Food Delivery Experience", "Product Review", "Store Launch", "Brand Promotion", "Event Coverage"];
const DURATION_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;

const input =
  "h-10 w-full rounded-[5px] border border-[#ECECF0] bg-white px-3 text-[13px] text-[#18181B] placeholder:text-[#A1A1AA] focus:border-[#7A2253] focus:outline-none";
const label = "block text-[12px] font-semibold text-[#18181B]";

function PlatformGlyph({ platform, className = "h-3.5 w-3.5" }: { platform?: string; className?: string }) {
  if (platform === "instagram") return <InstagramIcon className={`${className} text-[#E1306C]`} />;
  if (platform === "youtube") return <YoutubeIcon className={`${className} text-[#FF0000]`} />;
  if (platform === "facebook") return <FacebookIcon className={`${className} text-[#1877F2]`} />;
  return null;
}

/** Guess the platform from a pasted link. */
function platformFromUrl(url: string): Platform | "" {
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "facebook";
  return "";
}

function CollabTile({ c, onEdit, onDelete, className = "" }: { c: CreatorCollaboration; onEdit: () => void; onDelete: () => void; className?: string }) {
  return (
    <article className={`group overflow-hidden rounded-[5px] border border-[#ECECF0] bg-white ${c.isActive ? "" : "opacity-60"} ${className}`}>
      <div className="relative h-[104px] bg-[#F7EEF2]">
        {c.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : c.brandLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.brandLogoUrl} alt="" className="h-full w-full object-contain p-6" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[28px] font-bold text-[#7A2253]/60">{c.brandName.slice(0, 1).toUpperCase()}</span>
        )}
        {c.campaignUrl && (
          <a
            href={c.campaignUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Watch ${c.brandName} campaign`}
            className="absolute inset-0 m-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-[2px] transition-transform hover:scale-105"
          >
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </a>
        )}
        {c.duration && <span className="absolute bottom-1.5 right-1.5 rounded-[4px] bg-black/70 px-1.5 py-px text-[10px] font-semibold text-white">{c.duration}</span>}
        {!c.isActive && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-[4px] bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-[#52525B]">
            <EyeOff className="h-3 w-3" /> Hidden
          </span>
        )}
        <div className="absolute right-1.5 top-1.5 flex gap-1">
          <button type="button" onClick={onEdit} aria-label={`Edit ${c.brandName}`} className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-white/95 text-[#3F3F46] shadow-xs hover:text-[#7A2253] cursor-pointer">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete} aria-label={`Delete ${c.brandName}`} className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-white/95 text-[#3F3F46] shadow-xs hover:text-[#C2414B] cursor-pointer">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-start gap-2 px-2.5 py-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[13px] font-bold text-[#18181B]">
            <PlatformGlyph platform={c.platform} />
            <span className="truncate">{c.brandName}</span>
          </p>
          {c.campaignTitle && <p className="truncate text-[11px] text-[#6B6B76]">{c.campaignTitle}</p>}
        </div>
        {c.campaignUrl && (
          <a href={c.campaignUrl} target="_blank" rel="noopener noreferrer" aria-label="Open campaign" className="shrink-0 text-[#7A2253] hover:opacity-80">
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </article>
  );
}

const EMPTY: CreatorCollaboration = { id: "", creatorId: "", brandName: "", campaignTitle: "", campaignUrl: "", description: "", thumbnailUrl: null, brandLogoUrl: null, duration: "", sortOrder: 0, isActive: true };

/** Past brand collaborations (creator_collaborations): video-style cards with add / edit / delete. */
export function PastCollaborationsCard({ creatorId, onCountChange }: { creatorId: string; onCountChange?: (n: number) => void }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<CreatorCollaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState<CreatorCollaboration | null>(null);
  const [toDelete, setToDelete] = useState<CreatorCollaboration | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!creatorId) return;
    try {
      const res = await fetch(`/api/creator/collaborations?creatorId=${encodeURIComponent(creatorId)}`);
      const json = await res.json();
      const list = json.data?.collaborations;
      if (res.ok && Array.isArray(list)) setItems(list);
    } catch {
      // keep what we have
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => onCountChange?.(items.length), [items.length, onCountChange]);

  const patch = (p: Partial<CreatorCollaboration>) => setEditing((e) => (e ? { ...e, ...p } : e));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const next: Record<string, string> = {};
    if (!editing.brandName.trim()) next.brandName = "Brand name is required";
    if (!(editing.campaignTitle || "").trim()) next.campaignTitle = "Add the campaign type";
    if (editing.duration && !DURATION_RE.test(editing.duration.trim())) next.duration = "Use m:ss, e.g. 1:12";
    if (editing.campaignUrl && !/^https?:\/\//i.test(editing.campaignUrl.trim())) next.campaignUrl = "Paste the full link (https://…)";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const body = {
        collaboration: {
          ...editing,
          brandName: editing.brandName.trim(),
          campaignTitle: (editing.campaignTitle || "").trim(),
          campaignUrl: (editing.campaignUrl || "").trim(),
          duration: (editing.duration || "").trim(),
          description: (editing.description || "").trim(),
          id: editing.id || undefined,
          sortOrder: editing.id ? editing.sortOrder : items.length,
        },
      };
      const res = await fetch("/api/creator/collaborations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status !== 1) throw new Error(json.message || "Could not save");
      await load();
      showToast(editing.id ? "Collaboration updated" : "Collaboration added");
      setEditing(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    try {
      const res = await fetch(`/api/creator/collaborations?id=${encodeURIComponent(toDelete.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setItems((list) => list.filter((x) => x.id !== toDelete.id));
      showToast("Collaboration deleted");
    } catch {
      showToast("Could not delete", "error");
    } finally {
      setToDelete(null);
    }
  };

  const shown = showAll ? items : items.slice(0, 3);
  const openNew = () => {
    setErrors({});
    setEditing({ ...EMPTY });
  };

  return (
    <>
      <SectionCard
        title="Past Collaborations"
        icon={Megaphone}
        action={
          <div className="flex items-center gap-2">
            {items.length > 3 && (
              <button type="button" onClick={() => setShowAll((v) => !v)} className="text-[13px] font-semibold text-[#7A2253] hover:underline cursor-pointer">
                {showAll ? "Show less" : `View all (${items.length})`}
              </button>
            )}
            <button type="button" onClick={openNew} className="inline-flex h-8 items-center gap-1 rounded-[5px] border border-[#ECECF0] bg-white px-2.5 text-[12px] font-semibold text-[#7A2253] hover:bg-[#F7EEF2] cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[150px] animate-pulse rounded-[5px] bg-[#F4F4F5]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <button type="button" onClick={openNew} className="flex w-full flex-col items-center gap-1 rounded-[5px] border border-dashed border-[#D4D4D8] px-4 py-8 text-center hover:border-[#7A2253] cursor-pointer">
            <Megaphone className="h-6 w-6 text-[#A1A1AA]" />
            <span className="text-[13px] font-semibold text-[#18181B]">Add your first brand collaboration</span>
            <span className="text-[12px] text-[#6B6B76]">Brand, campaign type, video link and cover — shown on your media kit.</span>
          </button>
        ) : (
          // Phones: a swipeable row; wider screens: a grid.
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 min-[480px]:mx-0 min-[480px]:grid min-[480px]:grid-cols-2 min-[480px]:overflow-visible min-[480px]:px-0 min-[480px]:pb-0 xl:grid-cols-3">
            {shown.map((c) => (
              <CollabTile
                key={c.id}
                c={c}
                className="w-[58%] shrink-0 snap-start min-[480px]:w-auto"
                onEdit={() => { setErrors({}); setEditing({ ...c }); }}
                onDelete={() => setToDelete(c)}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit collaboration" : "Add collaboration"}
        description="A brand campaign you've done, shown on your media kit."
        icon={<Megaphone className="h-4 w-4" />}
        size="lg"
      >
        {editing && (
          <form onSubmit={save} noValidate className="flex min-h-0 flex-1 flex-col">
            <ModalBody className="space-y-4 p-4 sm:p-5">
              <div className="space-y-1.5">
                <label className={label} htmlFor="pc-brand">Brand name <span className="text-[#C2414B]">*</span></label>
                <input id="pc-brand" maxLength={150} value={editing.brandName} onChange={(e) => patch({ brandName: e.target.value })} placeholder="e.g. The Coffee House" className={`${input} ${errors.brandName ? "border-[#C2414B]" : ""}`} />
                {errors.brandName && <p className="text-[12px] text-[#C2414B]">{errors.brandName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={label} htmlFor="pc-type">Campaign type <span className="text-[#C2414B]">*</span></label>
                <input id="pc-type" maxLength={120} value={editing.campaignTitle || ""} onChange={(e) => patch({ campaignTitle: e.target.value })} placeholder="e.g. Cafe Visit & Review" className={`${input} ${errors.campaignTitle ? "border-[#C2414B]" : ""}`} />
                <div className="flex flex-wrap gap-1.5">
                  {CAMPAIGN_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => patch({ campaignTitle: t })} className={`rounded-[5px] border px-2 py-0.5 text-[12px] font-medium cursor-pointer ${editing.campaignTitle === t ? "border-[#7A2253] bg-[#F7EEF2] text-[#7A2253]" : "border-[#ECECF0] text-[#52525B] hover:border-[#7A2253]"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {errors.campaignTitle && <p className="text-[12px] text-[#C2414B]">{errors.campaignTitle}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={label} htmlFor="pc-url">Video / post link <span className="font-normal text-[#6B6B76]">(optional)</span></label>
                <input
                  id="pc-url"
                  type="url"
                  maxLength={1000}
                  value={editing.campaignUrl || ""}
                  onChange={(e) => {
                    const url = e.target.value;
                    const guess = platformFromUrl(url);
                    patch(guess && !editing.platform ? { campaignUrl: url, platform: guess } : { campaignUrl: url });
                  }}
                  placeholder="https://www.instagram.com/reel/…"
                  className={`${input} ${errors.campaignUrl ? "border-[#C2414B]" : ""}`}
                />
                {errors.campaignUrl && <p className="text-[12px] text-[#C2414B]">{errors.campaignUrl}</p>}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className={label} htmlFor="pc-platform">Platform</label>
                  <select id="pc-platform" value={editing.platform || ""} onChange={(e) => patch({ platform: (e.target.value || undefined) as Platform | undefined })} className={`${input} cursor-pointer`}>
                    <option value="">Select…</option>
                    {PLATFORMS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={label} htmlFor="pc-duration">Video length <span className="font-normal text-[#6B6B76]">(optional)</span></label>
                  <input id="pc-duration" maxLength={8} value={editing.duration || ""} onChange={(e) => patch({ duration: e.target.value })} placeholder="e.g. 1:12" className={`${input} ${errors.duration ? "border-[#C2414B]" : ""}`} />
                  {errors.duration && <p className="text-[12px] text-[#C2414B]">{errors.duration}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-1.5">
                  <span className={label}>Cover image <span className="font-normal text-[#6B6B76]">(video thumbnail)</span></span>
                  <PhotoUpload value={editing.thumbnailUrl || null} onChange={(v) => patch({ thumbnailUrl: v })} shape="landscape" />
                </div>
                <div className="space-y-1.5">
                  <span className={label}>Brand logo <span className="font-normal text-[#6B6B76]">(optional)</span></span>
                  <PhotoUpload value={editing.brandLogoUrl || null} onChange={(v) => patch({ brandLogoUrl: v })} shape="rounded" size={72} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={label} htmlFor="pc-desc">What you did <span className="font-normal text-[#6B6B76]">(optional)</span></label>
                <textarea id="pc-desc" rows={2} maxLength={1000} value={editing.description || ""} onChange={(e) => patch({ description: e.target.value })} placeholder="e.g. 1 reel + 2 stories, 48K views in a week" className={`${input} h-auto resize-none py-2.5`} />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-medium text-[#18181B]">
                <input type="checkbox" checked={editing.isActive !== false} onChange={(e) => patch({ isActive: e.target.checked })} className="h-4 w-4 accent-[#7A2253]" />
                Show on my media kit
              </label>
            </ModalBody>
            <ModalFooter className="px-4 py-3 sm:px-5">
              <button type="button" onClick={() => setEditing(null)} className="h-10 rounded-[5px] border border-[#ECECF0] bg-white px-4 text-[12px] font-semibold text-[#6B6B76] hover:bg-[#F4F4F5] cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="h-10 rounded-[5px] bg-[#7A2253] px-5 text-[12px] font-semibold text-white hover:opacity-95 cursor-pointer disabled:opacity-60">
                {saving ? "Saving…" : editing.id ? "Save changes" : "Add collaboration"}
              </button>
            </ModalFooter>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        title="Delete this collaboration?"
        description={toDelete ? `"${toDelete.brandName}" will be removed from your media kit.` : ""}
        confirmText="Delete"
        isDestructive
        focusCancel
      />
    </>
  );
}
