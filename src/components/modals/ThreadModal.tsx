/**
 * Brainstorm thread modal (design lines 1267–1307): title + author meta + vote pill,
 * body paragraph, comment list and the comment composer footer.
 */
import { useBandSync } from '@/store';
import { Avatar, Button, CloseButton, Modal } from '@/components/ui';

export function ThreadModal() {
  const { th, t, isAdmin, state, closeModal, setCommentDraft, sendComment, convertThread } = useBandSync();
  if (!th) return null;

  return (
    <Modal onClose={closeModal} maxWidth={660} align="top">
      {/* header */}
      <div className="p-[22px_24px] border-b border-line-soft flex gap-4 items-start">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 font-display font-semibold text-[20px] leading-[1.3] text-ink-bright">{th.title}</h2>
          <div className="flex items-center gap-3 mt-[11px]">
            <Avatar initial={th.initial} size={23} radius={7} style={{ fontSize: 9.5 }} />
            <span className="text-[12px] text-ink-meta">{th.author}</span>
            <span className="text-[12px] text-ink-dim">{th.dateStr}</span>
            <span className="font-mono font-semibold text-[11.5px] text-emerald-light bg-[#34d3991c] py-[3px] px-[9px] rounded-[20px]">▲ {th.votes}</span>
          </div>
        </div>
        <CloseButton onClick={closeModal} size={34} />
      </div>

      {/* body */}
      <div className="p-[20px_24px] border-b border-line-soft">
        <p className="m-0 font-sans text-[14px] leading-[1.7] text-ink-body">{th.body}</p>
      </div>

      {/* comments */}
      <div className="p-[20px_24px] flex flex-col gap-[11px]">
        {th.comments.map((c, i) => (
          <div key={c.by + '-' + i} className="flex gap-3">
            <Avatar initial={c.initial} size={30} radius={9} style={{ fontSize: 10.5 }} />
            <div className="min-w-0 flex-1 bg-surface border border-line-soft rounded-[12px] p-[12px_14px]">
              <div className="font-sans font-semibold text-[12px] text-violet-lighter mb-[6px]">{c.by}</div>
              <p className="m-0 text-[13px] text-ink-body leading-[1.65]">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* composer */}
      <div className="p-[18px_24px] border-t border-line-soft flex gap-[10px] items-end">
        <textarea
          value={state.commentDraft}
          onChange={(e) => setCommentDraft(e.target.value)}
          rows={2}
          placeholder={t.addComment}
          className="flex-1 p-[11px_13px] rounded-[11px] border border-line bg-base text-ink-base font-sans text-[13.5px] outline-none resize-none"
        />
        <Button variant="primary" onClick={sendComment} className="py-3 px-[17px] rounded-[11px]">
          {t.send}
        </Button>
        {isAdmin && (
          <Button variant="brand" onClick={() => convertThread(th.id)} className="py-3 px-[17px] rounded-[11px]">
            {t.convert}
          </Button>
        )}
      </div>
    </Modal>
  );
}
