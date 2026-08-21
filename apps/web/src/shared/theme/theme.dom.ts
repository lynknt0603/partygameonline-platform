import type { ResolvedTheme } from "./theme.types";

const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: "#0B0D10",
  light: "#F5F7F3",
};

export function applyThemeToDOM(resolvedTheme: ResolvedTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = resolvedTheme;

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", THEME_COLORS[resolvedTheme]);
}
