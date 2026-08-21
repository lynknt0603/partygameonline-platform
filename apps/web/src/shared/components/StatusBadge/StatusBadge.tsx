import { CircleCheck, Clock, Swords, Unplug } from "lucide-react";
import type { PlayerStatus } from "@/shared/types/status";
import { useT } from "@/shared/i18n/useT";
import styles from "./StatusBadge.module.css";

const ICONS = {
  ready: CircleCheck,
  waiting: Clock,
  in_game: Swords,
  disconnected: Unplug,
} as const;

const KEYS = {
  ready: "ready",
  waiting: "waiting",
  in_game: "inGame",
  disconnected: "disconnected",
} as const;

interface StatusBadgeProps {
  status: PlayerStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useT();
  const Icon = ICONS[status];
  const label = t(KEYS[status]);

  return (
    <span className={`${styles.badge} ${styles[status]}`} title={label}>
      <Icon size={14} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
