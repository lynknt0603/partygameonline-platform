import { formatCountdown } from "../model/nobClock";
import styles from "./NobCountdown.module.css";

interface NobCountdownProps {
  remainingMs: number | null;
  reducedMotion?: boolean;
}

export function NobCountdown({ remainingMs, reducedMotion = false }: NobCountdownProps) {
  if (remainingMs == null) {
    return null;
  }
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const tone = seconds > 10 ? "normal" : seconds > 5 ? "warning" : "urgent";
  return (
    <span
      className={`${styles.timer} ${styles[tone]} ${reducedMotion ? styles.reduced : ""}`}
      data-tone={tone}
      aria-live="polite"
    >
      {formatCountdown(remainingMs)}
    </span>
  );
}
