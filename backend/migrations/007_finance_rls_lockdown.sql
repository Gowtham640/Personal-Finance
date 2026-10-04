-- Finance data is accessible only through the authenticated FastAPI boundary.
-- The browser never receives a Supabase key; API and scraper use service_role.
BEGIN;

CREATE TEMP TABLE finance_rls_before ON COMMIT DROP AS
SELECT table_name,
       row_count,
       row_digest
FROM (
  SELECT 'fin_users' AS table_name,
         count(*) AS row_count,
         md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)), '')) AS row_digest
  FROM "Personal Finance".fin_users t
  UNION ALL
  SELECT 'fin_transactions', count(*),
         md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)), ''))
  FROM "Personal Finance".fin_transactions t
  UNION ALL
  SELECT 'fin_balance_history', count(*),
         md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)), ''))
  FROM "Personal Finance".fin_balance_history t
  UNION ALL
  SELECT 'fin_sources', count(*),
         md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)), ''))
  FROM "Personal Finance".fin_sources t
  UNION ALL
  SELECT 'fin_category_mappings', count(*),
         md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)), ''))
  FROM "Personal Finance".fin_category_mappings t
  UNION ALL
  SELECT 'fin_groups', count(*),
         md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)), ''))
  FROM "Personal Finance".fin_groups t
  UNION ALL
  SELECT 'fin_categories', count(*),
         md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)), ''))
  FROM "Personal Finance".fin_categories t
) snapshot;

REVOKE ALL ON SCHEMA "Personal Finance" FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "Personal Finance" FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "Personal Finance" FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA "Personal Finance" FROM PUBLIC, anon, authenticated;

-- Prevent future Finance objects from inheriting broad API-role privileges.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "Personal Finance"
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "Personal Finance"
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "Personal Finance"
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "Personal Finance" FROM service_role;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "Personal Finance" FROM service_role;
GRANT USAGE ON SCHEMA "Personal Finance" TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "Personal Finance" TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "Personal Finance" TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "Personal Finance"
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA "Personal Finance"
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

DO $$
DECLARE
  finance_table TEXT;
BEGIN
  FOREACH finance_table IN ARRAY ARRAY[
    'fin_users',
    'fin_transactions',
    'fin_balance_history',
    'fin_sources',
    'fin_category_mappings',
    'fin_groups',
    'fin_categories'
  ] LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY',
      'Personal Finance',
      finance_table
    );
    EXECUTE format(
      'ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY',
      'Personal Finance',
      finance_table
    );
    EXECUTE format(
      'DROP POLICY IF EXISTS service_role_backend_access ON %I.%I',
      'Personal Finance',
      finance_table
    );
    EXECUTE format(
      'CREATE POLICY service_role_backend_access ON %I.%I '
      'FOR ALL TO service_role USING (true) WITH CHECK (true)',
      'Personal Finance',
      finance_table
    );
  END LOOP;
END $$;

-- Security changes must never alter Finance records.
DO $$
DECLARE
  previous RECORD;
  current_count BIGINT;
  current_digest TEXT;
BEGIN
  FOR previous IN SELECT * FROM finance_rls_before LOOP
    EXECUTE format(
      'SELECT count(*), '
      'md5(coalesce(string_agg(md5(to_jsonb(t)::text), '''' ORDER BY md5(to_jsonb(t)::text)), '''')) '
      'FROM %I.%I t',
      'Personal Finance',
      previous.table_name
    )
    INTO current_count, current_digest;

    IF current_count <> previous.row_count OR current_digest <> previous.row_digest THEN
      RAISE EXCEPTION 'Finance data changed while securing table %', previous.table_name;
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
