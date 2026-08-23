import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocale, useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import { useThemeStore, type ThemeMode } from "@/shared/theme";
import styles from "./GameSettingsPanel.module.css";

interface GameplayFlags {
  music: number;
  effects: number;
  cardAnimations: boolean;
  haptics: boolean;
  confirmActions: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

interface GameSettingsPanelProps {
  open: boolean;
  sheet: boolean;
  gameplay: GameplayFlags;
  onGameplay: (next: GameplayFlags) => void;
  onClose: () => void;
  onLeave: () => void;
}

const APPEARANCE: Array<{ id: ThemeMode; nameEn: string; nameVi: string }> = [
  { id: "system", nameEn: "System", nameVi: "Theo hệ thống" },
  { id: "dark", nameEn: "Midnight", nameVi: "Đêm tối" },
  { id: "light", nameEn: "Daybreak", nameVi: "Ban ngày" },
];

export function GameSettingsPanel({
  open,
  sheet,
  gameplay,
  onGameplay,
  onClose,
  onLeave,
}: GameSettingsPanelProps) {
  const t = useT();
  const locale = useLocale();
  const vi = locale === "vi";
  const mode = useThemeStore((state) => state.mode);
  const setTheme = useThemeStore((state) => state.setTheme);
  const sessionName = useSessionStore((state) => state.session?.displayName ?? "");
  const rename = useSessionStore((state) => state.rename);
  const [displayName, setDisplayName] = useState(sessionName);

  useEffect(() => {
    setDisplayName(sessionName);
  }, [sessionName]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const patch = (partial: Partial<GameplayFlags>) => onGameplay({ ...gameplay, ...partial });

  return (
    <div className={styles.layer}>
      <button type="button" className={styles.backdrop} aria-label={vi ? "Đóng cài đặt" : "Close settings"} onClick={onClose} />
      <aside
        className={`${styles.panel} theme-panel ${sheet ? styles.sheet : styles.drawer}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-settings-title"
      >
        <header className={styles.head}>
          <h2 id="game-settings-title">{vi ? "Cài đặt ván chơi" : "Game settings"}</h2>
          <button type="button" className={styles.icon} onClick={onClose} aria-label={vi ? "Đóng" : "Close"}>
            <X size={18} />
          </button>
        </header>

        <section>
          <h3>{t("guestName")}</h3>
          <form
            className={styles.nameForm}
            onSubmit={(event) => {
              event.preventDefault();
              const next = displayName.trim().slice(0, 32);
              if (next) {
                void rename(next);
              }
            }}
          >
            <input
              value={displayName}
              maxLength={32}
              autoComplete="nickname"
              aria-label={t("guestName")}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            <button type="submit">{t("save")}</button>
          </form>
        </section>

        <section>
          <h3>{vi ? "Giao diện" : "Appearance"}</h3>
          <div className={styles.radios} role="radiogroup" aria-label="Theme">
            {APPEARANCE.map((option) => (
              <label key={option.id} className={styles.radio}>
                <input
                  type="radio"
                  name="game-appearance"
                  checked={mode === option.id}
                  onChange={() => setTheme(option.id)}
                />
                {vi ? option.nameVi : option.nameEn}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3>{vi ? "Âm thanh" : "Sound"}</h3>
          <label className={styles.slider}>
            <span>{vi ? "Nhạc nền" : "Music"}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={gameplay.music}
              onChange={(event) => patch({ music: Number(event.target.value) })}
            />
          </label>
          <label className={styles.slider}>
            <span>{vi ? "Hiệu ứng" : "Effects"}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={gameplay.effects}
              onChange={(event) => patch({ effects: Number(event.target.value) })}
            />
          </label>
        </section>

        <section>
          <h3>{vi ? "Lối chơi" : "Gameplay"}</h3>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={gameplay.cardAnimations}
              onChange={() => patch({ cardAnimations: !gameplay.cardAnimations })}
            />
            {vi ? "Hoạt ảnh thẻ bài" : "Card animations"}
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={gameplay.haptics}
              onChange={() => patch({ haptics: !gameplay.haptics })}
            />
            {vi ? "Rung phản hồi" : "Haptic feedback"}
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={gameplay.confirmActions}
              onChange={() => patch({ confirmActions: !gameplay.confirmActions })}
            />
            {vi ? "Xác nhận thao tác" : "Confirm actions"}
          </label>
        </section>

        <section>
          <h3>{vi ? "Trợ năng" : "Accessibility"}</h3>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={gameplay.reducedMotion}
              onChange={() => patch({ reducedMotion: !gameplay.reducedMotion })}
            />
            {vi ? "Giảm chuyển động" : "Reduced motion"}
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={gameplay.highContrast}
              onChange={() => patch({ highContrast: !gameplay.highContrast })}
            />
            {vi ? "Độ tương phản cao" : "High contrast"}
          </label>
        </section>

        <button type="button" className={styles.leave} onClick={onLeave}>
          {vi ? "Rời bàn" : "Leave game"}
        </button>
      </aside>
    </div>
  );
}
