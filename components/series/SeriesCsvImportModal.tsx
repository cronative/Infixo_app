'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Loader2,
  Plus,
  Trash2,
  FileSpreadsheet,
  TableProperties,
  ClipboardPaste,
  AlertCircle,
  Film,
  Check,
  X,
  FileDown,
  Globe,
} from 'lucide-react';
import type { EpisodePlatform, Series } from '@/types';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import {
  parseSeriesCsv,
  existingEpisodeConflicts,
  validateEpisodePlatform,
  isUrlAllowedForPlatform,
  getPlatformRequirementMessage,
  MAX_CSV_BYTES,
  SERIES_CSV_TEMPLATE,
  episodesToCsv,
} from '@/lib/seriesCsv';
import { getPlanQuota } from '@/services/subscriptionLimits';
import { YoutubeIcon, InstagramIcon, FacebookIcon } from '@/components/shared/BrandIcons';

const fieldClass =
  'w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-base sm:text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#043084] focus:ring-2 focus:ring-[#043084]/10 transition-colors';

interface TableRow {
  id: string;
  part: number;
  title: string;
  url: string;
}

interface SeriesCsvImportModalProps {
  series: Series[];
  planKey: string;
  initialSeriesId?: string;
  onClose: () => void;
  onImported: (id: string, count: number) => void;
}

function getPlatformBadge(url: string) {
  const lower = url.trim().toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 border border-red-200/60 px-1.5 py-0.5 rounded shrink-0">
        <YoutubeIcon className="h-3 w-3" /> YouTube
      </span>
    );
  }
  if (lower.includes('instagram.com')) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-pink-600 bg-pink-50 border border-pink-200/60 px-1.5 py-0.5 rounded shrink-0">
        <InstagramIcon className="h-3 w-3" /> Instagram
      </span>
    );
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 border border-blue-200/60 px-1.5 py-0.5 rounded shrink-0">
        <FacebookIcon className="h-3 w-3" /> Facebook
      </span>
    );
  }
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
        Web Link
      </span>
    );
  }
  return null;
}

