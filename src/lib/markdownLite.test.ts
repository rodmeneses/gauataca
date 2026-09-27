import { describe, expect, it } from 'vitest';
import { parseBlocks, parseInline } from './markdownLite';

describe('parseBlocks', () => {
  it('splits headings by level', () => {
    expect(parseBlocks('# Uno\n## Dos\n### Tres')).toEqual([
      { type: 'heading', level: 1, text: 'Uno' },
      { type: 'heading', level: 2, text: 'Dos' },
      { type: 'heading', level: 3, text: 'Tres' },
    ]);
  });

  it('groups consecutive bullet items into one list', () => {
    expect(parseBlocks('- uno\n- dos\n- tres')).toEqual([
      { type: 'list', ordered: false, items: ['uno', 'dos', 'tres'] },
    ]);
  });

  it('groups consecutive numbered items into an ordered list', () => {
    expect(parseBlocks('1. uno\n2. dos')).toEqual([
      { type: 'list', ordered: true, items: ['uno', 'dos'] },
    ]);
  });

  it('joins consecutive non-blank lines into one paragraph, preserving breaks', () => {
    expect(parseBlocks('linea uno\nlinea dos')).toEqual([
      { type: 'paragraph', text: 'linea uno\nlinea dos' },
    ]);
  });

  it('separates paragraphs on blank lines', () => {
    expect(parseBlocks('parrafo uno\n\nparrafo dos')).toEqual([
      { type: 'paragraph', text: 'parrafo uno' },
      { type: 'paragraph', text: 'parrafo dos' },
    ]);
  });

  it('mixes headings, lists and paragraphs in document order', () => {
    expect(parseBlocks('## Sonido\nintro\n- uno\n- dos\notro parrafo')).toEqual([
      { type: 'heading', level: 2, text: 'Sonido' },
      { type: 'paragraph', text: 'intro' },
      { type: 'list', ordered: false, items: ['uno', 'dos'] },
      { type: 'paragraph', text: 'otro parrafo' },
    ]);
  });

  it('returns nothing for the empty string', () => {
    expect(parseBlocks('')).toEqual([]);
  });
});

describe('parseInline', () => {
  it('splits bold, italic and plain runs', () => {
    expect(parseInline('esto es **negrita** y esto _cursiva_')).toEqual([
      { text: 'esto es ' },
      { text: 'negrita', bold: true },
      { text: ' y esto ' },
      { text: 'cursiva', italic: true },
    ]);
  });

  it('returns a single plain piece with no emphasis', () => {
    expect(parseInline('texto plano')).toEqual([{ text: 'texto plano' }]);
  });
});
