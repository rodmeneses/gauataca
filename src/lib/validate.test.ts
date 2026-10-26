import { describe, it, expect } from 'vitest';
import {
  parseNum, validateTx, validateEvent, validateSong, validateGear, validateSettle, validateAuth, normalizeUrl, isValidUpload,
  LIMITS, MAX_MONEY,
} from './validate';

describe('parseNum', () => {
  it('parses dots and decimal commas', () => {
    expect(parseNum('12.5')).toBe(12.5);
    expect(parseNum(' 12,5 ')).toBe(12.5);
  });
  it('is NaN for blank, undefined and junk', () => {
    expect(parseNum('')).toBeNaN();
    expect(parseNum(undefined)).toBeNaN();
    expect(parseNum('abc')).toBeNaN();
  });
});

describe('validateTx', () => {
  it('requires a positive amount', () => {
    expect(validateTx({})).toEqual({ amt: 'errAmount' });
    expect(validateTx({ amt: '0' })).toEqual({ amt: 'errAmount' });
    expect(validateTx({ amt: '-5' })).toEqual({ amt: 'errAmount' });
    expect(validateTx({ amt: '450,50' })).toEqual({});
  });
});

describe('validateEvent', () => {
  it('requires a title', () => {
    expect(validateEvent({ title: '  ' })).toEqual({ title: 'errTitle' });
    expect(validateEvent({})).toEqual({ title: 'errTitle' });
  });
  it('checks optional numbers only when filled in', () => {
    expect(validateEvent({ title: 'x' })).toEqual({});
    expect(validateEvent({ title: 'x', hours: '0', fee: '-1', cost: 'abc' })).toEqual({ hours: 'errHours', fee: 'errNumber', cost: 'errNumber' });
    expect(validateEvent({ title: 'x', hours: '2.5', fee: '600', cost: '0' })).toEqual({});
  });
  it('accepts minutes alongside or instead of hours', () => {
    expect(validateEvent({ title: 'x', mins: '15' })).toEqual({});
    expect(validateEvent({ title: 'x', hours: '1', mins: '30' })).toEqual({});
    expect(validateEvent({ title: 'x', hours: '0', mins: '0' })).toEqual({ hours: 'errHours' });
    expect(validateEvent({ title: 'x', hours: '-1', mins: '30' })).toEqual({ hours: 'errHours' });
    expect(validateEvent({ title: 'x', mins: 'abc' })).toEqual({ hours: 'errHours' });
    expect(validateEvent({ title: 'x', mins: '60' })).toEqual({ hours: 'errMinutes' });
    expect(validateEvent({ title: 'x', mins: '7.5' })).toEqual({ hours: 'errMinutes' });
    expect(validateEvent({ title: 'x', hours: '48', mins: '1' })).toEqual({ hours: 'errTooBig' });
  });
});

describe('validateSong', () => {
  it('requires a title', () => {
    expect(validateSong({})).toEqual({ title: 'errTitle' });
  });
  it('checks bpm range and integer-ness', () => {
    expect(validateSong({ title: 'x', bpm: '10' })).toEqual({ bpm: 'errBpm' });
    expect(validateSong({ title: 'x', bpm: '500' })).toEqual({ bpm: 'errBpm' });
    expect(validateSong({ title: 'x', bpm: '120.5' })).toEqual({ bpm: 'errBpm' });
    expect(validateSong({ title: 'x', bpm: '196' })).toEqual({});
  });
  it('checks m:ss durations', () => {
    expect(validateSong({ title: 'x', dur: '345' })).toEqual({ dur: 'errDuration' });
    expect(validateSong({ title: 'x', dur: '3:75' })).toEqual({ dur: 'errDuration' });
    expect(validateSong({ title: 'x', dur: '3:45' })).toEqual({});
  });
});

describe('normalizeUrl', () => {
  it('adds https and rejects junk', () => {
    expect(normalizeUrl('example.com/a')).toBe('https://example.com/a');
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/');
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('ftp://example.com')).toBeNull();
    expect(normalizeUrl('localhost')).toBeNull();
    expect(normalizeUrl('  ')).toBeNull();
    expect(normalizeUrl(undefined)).toBeNull();
    expect(normalizeUrl('a b')).toBeNull();
    expect(normalizeUrl(`example.com/${'x'.repeat(LIMITS.url)}`)).toBeNull();
  });
});