export function SeriesCsvImportModal({
  series,
  planKey,
  initialSeriesId,
  onClose,
  onImported,
}: SeriesCsvImportModalProps) {
  // Mode: 'table' (interactive in-app multi-add / CSV generator) or 'file' (upload .csv file)
  const [mode, setMode] = useState<'table' | 'file'>('table');

  // Target Series
  const defaultTarget = initialSeriesId || (series.length === 1 ? series[0].id : '');
  const [target, setTarget] = useState(defaultTarget);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesPlatform, setNewSeriesPlatform] = useState<EpisodePlatform>('YouTube');

  // Selected series info & Effective Platform
  const targetSeries = series.find((item) => item.id === target);
  const effectivePlatform = (targetSeries ? targetSeries.platform : newSeriesPlatform) || 'YouTube';
  const existingEpisodes = targetSeries?.seasons?.flatMap((season) => season.episodes) || [];
  const maxExistingPart = existingEpisodes.reduce((max, ep) => Math.max(max, ep.episodeNumber || 0), 0);
  const nextPartNumber = maxExistingPart + 1;

  // File Mode states
  const [fileCsv, setFileCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [reading, setReading] = useState(false);
  const fileVersion = useRef(0);

  // Table Mode states
  const [rows, setRows] = useState<TableRow[]>(() => [
    { id: '1', part: nextPartNumber, title: '', url: '' },
    { id: '2', part: nextPartNumber + 1, title: '', url: '' },
    { id: '3', part: nextPartNumber + 2, title: '', url: '' },
  ]);
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Errors & submission
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const importKey = useRef('');

  // Re-anchor part numbers when target series changes if rows are untouched
  useEffect(() => {
    const isUntouched = rows.every((r) => !r.title && !r.url);
    if (isUntouched) {
      setRows([
        { id: '1', part: nextPartNumber, title: '', url: '' },
        { id: '2', part: nextPartNumber + 1, title: '', url: '' },
        { id: '3', part: nextPartNumber + 2, title: '', url: '' },
      ]);
    }
  }, [target, nextPartNumber]);

  // Generate effective CSV string depending on active mode
  const effectiveCsv = useMemo(() => {
    if (mode === 'file') return fileCsv;
    // In table mode, only include rows where at least title or url is provided
    const validRows = rows.filter((r) => r.title.trim() || r.url.trim());
    if (validRows.length === 0) return '';
    return episodesToCsv(
      validRows.map((r) => ({
        episodeNumber: r.part,
        title: r.title.trim() || `Episode ${r.part}`,
        externalUrl: r.url.trim(),
      }))
    );
  }, [mode, fileCsv, rows]);

  // Parse & validate CSV
  const parseResult = useMemo(() => {
    if (!effectiveCsv) return { episodes: [], errors: [] };
    return parseSeriesCsv(effectiveCsv);
  }, [effectiveCsv]);

  // Quotas & Conflicts
  const quota = getPlanQuota(planKey);
  const conflicts = existingEpisodeConflicts(parseResult.episodes, existingEpisodes);
  const platformErrors = useMemo(() => {
    return validateEpisodePlatform(parseResult.episodes, effectivePlatform);
  }, [parseResult.episodes, effectivePlatform]);

  const totalEpisodesInAccount = series.reduce(
    (count, item) => count + item.seasons.reduce((sum, season) => sum + season.episodes.length, 0),
    0
  );

  const limitExceeded =
    (!target && series.length >= quota.maxSeries) ||
    existingEpisodes.length + parseResult.episodes.length > quota.maxEpisodesPerSeries ||
    totalEpisodesInAccount + parseResult.episodes.length > quota.maxTotalEpisodes;

  const allIssues = [
    ...parseResult.errors,
    ...conflicts,
    ...platformErrors,
    ...(limitExceeded
      ? [`This import exceeds your ${quota.name} plan limits. Choose fewer videos or upgrade your plan.`]
      : []),
    ...serverErrors,
  ];

  const canImport =
    !busy &&
    !reading &&
    parseResult.episodes.length > 0 &&
    allIssues.length === 0 &&
    (Boolean(target) || Boolean(newSeriesTitle.trim()));

  // Download template
  function downloadTemplate() {
    const blob = new Blob([SERIES_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inflixo-series-template.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Download user table as CSV file
  function downloadCurrentTableCsv() {
    const csvContent = effectiveCsv || SERIES_CSV_TEMPLATE;
    const seriesSlug = (targetSeries?.title || newSeriesTitle || 'series')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${seriesSlug}-episodes.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Handle file upload
  async function handleFileSelected(file?: File) {
    const version = ++fileVersion.current;
    setFileCsv('');
    setServerErrors([]);
    setFileName(file?.name || '');
    importKey.current = '';
    setReading(false);

    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setServerErrors(['Choose a .csv file. In Excel, use Save As → CSV UTF-8.']);
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      setServerErrors(['CSV must be 1 MB or smaller.']);
      return;
    }

    setReading(true);
    try {
      const text = await file.text();
      if (version === fileVersion.current) {
        setFileCsv(text);
        if (!text.trim()) {
          setServerErrors(['The file is empty. Add your video rows first.']);
        }
      }
    } catch {
      if (version === fileVersion.current) {
        setServerErrors(['Could not read this file. Choose it again.']);
      }
    } finally {
      if (version === fileVersion.current) {
        setReading(false);
      }
    }
  }

  // Table row mutations
  function addRow(count = 1) {
    setRows((prev) => {
      const lastPart = prev.length > 0 ? Math.max(...prev.map((r) => r.part)) : nextPartNumber - 1;
      const newItems: TableRow[] = [];
      for (let i = 1; i <= count; i++) {
        newItems.push({
          id: crypto.randomUUID(),
          part: lastPart + i,
          title: '',
          url: '',
        });
      }
      return [...prev, ...newItems];
    });
    setServerErrors([]);
  }

  function updateRow(id: string, field: keyof TableRow, value: string | number) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    setServerErrors([]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setServerErrors([]);
  }

  function autoSequenceParts() {
    setRows((prev) =>
      prev.map((r, idx) => ({
        ...r,
        part: nextPartNumber + idx,
      }))
    );
    setServerErrors([]);
  }

  // Parse pasted bulk links/text into table rows
  function handleApplyPastedText() {
    if (!pasteText.trim()) {
      setIsPasteOpen(false);
      return;
    }

    const lines = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsedRows: TableRow[] = [];
    let currentPart = nextPartNumber;

    for (const line of lines) {
      // Find URL in line
      const urlMatch = line.match(/https?:\/\/[^\s,]+/i);
      if (urlMatch) {
        const url = urlMatch[0];
        let remaining = line.replace(url, '').trim();
        remaining = remaining.replace(/^[\s,:\-\t|]+|[\s,:\-\t|]+$/g, '').trim();

        let part = currentPart;
        let title = remaining;

        const partPrefixMatch = remaining.match(/^(\d+)[\.\s,\-:\t]+(.*)$/);
        if (partPrefixMatch) {
          const parsedPart = parseInt(partPrefixMatch[1], 10);
          if (!isNaN(parsedPart) && parsedPart > 0) {
            part = parsedPart;
            title = partPrefixMatch[2].trim();
          }
        }

        if (!title) {
          title = `Part ${part}`;
        }

        parsedRows.push({
          id: crypto.randomUUID(),
          part,
          title,
          url,
        });

        currentPart = Math.max(currentPart + 1, part + 1);
      }
    }

    if (parsedRows.length > 0) {
      setRows(parsedRows);
    }
    setPasteText('');
    setIsPasteOpen(false);
    setServerErrors([]);
  }

  // Submit import to server
  async function handleImportVideos() {
    if (!canImport) return;
    setBusy(true);
    setServerErrors([]);
    if (!importKey.current) importKey.current = crypto.randomUUID();

    try {
      const response = await fetch('/api/series/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csv: effectiveCsv,
          seriesId: target || undefined,
          title: newSeriesTitle.trim(),
          platform: effectivePlatform,
          importKey: importKey.current,
        }),
      });

      const body = await response.json();
      if (!response.ok || body.status !== 1) {
        setServerErrors(
          Array.isArray(body.data?.errors)
            ? body.data.errors
            : [body.message || 'Import failed. Please check your rows and try again.']
        );
        return;
      }

      onImported(body.data.seriesId, body.data.imported);
    } catch {
      setServerErrors([
        'Could not confirm the import. Refresh your series before retrying to avoid duplicate episodes.',
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Import Episodes in Bulk"
      size="xl"
      closeOnEscape={!busy}
      showCloseButton={!busy}
      icon={<Upload className="h-4 w-4 text-[#043084]" />}
      description="Add multiple video titles, part numbers, and links together at once."
    >
      <ModalBody className="space-y-4 p-4 sm:p-5">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('table');
                setServerErrors([]);
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all cursor-pointer ${
                mode === 'table'
                  ? 'bg-white text-[#043084] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <TableProperties className="h-3.5 w-3.5" />
              <span>Multi-Episode Table</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('file');
                setServerErrors([]);
              }}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-all cursor-pointer ${
                mode === 'file'
                  ? 'bg-white text-[#043084] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Upload CSV File</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#043084] hover:underline"
              title="Download standard CSV template"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV Template</span>
            </button>
          </div>
        </div>

        {/* Target Series Selector */}
        <div className="rounded-xl border border-[#e2e8f0] bg-slate-50/70 p-3.5 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label htmlFor="import-target-series" className="block text-xs font-semibold text-[#0f172a]">
              Import into series:
            </label>
            {targetSeries && (
              <span className="text-xs text-[#64748b]">
                Current: <strong className="text-[#0f172a]">{existingEpisodes.length}</strong>{' '}
                {existingEpisodes.length === 1 ? 'episode' : 'episodes'} · Next part starts at{' '}
                <strong className="text-[#043084]">#{nextPartNumber}</strong>
              </span>
            )}
          </div>

          <select
            id="import-target-series"
            className={fieldClass}
            disabled={busy}
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setServerErrors([]);
              importKey.current = '';
            }}
          >
            <option value="">+ Create a new series</option>
            {series.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.seasons.reduce((s, sea) => s + sea.episodes.length, 0)} episodes)
              </option>
            ))}
          </select>

          {/* Platform Requirement indicator for existing series */}
          {target && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
              <span className="text-[#64748b] font-medium">Platform validation:</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md border text-xs ${
                  effectivePlatform === 'YouTube'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : effectivePlatform === 'Instagram'
                    ? 'bg-pink-50 text-pink-700 border-pink-200'
                    : effectivePlatform === 'Facebook'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {effectivePlatform === 'YouTube' && <YoutubeIcon className="h-3 w-3 text-red-500" />}
                {effectivePlatform === 'Instagram' && <InstagramIcon className="h-3 w-3 text-pink-500" />}
                {effectivePlatform === 'Facebook' && <FacebookIcon className="h-3 w-3 text-blue-600" />}
                {effectivePlatform !== 'YouTube' &&
                  effectivePlatform !== 'Instagram' &&
                  effectivePlatform !== 'Facebook' && <Globe className="h-3 w-3 text-emerald-600" />}
                <span>
                  {effectivePlatform === 'Mix' || effectivePlatform === 'Other'
                    ? 'Mix: All Links Allowed'
                    : `Only ${effectivePlatform} Links Allowed`}
                </span>
              </span>
            </div>
          )}

          {!target && (
            <div className="space-y-3 pt-1 border-t border-[#e2e8f0]/80">
              <div className="space-y-1">
                <label htmlFor="import-new-series-title" className="block text-xs font-medium text-[#0f172a]">
                  New series title <span className="text-red-500">*</span>
                </label>
                <input
                  id="import-new-series-title"
                  className={fieldClass}
                  value={newSeriesTitle}
                  maxLength={255}
                  disabled={busy}
                  placeholder="e.g. Masterclass on Film Making"
                  onChange={(e) => {
                    setNewSeriesTitle(e.target.value);
                    setServerErrors([]);
                    importKey.current = '';
                  }}
                />
              </div>

              {/* Platform selector for new series */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#0f172a]">
                    Platform Requirement
                  </label>
                  <span className="text-[11px] text-[#64748b]">
                    {newSeriesPlatform === 'Mix'
                      ? 'Allows links from any platform'
                      : `Only allows ${newSeriesPlatform} links`}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['YouTube', 'Instagram', 'Facebook', 'Mix'] as EpisodePlatform[]).map((p) => {
                    const isSelected = newSeriesPlatform === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewSeriesPlatform(p)}
                        className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-[#043084] bg-[#043084]/[0.06] text-[#043084] ring-1 ring-[#043084]'
                            : 'border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]'
                        }`}
                      >
                        {p === 'YouTube' && <YoutubeIcon className="h-3.5 w-3.5 text-red-500" />}
                        {p === 'Instagram' && <InstagramIcon className="h-3.5 w-3.5 text-pink-500" />}
                        {p === 'Facebook' && <FacebookIcon className="h-3.5 w-3.5 text-blue-600" />}
                        {p === 'Mix' && <Globe className="h-3.5 w-3.5 text-[#043084]" />}
                        <span>{p === 'Mix' ? 'Mix (All)' : p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TAB 1: Quick Multi-Episode Table */}
        {mode === 'table' && (
          <div className="space-y-3">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => addRow(1)}
                  disabled={busy}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-xs font-semibold text-[#0f172a] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-[#043084]" />
                  <span>Add Row</span>
                </button>
                <button
                  type="button"
                  onClick={() => addRow(3)}
                  disabled={busy}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-xs font-semibold text-[#0f172a] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-[#043084]" />
                  <span>+3 Rows</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasteOpen(!isPasteOpen)}
                  className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                    isPasteOpen
                      ? 'border-[#043084] bg-[#043084]/5 text-[#043084]'
                      : 'border-[#e2e8f0] bg-white text-[#0f172a] hover:bg-slate-50'
                  }`}
                >
                  <ClipboardPaste className="h-3.5 w-3.5 text-[#043084]" />
                  <span>Paste Links</span>
                </button>
                <button
                  type="button"
                  onClick={autoSequenceParts}
                  title="Re-number parts sequentially"
                  className="hidden md:inline-flex h-8 items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-2 text-xs font-medium text-[#64748b] hover:text-[#0f172a] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Auto-number
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadCurrentTableCsv}
                  disabled={rows.every((r) => !r.title && !r.url)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-xs font-medium text-[#475569] hover:text-[#0f172a] hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
                  title="Export this table as a .csv file"
                >
                  <FileDown className="h-3.5 w-3.5 text-[#64748b]" />
                  <span>Save as CSV</span>
                </button>
              </div>
            </div>

            {/* Quick Paste Dropdown / Popover */}
            {isPasteOpen && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#043084]">
                    Paste Multiple Video Links or Lines
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPasteOpen(false)}
                    className="text-[#64748b] hover:text-[#0f172a]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[11px] text-[#475569]">
                  {effectivePlatform !== 'Mix' && effectivePlatform !== 'Other'
                    ? `⚠️ Note: This series is configured for ${effectivePlatform}. Please paste ${effectivePlatform} links only.`
                    : 'Paste links from YouTube, Instagram, Facebook or other sources line-by-line.'}
                </p>
                <textarea
                  rows={4}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={
                    effectivePlatform === 'YouTube'
                      ? `https://www.youtube.com/watch?v=VIDEO_1\nhttps://youtu.be/VIDEO_2\nEpisode 3, https://www.youtube.com/watch?v=VIDEO_3`
                      : effectivePlatform === 'Instagram'
                      ? `https://www.instagram.com/reel/REEL_1/\nhttps://www.instagram.com/reel/REEL_2/`
                      : effectivePlatform === 'Facebook'
                      ? `https://www.facebook.com/watch/?v=123456\nhttps://fb.watch/xyz/`
                      : `https://www.youtube.com/watch?v=VIDEO_1\nhttps://www.instagram.com/reel/REEL_2/`
                  }
                  className="w-full rounded-lg border border-blue-200 bg-white p-2.5 font-mono text-xs text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043084]/20"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPasteOpen(false)}
                    className="px-2.5 py-1 text-xs text-[#64748b] hover:text-[#0f172a]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyPastedText}
                    disabled={!pasteText.trim()}
                    className="rounded-lg bg-[#043084] px-3 py-1 text-xs font-semibold text-white hover:bg-brand-hover disabled:opacity-50"
                  >
                    Populate Rows
                  </button>
                </div>
              </div>
            )}

            {/* Table Rows */}
            <div className="max-h-[340px] overflow-y-auto overflow-x-auto rounded-xl border border-[#e2e8f0] bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-[#e2e8f0] z-10">
                  <tr>
                    <th className="w-20 py-2.5 px-3 font-semibold text-[#475569]">Part #</th>
                    <th className="py-2.5 px-3 font-semibold text-[#475569]">Episode Title</th>
                    <th className="py-2.5 px-3 font-semibold text-[#475569]">Video / Content Link</th>
                    <th className="w-10 py-2.5 px-2 text-center font-semibold text-[#475569]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {rows.map((row) => {
                    const badge = getPlatformBadge(row.url);
                    const isLinkValidForPlatform =
                      !row.url.trim() || isUrlAllowedForPlatform(row.url.trim(), effectivePlatform);

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 px-3 align-top">
                          <input
                            type="number"
                            min={1}
                            disabled={busy}
                            value={row.part}
                            onChange={(e) => updateRow(row.id, 'part', parseInt(e.target.value, 10) || 1)}
                            className="w-16 rounded-md border border-[#cbd5e1] px-2 py-1.5 font-mono text-xs font-semibold text-[#0f172a] focus:border-[#043084] focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 align-top">
                          <input
                            type="text"
                            disabled={busy}
                            value={row.title}
                            placeholder={`e.g. Part ${row.part}: Introduction`}
                            onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                            className="w-full rounded-md border border-[#cbd5e1] px-2.5 py-1.5 text-xs text-[#0f172a] placeholder:text-slate-400 focus:border-[#043084] focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 align-top">
                          <div className="space-y-1">
                            <div className="relative flex items-center">
                              <input
                                type="url"
                                disabled={busy}
                                value={row.url}
                                placeholder={
                                  effectivePlatform === 'YouTube'
                                    ? 'Paste YouTube link (youtube.com / youtu.be)'
                                    : effectivePlatform === 'Instagram'
                                    ? 'Paste Instagram link (instagram.com/reel)'
                                    : effectivePlatform === 'Facebook'
                                    ? 'Paste Facebook link (facebook.com / fb.watch)'
                                    : 'Paste YouTube, Instagram reel or Facebook link'
                                }
                                onChange={(e) => updateRow(row.id, 'url', e.target.value)}
                                className={`w-full rounded-md border px-2.5 py-1.5 text-xs text-[#0f172a] placeholder:text-slate-400 focus:outline-none transition-colors ${
                                  !isLinkValidForPlatform
                                    ? 'border-red-400 bg-red-50/20 focus:border-red-500 ring-1 ring-red-400'
                                    : 'border-[#cbd5e1] focus:border-[#043084]'
                                }`}
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {badge}
                              {!isLinkValidForPlatform && (
                                <span className="text-[11px] font-medium text-red-600">
                                  ⚠️ Only {effectivePlatform} links allowed
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 align-top text-center">
                          <button
                            type="button"
                            disabled={busy || rows.length <= 1}
                            onClick={() => removeRow(row.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#94a3b8] hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-[#64748b]">
              <span>
                {parseResult.episodes.length} valid{' '}
                {parseResult.episodes.length === 1 ? 'episode' : 'episodes'} detected in table
              </span>
              <span>
                {effectivePlatform === 'Mix' || effectivePlatform === 'Other'
                  ? 'All platforms allowed'
                  : `Only ${effectivePlatform} links accepted`}
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: Upload CSV File */}
        {mode === 'file' && (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 text-xs text-slate-600 space-y-2">
              <p>
                Download the template, fill it in Excel or Google Sheets, then save as{' '}
                <strong className="text-slate-800">CSV UTF-8</strong>. Use one video per row and a unique positive
                part number.
              </p>
              <p>
                Headers: <code>title,part_number,url</code> · Up to 500 videos / 1 MB per file.
              </p>
              {effectivePlatform !== 'Mix' && effectivePlatform !== 'Other' && (
                <p className="text-amber-700 font-medium">
                  ⚠️ Note: Every link in this CSV must be from <strong>{effectivePlatform}</strong>.
                </p>
              )}
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1.5 font-semibold text-[#043084] hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download standard CSV template</span>
              </button>
            </div>

            <label className="block space-y-1.5 text-xs font-semibold text-[#0f172a]">
              <span>Choose CSV file</span>
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={busy}
                className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-[#043084]/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#043084] cursor-pointer`}
                onChange={(event) => {
                  void handleFileSelected(event.target.files?.[0]);
                }}
              />
            </label>

            {reading && <p className="text-xs text-slate-500">Reading CSV file…</p>}

            {Boolean(parseResult.episodes.length) && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#0f172a]">
                  Preview · {parseResult.episodes.length} videos detected · {fileName}
                </p>
                <div className="max-h-56 overflow-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-16">Part</th>
                        <th className="p-2">Title</th>
                        <th className="p-2">Link</th>
                        <th className="p-2 w-24">Platform</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.episodes.map((ep) => {
                        const isMatch = isUrlAllowedForPlatform(ep.externalUrl, effectivePlatform);
                        return (
                          <tr
                            key={ep.row}
                            className={!isMatch ? 'bg-red-50/60' : undefined}
                          >
                            <td className="p-2 font-mono font-semibold">{ep.episodeNumber}</td>
                            <td className="p-2 break-words">{ep.title}</td>
                            <td className="p-2">
                              <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                  {(() => {
                                    try {
                                      return new URL(ep.externalUrl).hostname.replace(/^www\./, "");
                                    } catch {
                                      return "link";
                                    }
                                  })()}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono truncate max-w-[130px]">
                                  {(() => {
                                    try {
                                      const u = new URL(ep.externalUrl);
                                      return u.pathname.length > 15 ? u.pathname.slice(0, 15) + "..." : u.pathname;
                                    } catch {
                                      return "";
                                    }
                                  })()}
                                </span>
                              </span>
                            </td>
                            <td className="p-2">
                              {!isMatch ? (
                                <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                  Not {effectivePlatform}
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-600">
                                  {ep.platform}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Issues / Error Banner */}
        {allIssues.length > 0 && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>Review before importing:</span>
            </div>
            <ul className="list-disc pl-5 max-h-32 overflow-auto space-y-0.5">
              {allIssues.slice(0, 20).map((issue, idx) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
            {allIssues.length > 20 && (
              <p className="text-[11px] text-red-700">And {allIssues.length - 20} more issues to resolve.</p>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter className="px-4 sm:px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="inline-flex h-9 items-center rounded-lg px-3.5 text-xs sm:text-sm font-medium text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleImportVideos()}
          disabled={!canImport}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#043084] px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-brand-hover cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>
            {busy
              ? 'Importing…'
              : parseResult.episodes.length > 0
              ? `Import ${parseResult.episodes.length} Episodes`
              : 'Import Episodes'}
          </span>
        </button>
      </ModalFooter>
    </Modal>
  );
}
