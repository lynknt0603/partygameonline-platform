import { Monitor, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useLocale } from "@/shared/i18n/useT";
import { useThemeStore, type ThemeMode } from "@/shared/theme";
import styles from "./AppearanceSettings.module.css";

interface ThemeOption {
  id: ThemeMode;
  name: string;
  desc: string;
  icon: ReactNode;
  swatches: string[];
}

const OPTIONS: ThemeOption[] = [
  {
    id: "system",
    name: "System",
    desc: "Theo hệ điều hành — light hoặc dark tự đổi.",
    icon: <Monitor size={18} aria-hidden="true" />,
    swatches: ["#0B0D10", "#F5F7F3", "#C9A45C", "#3D9C8C"],
  },
  {
    id: "light",
    name: "Daybreak Table",
    desc: "Ngà ấm, thẻ trắng, teal và vàng champagne.",
    icon: <Sun size={18} aria-hidden="true" />,
    swatches: ["#F5F7F3", "#FFFFFF", "#3D9C8C", "#B88A3D"],
  },
  {
    id: "dark",
    name: "Midnight Table",
    desc: "Than chì, tĩnh, điện ảnh, điểm vàng cổ.",
    icon: <Moon size={18} aria-hidden="true" />,
    swatches: ["#0B0D10", "#14181D", "#C9A45C", "#F2EEE5"],
  },
];

export function AppearanceSettings() {
  const mode = useThemeStore((state) => state.mode);
  const setTheme = useThemeStore((state) => state.setTheme);
  const locale = useLocale();
  const options =
    locale === "vi"
      ? [
          { ...OPTIONS[0], desc: "Theo hệ điều hành." },
          { ...OPTIONS[1], desc: "Ngà ấm, teal và vàng champagne." },
          { ...OPTIONS[2], desc: "Than chì, điểm vàng cổ." },
        ]
      : [
          { ...OPTIONS[0], name: "System", desc: "Follow the OS." },
          { ...OPTIONS[1], desc: "Warm ivory, teal and champagne gold." },
          { ...OPTIONS[2], desc: "Charcoal, antique gold." },
        ];

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>{locale === "vi" ? "Giao diện" : "Appearance"}</legend>
      <p className={styles.hint}>
        {locale === "vi"
          ? "Theme nền tảng. Canvas game có thể giữ palette riêng."
          : "Platform theme. A game canvas may keep its own palette."}
      </p>

      <div className={styles.grid} role="radiogroup" aria-label="Platform theme">
        {options.map((option) => {
          const selected = mode === option.id;
          return (
            <label
              key={option.id}
              className={`${styles.card} theme-card ${selected ? styles.selected : ""}`}
            >
              <input
                className={styles.input}
                type="radio"
                name="platform-theme"
                value={option.id}
                checked={selected}
                onChange={() => setTheme(option.id)}
              />
              <div className={styles.header}>
                <span className={styles.icon}>{option.icon}</span>
                <span className={styles.name}>{option.name}</span>
                {selected ? (
                  <span className={styles.selectedMark} aria-hidden="true">
                    Selected
                  </span>
                ) : null}
              </div>
              <p className={styles.desc}>{option.desc}</p>
              <div className={styles.swatches} aria-hidden="true">
                {option.swatches.map((color) => (
                  <span key={color} className={styles.swatch} style={{ backgroundColor: color }} />
                ))}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
