/**
 * Event detail modal (design lines 929–1111): header, 4 stat tiles, setlist,
 * media gallery, retrospective (ratings, well/improve, poll, my ratings) and footer.
 */
import { ChartColumn, Check, EyeOff, ExternalLink, Image, Instagram, Star } from 'lucide-react';
import { RSVP_COLOR, RSVP_ORDER, RSVP_PENDING_COLOR, rsvpLabel, useGuataca } from '@/store';
import { Avatar, Badge, Button, CloseButton, Modal } from '@/components/ui';
import { SetlistEditor } from './SetlistEditor';
import { RecordingsSection } from './RecordingsSection';
import type { RatingKey } from '@/types';

const RATING_KEYS: RatingKey[] = ['sound', 'perf', 'log', 'energy'];
const STAR_VALUES = [1, 2, 3, 4, 5];

const tileLabel = 'font-display font-semibold text-[9.5px] leading-[normal] tracking-[.11em] uppercase text-ink-dim';
const tile = 'bg-surface border border-line-soft rounded-[11px] p-[13px]';
const textareaCls =
  'w-full py-[11px] px-[13px] rounded-[10px] border border-line bg-base text-ink-base font-sans font-normal text-[13px] leading-[normal] outline-none resize-y';

export function EventModal() {
  const { t, ev, fb, state, songs, isAdmin, closeModal, openShare, openSettle, pickPoll, setRating, toggleAnon, setFbWell, setFbImprove, submitFb, setRsvp, setEventSetlist, addTake, deleteTake, goToSong } = useGuataca();
  if (!ev) return null;

  const ratingLabel: Record<RatingKey, string> = { sound: t.sound, perf: t.perf, log: t.logistics, energy: t.energy };
  const rsvpGroups = [
    { key: 'going', label: t.going, color: RSVP_COLOR.going, people: ev.going },
    { key: 'maybe', label: t.maybe, color: RSVP_COLOR.maybe, people: ev.maybe },
    { key: 'no', label: t.notGoing, color: RSVP_COLOR.no, people: ev.notGoing },
    { key: 'pending', label: t.pendingL, color: RSVP_PENDING_COLOR, people: ev.pending },
  ];

  return (
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
          </div>
          <h2 className="m-0 font-display font-semibold text-[23px] leading-[1.25] text-ink-bright tracking-[-.015em]">{ev.title}</h2>
          <p className="mt-[10px] mb-0 mx-0 text-[13.5px] text-ink-meta leading-[1.6]">{ev.note}</p>
        </div>
        <CloseButton onClick={closeModal} size={34} />
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

      {/* ---- attendance / RSVP (code-first addition, see docs/design.md §5.4) */}
      {ev.hasAttendance && (
        <div className="py-5 px-6 border-b border-line-soft">
          <div className="flex items-baseline gap-[11px] mb-[13px]">
            <h3 className="m-0 font-display font-semibold text-[13px] leading-[normal] tracking-[.02em] text-ink-body">{t.rsvp}</h3>
            <span className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-muted whitespace-nowrap">
              {ev.goingCount} {t.confirmedL} · {ev.pendingCount} {t.pending}
            </span>
          </div>

          {ev.canRsvp && (
            <div className="flex items-center gap-[10px] flex-wrap mb-4">
              <span className="font-sans font-medium text-[12.5px] leading-[normal] text-ink-meta mr-1">{t.rsvpHint}</span>
              {RSVP_ORDER.map((s) => {
                const active = ev.rsvp === s;
                const color = RSVP_COLOR[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRsvp(ev.id, s)}
                    aria-pressed={active}
                    className="flex items-center gap-[8px] py-[11px] px-[18px] rounded-[11px] border font-sans font-semibold text-[16px] leading-[normal] cursor-pointer transition-colors"
                    style={{
                      borderColor: `color-mix(in srgb, ${color} ${active ? 60 : 34}%, transparent)`,
                      background: `color-mix(in srgb, ${color} ${active ? 16 : 8}%, transparent)`,
                      color,
                    }}
                  >
                    {active && <Check size={17} strokeWidth={2.4} />}
                    {rsvpLabel(s, t)}
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {rsvpGroups.map((g) => (
              <div key={g.key} className={tile}>
                <div className={tileLabel} style={{ color: g.color }}>
                  {g.label} · {g.people.length}
                </div>
                <div className="flex gap-[6px] flex-wrap mt-[9px] min-h-[26px]">
                  {g.people.length === 0 && <span className="font-mono text-[11.5px] leading-[26px] text-ink-faint">—</span>}
                  {g.people.map((p) => (
                    <span key={p.id} title={p.name} aria-label={p.name}>
                      <Avatar initial={p.initial} size={26} radius={8} tone={g.key === 'pending' ? 'muted' : 'violet'} style={{ background: g.key === 'pending' ? 'var(--color-line)' : `color-mix(in srgb, ${g.color} 15%, transparent)`, color: g.key === 'pending' ? 'var(--color-ink-muted)' : g.color }} />
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          onDelete={deleteTake}
        />
      )}

      {/* ---- media */}
      {ev.hasMedia && (
        <div className="py-5 px-6 border-b border-line-soft">
          <h3 className="mt-0 mx-0 mb-[13px] font-display font-semibold text-[13px] leading-[normal] text-ink-body">{t.media}</h3>
          <div className="flex flex-col gap-[7px]">
            {ev.media.map((m) => (
              <a
                key={m.url}
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 py-3 px-[14px] rounded-[11px] border border-line bg-surface text-ink-body hover:text-ink-body no-underline font-sans font-medium text-[13px] leading-[normal] hover:border-emerald/40"
              >
                <Image size={16} strokeWidth={1.9} className="flex-none" style={{ color: 'var(--color-emerald-light)' }} />
                <span className="flex-1">{m.label}</span>
                <ExternalLink size={14} strokeWidth={2.1} style={{ color: 'var(--color-ink-dim)' }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ---- feedback / retrospective */}
      {fb && (
        <div className="py-5 px-6 border-b border-line-soft bg-[color-mix(in_srgb,var(--color-surface)_75%,transparent)]">
          <div className="flex items-baseline gap-[11px] mb-4">
            <h3 className="m-0 font-display font-semibold text-[13px] leading-[normal] text-ink-body">{t.feedback}</h3>
            <span className="font-mono font-medium text-[11.5px] leading-[normal] text-ink-muted">{fb.responses} {t.responses}</span>
          </div>

          {/* rating rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            {fb.rows.map((r) => (
              <div key={r.key} className="bg-raised border border-line-soft rounded-[11px] p-[13px]">
                <div className="flex justify-between items-baseline mb-[9px]">
                  <span className="font-sans font-medium text-[12px] leading-[normal] text-ink-meta">{r.label}</span>
                  <span className="font-mono font-semibold text-[14px] leading-[normal]" style={{ color: r.color }}>{r.val}</span>
                </div>
                <div className="h-[5px] rounded-[3px] bg-line-soft overflow-hidden">
                  <div className="h-[5px] rounded-[3px]" style={{ background: r.color, width: r.pct }} />
                </div>
              </div>
            ))}
          </div>

          {/* well / improve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-emerald mb-[10px]">{t.wentWell}</div>
              <div className="flex flex-col gap-2">
                {fb.well.map((w, i) => (
                  <div key={i} className="bg-raised border border-line-soft border-l-2 border-l-[color-mix(in srgb, var(--color-emerald) 40%, transparent)] rounded-[10px] p-3">
                    <p className="m-0 text-[12.5px] text-ink-body leading-[1.6]">{w.text}</p>
                    <div className="font-mono font-medium text-[10.5px] leading-[normal] text-ink-dim mt-2">— {w.by}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-amber mb-[10px]">{t.improve}</div>
              <div className="flex flex-col gap-2">
                {fb.improve.map((w, i) => (
                  <div key={i} className="bg-raised border border-line-soft border-l-2 border-l-[color-mix(in srgb, var(--color-amber) 40%, transparent)] rounded-[10px] p-3">
                    <p className="m-0 text-[12.5px] text-ink-body leading-[1.6]">{w.text}</p>
                    <div className="font-mono font-medium text-[10.5px] leading-[normal] text-ink-dim mt-2">— {w.by}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* poll */}
          <div className="bg-raised border border-line-soft rounded-[12px] p-4 mb-5">
            <div className="flex items-center gap-[10px] mb-[13px]">
              <ChartColumn size={15} strokeWidth={1.9} style={{ color: 'var(--color-violet-light)' }} />
              <span className="font-sans font-semibold text-[12.5px] leading-[normal] text-ink-base">{fb.pollQ}</span>
              <span className="ml-auto font-mono font-medium text-[11px] leading-[normal] text-ink-dim">{fb.pollTotal} {t.votes}</span>
            </div>
            <div className="flex flex-col gap-2">
              {fb.pollOpts.map((o) => (
                <button
                  key={o.i}
                  type="button"
                  onClick={() => pickPoll(o.i)}
                  className="flex items-center gap-3 w-full py-[11px] px-[13px] rounded-[10px] border text-ink-body cursor-pointer text-left font-sans font-medium text-[13px] leading-[normal]"
                  style={{ borderColor: o.picked ? 'color-mix(in srgb, var(--color-emerald) 40%, transparent)' : 'var(--color-line)', background: o.picked ? 'color-mix(in srgb, var(--color-emerald) 11%, transparent)' : 'var(--color-raised)' }}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block">{o.label}</span>
                    <span className="block h-[6px] rounded-[4px] bg-line-soft mt-2 overflow-hidden">
                      <span className="block h-[6px] rounded-[4px] transition-[width] duration-300" style={{ background: o.picked ? 'var(--color-emerald)' : 'var(--color-ink-faint)', width: o.pct }} />
                    </span>
                  </span>
                  <span className="font-mono font-semibold text-[13px] leading-[normal] text-ink-meta flex-none min-w-[52px] text-right">{o.v} · {o.pct}</span>
                </button>
              ))}
            </div>
          </div>

          {/* my ratings */}
          <div className="bg-raised border border-line-soft rounded-[12px] p-4">
            <div className="font-display font-semibold text-[10.5px] leading-[normal] tracking-[.11em] uppercase text-ink-muted mb-[14px]">{t.ratings}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-4">
              {RATING_KEYS.map((k) => (
                <div key={k}>
                  <div className="font-sans font-medium text-[12px] leading-[normal] text-ink-meta mb-2">{ratingLabel[k]}</div>
                  <div className="flex gap-[6px]">
                    {STAR_VALUES.map((n) => {
                      const on = state.myRatings[k] >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(k, n)}
                          className="grid place-items-center w-[34px] h-[34px] rounded-[9px] border cursor-pointer"
                          style={{ borderColor: on ? 'color-mix(in srgb, var(--color-amber) 40%, transparent)' : 'var(--color-line)', background: on ? 'color-mix(in srgb, var(--color-amber) 12%, transparent)' : 'var(--color-raised)', color: on ? 'var(--color-amber)' : 'var(--color-ink-dim)' }}
                        >
                          <Star size={15} strokeWidth={1.8} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <textarea
              value={state.fbWell}
              onChange={(e) => setFbWell(e.target.value)}
              placeholder={t.wentWell}
              rows={2}
              className={`${textareaCls} mb-[9px]`}
            />
            <textarea
              value={state.fbImprove}
              onChange={(e) => setFbImprove(e.target.value)}
              placeholder={t.improve}
              rows={2}
              className={textareaCls}
            />
            <div className="flex items-center gap-[10px] mt-[13px] flex-wrap">
              <button
                type="button"
                onClick={toggleAnon}
                className="flex items-center gap-[9px] py-2 px-3 rounded-[9px] border font-sans font-medium text-[12.5px] leading-[normal] cursor-pointer"
                style={{ borderColor: state.anon ? 'color-mix(in srgb, var(--color-violet-light) 40%, transparent)' : 'var(--color-line)', background: state.anon ? 'color-mix(in srgb, var(--color-violet) 12%, transparent)' : 'var(--color-raised)', color: state.anon ? 'var(--color-violet-lighter)' : 'var(--color-ink-meta)' }}
              >
                <EyeOff size={14} strokeWidth={1.9} />
                {t.anon}
              </button>
              <Button variant="primary" onClick={submitFb} className="ml-auto py-[10px] px-4">
                {t.submitFeedback}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---- footer */}
      <div className="py-[18px] px-6 flex gap-[10px] justify-end">
        {ev.canSettle && (
          <Button variant="primary" onClick={() => openSettle(ev.id)} className="py-[11px] px-4 rounded-[11px]">
            {t.settle}
          </Button>
        )}
        {ev.isGig && (
          <Button variant="brand" onClick={() => openShare(ev.id)} className="py-[11px] px-4 rounded-[11px]">
            <Instagram size={15} strokeWidth={1.9} />
            {t.prepIg}
          </Button>
        )}
        <Button variant="surface" onClick={closeModal} className="py-[11px] px-[18px] rounded-[11px]">
          {t.close}
        </Button>
      </div>
    </Modal>
  );
}
