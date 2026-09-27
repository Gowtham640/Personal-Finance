-- Run only after a verified pg_dump of the six public.fin_* tables.
-- Moving tables preserves their rows, indexes, sequences, constraints and foreign keys.
BEGIN;

CREATE TEMP TABLE finance_before_move (
  table_name TEXT PRIMARY KEY,
  row_count BIGINT NOT NULL,
  row_digest TEXT NOT NULL
) ON COMMIT DROP;

DO $$
DECLARE
  name TEXT;
  rows_before BIGINT;
  digest_before TEXT;
BEGIN
  FOREACH name IN ARRAY ARRAY[
    'fin_users', 'fin_transactions', 'fin_balance_history',
    'fin_sources', 'fin_category_mappings', 'fin_groups'
  ] LOOP
    EXECUTE format(
      'SELECT count(*), md5(coalesce(string_agg(md5(to_jsonb(t)::text), '''' ORDER BY md5(to_jsonb(t)::text)), '''')) FROM public.%I t',
      name
    ) INTO rows_before, digest_before;
    INSERT INTO finance_before_move VALUES (name, rows_before, digest_before);
  END LOOP;
  IF (SELECT count(*) FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'fin\_%' ESCAPE '\') <> 6 THEN
    RAISE EXCEPTION 'Unexpected number of public.fin_* tables; aborting migration';
  END IF;
END $$;

CREATE SCHEMA "Personal Finance";
ALTER TABLE public.fin_users SET SCHEMA "Personal Finance";
ALTER TABLE public.fin_groups SET SCHEMA "Personal Finance";
ALTER TABLE public.fin_transactions SET SCHEMA "Personal Finance";
ALTER TABLE public.fin_balance_history SET SCHEMA "Personal Finance";
ALTER TABLE public.fin_sources SET SCHEMA "Personal Finance";
ALTER TABLE public.fin_category_mappings SET SCHEMA "Personal Finance";

DO $$
DECLARE
  previous RECORD;
  rows_after BIGINT;
  digest_after TEXT;
BEGIN
  FOR previous IN SELECT * FROM finance_before_move LOOP
    EXECUTE format(
      'SELECT count(*), md5(coalesce(string_agg(md5(to_jsonb(t)::text), '''' ORDER BY md5(to_jsonb(t)::text)), '''')) FROM "Personal Finance".%I t',
      previous.table_name
    ) INTO rows_after, digest_after;
    IF rows_after <> previous.row_count OR digest_after <> previous.row_digest THEN
      RAISE EXCEPTION 'Data mismatch moving %', previous.table_name;
    END IF;
  END LOOP;
END $$;

ALTER TABLE "Personal Finance".fin_users
  ADD COLUMN gmail_connected_at TIMESTAMPTZ,
  ADD COLUMN gmail_expires_at TIMESTAMPTZ,
  ADD COLUMN expired BOOLEAN NOT NULL DEFAULT FALSE;

-- Historic refreshes changed the JSON access-token expiry, not consent age.
-- Existing rows have no consent timestamp; their original user timestamp is
-- the conservative, documented fallback until the next Google sign-in.
UPDATE "Personal Finance".fin_users
SET gmail_connected_at = coalesce(updated_at, created_at, now()),
    gmail_expires_at = coalesce(updated_at, created_at, now()) + interval '5 days',
    expired = coalesce(updated_at, created_at, now()) + interval '5 days' <= now()
WHERE gmail_tokens IS NOT NULL;

ALTER TABLE "Personal Finance".fin_groups
  ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE TABLE "Personal Finance".fin_categories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "Personal Finance".fin_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  icon_key TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_categories_user_updated
  ON "Personal Finance".fin_categories(user_id, updated_at DESC);
CREATE UNIQUE INDEX idx_fin_categories_user_active_name
  ON "Personal Finance".fin_categories(user_id, type, lower(name))
  WHERE deleted_at IS NULL;
ALTER TABLE "Personal Finance".fin_categories ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "Personal Finance" TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA "Personal Finance" TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "Personal Finance" TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
