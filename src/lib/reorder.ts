/** Move the item at `from` to index `to`, returning a new array (the same one if nothing changes). */
export function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= list.length || to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Index of the row whose vertical midpoint is nearest to `y` (rows given as top/bottom pairs). */
export function rowIndexAt(rows: { top: number; bottom: number }[], y: number): number {
  let best = 0;
  let bestDist = Infinity;
  rows.forEach((r, i) => {
    const d = Math.abs((r.top + r.bottom) / 2 - y);
    if (d < bestDist) { best = i; bestDist = d; }
  });
  return best;
}
