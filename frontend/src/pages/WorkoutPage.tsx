import { useEffect, useState } from "react";
import { Sparkles, WifiOff, Target, CalendarDays, ShieldCheck, Check } from "lucide-react";
import { Card } from "../components/ui/primitives";
import { WorkoutQuiz } from "../features/workout/WorkoutQuiz";
import { PlanView } from "../features/workout/PlanView";
import { workout } from "../lib/api";
import type { WorkoutPlan, WorkoutDay, QuizPayload } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { useToast } from "../store/useToast";

const BUILD_STEPS = [
  "Analysing your goal & experience",
  "Choosing a weekly split",
  "Calibrating sets, reps & rest",
  "Finalising your week",
];

export function WorkoutPage() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [ollamaUp, setOllamaUp] = useState<boolean | null>(null);
  const setStats = useAuthStore((s) => s.setStats);
  const push = useToast((s) => s.push);

  useEffect(() => {
    Promise.all([workout.getPlan(), workout.status()])
      .then(([p, status]) => {
        setPlan(p);
        setOllamaUp(status.ollama_available);
      })
      .catch(() => setOllamaUp(false))
      .finally(() => setLoading(false));
  }, []);

  async function generate(payload: QuizPayload) {
    setGenerating(true);
    try {
      const created = await workout.generate(payload);
      setPlan(created);
      setQuizOpen(false);
      if (created.source === "fallback") {
        push("Built an offline plan — start Ollama for a tailored one", "info");
      } else {
        push("Your personalised plan is ready!", "level");
      }
    } catch {
      push("Couldn't generate a plan. Try again.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function toggleDay(day: WorkoutDay) {
    const res = await workout.toggleDay(day.id);
    setPlan((prev) =>
      prev
        ? {
            ...prev,
            days: prev.days.map((d) =>
              d.id === day.id ? { ...d, completed_today: res.completed } : d
            ),
          }
        : prev
    );
    setStats({
      total_exp: res.total_exp,
      level: res.level,
      current_streak: res.current_streak,
      multiplier: res.multiplier,
    });
    if (res.exp_delta > 0) {
      push(`+${res.exp_delta} EXP — workout logged!`, "exp");
      if (res.leveled_up)
        setTimeout(() => push(`Level up! You reached Level ${res.level}`, "level"), 500);
    }
  }

  if (loading) return <p className="empty-note">Loading…</p>;
  if (generating) return <BuildingState />;

  if (quizOpen || !plan) {
    return (
      <>
        {ollamaUp === false && (
          <div className="ai-hint" style={{ maxWidth: 620, margin: "0 auto 14px", color: "var(--c-amber)", fontSize: 13 }}>
            <WifiOff size={14} /> Local AI (Ollama) isn't reachable — you'll get a solid offline
            bodyweight plan instead.
          </div>
        )}
        {plan === null && !quizOpen ? (
          <WorkoutEmpty onStart={() => setQuizOpen(true)} />
        ) : (
          <Card style={{ padding: 24 }}>
            <WorkoutQuiz onSubmit={generate} submitting={generating} />
          </Card>
        )}
      </>
    );
  }

  return <PlanView plan={plan} onToggleDay={toggleDay} onRetake={() => setQuizOpen(true)} />;
}

function WorkoutEmpty({ onStart }: { onStart: () => void }) {
  return (
    <div className="wk-empty">
      <Card style={{ padding: 28 }}>
        <span className="pill" style={{ color: "var(--c-accent)", background: "color-mix(in oklab, var(--c-accent) 16%, transparent)" }}>
          2-minute setup
        </span>
        <h2 style={{ fontSize: 26, margin: "14px 0 8px", letterSpacing: "-.02em" }}>
          Get a home workout plan built around you
        </h2>
        <p style={{ color: "var(--muted)", maxWidth: 460, lineHeight: 1.55 }}>
          Answer a few questions about your goal, experience and schedule. We'll generate a weekly
          plan — and adjust it as you get stronger.
        </p>
        <div className="feat-row">
          {[
            [<Target size={16} key="t" />, "Matched to your level"],
            [<CalendarDays size={16} key="c" />, "Fits your week"],
            [<ShieldCheck size={16} key="s" />, "Works around injuries"],
          ].map(([ic, t], i) => (
            <div key={i} className="feat" style={{ color: "var(--text)" }}>
              <span style={{ color: "var(--c-accent)", display: "inline-flex" }}>{ic}</span>
              {t}
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-lg" style={{ marginTop: 22 }} onClick={onStart}>
          <Sparkles size={16} /> Take the quiz
        </button>
      </Card>
    </div>
  );
}

function BuildingState() {
  return (
    <div className="quiz-build">
      <div className="build-orb">
        <Sparkles size={30} />
      </div>
      <h2>Building your plan…</h2>
      <p>Matching exercises to your goal, schedule and limits. Your local AI may take up to a minute.</p>
      <div className="build-steps">
        {BUILD_STEPS.map((s) => (
          <div key={s} className="build-step">
            <Check size={14} /> {s}
          </div>
        ))}
      </div>
    </div>
  );
}
