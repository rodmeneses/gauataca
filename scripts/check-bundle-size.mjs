// Fails when the gzipped JS in dist/assets exceeds the budget, so bundle growth is a conscious decision.
// Raise BUDGET_KB deliberately (and say why in the PR) when a feature genuinely needs it.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const BUDGET_KB = 230;
const dir = 'dist/assets';

const total = readdirSync(dir)
  .filter((f) => f.endsWith('.js'))
  .reduce((sum, f) => sum + gzipSync(readFileSync(join(dir, f))).length, 0);

const kb = total / 1024;
console.log(`JS (gzip): ${kb.toFixed(1)} KB / ${BUDGET_KB} KB budget`);
if (kb > BUDGET_KB) {
  console.error('Bundle size budget exceeded.');
  process.exit(1);
}
