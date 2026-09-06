/**
 * Rasterizes the PWA icon set into public/ from two inline SVGs:
 *   - the rounded-tile mark (favicon.svg, also used for the "any" icons)
 *   - a full-bleed variant with extra padding for the "maskable" icon
 *
 *   node scripts/gen-icons.mjs
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const GRAD = `
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#6d28d9"/>
  </linearGradient></defs>`;
const NOTE = (tx, ty, s) => `
  <g transform="translate(${tx} ${ty}) scale(${s})" fill="none" stroke="#f5f3ff"
     stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </g>`;

const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${GRAD}
  <rect width="512" height="512" rx="116" fill="url(#g)"/>${NOTE(106, 106, 12.5)}</svg>`;
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${GRAD}
  <rect width="512" height="512" fill="url(#g)"/>${NOTE(146, 146, 9.2)}</svg>`;

const png = (svg, size) => Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng());
const OUT = path.resolve('public');

await writeFile(path.join(OUT, 'favicon.svg'), tile + '\n');
await writeFile(path.join(OUT, 'icon-192.png'), png(tile, 192));
await writeFile(path.join(OUT, 'icon-512.png'), png(tile, 512));
await writeFile(path.join(OUT, 'apple-touch-icon.png'), png(tile, 180));
await writeFile(path.join(OUT, 'icon-512-maskable.png'), png(maskable, 512));
console.log('Wrote favicon.svg, icon-192.png, icon-512.png, icon-512-maskable.png, apple-touch-icon.png');
