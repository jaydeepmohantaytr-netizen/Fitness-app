# FitTrack — Workout · Habits · Nutrition

A local-first wellness command center with a **Today** dashboard and three sections
(Workout, Habit Tracker, Nutrition), a gamified EXP/level/streak system, and an admin
panel for supervising other users. The UI follows the dark, minimalist **"Cadence"**
design (Manrope + blue accent, gold EXP).

> **Status:** Phases 1–3 complete — scaffold, auth, the **Habit Tracker** (To-Do +
> EXP engine, Daily/Weekly Planner), a working **Coach/Admin Panel**, the **Workout**
> section (fitness quiz → AI-generated home plan via Ollama, completion earns EXP),
> and **Nutrition** (type what you ate → AI estimates calories + macros, tracked
> against daily goal rings). The whole app has been redesigned to the dark Cadence
> look with a new **Today** dashboard. Next: deeper admin (edit-on-behalf).

## Tech stack

| Layer    | Tech                                                            |
| -------- | -------------------------------------------------------------- |
| Frontend | React 18 · TypeScript · Vite · TailwindCSS · Zustand · Framer Motion |
| Backend  | FastAPI · SQLAlchemy 2 · SQLite (WAL) · JWT auth (PyJWT + bcrypt) |
| AI       | Ollama (local) — powers the Workout plan generator and Nutrition macro parser |

## Running it

Open **two** PowerShell terminals from this folder:

```powershell
# Terminal 1 — backend  (http://localhost:8000, API docs at /docs)
.\start-backend.ps1

# Terminal 2 — frontend (http://localhost:5173)
.\start-frontend.ps1
```

Then open **http://localhost:5173**.

> The **first account you register automatically becomes the admin/supervisor.**
> Create that account first, then register additional users to see them appear in
> the Admin Panel.

## The EXP / streak engine

- Completing a to-do awards EXP: `10 × priority weight × streak multiplier`
  (priority weights: low 0.8, medium 1.0, high 1.4).
- The first task each day advances your streak; skipping a day resets it.
- After a **7-day streak the multiplier doubles to 2×**, then keeps stepping up
  every 7 days (3×, 4×…) up to a cap. Tunable in `backend/app/core/config.py`.
- Levels follow a gentle quadratic curve (L2 = 100 EXP, L3 = 300, L4 = 600…).

## Project structure

```
backend/
  app/
    core/        config, database (SQLite WAL), security (JWT + bcrypt)
    models/      user, habit (todos + exp log), planner (daily/weekly)
    schemas/     pydantic request/response models
    services/    exp_engine.py  ← gamification logic
    api/routes/  auth, habits, planner, admin
    main.py
frontend/
  src/
    components/  ui primitives, layout (Sidebar), StatHeader, Toaster
    features/habit/  TodoList, DailyPlanner, WeeklyPlanner
    pages/       AuthPage, HabitTracker, ComingSoon (Workout/Nutrition), AdminPage
    store/       useAuthStore, useToast (Zustand)
    lib/         api.ts (axios), utils.ts (dates + cn)
```

## Roadmap

- [x] **Phase 1 — Foundation:** scaffold, design system, auth, Habit Tracker, Admin Panel
- [x] **Phase 2 — Workout:** fitness quiz → AI-generated home workout plan (Ollama), completion logging earns EXP
- [x] **Phase 3 — Nutrition:** natural-language food logging → AI macro tracking (Ollama, with offline fallback)
- [x] **Cadence redesign:** dark, minimalist whole-app restyle + new Today dashboard
- [ ] **Phase 4 — Admin deepening:** drill into a user's data, edit on their behalf, assign supervisors

### Workout section

Take a 5-step quiz (goal, experience, time, equipment, focus/injuries) and the
backend asks your local Ollama model for a structured plan (`format` = JSON
schema). If Ollama is offline, a rule-based bodyweight plan is returned instead.
Completing a workout day awards `25 × streak multiplier` EXP, once per day.
First AI generation can take ~60–90s; switch the model in `backend/.env`
(`OLLAMA_MODEL`) if you want a faster/slower one.

### Nutrition section

Type what you ate in plain language (e.g. "chicken burrito bowl with guac") and the
local Ollama model estimates each food's calories and macros (`POST /api/nutrition/parse`),
which are then logged for the day (`POST /api/nutrition/entries`). If Ollama is
offline a rough rule-based estimate is used instead. The day's totals are tracked
against your calorie goal ring plus protein/carbs/fat bars; the **first** entry each
day earns a small consistency EXP bonus. Daily goals are editable via
`PUT /api/nutrition/goals`.
