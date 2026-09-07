-- GUATACA — V2: cascade profile deletion.
--
-- V1 left several `references profiles(id)` columns without an `on delete`
-- clause, so deleting a profile failed with a FK violation (or left orphaned
-- rows). This makes every profile reference cascade, so `delete from profiles`
-- removes the member and all their rows in one statement.
--
-- We drop and re-add each FK by looking up its actual constraint name (rather
-- than assuming the auto-generated `<table>_<column>_fkey`), so the migration
-- is robust regardless of how V1 was applied.

do $$
declare
  r record;
  con text;
begin
  for r in
    select * from (values
      ('transactions',     'created_by'),
      ('transactions',     'contributor_id'),
      ('gear',             'custodian_id'),
      ('gear',             'purchased_by'),
      ('gear_custody_log', 'from_id'),
      ('gear_custody_log', 'to_id'),
      ('event_media',      'submitted_by'),
      ('threads',          'author_id'),
      ('thread_comments',  'author_id')
    ) as t(tbl, col)
  loop
    -- Find the existing FK constraint on (tbl, col), whatever its name.
    select conname into con
    from pg_constraint
    where conrelid = r.tbl::regclass
      and contype = 'f'
      and conkey = (
        select array_agg(attnum)
        from pg_attribute
        where attrelid = r.tbl::regclass and attname = r.col
      );

    if con is not null then
      execute format('alter table %I drop constraint %I', r.tbl, con);
    end if;

    execute format(
      'alter table %I add constraint %I foreign key (%I) references profiles(id) on delete cascade',
      r.tbl, r.tbl || '_' || r.col || '_fkey', r.col
    );
  end loop;
end $$;
