/**
 * Inline validation for the New/Edit forms. Each validator returns a map of
 * field → i18n error key; an empty map means the form can be saved.
 */
export type FormErrorKey = 'errAmount' | 'errTitle' | 'errNumber' | 'errHours' | 'errBpm' | 'errDuration';
export type FormErrors = Partial<Record<string, FormErrorKey>>;

/** Parse a user-typed number, accepting a decimal comma ("12,5"). NaN when blank or not a number. */
export function parseNum(v: string | undefined): number {
  const s = (v ?? '').trim().replace(',', '.');
  return s === '' ? NaN : Number(s);
}

const blank = (v: string | undefined) => !(v ?? '').trim();

export function validateTx(f: { amt?: string }): FormErrors {
  const e: FormErrors = {};
  if (!(parseNum(f.amt) > 0)) e.amt = 'errAmount';
  return e;
}

export function validateEvent(f: { title?: string; hours?: string; fee?: string; cost?: string }): FormErrors {
  const e: FormErrors = {};
  if (blank(f.title)) e.title = 'errTitle';
  if (!blank(f.hours) && !(parseNum(f.hours) > 0)) e.hours = 'errHours';
  if (!blank(f.fee) && !(parseNum(f.fee) >= 0)) e.fee = 'errNumber';
  if (!blank(f.cost) && !(parseNum(f.cost) >= 0)) e.cost = 'errNumber';
  return e;
}

export function validateSong(f: { title?: string; bpm?: string; dur?: string }): FormErrors {
  const e: FormErrors = {};
  if (blank(f.title)) e.title = 'errTitle';
  if (!blank(f.bpm)) {
    const bpm = parseNum(f.bpm);
    if (!Number.isInteger(bpm) || bpm < 20 || bpm > 400) e.bpm = 'errBpm';
  }
  if (!blank(f.dur) && !/^\d{1,2}:[0-5]\d$/.test(f.dur!.trim())) e.dur = 'errDuration';
  return e;
}
