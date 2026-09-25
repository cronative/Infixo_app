/* eslint-disable @typescript-eslint/no-require-imports -- Node test harness loads TypeScript without adding a runtime dependency. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(relative, mocks = {}) {
  const file = path.resolve(__dirname, '..', relative);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
const csv = load('lib/seriesCsv.ts');
const quotas = load('services/subscriptionLimits.ts');
const sample = 'title,part_number,url\nSecond,2,https://youtu.be/two\nFirst,1,https://instagram.com/reel/one';

test('Excel BOM, quoted commas, escaped quotes, multiline titles and part ordering', () => {
  const result = csv.parseSeriesCsv('\uFEFFtitle,part_number,url\r\n"Hello, ""world""",2,https://youtu.be/two\r\n"पहला\nवीडियो",1,https://instagram.com/reel/one\r\n');
  assert.deepEqual(result.errors, []);
  assert.equal(result.episodes[0].title, 'पहला\nवीडियो');
  assert.equal(result.episodes[1].title, 'Hello, "world"');
  assert.equal(result.episodes[0].platform, 'Instagram');
});
test('Excel semicolons and friendly header aliases', () => {
  const result = csv.parseSeriesCsv('Title;Order Number;Link\r\nVideo;3;https://facebook.com/watch/one');
  assert.equal(result.errors.length, 0);
  assert.equal(result.episodes[0].episodeNumber, 3);
});
test('reject malformed quoting, missing headers, invalid parts and unsafe links', () => {
  for (const input of ['title,part_number,url\n"unfinished,1,https://x.com', 'a,b,c\n1,2,3', 'title,part_number,url\nBad,0,javascript:alert(1)', 'title,part_number,url\nBad,1.2,https://x.com', 'title,part_number,url\nBad,1,https://user:pass@example.com']) {
    assert.ok(csv.parseSeriesCsv(input).errors.length, input);
  }
});
test('duplicates in file, existing parts and links are detected', () => {
  assert.ok(csv.parseSeriesCsv(sample + '\nDuplicate,2,https://youtu.be/two#fragment').errors.length >= 2);
  const parsed = csv.parseSeriesCsv(sample);
  assert.equal(csv.existingEpisodeConflicts(parsed.episodes, [{ episodeNumber: 1, externalUrl: 'https://youtu.be/two' }]).length, 2);
});
test('blank rows ignored; file and row limits enforced', () => {
  assert.equal(csv.parseSeriesCsv(sample + '\n,,\n').episodes.length, 2);
  assert.ok(csv.parseSeriesCsv('x'.repeat(csv.MAX_CSV_BYTES + 1)).errors.length);
  const rows = Array.from({ length: 501 }, (_, i) => `Video,${i + 1},https://example.com/${i}`).join('\n');
  assert.match(csv.parseSeriesCsv('title,part_number,url\n' + rows).errors[0], /500/);
});

function setup(options = {}) {
  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push('begin'),
    commit: async () => calls.push('commit'),
    rollback: async () => calls.push('rollback'),
    release: () => calls.push('release'),
    query: async (sql, values) => {
      calls.push({ sql, values });
      if (sql.startsWith('SELECT id FROM creators')) return [[{ id: 'creator' }]];
      if (sql.includes('FROM subscriptions')) return [[{ plan_key: options.plan || 'pro' }]];
      if (sql.includes('FROM series WHERE id')) return [options.owned === false ? [] : options.replay || values[0] === 'existing' ? [{ id: values[0] }] : []];
      if (sql.includes('FROM series WHERE creator_id')) return [[{ id: 'existing' }]];
      if (sql.includes('FROM episodes e')) return [options.existing || []];
      if (sql.startsWith('INSERT INTO episodes') && options.insertFails) throw new Error('Simulated DB failure');
      return [{}];
    },
  };
  const route = load('app/api/series/import/route.ts', {
    '@/lib/db': { db: { getConnection: async () => connection } },
    '@/lib/creatorAuth': { requireCreator: async () => options.unauthorized ? { error: { status: 401 } } : { creator: { id: 'creator' } } },
    '@/lib/apiResponse': { apiError: (message, status, data) => ({ message, status, data }), apiSuccess: data => ({ status: 200, data }) },
    '@/lib/seriesCsv': csv,
    '@/services/subscriptionLimits': quotas,
  });
  return { calls, run: (body = {}) => route.POST(new Request('http://localhost/api/series/import', { method: 'POST', body: JSON.stringify({ csv: sample, seriesId: 'existing', ...body }) })) };
}
test('authentication and ownership required', async () => {
  const denied = setup({ unauthorized: true });
  assert.equal((await denied.run()).status, 401); assert.equal(denied.calls.length, 0);
  const foreign = setup({ owned: false });
  assert.equal((await foreign.run()).status, 404); assert.ok(foreign.calls.includes('rollback'));
  assert.ok(!foreign.calls.some(call => call.sql?.startsWith('INSERT')));
});
test('valid import commits sorted episodes in one bulk insert', async () => {
  const ctx = setup(); assert.equal((await ctx.run()).status, 200);
  const insert = ctx.calls.find(call => call.sql?.startsWith('INSERT INTO episodes'));
  assert.equal(insert.values[0][0][2], 1); assert.equal(insert.values[0].length, 2);
  assert.ok(ctx.calls.includes('commit')); assert.ok(ctx.calls.includes('release'));
});
test('new series and videos are created atomically; retries do not create duplicates', async () => {
  const ctx = setup(); assert.equal((await ctx.run({ seriesId: undefined, title: 'Tutorials', importKey: 'test-key' })).status, 200);
  assert.ok(ctx.calls.some(call => call.sql?.startsWith('INSERT INTO series')));
  const replay = setup({ replay: true });
  assert.equal((await replay.run({ seriesId: undefined, title: 'Tutorials', importKey: 'test-key' })).status, 200);
  assert.ok(!replay.calls.some(call => call.sql?.startsWith('INSERT')));
});
test('server rejects quota overflow and duplicates before writing', async () => {
  const existing = Array.from({ length: 4 }, (_, i) => ({ series_id: 'existing', episode_number: i + 10, external_url: `https://example.com/${i}` }));
  const limited = setup({ plan: 'starter', existing }); assert.equal((await limited.run()).status, 403);
  const duplicate = setup({ existing: [{ series_id: 'existing', episode_number: 1, external_url: 'https://example.com/x' }] });
  assert.equal((await duplicate.run()).status, 409);
  for (const ctx of [limited, duplicate]) assert.ok(!ctx.calls.some(call => call.sql?.startsWith('INSERT')));
});
test('failed episode insert rolls back new series too', async () => {
  const ctx = setup({ insertFails: true });
  const original = console.error; console.error = () => {};
  try { assert.equal((await ctx.run({ seriesId: undefined, title: 'Tutorials', importKey: 'test-key' })).status, 500); }
  finally { console.error = original; }
  assert.ok(ctx.calls.includes('rollback')); assert.ok(!ctx.calls.includes('commit')); assert.ok(ctx.calls.includes('release'));
});

test('platform URL restrictions for YouTube, Instagram, Facebook and Mix', () => {
  // YouTube checks
  assert.equal(csv.isUrlAllowedForPlatform('https://www.youtube.com/watch?v=abc', 'YouTube'), true);
  assert.equal(csv.isUrlAllowedForPlatform('https://youtu.be/abc', 'YouTube'), true);
  assert.equal(csv.isUrlAllowedForPlatform('https://instagram.com/reel/abc', 'YouTube'), false);
  assert.equal(csv.isUrlAllowedForPlatform('https://facebook.com/watch?v=123', 'YouTube'), false);

  // Instagram checks
  assert.equal(csv.isUrlAllowedForPlatform('https://www.instagram.com/reel/abc', 'Instagram'), true);
  assert.equal(csv.isUrlAllowedForPlatform('https://instagram.com/p/abc', 'Instagram'), true);
  assert.equal(csv.isUrlAllowedForPlatform('https://youtu.be/abc', 'Instagram'), false);

  // Facebook checks
  assert.equal(csv.isUrlAllowedForPlatform('https://www.facebook.com/watch/?v=123', 'Facebook'), true);
  assert.equal(csv.isUrlAllowedForPlatform('https://fb.watch/abc', 'Facebook'), true);
  assert.equal(csv.isUrlAllowedForPlatform('https://youtu.be/abc', 'Facebook'), false);

  // Mix / Other checks (all allowed)
  assert.equal(csv.isUrlAllowedForPlatform('https://youtu.be/abc', 'Mix'), true);
  assert.equal(csv.isUrlAllowedForPlatform('https://instagram.com/reel/abc', 'Mix'), true);
  assert.equal(csv.isUrlAllowedForPlatform('https://facebook.com/watch?v=123', 'Mix'), true);
  assert.equal(csv.isUrlAllowedForPlatform('https://example.com/video.mp4', 'Mix'), true);

  // validateEpisodePlatform helper
  const parsed = csv.parseSeriesCsv('title,part_number,url\nPart 1,1,https://youtu.be/one\nPart 2,2,https://instagram.com/reel/two');
  assert.equal(csv.validateEpisodePlatform(parsed.episodes, 'YouTube').length, 1);
  assert.equal(csv.validateEpisodePlatform(parsed.episodes, 'Instagram').length, 1);
  assert.equal(csv.validateEpisodePlatform(parsed.episodes, 'Mix').length, 0);
});