describe('extra tx/event/song rules', () => {
  const long = 'x'.repeat(LIMITS.note + 1);
  it('caps money, lengths, time and links', () => {
    expect(validateTx({ amt: String(MAX_MONEY + 1) })).toEqual({ amt: 'errTooBig' });
    expect(validateTx({ amt: '5', desc: long })).toEqual({ desc: 'errTooLong' });
    expect(validateEvent({ title: long, venue: long, note: long })).toEqual({ title: 'errTooLong', venue: 'errTooLong', note: 'errTooLong' });
    expect(validateEvent({ title: 'x', time: '25:00' })).toEqual({ time: 'errTime' });
    expect(validateEvent({ title: 'x', time: '19:30', hours: '49', fee: String(MAX_MONEY + 1) })).toEqual({ hours: 'errTooBig', fee: 'errTooBig' });
    expect(validateEvent({ title: 'x', cost: '-1' })).toEqual({ cost: 'errNumber' });
    expect(validateEvent({ title: 'x', eventLinks: [{ label: '', url: '' }, { label: 'a', url: 'nope' }, { label: long, url: 'a.com' }, { label: 'ok', url: 'a.com' }] }))
      .toEqual({ link1: 'errUrl', link2: 'errTooLong' });
    expect(validateSong({ title: long, key: 'x'.repeat(11) })).toEqual({ title: 'errTooLong', key: 'errTooLong' });
    expect(validateSong({ title: 'x', songLinks: [{ label: '', url: 'bad' }] })).toEqual({ link0: 'errUrl' });
    expect(validateSong({ title: 'x', songLinks: undefined })).toEqual({});
  });
});

describe('validateGear', () => {
  it('requires a name and sane cost', () => {
    expect(validateGear({})).toEqual({ name: 'errTitle' });
    expect(validateGear({ name: long() })).toEqual({ name: 'errTooLong' });
    expect(validateGear({ name: 'Amp', cost: 'abc', note: long(3000) })).toEqual({ cost: 'errNumber', note: 'errTooLong' });
    expect(validateGear({ name: 'Amp', cost: '305' })).toEqual({});
  });
});

function long(n = 200) {
  return 'x'.repeat(n);
}

describe('validateSettle', () => {
  it('allows blanks, rejects negatives; ignores fee when not happened', () => {
    expect(validateSettle({}, true)).toEqual({});
    expect(validateSettle({ fee: '-1', cost: 'x' }, true)).toEqual({ fee: 'errNumber', cost: 'errNumber' });
    expect(validateSettle({ fee: '-1', cost: '5' }, false)).toEqual({});
  });
});

describe('validateAuth', () => {
  it('checks email, name and password', () => {
    expect(validateAuth({ email: 'bad', password: '' }, false)).toEqual({ email: 'errEmail', password: 'errPassword' });
    expect(validateAuth({ email: 'a@b.co', password: 'x' }, false)).toEqual({});
    expect(validateAuth({ email: 'a@b.co', password: 'short', name: ' ' }, true)).toEqual({ name: 'errName', password: 'errPassword' });
    expect(validateAuth({ email: 'a@b.co', password: 'longenough', name: long() }, true)).toEqual({ name: 'errTooLong' });
    expect(validateAuth({ email: ' a@b.co ', password: 'longenough', name: 'Ana' }, true)).toEqual({});
    expect(validateAuth({}, true)).toEqual({ email: 'errEmail', name: 'errName', password: 'errPassword' });
  });
});

describe('isValidUpload', () => {
  it('checks size and type', () => {
    expect(isValidUpload({ size: 10, type: 'image/png' }, 100)).toBe(true);
    expect(isValidUpload({ size: 101, type: 'image/png' }, 100)).toBe(false);
    expect(isValidUpload({ size: 0, type: 'image/png' }, 100)).toBe(false);
    expect(isValidUpload({ size: 10, type: 'application/pdf' }, 100)).toBe(false);
    expect(isValidUpload({ size: 10, type: 'application/pdf' }, 100, true)).toBe(true);
    expect(isValidUpload({ size: 10, type: 'video/mp4' }, 100, true)).toBe(false);
  });
});
