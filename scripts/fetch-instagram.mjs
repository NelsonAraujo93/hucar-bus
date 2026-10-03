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
 * Extends the token's life by 60 days. Logged as facts only -- never the
 * token. Fails harmlessly when the token is under 24 hours old.
 */
async function refreshToken(token) {
  try {
    const url = new URL(`${API}/refresh_access_token`);
    url.searchParams.set('grant_type', 'ig_refresh_token');
    url.searchParams.set('access_token', token);
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.log(`Instagram: token refresh skipped (status ${response.status}).`);
      return;
    }
    const days = Math.round((body.expires_in ?? 0) / 86_400);
    console.log(
      `Instagram: token refreshed, valid ${days} more days; ` +
        `same token string: ${body.access_token === token}.`,
    );
  } catch {
    console.log('Instagram: token refresh failed (network).');
  }
}

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const token = process.env['INSTAGRAM_ACCESS_TOKEN'];
  if (!token) {
    console.log('Instagram: INSTAGRAM_ACCESS_TOKEN not set; writing an empty feed.');
    writeFeed([]);
    return;
  }

  await refreshToken(token);

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
