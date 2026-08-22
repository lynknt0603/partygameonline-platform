import { formatCountdown, useNobClock } from "../model/nobClock";
import styles from "./NobCountdown.module.css";

interface NobCountdownProps {
  remainingMs?: number | null;
  deadline?: string | null;
  serverTime?: string | null;
  reducedMotion?: boolean;
}

export function NobCountdown({
  remainingMs = null,
  deadline = null,
  serverTime = null,
  reducedMotion = false,
}: NobCountdownProps) {
  const { remainingMs: remainingFromDeadline } = useNobClock(serverTime, 250);
  const remain = deadline ? remainingFromDeadline(deadline) : remainingMs;
  if (remain == null) {
    return null;
  }
  const seconds = Math.max(0, Math.ceil(remain / 1000));
  const tone = seconds > 10 ? "normal" : seconds > 5 ? "warning" : "urgent";
  return (
    <span
      className={`${styles.timer} ${styles[tone]} ${reducedMotion ? styles.reduced : ""}`}
      data-tone={tone}
      aria-live="polite"
    >
      {formatCountdown(remain)}
    </span>
  );
}
