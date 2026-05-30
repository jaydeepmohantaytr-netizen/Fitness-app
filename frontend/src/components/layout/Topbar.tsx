import { useLocation } from "react-router-dom";
import { Flame } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { Bar } from "../ui/primitives";

const PAGE_META: Record<string, { title: string; sub: string }> = {
  "/today": { title: "Today", sub: "Your day at a glance" },
  "/habits": { title: "Habits", sub: "Build streaks, earn EXP" },
  "/workout": { title: "Workout", sub: "Your personalised home plan" },
  "/nutrition": { title: "Nutrition", sub: "Log food in plain language" },
  "/admin": { title: "Coach Panel", sub: "Supervise & support your members" },
};

const STREAK_BONUS_DAYS = 7;

export function Topbar() {
  const { pathname } = useLocation();
  const stats = useAuthStore((s) => s.stats);
  const meta = PAGE_META[pathname] ?? { title: "FitTrack", sub: "" };

  return (
    <header className="topbar">
      <div>
        <h1 className="page-title">{meta.title}</h1>
        {meta.sub && <p className="page-sub">{meta.sub}</p>}
      </div>

      {stats && (
        <div className="topbar-right">
          <div className="streak-chip" title="Daily streak">
            <Flame
              size={16}
              fill={stats.current_streak > 0 ? "var(--c-orange)" : "none"}
              style={{ color: "var(--c-orange)" }}
            />
            <span>{stats.current_streak}</span>
            {stats.current_streak >= STREAK_BONUS_DAYS && <span className="x2">×2</span>}
          </div>
          <div className="xp-chip" title="Experience">
            <div className="xp-chip-top">
              <span className="lvl-badge">LVL {stats.level}</span>
              <span className="xp-num">
                {stats.exp_into_level}/{stats.exp_for_next_level}
              </span>
            </div>
            <Bar
              value={stats.exp_into_level}
              max={stats.exp_for_next_level}
              color="var(--c-amber)"
              h={5}
            />
          </div>
        </div>
      )}
    </header>
  );
}
