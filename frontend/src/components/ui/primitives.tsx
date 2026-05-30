import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  CSSProperties,
} from "react";
import { cn } from "../../lib/utils";

// ----- Button -------------------------------------------------------------
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover shadow-soft disabled:opacity-50",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-ink-faint hover:bg-surface-2",
  ghost: "text-ink-soft hover:text-ink hover:bg-surface-2",
  danger: "bg-rose-soft text-rose hover:bg-rose hover:text-white",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

// ----- Input --------------------------------------------------------------
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "focus-ring w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "focus-ring w-full resize-none rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// ----- Card ---------------------------------------------------------------
export function Card({
  className,
  children,
  style,
  onClick,
  hover,
}: {
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}) {
  return (
    <div
      className={cn("card", hover && "card-hover", className)}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ----- Badge --------------------------------------------------------------
export function Badge({
  children,
  className,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "primary" | "amber" | "rose";
}) {
  const tones = {
    neutral: "bg-surface-2 text-ink-soft border-line",
    primary: "bg-primary-soft text-primary border-primary/20",
    amber: "bg-amber-soft text-amber border-amber/20",
    rose: "bg-rose-soft text-rose border-rose/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// ----- Progress bar -------------------------------------------------------
export function ProgressBar({
  value,
  max,
  className,
  tone = "primary",
}: {
  value: number;
  max: number;
  className?: string;
  tone?: "primary" | "amber";
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-line", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          tone === "primary" ? "bg-primary" : "bg-amber"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ----- Circular progress ring (Cadence) -----------------------------------
export function Ring({
  value,
  max = 100,
  size = 88,
  sw = 9,
  color = "var(--c-accent)",
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  sw?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        {children}
      </div>
    </div>
  );
}

// ----- Pill / tag (Cadence) ------------------------------------------------
export function Pill({
  children,
  color = "var(--c-accent)",
  soft = true,
  className,
  style,
}: {
  children: ReactNode;
  color?: string;
  soft?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn("pill", className)}
      style={{
        color: soft ? color : "#fff",
        background: soft ? `color-mix(in oklab, ${color} 16%, transparent)` : color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

// ----- Stat block (Cadence) ------------------------------------------------
export function Stat({
  label,
  value,
  unit,
  color,
  icon,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  color?: string;
  icon?: ReactNode;
}) {
  return (
    <div>
      <div className="stat-label">
        {icon}
        {label}
      </div>
      <div className="stat-value" style={{ color: color || "var(--text)" }}>
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
}

// ----- Linear bar (Cadence-styled, accepts any color) ----------------------
export function Bar({
  value,
  max = 100,
  color = "var(--c-accent)",
  h = 8,
  track,
}: {
  value: number;
  max?: number;
  color?: string;
  h?: number;
  track?: string;
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className="bar-track" style={{ height: h, background: track || "var(--track)" }}>
      <div className="bar-fill" style={{ width: pct + "%", background: color }} />
    </div>
  );
}

// ----- Empty state --------------------------------------------------------
export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {icon && <div className="text-ink-faint">{icon}</div>}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {hint && <p className="max-w-xs text-sm text-ink-faint">{hint}</p>}
    </div>
  );
}
