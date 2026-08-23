/**
 * Fails the build when the localized output is not what we expect.
 *
 * A localization misconfiguration produces a green build and a half-broken
 * site, so these are checked explicitly rather than trusted.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BROWSER_DIR = join('dist', 'hucar-bus', 'browser');

const EXPECTED = [
  { subPath: 'es', tag: 'es-ES' },
  { subPath: 'en', tag: 'en-GB' },
];

const failures = [];

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

if (failures.length > 0) {
  console.error('Localized build assertion failed:\n');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Localized build OK: ${EXPECTED.map((e) => e.subPath).join(', ')} prerendered with canonical and hreflang tags.`,
);
