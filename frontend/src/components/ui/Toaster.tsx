import { AnimatePresence, motion } from "framer-motion";
import { Zap, TrendingUp, Info, AlertCircle } from "lucide-react";
import { useToast } from "../../store/useToast";

const icons = {
  exp: Zap,
  level: TrendingUp,
  info: Info,
  error: AlertCircle,
};

const burstColor = {
  exp: "var(--c-amber)",
  level: "var(--c-accent)",
  info: "var(--muted)",
  error: "var(--c-orange)",
};

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column-reverse",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.tone];
          const color = burstColor[t.tone];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="xp-toast"
              style={{ pointerEvents: "auto" }}
            >
              <div
                className="xp-toast-burst"
                style={{
                  background: `color-mix(in oklab, ${color} 18%, transparent)`,
                  color,
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t.message}</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
