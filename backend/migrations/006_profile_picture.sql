-- Google profile photo URL. Existing users remain unchanged until their next sign-in.
BEGIN;

CREATE TEMP TABLE finance_avatar_before ON COMMIT DROP AS
SELECT count(*) AS row_count,
       md5(coalesce(string_agg(md5(to_jsonb(t)::text), '' ORDER BY md5(to_jsonb(t)::text)), '')) AS row_digest
FROM "Personal Finance".fin_users t;

ALTER TABLE "Personal Finance".fin_users
  ADD COLUMN profile_picture_url TEXT;

DO $$
DECLARE
  previous_count BIGINT;
  previous_digest TEXT;
  current_count BIGINT;
  current_digest TEXT;
BEGIN
  SELECT row_count, row_digest INTO previous_count, previous_digest
  FROM finance_avatar_before;
  SELECT count(*),
         md5(coalesce(string_agg(md5((to_jsonb(t) - 'profile_picture_url')::text), ''
             ORDER BY md5((to_jsonb(t) - 'profile_picture_url')::text)), ''))
  INTO current_count, current_digest
  FROM "Personal Finance".fin_users t;
  IF current_count <> previous_count OR current_digest <> previous_digest THEN
    RAISE EXCEPTION 'fin_users rows changed during profile picture migration';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
COMMIT;
