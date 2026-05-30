import { useState } from "react";
import { motion } from "framer-motion";
import { ListChecks, Clock, Grid3x3 } from "lucide-react";
import { TodoList } from "../features/habit/TodoList";
import { DailyPlanner } from "../features/habit/DailyPlanner";
import { WeeklyPlanner } from "../features/habit/WeeklyPlanner";
import { Card } from "../components/ui/primitives";
import { cn } from "../lib/utils";

type Tab = "todo" | "daily" | "weekly";

const TABS: { id: Tab; label: string; icon: typeof ListChecks }[] = [
  { id: "todo", label: "To-do & EXP", icon: ListChecks },
  { id: "daily", label: "Daily planner", icon: Clock },
  { id: "weekly", label: "Weekly planner", icon: Grid3x3 },
];

export function HabitTracker() {
  const [tab, setTab] = useState<Tab>("todo");

  return (
    <div>
      <div className="seg">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={cn("seg-btn focus-ring", tab === id && "on")}
            onClick={() => setTab(id)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <Card style={{ marginTop: 18, padding: 20 }}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {tab === "todo" && <TodoList />}
          {tab === "daily" && <DailyPlanner />}
          {tab === "weekly" && <WeeklyPlanner />}
        </motion.div>
      </Card>
    </div>
  );
}
