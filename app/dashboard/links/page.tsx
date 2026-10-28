"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ExternalLink,
  Folder,
  FolderOpen,
  GripVertical,
  Link as LinkIcon,
  Loader2,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { PageContainer } from "@/components/dashboard/PageContainer";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Chip } from "@/components/ui/Chip";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { extractBareDomain, getPlatformFromUrl } from "@/lib/linkIcons";
import { customLinksRepository } from "@/repositories/localRepository";
import { LinkService, type LinkDto, type LinkInputDto } from "@/services/LinkService";
import { getPlanQuota } from "@/services/subscriptionLimits";
import type { CustomLink } from "@/types";
import { OverLimitBadge } from "@/components/ui/OverLimitBadge";

const MAX_TITLE = 60;
const MAX_CHILDREN = 10;
const primaryButton = "inline-flex items-center gap-1.5 h-9 px-4 rounded-[5px] bg-[#7A2253] text-white text-xs font-bold hover:bg-[#681c46] shadow-2xs transition-colors cursor-pointer";
const fieldClass = "relative flex items-center h-11 rounded-[5px] border border-slate-200 bg-white focus-within:border-[#7A2253] focus-within:ring-1 focus-within:ring-[#7A2253]/20 overflow-hidden";
const fieldIconClass = "flex h-full w-12 shrink-0 items-center justify-center border-r border-slate-200 bg-white text-slate-500";
const fieldInputClass = "w-full h-full px-3.5 text-xs sm:text-[13px] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent";

interface ChildRow { key: string; id?: string; title: string; url: string }

let rowKey = 0;
const blankChild = (): ChildRow => ({ key: `row_${++rowKey}`, title: "", url: "" });

