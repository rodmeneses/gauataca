-- BandSync — V4: split event money into income (fee) + expense (cost), and add
-- a `settled` flag so the ledger transactions are created at confirmation time,
-- not at event creation.

alter table events add column cost_cents int not null default 0;
alter table events add column settled boolean not null default false;

-- Migrate the old signed fee_cents: negative values were costs.
update events set cost_cents = -fee_cents, fee_cents = 0 where fee_cents < 0;

-- Events that already have linked transactions are already settled (existing DBs).
update events set settled = true
where id in (select distinct event_id from transactions where event_id is not null);
