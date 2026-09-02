-- BandSync — track who bought each piece of gear (for money tracking).
-- `purchased_by` records the member who paid; the auto-created expense
-- transaction is attributed to them so the ledger shows who the money is owed to.

alter table gear add column purchased_by uuid references profiles(id);

-- Backfill from the linked purchase transaction where one exists.
update gear g
set purchased_by = t.created_by
from transactions t
where t.gear_id = g.id and g.purchased_by is null;
