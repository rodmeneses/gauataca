-- GUATACA — V18: archive availability polls.
--
-- Old polls (the gig got booked, or the idea died) clutter the Availability tab. An admin
-- can archive one: it moves to an Archived list, answers and all, and can be restored.
-- An archived poll takes no answers, same as a closed one.

alter table availability_polls add column archived boolean not null default false;

drop policy "availability_votes_write" on availability_votes;
create policy "availability_votes_write" on availability_votes for all
  using (auth.uid() = profile_id)
  with check (
    auth.uid() = profile_id
    and exists (select 1 from availability_polls p where p.id = poll_id and not p.closed and not p.archived)
  );
