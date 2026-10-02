/**
 * Generates optimised image derivatives from the originals.
 *
 * Run by hand, not during the build, and the output is committed: the
 * derivatives are small, and the build should not depend on originals that
 * live outside the repository.
 *
 *   npm run images              every image
 *   npm run images -- about     only images whose name contains "about"
 *
 * Sources live in design_handoff_hucar_bus_site/, which is gitignored because
 * it holds client assets and this repository is public. Only the derivatives
 * that the site actually serves are committed.
 *
 * Uses sharp rather than ImageMagick, so it needs no system install. sharp
 * drops all metadata unless asked to keep it, which matters here: phone photos
 * carry the GPS coordinates of where they were taken, and publishing them
 * would publish those places.
 */
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = join('public-root', 'img');
const SOURCES = 'design_handoff_hucar_bus_site';

/**
 * One entry per image the site serves.
 *
 * `widths` are output pixel widths, chosen from the rendered size times the
 * device pixel ratio we support -- not from the original, which is invariably
 * far larger than anything the layout asks for. `height` crops to an exact
 * frame, centred.
 */
const IMAGES = [
  {
    source: join(SOURCES, 'logo.jpeg'),
    name: 'logo',
    // Rendered at 68px in the nav and 107px in the footer; 256 covers both at 2x.
    widths: [256],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    source: join(SOURCES, 'photos', 'driver-and-minibus.jpg'),
    name: 'about-driver',
    // Half of a 1200px container on desktop, full width up to ~960px on
    // tablet, ~400px on phones. 1200 covers the largest of those at 1x and
    // the desktop column at 2x.
    widths: [480, 800, 1200],
    formats: ['avif', 'webp', 'jpg'],
  },
  {
    source: join(SOURCES, 'photos', 'minibus-volcanic.jpg'),
    name: 'og-minibus',
    // The link preview shown when the site is shared: 1200x630 is the size
    // Facebook, WhatsApp and LinkedIn all render. JPEG only, because not every
    // crawler that fetches it understands AVIF or WebP.
    widths: [1200],
    height: 630,
    formats: ['jpg'],
  },
];

/**
 * Per-format quality. AVIF and WebP need less than JPEG for the same visual
 * result; these match what the logo was originally generated at.
 */
const ENCODE = {
  avif: (image) => image.avif({ quality: 55 }),
  webp: (image) => image.webp({ quality: 80 }),
  jpg: (image) => image.jpeg({ quality: 82, mozjpeg: true }),
};

const filter = process.argv[2];
const selected = filter ? IMAGES.filter((image) => image.name.includes(filter)) : IMAGES;

if (selected.length === 0) {
  console.error(`No image name contains "${filter}".`);
  process.exit(1);
}

const missing = selected.filter((image) => !existsSync(image.source));
if (missing.length > 0) {
  console.error('Missing source images:\n');
  for (const image of missing) {
    console.error(`  - ${image.source}`);
  }
  console.error(`\nPut the originals in ${SOURCES}/ first.`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

let originalBytes = 0;
let generatedBytes = 0;

for (const image of selected) {
  originalBytes += statSync(image.source).size;

  for (const width of image.widths) {
    for (const format of image.formats) {
      const target = join(OUT_DIR, `${image.name}-${width}.${format}`);
      // rotate() applies the camera's orientation flag before it is dropped
      // with the rest of the metadata; without it, portrait shots come out
      // sideways.
      const resized = sharp(image.source)
        .rotate()
        .resize(image.height ? { width, height: image.height, fit: 'cover' } : { width });
      const { size } = await ENCODE[format](resized).toFile(target);
      generatedBytes += size;
      console.log(`  ${target.padEnd(40)} ${String(size).padStart(8)} bytes`);
    }
  }
}

console.log(
  `\nGenerated ${selected.length} image(s): ${originalBytes} bytes of originals -> ` +
    `${generatedBytes} bytes across every format and width.`,
);
