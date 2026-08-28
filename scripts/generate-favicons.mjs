/**
 * Generates the favicon set from the design handoff.
 *
 * Run by hand alongside generate-images.mjs, for the same reasons: the output is
 * a few kilobytes, it is committed, and making the production build depend on
 * ImageMagick would be a portability risk on the deploy environment.
 *
 *   npm run images
 *
 * Everything is derived from the single 512px source rather than from the
 * handoff's own per-size exports. Those were produced by a plain downscale,
 * which at 32px is visibly muddier than a Lanczos resample with a light
 * unsharp pass -- the bus outline, the palm fronds and the sun edge all survive
 * where they otherwise smear together.
 *
 * A caveat that no amount of resampling fixes: **the artwork is an illustrated
 * scene**, with a palm tree, a volcano, a sunset, birds and a minibus. At 16px
 * that is 256 pixels in total and it reads as an orange-yellow blur in any
 * rendering. It is still better than the Angular default it replaces, which is
 * simply the wrong brand, but a legible small mark needs simplified artwork --
 * a bold bus silhouette or a monogram -- and that is a design task, not a
 * conversion one.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const HANDOFF = 'design_handoff_hucar_bus_site';
const SOURCE = join(HANDOFF, 'favicon-512.png');
const OUT_DIR = 'public-root';
const SCRATCH = join(OUT_DIR, '.favicon-tmp');

/** Sizes inside the multi-resolution .ico. */
const ICO_SIZES = [16, 32, 48];

/**
 * Quantisation for the large PNGs.
 *
 * The source is a 462 kB illustration. 256 colours is visually indistinguishable
 * from it on this artwork -- flat fills with one sky gradient -- and cuts it by
 * roughly three quarters. These are icons displayed at 192px at the largest, so
 * any banding in the gradient is invisible where they actually render.
 */
const COLOURS = 256;

/** Sharpened resample. Plain -resize is what made the supplied 32px muddy. */
function icon(size, target, { quantise = false } = {}) {
  execFileSync('convert', [
    SOURCE,
    '-filter',
    'Lanczos',
    '-resize',
    `${size}x${size}`,
    '-unsharp',
    '0x0.6+0.8+0.02',
    ...(quantise ? ['-colors', String(COLOURS)] : []),
    '-strip',
    target,
  ]);
}

function report(path) {
  console.log(`  ${path.padEnd(38)} ${String(statSync(path).size).padStart(8)} bytes`);
}

if (!existsSync(SOURCE)) {
  console.error(`Missing favicon source: ${SOURCE}`);
  console.error(`\nExport the design handoff into ${HANDOFF}/ first.`);
  process.exit(1);
}

execFileSync('mkdir', ['-p', SCRATCH]);

// The .ico carries all three sizes so a browser picks rather than downscales.
const icoParts = ICO_SIZES.map((size) => {
  const part = join(SCRATCH, `ico-${size}.png`);
  icon(size, part);
  return part;
});
const ico = join(OUT_DIR, 'favicon.ico');
execFileSync('convert', [...icoParts, ico]);
report(ico);

// Opaque and square on purpose: iOS applies its own mask and corner radius, and
// a transparent apple-touch-icon renders as a black square on the home screen.
const apple = join(OUT_DIR, 'apple-touch-icon.png');
icon(180, apple, { quantise: true });
report(apple);

for (const size of [192, 512]) {
  const target = join(OUT_DIR, `icon-${size}.png`);
  icon(size, target, { quantise: true });
  report(target);
}

/**
 * theme_color matches the navbar rather than the brand yellow. It tints the
 * Android address bar, which sits directly above the header -- a yellow bar
 * over a white header would read as a rendering fault rather than as branding.
 *
 * Not localized, and cannot be: the manifest is served from the domain root,
 * shared by both locale builds. The brand name reads identically in both, which
 * is the same reason it is kept out of the message catalogue.
 */
const manifest = {
  name: 'Hucar Bus',
  short_name: 'Hucar Bus',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  theme_color: '#ffffff',
  background_color: '#ffffff',
  display: 'browser',
  start_url: '/',
};
const manifestPath = join(OUT_DIR, 'site.webmanifest');
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
report(manifestPath);

execFileSync('rm', ['-rf', SCRATCH]);

console.log(`\nFavicons generated from ${SOURCE} (${statSync(SOURCE).size} bytes).`);
