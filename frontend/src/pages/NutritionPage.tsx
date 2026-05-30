import { useEffect, useState } from "react";
import { Sparkles, Zap, Apple, Trash2, WifiOff } from "lucide-react";
import { nutrition } from "../lib/api";
import type { FoodEntry, DayTotals, NutritionGoals } from "../types";
import { Card, Ring, Bar } from "../components/ui/primitives";
import { useAuthStore } from "../store/useAuthStore";
import { useToast } from "../store/useToast";
import { todayISO } from "../lib/utils";

export function NutritionPage() {
  const today = todayISO();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [totals, setTotals] = useState<DayTotals>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [goals, setGoals] = useState<NutritionGoals | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [err, setErr] = useState("");
  const [ollamaUp, setOllamaUp] = useState<boolean | null>(null);

  const setStats = useAuthStore((s) => s.setStats);
  const push = useToast((s) => s.push);

  useEffect(() => {
    Promise.all([nutrition.day(today), nutrition.status()])
      .then(([day, status]) => {
        setEntries(day.entries);
        setTotals(day.totals);
        setGoals(day.goals);
        setOllamaUp(status.ollama_available);
      })
      .catch(() => setOllamaUp(false))
      .finally(() => setLoading(false));
  }, [today]);

  async function logIt() {
    const value = text.trim();
    if (!value || logging) return;
    setLogging(true);
    setErr("");
    try {
      const parsed = await nutrition.parse(value);
      if (!parsed.items.length) {
        setErr("Couldn't find any food in that — try describing it differently.");
        setLogging(false);
        return;
      }
      const res = await nutrition.addEntries({
        log_date: today,
        source_text: value,
        items: parsed.items,
      });
      setEntries((prev) => [...prev, ...res.entries]);
      setTotals(res.totals);
      setStats({
        total_exp: res.total_exp,
        level: res.level,
        current_streak: res.current_streak,
        multiplier: res.multiplier,
      });
      if (res.exp_delta > 0) {
        push(`+${res.exp_delta} EXP — meal logged!`, "exp");
        if (res.leveled_up)
          setTimeout(() => push(`Level up! You reached Level ${res.level}`, "level"), 500);
      }
      if (parsed.source === "fallback") {
        push("Estimated offline — start Ollama for sharper macros", "info");
      }
      setText("");
    } catch {
      setErr("Couldn't estimate that one — try describing it a little differently.");
    }
    setLogging(false);
  }

  async function remove(id: number) {
    await nutrition.removeEntry(id);
    const day = await nutrition.day(today);
    setEntries(day.entries);
    setTotals(day.totals);
  }

  const kgoal = goals?.calorie_goal ?? 2200;
  const kpct = Math.round((totals.calories / kgoal) * 100);
  const remaining = kgoal - totals.calories;

  return (
    <div className="nutri-grid">
      {/* Log + history */}
      <div>
        {ollamaUp === false && (
          <div
            className="ai-hint"
            style={{ marginBottom: 14, color: "var(--c-amber)", fontSize: 13 }}
          >
            <WifiOff size={14} /> Local AI (Ollama) isn't reachable — entries use a rough offline
            estimate instead.
          </div>
        )}
        <Card style={{ padding: 20 }}>
          <div className="ai-input">
            <div className="ai-input-row">
              <Sparkles size={18} style={{ color: "var(--c-accent)", flexShrink: 0 }} />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && logIt()}
                placeholder='Describe what you ate — e.g. "chicken burrito bowl with guac"'
                disabled={logging}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={logIt}
                disabled={logging || !text.trim()}
              >
                {logging ? "Estimating…" : (<><Zap size={15} /> Log it</>)}
              </button>
            </div>
            <div className="ai-hint">
              <Zap size={12} /> AI estimates calories &amp; macros from plain language.
              {err && <span style={{ color: "var(--c-orange)" }}>{err}</span>}
            </div>
          </div>

          <div className="meal-log">
            {loading ? (
              <div className="empty-note">Loading today's log…</div>
            ) : entries.length === 0 ? (
              <div className="empty-note">No meals logged yet today. Describe your first one above.</div>
            ) : (
              entries.map((m) => (
                <div key={m.id} className="meal-row">
                  <div className="meal-icon">
                    <Apple size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="meal-text">{m.name}</div>
                    <div className="meal-meta">{m.quantity}</div>
                  </div>
                  <div className="meal-macros">
                    <span className="meal-kcal">{m.calories} kcal</span>
                    <span className="meal-pcf">
                      P{Math.round(m.protein_g)} · C{Math.round(m.carbs_g)} · F{Math.round(m.fat_g)}
                    </span>
                  </div>
                  <button className="todo-del" onClick={() => remove(m.id)} title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Daily ring + macros */}
      <div>
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <Ring
              value={totals.calories}
              max={kgoal}
              size={140}
              sw={13}
              color={kpct > 105 ? "var(--c-orange)" : "var(--c-green)"}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 800 }}>
                  {totals.calories}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>of {kgoal} kcal</div>
              </div>
            </Ring>
          </div>
          <div style={{ textAlign: "center", marginBottom: 18, fontSize: 13, color: "var(--muted)" }}>
            {remaining > 0 ? (
              <span>
                <b style={{ color: "var(--text)" }}>{remaining}</b> kcal remaining
              </span>
            ) : (
              <span style={{ color: "var(--c-orange)" }}>{Math.abs(remaining)} kcal over goal</span>
            )}
          </div>
          <div className="macro-stack">
            <MacroBar label="Protein" value={totals.protein_g} goal={goals?.protein_goal ?? 150} color="var(--c-accent)" />
            <MacroBar label="Carbs" value={totals.carbs_g} goal={goals?.carbs_goal ?? 220} color="var(--c-amber)" />
            <MacroBar label="Fat" value={totals.fat_g} goal={goals?.fat_goal ?? 70} color="var(--c-violet)" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function MacroBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  return (
    <div>
      <div className="macro-top">
        <span>{label}</span>
        <span className="macro-num">
          <b>{Math.round(value)}</b> / {Math.round(goal)}g
        </span>
      </div>
      <Bar value={value} max={goal} color={color} h={7} />
    </div>
  );
}
