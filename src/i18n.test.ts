import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { T } from './i18n';

describe('T (translation dictionary)', () => {
  it('has an es and en dictionary', () => {
    expect(Object.keys(T).sort()).toEqual(['en', 'es']);
  });

  it('es and en expose exactly the same keys', () => {
    const esKeys = Object.keys(T.es).sort();
    const enKeys = Object.keys(T.en).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it('has no empty string values in either language', () => {
    for (const [lang, dict] of Object.entries(T)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value, `${lang}.${key} should not be empty`).not.toBe('');
      }
    }
  });

  it('keeps %d placeholders in step between languages', () => {
    for (const key of Object.keys(T.es) as (keyof typeof T.es)[]) {
      const esHasPlaceholder = T.es[key].includes('%d');
      const enHasPlaceholder = T.en[key].includes('%d');
      expect(enHasPlaceholder, `${key} placeholder mismatch`).toBe(esHasPlaceholder);
    }
  });
});

describe('T usage', () => {
  const root = path.resolve(__dirname);
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) && e.name !== 'i18n.ts') files.push(p);
    }
  };
  walk(root);
  const source = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

  it('has no dictionary keys that nothing references', () => {
    // `sub*` keys are looked up dynamically per view. Keys are reached as t.key, T[lang].key, T.es.key or a quoted string.
    const unused = (Object.keys(T.es) as string[]).filter(
      (k) => !k.startsWith('sub') && !new RegExp(`\\b${k}\\b`).test(source),
    );
    expect(unused).toEqual([]);
  });

  it('has no hardcoded aria-label / title string literals in components', () => {
    const offenders: string[] = [];
    for (const f of files.filter((f) => f.includes(`${path.sep}components${path.sep}`))) {
      if (f.endsWith('DesignSystem.tsx')) continue;
      fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (/\b(aria-label|title)="[A-Za-zÁ-ú]/.test(line)) offenders.push(`${path.relative(root, f)}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});