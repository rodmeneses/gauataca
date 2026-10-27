-- GUATACA — V17: availability polls get time slots.
--
-- A candidate used to be just a date. Now it's a slot: a date plus an optional start
-- and end hour, so one poll can offer the same day at different times
-- (e.g. Sat 14:00–17:00 and Sat 19:00–22:00).
--   * `availability_dates` gains a surrogate `id` and `start_time` / `end_time`.
--   * `availability_votes` points at the slot (`slot_id`) instead of (poll_id, date);
--     `poll_id` stays so the "poll is open" RLS check keeps working.
-- Existing dates become all-day slots and keep their votes.

alter table availability_dates add column id serial;
alter table availability_dates add column start_time time;
alter table availability_dates add column end_time time;

alter table availability_votes add column slot_id int;
update availability_votes v set slot_id = d.id
  from availability_dates d
  where d.poll_id = v.poll_id and d.date = v.date;

-- Dropping the column also drops the old (poll_id, date) primary key and foreign key.
alter table availability_votes drop column date;
alter table availability_votes alter column slot_id set not null;
alter table availability_votes add primary key (slot_id, profile_id);

alter table availability_dates drop constraint availability_dates_pkey;
alter table availability_dates add primary key (id);
alter table availability_votes add constraint availability_votes_slot_fkey
  foreign key (slot_id) references availability_dates(id) on delete cascade;
-- No duplicate slots. Missing hours count as equal; '24:00' stands in for "none" since the
-- app's time inputs can't produce it.
create unique index availability_dates_slot_unique on availability_dates
  (poll_id, date, coalesce(start_time, '24:00'), coalesce(end_time, '24:00'));
-- An end hour needs a start hour, and the two can't be equal.
alter table availability_dates add constraint availability_dates_times_check
  check (end_time is null or (start_time is not null and end_time <> start_time));
