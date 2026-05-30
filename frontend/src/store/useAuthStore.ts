import { create } from "zustand";
import type { User, Stats } from "../types";
import { auth, tokenStore } from "../lib/api";

interface AuthState {
  user: User | null;
  stats: Stats | null;
  loading: boolean;
  initialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (body: {
    username: string;
    email: string;
    password: string;
    display_name?: string;
  }) => Promise<void>;
  loadMe: () => Promise<void>;
  setStats: (stats: Partial<Stats>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  stats: null,
  loading: false,
  initialized: false,

  login: async (username, password) => {
    set({ loading: true });
    try {
      const { access_token } = await auth.login({ username, password });
      tokenStore.set(access_token);
      await get().loadMe();
    } finally {
      set({ loading: false });
    }
  },

  register: async (body) => {
    set({ loading: true });
    try {
      const { access_token } = await auth.register(body);
      tokenStore.set(access_token);
      await get().loadMe();
    } finally {
      set({ loading: false });
    }
  },

  loadMe: async () => {
    if (!tokenStore.get()) {
      set({ initialized: true });
      return;
    }
    try {
      const me = await auth.me();
      set({ user: me.user, stats: me.stats, initialized: true });
    } catch {
      tokenStore.clear();
      set({ user: null, stats: null, initialized: true });
    }
  },

  setStats: (partial) =>
    set((s) => ({ stats: s.stats ? { ...s.stats, ...partial } : s.stats })),

  logout: () => {
    tokenStore.clear();
    set({ user: null, stats: null });
  },
}));
