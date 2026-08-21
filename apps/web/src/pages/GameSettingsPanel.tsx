import { useEffect } from "react";
import { X } from "lucide-react";
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

const APPEARANCE: Array<{ id: ThemeMode; name: string }> = [
  { id: "system", name: "System" },
  { id: "dark", name: "Midnight" },
  { id: "light", name: "Daybreak" },
];

export function GameSettingsPanel({
  open,
  sheet,
  gameplay,
  onGameplay,
  onClose,
  onLeave,
}: GameSettingsPanelProps) {
  const mode = useThemeStore((state) => state.mode);
  const setTheme = useThemeStore((state) => state.setTheme);

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
      <button type="button" className={styles.backdrop} aria-label="Close settings · Đóng" onClick={onClose} />
      <aside
        className={`${styles.panel} theme-panel ${sheet ? styles.sheet : styles.drawer}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-settings-title"
      >
        <header className={styles.head}>
          <h2 id="game-settings-title">Game settings</h2>
          <button type="button" className={styles.icon} onClick={onClose} aria-label="Close · Đóng">
            <X size={18} />
          </button>
        </header>

        <section>
          <h3>Appearance · Giao diện</h3>
          <div className={styles.radios} role="radiogroup" aria-label="Theme">
            {APPEARANCE.map((option) => (
              <label key={option.id} className={styles.radio}>
                <input
                  type="radio"
                  name="game-appearance"
                  checked={mode === option.id}
                  onChange={() => setTheme(option.id)}
                />
                {option.name}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3>Sound · Âm thanh</h3>
          <label className={styles.slider}>
            <span>Music</span>
            <input
              type="range"
              min={0}
              max={100}
              value={gameplay.music}
              onChange={(event) => patch({ music: Number(event.target.value) })}
            />
          </label>
          <label className={styles.slider}>
            <span>Effects</span>
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
          <h3>Gameplay</h3>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={gameplay.cardAnimations}
              onChange={() => patch({ cardAnimations: !gameplay.cardAnimations })}
            />
            Card animations
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={gameplay.haptics}
              onChange={() => patch({ haptics: !gameplay.haptics })}
            />
            Haptic feedback
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={gameplay.confirmActions}
              onChange={() => patch({ confirmActions: !gameplay.confirmActions })}
            />
            Confirm actions
          </label>
        </section>

        <section>
          <h3>Accessibility · Trợ năng</h3>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={gameplay.reducedMotion}
              onChange={() => patch({ reducedMotion: !gameplay.reducedMotion })}
            />
            Reduced motion
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={gameplay.highContrast}
              onChange={() => patch({ highContrast: !gameplay.highContrast })}
            />
            High contrast
          </label>
        </section>

        <button type="button" className={styles.leave} onClick={onLeave}>
          Leave game · Rời bàn
        </button>
      </aside>
    </div>
  );
}