/** Adds https:// when the creator typed a bare domain. */
function withHttps(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

/** "https://www.bookmyshow.com/x" → "Bookmyshow"; known platforms use their name. */
function titleFromUrl(url: string) {
  const platform = getPlatformFromUrl(url);
  if (platform.isKnownApp) return platform.name;
  const labels = extractBareDomain(url).split(".").filter(Boolean);
  if (labels.length < 2) return "";
  let name = labels[labels.length - 2];
  if (["co", "com", "org", "net", "gov", "ac", "edu"].includes(name) && labels.length > 2) name = labels[labels.length - 3];
  return (name.charAt(0).toUpperCase() + name.slice(1)).slice(0, MAX_TITLE);
}

/** Keeps the shared local cache (dashboard home, preview) in the legacy CustomLink shape. */
function cacheLinks(items: LinkDto[]) {
  const legacy: CustomLink[] = items.map((link) => link.kind === "group"
    ? { id: link.id, title: link.title, url: "", kind: "collection", isEnabled: true, items: link.children.map((child) => ({ id: child.id, title: child.title, url: child.url, iconUrl: child.iconUrl || undefined, isEnabled: true })) }
    : { id: link.id, title: link.title, url: link.url, kind: "link", isEnabled: true, isPinned: link.pinned, iconUrl: link.iconUrl || undefined });
  try { customLinksRepository.save(legacy); } catch {}
}

function LinkIconBox({ kind, url, iconUrl, title, small = false }: { kind: "link" | "group"; url: string; iconUrl: string | null; title: string; small?: boolean }) {
  const size = small ? "h-7 w-7" : "h-9 w-9";
  if (kind === "group") {
    return (
      <div className={`${size} rounded-[5px] flex items-center justify-center shrink-0 bg-[#eef2f6] text-[#475569]`}>
        <Folder className="h-4 w-4" />
      </div>
    );
  }
  const platform = getPlatformFromUrl(url);
  if (platform.isKnownApp) {
    return <div className={`${size} rounded-[5px] flex items-center justify-center shrink-0 overflow-hidden ${platform.bgClass}`}>{platform.renderIcon(small)}</div>;
  }
  if (iconUrl) {
    return (
      <div className={`${size} rounded-[5px] flex items-center justify-center shrink-0 overflow-hidden bg-white border border-[#e2e8f0]`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconUrl} alt="" className={small ? "h-4 w-4 object-contain" : "h-5 w-5 object-contain"} />
      </div>
    );
  }
  return (
    <div className={`${size} rounded-[5px] flex items-center justify-center shrink-0 bg-[#FFF5F7] border border-[#FCE7F3]`}>
      <span className="text-xs font-bold uppercase text-[#7A2253]">{(title.trim()[0] || extractBareDomain(url)[0] || "L").toUpperCase()}</span>
    </div>
  );
}

export default function DashboardLinksPage() {
  const { showToast } = useToast();
  const [links, setLinks] = useState<LinkDto[]>([]);
  const [limit, setLimit] = useState<number | null>(null);
  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [menuId, setMenuId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LinkDto | null>(null);
  const [mode, setMode] = useState<"link" | "group">("link");
  const [title, setTitle] = useState("");
  const [titleEdited, setTitleEdited] = useState(false);
  const [url, setUrl] = useState("");
  const [pinned, setPinned] = useState(false);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<LinkDto | null>(null);
  const [removingChild, setRemovingChild] = useState<ChildRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const used = links.length;
  const isLimitReached = limit !== null && used >= limit;
  const planName = getPlanQuota(plan).name;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError("");
    LinkService.list(controller.signal).then((data) => {
      setLinks(data.items); setLimit(data.limit); setPlan(data.plan);
      cacheLinks(data.items);
    }).catch((err) => {
      if (!controller.signal.aborted) setLoadError(err.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  // Close the ⋮ menu on outside press; presses inside it reach its items.
  useEffect(() => {
    if (!menuId) return;
    const close = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest?.("[data-menu]")) return;
      setMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuId]);

  function applyLinks(next: LinkDto[]) {
    setLinks(next);
    cacheLinks(next);
  }

  function openCreate() {
    if (isLimitReached) return;
    setEditing(null);
    setMode("link");
    setTitle(""); setTitleEdited(false); setUrl(""); setPinned(false);
    setChildren([blankChild(), blankChild()]);
    setOpen(true);
  }

  function openEdit(link: LinkDto) {
    setMenuId(null);
    setEditing(link);
    setMode(link.kind);
    setTitle(link.title); setTitleEdited(true);
    setUrl(link.url); setPinned(link.pinned);
    setChildren(link.kind === "group" && link.children.length
      ? link.children.map((child) => ({ key: `row_${++rowKey}`, id: child.id, title: child.title, url: child.url }))
      : [blankChild(), blankChild()]);
    setOpen(true);
  }

  function urlBlurred() {
    const next = withHttps(url);
    setUrl(next);
    if (!titleEdited || !title.trim()) {
      const suggestion = titleFromUrl(next);
      if (suggestion) setTitle(suggestion);
    }
  }

  function updateChild(key: string, patch: Partial<ChildRow>) {
    setChildren((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  /** Merges a saved link into the list; pinning one unpins the rest (mirrors the server). */
  function upsert(saved: LinkDto) {
    const exists = links.some((link) => link.id === saved.id);
    let next = exists ? links.map((link) => (link.id === saved.id ? saved : link)) : [...links, saved];
    if (saved.pinned) next = next.map((link) => (link.id === saved.id ? link : { ...link, pinned: false }));
    applyLinks(next);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) { showToast(mode === "group" ? "Enter a group title." : "Enter a title.", "error"); return; }

    let input: LinkInputDto;
    if (mode === "link") {
      const cleanUrl = withHttps(url);
      if (!cleanUrl) { showToast("Enter a URL.", "error"); return; }
      input = { kind: "link", title: cleanTitle, url: cleanUrl, pinned };
    } else {
      const rows = children
        .map((row) => ({ id: row.id, title: row.title.trim(), url: withHttps(row.url) }))
        .filter((row) => row.title || row.url);
      if (rows.some((row) => !row.title || !row.url)) { showToast("Add a title and URL for each link, or clear the row.", "error"); return; }
      if (!rows.length) { showToast("Add at least one link to the group.", "error"); return; }
      input = { kind: "group", title: cleanTitle, children: rows };
    }

    setSaving(true);
    try {
      const saved = editing ? await LinkService.update(editing.id, input) : await LinkService.create(input);
      upsert(saved);
      setOpen(false);
      showToast(editing ? "Link updated" : "Link added");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save link.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(link: LinkDto) {
    setMenuId(null);
    try {
      const saved = await LinkService.update(link.id, { kind: "link", title: link.title, url: link.url, pinned: !link.pinned });
      upsert(saved);
      showToast("Link updated");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update link.", "error");
    }
  }

  async function confirmDelete() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await LinkService.remove(deleting.id);
      applyLinks(links.filter((link) => link.id !== deleting.id));
      setDeleting(null);
      showToast("Link deleted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete link.", "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function drop(target: number) {
    if (dragIndex === null || dragIndex === target) { setDragIndex(null); return; }
    const previous = links;
    const next = [...links];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(target, 0, moved);
    setDragIndex(null);
    applyLinks(next);
    try {
      await LinkService.reorder(next.map((link) => link.id));
    } catch (err) {
      applyLinks(previous);
      showToast(err instanceof Error ? err.message : "Could not save the new order.", "error");
    }
  }

  const deleteTitle = deleting?.kind === "group"
    ? `Delete this group and its ${deleting.children.length} ${deleting.children.length === 1 ? "link" : "links"}?`
    : "Delete this link?";

  return (
    <PageContainer className="text-left">
      <PageHeader
        title="Links"
        subtitle="Everything your fans should find — tickets, accounts, websites."
        actions={
          <>
            {!loading && !loadError && (
              <Chip variant="soft">{limit === null ? `${used}` : `${used} of ${limit}`} · {planName}</Chip>
            )}
            {isLimitReached ? (
              <Link href="/dashboard/subscription" className={primaryButton}>
                <Sparkles className="h-4 w-4" />
                <span>Upgrade to add more</span>
              </Link>
            ) : (
              <button type="button" onClick={openCreate} disabled={loading} className={`${primaryButton} disabled:opacity-50`}>
                <Plus className="h-4 w-4" />
                <span>Add link</span>
              </button>
            )}
          </>
        }
      />

      {loading ? (
        <div role="status" aria-label="Loading links" className="space-y-2">
          {[1, 2, 3].map((id) => <div key={id} className="h-[58px] animate-pulse rounded-[5px] border border-[#e2e8f0] bg-slate-100" />)}
        </div>
      ) : loadError ? (
        <div role="alert" className="rounded-[5px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <p>{loadError}</p>
          <button className="mt-2 min-h-10 font-semibold underline" onClick={() => setReload((value) => value + 1)}>Try again</button>
        </div>
      ) : links.length === 0 ? (
        <EmptyState
          icon={<LinkIcon className="h-7 w-7" />}
          title="Add your first link"
          description="Tickets, accounts, websites — everything your fans should find."
          action={
            <button type="button" onClick={openCreate} className={primaryButton}>
              <Plus className="h-4 w-4" />
              <span>Add link</span>
            </button>
          }
        />
      ) : (
        <div className="rounded-[5px] border border-[#e2e8f0] bg-white divide-y divide-[#f1f5f9] shadow-2xs">
          {links.map((link, index) => {
            const isGroup = link.kind === "group";
            const isOpen = expanded.has(link.id);
            return (
              <div
                key={link.id}
                onDragOver={(e: DragEvent) => e.preventDefault()}
                onDrop={() => void drop(index)}
                className={`text-left transition-colors ${dragIndex === index ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between gap-3 px-3.5 sm:px-4 py-3 min-h-[58px] hover:bg-[#fafafa]">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragEnd={() => setDragIndex(null)}
                      className="text-[#cbd5e1] hover:text-[#94a3b8] cursor-grab active:cursor-grabbing shrink-0"
                      title="Drag to reorder"
                      aria-label={`Drag to reorder ${link.title}`}
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <LinkIconBox kind={link.kind} url={link.url} iconUrl={link.iconUrl} title={link.title} />
                    <button
                      type="button"
                      onClick={() => isGroup
                        ? setExpanded((set) => { const next = new Set(set); if (next.has(link.id)) next.delete(link.id); else next.add(link.id); return next; })
                        : openEdit(link)}
                      aria-expanded={isGroup ? isOpen : undefined}
                      className="min-w-0 flex-1 text-left cursor-pointer group"
                    >
                      <span className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate text-sm font-bold text-[#0f172a] group-hover:text-[#7A2253] transition-colors">{link.title}</span>
                        {limit !== null && index >= limit && <OverLimitBadge />}
                        {link.pinned && (
                          <span className="shrink-0 text-[10.5px] font-bold bg-[#FCE7F1] text-[#7A2253] px-1.5 py-0.5 rounded-[4px] leading-none">Pinned</span>
                        )}
                        {isGroup && <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#94a3b8] transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                      </span>
                      <span className="block truncate text-xs text-[#64748b]">
                        {isGroup ? `${link.children.length} ${link.children.length === 1 ? "link" : "links"}` : extractBareDomain(link.url)}
                      </span>
                    </button>
                  </div>

                  <div className="relative flex items-center gap-2 shrink-0" data-menu>
                    <button
                      type="button"
                      onClick={() => openEdit(link)}
                      className="h-8 w-8 flex items-center justify-center rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] transition-colors shadow-2xs cursor-pointer"
                      title="Edit link"
                      aria-label={`Edit ${link.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenuId((current) => (current === link.id ? null : link.id))}
                      className="h-8 w-8 flex items-center justify-center rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] transition-colors shadow-2xs cursor-pointer"
                      aria-label={`More actions for ${link.title}`}
                      aria-haspopup="menu"
                      aria-expanded={menuId === link.id}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                    {menuId === link.id && (
                      <div role="menu" className="absolute right-0 top-full mt-1.5 z-30 w-40 rounded-[5px] border border-[#e2e8f0] bg-white p-1 shadow-lg text-xs">
                        {!isGroup && (
                          <>
                            <button type="button" role="menuitem" onClick={() => void togglePin(link)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] font-medium text-[#0f172a] hover:bg-[#f1f5f9] cursor-pointer">
                              {link.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                              <span>{link.pinned ? "Unpin" : "Pin"}</span>
                            </button>
                            <a role="menuitem" href={link.url} target="_blank" rel="noopener noreferrer" onClick={() => setMenuId(null)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] font-medium text-[#0f172a] hover:bg-[#f1f5f9]">
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Open</span>
                            </a>
                          </>
                        )}
                        <button type="button" role="menuitem" onClick={() => { setMenuId(null); setDeleting(link); }} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] font-medium text-[#ef4444] hover:bg-rose-50 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isGroup && isOpen && (
                  <div className="pb-2.5 pl-12 sm:pl-14 pr-3.5 sm:pr-4 space-y-1.5">
                    {link.children.map((child) => (
                      <a
                        key={child.id}
                        href={child.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 rounded-[5px] border border-[#e2e8f0] bg-white px-3 py-2 hover:bg-[#fafafa] transition-colors"
                      >
                        <LinkIconBox kind="link" url={child.url} iconUrl={child.iconUrl} title={child.title} small />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-[#0f172a]">{child.title}</span>
                          <span className="block truncate text-[11px] text-[#64748b]">{extractBareDomain(child.url)}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleting)}
        onClose={() => { if (!deleteBusy) setDeleting(null); }}
        onConfirm={() => void confirmDelete()}
        title={deleteTitle}
        description={`"${deleting?.title || ""}" will be removed from your public profile.`}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteBusy}
        isDestructive
        focusCancel
      />

      <ConfirmModal
        isOpen={Boolean(removingChild)}
        onClose={() => setRemovingChild(null)}
        onConfirm={() => {
          const target = removingChild;
          if (target) setChildren((rows) => rows.filter((item) => item.key !== target.key));
          setRemovingChild(null);
        }}
        title={`Remove '${removingChild?.title || "this link"}' from this group?`}
        description="It's removed from the group when you save changes."
        confirmText="Remove"
        cancelText="Cancel"
        isDestructive
        focusCancel
      />

      <Modal
        isOpen={open}
        onClose={() => { if (!saving) setOpen(false); }}
        size="lg"
        showCloseButton={false}
        className="rounded-[5px] border border-slate-200 shadow-2xl overflow-hidden max-w-2xl"
      >
        <div className="relative border-b border-slate-100 bg-white px-5 sm:px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] bg-[#FFF0F5] border border-[#FCE7F1] text-[#7A2253]">
                <LinkIcon className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight text-slate-900">{editing ? "Edit link" : "Add link"}</h3>
                <p className="mt-0.5 text-xs text-slate-500 font-normal">Add a useful destination to your public creator profile.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { if (!saving) setOpen(false); }}
              className="flex h-8 w-8 items-center justify-center rounded-[5px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={save} noValidate className="flex flex-col flex-1 min-h-0">
          <ModalBody className="p-5 sm:p-6 space-y-4 text-left">
            <div className="grid grid-cols-2 p-1 bg-white border border-slate-200 rounded-[5px] gap-1">
              {(["link", "group"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  aria-pressed={mode === value}
                  className={`py-2 px-3 rounded-[5px] text-center transition-all cursor-pointer ${mode === value ? "bg-[#7A2253] text-white shadow-xs" : "bg-transparent text-slate-700 hover:bg-slate-50"}`}
                >
                  <span className="block text-xs sm:text-[13px] font-bold">{value === "link" ? "Single link" : "Group"}</span>
                  <span className={`block text-[10.5px] font-normal mt-0.5 ${mode === value ? "text-white/80" : "text-slate-400"}`}>
                    {value === "link" ? "Add one link to your profile" : "Group up to 10 related links"}
                  </span>
                </button>
              ))}
            </div>

            {mode === "link" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-2">
                    <label htmlFor="link-url" className="text-xs sm:text-[13px] font-bold text-slate-900">URL <span className="text-[#C2414B]">*</span></label>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-normal">Paste the full link.</span>
                  </div>
                  <div className={fieldClass}>
                    <div className={fieldIconClass}><LinkIcon className="h-4 w-4" /></div>
                    <input
                      id="link-url"
                      type="url"
                      inputMode="url"
                      autoFocus
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onBlur={urlBlurred}
                      maxLength={1000}
                      placeholder="https://example.com"
                      className={`${fieldInputClass} font-mono`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <label htmlFor="link-title" className="text-xs sm:text-[13px] font-bold text-slate-900">Title <span className="text-[#C2414B]">*</span></label>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-normal">{title.length}/{MAX_TITLE}</span>
                  </div>
                  <div className={fieldClass}>
                    <div className={`${fieldIconClass} font-semibold text-sm`}>T</div>
                    <input
                      id="link-title"
                      type="text"
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); setTitleEdited(true); }}
                      maxLength={MAX_TITLE}
                      placeholder="e.g. Book tickets"
                      className={fieldInputClass}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-[5px] border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-0.5 pr-3">
                    <label htmlFor="link-pin" className="text-xs sm:text-[13px] font-bold text-slate-900 cursor-pointer">Pin this link</label>
                    <p className="text-[11px] text-slate-500 font-normal">Shows at the top of your Links tab. Pinning it unpins any other link.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input id="link-pin" type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7A2253]"></div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <label htmlFor="group-title" className="text-xs sm:text-[13px] font-bold text-slate-900">Group title <span className="text-[#C2414B]">*</span></label>
                    <span className="text-[11px] sm:text-xs text-slate-400 font-normal">{title.length}/{MAX_TITLE}</span>
                  </div>
                  <div className={fieldClass}>
                    <div className={fieldIconClass}><FolderOpen className="h-4 w-4" /></div>
                    <input
                      id="group-title"
                      type="text"
                      autoFocus
                      value={title}
                      onChange={(e) => { setTitle(e.target.value); setTitleEdited(true); }}
                      maxLength={MAX_TITLE}
                      placeholder="e.g. World tour tickets"
                      className={fieldInputClass}
                    />
                  </div>
                </div>

                <div className="rounded-[5px] border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs sm:text-[13px] font-bold text-slate-900">Links in this group</p>
                    <span className="text-[11px] text-slate-400">{children.length}/{MAX_CHILDREN}</span>
                  </div>
                  <div className="space-y-2.5">
                    {children.map((row, index) => (
                      <div key={row.key} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1 flex items-center h-10 rounded-[5px] border border-slate-200 bg-white focus-within:border-[#7A2253] focus-within:ring-1 focus-within:ring-[#7A2253]/20 overflow-hidden">
                          <div className="flex h-full w-9 shrink-0 items-center justify-center border-r border-slate-200 bg-white text-slate-500 font-semibold text-xs">T</div>
                          <input
                            type="text"
                            aria-label={`Link ${index + 1} title`}
                            value={row.title}
                            onChange={(e) => updateChild(row.key, { title: e.target.value })}
                            maxLength={MAX_TITLE}
                            placeholder="Title"
                            className="w-full h-full px-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent"
                          />
                        </div>
                        <div className="relative flex-1 flex items-center h-10 rounded-[5px] border border-slate-200 bg-white focus-within:border-[#7A2253] focus-within:ring-1 focus-within:ring-[#7A2253]/20 overflow-hidden">
                          <div className="flex h-full w-9 shrink-0 items-center justify-center border-r border-slate-200 bg-white text-slate-500"><LinkIcon className="h-3.5 w-3.5" /></div>
                          <input
                            type="url"
                            inputMode="url"
                            aria-label={`Link ${index + 1} URL`}
                            value={row.url}
                            onChange={(e) => updateChild(row.key, { url: e.target.value })}
                            onBlur={() => {
                              const next = withHttps(row.url);
                              updateChild(row.key, { url: next, title: row.title || titleFromUrl(next) });
                            }}
                            maxLength={1000}
                            placeholder="https://example.com"
                            className="w-full h-full px-3 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none bg-transparent"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            // Saved links ask first; rows added in this session just go.
                            if (row.id) setRemovingChild(row);
                            else setChildren((rows) => rows.filter((item) => item.key !== row.key));
                          }}
                          disabled={children.length <= 1}
                          className="self-end sm:self-center p-2 rounded-[5px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Remove link ${index + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {children.length < MAX_CHILDREN && (
                    <button
                      type="button"
                      onClick={() => setChildren((rows) => [...rows, blankChild()])}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-[#7A2253] bg-white px-3 text-xs font-bold text-[#7A2253] hover:bg-[#FFF5F8] transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add link</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </ModalBody>

          <ModalFooter className="px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={saving}
              className="h-10 px-5 rounded-[5px] border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-[5px] bg-[#7A2253] hover:opacity-95 text-white font-bold text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
              <span>{saving ? "Saving..." : editing ? "Save changes" : "Add link"}</span>
            </button>
          </ModalFooter>
        </form>
      </Modal>
    </PageContainer>
  );
}
