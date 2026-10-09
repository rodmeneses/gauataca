/**
 * Event detail modal (design lines 929–1111): header, 4 stat tiles, setlist,
 * media gallery, retrospective (ratings, well/improve, poll, my ratings) and footer.
 */
import { CalendarPlus, Instagram, Link, Pencil, Pin } from 'lucide-react';
import { useGuataca } from '@/store';
import { Badge, Button, CloseButton, Modal, useConfirm } from '@/components/ui';
import { downloadIcs } from '@/lib/ics';
import { SetlistEditor } from './SetlistEditor';
import { RecordingsSection } from './RecordingsSection';
import { EventRsvpSection } from './EventRsvpSection';
import { EventMediaSection } from './EventMediaSection';
import { EventFeedbackSection } from './EventFeedbackSection';
import { tile, tileLabel } from './eventModalStyles';

export function EventModal() {
  const { t, ev, fb, songs, isAdmin, closeModal, openShare, openSettle, openEditEvent, setEventSetlist, addTake, deleteTake, goToSong, copyLink, toggleEventPin, toggleEventCancelled } = useGuataca();
  const { confirm, dialog } = useConfirm();
  if (!ev) return null;

  return (
    <>
    <Modal onClose={closeModal} maxWidth={840} align="top">
      <div className="h-[3px]" style={{ background: ev.typeColor }} />

      {/* ---- header */}
      <div className="py-[22px] px-6 border-b border-line-soft flex gap-4 items-start">
        <div className="min-w-0 flex-1">
          <div className="flex gap-[7px] flex-wrap mb-[10px]">
            <Badge lg color={ev.typeColor} style={{ background: ev.typeBg }}>{ev.typeLabel}</Badge>
            {ev.showState && (
              <Badge lg color={ev.stateColor} style={{ background: ev.stateBg }}>{ev.stateLabel}</Badge>
            )}
            {ev.settled && (
              <Badge lg color="var(--color-emerald)" style={{ background: 'color-mix(in srgb, var(--color-emerald) 11%, transparent)' }}>{t.settled}</Badge>
            )}
            <Badge lg color="var(--color-ink-muted)">{ev.rel}</Badge>
            {ev.pinned && <Badge lg color="var(--color-amber)">{t.pinned}</Badge>}
          </div>
          <h2 className="m-0 font-display font-semibold text-[23px] leading-[1.25] text-ink-bright tracking-[-.015em]">{ev.title}</h2>
          <p className="mt-[10px] mb-0 mx-0 text-[13.5px] text-ink-meta leading-[1.6]">{ev.note}</p>
        </div>
        <div className="flex flex-col items-end gap-[8px] flex-none">
          <CloseButton onClick={closeModal} size={34} label={t.close} />
          {isAdmin && (
            <button
              type="button"
              title={ev.pinned ? t.unpin : t.pin}
              onClick={() => toggleEventPin(ev.id)}
              className="grid place-items-center min-w-[40px] min-h-[40px] rounded-[10px] border border-line bg-surface cursor-pointer hover:border-line-hover"
              style={{ color: ev.pinned ? 'var(--color-amber)' : 'var(--color-ink-muted)' }}
            >
              <Pin size={16} strokeWidth={2} fill={ev.pinned ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>

      {/* ---- stat tiles */}
      <div className="py-5 px-6 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-line-soft">
        <div className={tile}>
          <div className={tileLabel}>{t.date}</div>
          <div className="font-sans font-semibold text-[13px] leading-[normal] text-ink-base mt-[7px]">{ev.dateStr}</div>
          <div className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-muted mt-1">{ev.timeStr}{ev.hoursStr ? ' · ' + ev.hoursStr : ''}</div>
        </div>
        <div className={tile}>
          <div className={tileLabel}>{t.venueL}</div>
          <div className="font-sans font-semibold text-[13px] leading-[1.4] text-ink-base mt-[7px]">{ev.venue}</div>
        </div>
        <div className={tile}>
          <div className={tileLabel}>{t.money}</div>
          <div className="font-mono font-semibold text-[13px] leading-[normal] mt-[7px]" style={{ color: 'var(--color-emerald)' }}>{ev.feeStr ?? '—'}</div>
          <div className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-muted mt-1">{t.fee}</div>
          <div className="font-mono font-semibold text-[13px] leading-[normal] mt-[7px]" style={{ color: 'var(--color-red)' }}>{ev.costStr ?? '—'}</div>
          <div className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-muted mt-1">{t.costLabel}</div>
        </div>
        <div className={tile}>
          <div className={tileLabel}>{t.attendees}</div>
          <div className="font-mono font-semibold text-[16px] leading-[normal] text-ink-base mt-[7px]">{ev.attend} / {ev.total}</div>
        </div>
      </div>

      {/* ---- Instagram prep (gigs) */}
      {ev.isGig && (
        <div className="py-4 px-6 border-b border-line-soft">
          <Button variant="brand" onClick={() => openShare(ev.id)} className="w-full justify-center py-[12px] px-4 rounded-[11px]">
            <Instagram size={16} strokeWidth={1.9} />
            {t.prepIg}
          </Button>
        </div>
      )}

      <EventRsvpSection ev={ev} />

      {/* ---- setlist (builder for admins, read-only for members) */}
      {(isAdmin || ev.hasSetlist) && (
        <SetlistEditor
          currentIds={ev.setlist.map((s) => s.id)}
          songs={songs}
          setlistLabel={ev.setlistLabel}
          isAdmin={isAdmin}
          onSave={(ids) => setEventSetlist(ev.id, ids)}
          onOpenSong={goToSong}
          t={t}
        />
      )}

      {/* ---- recordings ("takes") on practice events */}
      {ev.isPractice && (isAdmin || ev.hasTakes) && (
        <RecordingsSection
          setlist={ev.setlist}
          takes={ev.takes}
          isAdmin={isAdmin}
          t={t}
          onAdd={(songId, url) => addTake(ev.id, songId, url)}
          onDelete={(id) => confirm({ message: t.confirmDeleteTake, onConfirm: () => deleteTake(id) })}
        />
      )}

      {(ev.hasMedia || isAdmin) && <EventMediaSection ev={ev} />}

      {fb && <EventFeedbackSection fb={fb} />}

      {/* ---- footer */}
      <div className="py-[18px] px-6 flex flex-wrap gap-[10px] justify-end">
        {isAdmin && (
          <Button variant="surface" onClick={() => openEditEvent(ev.id)} className="py-[11px] px-4 rounded-[11px]">
            <Pencil size={15} strokeWidth={1.9} />
            {t.edit}
          </Button>
        )}
        {isAdmin && !ev.settled && (
          <Button
            variant="surface"
            onClick={() => (ev.cancelled ? toggleEventCancelled(ev.id) : confirm({ title: t.cancelEvent, message: t.confirmCancelEvent, confirmLabel: t.cancelEvent, onConfirm: () => toggleEventCancelled(ev.id) }))}
            className="py-[11px] px-4 rounded-[11px]"
          >
            {ev.cancelled ? t.reinstateEvent : t.cancelEvent}
          </Button>
        )}
        {ev.canSettle && (
          <Button variant="primary" onClick={() => openSettle(ev.id)} className="py-[11px] px-4 rounded-[11px]">
            {t.settle}
          </Button>
        )}
        {!ev.past && !ev.cancelled && (
          <Button
            variant="surface"
            onClick={() => downloadIcs({ id: ev.id, title: ev.title, venue: ev.venue, note: ev.note, date: ev.date, time: ev.time, hours: ev.hours })}
            className="py-[11px] px-4 rounded-[11px]"
          >
            <CalendarPlus size={15} strokeWidth={1.9} />
            {t.addToCalendar}
          </Button>
        )}
        <Button variant="surface" onClick={() => copyLink('event', ev.id)} className="py-[11px] px-4 rounded-[11px]">
          <Link size={15} strokeWidth={1.9} />
          {t.copyLink}
        </Button>
        <Button variant="surface" onClick={closeModal} className="py-[11px] px-[18px] rounded-[11px]">
          {t.close}
        </Button>
      </div>
    </Modal>
    {dialog}
    </>
  );
}
