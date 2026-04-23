-- Run this in Supabase SQL Editor to migrate to multi-user support.
-- WARNING: drops the old 'essays' table. Back up data first if needed.

DROP TABLE IF EXISTS essays;

-- Per-user essay tracking (composite PK: user_id + essay slug)
CREATE TABLE IF NOT EXISTS user_essays (
  user_id   TEXT        NOT NULL,
  id        TEXT        NOT NULL,
  title     TEXT        NOT NULL,
  url       TEXT        NOT NULL,
  status    TEXT        CHECK (status IN ('done', 'reread_worthy', 'need_to_reread')),
  length    TEXT        CHECK (length IN ('short', 'medium', 'long')),
  date_read DATE,
  comments  TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, id)
);

-- Stores user email for auto-delete exemption
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id    TEXT        PRIMARY KEY,
  email      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
-- NOTE: auth.uid() won't work here because this app uses Auth0 + Supabase anon key
-- without the Supabase JWT integration configured. Policies are open; isolation is
-- enforced at the application layer via user_id filtering in all queries.
-- To add true row-level isolation: configure Auth0 as a JWT provider in
-- Supabase Dashboard > Auth > Sign In Methods, then replace USING (true) with
-- USING (user_id = auth.uid()::text).
ALTER TABLE user_essays  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all" ON user_essays;
CREATE POLICY "allow_all" ON user_essays  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all" ON user_profiles;
CREATE POLICY "allow_all" ON user_profiles FOR ALL USING (true) WITH CHECK (true);

-- Auto-delete stale data for non-exempt users.
-- Requires the pg_cron extension:
--   Supabase Dashboard > Database > Extensions > enable pg_cron
-- Runs daily at 00:00 UTC. Deletes all essays for users whose most recent edit
-- is older than 3 days, unless their email is 'more.early@gmail.com'.
SELECT cron.schedule(
  'delete-stale-user-data',
  '0 0 * * *',
  $$
    DELETE FROM user_essays
    WHERE user_id IN (
      SELECT up.user_id
      FROM user_profiles up
      WHERE up.email != 'more.early@gmail.com'
        AND (
          SELECT MAX(ue.updated_at)
          FROM user_essays ue
          WHERE ue.user_id = up.user_id
        ) < NOW() - INTERVAL '3 days'
    );

    DELETE FROM user_profiles
    WHERE email != 'more.early@gmail.com'
      AND user_id NOT IN (SELECT DISTINCT user_id FROM user_essays);
  $$
);
