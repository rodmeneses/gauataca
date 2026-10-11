import { describe, it, expect } from 'vitest';
import { parseNum, validateTx, validateEvent, validateSong } from './validate';

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
