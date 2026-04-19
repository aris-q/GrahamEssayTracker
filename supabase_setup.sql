-- Run this in Supabase SQL Editor to create the essays table

CREATE TABLE IF NOT EXISTS essays (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT CHECK (status IN ('done', 'reread_worthy', 'need_to_reread')) DEFAULT NULL,
  length TEXT CHECK (length IN ('short', 'medium', 'long')) DEFAULT NULL,
  date_read DATE DEFAULT NULL,
  comments TEXT DEFAULT ''
);

ALTER TABLE essays ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can access data
DROP POLICY IF EXISTS "allow_all" ON essays;
CREATE POLICY "allow_authenticated" ON essays FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
