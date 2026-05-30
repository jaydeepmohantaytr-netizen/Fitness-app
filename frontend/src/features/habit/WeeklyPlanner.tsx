import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { planner } from "../../lib/api";
import type { WeeklyItem } from "../../types";
import { toISODate, mondayOf, addDays, WEEKDAYS, WEEKDAYS_LONG } from "../../lib/utils";
import { cn } from "../../lib/utils";

export function WeeklyPlanner() {
  const [weekStart, setWeekStart] = useState(() => toISODate(mondayOf(new Date())));
  const [items, setItems] = useState<WeeklyItem[]>([]);
  const [draft, setDraft] = useState<{ day: number; value: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    planner
      .listWeekly(weekStart)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [weekStart]);

  async function add(dayOfWeek: number, title: string) {
    if (!title.trim()) {
      setDraft(null);
      return;
    }
    const created = await planner.createWeekly({
      week_start: weekStart,
      day_of_week: dayOfWeek,
      title: title.trim(),
    });
    setItems((prev) => [...prev, created]);
    setDraft(null);
  }

  async function toggle(item: WeeklyItem) {
    const updated = await planner.updateWeekly(item.id, { completed: !item.completed });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  }

  async function remove(id: number) {
    await planner.removeWeekly(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function shiftWeek(n: number) {
    const [y, m, d] = weekStart.split("-").map(Number);
    setWeekStart(toISODate(addDays(new Date(y, m - 1, d), n * 7)));
  }

  const [wy, wm, wd] = weekStart.split("-").map(Number);
  const monday = new Date(wy, wm - 1, wd);
  const rangeLabel = `${monday.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${addDays(monday, 6).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  const todayIso = toISODate(new Date());

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "8px 10px",
          marginBottom: 18,
        }}
      >
        <button className="icon-btn focus-ring" onClick={() => shiftWeek(-1)}>
          <ChevronLeft size={18} />
        </button>
        <p style={{ fontWeight: 700, fontSize: 14 }}>Week of {rangeLabel}</p>
        <button className="icon-btn focus-ring" onClick={() => shiftWeek(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <p className="empty-note">Loading…</p>
      ) : (
        <div className="weekly">
          {WEEKDAYS.map((label, dow) => {
            const dayItems = items.filter((i) => i.day_of_week === dow);
            const isToday = toISODate(addDays(monday, dow)) === todayIso;
            return (
              <div key={dow} className={cn("wk-col", isToday && "today")}>
                <div className="wk-col-head">
                  <span title={WEEKDAYS_LONG[dow]}>
                    {label} <span style={{ color: "var(--muted)", fontWeight: 600 }}>{addDays(monday, dow).getDate()}</span>
                  </span>
                  <button className="icon-btn" style={{ padding: 2 }} onClick={() => setDraft({ day: dow, value: "" })}>
                    <Plus size={14} />
                  </button>
                </div>
                <div className="wk-col-body">
                  <AnimatePresence initial={false}>
                    {dayItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="wk-chip"
                        style={{
                          borderLeftColor: item.completed ? "var(--c-green)" : "var(--c-accent)",
                          opacity: item.completed ? 0.6 : 1,
                        }}
                      >
                        <span
                          onClick={() => toggle(item)}
                          style={{
                            cursor: "pointer",
                            textDecoration: item.completed ? "line-through" : "none",
                            lineHeight: 1.3,
                          }}
                        >
                          {item.title}
                        </span>
                        <button onClick={() => remove(item.id)} title="Remove">
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {draft?.day === dow ? (
                    <input
                      autoFocus
                      className="wk-input"
                      value={draft.value}
                      onChange={(e) => setDraft({ day: dow, value: e.target.value })}
                      onBlur={() => add(dow, draft.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") add(dow, draft.value);
                        if (e.key === "Escape") setDraft(null);
                      }}
                      placeholder="New plan…"
                    />
                  ) : (
                    <button className="wk-add" onClick={() => setDraft({ day: dow, value: "" })}>
                      <Plus size={13} /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
