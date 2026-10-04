-- GUATACA — V12: multiple-choice forum polls.
--
-- `thread_polls.multiple` lets members pick more than one option. The votes table
-- already allows one row per member per option, so only the flag is new; existing
-- polls stay single-choice.

alter table thread_polls add column multiple boolean not null default false;
