-- GUATACA — V4: add the 'dtv' income category.
--
-- DTV (the org) pays for some practices, so income movements need a category
-- to trace them back to DTV. Extend the transactions.category check constraint
-- to allow the new value (frontend type + picker updated in the same change).

alter table transactions drop constraint if exists transactions_category_check;
alter table transactions add constraint transactions_category_check
  check (category is null or category in ('fee', 'tip', 'donation', 'contribution', 'dtv'));
