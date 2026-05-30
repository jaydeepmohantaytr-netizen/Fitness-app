import { useEffect, useState } from "react";
import { Users, Star, Flame, Zap, ListChecks, Check, RotateCcw, UserCheck, UserX } from "lucide-react";
import { admin } from "../lib/api";
import type { AdminUserRow, Todo } from "../types";
import { Card, Ring, Stat, Pill } from "../components/ui/primitives";
import { useAuthStore } from "../store/useAuthStore";

export function AdminPage() {
  const me = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [selId, setSelId] = useState<number | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    admin
      .users()
      .then((r) => {
        setRows(r);
        setSelId((cur) => cur ?? r[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const sel = rows.find((r) => r.id === selId) ?? null;

  useEffect(() => {
    if (selId == null) return;
    admin.userTodos(selId).then(setTodos).catch(() => setTodos([]));
  }, [selId]);

  async function toggleSupervise() {
    if (!sel || !me) return;
    setBusy(true);
    const newSup = sel.supervisor_id === me.id ? null : me.id;
    try {
      const updated = await admin.assignSupervisor(sel.id, newSup);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="empty-note">Loading members…</p>;
  if (rows.length === 0) return <p className="empty-note">No members yet. Users appear here as they sign up.</p>;

  const completion = (r: AdminUserRow) => {
    const total = r.open_tasks + r.completed_tasks;
    return total ? Math.round((r.completed_tasks / total) * 100) : 0;
  };
  const adColor = (pct: number) =>
    pct >= 80 ? "var(--c-green)" : pct >= 50 ? "var(--c-amber)" : "var(--c-orange)";

  const flags = sel
    ? [
        sel.stats.current_streak === 0 ? "No active streak — could use a nudge" : null,
        sel.open_tasks > 0 ? `${sel.open_tasks} open task${sel.open_tasks === 1 ? "" : "s"}` : null,
        sel.stats.multiplier > 1 ? "On a streak bonus — progressing well" : null,
      ].filter(Boolean)
    : [];

  return (
    <div className="admin-grid">
      {/* People list */}
      <div className="admin-list">
        <div className="admin-list-head">
          <Users size={14} /> People you supervise
        </div>
        {rows.map((p) => {
          const pct = completion(p);
          return (
            <button key={p.id} className={"tn-row" + (selId === p.id ? " sel" : "")} onClick={() => setSelId(p.id)}>
              <div className="tn-avatar">{(p.display_name || p.username)[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="tn-name">{p.display_name || p.username}</div>
                <div className="tn-role">
                  {p.role === "admin" ? "Admin" : "Member"}
                  {p.supervisor_id === me?.id ? " · yours" : ""}
                </div>
              </div>
              <div className="tn-ad" style={{ color: adColor(pct) }}>{pct}%</div>
            </button>
          );
        })}
      </div>

      {/* Detail */}
      {sel && (
        <div>
          <Card style={{ padding: 20 }}>
            <div className="ad-head">
              <div className="tn-avatar lg">{(sel.display_name || sel.username)[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 22, margin: 0 }}>{sel.display_name || sel.username}</h2>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                  {sel.email} · {sel.role === "admin" ? "Admin" : "Member"}
                </div>
              </div>
              {sel.id === me?.id ? (
                <Pill color="var(--c-violet)">You</Pill>
              ) : (
                <Pill color={sel.supervisor_id === me?.id ? "var(--c-green)" : "var(--c-accent)"}>
                  {sel.supervisor_id === me?.id ? "Supervised by you" : "Not supervised"}
                </Pill>
              )}
            </div>

            <div className="ad-stats">
              <div className="ad-stat">
                <Stat label="Level" value={sel.stats.level} icon={<Star size={13} />} />
              </div>
              <div className="ad-stat">
                <Stat label="Streak" value={sel.stats.current_streak} unit="d" color="var(--c-orange)" icon={<Flame size={13} />} />
              </div>
              <div className="ad-stat">
                <Stat label="Total EXP" value={sel.stats.total_exp} icon={<Zap size={13} />} />
              </div>
              <div className="ad-stat">
                <Stat label="Boost" value={`${sel.stats.multiplier}×`} color={sel.stats.multiplier > 1 ? "var(--c-amber)" : undefined} icon={<Zap size={13} />} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Ring value={sel.stats.exp_into_level} max={sel.stats.exp_for_next_level} size={84} sw={9} color="var(--c-accent)">
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--mono)", fontWeight: 800, fontSize: 18 }}>{sel.stats.level}</div>
                  <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: ".1em" }}>LVL</div>
                </div>
              </Ring>
              <div>
                <div className="stat-label" style={{ marginBottom: 4 }}>Progress to next level</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 14 }}>
                  {sel.stats.exp_into_level} / {sel.stats.exp_for_next_level} EXP
                </div>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
                  {sel.completed_tasks} done · {sel.open_tasks} open
                </div>
              </div>
            </div>
          </Card>

          {flags.length > 0 && (
            <Card style={{ padding: 20, borderColor: "color-mix(in oklab, var(--c-orange) 30%, var(--border))" }}>
              <div className="stat-label" style={{ marginBottom: 10, color: "var(--c-orange)" }}>
                <Zap size={13} /> At a glance
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {flags.map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--c-orange)", flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent tasks */}
          <Card style={{ padding: 20 }}>
            <div className="stat-label" style={{ marginBottom: 12 }}>
              <ListChecks size={13} /> Recent tasks
            </div>
            {todos.length === 0 ? (
              <div className="empty-note" style={{ padding: 12 }}>No tasks logged.</div>
            ) : (
              <div className="todo-list">
                {todos.slice(0, 6).map((t) => (
                  <div key={t.id} className={"todo-item" + (t.completed ? " done" : "")}>
                    <span className={"todo-box"} style={t.completed ? { background: "var(--c-green)", borderColor: "var(--c-green)" } : {}}>
                      {t.completed && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className="todo-text">{t.title}</span>
                    <span className="todo-cat">{t.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Supervisor actions */}
          {sel.id !== me?.id && (
            <Card style={{ padding: 20 }}>
              <div className="stat-label" style={{ marginBottom: 14 }}>
                <UserCheck size={13} /> Supervisor actions
              </div>
              <button
                className={"btn btn-lg " + (sel.supervisor_id === me?.id ? "btn-ghost" : "btn-primary")}
                style={{ width: "100%" }}
                onClick={toggleSupervise}
                disabled={busy}
              >
                {sel.supervisor_id === me?.id ? (
                  <>
                    <UserX size={16} /> Stop supervising
                  </>
                ) : (
                  <>
                    <UserCheck size={16} /> Become their supervisor
                  </>
                )}
              </button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
