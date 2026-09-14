/**
 * Thumbnail strip for event tiles (up to 3 photos). Clicking a thumbnail opens
 * the full-screen PhotoViewer carousel at that photo.
 */
import { useState } from 'react';
import { useGuataca } from '@/store';
import { cx } from './index';
import { PhotoViewer } from '../modals/PhotoViewer';

export function PhotoStrip({ photos, className }: { photos: { id: number; url: string }[]; className?: string }) {
  const { t } = useGuataca();
  const [viewer, setViewer] = useState<number | null>(null);
  if (photos.length === 0) return null;
  return (
    <>
      <div className={cx('grid grid-cols-3 gap-2', className)}>
        {photos.slice(0, 3).map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setViewer(i)}
            aria-label={`${t.photo} ${i + 1}`}
            className="relative block aspect-[4/3] rounded-[9px] overflow-hidden border border-line-soft bg-raised cursor-pointer p-0"
          >
            <img src={p.url} alt="" loading="lazy" className="w-full h-full object-cover" />
            {i === 2 && photos.length > 3 && (
              <span className="absolute inset-0 grid place-items-center bg-black/45 text-white font-sans font-semibold text-[13px]">
                +{photos.length - 3}
              </span>
            )}
          </button>
        ))}
      </div>
      {viewer !== null && <PhotoViewer photos={photos} index={viewer} onClose={() => setViewer(null)} />}
    </>
  );
}
