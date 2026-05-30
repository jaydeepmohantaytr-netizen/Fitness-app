import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import axios from "axios";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register({ username, email, password, display_name: displayName });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || "Something went wrong");
      } else {
        setError("Could not reach the server. Is the backend running?");
      }
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="card"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          width: "100%",
          maxWidth: 880,
          overflow: "hidden",
          borderRadius: 20,
        }}
      >
        {/* Brand panel */}
        <div
          className="auth-brand"
          style={{
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(160deg, var(--surface-2), var(--surface))",
            borderRight: "1px solid var(--border)",
            padding: 36,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -80,
              top: -80,
              width: 240,
              height: 240,
              borderRadius: 999,
              background: "radial-gradient(circle, color-mix(in oklab, var(--c-accent) 30%, transparent), transparent 70%)",
            }}
          />
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 11 }}>
            <div className="brand-mark">
              <Zap size={18} fill="#fff" strokeWidth={0} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18 }}>FitTrack</span>
          </div>
          <div style={{ position: "relative" }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15 }}>
              Train your body.
              <br />
              Build your habits.
              <br />
              Fuel it right.
            </h2>
            <p style={{ marginTop: 16, maxWidth: 300, fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>
              One focused command center for workouts, habits, and nutrition — with EXP, streaks,
              and levels to keep you moving.
            </p>
          </div>
          <div style={{ position: "relative", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Workout", "Habits", "Nutrition"].map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                  borderRadius: 999,
                  padding: "4px 11px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <div style={{ padding: 36 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ marginTop: 4, fontSize: 14, color: "var(--muted)" }}>
            {mode === "login" ? "Sign in to continue your streak." : "The first account becomes the admin/supervisor."}
          </p>

          <form onSubmit={submit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Username">
              <input
                className="field-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                autoComplete="username"
                required
              />
            </Field>

            {mode === "register" && (
              <>
                <Field label="Display name">
                  <input
                    className="field-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How should we greet you?"
                  />
                </Field>
                <Field label="Email">
                  <input
                    className="field-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </Field>
              </>
            )}

            <Field label="Password">
              <input
                className="field-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </Field>

            {error && (
              <p
                style={{
                  borderRadius: 10,
                  background: "color-mix(in oklab, var(--c-orange) 14%, transparent)",
                  color: "var(--c-orange)",
                  padding: "10px 12px",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
            {mode === "login" ? "New here?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              style={{ fontWeight: 700, color: "var(--c-accent)", background: "none", border: "none" }}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
