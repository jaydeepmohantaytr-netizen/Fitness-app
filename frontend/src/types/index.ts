export type Role = "user" | "admin";
export type Priority = "low" | "medium" | "high";

export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  role: Role;
  supervisor_id: number | null;
}

export interface Stats {
  total_exp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  multiplier: number;
  exp_into_level: number;
  exp_for_next_level: number;
}

export interface MeResponse {
  user: User;
  stats: Stats;
}

export interface Todo {
  id: number;
  title: string;
  notes: string;
  priority: Priority;
  completed: boolean;
  completed_at: string | null;
  exp_awarded: number;
  due_date: string | null;
  created_at: string;
}

export interface ToggleResult {
  todo: Todo;
  exp_delta: number;
  total_exp: number;
  level: number;
  current_streak: number;
  multiplier: number;
  leveled_up: boolean;
}

export interface DailyItem {
  id: number;
  day: string;
  start_time: string | null;
  end_time: string | null;
  title: string;
  notes: string;
  completed: boolean;
}

export interface WeeklyItem {
  id: number;
  week_start: string;
  day_of_week: number;
  title: string;
  notes: string;
  completed: boolean;
}

export interface WorkoutExercise {
  id: number;
  order_index: number;
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string;
}

export interface WorkoutDay {
  id: number;
  order_index: number;
  name: string;
  focus: string;
  completed_today: boolean;
  exercises: WorkoutExercise[];
}

export interface WorkoutPlan {
  id: number;
  title: string;
  summary: string;
  goal: string;
  experience: string;
  days_per_week: number;
  minutes_per_session: number;
  equipment: string[];
  focus: string;
  created_at: string;
  source: string;
  days: WorkoutDay[];
}

export interface QuizPayload {
  goal: string;
  experience: string;
  days_per_week: number;
  minutes_per_session: number;
  equipment: string[];
  focus: string;
  limitations: string;
}

export interface WorkoutToggleResult {
  completed: boolean;
  exp_delta: number;
  total_exp: number;
  level: number;
  current_streak: number;
  multiplier: number;
  leveled_up: boolean;
}

// ----- Nutrition ----------------------------------------------------------
export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ParseResponse {
  items: FoodItem[];
  source: "ai" | "fallback";
}

export interface FoodEntry extends FoodItem {
  id: number;
  log_date: string;
  source_text: string;
}

export interface DayTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface NutritionGoals {
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
}

export interface DayResponse {
  log_date: string;
  entries: FoodEntry[];
  totals: DayTotals;
  goals: NutritionGoals;
}

export interface NutritionSaveResult {
  entries: FoodEntry[];
  totals: DayTotals;
  exp_delta: number;
  total_exp: number;
  level: number;
  current_streak: number;
  multiplier: number;
  leveled_up: boolean;
}

export interface AdminUserRow {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: Role;
  supervisor_id: number | null;
  created_at: string;
  stats: Stats;
  open_tasks: number;
  completed_tasks: number;
}
