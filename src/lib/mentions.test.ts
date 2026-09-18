import { describe, expect, it } from 'vitest';
import { formatMention, getPartialMention, parseMentions } from './mentions';

describe('formatMention', () => {
  it('wraps the id in a typed token', () => {
    expect(formatMention('song', 'abc123')).toBe('@{song:abc123}');
    expect(formatMention('event', 'x1')).toBe('@{event:x1}');
  });
});

describe('parseMentions', () => {
  it('splits text and references, keeping literal text', () => {
    expect(parseMentions('Listen to @{song:abc} then @{event:xyz}!')).toEqual([
      { type: 'text', text: 'Listen to ' },
      { type: 'ref', kind: 'song', id: 'abc' },
      { type: 'text', text: ' then ' },
      { type: 'ref', kind: 'event', id: 'xyz' },
      { type: 'text', text: '!' },
    ]);
  });

  it('returns a single text segment when there are no mentions', () => {
    expect(parseMentions('no tokens here')).toEqual([{ type: 'text', text: 'no tokens here' }]);
  });

  it('handles the empty string', () => {
    expect(parseMentions('')).toEqual([]);
  });
});

describe('getPartialMention', () => {
  it('finds the open token under the caret', () => {
    const text = 'check @{song:abc';
    expect(getPartialMention(text, text.length)).toEqual({ start: 6, kind: 'song', query: 'abc' });
  });

  it('allows spaces in the query', () => {
    const text = '@{event:palo de';
    expect(getPartialMention(text, text.length)).toEqual({ start: 0, kind: 'event', query: 'palo de' });
  });

  it('returns null once the token is closed', () => {
    const text = '@{song:abc} tail';
    expect(getPartialMention(text, text.indexOf('}') + 1)).toBeNull();
  });

  it('returns null when no @-token precedes the caret', () => {
    expect(getPartialMention('plain text', 4)).toBeNull();
  });
});
