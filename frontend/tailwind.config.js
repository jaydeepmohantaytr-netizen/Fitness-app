/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mapped onto the Cadence dark design-system variables
        paper: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--text)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--muted)",
        line: "var(--border)",
        "line-strong": "var(--border-strong)",
        primary: "var(--c-accent)",
        "primary-hover": "var(--primary-hover)",
        "primary-soft": "var(--primary-soft)",
        amber: "var(--c-amber)",
        "amber-soft": "var(--amber-soft)",
        rose: "var(--c-orange)",
        "rose-soft": "var(--rose-soft)",
      },
      fontFamily: {
        display: ['"Manrope"', "system-ui", "sans-serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26,28,27,0.04), 0 4px 16px rgba(26,28,27,0.06)",
        lift: "0 8px 30px rgba(26,28,27,0.10)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease both",
        pop: "pop 0.3s ease both",
      },
    },
  },
  plugins: [],
};
