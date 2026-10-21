/** Forum ideas, comments, polls and reactions. */
import type { Localized } from './app';

export type ReactionKind = 'like' | 'dislike';
export interface ReactionTally {
  like: number;
  dislike: number;
  /** Member ids behind each count, so the UI can show who reacted. */
  likedBy: string[];
  dislikedBy: string[];
}

/** A referenced song/event attached to an idea or comment (picker chips AND @-mentions). */
export interface ThreadRef {
  id: number;
  kind: 'song' | 'event';
  refId: string;
}

export interface ThreadMedia {
  id: number;
  url: string;
  authorId: string;
}

/** A poll attached to a forum idea. One poll per idea, created with the idea. */
export interface ThreadPoll {
  question: Localized;
  options: { id: number; label: Localized; votes: number; /** Ids of the members who voted for it. */ voterIds: string[] }[];
  /** True when members may pick several options. */
  multiple: boolean;
  /** Option ids the signed-in member picked (at most one unless `multiple`). */
  myOptionIds: number[];
}

/** A comment on an idea. Replies are flat — a reply holds `parentId` and no nested replies. */
export interface ThreadComment {
  id: number;
  parentId: number | null;
  by: string; // member id
  text: Localized;
  createdAt: string; // ISO timestamp
  reactions: ReactionTally;
  myReaction: ReactionKind | null;
  media: ThreadMedia[];
  refs: ThreadRef[];
  replies: ThreadComment[];
}

/** A forum idea. `comments` holds top-level comments only (replies live inside each). */
export interface Thread {
  id: string;
  by: string;
  date: string;
  title: Localized;
  body: Localized;
  reactions: ReactionTally;
  myReaction: ReactionKind | null;
  media: ThreadMedia[];
  refs: ThreadRef[];
  comments: ThreadComment[];
  /** Optional poll attached at creation time. */
  poll?: ThreadPoll;
  /** Admin-pinned ideas sort to the top of the active/archived list. */
  pinned: boolean;
  /** Admin-archived ideas move out of the active forum tab into Archived. */
  archived: boolean;
}
