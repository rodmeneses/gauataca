/** Shared band links. */

/** Category of a shared band link. */
export type LinkCategory = 'docs' | 'music' | 'social' | 'logistics' | 'other';

/** A general band link (Drive folder, playlist, group chat, …). */
export interface BandLink {
  id: number;
  title: string;
  url: string;
  category: LinkCategory;
  createdBy: string;
}
