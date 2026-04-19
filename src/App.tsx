import { useEffect, useState } from "react";
import { supabase, EssayRow } from "./supabaseClient";
import { ESSAYS } from "./essays";
import EssayTable from "./components/EssayTable";

export default function App() {
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const rows = ESSAYS.map(e => ({ id: e.id, title: e.title, url: e.url }));
      const { error: upsertErr } = await supabase
        .from("essays")
        .upsert(rows, { onConflict: "id", ignoreDuplicates: true });

      if (upsertErr) {
        setError(`Failed to initialize essays: ${upsertErr.message}`);
        setLoading(false);
        return;
      }

      const { data, error: fetchErr } = await supabase.from("essays").select("*");

      if (fetchErr || !data) {
        setError(`Failed to load essays: ${fetchErr?.message}`);
        setLoading(false);
        return;
      }

      const order = new Map(ESSAYS.map((e, i) => [e.id, i]));
      const sorted = [...data].sort(
        (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
      );
      setEssays(sorted as EssayRow[]);
      setLoading(false);
    }

    init();
  }, []);

  async function handleChange(id: string, patch: Partial<EssayRow>) {
    setEssays(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
    const { error } = await supabase.from("essays").update(patch).eq("id", id);
    if (error) console.error("Save failed:", error.message);
  }

  if (loading) return <div className="loading">Loading essays…</div>;
  if (error) return <div className="error">{error}<br /><small>Check your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set.</small></div>;

  const done = essays.filter(e => e.status === "done").length;
  const total = essays.length;

  return (
    <div className="app">
      <header>
        <h1>Paul Graham Essays</h1>
        <div className="subtitle">
          <span>{done} / {total} read</span>
          <span className="progress-bar">
            <span className="progress-fill" style={{ width: `${(done / total) * 100}%` }} />
          </span>
        </div>
      </header>
      <EssayTable essays={essays} onChange={handleChange} />
    </div>
  );
}
