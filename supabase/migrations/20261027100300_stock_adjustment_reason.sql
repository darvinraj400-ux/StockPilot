-- Require a documented reason for manual adjustments at the database layer.
-- The application already enforces this in its form schema; this constraint
-- keeps direct RPC callers from bypassing the audit requirement.

alter table public.stock_movements
  add constraint stock_movements_adjustment_reason check (
    movement_type <> 'adjustment'
    or (note is not null and char_length(btrim(note)) >= 3)
  );
