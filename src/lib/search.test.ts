import { describe, it, expect } from 'vitest';
import { editDistance, normalize, searchAll, SEARCH_LIMIT_PER_KIND, SEARCH_LIMIT_SINGLE_KIND, type SearchSources } from './search';

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
  polls: [{ id: 'b1', date: '2026-08-01', question: '¿Qué día ensayamos?', options: ['Martes', 'Jueves'], threadTitle: 'Tocar gaitas en diciembre', author: 'Ana' }],
  links: [{ id: 7, title: 'Carpeta de partituras', url: 'https://drive.google.com/abc', categoryLabel: 'Documentos', by: 'Luis' }],
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
    expect(searchAll('luis', src).map((h) => h.id)).toEqual(['e2', 't2', 'b1', '7']);
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

  it('truncates a long comment snippet with an ellipsis', () => {
    const long = 'bajo '.repeat(30);
    const threads: SearchSources['threads'] = [
      { id: 'b2', date: '2026-08-01', title: 'Idea', body: '', author: 'Ana', dateStr: '', comments: [{ text: long, author: 'Luis', date: '2026-08-05' }] },
    ];
    const [hit] = searchAll('bajo', { ...src, threads });
    expect(hit.sub.length).toBeLessThan(long.length);
    expect(hit.sub.endsWith('…')).toBe(true);
  });

  it('keeps input order when two hits share the same date', () => {
    const events: SearchSources['events'] = [
      { id: 'e1', date: '2026-08-01', title: 'Joropo uno', venue: '', note: '', typeLabel: '', dateStr: '' },
      { id: 'e2', date: '2026-08-01', title: 'Joropo dos', venue: '', note: '', typeLabel: '', dateStr: '' },
    ];
    const hits = searchAll('joropo', { ...src, events, songs: [], tx: [], threads: [], polls: [], links: [] });
    expect(hits.map((h) => h.id)).toEqual(['e1', 'e2']);
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

  it('finds polls by question or option and links by title, url or category', () => {
    expect(searchAll('jueves', src)).toEqual([
      { kind: 'poll', id: 'b1', title: '¿Qué día ensayamos?', sub: 'Tocar gaitas en diciembre · Martes / Jueves' },
    ]);
    expect(searchAll('drive', src)).toEqual([{ kind: 'link', id: '7', title: 'Carpeta de partituras', sub: 'Documentos · drive.google.com/abc' }]);
    expect(searchAll('documentos', src).map((h) => h.kind)).toEqual(['link']);
  });

  it('caps polls and links per type', () => {
    const polls = Array.from({ length: SEARCH_LIMIT_PER_KIND + 2 }, (_, i) => ({ id: `p${i}`, date: `2026-01-${10 + i}`, question: 'Votar', options: [], threadTitle: '', author: '' }));
    const links = Array.from({ length: SEARCH_LIMIT_PER_KIND + 2 }, (_, i) => ({ id: i, title: 'Votar', url: 'x.com', categoryLabel: '', by: '' }));
    const hits = searchAll('votar', { ...src, polls, links });
    expect(hits.filter((h) => h.kind === 'poll')).toHaveLength(SEARCH_LIMIT_PER_KIND);
    expect(hits.filter((h) => h.kind === 'link')).toHaveLength(SEARCH_LIMIT_PER_KIND);
    expect(hits[0].id).toBe(`p${SEARCH_LIMIT_PER_KIND + 1}`);
  });
});

describe('editDistance', () => {
  it('counts insertions, deletions and substitutions', () => {
    expect(editDistance('llanera', 'llanera', 2)).toBe(0);
    expect(editDistance('llanera', 'lanera', 2)).toBe(1);
    expect(editDistance('llanera', 'llanerq', 2)).toBe(1);
    expect(editDistance('abc', 'xyz', 3)).toBe(3);
  });

  it('gives up early past the budget', () => {
    expect(editDistance('abcdef', 'a', 2)).toBe(3);
    expect(editDistance('abcdefgh', 'zzzzzzzz', 1)).toBe(2);
  });
});

describe('typo tolerance', () => {
  it('finds a word with one typo from 4 letters', () => {
    expect(searchAll('lanera', src).map((h) => h.id)).toContain('s1');
    expect(searchAll('jorope', src).map((h) => h.id)).toContain('s1');
  });

  it('allows two typos in long words and a half-typed word', () => {
    expect(searchAll('honorarias', src).map((h) => h.id)).toContain('t1');
    expect(searchAll('festibal', src).map((h) => h.id)).toContain('e1');
  });

  it('does not guess on short terms', () => {
    expect(searchAll('alm', src).map((h) => h.kind)).toContain('song'); // substring, not fuzzy
    expect(searchAll('zzx', src)).toEqual([]);
    expect(searchAll('lun', src).map((h) => h.id)).not.toContain('e2'); // "luis" is 2 edits away
  });

  it('still requires every term to match', () => {
    expect(searchAll('lanera zzzzzz', src)).toEqual([]);
  });

  it('ranks verbatim matches before typo matches in the same type', () => {
    const songs = [
      { id: 'typo', title: 'Alma Lanera', genreLabel: 'Joropo', key: 'Am' },
      { id: 'exact', title: 'Llanera', genreLabel: 'Joropo', key: 'Am' },
    ];
    expect(searchAll('llanera', { ...src, events: [], tx: [], threads: [], polls: [], links: [], songs }).map((h) => h.id)).toEqual(['exact', 'typo']);
  });

  it('matches an idea through a comment typo', () => {
    expect(searchAll('bajp', src).map((h) => h.sub)).toContain('Luis: Yo llevo el bajo');
  });
});

describe('kind filter', () => {
  it('returns only the chosen type, with a bigger cap', () => {
    const many: SearchSources = {
      ...src,
      songs: Array.from({ length: 30 }, (_, i) => ({ id: `s${i}`, title: `Tema ${i}`, genreLabel: 'Pop', key: 'C' })),
      links: [{ id: 1, title: 'Tema link', url: 'x.com', categoryLabel: '', by: '' }],
    };
    const hits = searchAll('tema', many, { kind: 'song' });
    expect(hits).toHaveLength(30);
    expect(hits.length).toBeLessThanOrEqual(SEARCH_LIMIT_SINGLE_KIND);
    expect(hits.every((h) => h.kind === 'song')).toBe(true);
    expect(searchAll('tema', many, { kind: 'all' }).some((h) => h.kind === 'link')).toBe(true);
  });

  it.each(['event', 'fund', 'idea', 'poll', 'link'] as const)('filters to %s', (kind) => {
    const hits = searchAll('a', src, { kind });
    expect(hits.every((h) => h.kind === kind)).toBe(true);
  });
});
