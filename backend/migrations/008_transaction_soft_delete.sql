-- Soft-delete keeps a unique_ref tombstone so Gmail scrape cannot recreate a divided transaction.
BEGIN;

ALTER TABLE "Personal Finance".fin_transactions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_fin_transactions_user_active
  ON "Personal Finance".fin_transactions(user_id, transaction_date DESC)
  WHERE deleted_at IS NULL;

NOTIFY pgrst, 'reload schema';
COMMIT;
