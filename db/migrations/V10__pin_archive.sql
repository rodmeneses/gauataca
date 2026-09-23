-- GUATACA — V10: pin events/forum ideas, archive forum ideas.
--
-- Events already split into upcoming/history automatically (starts_at < now()),
-- so they only need `pinned`. Forum ideas have no such date-driven split, so an
-- idea moves to Archived only when an admin archives it.

alter table events  add column pinned   boolean not null default false;
alter table threads add column pinned   boolean not null default false;
alter table threads add column archived boolean not null default false;
