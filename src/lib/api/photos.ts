/** Storage helpers for the public photo buckets (event-photos, forum-photos). */
import { supabase } from '../supabase';
import { storageRef, thumbPath } from '../image';

/** Photos never change once uploaded (random names), so let browsers and the CDN keep them a year. */
const CACHE_CONTROL = '31536000';

const randomName = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Upload a photo (and its thumbnail, best-effort) and return the full image's public URL. */
export async function uploadPhoto(bucket: string, blob: Blob, thumb?: Blob | null): Promise<string> {
  const path = `${randomName()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { cacheControl: CACHE_CONTROL, upsert: false });
  if (error) throw error;
  if (thumb) await supabase.storage.from(bucket).upload(thumbPath(path), thumb, { cacheControl: CACHE_CONTROL, upsert: false });
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Best-effort delete of uploaded photos (and their thumbnails) in `bucket`; foreign URLs are ignored. */
export async function removePhotos(bucket: string, urls: string[]): Promise<void> {
  const paths = urls.flatMap((u) => {
    const ref = storageRef(u);
    return ref && ref.bucket === bucket ? [ref.path, thumbPath(ref.path)] : [];
  });
  if (paths.length) await supabase.storage.from(bucket).remove(paths);
}
