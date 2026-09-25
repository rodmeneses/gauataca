/**
 * "What's new" dialog. Opened automatically after an update (`since` = the last
 * version the member saw → only newer entries) or on demand from the sidebar /
 * profile (no `since` → the full history).
 */
import { useGuataca } from '@/store';
import { Badge, Button, Modal } from '@/components/ui';
import { FormBody, FormHeader } from '@/components/modals/FormModals';
import { APP_VERSION, CHANGELOG, entriesSince } from '@/data/changelog';
import { fmt } from '@/lib/format';

export function ChangelogModal() {
  const { t, lang, L, modal, closeModal } = useGuataca();
  const since = modal?.kind === 'changelog' ? modal.since : undefined;
  const entries = since ? entriesSince(since) : CHANGELOG;

  return (
    <Modal onClose={closeModal} maxWidth={480}>
      <FormHeader title={`${t.whatsNew} · v${APP_VERSION}`} onClose={closeModal} />
      <FormBody>
        <div className="flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
          {entries.map((e) => (
            <section key={e.version} className="flex flex-col gap-[9px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-semibold text-[12px] text-ink-meta">v{e.version}</span>
                {e.version === APP_VERSION && <Badge color="var(--color-emerald)">{t.changelogNew}</Badge>}
                <span className="text-[12px] text-ink-dim">{fmt(e.date, lang, true)}</span>
              </div>
              <h3 className="m-0 font-display font-semibold text-[15px] leading-[1.3] text-ink">{L(e.title)}</h3>
              <ul className="m-0 pl-[18px] flex flex-col gap-[6px] text-[13.5px] leading-[1.55] text-ink-body">
                {e.changes.map((c, i) => (
                  <li key={i}>{L(c)}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <Button variant="primary" className="self-end py-[10px] px-4" onClick={closeModal}>
          {t.changelogClose}
        </Button>
      </FormBody>
    </Modal>
  );
}
