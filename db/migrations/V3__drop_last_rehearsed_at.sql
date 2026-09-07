-- GUATACA — V3: drop songs.last_rehearsed_at.
--
-- The "last rehearsed" date was stored on `songs` but never recomputed, so every
-- song read as "never rehearsed" regardless of its setlist history. The value is
-- now derived in the frontend from the latest past event_songs (see the "derived,
-- not stored" handoff note), so the column is dead weight and is dropped here.

alter table songs drop column if exists last_rehearsed_at;
