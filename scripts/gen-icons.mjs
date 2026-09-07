/**
 * Rasterizes the PWA icon set into public/ from logo.svg (the GUATACA flag mark):
 *   - favicon.svg            = the circle logo verbatim (transparent corners)
 *   - icon-192/512.png       = the circle logo rasterized ("any" icons)
 *   - apple-touch-icon.png   = logo on a solid background (iOS fills transparency with black)
 *   - icon-512-maskable.png  = logo scaled to the 80% safe zone on a solid background
 *
 *   node scripts/gen-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const OUT = path.resolve('public');
const logo = await readFile(path.resolve('logo.svg'), 'utf8');

// Everything inside the <svg> root, so it can be re-wrapped for the maskable variant.
const inner = logo.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const png = (svg, size) => Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng());

// Solid background matching the app theme (manifest background_color / theme_color).
const BG = '#020617';
// Logo is 1024×1024; scale to 80% of 512 (409.6) and center → 51.2px padding each side.
const fullBleed = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  <g transform="translate(51.2 51.2) scale(0.4)">${inner}</g>
</svg>`;

await writeFile(path.join(OUT, 'favicon.svg'), logo);
await writeFile(path.join(OUT, 'icon-192.png'), png(logo, 192));
await writeFile(path.join(OUT, 'icon-512.png'), png(logo, 512));
await writeFile(path.join(OUT, 'apple-touch-icon.png'), png(fullBleed, 180));
await writeFile(path.join(OUT, 'icon-512-maskable.png'), png(fullBleed, 512));
console.log('Wrote favicon.svg, icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png');
