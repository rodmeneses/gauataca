/** Helpers shared by the fetch mappers and the per-entity mutation modules. */
// Untyped PostgREST rows (no generated DB types); the mappers own the typing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export const groupBy = (rows: Row[], key: string): Map<string, Row[]> => {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const k = r[key];
    if (k == null) continue;
    const arr = m.get(k) ?? [];
    arr.push(r);
    m.set(k, arr);
  }
  return m;
};

export const shortName = (name: string): string => name.split(/\s+/)[0];
export const initials = (name: string): string =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const newId = (prefix: string): string =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
