/** CSV shared by the preview and server. Never evaluate spreadsheet formulas. */
export const MAX_CSV_BYTES = 1024 * 1024;
export const MAX_IMPORT_ROWS = 500;
export const SERIES_CSV_TEMPLATE = '\uFEFFtitle,part_number,url\r\nIntroduction,1,https://www.youtube.com/watch?v=VIDEO_ID_1\r\n"Tips, tricks and examples",2,https://www.youtube.com/watch?v=VIDEO_ID_2\r\n';

export interface CsvEpisode {
  row: number;
  title: string;
  episodeNumber: number;
  externalUrl: string;
  platform: 'YouTube' | 'Instagram' | 'Facebook' | 'Other';
}
export interface CsvResult { episodes: CsvEpisode[]; errors: string[] }

export function canonicalVideoUrl(value: string): string {
  const url = new URL(value);
  url.hash = '';
  return url.href;
}

export function parseSeriesCsv(input: string): CsvResult {
  const fail = (message: string): CsvResult => ({ episodes: [], errors: [message] });
  if (new TextEncoder().encode(input).length > MAX_CSV_BYTES) return fail('CSV must be 1 MB or smaller.');
  const text = input.replace(/^\uFEFF/, '');
  // Excel may export semicolon-separated CSV in some locales.
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delimiter = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';
  const records: { cells: string[]; line: number }[] = [];
  let cells: string[] = [], field = '', quoted = false, closed = false, line = 1, start = 1;
  const pushRow = () => {
    cells.push(field);
    if (cells.some(cell => cell.trim())) records.push({ cells, line: start });
    cells = []; field = ''; closed = false;
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; closed = true; }
      } else { field += ch; if (ch === '\n') line++; }
    } else if (ch === delimiter) {
      cells.push(field); field = ''; closed = false;
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      pushRow(); line++; start = line;
    } else if (ch === '"' && field === '' && !closed) {
      quoted = true;
    } else if (ch === '"' || (closed && ch.trim())) {
      return fail(`Row ${line}: invalid CSV quoting. Export the sheet as CSV UTF-8 and try again.`);
    } else if (!closed) field += ch;
  }
  if (quoted) return fail(`Row ${start}: missing closing quote.`);
  pushRow();
  if (records.length < 2) return fail('Add a header and at least one video row.');
  if (records.length - 1 > MAX_IMPORT_ROWS) return fail(`Import up to ${MAX_IMPORT_ROWS} videos at a time.`);
  const aliases: Record<string, string> = {
    title: 'title', video_title: 'title', episode_title: 'title',
    part_number: 'part', part: 'part', order: 'part', order_number: 'part', episode_number: 'part',
    url: 'url', link: 'url', video_url: 'url', video_link: 'url',
  };
  const headers = records[0].cells.map(cell => aliases[cell.trim().toLowerCase().replace(/[\s-]+/g, '_')] || '');
  if (['title', 'part', 'url'].some(key => headers.filter(header => header === key).length !== 1)) {
    return fail('CSV needs exactly one title, part_number (or order_number), and url (or link) column.');
  }
  const errors: string[] = [], episodes: CsvEpisode[] = [];
  const parts = new Set<number>(), urls = new Set<string>();
  for (const record of records.slice(1)) {
    const rowErrors: string[] = [];
    const get = (key: string) => (record.cells[headers.indexOf(key)] || '').trim();
    const title = get('title'), part = get('part'), externalUrl = get('url');
    const episodeNumber = Number(part);
    if (record.cells.length !== headers.length) rowErrors.push('column count does not match header');
    if (!title || Array.from(title).length > 255) rowErrors.push('title must be 1–255 characters');
    if (!/^\d+$/.test(part) || !Number.isSafeInteger(episodeNumber) || episodeNumber < 1 || episodeNumber > 2147483647) rowErrors.push('part number must be a positive whole number');
    else if (parts.has(episodeNumber)) rowErrors.push(`duplicate part number ${episodeNumber}`);
    else parts.add(episodeNumber);
    let platform: CsvEpisode['platform'] = 'Other';
    try {
      const url = new URL(externalUrl);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || externalUrl.length > 2048) throw new Error();
      const canonical = canonicalVideoUrl(externalUrl);
      if (urls.has(canonical)) rowErrors.push('duplicate video link');
      urls.add(canonical);
      const host = url.hostname.toLowerCase();
      const isHost = (domain: string) => host === domain || host.endsWith(`.${domain}`);
      if (isHost('youtube.com') || isHost('youtu.be')) platform = 'YouTube';
      else if (isHost('instagram.com')) platform = 'Instagram';
      else if (isHost('facebook.com') || isHost('fb.watch')) platform = 'Facebook';
    } catch { rowErrors.push('use a valid http:// or https:// video link'); }
    errors.push(...rowErrors.map(error => `Row ${record.line}: ${error}.`));
    if (!rowErrors.length) episodes.push({ row: record.line, title, episodeNumber, externalUrl, platform });
  }
  return { episodes: episodes.sort((a, b) => a.episodeNumber - b.episodeNumber), errors };
}

