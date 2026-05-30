import { useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Dumbbell,
  HeartPulse,
  Gauge,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from "lucide-react";
import type { QuizPayload } from "../../types";
import { cn } from "../../lib/utils";

const GOALS = [
  { value: "lose fat", label: "Lose fat", desc: "Higher reps, more cardio", icon: Flame },
  { value: "build muscle", label: "Build muscle", desc: "Progressive strength", icon: Dumbbell },
  { value: "general fitness", label: "General fitness", desc: "Balanced full-body", icon: HeartPulse },
  { value: "improve endurance", label: "Endurance", desc: "Conditioning & stamina", icon: Gauge },
];

const LEVELS = [
  { value: "beginner", label: "Beginner", desc: "New or returning" },
  { value: "intermediate", label: "Intermediate", desc: "Train regularly" },
  { value: "advanced", label: "Advanced", desc: "Experienced lifter" },
];

const EQUIPMENT = ["dumbbells", "resistance bands", "pull-up bar", "kettlebell", "bench", "jump rope"];

const TOTAL_STEPS = 5;

export function WorkoutQuiz({
  onSubmit,
  submitting,
}: {
  onSubmit: (payload: QuizPayload) => void;
  submitting: boolean;
}) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [minutes, setMinutes] = useState(40);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [focus, setFocus] = useState("");
  const [limitations, setLimitations] = useState("");

  const canNext =
    (step === 0 && !!goal) || (step === 1 && !!experience) || step >= 2;

  function toggleEquip(item: string) {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }

  function next() {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else
      onSubmit({
        goal,
        experience,
        days_per_week: daysPerWeek,
        minutes_per_session: minutes,
        equipment,
        focus,
        limitations,
      });
  }

  return (
    <div className="quiz">
      <div className="quiz-head">
        <button
          className="link-btn"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || submitting}
          style={{ visibility: step === 0 ? "hidden" : "visible" }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span className="quiz-count">
          Question {step + 1} of {TOTAL_STEPS}
        </span>
      </div>
      <div className="quiz-progress">
        <div style={{ width: (step / (TOTAL_STEPS - 1)) * 100 + "%" }} />
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="quiz-body"
      >
        {step === 0 && (
          <>
            <h2 className="quiz-q">What's your main goal?</h2>
            <p className="quiz-sub">We'll shape the whole plan around this.</p>
            <div className="opt-grid opt-2">
              {GOALS.map(({ value, label, desc, icon: Icon }) => (
                <button key={value} className={cn("opt", goal === value && "sel")} onClick={() => setGoal(value)}>
                  <Icon size={20} style={{ color: goal === value ? "var(--c-accent)" : "var(--muted)", marginBottom: 8 }} />
                  <div className="opt-label">{label}</div>
                  <div className="opt-desc">{desc}</div>
                  {goal === value && (
                    <div className="opt-check">
                      <Check size={13} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="quiz-q">How experienced are you?</h2>
            <p className="quiz-sub">So we pick the right intensity.</p>
            <div className="opt-grid">
              {LEVELS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  className={cn("opt", experience === value && "sel")}
                  onClick={() => setExperience(value)}
                >
                  <div className="opt-label">{label}</div>
                  <div className="opt-desc">{desc}</div>
                  {experience === value && (
                    <div className="opt-check">
                      <Check size={13} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="quiz-q">How much time can you commit?</h2>
            <p className="quiz-sub">Be realistic — consistency beats intensity.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 34, marginTop: 12 }}>
              <Slider
                label="Days per week"
                value={daysPerWeek}
                min={2}
                max={6}
                suffix={daysPerWeek === 1 ? "day" : "days"}
                onChange={setDaysPerWeek}
              />
              <Slider
                label="Minutes per session"
                value={minutes}
                min={15}
                max={90}
                step={5}
                suffix="min"
                onChange={setMinutes}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="quiz-q">What equipment do you have?</h2>
            <p className="quiz-sub">Pick all that apply — leave empty for bodyweight only.</p>
            <div className="opt-grid opt-2">
              {EQUIPMENT.map((item) => {
                const on = equipment.includes(item);
                return (
                  <button key={item} className={cn("opt", on && "sel")} onClick={() => toggleEquip(item)} style={{ padding: 14 }}>
                    <div className="opt-label" style={{ textTransform: "capitalize", fontSize: 14 }}>
                      {item}
                    </div>
                    {on && (
                      <div className="opt-check">
                        <Check size={13} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {equipment.length === 0 && (
              <p className="quiz-sub" style={{ marginTop: 14, marginBottom: 0 }}>
                No equipment selected — we'll build a bodyweight plan.
              </p>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="quiz-q">Anything else we should know?</h2>
            <p className="quiz-sub">Optional — focus areas and injuries to work around.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
                  Focus areas
                </label>
                <input
                  className="field-input"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. core strength, upper body, glutes"
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
                  Injuries / limitations
                </label>
                <textarea
                  className="field-input"
                  rows={3}
                  style={{ resize: "none" }}
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  placeholder="e.g. bad knees — avoid jumping; sensitive lower back"
                />
              </div>
            </div>
          </>
        )}
      </motion.div>

      <div className="quiz-foot">
        <span className="quiz-count">
          Step {step + 1} of {TOTAL_STEPS}
        </span>
        <button className="btn btn-primary btn-lg" onClick={next} disabled={!canNext || submitting}>
          {step === TOTAL_STEPS - 1 ? (
            submitting ? (
              "Building…"
            ) : (
              <>
                <Sparkles size={16} /> Generate plan
              </>
            )
          ) : (
            <>
              Continue <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="scale-readout">
        <span className="scale-num">{value}</span>
        <span className="scale-unit">{suffix}</span>
      </div>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
        <span>{label}: {min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
