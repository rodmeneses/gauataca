/** Photos + videos block of the event modal (gallery, admin upload controls, photo viewer). */
import { useRef, useState } from 'react';
import { ExternalLink, Film, Plus, Trash2, Upload } from 'lucide-react';
import { useGuataca, type EventVm } from '@/store';
import { Button, Input, useConfirm } from '@/components/ui';
import { Thumb } from '@/components/ui/Thumb';
import { PhotoViewer } from './PhotoViewer';

export function EventMediaSection({ ev }: { ev: EventVm }) {
  const { addEventVideo, addEventPhotos, t, isAdmin, deleteEventMedia } = useGuataca();
  const [videoLabel, setVideoLabel] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoViewer, setPhotoViewer] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { confirm, dialog } = useConfirm();

  const addVideo = async () => {
    const label = videoLabel.trim();
    const url = videoUrl.trim();
    if (!label || !url) return;
    await addEventVideo(ev.id, label, url);
    setVideoLabel('');
    setVideoUrl('');
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    await addEventPhotos(ev.id, files);
    setUploading(false);
  };

  return (
    <>
    {/* ---- media (photos + videos) */}
    {(ev.hasMedia || isAdmin) && (
      <div className="py-5 px-6 border-b border-line-soft">
        <h3 className="mt-0 mx-0 mb-[13px] font-display font-semibold text-[13px] leading-[normal] text-ink-body">{t.media}</h3>

        {/* photos — thumbnail grid (click opens the carousel) */}
        {ev.photos.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-[13px]">
            {ev.photos.map((p, i) => (
              <div key={p.id} className="relative aspect-square rounded-[10px] overflow-hidden border border-line-soft bg-raised">
                <button
                  type="button"
                  onClick={() => setPhotoViewer(i)}
                  aria-label={`${t.photo} ${i + 1}`}
                  className="block w-full h-full cursor-pointer p-0"
                >
                  <Thumb url={p.url} />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => confirm({ message: t.confirmDeleteMedia, onConfirm: () => deleteEventMedia(p.id) })}
                    aria-label={t.mediaRemoved}
                    title={t.mediaRemoved}
                    className="absolute top-[6px] right-[6px] grid place-items-center w-7 h-7 rounded-[8px] border border-line bg-base/85 text-ink-muted hover:text-ink-body cursor-pointer"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* videos — link rows */}
        {ev.videos.length > 0 && (
          <div className="flex flex-col gap-[7px] mb-[13px]">
            {ev.videos.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3 px-[14px] rounded-[11px] border border-line bg-surface">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 flex-1 min-w-0 text-ink-body hover:text-ink-body no-underline font-sans font-medium text-[13px] leading-[normal]"
                >
                  <Film size={16} strokeWidth={1.9} className="flex-none" style={{ color: 'var(--color-emerald-light)' }} />
                  <span className="flex-1 truncate">{m.label}</span>
                  <ExternalLink size={14} strokeWidth={2.1} style={{ color: 'var(--color-ink-dim)' }} />
                </a>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => confirm({ message: t.confirmDeleteMedia, onConfirm: () => deleteEventMedia(m.id) })}
                    aria-label={t.mediaRemoved}
                    title={t.mediaRemoved}
                    className="grid place-items-center w-[24px] h-[24px] rounded-[7px] border border-line bg-raised text-ink-muted hover:text-ink-body cursor-pointer flex-none"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* admin controls */}
        {isAdmin && (
          <div className="flex flex-col gap-[9px]">
            <div className="flex gap-2 items-center">
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickPhoto} />
              <Button variant="surface" className="py-[9px] px-[12px] flex-none" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload size={14} strokeWidth={2.2} />
                {uploading ? t.uploading : t.addPhotos}
              </Button>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <Input
                value={videoLabel}
                onChange={(e) => setVideoLabel(e.target.value)}
                placeholder={t.videoLabel}
                className="flex-1 min-w-[120px] text-[13px]"
              />
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addVideo()}
                placeholder={t.videoUrl}
                className="flex-1 min-w-[180px] text-[13px]"
              />
              <Button variant="surface" className="py-[9px] px-[12px] flex-none" onClick={addVideo}>
                <Plus size={14} strokeWidth={2.2} />
                {t.addVideo}
              </Button>
            </div>
          </div>
        )}
      </div>
    )}
    {dialog}
    {photoViewer !== null && <PhotoViewer photos={ev.photos} index={photoViewer} onClose={() => setPhotoViewer(null)} />}
    </>
  );
}
