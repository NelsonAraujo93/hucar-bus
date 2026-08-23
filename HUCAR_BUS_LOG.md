# Hucar Bus — Work Log

## 2026-08-23 — Phase 0: CI/CD and tooling baseline

### Completed

- **T1** ESLint flat config via `ng add angular-eslint`, `hb` selector prefix,
  `eslint-config-prettier/flat` as the final entry, plus the two strictness rules
  (`explicit-function-return-type` with `allowExpressions`, `no-explicit-any`).
- **T2** `commitlint.config.mjs` — conventional commits with a closed `scope-enum`.
- **T3** `package.json` scripts and `lint-staged`. `version` left at `0.0.0`.
- **T4** `angular.json` test target with coverage and 80% thresholds.
- **T5** Husky `pre-commit` (lint-staged) and `commit-msg` (commitlint), mode `100755`.
- **T6** Full CI sequence verified locally on Node 24.19.0 before every push.
- **T7** `feature/ci-setup` → `dev` (PR #1). CI green, Vercel preview generated.
- **T8** SonarQube Cloud reporting `coverage: 100.0`, `ncloc: 363`, 0 bugs,
  0 vulnerabilities, 2 code smells, 0% duplication.
- **T9** Branch protection on `main` via a Ruleset.
- **T10** `dev` → `main` (PR #2) merged with a merge commit. CI green on `main`,
  Release workflow ran, single Vercel production deployment, site serving.

### Decisions

- **No `@semantic-release/git`.** Release notes live on GitHub Releases only; there is no
  in-repo `CHANGELOG.md` and no release commit written back to the repository.
- **Global, not per-layer, coverage thresholds.** 80% across statements, branches,
  functions and lines, with bootstrap and config files excluded.
- **`@vitest/coverage-v8` was added.** The test target enables coverage but no provider was
  installed, so `test:ci` could not run at all.
- **Actions pinned to the first Node 24 releases**, not the latest majors:
  `upload-artifact@v6` and `sonarqube-scan-action@v7`. v7 moves to ESM and v8 flips
  `skipSignatureVerification`; neither is needed to clear the Node 20 deprecation.
- **`stylelint`'s `no-empty-source` is disabled project-wide.** Angular scaffolds an empty
  stylesheet with every generated component, so a path-specific ignore would need
  extending on each `ng generate`.
- **`.claude/` is gitignored** — planning documents stay out of the repository.
- **Branch protection uses Rulesets, not classic protection.** The `required_deployments`
  rule was removed: it demanded a successful `Production` deployment on the PR head, but
  Vercel only produces Production deployments _after_ a merge to the production branch, so
  the gate could never be satisfied.

### Actual lcov path

```
coverage/hucar-bus/lcov.info
```

Not `coverage/lcov.info`. `sonar.javascript.lcov.reportPaths` was corrected accordingly;
left unchanged, Sonar reported 0% coverage while CI stayed green.

### Bugs found and fixed in the supplied config

- **The Sonar scan never executed.** The step tested `env.SONAR_TOKEN` in its own `if:`,
  where a step's own `env:` block is out of scope, so the condition was always false.
  The secret is now declared at job level.
- **`sonar.javascript.lcov.reportPaths` pointed at the wrong directory** (see above).
- **`.releaserc.json` and `.stylelintrc.json` were copied without their leading dots**, so
  neither tool loaded its configuration.

### Still open

- **The release pipeline has not published a Release.** Every Phase 0 commit is type `ci`
  or `build`, both mapped to `"release": false`. `release.yml` runs and correctly decides
  there is nothing to cut, but this means the publishing path itself is unproven — a
  working pipeline and a silently broken one look identical right now. The first `feat:`
  or `fix:` commit will settle it.
- **`dev` is unprotected.** The Ruleset targets `refs/heads/main` only.

### Phase 1 questions (unanswered — do not guess)

1. Which locales? (`es-ES` + `en-GB`? German/French?)
2. Fallback locale for an unmatched `Accept-Language`?
3. Must the client edit copy without a redeploy?
4. Is Instagram in scope?

## 2026-08-23 — Phase 1: i18n foundation

### Locale decisions

- `es-ES` is the source locale at `/es/`; `en-GB` at `/en/`. Build-time via
  `@angular/localize`, two builds and one deploy, XLIFF 2.0.
- **The fallback locale is `en-GB`, not Spanish.** This contradicts the plan's
  decisions table and its definition of done, which expected a German browser to
  land on `/es/`. Nelson's call: the English-speaking market is the larger share
  of customers, so an unrecognised browser language is more likely to be an
  English speaker. **The definition of done should now read `/en/` for that
  case.**
- `sourceLocale` remains `es-ES`, which is independent of the fallback. Copy is
  therefore authored in Spanish and translated into English — already visible in
  the switcher, whose source string is `Cambiar idioma`. **Still open:** whether
  authoring should flip to English now that the primary audience is English.
  Cheap to change today, expensive once Phase 2 has copy in it.

### T1 spike result

Vercel Routing Middleware **does** run on this project's pure static Angular
output. No `vercel.json` fallback was needed and the plan stood unchanged. The
matcher is scoped to `/` only; `/es/`, `/en/` and static assets pass through.

Verified at the edge: `en-GB` → `/en/`, `es-ES` → `/es/`, `de-DE` → `/en/`,
cookie beats header, q-values beat header order, query strings preserved.

### Actual output paths

```
dist/hucar-bus/browser/es/index.html
dist/hucar-bus/browser/en/index.html
```

`browser/` root contains **no** `index.html`. Nothing is served at `/`, which
makes the middleware load-bearing infrastructure rather than a convenience.

### Discovered, contradicting or absent from the plan

- **`head.querySelector('link[rel="canonical"]')` fails silently during
  prerendering.** The element was present in the DOM at render time but never
  reached the serialized HTML, while an identical plain `appendChild` survived.
  There is no error; the tags simply do not exist. Tags are now addressed by
  deterministic id via `getElementById`. This is why the T11 assertion checks
  for canonical and hreflang, not just for the files.
- **Nothing could be served from the domain root.** Localized builds place
  every asset under `/es/` and `/en/`, so the output root held only those two
  directories. `robots.txt` is only honoured at `/robots.txt` and a crawler will
  never look in `/es/`. **Solved:** `public-root/` is copied over the build
  output root by `scripts/copy-root-assets.mjs`, wired into `npm run build`.
  Anything dropped in that folder lands at the domain root, `sitemap.xml`
  included when it exists. `favicon.ico` moved there and `src/index.html` now
  references it absolutely, since a relative href resolves against
  `<base href="/es/">`. The `vercel.json` rewrite that patched this is gone, and
  the T11 assertion fails if the root files go missing.
- **Unmatched routes now return 404**, where the pre-i18n build served a 200 SPA
  fallback. Correct for a prerendered site, but every route must be prerendered
  — a purely client-side route added later would 404 on direct navigation.
- **`<html lang>` needed no work.** Angular already emits `lang="es-ES"` and
  `lang="en-GB"` per build, answering T9's open question.
- **`ng lint` covered only `src/**`**, so `middleware.ts` — production edge code
  — was entirely unlinted. Proven with a deliberate `any` that passed. Patterns
  now include root-level TypeScript.
- **`lint-staged` covered no `.js`/`.mjs`**, so config files skipped pre-commit
  formatting and only failed later in CI.

### Coverage

97.14% branches against an 80% gate, 100% statements, lines and functions. The
two uncovered branches are a defensive null-`location` guard and one branch v8
attributes to Angular's compiled template output. Neither is worth a synthetic
test. Every hand-authored i18n file is at 100% branches.

Note the denominators collapsed when the Angular scaffold was deleted — from 55
statements to 8 — before recovering to 153 as real logic landed. The gate has
little slack on a small codebase.

### Still open

- Phase 1's definition of done is otherwise met, but **T10's language-switch
  persistence has not been verified end to end in a browser** — the cookie and
  navigation are unit tested, not click tested.
- The release pipeline still has not published a release. Phase 1 contains
  `feat:` commits, so merging it to `main` will cut the first version and prove
  the last untested link in the chain.
