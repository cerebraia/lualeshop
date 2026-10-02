-- ============================================================
-- 0020 — Add notes column to expenses
-- ============================================================
-- The expenses table was created without a notes column.
-- The TypeScript Expense type has notes?: string and the
-- repository was attempting to insert/update this field,
-- causing PGRST204 (Could not find the 'notes' column).
-- Idempotent: ADD COLUMN IF NOT EXISTS.

alter table expenses
  add column if not exists notes text;

comment on column expenses.notes is
  'Optional free-text note for the expense record.';