export function existingEpisodeConflicts(episodes: CsvEpisode[], existing: { episodeNumber: number; externalUrl: string }[]): string[] {
  const parts = new Set(existing.map(ep => Number(ep.episodeNumber)));
  const urls = new Set(existing.map(ep => { try { return canonicalVideoUrl(ep.externalUrl); } catch { return ep.externalUrl; } }));
  return episodes.flatMap(ep => {
    const errors: string[] = [];
    if (parts.has(ep.episodeNumber)) errors.push(`Row ${ep.row}: part ${ep.episodeNumber} already exists in this series.`);
    if (urls.has(canonicalVideoUrl(ep.externalUrl))) errors.push(`Row ${ep.row}: video link already exists in this series.`);
    return errors;
  });
}

export function episodesToCsv(episodes: { episodeNumber: number; title: string; externalUrl: string }[]): string {
  const lines = ['title,part_number,url'];
  for (const ep of episodes) {
    const titleEscaped = `"${(ep.title || '').replace(/"/g, '""')}"`;
    lines.push(`${titleEscaped},${ep.episodeNumber},${(ep.externalUrl || '').trim()}`);
  }
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

export function detectUrlPlatform(externalUrl: string): 'YouTube' | 'Instagram' | 'Facebook' | 'Other' {
  try {
    const url = new URL(externalUrl);
    const host = url.hostname.toLowerCase();
    const isHost = (domain: string) => host === domain || host.endsWith(`.${domain}`);
    if (isHost('youtube.com') || isHost('youtu.be')) return 'YouTube';
    if (isHost('instagram.com')) return 'Instagram';
    if (isHost('facebook.com') || isHost('fb.watch')) return 'Facebook';
    return 'Other';
  } catch {
    return 'Other';
  }
}

export function isUrlAllowedForPlatform(externalUrl: string, allowedPlatform?: string | null): boolean {
  if (!allowedPlatform) return true;
  const p = allowedPlatform.trim().toLowerCase();
  if (p === 'mix' || p === 'other' || p === 'all' || p === 'multi-platform' || p === '') return true;

  const detected = detectUrlPlatform(externalUrl);
  if (p === 'youtube') return detected === 'YouTube';
  if (p === 'instagram') return detected === 'Instagram';
  if (p === 'facebook') return detected === 'Facebook';

  return true;
}

export function getPlatformRequirementMessage(platform?: string | null): string {
  if (!platform) return '';
  const p = platform.trim().toLowerCase();
  if (p === 'youtube') return 'Only YouTube links (youtube.com or youtu.be) are allowed.';
  if (p === 'instagram') return 'Only Instagram links (instagram.com) are allowed.';
  if (p === 'facebook') return 'Only Facebook video links (facebook.com or fb.watch) are allowed.';
  if (p === 'mix' || p === 'other') return 'Any video link is allowed (YouTube, Instagram, Facebook, etc.).';
  return '';
}

export function validateEpisodePlatform(episodes: CsvEpisode[], allowedPlatform?: string | null): string[] {
  if (!allowedPlatform) return [];
  const p = allowedPlatform.trim().toLowerCase();
  if (p === 'mix' || p === 'other' || p === 'all' || p === 'multi-platform' || p === '') return [];

  const errors: string[] = [];
  for (const ep of episodes) {
    if (!isUrlAllowedForPlatform(ep.externalUrl, allowedPlatform)) {
      errors.push(`Row ${ep.row}: Only ${allowedPlatform} links are allowed for this series. (Found ${ep.platform} link)`);
    }
  }
  return errors;
}
