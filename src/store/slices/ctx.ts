/**
 * Shared context handed to every action slice: store state/setters, the data layer,
 * the memoised derived view-models and the few selections computed per render.
 */
import type { Dict } from '../../i18n';
import type { BandEvent, Lang, Member, Thread } from '../../types';
import type { DataValue } from '../../lib/data';
import type { useAuth } from '../../lib/auth';
import { preparePhoto } from '../../lib/image';
import type { State, StoreApi } from '../store';
import type { useDerived } from '../useDerived';

export type Derived = ReturnType<typeof useDerived>;

export interface ActionCtx {
  st: State;
  set: StoreApi['set'];
  toast: StoreApi['toast'];
  t: Dict;
  lang: Lang;
  Lx: Derived['Lx'];
  /** The data layer: reads plus every persisted mutation. */
  data: DataValue;
  /** Memoised derived lists/view-models. */
  d: Derived;
  me: Member;
  isAdmin: boolean;
  isMobileViewport: boolean;
  auth: Pick<ReturnType<typeof useAuth>, 'user' | 'signOut' | 'refreshProfile'>;
  /** The event / idea open in a modal, if any. */
  evSel: BandEvent | null;
  thSel: Thread | null;
  /** Copy to the clipboard and toast the outcome — "copied" only if it really was. */
  copyText: (text: string, okMsg: string) => void;
  /** Open the share sheet for an event (used by the palette and the event modal). */
  openShare: (eventId: string) => void;
}

/** Name the file(s) that didn't upload so a multi-photo pick says which one failed. */
const uploadFailedMsg = ({ t }: ActionCtx, names: string[]) =>
  names.length === 1 ? t.uploadFailedFile.replace('%s', names[0]) : `${t.uploadFailed}: ${names.join(', ')}`;

/**
 * Compress → upload → attach a batch of photos, toasting any that failed. Shared by
 * event photos and the forum (idea creation, idea composer, reply composer).
 */
export async function uploadPhotoBatch(
  ctx: ActionCtx,
  files: File[],
  upload: (full: Blob, thumb: Blob | null) => Promise<string | undefined>,
  attach: (urls: string[]) => Promise<boolean | undefined>,
): Promise<void> {
  const { t, toast } = ctx;
  const urls: string[] = [];
  const failed: string[] = [];
  for (const file of files) {
    try {
      const { full, thumb } = await preparePhoto(file);
      const url = await upload(full, thumb);
      if (url) urls.push(url); else failed.push(file.name);
    } catch (err) {
      console.error('Photo upload failed:', file.name, err);
      failed.push(file.name);
    }
  }
  if (failed.length) toast(uploadFailedMsg(ctx, failed), 'err');
  if (urls.length === 0) return;
  const ok = await attach(urls);
  if (!ok) {
    toast(t.uploadFailed, 'err');
    return;
  }
  toast(urls.length === 1 ? t.photoUploaded : t.photosUploaded);
}
