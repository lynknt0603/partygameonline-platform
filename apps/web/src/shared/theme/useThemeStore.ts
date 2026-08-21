import { create } from "zustand";
import { getStoredTheme, resolveTheme, setStoredTheme } from "./theme.storage";
import type { ThemeMode, ThemeState } from "./theme.types";

const initialMode: ThemeMode = getStoredTheme() ?? "system";

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  resolvedTheme: resolveTheme(initialMode),

  setTheme: (mode) => {
    setStoredTheme(mode);
    set({ mode, resolvedTheme: resolveTheme(mode) });
  },

  toggleTheme: () => {
    const next: ThemeMode = get().resolvedTheme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },

  syncSystemTheme: () => {
    if (get().mode !== "system") {
      return;
    }
    set({ resolvedTheme: resolveTheme("system") });
  },
}));
