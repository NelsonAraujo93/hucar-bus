// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'hb',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          // Attribute selectors are allowed so primitives can be applied to a
          // real <button> or <a> rather than wrapping one.
          type: ['element', 'attribute'],
          prefix: 'hb',
          style: 'kebab-case',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      // Extraction only picks up text carrying an i18n attribute, so unmarked
      // copy ships untranslated with nothing to warn you. This turns that
      // invisible failure into a build error.
      '@angular-eslint/template/i18n': [
        'error',
        {
          checkId: false,
          checkText: true,
          checkAttributes: true,
          // Observed on the Angular scaffold: SVG geometry and link relations
          // are machine values, not copy. Extend this list as others surface.
          ignoreAttributes: [
            // SVG geometry and link relations are machine values, not copy.
            'd',
            'fill-rule',
            'clip-rule',
            'rel',
            'stroke-linecap',
            'stroke-linejoin',
            'preserveAspectRatio',
            'focusable',
            // Test hooks.
            'data-testid',
            // Component inputs and ARIA plumbing, which are never prose.
            'size',
            'variant',
            'tone',
            'eyebrowTone',
            'name',
            'aria-controls',
          ],
        },
      ],
    },
  },
  {
    // index.html is the app shell, not an Angular template -- Angular's i18n
    // pipeline never processes it, so marking it up would achieve nothing.
    files: ['src/index.html'],
    rules: {
      '@angular-eslint/template/i18n': 'off',
    },
  },
  {
    // The UI gallery is a development-only tool that never reaches production,
    // so its labels must not enter a translation file.
    files: ['src/app/features/ui-gallery/*.html'],
    rules: {
      '@angular-eslint/template/i18n': 'off',
    },
  },
  // Must stay last: turns off every ESLint rule that would fight Prettier.
  eslintConfigPrettier,
]);
