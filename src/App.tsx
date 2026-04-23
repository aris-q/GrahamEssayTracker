import { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { supabase } from "./supabaseClient";
import type { EssayRow } from "./supabaseClient";
import { ESSAYS } from "./essays";
import EssayTable from "./components/EssayTable";

const BLANK_FIELDS = { status: null, length: null, date_read: null, comments: "" };

export default function App() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout, user, error: authError } = useAuth0();
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const undoStack = useRef<EssayRow[][]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) return;
    const userId = user.sub;
    const email = user.email ?? '';

    async function init() {
      await supabase
        .from("user_profiles")
        .upsert({ user_id: userId, email }, { onConflict: "user_id" });

      const { data: existing } = await supabase
        .from("user_essays")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (!existing || existing.length === 0) {
        const now = new Date().toISOString();
        const rows = ESSAYS.map(e => ({
          user_id: userId,
          id: e.id,
          title: e.title,
          url: e.url,
          ...BLANK_FIELDS,
          updated_at: now,
        }));
        const { error: insertErr } = await supabase.from("user_essays").insert(rows);
        if (insertErr) {
          setError(`Failed to initialize essays: ${insertErr.message}`);
          setLoading(false);
          return;
        }
      }

      const { data, error: fetchErr } = await supabase
        .from("user_essays")
        .select("id, title, url, status, length, date_read, comments")
        .eq("user_id", userId);

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
  }, [isAuthenticated, user]);

  function pushUndo(snapshot: EssayRow[]) {
    undoStack.current = [...undoStack.current.slice(-19), snapshot];
  }

  async function handleChange(id: string, patch: Partial<EssayRow>) {
    const userId = user?.sub ?? '';
    setEssays(prev => {
      pushUndo(prev);
      return prev.map(e => (e.id === id ? { ...e, ...patch } : e));
    });
    const { error } = await supabase
      .from("user_essays")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", id);
    if (error) console.error("Save failed:", error.message);
  }

  async function handleBatchChange(patches: { id: string; patch: Partial<EssayRow> }[]) {
    const userId = user?.sub ?? '';
    setEssays(prev => {
      pushUndo(prev);
      const map = new Map(patches.map(p => [p.id, p.patch]));
      return prev.map(e => map.has(e.id) ? { ...e, ...map.get(e.id) } : e);
    });
    const now = new Date().toISOString();
    await Promise.all(
      patches.map(({ id, patch }) =>
        supabase
          .from("user_essays")
          .update({ ...patch, updated_at: now })
          .eq("user_id", userId)
          .eq("id", id)
      )
    );
  }

  async function handleAddEssay(title: string, url: string) {
    const userId = user?.sub ?? '';
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const newRow = { user_id: userId, id, title, url, ...BLANK_FIELDS, updated_at: new Date().toISOString() };
    const { error } = await supabase
      .from("user_essays")
      .upsert([newRow], { onConflict: "user_id,id", ignoreDuplicates: true });
    if (error) { alert(`Failed to add essay: ${error.message}`); return; }
    const { data } = await supabase
      .from("user_essays")
      .select("id, title, url, status, length, date_read, comments")
      .eq("user_id", userId)
      .eq("id", id)
      .single();
    if (data) setEssays(prev => [...prev, data as EssayRow]);
  }

  async function handleClearAll() {
    if (!window.confirm("Clear all statuses, dates, lengths, and comments?")) return;
    await handleBatchChange(essays.map(e => ({ id: e.id, patch: BLANK_FIELDS })));
  }

  async function handleUndo() {
    const userId = user?.sub ?? '';
    if (undoStack.current.length === 0) return;
    const prev = undoStack.current[undoStack.current.length - 1];
    undoStack.current = undoStack.current.slice(0, -1);
    setEssays(prev);
    const now = new Date().toISOString();
    await Promise.all(
      prev.map(e =>
        supabase
          .from("user_essays")
          .update({
            status: e.status,
            length: e.length,
            date_read: e.date_read,
            comments: e.comments,
            updated_at: now,
          })
          .eq("user_id", userId)
          .eq("id", e.id)
      )
    );
  }

  if (isLoading) return <div className="loading">Loading…</div>;

  if (authError) {
    return (
      <div className="login-wrap">
        <div className="login-box">
          <h1>Graham Essay Tracker</h1>
          <p className="login-error">Access denied.</p>
          <button onClick={() => loginWithRedirect({ authorizationParams: { prompt: 'login' } })}>Try a different account</button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="login-wrap">
        <div className="login-box">
          <h1>Graham Essay Tracker</h1>
          <button onClick={() => loginWithRedirect()}>Log in</button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading essays…</div>;
  if (error) return <div className="error">{error}</div>;

  const done = essays.filter(e => e.status !== null).length;
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
          <span className="progress-pct">{Math.round((done / total) * 100)}%</span>
        </div>
        <div className="header-actions">
          <button className="csv-btn" onClick={handleUndo} disabled={undoStack.current.length === 0}>
            Undo
          </button>
          <button className="csv-btn danger" onClick={handleClearAll}>
            Clear All
          </button>
          <button
            className="signout-btn"
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            Sign out
          </button>
        </div>
      </header>
      <EssayTable essays={essays} onChange={handleChange} onBatchChange={handleBatchChange} onAddEssay={handleAddEssay} />
    </div>
  );
}
