/** Events: RSVPs, setlists, takes, media, post-gig feedback and the event form. */
import type { RatingKey, RsvpStatus } from '../../types';
import { parseNum } from '../../lib/validate';
import { uploadPhotoBatch, type ActionCtx } from './ctx';

export interface EventActions {
  openEvent: (id: string) => void;
  openNewEvent: () => void;
  openEditEvent: (id: string) => void;
  /** Open the new-event form pre-filled with a title and date (e.g. the winning date of an availability poll). */
  startEventOn: (date: string, title: string) => void;
  saveEvent: () => Promise<void>;
  /** Set the signed-in member's RSVP; choosing the current answer again withdraws it (back to pending). */
  setRsvp: (eventId: string, status: RsvpStatus) => Promise<void>;
  /** Toggle an event's pinned state (admin only). */
  toggleEventPin: (eventId: string) => Promise<void>;
  /** Cancel an event (it moves to history) or reinstate a cancelled one (admin only). */
  toggleEventCancelled: (eventId: string) => Promise<void>;
  /** Replace an event's setlist (ordered song ids). */
  setEventSetlist: (eventId: string, songIds: string[]) => Promise<void>;
  /** Add a recording ("take") of a song during a practice event. */
  addTake: (eventId: string, songId: string, url: string) => Promise<void>;
  /** Remove a recording ("take"). */
  deleteTake: (id: string) => Promise<void>;
  /** Add a video link (Google Drive) to an event. */
  addEventVideo: (eventId: string, label: string, url: string) => Promise<void>;
  /** Compress + upload one or more photos to an event. */
  addEventPhotos: (eventId: string, files: File[]) => Promise<void>;
  /** Remove a photo or video from an event. */
  deleteEventMedia: (id: number) => Promise<void>;
  pickPoll: (i: number) => Promise<void>;
  setRating: (k: RatingKey, n: number) => void;
  toggleAnon: () => void;
  setFbWell: (s: string) => void;
  setFbImprove: (s: string) => void;
  submitFb: () => Promise<void>;
}

export function eventActions(ctx: ActionCtx): EventActions {
  const { st, set, toast, t, Lx, data, d, evSel } = ctx;
  const f = st.form;
  return {
    openEvent: (id) => set({ modal: { kind: 'event', id } }),
    openNewEvent: () => set({ modal: { kind: 'newEvent' }, form: {} }),
    startEventOn: (date, title) => set({ modal: { kind: 'newEvent' }, view: 'calendar', form: { title, date, type: 'gig' } }),
    openEditEvent: (id) => {
      const e = d.allEvents.find((x) => x.id === id);
      if (!e) return;
      set({
        modal: { kind: 'newEvent', id },
        form: {
          title: Lx(e.title), venue: e.venue, date: e.date, time: e.time,
          hours: e.hours != null ? String(e.hours) : '',
          fee: e.fee ? String(e.fee) : '', cost: e.cost ? String(e.cost) : '',
          note: Lx(e.note), type: e.type, setlist: e.setlist,
        },
      });
    },
    saveEvent: async () => {
      const editingId = st.modal?.kind === 'newEvent' ? st.modal.id : undefined;
      const dte = f.date || '2026-11-07';
      const songIds = f.setlist || [];
      set({ modal: null, form: {} });
      const input = {
        title: f.title || 'Evento nuevo', venue: f.venue || 'Bay Area, CA', date: dte, time: f.time || '19:00', hours: parseNum(f.hours) || 0,
        fee: parseNum(f.fee) || 0, cost: parseNum(f.cost) || 0, note: f.note || '', type: f.type || 'gig',
      };
      if (editingId) {
        await data.updateEvent(editingId, input);
        await data.setEventSetlist(editingId, songIds);
      } else {
        const id = await data.createEvent(input);
        if (id && songIds.length) await data.setEventSetlist(id, songIds);
      }
      toast(editingId ? t.eventSaved : t.eventCreated);
    },
    setRsvp: async (eventId, status) => {
      const current = d.events.find((e) => e.id === eventId)?.rsvp ?? null;
      const next: RsvpStatus | null = current === status ? null : status;
      await data.setRsvp(eventId, next);
      toast(t.rsvpSaved);
    },
    toggleEventPin: async (eventId) => {
      const e = d.allEvents.find((x) => x.id === eventId);
      if (!e) return;
      await data.setEventPinned(eventId, !e.pinned);
      toast(e.pinned ? t.unpinned : t.pinned);
    },
    toggleEventCancelled: async (eventId) => {
      const e = d.allEvents.find((x) => x.id === eventId);
      if (!e) return;
      const cancel = e.state !== 'cancelled';
      await data.setEventState(eventId, cancel ? 'cancelled' : 'active');
      toast(cancel ? t.eventCancelled : t.eventReinstated);
    },
    setEventSetlist: async (eventId, songIds) => {
      await data.setEventSetlist(eventId, songIds);
      toast(t.setlistSaved);
    },
    addTake: async (eventId, songId, url) => {
      await data.addTake(eventId, songId, url);
      toast(t.recordingAdded);
    },
    deleteTake: async (id) => {
      await data.deleteTake(id);
      toast(t.recordingDeleted);
    },
    addEventVideo: async (eventId, label, url) => {
      await data.addEventMedia(eventId, 'video', label, url);
      toast(t.mediaAdded);
    },
    addEventPhotos: (eventId, files) =>
      uploadPhotoBatch(ctx, files, data.uploadEventPhoto, (urls) => data.addEventPhotos(eventId, urls)),
    deleteEventMedia: async (id) => {
      await data.deleteEventMedia(id);
      toast(t.mediaRemoved);
    },
    pickPoll: async (i) => {
      if (!evSel) return;
      await data.pickPoll(evSel.id, i);
      toast(t.voted);
    },
    setRating: (k: RatingKey, n) => set((s) => ({ myRatings: { ...s.myRatings, [k]: n } })),
    toggleAnon: () => set((s) => ({ anon: !s.anon })),
    setFbWell: (v) => set({ fbWell: v }),
    setFbImprove: (v) => set({ fbImprove: v }),
    submitFb: async () => {
      if (!evSel) return;
      await data.submitFeedback(evSel.id, {
        sound: st.myRatings.sound, perf: st.myRatings.perf, log: st.myRatings.log, energy: st.myRatings.energy,
        well: st.fbWell, improve: st.fbImprove, anon: st.anon,
      });
      toast(t.fbSubmitted);
    },
  };
}
