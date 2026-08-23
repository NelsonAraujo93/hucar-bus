/**
 * Copies public-root/ into the root of the build output.
 *
 * @angular/localize with subPath writes every asset under /es/ and /en/, so the
 * output root contains only those two directories and nothing can be served
 * from the domain root. That breaks any file whose location is fixed by
 * convention: robots.txt is only honoured at /robots.txt, and a crawler will
 * never look inside /es/.
 *
 * Anything dropped into public-root/ lands at the domain root.
 */
import { cpSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = 'public-root';
const DESTINATION = join('dist', 'hucar-bus', 'browser');

if (!existsSync(SOURCE)) {
  console.log(`${SOURCE}/ does not exist, nothing to copy.`);
  process.exit(0);
}

if (!existsSync(DESTINATION)) {
  console.error(`${DESTINATION} does not exist -- run the build first.`);
  process.exit(1);
}

cpSync(SOURCE, DESTINATION, { recursive: true });

const copied = readdirSync(SOURCE);
console.log(`Copied ${copied.length} root asset(s) into ${DESTINATION}: ${copied.join(', ')}`);
