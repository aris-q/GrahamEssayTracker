import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { EssayRow } from "./supabaseClient";
import { ESSAYS } from "./essays";
import EssayTable from "./components/EssayTable";
import Login from "./components/Login";

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL as string;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (s && s.user.email !== ALLOWED_EMAIL) {
        supabase.auth.signOut();
      } else {
        setSession(s);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s && s.user.email !== ALLOWED_EMAIL) {
        supabase.auth.signOut();
      } else {
        setSession(s);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
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
  }, [session]);

  async function handleChange(id: string, patch: Partial<EssayRow>) {
    setEssays(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
    const { error } = await supabase.from("essays").update(patch).eq("id", id);
    if (error) console.error("Save failed:", error.message);
  }

  if (session === undefined) return <div className="loading">Loading…</div>;
  if (!session) return <Login />;
  if (loading) return <div className="loading">Loading essays…</div>;
  if (error) return <div className="error">{error}</div>;

  const done = essays.filter(e => e.status === "done").length;
  const total = essays.length;

  return (
    <div className="app">
      <header>
        <h1>Graham Essay Tracker</h1>
        <div className="subtitle">
          <span>{done} / {total} read</span>
          <span className="progress-bar">
            <span className="progress-fill" style={{ width: `${(done / total) * 100}%` }} />
          </span>
        </div>
        <button className="signout-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>
      <EssayTable essays={essays} onChange={handleChange} />
    </div>
  );
}
