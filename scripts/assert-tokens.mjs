/**
 * Freezes the design token snapshot.
 *
 * Every value below was taken from the handoff README, whose shadows in
 * particular carry tuned alpha values that must not be approximated. Without
 * this check a stray edit to a hex or an alpha changes the brand everywhere and
 * nothing fails -- the site simply looks slightly wrong.
 *
 * When a token genuinely changes, update this snapshot in the same commit. The
 * point is that it becomes a deliberate act rather than an accident.
 */
import { readFileSync } from 'node:fs';

const STYLESHEET = 'src/styles.css';

/** Tokens declared inside @theme, which is the design system proper. */
const EXPECTED = {
  '--color-sun-yellow': '#f5c518',
  '--color-sunset-orange': '#f0882a',
  '--color-lava-red': '#e04e1a',
  '--color-ocean-teal': '#2bbcd4',
  '--color-brand-blue': '#073396',
  '--color-ink': '#1a1a1a',
  '--color-ink-muted': '#4a4a4a',
  '--color-sand': '#f5e6c0',
  '--color-sand-light': '#fdf4e3',
  '--color-sand-lighter': '#fff4d9',
  '--color-cream': '#fdf9ec',
  '--color-border': '#e5e0d5',
  '--color-whatsapp': '#25d366',
  '--color-whatsapp-hover': '#1fb357',
  '--color-teal-hover': '#24a3b8',
  '--font-display': "'Anton', sans-serif",
  '--font-body': "'Poppins', sans-serif",
  '--radius-4': '4px',
  '--radius-8': '8px',
  '--radius-10': '10px',
  '--radius-12': '12px',
  '--radius-14': '14px',
  '--radius-16': '16px',
  '--radius-20': '20px',
  '--radius-full': '999px',
  '--radius-circle': '50%',
  '--duration-micro': '0.15s',
  '--duration-transform': '0.2s',
  '--duration-card': '0.25s',
  '--duration-image': '0.35s',
  '--duration-carousel': '0.5s',
  '--ease-carousel': 'cubic-bezier(0.22, 1, 0.36, 1)',
  '--shadow-card-rest': '0 1px 2px rgb(0 0 0 / 2%)',
  '--shadow-card-hover': '0 14px 32px rgb(240 136 42 / 12%)',
  '--shadow-button-rest': '0 4px 14px rgb(0 0 0 / 12%)',
  '--shadow-button-hover': '0 8px 24px rgb(0 0 0 / 18%)',
  '--shadow-arrow-btn': '0 2px 8px rgb(0 0 0 / 5%)',
  '--shadow-nav-scrolled': '0 4px 20px rgb(0 0 0 / 6%)',
  '--shadow-float-card': '0 12px 28px rgb(0 0 0 / 12%)',
  '--shadow-whatsapp-float': '0 12px 30px rgb(37 211 102 / 45%), 0 6px 14px rgb(0 0 0 / 18%)',
  '--section-pad': '96px',
  '--container-max': '1152px',
  '--container-pad': '32px',
  '--ring-focus': '0 0 0 3px rgb(245 197 24 / 45%)',
};

const css = readFileSync(STYLESHEET, 'utf8');

const blocks = [...css.matchAll(/@theme\s*\{(.*?)\n\}/gs)].map((m) => m[1]);
const actual = {};
for (const block of blocks) {
  for (const [, name, value] of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    actual[name] = value.split(/\s+/).join(' ').trim();
  }
}

const failures = [];

for (const [name, value] of Object.entries(EXPECTED)) {
  if (!(name in actual)) {
    failures.push(`${name} was removed (expected ${value})`);
  } else if (actual[name] !== value) {
    failures.push(`${name} changed\n      expected: ${value}\n      actual:   ${actual[name]}`);
  }
}

for (const name of Object.keys(actual)) {
  if (!(name in EXPECTED)) {
    failures.push(`${name} was added (${actual[name]}) but is not in the snapshot`);
  }
}

if (failures.length > 0) {
  console.error(`Design token snapshot failed against ${STYLESHEET}:\n`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  console.error(
    `\nIf the change is intended, update EXPECTED in scripts/assert-tokens.mjs in the same commit.`,
  );
  process.exit(1);
}

console.log(`Design tokens OK: ${Object.keys(EXPECTED).length} tokens match the snapshot.`);
