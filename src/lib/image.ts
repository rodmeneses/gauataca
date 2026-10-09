/**
 * Client-side image downscaling for event photos. Loads the file, scales the
 * longest side down to `maxDim`, and re-encodes as JPEG so uploads stay small.
 */
export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  // HTMLImageElement.width/height reflect the (absent) width/height attributes and
  // are 0 for a detached image; read the intrinsic size instead.
  const srcW = 'naturalWidth' in bitmap ? bitmap.naturalWidth : bitmap.width;
  const srcH = 'naturalHeight' in bitmap ? bitmap.naturalHeight : bitmap.height;
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const w = Math.max(1, Math.round(srcW * scale));
  const h = Math.max(1, Math.round(srcH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ('close' in bitmap) bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('image encode failed'))), 'image/jpeg', quality);
  });
  return blob;
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to the <img> path (e.g. some Safari versions)
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image load failed'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Longest side of the grid thumbnail uploaded next to every photo. */
export const THUMB_DIM = 480;

export interface PreparedPhoto {
  full: Blob;
  /** Small grid thumbnail; null when it couldn't be made (the full image is used instead). */
  thumb: Blob | null;
}

/**
 * Compress a picked file for upload. If the full-size encode fails the original goes up
 * as-is rather than dropping the photo; the thumbnail is best-effort.
 */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  let full: Blob;
  try {
    full = await compressImage(file);
  } catch (err) {
    // Compression can fail (unsupported format, oversized image, etc.).
    console.warn('Photo compression failed, uploading original:', file.name, err);
    return { full: file, thumb: null };
  }
  const thumb = await compressImage(file, THUMB_DIM, 0.72).catch(() => null);
  return { full, thumb };
}

const PHOTO_URL = /\/storage\/v1\/object\/public\/([\w-]+)\/(.+\.jpg)$/;
const THUMB_SUFFIX = '_t.jpg';

/** Storage path of an uploaded photo's thumbnail, derived from the full image's path. */
export const thumbPath = (path: string): string => path.replace(/\.jpg$/, THUMB_SUFFIX);

/** Bucket + path of an uploaded photo URL in one of our public buckets, else null. */
export function storageRef(url: string): { bucket: string; path: string } | null {
  const m = PHOTO_URL.exec(url);
  return m ? { bucket: m[1], path: m[2] } : null;
}

/**
 * Grid-size URL for an uploaded photo (falls back to `url` for external links). Photos
 * uploaded before thumbnails existed have none, so `<Thumb>` falls back on load error.
 */
export function thumbUrl(url: string): string {
  const ref = storageRef(url);
  if (!ref || ref.path.endsWith(THUMB_SUFFIX)) return url;
  return url.replace(/\.jpg$/, THUMB_SUFFIX);
}
