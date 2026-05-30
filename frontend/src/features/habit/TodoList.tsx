import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Check, Trash2, Flame, Zap } from "lucide-react";
import { todos as todosApi } from "../../lib/api";
import type { Todo, Priority } from "../../types";
import { useAuthStore } from "../../store/useAuthStore";
import { useToast } from "../../store/useToast";
import { Ring, EmptyState } from "../../components/ui/primitives";
import { cn } from "../../lib/utils";

const STREAK_BONUS_DAYS = 7;

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "var(--c-cyan)" },
  { value: "medium", label: "Medium", color: "var(--c-accent)" },
  { value: "high", label: "High", color: "var(--c-orange)" },
];

export function TodoList() {
  const [items, setItems] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [loading, setLoading] = useState(true);
  const stats = useAuthStore((s) => s.stats);
  const setStats = useAuthStore((s) => s.setStats);
  const push = useToast((s) => s.push);

  useEffect(() => {
    todosApi
      .list()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const created = await todosApi.create({ title: title.trim(), priority });
    setItems((prev) => [created, ...prev]);
    setTitle("");
  }

  async function toggle(todo: Todo) {
    const res = await todosApi.toggle(todo.id);
    setItems((prev) => prev.map((t) => (t.id === todo.id ? res.todo : t)));
    setStats({
      total_exp: res.total_exp,
      level: res.level,
      current_streak: res.current_streak,
      multiplier: res.multiplier,
    });
    if (res.exp_delta > 0) {
      push(`+${res.exp_delta} EXP`, "exp");
      if (res.leveled_up)
        setTimeout(() => push(`Level up! You reached Level ${res.level}`, "level"), 500);
    }
  }

  async function remove(id: number) {
    await todosApi.remove(id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  const done = items.filter((t) => t.completed);
  const earned = done.reduce((s, t) => s + t.exp_awarded, 0);
  const streak = stats?.current_streak ?? 0;
  const doubled = streak >= STREAK_BONUS_DAYS;

  return (
    <div>
      {/* Banner */}
      <div
        className="todo-banner"
        style={{
          borderColor: doubled
            ? "color-mix(in oklab, var(--c-amber) 40%, var(--border))"
            : "var(--border)",
        }}
      >
        <div className="todo-banner-l">
          <Ring value={done.length} max={items.length || 1} size={64} sw={7} color="var(--c-amber)">
            <Zap size={20} style={{ color: "var(--c-amber)" }} fill="var(--c-amber)" />
          </Ring>
          <div>
            <div className="todo-count">
              {done.length}/{items.length} done today
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              <span style={{ fontFamily: "var(--mono)", color: "var(--c-amber)", fontWeight: 700 }}>
                +{earned} EXP
              </span>{" "}
              earned
            </div>
          </div>
        </div>
        <div className={cn("streak-flag", doubled && "on")}>
          <Flame
            size={15}
            fill={doubled ? "var(--c-orange)" : "none"}
            style={{ color: doubled ? "var(--c-orange)" : "var(--muted)" }}
          />
          {doubled ? (
            <span>
              <b>×2 active</b> · {streak}-day streak
            </span>
          ) : (
            <span>
              {Math.max(0, STREAK_BONUS_DAYS - streak)} days to <b>×2 EXP</b>
            </span>
          )}
        </div>
      </div>

      {/* Add */}
      <form className="todo-add" onSubmit={add}>
        <Plus size={18} style={{ color: "var(--muted)" }} />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a habit or task…"
        />
        <div style={{ display: "flex", gap: 4 }}>
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              title={p.label}
              className="focus-ring"
              style={{
                width: 14,
                height: 14,
                borderRadius: 99,
                background: priority === p.value ? p.color : "transparent",
                border: `2px solid ${p.color}`,
                transition: ".15s",
              }}
            />
          ))}
        </div>
      </form>

      {/* List */}
      {loading ? (
        <p className="empty-note">Loading tasks…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Check size={28} />}
          title="No tasks yet"
          hint="Add your first task above. Completing tasks earns EXP — keep a 7-day streak to double it."
        />
      ) : (
        <div className="todo-list">
          <AnimatePresence initial={false}>
            {items.map((t) => {
              const pri = PRIORITIES.find((p) => p.value === t.priority)!;
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("todo-item", t.completed && "done")}
                >
                  <button className="todo-box focus-ring" onClick={() => toggle(t)}>
                    {t.completed && <Check size={15} strokeWidth={3} />}
                  </button>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      background: pri.color,
                      flexShrink: 0,
                    }}
                  />
                  <span className="todo-text">{t.title}</span>
                  <span className="todo-cat">{pri.label}</span>
                  <span className="todo-xp">{t.completed ? `+${t.exp_awarded}` : ""}</span>
                  <button className="todo-del" onClick={() => remove(t.id)} title="Delete">
                    <Trash2 size={14} />
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
