import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  ListChecks,
  Apple,
  ShieldCheck,
  LogOut,
  Zap,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { cn } from "../../lib/utils";

const nav = [
  { to: "/today", label: "Today", icon: LayoutDashboard },
  { to: "/habits", label: "Habits", icon: ListChecks },
  { to: "/workout", label: "Workout", icon: Dumbbell },
  { to: "/nutrition", label: "Nutrition", icon: Apple },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const initials = (user?.display_name || user?.username || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Zap size={18} fill="#fff" strokeWidth={0} />
        </div>
        <div>
          <div className="brand-name">FitTrack</div>
          <div className="brand-sub">Train · Build · Fuel</div>
        </div>
      </div>

      <nav className="nav">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn("nav-item focus-ring", isActive && "active")}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}

        {user?.role === "admin" && (
          <>
            <div className="nav-group-label">Supervision</div>
            <NavLink
              to="/admin"
              className={({ isActive }) => cn("nav-item focus-ring", isActive && "active")}
            >
              <ShieldCheck size={19} />
              <span>Coach Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-foot">
        <div className="mini-user">
          <div className="avatar">{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="mini-name">{user?.display_name || user?.username}</div>
            <div className="mini-lvl">{user?.role}</div>
          </div>
          <button onClick={logout} title="Sign out" className="icon-btn focus-ring">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
