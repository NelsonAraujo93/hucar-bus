/**
 * Uploads source maps to Sentry, then deletes them from the deployed output.
 *
 * Without maps a stack trace points at a minified bundle and is close to
 * worthless, which is most of the value of error monitoring gone.
 *
 * **The maps are always deleted, whether or not they were uploaded.** Publishing
 * them to a public site undoes minification and serves the full original source.
 * This repository is public so the stakes here are low, but the deletion is not
 * conditional on the upload succeeding: a build that cannot reach Sentry must
 * still not publish source. `hidden: true` in angular.json already stops
 * browsers fetching them by removing the sourceMappingURL comment; deleting the
 * files means they cannot be fetched by anyone who guesses the name either.
 *
 * Configuration comes entirely from the environment, so no Sentry identifier or
 * token is committed:
 *
 *   SENTRY_AUTH_TOKEN  secret. Set it in Vercel, which performs the production
 *                      build. A GitHub secret alone would upload maps for a
 *                      bundle nobody deploys.
 *   SENTRY_ORG         organisation slug -- the bare slug, not a URL
 *   SENTRY_PROJECT     project slug -- likewise
 *
 * With any of them missing the upload is skipped and the build continues. That
 * is deliberate: a local build and a fork's CI must both still work.
 *
 * **Use an Organization token (`sntrys_…`), not a personal one.** This project
 * lives in Sentry's EU region, and sentry-cli defaults to the US one. An
 * organization token is a signed blob carrying its own region URL, so the CLI
 * routes itself correctly. A personal token carries no region, silently talks
 * to the US instance, and fails with "organization not found" -- which reads
 * like a wrong slug and sends you looking in the wrong place entirely. If a
 * personal token is ever used here, `SENTRY_URL=https://de.sentry.io/` has to
 * be set alongside it. Any variable set in the environment reaches the CLI, so
 * that works without a change here.
 *
 * An organization token is also not tied to a person: a personal one stops
 * working the day its owner leaves or rotates it, and the build breaks with no
 * obvious connection to the cause.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { releaseId } from './release-id.mjs';

const BROWSER_DIR = 'dist/hucar-bus/browser';

/** Every .map under a directory, recursively. */
function findMaps(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      found.push(...findMaps(path));
    } else if (entry.endsWith('.map')) {
      found.push(path);
    }
  }
  return found;
}

function sentry(args) {
  execFileSync('npx', ['sentry-cli', ...args], {
    stdio: 'inherit',
    env: process.env,
  });
}

const token = process.env['SENTRY_AUTH_TOKEN'];
const org = process.env['SENTRY_ORG'];
const project = process.env['SENTRY_PROJECT'];
const release = releaseId();

let maps = [];
try {
  maps = findMaps(BROWSER_DIR);
} catch {
  console.error(`Source maps: no build output at ${BROWSER_DIR}. Did the build run?`);
  process.exit(1);
}

if (maps.length === 0) {
  console.log('Source maps: none produced. Nothing to upload or delete.');
  process.exit(0);
}

const configured = Boolean(token && org && project);

if (!configured) {
  const missing = [
    !token && 'SENTRY_AUTH_TOKEN',
    !org && 'SENTRY_ORG',
    !project && 'SENTRY_PROJECT',
  ].filter(Boolean);
  console.log(`Source maps: upload skipped (${missing.join(', ')} not set).`);
} else if (release === null) {
  // Uploading without one would put the maps under a release nothing is tagged
  // with, and the traces would stay minified while appearing to have worked.
  console.log('Source maps: upload skipped (no VERCEL_GIT_COMMIT_SHA or GITHUB_SHA).');
} else {
  console.log(`Source maps: uploading ${maps.length} to ${org}/${project} @ ${release}`);
  try {
    // Debug IDs, injected into both the bundle and its map, are what let Sentry
    // pair the two. They survive `hidden: true`, where there is no
    // sourceMappingURL comment to follow.
    sentry(['sourcemaps', 'inject', BROWSER_DIR]);
    sentry(['sourcemaps', 'upload', '--release', release, BROWSER_DIR]);
    console.log('Source maps: uploaded.');
  } catch (error) {
    // Loud, not silent. A build that ships unresolvable stack traces while
    // reporting success is the failure this whole script exists to prevent.
    console.error('Source maps: UPLOAD FAILED.', error.message);
    console.error('Deleting maps from the output anyway; they must not be published.');
    for (const map of maps) {
      rmSync(map, { force: true });
    }
    process.exit(1);
  }
}

for (const map of findMaps(BROWSER_DIR)) {
  rmSync(map, { force: true });
}
console.log(`Source maps: ${maps.length} deleted from the deployed output.`);
