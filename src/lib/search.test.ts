import { describe, it, expect } from 'vitest';
import { normalize, searchAll, SEARCH_LIMIT_PER_KIND, type SearchSources } from './search';

const src: SearchSources = {
  events: [
    { id: 'e1', date: '2026-08-15', title: 'Festival de Joropo', venue: 'Plaza Bolívar', note: '', typeLabel: 'Presentación', dateStr: 'sáb 15 ago 2026' },
    { id: 'e2', date: '2026-08-18', title: 'Ensayo', venue: 'Garaje de Luis', note: 'Repasar Alma Llanera', typeLabel: 'Ensayo en garaje', dateStr: 'mar 18 ago 2026' },
  ],
  songs: [
    { id: 's1', title: 'Alma Llanera', genreLabel: 'Joropo', key: 'Am' },
    { id: 's2', title: 'Canción del Zulia', genreLabel: 'Gaita', key: 'D' },
  ],
  tx: [
    { id: 't1', date: '2026-08-16', desc: 'Honorarios festival', dateStr: '16 ago 2026', amountStr: '+$450.00', by: 'Ana', categoryLabel: 'Honorarios', eventLabel: 'Festival de Joropo', gearLabel: null },
    { id: 't2', date: '2026-08-02', desc: 'Cuerdas de cuatro', dateStr: '2 ago 2026', amountStr: '−$47.30', by: 'Luis', categoryLabel: null, eventLabel: null, gearLabel: 'Cuatro' },
  ],
  threads: [{ id: 'b1', date: '2026-08-01', comments: [{ text: 'Yo llevo el bajo', author: 'Luis', date: '2026-08-05' }], title: 'Tocar gaitas en diciembre', body: 'Podríamos armar un set navideño', author: 'Ana', dateStr: '1 ago 2026' }],
};

describe('normalize', () => {
  it('lowercases and strips accents', () => {
    expect(normalize('Canción Bolívar')).toBe('cancion bolivar');
  });
});

describe('searchAll', () => {
  it('returns nothing for an empty or whitespace query', () => {
    expect(searchAll('', src)).toEqual([]);
    expect(searchAll('   ', src)).toEqual([]);
  });

  it('finds across types, ordered events → songs → fund → ideas', () => {
    const hits = searchAll('joropo', src);
    expect(hits.map((h) => `${h.kind}:${h.id}`)).toEqual(['event:e1', 'song:s1', 'fund:t1']);
  });

  it('ignores accents and case', () => {
    expect(searchAll('CANCION', src).map((h) => h.id)).toEqual(['s2']);
    expect(searchAll('bolivar', src).map((h) => h.id)).toEqual(['e1']);
  });

  it('requires every term to match', () => {
    expect(searchAll('alma llanera', src).map((h) => h.id)).toEqual(['e2', 's1']);
    expect(searchAll('alma zulia', src)).toEqual([]);
  });

  it('matches on secondary fields (gear, note, body, author)', () => {
    expect(searchAll('cuatro', src).map((h) => h.id)).toEqual(['t2']);
    expect(searchAll('navideño', src).map((h) => h.id)).toEqual(['b1']);
    expect(searchAll('luis', src).map((h) => h.id)).toEqual(['e2', 't2', 'b1']);
  });

  it('builds a readable sub line', () => {
    expect(searchAll('zulia', src)[0]).toEqual({ kind: 'song', id: 's2', title: 'Canción del Zulia', sub: 'Gaita · D' });
  });

  it('lists the newest first within each type', () => {
    const more: SearchSources = {
      ...src,
      events: [
        { id: 'old', date: '2025-01-01', title: 'Joropo viejo', venue: '', note: '', typeLabel: 'Presentación', dateStr: '' },
        { id: 'new', date: '2026-09-01', title: 'Joropo nuevo', venue: '', note: '', typeLabel: 'Presentación', dateStr: '' },
        { id: 'mid', date: '2026-01-01', title: 'Joropo medio', venue: '', note: '', typeLabel: 'Presentación', dateStr: '' },
      ],
      tx: [
        { ...src.tx[0], id: 'tA', date: '2026-01-01', desc: 'Joropo A' },
        { ...src.tx[0], id: 'tB', date: '2026-03-01', desc: 'Joropo B' },
      ],
    };
    const hits = searchAll('joropo', more);
    expect(hits.filter((h) => h.kind === 'event').map((h) => h.id)).toEqual(['new', 'mid', 'old']);
    expect(hits.filter((h) => h.kind === 'fund').map((h) => h.id)).toEqual(['tB', 'tA']);
  });

  it('finds forum comments and shows the matching one', () => {
    const [hit] = searchAll('bajo', src);
    expect(hit).toMatchObject({ kind: 'idea', id: 'b1', title: 'Tocar gaitas en diciembre', sub: 'Luis: Yo llevo el bajo' });
  });

  it('ranks an idea matched via a comment by that comment\'s date', () => {
    const t = (id: string, date: string, cdate: string) => ({
      id, date, title: `Idea ${id}`, body: '', author: 'Ana', dateStr: '',
      comments: [{ text: 'gaita', author: 'Luis', date: cdate }],
    });
    const hits = searchAll('gaita', { ...src, songs: [], threads: [t('a', '2026-01-01', '2026-06-01'), t('b', '2026-03-01', '2026-04-01')] });
    expect(hits.map((h) => h.id)).toEqual(['a', 'b']);
  });

  it('caps each type independently', () => {
    const many: SearchSources = {
      ...src,
      songs: Array.from({ length: 20 }, (_, i) => ({ id: `s${i}`, title: `Tema ${i}`, genreLabel: 'Pop', key: 'C' })),
    };
    const hits = searchAll('tema', many);
    expect(hits).toHaveLength(SEARCH_LIMIT_PER_KIND);
    expect(hits.every((h) => h.kind === 'song')).toBe(true);
  });
});
