import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync(new URL('../logo.svg', import.meta.url), 'utf8');

for (const size of [1024, 512, 192]) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const png = resvg.render().asPng();
  const out = new URL(`../logo-${size}.png`, import.meta.url);
  writeFileSync(out, png);
  console.log(`wrote logo-${size}.png (${png.length} bytes)`);
}
