import axios from "axios";
import type {
  MeResponse,
  Todo,
  ToggleResult,
  DailyItem,
  WeeklyItem,
  AdminUserRow,
  Priority,
  WorkoutPlan,
  QuizPayload,
  WorkoutToggleResult,
  ParseResponse,
  FoodItem,
  DayResponse,
  NutritionGoals,
  NutritionSaveResult,
} from "../types";

const TOKEN_KEY = "fittrack_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ----- Auth ---------------------------------------------------------------
export const auth = {
  register: (body: {
    username: string;
    email: string;
    password: string;
    display_name?: string;
  }) => api.post<{ access_token: string }>("/auth/register", body).then((r) => r.data),
  login: (body: { username: string; password: string }) =>
    api.post<{ access_token: string }>("/auth/login", body).then((r) => r.data),
  me: () => api.get<MeResponse>("/auth/me").then((r) => r.data),
};

// ----- Todos --------------------------------------------------------------
export const todos = {
  list: () => api.get<Todo[]>("/todos").then((r) => r.data),
  create: (body: {
    title: string;
    notes?: string;
    priority?: Priority;
    due_date?: string | null;
  }) => api.post<Todo>("/todos", body).then((r) => r.data),
  update: (id: number, body: Partial<Pick<Todo, "title" | "notes" | "priority" | "due_date">>) =>
    api.patch<Todo>(`/todos/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/todos/${id}`),
  toggle: (id: number) => api.post<ToggleResult>(`/todos/${id}/toggle`).then((r) => r.data),
};

// ----- Planner ------------------------------------------------------------
export const planner = {
  listDaily: (day: string) =>
    api.get<DailyItem[]>("/planner/daily", { params: { day } }).then((r) => r.data),
  createDaily: (body: {
    day: string;
    title: string;
    start_time?: string | null;
    end_time?: string | null;
    notes?: string;
  }) => api.post<DailyItem>("/planner/daily", body).then((r) => r.data),
  updateDaily: (id: number, body: Partial<DailyItem>) =>
    api.patch<DailyItem>(`/planner/daily/${id}`, body).then((r) => r.data),
  removeDaily: (id: number) => api.delete(`/planner/daily/${id}`),

  listWeekly: (week_start: string) =>
    api.get<WeeklyItem[]>("/planner/weekly", { params: { week_start } }).then((r) => r.data),
  createWeekly: (body: {
    week_start: string;
    day_of_week: number;
    title: string;
    notes?: string;
  }) => api.post<WeeklyItem>("/planner/weekly", body).then((r) => r.data),
  updateWeekly: (id: number, body: Partial<WeeklyItem>) =>
    api.patch<WeeklyItem>(`/planner/weekly/${id}`, body).then((r) => r.data),
  removeWeekly: (id: number) => api.delete(`/planner/weekly/${id}`),
};

// ----- Workout ------------------------------------------------------------
export const workout = {
  status: () =>
    api.get<{ ollama_available: boolean; model: string }>("/workout/status").then((r) => r.data),
  getPlan: () => api.get<WorkoutPlan | null>("/workout/plan").then((r) => r.data),
  generate: (body: QuizPayload) =>
    api.post<WorkoutPlan>("/workout/generate", body).then((r) => r.data),
  deletePlan: () => api.delete("/workout/plan"),
  toggleDay: (dayId: number) =>
    api.post<WorkoutToggleResult>(`/workout/days/${dayId}/toggle`).then((r) => r.data),
};

// ----- Nutrition ----------------------------------------------------------
export const nutrition = {
  status: () =>
    api.get<{ ollama_available: boolean; model: string }>("/nutrition/status").then((r) => r.data),
  parse: (text: string) =>
    api.post<ParseResponse>("/nutrition/parse", { text }).then((r) => r.data),
  addEntries: (body: { log_date: string; source_text: string; items: FoodItem[] }) =>
    api.post<NutritionSaveResult>("/nutrition/entries", body).then((r) => r.data),
  day: (log_date: string) =>
    api.get<DayResponse>("/nutrition/day", { params: { log_date } }).then((r) => r.data),
  removeEntry: (id: number) => api.delete(`/nutrition/entries/${id}`),
  getGoals: () => api.get<NutritionGoals>("/nutrition/goals").then((r) => r.data),
  updateGoals: (body: NutritionGoals) =>
    api.put<NutritionGoals>("/nutrition/goals", body).then((r) => r.data),
};

// ----- Admin --------------------------------------------------------------
export const admin = {
  users: () => api.get<AdminUserRow[]>("/admin/users").then((r) => r.data),
  userTodos: (id: number) =>
    api.get<Todo[]>(`/admin/users/${id}/todos`).then((r) => r.data),
  assignSupervisor: (id: number, supervisor_id: number | null) =>
    api.put<AdminUserRow>(`/admin/users/${id}/supervisor`, { supervisor_id }).then((r) => r.data),
};
