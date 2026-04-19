# Graham Essay Tracker

A personal reading tracker for all 231 Paul Graham essays.

## Features

- All 231 essays listed in canonical order with direct links
- Mark each essay as **Done**, **Reread Worthy**, or **Need to Reread**
- Set a **length** (Short / Medium / Long) per essay
- Date auto-fills when you first mark an essay as Done
- Add **comments/notes** per essay
- **Sort** by length or date read
- **Filter** by status or unread
- Progress bar showing how many you've read

## Stack

- React + Vite + TypeScript
- Supabase (Postgres)

## Setup

1. Create a free [Supabase](https://supabase.com) project and run `supabase_setup.sql` in the SQL Editor
2. Copy your project URL and anon key into `.env`:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. `npm install && npm run dev`
