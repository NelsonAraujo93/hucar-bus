/**
 * Prints the Angular build configuration for this environment.
 *
 * Vercel preview deployments build with sample data (`HB_MOCKS`) so sections
 * still waiting on real data -- Google reviews, the map -- can be reviewed.
 * Everything else, production and CI included, builds without it, and there
 * the mock code is compiled out entirely.
 *
 * TEMPORARY: removed, with the `mocks` configuration, before release to main.
 */
const configuration = process.env['VERCEL_ENV'] === 'preview' ? 'production,mocks' : 'production';
process.stdout.write(configuration);
