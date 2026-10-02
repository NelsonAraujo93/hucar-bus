/**
 * Fails the build when the localized output is not what we expect.
 *
 * A localization misconfiguration produces a green build and a half-broken
 * site, so these are checked explicitly rather than trusted.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BROWSER_DIR = join('dist', 'hucar-bus', 'browser');

const EXPECTED = [
  { subPath: 'es', tag: 'es' },
  { subPath: 'en', tag: 'en-GB' },
];

/**
 * Files that must be served from the domain root. Localized builds place
 * everything under /es/ and /en/, so these only exist because public-root/ is
 * copied over the output root -- if that step is dropped they vanish silently.
 */
const ROOT_FILES = [
  'robots.txt',
  'favicon.ico',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'site.webmanifest',
  'img/logo-256.webp',
];

const failures = [];

for (const name of ROOT_FILES) {
  const file = join(BROWSER_DIR, name);
  if (!existsSync(file)) {
    failures.push(`${file} is missing -- it must be served from the domain root`);
  }
}

for (const { subPath, tag } of EXPECTED) {
  const file = join(BROWSER_DIR, subPath, 'index.html');

  if (!existsSync(file)) {
    failures.push(`${file} is missing -- the ${tag} build did not produce a prerendered page`);
    continue;
  }

  const html = readFileSync(file, 'utf8');

  if (!html.includes(`lang="${tag}"`)) {
    failures.push(`${file} does not declare lang="${tag}"`);
  }

  // These tags are written by DOM manipulation during prerendering, which has
  // already failed silently once: the elements existed in the DOM but never
  // reached the serialized HTML, with no error. Assert them explicitly.
  if (!html.includes('rel="canonical"')) {
    failures.push(`${file} has no canonical link`);
  }
  for (const { tag: alternate } of EXPECTED) {
    if (!html.includes(`hreflang="${alternate}"`)) {
      failures.push(`${file} has no hreflang="${alternate}" alternate`);
    }
  }
  if (!html.includes('hreflang="x-default"')) {
    failures.push(`${file} has no hreflang="x-default" alternate`);
  }
}

/**
 * Sample data that must never reach a production bundle: invented reviews are
 * an unfair commercial practice under EU law. Production builds compile the
 * mocks out (HB_MOCKS is false); this proves it on the output itself.
 * Vercel previews build with mocks on purpose and do not run this script.
 */
// ASCII names on purpose: the bundler may escape "María" as "Mar\xEDa", and a
// marker that can be escaped is a marker that can be missed.
const MOCK_MARKERS = ['Thomas Becker', 'Jan Vermeer', 'openstreetmap.org/export'];

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesUnder(join(directory, entry.name))
      : /\.(js|mjs|html)$/.test(entry.name)
        ? [join(directory, entry.name)]
        : [],
  );
}

for (const file of filesUnder(BROWSER_DIR)) {
  const content = readFileSync(file, 'utf8');
  for (const marker of MOCK_MARKERS) {
    if (content.includes(marker)) {
      failures.push(`${file} contains mock data ("${marker}") -- production must build without it`);
    }
  }
}

if (failures.length > 0) {
  console.error('Localized build assertion failed:\n');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Localized build OK: ${EXPECTED.map((e) => e.subPath).join(', ')} prerendered with canonical ` +
    `and hreflang tags; root files present (${ROOT_FILES.join(', ')}); no mock data.`,
);
