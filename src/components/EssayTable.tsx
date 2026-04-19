import { useState } from "react";
import { EssayRow as EssayRowType } from "../supabaseClient";
import EssayRow from "./EssayRow";
import Filters, { SortKey, StatusFilter, applyFiltersAndSort } from "./Filters";

interface Props {
  essays: EssayRowType[];
  onChange: (id: string, patch: Partial<EssayRowType>) => void;
}

export default function EssayTable({ essays, onChange }: Props) {
  const [sort, setSort] = useState<SortKey>("default");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const visible = applyFiltersAndSort(essays, sort, statusFilter);

  return (
    <div>
      <Filters
        sort={sort}
        statusFilter={statusFilter}
        onSort={setSort}
        onStatusFilter={setStatusFilter}
        total={essays.length}
        showing={visible.length}
      />
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
            <EssayRow key={essay.id} essay={essay} index={i} onChange={onChange} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
