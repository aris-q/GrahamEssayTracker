# Architectural Patterns

## State ownership — single source at root

All `EssayRow[]` state lives in `App.tsx:9`. Components receive data as props; none own essay state themselves. `handleChange` (App.tsx:42) is the single mutation path — passed down to `EssayTable` → `EssayRow`.

## Optimistic updates

`handleChange` applies the patch to local state immediately before awaiting Supabase (`App.tsx:43-44`). On failure it logs but does not roll back — acceptable for a personal app. If rollback is ever needed, snapshot state before the update and restore on error.

## Canonical order preserved across sorts

Essays are fetched unordered from Supabase, then re-sorted to match the `ESSAYS` array from `essays.ts` using an index `Map` (`App.tsx:33-36`). Sort/filter in `Filters.tsx` operate on a derived copy (`applyFiltersAndSort` returns a new array), so the canonical order is always recoverable.

## Co-located logic in component files

`Filters.tsx` exports both the `<Filters>` UI component and the pure `applyFiltersAndSort` function. This keeps related sort/filter logic together without a separate utils file. Follow this pattern for future display-logic pairs.

## Shared type via supabaseClient.ts

`EssayRow` (supabaseClient.ts:8-16) is the single interface used by all components. When adding fields to the Supabase table, update this interface first — the TypeScript compiler will surface every callsite that needs updating.

## Enum-style string literals

Status and length values are string literals constrained by the `EssayRow` interface (`"done" | "reread_worthy" | "need_to_reread"`, `"short" | "medium" | "long"`). The same strings appear in Supabase `CHECK` constraints (`supabase_setup.sql`). Keep these in sync manually — there is no codegen.

## Auto-date on status change

When status is set to `"done"` and `date_read` is currently null, `date_read` is set to today's ISO date string in the same patch object (`EssayRow.tsx:17-19`). This logic lives in the row component, not in `App.tsx`, because it is purely a UI-side derived action.
