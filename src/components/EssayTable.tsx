import { useRef, useState } from "react";
import type { EssayRow as EssayRowType } from "../supabaseClient";
import EssayRow from "./EssayRow";
import Filters, { applyFiltersAndSort } from "./Filters";
import type { SortKey, StatusFilter } from "./Filters";

interface Props {
  essays: EssayRowType[];
  onChange: (id: string, patch: Partial<EssayRowType>) => void;
  onBatchChange: (patches: { id: string; patch: Partial<EssayRowType> }[]) => void;
}

const CSV_TO_STATUS: Record<string, EssayRowType["status"]> = {
  done: "done",
  reread: "reread_worthy",
  reread_worthy: "reread_worthy",
  understand: "need_to_reread",
  need_to_reread: "need_to_reread",
};

const STATUS_TO_CSV: Record<string, string> = {
  done: "Done",
  reread_worthy: "Reread",
  need_to_reread: "Understand",
};

const LENGTH_TO_CSV: Record<string, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
};

function parseCSV(text: string): string[][] {
  const results: string[][] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  for (const line of lines) {
    const fields: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        i++;
        let field = "";
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { field += '"'; i += 2; }
          else if (line[i] === '"') { i++; break; }
          else { field += line[i++]; }
        }
        fields.push(field);
        if (line[i] === ",") i++;
      } else {
        let field = "";
        while (i < line.length && line[i] !== ",") field += line[i++];
        fields.push(field.trim());
        if (line[i] === ",") i++;
      }
    }
    results.push(fields);
  }
  return results;
}

export default function EssayTable({ essays, onChange, onBatchChange }: Props) {
  const [sort, setSort] = useState<SortKey>("default");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const header = "Essay,Date,Note (Done, Reread, Understand),Length,Comments";
    const rows = essays.map(e => {
      const note = e.status ? (STATUS_TO_CSV[e.status] ?? "") : "";
      const length = e.length ? (LENGTH_TO_CSV[e.length] ?? "") : "";
      const comment = (e.comments ?? "").replace(/"/g, '""');
      return `"${e.title}","${e.date_read ?? ""}","${note}","${length}","${comment}"`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "graham-essays.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text).slice(1); // skip header
      const patches: { id: string; patch: Partial<EssayRowType> }[] = [];

      for (const cols of rows) {
        const [title, date, note, length, comment] = cols;
        const essay = essays.find(e => e.title.toLowerCase() === title?.toLowerCase());
        if (!essay) continue;

        const patch: Partial<EssayRowType> = {};
        const statusKey = note?.toLowerCase().replace(/\s+/g, "_") ?? "";
        if (statusKey in CSV_TO_STATUS) patch.status = CSV_TO_STATUS[statusKey];
        if (date) patch.date_read = date;
        const len = length?.toLowerCase() as EssayRowType["length"];
        if (len === "short" || len === "medium" || len === "long") patch.length = len;
        if (comment !== undefined) patch.comments = comment;

        if (Object.keys(patch).length > 0) patches.push({ id: essay.id, patch });
      }

      if (patches.length > 0) onBatchChange(patches);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const visible = applyFiltersAndSort(essays, sort, statusFilter);

  return (
    <div>
      <div className="table-toolbar">
        <Filters
          sort={sort}
          statusFilter={statusFilter}
          onSort={setSort}
          onStatusFilter={setStatusFilter}
          total={essays.length}
          showing={visible.length}
        />
        <div className="csv-btns">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleImport}
          />
          <button className="csv-btn" onClick={() => fileInputRef.current?.click()}>
            Import CSV
          </button>
          <button className="csv-btn" onClick={handleExport}>
            Export CSV
          </button>
        </div>
      </div>
      <table className="essay-table">
        <thead>
          <tr>
            <th className="col-num">#</th>
            <th className="col-title">Essay</th>
            <th className="col-status">Status</th>
            <th className="col-length">Length</th>
            <th className="col-date">Date Read</th>
            <th className="col-comments">Comments</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((essay, i) => (
            <EssayRow
              key={essay.id}
              essay={essay}
              index={i}
              onChange={onChange}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
