-- GUATACA — V16: server-side input constraints.
--
-- Mirrors the limits enforced by the forms (src/lib/validate.ts) so a client that
-- bypasses the UI can't store empty titles, negative money or oversized text.
-- Added NOT VALID: existing rows are left alone, every new insert/update is checked.

alter table transactions add constraint transactions_amount_positive check (amount_cents > 0 and amount_cents <= 100000000) not valid;
alter table transactions add constraint transactions_desc_len check (char_length(description_es) <= 120 and char_length(description_en) <= 120) not valid;

alter table events add constraint events_fee_cost_range check (fee_cents between 0 and 100000000 and cost_cents between 0 and 100000000) not valid;
alter table events add constraint events_hours_range check (duration_hours is null or (duration_hours > 0 and duration_hours <= 48)) not valid;
alter table events add constraint events_text_len check (
  char_length(trim(title_es)) between 1 and 120 and char_length(trim(title_en)) between 1 and 120
  and char_length(venue) <= 120
  and (note_es is null or char_length(note_es) <= 2000) and (note_en is null or char_length(note_en) <= 2000)
) not valid;

alter table songs add constraint songs_bpm_range check (bpm between 20 and 400) not valid;
alter table songs add constraint songs_title_len check (char_length(trim(title_es)) between 1 and 120 and char_length(trim(title_en)) between 1 and 120) not valid;
alter table songs add constraint songs_key_len check (char_length(key) <= 10) not valid;

alter table song_links add constraint song_links_url_http check (url ~* '^https?://' and char_length(url) <= 500) not valid;

alter table gear add constraint gear_cost_range check (cost_cents between 0 and 100000000) not valid;
alter table gear add constraint gear_name_len check (char_length(trim(name_es)) between 1 and 120 and char_length(trim(name_en)) between 1 and 120) not valid;

alter table availability_polls add constraint availability_polls_title_len check (char_length(trim(title)) between 1 and 80) not valid;

alter table links add constraint links_url_http check (url ~* '^https?://' and char_length(url) <= 500) not valid;
alter table links add constraint links_title_len check (char_length(trim(title)) between 1 and 80) not valid;
alter table event_links add constraint event_links_url_http check (url ~* '^https?://' and char_length(url) <= 500) not valid;
