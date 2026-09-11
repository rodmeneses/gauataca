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
