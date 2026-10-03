/**
 * Fetches the latest Instagram posts at build time and copies their images
 * into the site, so the page never loads anything from Meta.
 *
 *   node scripts/fetch-instagram.mjs
 *
 * Runs before `ng build` in `npm run build`. Never fails the build: without a
 * token, or if Instagram is unreachable, it writes an empty feed and the
 * section stays hidden -- a missing Instagram strip is not worth a failed
 * deploy.
 *
 * Writes public-root/instagram/ (gitignored), which reaches the domain root
 * through the post-build copy, and the dev server through its assets config.
 *
 * Does not refresh the token: a refresh returns a new token string, so it
 * must be stored, which is the daily job's work (api/cron/instagram). This
 * script reads the token that job keeps current, falling back to
 * INSTAGRAM_ACCESS_TOKEN until the job has run once.
 */
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = join('public-root', 'instagram');
const POSTS = 3;
/** Tiles render about 380px wide; 640 covers them at 2x on most screens. */
const SIZE = 640;
const CAPTION_MAX = 120;
const API = 'https://graph.instagram.com';

function writeFeed(posts) {
  writeFileSync(
    join(OUT_DIR, 'feed.json'),
    `${JSON.stringify({ fetchedAt: new Date().toISOString(), posts }, null, 2)}\n`,
  );
}

/** First line of the owner's caption, trimmed to a tile-sized length. */
function shortCaption(caption) {
  const firstLine = (caption ?? '').split('\n')[0].trim();
  return firstLine.length > CAPTION_MAX
    ? `${firstLine.slice(0, CAPTION_MAX - 1).trimEnd()}…`
    : firstLine;
}

/**
 * The current token, as kept up to date by the daily job (api/cron/instagram).
 * Read with the database's read-only key. The key name matches TOKEN_KEY in
 * src/functions/instagram/token-store.ts, which this script cannot import.
 * Null when the store is not configured or empty: the caller then falls back
 * to INSTAGRAM_ACCESS_TOKEN.
 */
async function storedToken() {
  const url = process.env['KV_REST_API_URL'];
  const key = process.env['KV_REST_API_READ_ONLY_TOKEN'];
  if (!url || !key) {
    return null;
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify(['GET', 'instagram:token']),
      signal: AbortSignal.timeout(5_000),
    });
    const { result } = await response.json();
    const token = typeof result === 'string' ? JSON.parse(result).token : null;
    if (typeof token === 'string') {
      console.log('Instagram: using the token from the store.');
      return token;
    }
  } catch {
    // Fall through to the environment variable.
  }
  return null;
}

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const token = (await storedToken()) ?? process.env['INSTAGRAM_ACCESS_TOKEN'];
  if (!token) {
    console.log(
      'Instagram: no token in the store or INSTAGRAM_ACCESS_TOKEN; writing an empty feed.',
    );
    writeFeed([]);
    return;
  }

  const url = new URL(`${API}/me/media`);
  url.searchParams.set(
    'fields',
    'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
  );
  url.searchParams.set('limit', String(POSTS));
  url.searchParams.set('access_token', token);

  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    console.log(
      `Instagram: feed request failed (status ${response.status}); writing an empty feed.`,
    );
    writeFeed([]);
    return;
  }
  const { data = [] } = await response.json();

  const posts = [];
  for (const media of data.slice(0, POSTS)) {
    // Videos have no full image; their thumbnail stands in for them.
    const source = media.media_type === 'VIDEO' ? media.thumbnail_url : media.media_url;
    if (!source || !media.permalink) {
      continue;
    }
    const download = await fetch(source, { signal: AbortSignal.timeout(15_000) });
    if (!download.ok) {
      continue;
    }
    const original = Buffer.from(await download.arrayBuffer());
    // Square, like the grid; sharp drops all metadata unless asked to keep it.
    const square = sharp(original).rotate().resize(SIZE, SIZE, { fit: 'cover' });
    const name = `post-${media.id}`;
    await square
      .clone()
      .webp({ quality: 80 })
      .toFile(join(OUT_DIR, `${name}.webp`));
    await square
      .clone()
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(OUT_DIR, `${name}.jpg`));
    posts.push({
      id: media.id,
      permalink: media.permalink,
      caption: shortCaption(media.caption),
      image: {
        webp: `/instagram/${name}.webp`,
        jpg: `/instagram/${name}.jpg`,
        width: SIZE,
        height: SIZE,
      },
    });
  }

  writeFeed(posts);
  console.log(`Instagram: ${posts.length} post(s) copied into the site.`);
}

main().catch((error) => {
  // Name the failure, never a URL: the token travels in the query string.
  console.log(`Instagram: ${error?.name ?? 'Error'}; writing an empty feed.`);
  try {
    writeFeed([]);
  } catch {
    // Directory missing as well: the page treats a missing feed as empty.
  }
});
