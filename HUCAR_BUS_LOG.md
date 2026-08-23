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
