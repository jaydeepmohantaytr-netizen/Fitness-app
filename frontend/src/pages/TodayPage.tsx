import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, ListChecks, Apple, ChevronRight, Clock, Sparkles } from "lucide-react";
import { todos as todosApi, workout, nutrition, planner } from "../lib/api";
import type { Todo, WorkoutPlan, DailyItem } from "../types";
import { Card, Ring, Bar } from "../components/ui/primitives";
import { useAuthStore } from "../store/useAuthStore";
import { todayISO } from "../lib/utils";

const STREAK_BONUS_DAYS = 7;

export function TodayPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const stats = useAuthStore((s) => s.stats);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [kcal, setKcal] = useState(0);
  const [kgoal, setKgoal] = useState(2200);
  const [mealCount, setMealCount] = useState(0);
  const [blocks, setBlocks] = useState<DailyItem[]>([]);

  useEffect(() => {
    const today = todayISO();
    todosApi.list().then(setTodos).catch(() => {});
    workout.getPlan().then(setPlan).catch(() => {});
    planner.listDaily(today).then(setBlocks).catch(() => {});
    nutrition
      .day(today)
      .then((d) => {
        setKcal(d.totals.calories);
        setKgoal(d.goals.calorie_goal);
        setMealCount(d.entries.length);
      })
      .catch(() => {});
  }, []);

  if (!stats || !user) return null;

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = (user.display_name || user.username).split(" ")[0];
  const doubled = stats.current_streak >= STREAK_BONUS_DAYS;

  const todosDone = todos.filter((t) => t.completed).length;
  const daysDone = plan ? plan.days.filter((d) => d.completed_today).length : 0;
  const nextDay = plan?.days.find((d) => !d.completed_today) ?? plan?.days[0];
  const upNext = blocks.filter((b) => !b.completed).slice(0, 3);

  return (
    <div className="today">
      {/* Hero */}
      <div className="hero-card">
        <div>
          <div className="hero-greet">
            {greet}, {firstName}
          </div>
          <div className="hero-line">
            You're <b>Level {stats.level}</b> with a{" "}
            <b style={{ color: "var(--c-orange)" }}>{stats.current_streak}-day streak</b>
            {doubled && <span className="hero-x2"> · ×2 EXP live</span>}
          </div>
          <div className="hero-xp">
            <Bar value={stats.exp_into_level} max={stats.exp_for_next_level} color="var(--c-amber)" h={9} />
            <span className="hero-xp-num">
              {stats.exp_into_level} / {stats.exp_for_next_level} EXP
            </span>
          </div>
        </div>
        <Ring value={stats.exp_into_level} max={stats.exp_for_next_level} size={104} sw={11} color="var(--c-amber)">
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 30, fontWeight: 800, lineHeight: 1 }}>
              {stats.level}
            </div>
            <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: ".1em" }}>LEVEL</div>
          </div>
        </Ring>
      </div>

      {/* Section cards */}
      <div className="today-grid">
        <Card hover className="t-card" onClick={() => navigate("/workout")}>
          <div className="t-card-head">
            <div className="t-ic" style={{ color: "var(--c-accent)" }}>
              <Dumbbell size={18} />
            </div>
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </div>
          <div className="t-card-title">Workout</div>
          {plan ? (
            <div>
              <div className="t-big">
                {daysDone}/{plan.days.length}
                <span className="t-unit">days done</span>
              </div>
              <div className="t-sub">{nextDay?.name ?? plan.title}</div>
              <Bar value={daysDone} max={plan.days.length} color="var(--c-accent)" h={6} />
            </div>
          ) : (
            <div className="t-sub">Take the quiz to get your plan →</div>
          )}
        </Card>

        <Card hover className="t-card" onClick={() => navigate("/habits")}>
          <div className="t-card-head">
            <div className="t-ic" style={{ color: "var(--c-amber)" }}>
              <ListChecks size={18} />
            </div>
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </div>
          <div className="t-card-title">Habits</div>
          <div className="t-big">
            {todosDone}/{todos.length}
            <span className="t-unit">tasks</span>
          </div>
          <div className="t-sub">{Math.max(0, todos.length - todosDone)} left today</div>
          <Bar value={todosDone} max={todos.length || 1} color="var(--c-amber)" h={6} />
        </Card>

        <Card hover className="t-card" onClick={() => navigate("/nutrition")}>
          <div className="t-card-head">
            <div className="t-ic" style={{ color: "var(--c-green)" }}>
              <Apple size={18} />
            </div>
            <ChevronRight size={16} style={{ color: "var(--muted)" }} />
          </div>
          <div className="t-card-title">Nutrition</div>
          <div className="t-big">
            {kcal}
            <span className="t-unit">/ {kgoal} kcal</span>
          </div>
          <div className="t-sub">{mealCount} meals logged</div>
          <Bar value={kcal} max={kgoal} color="var(--c-green)" h={6} />
        </Card>
      </div>

      {/* Up next + nudge */}
      <div className="today-grid-2">
        <Card style={{ padding: 20 }}>
          <div className="stat-label" style={{ marginBottom: 14 }}>
            <Clock size={13} /> Up next today
          </div>
          <div className="up-next">
            {upNext.length === 0 ? (
              <div className="empty-note">No planned blocks left. Nice.</div>
            ) : (
              upNext.map((b) => (
                <div key={b.id} className="un-row">
                  <span className="un-time">{b.start_time || "—"}</span>
                  <span className="un-label">{b.title}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="coach-note-card" style={{ padding: 20 }}>
          <div className="stat-label" style={{ marginBottom: 12 }}>
            <Sparkles size={13} /> Keep your momentum
          </div>
          <p style={{ lineHeight: 1.55, fontSize: 14.5, margin: 0 }}>
            {doubled
              ? `Your ×${stats.multiplier} streak bonus is live — every task and workout counts double right now. Don't break the chain. 💪`
              : `You're ${Math.max(0, STREAK_BONUS_DAYS - stats.current_streak)} day${
                  STREAK_BONUS_DAYS - stats.current_streak === 1 ? "" : "s"
                } from a ×2 EXP streak bonus. Log something today to keep climbing. 🔥`}
          </p>
          <div className="coach-sign">
            <div className="avatar sm">FT</div> FitTrack Coach
          </div>
        </Card>
      </div>
    </div>
  );
}
