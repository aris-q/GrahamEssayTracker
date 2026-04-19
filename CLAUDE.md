# BrantEssayTracker

Personal reading tracker for all 231 Paul Graham essays. Mark read status, length, and notes per essay. Data persists in Supabase.

## Tech Stack

- **React 19 + Vite 8** — frontend, no SSR
- **TypeScript 6** — strict mode via `tsconfig.app.json`
- **Supabase** — Postgres backend via `@supabase/supabase-js`
- **Plain CSS** — single `src/index.css`, no CSS framework

## Key Directories

| Path | Purpose |
|------|---------|
| `src/essays.ts` | Hardcoded list of all 231 essays (id, title, URL) — source of truth for canonical order |
| `src/supabaseClient.ts` | Supabase client singleton + `EssayRow` interface (shared type) |
| `src/components/` | `EssayTable` → `EssayRow` (rows) + `Filters` (sort/filter controls + pure sort logic) |
| `src/App.tsx` | Root: upserts essays on mount, fetches all rows, owns `essays` state |
| `supabase_setup.sql` | DDL for the `essays` table — run once in Supabase SQL Editor |
| `.env` | `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — never commit |

## Commands

```bash
npm run dev       # start dev server (localhost:5173)
npm run build     # tsc type-check + vite bundle
npm run lint      # eslint
npm run preview   # serve production build locally
```

## Environment

Requires `.env` with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...   # use anon key, NOT service_role key
```

## Additional Documentation

- [.claude/docs/architectural_patterns.md](.claude/docs/architectural_patterns.md) — state management, data flow, optimistic updates, type conventions
