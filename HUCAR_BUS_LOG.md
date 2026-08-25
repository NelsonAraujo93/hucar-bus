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

- **Phase 1's definition of done is met in full.** Language-switch persistence
  was manually verified by Nelson on 2026-08-23: after switching, the choice
  held across separate tabs and separate windows. That exercises the whole
  round trip — the cookie written by `switchTo`, and the middleware reading it
  back on a fresh request and honouring it over `Accept-Language`.
- The release pipeline still has not published a release. Phase 1 contains
  `feat:` commits, so merging it to `main` will cut the first version and prove
  the last untested link in the chain.

## 2026-08-23 — Release pipeline fix

The first merge to `main` with `feat:` commits produced a green Release run that
published nothing: 0 tags, 0 releases, every step successful.

**Cause.** `release.yml` triggered on `workflow_run`, which executes in the
default branch's context. `GITHUB_REF` was therefore `refs/heads/dev`, and
`semantic-release` reads the current branch from the CI environment rather than
from the working tree. With `.releaserc.json` set to `"branches": ["main"]`, it
saw a branch it is not configured to publish from, declined, and exited 0.
Checking out `ref: main` did not help — that changes the files, not the branch
the CI environment reports.

This also explains the earlier empty run, which was misread at the time as
"correctly decided there was nothing to release". It never reached commit
analysis at all.

**Fix.** The release job moved into `ci.yml` with `needs: quality` and a guard
on `github.ref == 'refs/heads/main'`. `GITHUB_REF` is then genuinely
`refs/heads/main`. The CI-must-pass gate becomes a native job dependency, which
is stronger than the cross-workflow trigger it replaces, and `release.yml` is
deleted.

`cancel-in-progress` is now false on `main`, so a run cannot be cancelled
partway through tagging and publishing.

**Lesson.** A green release job proves nothing. The check that matters is
whether a tag and Release actually exist.

### Two further release failures

Moving the job onto `main` was necessary but not sufficient. Two more problems
followed, and only the third diagnosis was correct.

**Wrong diagnosis.** With the job now running, `semantic-release` failed and the
run logs were not readable without auth. The ruleset requires a pull request on
`main` with no bypass, so the failure was attributed to `EGITNOPERMISSION` — the
startup dry-run push being refused. A write-enabled deploy key and a
`Deploy keys` bypass were added on that basis. **The push was never reached, so
none of that was the cause.** It may still be needed the first time a release
gets far enough to push a tag; that remains unproven.

A second mistake compounded it: `bypass_actors` is omitted entirely from
unauthenticated API responses, and reading the absent key as an empty list
produced repeated false reports that the bypass had not saved. It had.

**Actual cause.** `conventional-changelog-conventionalcommits@10` requires
`conventional-changelog-writer@9`, but `@semantic-release/release-notes-generator`
depends on writer `^8` in every published version, including `15.0.0-beta.1`.
Commit analysis was never affected — it parsed all 35 commits and resolved
`1.0.0` correctly — but rendering the notes died on a missing Handlebars helper.
The preset is pinned to `9.3.1`, which the error message itself recommends.

Verified before merging, rather than after: `semantic-release --dry-run --no-ci`
now completes `generateNotes` and renders the full `1.0.0` notes.

**Lesson, sharper than the last one.** Three failures, three different causes,
and the log was readable the whole time. Inferring from configuration shape
instead of reading the error produced one correct diagnosis and one wrong one
that cost two rounds of unnecessary setup.

## 2026-08-24 — Phase 2: design system

Tokens, fonts, motion, focus and the shared primitives. No sections: the plan is
explicit that a section built on half-finished primitives has to be rebuilt.

### Delivered

Self-hosted Anton and Poppins, the full token set as Tailwind v4 `@theme`, base
layer, a focus-visible ring the design omits entirely, both keyframes, and five
primitives — `Button`, `SectionHeader`, `Icon` (20), `Logo` and the rebuilt
`LanguageSwitcher`. A development-only `/ui` gallery renders every one of them in
every variant. 112 tests, 100% statements.

