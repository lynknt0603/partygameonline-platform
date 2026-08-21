import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/shared/theme";
import styles from "./ThemeQuickToggle.module.css";

export function ThemeQuickToggle() {
  const mode = useThemeStore((state) => state.mode);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const nextName = resolvedTheme === "dark" ? "Daybreak Table" : "Midnight Table";
  const nextNameVi = resolvedTheme === "dark" ? "bàn ban ngày" : "bàn đêm";
  const modeLabel = mode === "system" ? "System" : mode === "light" ? "Daybreak" : "Midnight";
  const resolvedLabel = resolvedTheme === "dark" ? "Midnight Table" : "Daybreak Table";

  return (
    <button
      type="button"
      className={`${styles.button} theme-panel`}
      onClick={toggleTheme}
      aria-label={`Switch to ${nextName} · Chuyển sang ${nextNameVi}`}
      title={`Mode: ${modeLabel} · ${resolvedLabel}`}
    >
      {resolvedTheme === "light" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      {mode === "system" ? (
        <span className={styles.systemBadge} aria-hidden="true">
          <Monitor size={10} />
        </span>
      ) : null}
    </button>
  );
}
