import { useEffect, useRef, useState } from "react";
import { ChevronDown, Crown, ExternalLink, Plus, UserRound, UserX } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

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
        {empty ? (
          <p className={styles.name}>{label}</p>
        ) : (
          <div className={styles.playerMenu} ref={menuRef}>
            <button
              type="button"
              className={styles.nameButton}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span>{label}</span>
              <ChevronDown size={13} aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div className={styles.playerMenuPopover} role="menu">
                <a
                  href={`/profile/${encodeURIComponent(player.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserRound size={16} aria-hidden="true" />
                  <span>{t("viewPlayerProfile")}</span>
                  <ExternalLink size={13} className={styles.externalIcon} aria-hidden="true" />
                </a>
                {onKick && !player.isYou ? (
                  <button
                    type="button"
                    className={styles.menuKick}
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onKick(player.id);
                    }}
                  >
                    <UserX size={16} aria-hidden="true" />
                    <span>{t("kick")}</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
        {statusText ? (
          <p className={styles.status} data-ready={player.state === "ready"}>
            {statusText}
          </p>
        ) : null}
      </div>
    </div>
  );
}
