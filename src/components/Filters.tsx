import type { EssayRow } from "../supabaseClient";

export type SortKey = "default" | "length_asc" | "length_desc" | "date_asc" | "date_desc";
export type StatusFilter = "all" | "unread" | "done" | "reread_worthy" | "need_to_reread";

interface Props {
  sort: SortKey;
  statusFilter: StatusFilter;
  onSort: (s: SortKey) => void;
  onStatusFilter: (f: StatusFilter) => void;
  total: number;
  showing: number;
}

export default function Filters({ sort, statusFilter, onSort, onStatusFilter, total, showing }: Props) {
  return (
    <div className="filters">
      <div className="filter-group">
        <label>Status</label>
        <select value={statusFilter} onChange={e => onStatusFilter(e.target.value as StatusFilter)}>
          <option value="all">All ({total})</option>
          <option value="unread">Unread</option>
          <option value="done">Done</option>
          <option value="reread_worthy">Reread Worthy</option>
          <option value="need_to_reread">Need to Reread</option>
        </select>
      </div>
      <div className="filter-group">
        <label>Sort</label>
        <select value={sort} onChange={e => onSort(e.target.value as SortKey)}>
          <option value="default">Default (list order)</option>
          <option value="length_asc">Length: Short → Long</option>
          <option value="length_desc">Length: Long → Short</option>
          <option value="date_asc">Date Read: Oldest first</option>
          <option value="date_desc">Date Read: Newest first</option>
        </select>
      </div>
      <span className="showing">Showing {showing} of {total}</span>
    </div>
  );
}

const LENGTH_ORDER = { short: 0, medium: 1, long: 2, null: 3 } as Record<string, number>;

export function applyFiltersAndSort(
  essays: EssayRow[],
  sort: SortKey,
  statusFilter: StatusFilter,
): EssayRow[] {
  let result = [...essays];

  if (statusFilter !== "all") {
    if (statusFilter === "unread") {
      result = result.filter(e => !e.status);
    } else {
      result = result.filter(e => e.status === statusFilter);
    }
  }

  if (sort === "length_asc") {
    result.sort((a, b) => (LENGTH_ORDER[a.length ?? "null"] ?? 3) - (LENGTH_ORDER[b.length ?? "null"] ?? 3));
  } else if (sort === "length_desc") {
    result.sort((a, b) => (LENGTH_ORDER[b.length ?? "null"] ?? 3) - (LENGTH_ORDER[a.length ?? "null"] ?? 3));
  } else if (sort === "date_asc") {
    result.sort((a, b) => (a.date_read ?? "").localeCompare(b.date_read ?? ""));
  } else if (sort === "date_desc") {
    result.sort((a, b) => (b.date_read ?? "").localeCompare(a.date_read ?? ""));
  }

  return result;
}
