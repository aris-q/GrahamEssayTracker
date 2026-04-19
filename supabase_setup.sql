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

-- Enable Row Level Security (RLS) and allow all operations for anon key
-- (This is a personal app — no auth needed)
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON essays FOR ALL USING (true) WITH CHECK (true);
