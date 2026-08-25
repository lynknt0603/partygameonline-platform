import { Crown, Plus } from "lucide-react";
import type { LobbySeat } from "@/shared/lobby/roomView";
import { useT } from "@/shared/i18n/useT";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import styles from "./PlayerSeat.module.css";

export type SeatPosition = "top" | "left" | "right" | "bottom";

interface PlayerSeatProps {
  player: LobbySeat;
  position?: SeatPosition;
  compact?: boolean;
  onKick?: (id: string) => void;
}

export function PlayerSeat({ player, position = "bottom", compact = false, onKick }: PlayerSeatProps) {
  const t = useT();
  const empty = player.state === "empty";
  const label = empty ? t("openSeat") : player.isYou ? t("you") : player.name;
  const statusText =
    player.state === "ready"
      ? `✓ ${t("ready")}`
      : player.state === "waiting"
        ? `○ ${t("waiting")}`
        : player.state === "disconnected"
          ? `⚠ ${t("reconnecting")}`
          : "";

  return (
    <div
      className={`${styles.seat} ${compact ? styles.row : ""}`}
      data-state={player.state}
      data-position={position}
    >
      <div className={styles.avatarWrap}>
        {player.isHost && !empty ? (
          <span className={styles.crown} aria-hidden="true">
            <Crown size={14} />
          </span>
        ) : null}
        {empty ? (
          <div className={styles.avatar} data-empty={empty} data-you={player.isYou}>
            <Plus size={18} />
          </div>
        ) : (
          <PlayerAvatar
            playerId={player.id}
            displayName={player.name}
            avatarUrl={player.avatarUrl}
            size={56}
            className={`${styles.avatarImage} ${player.isYou ? styles.avatarYou : ""}`}
          />
        )}
      </div>
      <div className={styles.meta}>
        <p className={styles.name}>{label}</p>
        {statusText ? (
          <p className={styles.status} data-ready={player.state === "ready"}>
            {statusText}
          </p>
        ) : null}
      </div>
      {onKick && !empty && !player.isYou ? (
        <button type="button" className={styles.kick} onClick={() => onKick(player.id)}>
          {t("kick")}
        </button>
      ) : null}
    </div>
  );
}
