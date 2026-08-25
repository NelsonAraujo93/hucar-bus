/**
 * Generates optimised image derivatives from the originals.
 *
 * Run by hand, not during the build, and the output is committed. Two reasons:
 * the derivatives are small, and the deploy environment is not guaranteed to
 * have ImageMagick -- making the production build depend on it would be a
 * portability risk for a saving measured in kilobytes of repository size.
 *
 *   npm run images
 *
 * Sources live in design_handoff_hucar_bus_site/, which is gitignored because
 * it holds client assets and this repository is public. Only the derivatives
 * that the site actually serves are committed.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

const OUT_DIR = join('public-root', 'img');

/**
 * One entry per image the site serves.
 *
 * `widths` are output pixel widths, chosen from the rendered size times the
 * device pixel ratio we support -- not from the original, which is invariably
 * far larger than anything the layout asks for.
 */
const IMAGES = [
  {
    source: join('design_handoff_hucar_bus_site', 'logo.jpeg'),
    name: 'logo',
    // Rendered at 68px in the nav and 107px in the footer; 256 covers both at 2x.
    widths: [256],
    formats: ['avif', 'webp', 'jpg'],
  },
];

const QUALITY = { avif: 55, webp: 80, jpg: 82 };

function convert(source, target, width, format) {
  execFileSync('convert', [
    source,
    '-resize',
    `${width}x`,
    '-strip',
    '-quality',
    String(QUALITY[format]),
    target,
  ]);
}

const missing = IMAGES.filter((image) => !existsSync(image.source));
if (missing.length > 0) {
  console.error('Missing source images:\n');
  for (const image of missing) {
    console.error(`  - ${image.source}`);
  }
  console.error('\nExport the design handoff into design_handoff_hucar_bus_site/ first.');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

let originalBytes = 0;
let generatedBytes = 0;

for (const image of IMAGES) {
  originalBytes += statSync(image.source).size;

  for (const width of image.widths) {
    for (const format of image.formats) {
      const target = join(OUT_DIR, `${image.name}-${width}.${format}`);
      mkdirSync(dirname(target), { recursive: true });
      convert(image.source, target, width, format);
      const size = statSync(target).size;
      generatedBytes += size;
      console.log(`  ${target.padEnd(34)} ${String(size).padStart(8)} bytes`);
    }
  }
}

console.log(
  `\nGenerated ${IMAGES.length} image(s): ${originalBytes} bytes of originals -> ` +
    `${generatedBytes} bytes across every format and width.`,
);
