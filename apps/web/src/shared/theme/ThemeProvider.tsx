import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { applyThemeToDOM } from "./theme.dom";
import { useThemeStore } from "./useThemeStore";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  useLayoutEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      useThemeStore.getState().syncSystemTheme();
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return children;
}
