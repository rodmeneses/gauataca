/**
 * Forum idea modal: header (author, date, reactions, convert), body + ref chips +
 * photo strip, the comment list with one-level replies, and the composers (root
 * comment + per-comment reply) — each with @-mentions and photo attach.
 */
import { useEffect, useRef, useState } from 'react';
import { Archive, ArchiveRestore, CalendarDays, ChartColumn, ImagePlus, Link, MessageCircle, Music, Pin, Trash2, X } from 'lucide-react';
import { useGuataca } from '@/store';
import { Avatar, Button, CloseButton, Modal, useConfirm } from '@/components/ui';
import { PhotoStrip } from '@/components/ui/PhotoStrip';
import { ReactionButtons } from '@/components/ReactionButtons';
import { Composer } from './Composer';
import { RichText } from './RichText';
import type { CommentVm } from '@/store/vm';

/* ------------------------------------------------------------ ref chips row */
function RefChips({ refs, onOpen }: { refs: CommentVm['refs']; onOpen: (kind: 'song' | 'event', id: string) => void }) {
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
function ComposerRow({
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

export function ThreadModal() {
  const {
    t, state, th, isAdmin, closeModal,
    setCommentDraft, sendComment, setReplyDraft, setReplyTarget, sendReply,
    setThreadReaction, setCommentReaction, voteThreadPoll, addThreadPhotos, convertThread, goToSong, openEvent,
    toggleThreadPin, toggleThreadArchive, deleteComment, copyLink,
  } = useGuataca();
  const { confirm, dialog } = useConfirm();
  const ideaFileRef = useRef<HTMLInputElement>(null);
  const targetComment = state.modal?.kind === 'thread' ? state.modal.commentId : undefined;
  const threadId = th?.id;
  // Deep link to a comment/reply: scroll it into view once the thread renders.
  useEffect(() => {
    if (!targetComment || !threadId) return;
    document.getElementById(`comment-${targetComment}`)?.scrollIntoView({ block: 'center' });
  }, [targetComment, threadId]);
  if (!th) return null;

  const openRef = (kind: 'song' | 'event', id: string) => (kind === 'song' ? goToSong(id) : openEvent(id));

  const renderComment = (c: CommentVm, isReply: boolean) => (
    <div
      id={`comment-${c.id}`}
      className="bg-surface border rounded-[12px] p-[13px_14px]"
      style={{ borderColor: c.id === targetComment ? 'color-mix(in srgb, var(--color-emerald) 50%, transparent)' : 'var(--color-line-soft)' }}
    >
      <div className="flex items-center gap-[9px]">
        <Avatar initial={c.initial} size={26} radius={8} style={{ fontSize: 9.5 }} />
        <span className="font-sans font-semibold text-[12.5px] text-ink">{c.author}</span>
        <span className="text-[11.5px] text-ink-dim">{c.dateStr}</span>
        <span className="ml-auto flex-none">
          <ReactionButtons likes={c.likes} dislikes={c.dislikes} likedBy={c.likedBy} dislikedBy={c.dislikedBy} my={c.myReaction} onPick={(k) => setCommentReaction(c.id, k)} />
        </span>
      </div>
      <p className="m-0 mt-[10px] text-[13px] text-ink-body leading-[1.65]">
        <RichText text={c.text} />
      </p>
      <RefChips refs={c.refs} onOpen={openRef} />
      <div className="mt-[10px]">
        <PhotoStrip photos={c.media} />
      </div>
      <div className="mt-[10px] flex items-center gap-[8px]">
        {!isReply && (
          <button
            type="button"
            onClick={() => setReplyTarget(state.replyTarget === c.id ? null : c.id)}
            className="inline-flex items-center gap-[6px] py-[6px] px-[10px] rounded-[9px] border border-line bg-raised text-ink-muted font-sans font-semibold text-[12px] leading-[normal] cursor-pointer hover:text-violet-light hover:border-violet/40"
          >
            <MessageCircle size={13} strokeWidth={2} />
            {t.reply}
          </button>
        )}
        <button
          type="button"
          title={t.copyLink}
          aria-label={t.copyLink}
          onClick={() => copyLink('thread', th.id, c.id)}
          className="ml-auto grid place-items-center min-w-[32px] min-h-[32px] rounded-[9px] border border-line bg-raised text-ink-muted cursor-pointer hover:text-ink-body hover:border-line-hover"
        >
          <Link size={13} strokeWidth={2} />
        </button>
        {c.mine && (
          <button
            type="button"
            title={t.deleteComment}
            aria-label={t.deleteComment}
            onClick={() => confirm({ message: t.confirmDeleteComment, onConfirm: () => deleteComment(c.id) })}
            className="grid place-items-center min-w-[32px] min-h-[32px] rounded-[9px] border border-line bg-raised text-ink-muted cursor-pointer hover:text-red hover:border-red/40"
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Modal onClose={closeModal} maxWidth={660} align="top">
      {/* header */}
      <div className="p-[22px_24px] border-b border-line-soft flex gap-4 items-start">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 font-display font-semibold text-[20px] leading-[1.3] text-ink-bright">{th.title}</h2>
          <div className="flex items-center gap-3 mt-[11px] flex-wrap">
            <Avatar initial={th.initial} size={23} radius={7} style={{ fontSize: 9.5 }} />
            <span className="text-[12px] text-ink-meta">{th.author}</span>
            <span className="text-[12px] text-ink-dim">{th.dateStr}</span>
            <ReactionButtons
              likes={th.likes}
              dislikes={th.dislikes}
              likedBy={th.likedBy}
              dislikedBy={th.dislikedBy}
              my={th.myReaction}
              onPick={(k) => setThreadReaction(th.id, k)}
              className="flex-none"
            />
            {th.pinned && (
              <span className="inline-flex items-center gap-[5px] py-[4px] px-[9px] rounded-[7px] bg-[var(--color-tint-amber)] font-sans font-semibold text-[11px] leading-[normal]" style={{ color: 'var(--color-amber)' }}>
                <Pin size={11} strokeWidth={2.2} fill="currentColor" />
                {t.pinned}
              </span>
            )}
            {isAdmin && (
              <Button variant="brand" onClick={() => convertThread(th.id)} className="py-2 px-[14px] rounded-[9px] text-[12px]">
                {t.convert}
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-[8px] flex-none">
          <CloseButton onClick={closeModal} size={34} />
          {isAdmin && (
            <button
              type="button"
              title={th.pinned ? t.unpin : t.pin}
              onClick={() => toggleThreadPin(th.id)}
              className="grid place-items-center min-w-[40px] min-h-[40px] rounded-[10px] border border-line bg-surface cursor-pointer hover:border-line-hover"
              style={{ color: th.pinned ? 'var(--color-amber)' : 'var(--color-ink-muted)' }}
            >
              <Pin size={16} strokeWidth={2} fill={th.pinned ? 'currentColor' : 'none'} />
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              title={th.archived ? t.unarchive : t.archive}
              onClick={() => toggleThreadArchive(th.id)}
              className="grid place-items-center min-w-[40px] min-h-[40px] rounded-[10px] border border-line bg-surface text-ink-muted hover:text-ink-body hover:border-line-hover cursor-pointer"
            >
              {th.archived ? <ArchiveRestore size={16} strokeWidth={2} /> : <Archive size={16} strokeWidth={2} />}
            </button>
          )}
          <button
            type="button"
            title={t.copyLink}
            aria-label={t.copyLink}
            onClick={() => copyLink('thread', th.id)}
            className="grid place-items-center min-w-[40px] min-h-[40px] rounded-[10px] border border-line bg-surface text-ink-muted hover:text-ink-body hover:border-line-hover cursor-pointer"
          >
            <Link size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            title={t.addPhotos}
            onClick={() => ideaFileRef.current?.click()}
            className="grid place-items-center min-w-[40px] min-h-[40px] rounded-[10px] border border-line bg-surface text-ink-muted hover:text-ink-body hover:border-emerald/40 cursor-pointer"
          >
            <ImagePlus size={16} strokeWidth={2} />
          </button>
        </div>
        <input
          ref={ideaFileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (picked.length) addThreadPhotos(th.id, picked);
          }}
        />
      </div>

      {/* body */}
      <div className="p-[20px_24px] border-b border-line-soft">
        <p className="m-0 font-sans text-[14px] leading-[1.7] text-ink-body">
          <RichText text={th.body} />
        </p>
        <RefChips refs={th.refs} onOpen={openRef} />
        <div className="mt-[12px]">
          <PhotoStrip photos={th.media} />
        </div>

        {/* poll */}
        {th.poll && (
          <div className="mt-[14px] bg-raised border border-line-soft rounded-[12px] p-4">
            <div className="flex items-center gap-[10px] mb-[13px]">
              <ChartColumn size={15} strokeWidth={1.9} style={{ color: 'var(--color-violet-light)' }} />
              <span className="font-sans font-semibold text-[12.5px] leading-[normal] text-ink-base">{th.poll.question}</span>
              <span className="ml-auto font-mono font-medium text-[11px] leading-[normal] text-ink-dim">{th.poll.total} {t.votes}</span>
            </div>
            <div className="flex flex-col gap-2">
              {th.poll.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => voteThreadPoll(o.id)}
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
        )}
      </div>

      {/* comments */}
      <div className="p-[20px_24px] border-b border-line-soft flex flex-col gap-[12px]">
        {th.comments.length === 0 && (
          <p className="m-0 font-sans font-normal text-[13px] text-ink-dim">{t.noCommentsYet}</p>
        )}
        {th.comments.map((c) => (
          <div key={c.id} className="flex flex-col gap-[8px]">
            {renderComment(c, false)}
            {c.replies.length > 0 && (
              <div className="flex flex-col gap-[8px] ml-[30px] border-l border-line-soft pl-[14px]">
                {c.replies.map((r) => renderComment(r, true))}
              </div>
            )}
            {state.replyTarget === c.id && (
              <div className="ml-[30px]">
                <ComposerRow
                  value={state.replyDraft}
                  onChange={setReplyDraft}
                  onSend={(photos) => sendReply(photos)}
                  placeholder={t.replyPlaceholder}
                  sendLabel={t.send}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* root comment composer */}
      <div className="p-[18px_24px]">
        <ComposerRow
          value={state.commentDraft}
          onChange={setCommentDraft}
          onSend={(photos) => sendComment(photos)}
          placeholder={t.addComment}
          sendLabel={t.send}
        />
      </div>
      {dialog}
    </Modal>
  );
}
