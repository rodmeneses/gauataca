/**
 * Inline validation for the New/Edit forms. Each validator returns a map of
 * field → i18n error key; an empty map means the form can be saved.
 */
export type FormErrorKey =
  | 'errAmount' | 'errTitle' | 'errNumber' | 'errHours' | 'errBpm' | 'errDuration'
  | 'errUrl' | 'errTooLong' | 'errTooBig' | 'errName' | 'errEmail' | 'errPassword' | 'errTime';
export type FormErrors = Partial<Record<string, FormErrorKey>>;

/** Parse a user-typed number, accepting a decimal comma ("12,5"). NaN when blank or not a number. */
export function parseNum(v: string | undefined): number {
  const s = (v ?? '').trim().replace(',', '.');
  return s === '' ? NaN : Number(s);
}

const blank = (v: string | undefined) => !(v ?? '').trim();

/** Max lengths for free-text fields (mirrored by the V16 DB constraints). */
export const LIMITS = { title: 120, short: 80, note: 2000, url: 500, label: 80 } as const;
/** Largest money amount accepted in USD (the DB stores cents in an int). */
export const MAX_MONEY = 1_000_000;
export const MIN_PASSWORD = 8;

/** Upload limits: images up to 10 MB (they're compressed before upload); proofs may also be PDFs. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

/** True when `file` is an image (or, with `allowPdf`, a PDF) no larger than `maxBytes`. */
export function isValidUpload(file: { size: number; type: string }, maxBytes: number, allowPdf = false): boolean {
  if (file.size <= 0 || file.size > maxBytes) return false;
  return file.type.startsWith('image/') || (allowPdf && file.type === 'application/pdf');
}

const tooLong = (v: string | undefined, max: number) => (v ?? '').trim().length > max;

/** Accepts only http(s) URLs; adds https:// when the scheme is missing. Returns null if invalid. */
export function normalizeUrl(raw: string | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v || v.length > LIMITS.url) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.') ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Money: blank is allowed when `optional`; otherwise a number in [min, MAX_MONEY]. */
function badMoney(v: string | undefined, positive: boolean): FormErrorKey | undefined {
  const n = parseNum(v);
  if (!(positive ? n > 0 : n >= 0)) return positive ? 'errAmount' : 'errNumber';
  if (n > MAX_MONEY) return 'errTooBig';
  return undefined;
}

/** Link rows (event / song): a row with a URL needs a valid one and a label within limits. */
function linkErrors(links: { label?: string; url: string }[] | undefined, e: FormErrors) {
  (links ?? []).forEach((l, i) => {
    if (blank(l.url) && blank(l.label)) return;
    if (!normalizeUrl(l.url)) e[`link${i}`] = 'errUrl';
    else if (tooLong(l.label, LIMITS.label)) e[`link${i}`] = 'errTooLong';
  });
}

export function validateTx(f: { amt?: string; desc?: string }): FormErrors {
  const e: FormErrors = {};
  const amt = badMoney(f.amt, true);
  if (amt) e.amt = amt;
  if (tooLong(f.desc, LIMITS.title)) e.desc = 'errTooLong';
  return e;
}

export function validateEvent(f: {
  title?: string; venue?: string; note?: string; time?: string; hours?: string; fee?: string; cost?: string;
  eventLinks?: { label: string; url: string }[];
}): FormErrors {
  const e: FormErrors = {};
  if (blank(f.title)) e.title = 'errTitle';
  else if (tooLong(f.title, LIMITS.title)) e.title = 'errTooLong';
  if (tooLong(f.venue, LIMITS.title)) e.venue = 'errTooLong';
  if (tooLong(f.note, LIMITS.note)) e.note = 'errTooLong';
  if (!blank(f.time) && !/^([01]\d|2[0-3]):[0-5]\d$/.test(f.time!.trim())) e.time = 'errTime';
  if (!blank(f.hours)) {
    const h = parseNum(f.hours);
    if (!(h > 0)) e.hours = 'errHours';
    else if (h > 48) e.hours = 'errTooBig';
  }
  if (!blank(f.fee)) { const m = badMoney(f.fee, false); if (m) e.fee = m; }
  if (!blank(f.cost)) { const m = badMoney(f.cost, false); if (m) e.cost = m; }
  linkErrors(f.eventLinks, e);
  return e;
}

export function validateSong(f: {
  title?: string; key?: string; bpm?: string; dur?: string; songLinks?: { label: string; url: string }[];
}): FormErrors {
  const e: FormErrors = {};
  if (blank(f.title)) e.title = 'errTitle';
  else if (tooLong(f.title, LIMITS.title)) e.title = 'errTooLong';
  if (tooLong(f.key, 10)) e.key = 'errTooLong';
  if (!blank(f.bpm)) {
    const bpm = parseNum(f.bpm);
    if (!Number.isInteger(bpm) || bpm < 20 || bpm > 400) e.bpm = 'errBpm';
  }
  if (!blank(f.dur) && !/^\d{1,2}:[0-5]\d$/.test(f.dur!.trim())) e.dur = 'errDuration';
  linkErrors(f.songLinks, e);
  return e;
}

export function validateGear(f: { name?: string; cost?: string; note?: string }): FormErrors {
  const e: FormErrors = {};
  if (blank(f.name)) e.name = 'errTitle';
  else if (tooLong(f.name, LIMITS.title)) e.name = 'errTooLong';
  if (!blank(f.cost)) { const m = badMoney(f.cost, false); if (m) e.cost = m; }
  if (tooLong(f.note, LIMITS.note)) e.note = 'errTooLong';
  return e;
}

/** Settle dialog: fee/cost may be blank (= 0) but must otherwise be non-negative numbers. */
export function validateSettle(f: { fee?: string; cost?: string }, happened: boolean): FormErrors {
  const e: FormErrors = {};
  if (happened && !blank(f.fee)) { const m = badMoney(f.fee, false); if (m) e.fee = m; }
  if (!blank(f.cost)) { const m = badMoney(f.cost, false); if (m) e.cost = m; }
  return e;
}

export function validateAuth(f: { email?: string; password?: string; name?: string }, signup: boolean): FormErrors {
  const e: FormErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((f.email ?? '').trim())) e.email = 'errEmail';
  if (signup) {
    if (blank(f.name)) e.name = 'errName';
    else if (tooLong(f.name, LIMITS.short)) e.name = 'errTooLong';
    if ((f.password ?? '').length < MIN_PASSWORD) e.password = 'errPassword';
  } else if (!f.password) e.password = 'errPassword';
  return e;
}
