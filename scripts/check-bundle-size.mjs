// Fails when gzipped JS exceeds a budget, so bundle growth is a conscious decision.
// Two budgets: the entry chunk (what every visitor downloads before the app renders) and the
// total across all chunks (what the service worker precaches; code-split chunks add gzip
// overhead, so it is higher than the sum before splitting). Raise a budget deliberately
// (and say why in the PR) when a feature genuinely needs it.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const ENTRY_BUDGET_KB = 175;
const TOTAL_BUDGET_KB = 240;
const dir = 'dist/assets';

const gz = (file) => gzipSync(readFileSync(join(dir, file))).length / 1024;
const files = readdirSync(dir).filter((f) => f.endsWith('.js'));
const total = files.reduce((sum, f) => sum + gz(f), 0);

// The entry chunk is the one index.html loads as a module script.
const html = readFileSync('dist/index.html', 'utf8');
const entryName = html.match(/src="\/assets\/([^"]+\.js)"/)?.[1];
if (!entryName) {
  console.error('Could not find the entry chunk in dist/index.html.');
  process.exit(1);
}
const entry = gz(entryName);

console.log(`Entry JS (gzip): ${entry.toFixed(1)} KB / ${ENTRY_BUDGET_KB} KB budget`);
console.log(`Total JS (gzip): ${total.toFixed(1)} KB / ${TOTAL_BUDGET_KB} KB budget`);
if (entry > ENTRY_BUDGET_KB || total > TOTAL_BUDGET_KB) {
  console.error('Bundle size budget exceeded.');
  process.exit(1);
}
