import { useEffect, useState } from "react";
import type { EssayRow as EssayRowType } from "../supabaseClient";

interface Props {
  essay: EssayRowType;
  index: number;
  onChange: (id: string, patch: Partial<EssayRowType>) => void;
}

export default function EssayRow({ essay, index, onChange }: Props) {
  const [comment, setComment] = useState(essay.comments ?? "");
  const [expanded, setExpanded] = useState(false);

  // Sync when parent resets (clear all, undo, import)
  useEffect(() => {
    setComment(essay.comments ?? "");
  }, [essay.comments]);

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
    setExpanded(false);
    if (comment !== (essay.comments ?? "")) {
      onChange(essay.id, { comments: comment });
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
          className={expanded ? "expanded" : ""}
          value={comment}
          onChange={e => setComment(e.target.value)}
          onFocus={() => setExpanded(true)}
          onBlur={handleCommentBlur}
          placeholder="Notes..."
          rows={1}
        />
      </td>
    </tr>
  );
}
