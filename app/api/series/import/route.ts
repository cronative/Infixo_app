import { createHash, randomUUID } from 'crypto';
import type { RowDataPacket } from 'mysql2';
import { db } from '@/lib/db';
import { requireCreator } from '@/lib/creatorAuth';
import { apiError, apiSuccess } from '@/lib/apiResponse';
import { parseSeriesCsv, existingEpisodeConflicts, validateEpisodePlatform, MAX_CSV_BYTES } from '@/lib/seriesCsv';
import { getPlanQuota } from '@/services/subscriptionLimits';

export async function POST(req: Request) {
  try {
    const auth = await requireCreator(req);
    if (auth.error) return auth.error;
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > MAX_CSV_BYTES * 2) return apiError('Import is too large.', 413);
    let body;
    try { body = JSON.parse(raw); } catch { return apiError('Invalid import request.', 400); }
    if (!body || typeof body.csv !== 'string') return apiError('A CSV file is required.', 400);
    const parsed = parseSeriesCsv(body.csv);
    if (parsed.errors.length) return apiError('Fix the CSV errors before importing.', 400, { errors: parsed.errors });
    const seriesId = typeof body.seriesId === 'string' ? body.seriesId.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!seriesId && (!title || Array.from(title).length > 255)) return apiError('Enter a series title (1–255 characters).', 400);

    if (!seriesId && (typeof body.importKey !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.importKey))) return apiError('Invalid import identifier.', 400);
    // A retry of a new-series import uses the same ID and cannot create a second series.
    const targetId = seriesId || `ser_${createHash('sha256').update(`${auth.creator.id}:${body.importKey}`).digest('hex').slice(0, 48)}`;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      // Ensure platform column supports varchar if altered
      await connection.query("ALTER TABLE series MODIFY COLUMN platform VARCHAR(50) NOT NULL DEFAULT 'YouTube'").catch(() => {});
      // Serialize imports for this creator; limits and duplicate checks use current DB state.
      await connection.query('SELECT id FROM creators WHERE id = ? FOR UPDATE', [auth.creator.id]);
      if (!seriesId) {
        const [previous] = await connection.query<RowDataPacket[]>('SELECT id FROM series WHERE id = ? AND creator_id = ?', [targetId, auth.creator.id]);
        if (previous.length) {
          await connection.rollback();
          return apiSuccess({ seriesId: targetId, imported: parsed.episodes.length }, 'This import was already saved.');
        }
      }
      const [subs] = await connection.query<RowDataPacket[]>(
        "SELECT plan_key FROM subscriptions WHERE creator_id = ? AND status IN ('active', 'trial') ORDER BY updated_at DESC LIMIT 1", [auth.creator.id]);
      const quota = getPlanQuota(subs[0]?.plan_key || 'early_access');

      let seriesPlatform = typeof body.platform === 'string' ? body.platform.trim() : '';
      if (seriesId) {
        const [owned] = await connection.query<RowDataPacket[]>('SELECT id, platform FROM series WHERE id = ? AND creator_id = ? FOR UPDATE', [seriesId, auth.creator.id]);
        if (!owned.length) { await connection.rollback(); return apiError('Series not found.', 404); }
        if (owned[0]?.platform) seriesPlatform = owned[0].platform;
      }

      // Enforce platform validation (YouTube only, Instagram only, Facebook only; Mix allows all)
      if (seriesPlatform && seriesPlatform !== 'Mix' && seriesPlatform !== 'Other') {
        const platformErrors = validateEpisodePlatform(parsed.episodes, seriesPlatform);
        if (platformErrors.length) {
          await connection.rollback();
          return apiError(`Links do not match the ${seriesPlatform} series platform requirement.`, 400, { errors: platformErrors });
        }
      }

      const [allSeries] = await connection.query<RowDataPacket[]>('SELECT id FROM series WHERE creator_id = ?', [auth.creator.id]);
      const [existing] = await connection.query<RowDataPacket[]>(
        'SELECT e.series_id, e.episode_number, e.external_url FROM episodes e INNER JOIN series s ON s.id = e.series_id WHERE s.creator_id = ?', [auth.creator.id]);
      const targetEpisodes = existing.filter(ep => ep.series_id === seriesId);
      const conflicts = existingEpisodeConflicts(parsed.episodes, targetEpisodes.map(ep => ({ episodeNumber: ep.episode_number, externalUrl: ep.external_url })));
      if (conflicts.length) { await connection.rollback(); return apiError('No videos imported. Resolve existing parts or links first.', 409, { errors: conflicts }); }
      if ((!seriesId && allSeries.length >= quota.maxSeries) || targetEpisodes.length + parsed.episodes.length > quota.maxEpisodesPerSeries || existing.length + parsed.episodes.length > quota.maxTotalEpisodes) {
        await connection.rollback();
        return apiError(`Import exceeds your ${quota.name} plan limits (${quota.maxSeries} series, ${quota.maxEpisodesPerSeries} parts per series, ${quota.maxTotalEpisodes} total parts). Reduce the file or upgrade your plan.`, 403);
      }
      if (!seriesId) await connection.query('INSERT INTO series (id, creator_id, title, platform) VALUES (?, ?, ?, ?)', [targetId, auth.creator.id, title, seriesPlatform]);
      await connection.query('INSERT INTO episodes (id, series_id, episode_number, title, external_url, platform) VALUES ?', [parsed.episodes.map(ep => [`ep_${randomUUID()}`, targetId, ep.episodeNumber, ep.title, ep.externalUrl, ep.platform])]);
      await connection.commit();
      return apiSuccess({ seriesId: targetId, imported: parsed.episodes.length }, 'Videos imported successfully.');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
  } catch (error) {
    console.error('CSV import failed:', error);
    return apiError('Import could not be completed. Refresh the series before retrying to check whether it was saved.', 500);
  }
}
