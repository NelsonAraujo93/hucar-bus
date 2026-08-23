/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Scopes are optional, but when present they must come from this list.
    // Keeps release notes groupable and stops "misc"/"stuff" creeping in.
    'scope-enum': [
      2,
      'always',
      [
        'core',
        'domain',
        'application',
        'infrastructure',
        'shared',
        'i18n',
        'seo',
        'hero',
        'services',
        'about',
        'reviews',
        'map',
        'contact',
        'footer',
        'analytics',
        'deps',
        'ci',
        'config',
      ],
    ],
    'body-max-line-length': [0, 'always'],
  },
};
