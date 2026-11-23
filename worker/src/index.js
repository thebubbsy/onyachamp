// Download counter for onyachamp.com/resources.html, backed by Cloudflare D1.
//
//   GET  /api/downloads/stats  -> { total, last30, files: { [id]: count } }
//   POST /api/downloads/hit    -> body { id }, records one download for today
//
// Only ids listed in the site's data/resources.json are accepted, so the table
// can't be filled with arbitrary keys. No IPs or user data are stored.

const ALLOWED_ORIGINS = new Set(['https://onyachamp.com', 'https://www.onyachamp.com']);
const MANIFEST_TTL_MS = 10 * 60 * 1000;

let manifestIds = null;
let manifestFetchedAt = 0;

async function knownIds(env) {
  if (manifestIds && Date.now() - manifestFetchedAt < MANIFEST_TTL_MS) return manifestIds;
  const res = await fetch(env.MANIFEST_URL, { cf: { cacheTtl: 300 } });
  if (!res.ok) {
    if (manifestIds) return manifestIds;
    throw new Error(`manifest fetch failed: ${res.status}`);
  }
  const manifest = await res.json();
  manifestIds = new Set(manifest.groups.flatMap(g => g.files.map(f => f.id)));
  manifestFetchedAt = Date.now();
  return manifestIds;
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...extra },
  });
}

async function stats(env) {
  const since = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const [perFile, recent] = await env.DB.batch([
    env.DB.prepare('SELECT id, SUM(count) AS n FROM downloads GROUP BY id'),
    env.DB.prepare('SELECT COALESCE(SUM(count), 0) AS n FROM downloads WHERE day >= ?').bind(since),
  ]);
  const files = {};
  let total = 0;
  for (const row of perFile.results) {
    files[row.id] = row.n;
    total += row.n;
  }
  return json({ total, last30: recent.results[0].n, files }, 200, { 'cache-control': 'public, max-age=30' });
}

async function hit(request, env) {
  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: 'forbidden' }, 403);

  let id;
  try {
    ({ id } = await request.json());
  } catch {
    return json({ error: 'bad request' }, 400);
  }
  if (typeof id !== 'string' || id.length > 300) return json({ error: 'bad request' }, 400);
  if (!(await knownIds(env)).has(id)) return json({ error: 'unknown file' }, 404);

  const day = new Date().toISOString().slice(0, 10);
  await env.DB.prepare(
    'INSERT INTO downloads (id, day, count) VALUES (?, ?, 1) ' +
    'ON CONFLICT (id, day) DO UPDATE SET count = count + 1'
  ).bind(id, day).run();
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/downloads/stats' && request.method === 'GET') return await stats(env);
      if (pathname === '/api/downloads/hit' && request.method === 'POST') return await hit(request, env);
      return json({ error: 'not found' }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: 'server error' }, 500);
    }
  },
};
