import { useRef } from "react";
import { EssayRow as EssayRowType } from "../supabaseClient";

interface Props {
  essay: EssayRowType;
  index: number;
  onChange: (id: string, patch: Partial<EssayRowType>) => void;
}

const STATUS_LABELS: Record<string, string> = {
  done: "Done",
  reread_worthy: "Reread Worthy",
  need_to_reread: "Need to Reread",
};

const LENGTH_LABELS: Record<string, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
};

export default function EssayRow({ essay, index, onChange }: Props) {
  const commentRef = useRef<HTMLTextAreaElement>(null);

  function handleStatusChange(val: string) {
    const patch: Partial<EssayRowType> = {
      status: val === "" ? null : (val as EssayRowType["status"]),
    };
    if (val === "done" && !essay.date_read) {
      patch.date_read = new Date().toISOString().slice(0, 10);
    }
    onChange(essay.id, patch);
  }

  function handleLengthChange(val: string) {
    onChange(essay.id, { length: val === "" ? null : (val as EssayRowType["length"]) });
  }

  function handleCommentBlur() {
    const val = commentRef.current?.value ?? "";
    if (val !== essay.comments) {
      onChange(essay.id, { comments: val });
    }
  }

  const rowClass = essay.status ? `row-${essay.status}` : "row-unread";

  return (
    <tr className={rowClass}>
      <td className="col-num">{index + 1}</td>
      <td className="col-title">
        <a href={essay.url} target="_blank" rel="noopener noreferrer">
          {essay.title}
        </a>
      </td>
      <td className="col-status">
        <select value={essay.status ?? ""} onChange={e => handleStatusChange(e.target.value)}>
          <option value="">—</option>
          <option value="done">Done</option>
          <option value="reread_worthy">Reread Worthy</option>
          <option value="need_to_reread">Need to Reread</option>
        </select>
      </td>
      <td className="col-length">
        <select value={essay.length ?? ""} onChange={e => handleLengthChange(e.target.value)}>
          <option value="">—</option>
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
      </td>
      <td className="col-date">{essay.date_read ?? "—"}</td>
      <td className="col-comments">
        <textarea
          ref={commentRef}
          defaultValue={essay.comments ?? ""}
          onBlur={handleCommentBlur}
          placeholder="Notes..."
          rows={1}
        />
      </td>
    </tr>
  );
}
