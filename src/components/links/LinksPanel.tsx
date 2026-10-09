/** Shared band links board — used by the desktop Links view and the mobile Links tab. */
import { useState } from 'react';
import { Copy, ExternalLink, Link2, Trash2 } from 'lucide-react';
import { useGuataca } from '@/store';
import { useData } from '@/lib/data';
import { AddButton, Badge, Button, Card, Field, Input, Select } from '@/components/ui';
import type { BandLink, LinkCategory } from '@/types';
import { UNDO_WINDOW_MS } from '@/lib/optimistic';

const CATEGORIES: LinkCategory[] = ['docs', 'music', 'social', 'logistics', 'other'];
const CAT_COLOR: Record<LinkCategory, string> = {
  docs: 'var(--color-violet-light)',
  music: 'var(--color-emerald)',
  social: 'var(--color-amber)',
  logistics: 'var(--color-ink-meta)',
  other: 'var(--color-ink-muted)',
};

/** Accepts only http(s) URLs; adds https:// when the scheme is missing. Returns null if invalid. */
function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.') ? u.toString() : null;
  } catch {
    return null;
  }
}

export function LinksPanel() {
  const { t, signedIn, isAdmin, me, toast } = useGuataca();
  const { links, createLink, deleteLink } = useData();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<LinkCategory>('other');
  const [touched, setTouched] = useState(false);

  const catLabel: Record<LinkCategory, string> = { docs: t.catDocs, music: t.catMusic, social: t.catSocial, logistics: t.catLogistics, other: t.catOther };
  const normalized = normalizeUrl(url);

  const reset = () => { setAdding(false); setTitle(''); setUrl(''); setCategory('other'); setTouched(false); };
  const submit = async () => {
    setTouched(true);
    if (!title.trim() || !normalized) return;
    await createLink({ title: title.trim(), url: normalized, category });
    reset();
  };

  const groups = CATEGORIES.map((c) => ({ c, items: links.filter((l) => l.category === c) })).filter((g) => g.items.length > 0);
  const copy = async (l: BandLink) => {
    try {
      await navigator.clipboard.writeText(l.url);
      toast(t.linkCopied);
    } catch {
      window.prompt(t.copyLink, l.url);
    }
  };
  const canDelete = (l: BandLink) => isAdmin || l.createdBy === me.id;

  return (
    <div className="flex flex-col gap-[14px] max-w-[900px] animate-fade">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-display font-semibold text-[16px] leading-[normal] text-ink-bright flex items-center gap-[8px]">
          <Link2 size={17} strokeWidth={2} style={{ color: 'var(--color-violet-light)' }} />
          {t.links}
        </h2>
        {signedIn && !adding && <AddButton onClick={() => setAdding(true)}>{t.newLink}</AddButton>}
      </div>

      {adding && (
        <Card className="p-4 flex flex-col gap-3">
          <Field label={t.linkTitle}>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} autoFocus />
          </Field>
          <Field label={t.linkUrl}>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="https://" mono />
          </Field>
          <Field label={t.linkCategory}>
            <Select value={category} onChange={(e) => setCategory(e.target.value as LinkCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel[c]}</option>)}
            </Select>
          </Field>
          {touched && !normalized && <p className="m-0 text-[12.5px] text-red">{t.linkInvalidUrl}</p>}
          <div className="flex justify-end gap-2">
            <Button onClick={reset}>{t.cancel}</Button>
            <Button variant="primary" onClick={submit}>{t.save}</Button>
          </div>
        </Card>
      )}

      {links.length === 0 && !adding && (
        <Card className="p-[18px] font-sans font-normal text-[13.5px] text-ink-meta">{t.noLinks}</Card>
      )}

      {groups.map(({ c, items }) => (
        <section key={c} className="flex flex-col gap-2">
          <span className="font-display font-semibold text-[12px] tracking-[.08em] uppercase text-ink-muted">{catLabel[c]}</span>
          <ul className="flex flex-col gap-2 list-none m-0 p-0">
            {items.map((l) => (
              <li key={l.id} className="bg-surface border border-line rounded-xl flex items-center">
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 flex-1 min-w-0 min-h-[56px] p-3.5 no-underline"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-sans font-semibold text-[15px] text-ink-base truncate">{l.title}</span>
                    <span className="block font-mono text-[12px] text-ink-muted mt-0.5 truncate">{l.url.replace(/^https?:\/\//, '')}</span>
                  </span>
                  <Badge color={CAT_COLOR[l.category]} className="hidden sm:inline-flex">{catLabel[l.category]}</Badge>
                  <ExternalLink size={15} strokeWidth={2} className="flex-none text-ink-muted" />
                </a>
                <button
                  type="button"
                  title={t.copyLink}
                  aria-label={`${t.copyLink} — ${l.title}`}
                  onClick={() => copy(l)}
                  className="grid place-items-center w-11 h-11 mr-1.5 rounded-xl border border-line bg-raised text-ink-muted cursor-pointer flex-none"
                >
                  <Copy size={15} strokeWidth={2} />
                </button>
                {canDelete(l) && (
                  <button
                    type="button"
                    title={t.deleteLink}
                    aria-label={`${t.deleteLink} — ${l.title}`}
                    onClick={() => toast(t.linkDeleted, 'ok', { action: { label: t.undo, run: deleteLink(l.id) }, ttl: UNDO_WINDOW_MS })}
                    className="grid place-items-center w-11 h-11 mr-1.5 rounded-xl border border-line bg-raised text-ink-muted cursor-pointer flex-none"
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
