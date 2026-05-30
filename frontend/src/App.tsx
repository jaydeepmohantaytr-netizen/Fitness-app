import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthPage } from "./pages/AuthPage";
import { TodayPage } from "./pages/TodayPage";
import { HabitTracker } from "./pages/HabitTracker";
import { WorkoutPage } from "./pages/WorkoutPage";
import { NutritionPage } from "./pages/NutritionPage";
import { AdminPage } from "./pages/AdminPage";
import { Zap } from "lucide-react";

function FullScreenLoader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-primary text-white">
          <Zap size={24} strokeWidth={2.5} />
        </div>
        <p className="text-sm text-ink-faint">Loading FitTrack…</p>
      </div>
    </div>
  );
}

export default function App() {
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const loadMe = useAuthStore((s) => s.loadMe);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  if (!initialized) return <FullScreenLoader />;

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/habits" element={<HabitTracker />} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/nutrition" element={<NutritionPage />} />
        {user.role === "admin" && <Route path="/admin" element={<AdminPage />} />}
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Route>
    </Routes>
  );
}
