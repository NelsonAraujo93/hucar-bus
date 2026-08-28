/**
 * The identifier a deploy is known by, shared by the two scripts that must
 * agree on it.
 *
 * Deliberately one module rather than the same two lines in both places. If the
 * release written into the bundle and the release the source maps are uploaded
 * against ever drift apart, nothing fails loudly -- Sentry simply serves
 * unresolved minified frames forever, which looks exactly like not having
 * uploaded maps at all.
 */

/** Vercel builds production; Actions builds the verification copy. */
export function releaseId() {
  const sha = process.env['VERCEL_GIT_COMMIT_SHA'] ?? process.env['GITHUB_SHA'] ?? null;
  return sha === null ? null : sha.replace(/[^a-f0-9]/gi, '');
}
