/**
 * Recordings ("takes") section inside the event modal, for practice events.
 * Lists each take as a link (Take N · song title) with a delete affordance for
 * admins, and an add row (pick a setlist song + paste a URL).
 */
import { useState } from 'react';
import { ExternalLink, Mic, Plus, X } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';
import type { Dict } from '@/i18n';
import type { TakeVm } from '@/store';

interface RecordingsSectionProps {
  setlist: { id: string; title: string }[];
  takes: TakeVm[];
  isAdmin: boolean;
  t: Dict;
  onAdd: (songId: string, url: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RecordingsSection({ setlist, takes, isAdmin, t, onAdd, onDelete }: RecordingsSectionProps) {
  const [songId, setSongId] = useState('');
  const [url, setUrl] = useState('');

  const add = async () => {
    const s = songId || setlist[0]?.id;
    const u = url.trim();
    if (!s || !u) return;
    await onAdd(s, u);
    setUrl('');
  };

  return (
    <div className="py-5 px-6 border-b border-[#172033]">
      <div className="flex items-baseline gap-[11px] mb-[13px]">
        <h3 className="m-0 font-display font-semibold text-[13px] leading-[normal] tracking-[.02em] text-[#cbd5e1]">{t.recordings}</h3>
        <span className="font-mono font-medium text-[11.5px] leading-[normal] text-[#64748b] whitespace-nowrap">{takes.length}</span>
      </div>

      {takes.length > 0 && (
        <div className="flex flex-col gap-[6px] mb-[13px]">
          {takes.map((tk) => (
            <div key={tk.id} className="flex items-center gap-3 py-[9px] px-[12px] rounded-[10px] border border-[#1e293b] bg-[#0f172a]">
              <Mic size={14} strokeWidth={1.9} className="flex-none" style={{ color: '#6ee7b7' }} />
              <a
                href={tk.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-0 text-[#cbd5e1] hover:text-[#cbd5e1] no-underline font-sans font-medium text-[13px] leading-[normal] truncate"
              >
                {tk.label} · {tk.songTitle}
              </a>
              <ExternalLink size={14} strokeWidth={2.1} className="flex-none" style={{ color: '#475569' }} />
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onDelete(tk.id)}
                  aria-label={t.removeSong}
                  className="grid place-items-center w-[24px] h-[24px] rounded-[7px] border border-[#1e293b] bg-[#0b1220] text-[#64748b] hover:text-[#cbd5e1] cursor-pointer flex-none"
                >
                  <X size={13} strokeWidth={2.2} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="flex gap-2 items-center">
          <Select value={songId} onChange={(e) => setSongId(e.target.value)} className="flex-1 min-w-0">
            <option value="">{t.pickSong}</option>
            {setlist.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </Select>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={t.recordingUrl}
            className="flex-1 min-w-0 text-[13px]"
          />
          <Button variant="surface" className="py-[9px] px-[12px] flex-none" onClick={add}>
            <Plus size={14} strokeWidth={2.2} />
            {t.addRecording}
          </Button>
        </div>
      )}
    </div>
  );
}
