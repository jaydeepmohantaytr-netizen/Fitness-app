import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { planner } from "../../lib/api";
import type { DailyItem } from "../../types";
import { Pill, EmptyState } from "../../components/ui/primitives";
import { toISODate, addDays, prettyDate, todayISO } from "../../lib/utils";
import { cn } from "../../lib/utils";

export function DailyPlanner() {
  const [day, setDay] = useState(todayISO());
  const [items, setItems] = useState<DailyItem[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    planner
      .listDaily(day)
      .then((d) => setItems([...d].sort(sortByTime)))
      .finally(() => setLoading(false));
  }, [day]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const created = await planner.createDaily({ day, title: title.trim(), start_time: time || null });
    setItems((prev) => [...prev, created].sort(sortByTime));
    setTitle("");
    setTime("");
  }

  async function toggle(item: DailyItem) {
    const updated = await planner.updateDaily(item.id, { completed: !item.completed });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  }

  async function remove(id: number) {
    await planner.removeDaily(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function shiftDay(n: number) {
    const [y, m, d] = day.split("-").map(Number);
    setDay(toISODate(addDays(new Date(y, m - 1, d), n)));
  }

  const isToday = day === todayISO();
  const nowH = new Date().getHours() + new Date().getMinutes() / 60;
  const blockHour = (t: string | null) =>
    t ? Number(t.split(":")[0]) + Number(t.split(":")[1]) / 60 : Infinity;

  return (
    <div>
      {/* Date navigator */}
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
        <button className="icon-btn focus-ring" onClick={() => shiftDay(-1)}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 700, fontSize: 14 }}>{prettyDate(day)}</p>
          {!isToday && (
            <button className="link-btn" style={{ color: "var(--c-accent)" }} onClick={() => setDay(todayISO())}>
              Jump to today
            </button>
          )}
        </div>
        <button className="icon-btn focus-ring" onClick={() => shiftDay(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Add */}
      <form className="todo-add" onSubmit={add}>
        <Clock size={16} style={{ color: "var(--muted)" }} />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{ flex: "0 0 auto", width: 96 }}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Schedule a block — e.g. Morning workout"
        />
        <button type="submit" className="btn btn-primary btn-sm">
          <Plus size={15} /> Add
        </button>
      </form>

      {loading ? (
        <p className="empty-note">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Clock size={28} />}
          title="Nothing planned"
          hint="Add time blocks to structure your day. Optional times keep everything in order."
        />
      ) : (
        <div className="daily-timeline">
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const bh = blockHour(item.start_time);
              const nextBh = i < items.length - 1 ? blockHour(items[i + 1].start_time) : Infinity;
              const isNow = isToday && bh <= nowH && nextBh > nowH;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn("tl-row", item.completed && "done", isNow && "now")}
                >
                  <div className="tl-time">{item.start_time || "—"}</div>
                  <div className="tl-line">
                    <span
                      className="tl-dot"
                      style={{
                        background: item.completed ? "var(--c-accent)" : "var(--surface)",
                        borderColor: "var(--c-accent)",
                      }}
                    />
                  </div>
                  <button className="tl-card" onClick={() => toggle(item)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="tl-label">{item.title}</div>
                    </div>
                    {isNow && <Pill color="var(--c-accent)">Now</Pill>}
                    <span
                      className={cn("tl-check", item.completed && "on")}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(item);
                      }}
                    >
                      {item.completed && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span
                      className="todo-del"
                      style={{ opacity: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(item.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function sortByTime(a: DailyItem, b: DailyItem) {
  if (!a.start_time) return 1;
  if (!b.start_time) return -1;
  return a.start_time.localeCompare(b.start_time);
}