### Getting the design out of Claude Design

The project could not be read at first: `DesignSync` serves only design-system
projects and this is a regular design project, so it 404s regardless of login,
and the web URL 403s. It became readable after Nelson switched accounts. Images
must still be pulled one file at a time as base64 and decoded locally.

### Where the plan and README were wrong

The design source contradicted the written handoff repeatedly. The README's own
rule — the HTML wins — settled each one.

- `@fontsource-variable/poppins` does not exist. Poppins has no variable build.
- `--teal-hover` (#24A3B8) is missing from the plan's token list but the teal
  button needs it.
- There are twenty icons, not nineteen: `MenuIcon` is undocumented.
- Instagram is `stroke-width: 1.8`, not the 2 its README grouping implies.
- `scroll-padding-top` is 72px in the HTML; both documents say 64.
- Section padding is a three-step ladder (96/80/64) with stepping gutters
  (32/24/16), not the airy/compact pair with a fixed 32px gutter.
- The hamburger appears at tablet too, not only below 768.
- `uploads/new-logo.jpeg` is byte-identical to `assets/logo.jpeg`. There is still
  no vector or transparent logo.
- The logo's background is #FBFBFB, not white, and has no alpha channel, so the
  footer card matches that off-white rather than #FFFFFF.

### Decisions

- **Reviews and Instagram ship as lorem ipsum placeholders**, not fabricated
  testimonials or invented like counts. This removes the EU Omnibus Directive
  exposure entirely. APIs get wired later.
- **The language switcher is a segmented ES / EN pill**, rendered as anchors
  rather than the design's buttons. Each locale is a separate URL and bundle, so
  links are what actually happens: crawlable, consistent with the hreflang tags,
  and working without JavaScript. `aria-current`, not `aria-pressed`.
- **The source locale is now `es`, not `es-ES`.** Angular ships no `es-ES` data
  because the base `es` already is European Spanish — EUR, 1.234,56, 24-hour
  clock — so every build warned while resolving exactly the right data. hreflang
  follows to `es`; `og:locale` cannot, since Open Graph requires
  language_TERRITORY, and keeps `es_ES`.
- **Copy is authored in Spanish and translated into English.** Settled.

### Found in the export, not the plan

`i18n.jsx` contains complete English translations of every string in all eight
sections. The README still lists "who writes the English translations?" as an
open client question; it is answered. Phase 3 is transcription, not translation.

The prototype switches language at runtime via localStorage and React state.
This project compiles a bundle per locale. The visual design ports; `useT()` and
the `I18N` object do not, and every string becomes a `$localize` tag with an
explicit `@@` id.

### Two bugs of our own making

Moving `favicon.ico` into `public-root/` broke the dev server: that directory
reaches production through a post-build copy that `ng serve` never runs. At the
same time there was no route for `''`, which had never mattered because the
prerenderer emits a shell regardless. Together the dev server returned 404 for
everything except `/ui`.

Neither was caught, because every check in this repository inspects the
production build. Nothing exercises `ng serve` — which is what development
actually uses. Worth closing before Phase 3.

### Still open

- `robots.txt` exists; `sitemap.xml` does not. `public-root/` is ready for it.
- The logo is 148KB for a mark rendered 68px wide. T10's image pipeline.
- Font preloading is not implemented: Angular content-hashes the filenames, so a
  static preload link cannot target them. `font-display: swap` is set.
- `@angular/aria` has no importers since the switcher was rebuilt. Kept for the
  Phase 3 mobile drawer.
- `HUCAR_BUS_DESIGN.md` does not exist in this repository, so T14's instruction
  to update its token names could not be carried out.

## 2026-08-25 — Phase 3: page sections

Navbar, Hero, Services, About, Contact, Footer and the WhatsApp float compose the
page in both locales. Reviews and Instagram are built but withheld. 224 tests.

### The translation discipline held

Roughly a hundred units, English written in the same commit as every section, as
the plan demands. `i18nMissingTranslation: "error"` never once blocked a build,
because the English never lagged. The drafted English is taken from the design
export's own `i18n.jsx` where it exists, and is **provisional pending client
review** — it is placeholder marketing copy, not signed-off text.

### What is deliberately not on the page

- **Reviews.** The five testimonials, the 4.8 average and "120+" are invented.
  The component takes reviews as an input and renders _nothing_ when given none,
  so it cannot publish on its own. The fixture lives in `reviews.fixture.ts`,
  reachable only from `/ui`, which the production build excludes. Verified: none
  of the five names, and no "opiniones en Google", appears in the output.
- **Instagram.** Scope is still undecided. Like counts are dropped as invented.
  Captions are withheld: the design names Famara, Papagayo and Timanfaya, but
  nobody has confirmed the supplied photographs show those places.
- **Footer legal links.** Omitted rather than shipped dead.

### One thing that is on the page and should not stay

**`4.8★` renders in the About stats.** Nelson chose to ship the mock for now.
It is the same fabricated rating the Reviews section cannot publish, so it must
be confirmed or removed before `main` deploys. This is the single exception to
the phase's "no fabricated content in the built output" criterion.

### Decisions

- "Consultar" anchors to `#contacto`; the WhatsApp version with a prefilled
  message naming the service comes later.
- The contact form has four states, not the design's two. `pending` and `error`
  were designed now rather than under deadline in Phase 4.
- The captcha slot is left empty. Imitating a security control is worse than
  showing nothing: a visitor could believe they had completed it.
- Image slots are tone blocks until the photographs arrive.

### What the design source settled that the plan called undesigned

The plan lists the mobile drawer and the language-switcher placement as needing
a design pass. `sections.jsx` specifies both in full — 60px compact bar, drawer
`max-height` 0 to 460 over `.32s`, 48px rows, a 4px active marker, both CTAs
inside; and a switcher slot at every breakpoint including full-width in the
drawer and dark-toned in the footer. Nothing was invented.

Two Phase 2 values were wrong against that source and are corrected: section
headings are `clamp(28px, 7vw, 52px)`, and the eyebrow steps to 12px on mobile.

### Images

`npm run images` generates AVIF, WebP and JPEG at the widths the layout asks
for. The logo went from 148,827 bytes at 1383×1112 to 8,304 bytes of AVIF — 94%
smaller — for a mark rendered 68px wide. Generation is manual and its output
committed, so the production build never depends on ImageMagick being present in
the deploy environment.

**Client photographs are still not on disk.** They exceed the design tooling's
file-read limit and must be exported to
`design_handoff_hucar_bus_site/uploads/`. Export originals at full size: the
pipeline needs the resolution for 2× displays and downscaling first throws away
information that cannot be recovered.

### Two defects found by composing

Linking to a section that is not rendered gives a visitor a nav item that
silently does nothing. Navigation now follows `COMPOSED_NAV_IDS`.

Extraction only sees components the production graph reaches. `logo.alt.*` was
invisible until `Logo` was composed, and the Reviews and Instagram strings are
still absent from `messages.xlf` for the same reason. Their English is written
regardless, so the translations are in place the day those sections join.

### Still open, blocking Phase 4 or a production merge

1. **Confirm or remove `4.8★`** before `main` deploys
2. Real Google reviews — API or confirmed real text
3. Client review of the drafted English
4. What the photographs actually show, before anything is captioned
5. Nine square photos for the grid, or approval to crop
6. Instagram scope
7. Real phone, WhatsApp number, email, address
8. Vector or transparent logo — the current one is an opaque JPEG
9. Privacy policy and terms copy, plus the cookie banner an EU site needs
10. Confirm "desde 2014", "10+", "24/7"
