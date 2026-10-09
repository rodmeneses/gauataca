/** Building blocks of the thread modal: reference chips and the comment/reply composer row. */
import { useRef, useState } from 'react';
import { CalendarDays, ImagePlus, Music, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { Composer } from './Composer';
import type { CommentVm } from '@/store/vm';

/* ------------------------------------------------------------ ref chips row */
export function RefChips({ refs, onOpen }: { refs: CommentVm['refs']; onOpen: (kind: 'song' | 'event', id: string) => void }) {
  if (refs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-[6px] mt-[10px]">
      {refs.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onOpen(r.kind, r.refId)}
          className="inline-flex items-center gap-[6px] py-[4px] px-[10px] rounded-[20px] border-none font-sans font-semibold text-[11.5px] leading-[normal] cursor-pointer hover:brightness-[1.08]"
          style={{
            background: r.kind === 'song' ? 'color-mix(in srgb, var(--color-emerald) 13%, transparent)' : 'color-mix(in srgb, var(--color-violet) 13%, transparent)',
            color: r.kind === 'song' ? 'var(--color-emerald-light)' : 'var(--color-violet-lighter)',
            border: '1px solid color-mix(in srgb, ' + (r.kind === 'song' ? 'var(--color-emerald)' : 'var(--color-violet)') + ' 30%, transparent)',
          }}
        >
          {r.kind === 'song' ? <Music size={12} strokeWidth={2.2} /> : <CalendarDays size={12} strokeWidth={2.2} />}
          {r.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------- composer with photo attach */
export function ComposerRow({
  value,
  onChange,
  onSend,
  placeholder,
  sendLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Called with the photos attached in this composer. */
  onSend: (photos: File[]) => void;
  placeholder: string;
  sendLabel: string;
}) {
  const { t } = useGuataca();
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-[6px]">
      {files.length > 0 && (
        <div className="flex gap-[6px]">
          {files.map((f, i) => (
            <div key={i} className="relative w-[58px] h-[44px] rounded-[8px] overflow-hidden border border-line-soft bg-raised">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setFiles((cur) => cur.filter((_, n) => n !== i))}
                aria-label={t.removeRef}
                className="absolute top-[2px] right-[2px] grid place-items-center w-[18px] h-[18px] rounded-full bg-black/55 text-white cursor-pointer p-0 border-none hover:bg-black/75"
              >
                <X size={11} strokeWidth={2.4} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-[8px] items-end">
        <Composer
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          sendLabel={sendLabel}
          onSend={() => {
            onSend(files);
            setFiles([]);
          }}
          className="flex-1"
        />
        <button
          type="button"
          title={t.attachPhoto}
          onClick={() => fileRef.current?.click()}
          className="flex-none grid place-items-center min-w-[42px] min-h-[42px] rounded-[10px] border border-line bg-surface text-ink-muted hover:text-ink-body hover:border-emerald/40 cursor-pointer"
        >
          <ImagePlus size={17} strokeWidth={2} />
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (picked.length) setFiles((cur) => [...cur, ...picked]);
        }}
      />
    </div>
  );
}
