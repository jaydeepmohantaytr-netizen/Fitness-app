import { useState } from "react";
import { Dumbbell, Check, Timer, Trophy, RotateCcw, Target, CalendarDays } from "lucide-react";
import type { WorkoutPlan, WorkoutDay } from "../../types";
import { Card, Ring, Stat } from "../../components/ui/primitives";
import { cn } from "../../lib/utils";

export function PlanView({
  plan,
  onToggleDay,
  onRetake,
}: {
  plan: WorkoutPlan;
  onToggleDay: (day: WorkoutDay) => void;
  onRetake: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const day = plan.days[activeIdx] ?? plan.days[0];
  const done = day?.completed_today;

  return (
    <div className="wk-grid">
      {/* Active session */}
      <div>
        <Card style={{ padding: 20 }}>
          <div className="sess-head">
            <div>
              <div className="stat-label">
                <Dumbbell size={13} /> {done ? "Completed today" : "Today's session"}
              </div>
              <h2 style={{ fontSize: 22, margin: "4px 0" }}>{day.name}</h2>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                {day.focus} · {day.exercises.length} exercises · ~{plan.minutes_per_session} min
              </p>
            </div>
            <Ring
              value={done ? 1 : 0}
              max={1}
              size={72}
              sw={8}
              color="var(--c-green)"
            >
              <Check size={22} style={{ color: done ? "var(--c-green)" : "var(--muted)" }} />
            </Ring>
          </div>

          <div className="ex-list">
            {day.exercises.map((ex, i) => (
              <div key={ex.id} className="ex-row">
                <div className="ex-check">{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ex-name">{ex.name}</div>
                  <div className="ex-tag">{ex.notes || `${ex.rest_seconds}s rest`}</div>
                </div>
                <div className="ex-sets">
                  <span className="ex-sets-num">
                    {ex.sets} × {ex.reps}
                  </span>
                  <span className="ex-sets-lbl">
                    <Timer size={9} style={{ display: "inline", verticalAlign: "middle" }} /> {ex.rest_seconds}s
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            className={cn("btn btn-lg", done ? "btn-ghost" : "btn-primary")}
            style={{ width: "100%", marginTop: 18 }}
            onClick={() => onToggleDay(day)}
          >
            {done ? (
              <>
                <RotateCcw size={16} /> Undo completion
              </>
            ) : (
              <>
                <Trophy size={16} /> Complete session (+EXP)
              </>
            )}
          </button>
        </Card>
      </div>

      {/* Week rail + summary */}
      <div>
        <Card style={{ padding: 20 }}>
          <div className="stat-label" style={{ marginBottom: 12 }}>
            <CalendarDays size={13} /> Your week
          </div>
          <div className="week-rail">
            {plan.days.map((d, i) => (
              <button
                key={d.id}
                className={cn("week-day", i === activeIdx && "cur")}
                onClick={() => setActiveIdx(i)}
              >
                <span className="week-day-n">Day {i + 1}</span>
                <span className="week-day-name">{d.name}</span>
                <span className="week-day-focus">{d.focus}</span>
                {d.completed_today && <Check size={14} style={{ color: "var(--c-green)" }} />}
              </button>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <div className="stat-label" style={{ marginBottom: 12 }}>
            <Target size={13} /> Plan summary
          </div>
          <div className="summ-grid">
            <Stat label="Goal" value={<span style={{ fontSize: 15, textTransform: "capitalize" }}>{plan.goal}</span>} />
            <Stat label="Level" value={<span style={{ fontSize: 15, textTransform: "capitalize" }}>{plan.experience}</span>} />
            <Stat label="Days / week" value={plan.days_per_week} />
            <Stat label="Per session" value={plan.minutes_per_session} unit="min" />
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 16 }} onClick={onRetake}>
            <RotateCcw size={14} /> Retake quiz
          </button>
        </Card>
      </div>
    </div>
  );
}
