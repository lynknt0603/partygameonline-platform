import { useEffect, useRef, useState } from "react";
import { Bot, Brain, ChevronDown, Crown, ExternalLink, Loader2, Plus, UserRound, UserX } from "lucide-react";
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
  onAddBot?: (botType: "NORMAL" | "AI") => void;
  isAddingBot?: boolean;
}

export function PlayerSeat({ player, position = "bottom", compact = false, onKick, onAddBot, isAddingBot = false }: PlayerSeatProps) {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [botMenuOpen, setBotMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const botMenuRef = useRef<HTMLDivElement>(null);
  const empty = player.state === "empty";
  const isAi = player.id.startsWith("bot-ai-") || player.name.includes("🧠") || player.name.toLowerCase().includes("ai");
  const isBot = player.id.startsWith("bot-") || player.name.startsWith("🤖") || isAi;
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

  useEffect(() => {
    if (!botMenuOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!botMenuRef.current?.contains(event.target as Node)) {
        setBotMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBotMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [botMenuOpen]);

  if (empty && onAddBot) {
    return (
      <div
        className={`${styles.seat} ${compact ? styles.row : ""}`}
        data-state="empty"
        data-position={position}
        ref={botMenuRef}
      >
        <div className={styles.addBotWrap}>
          <button
            type="button"
            className={`${styles.addBotButton} ${compact ? styles.rowButton : ""}`}
            onClick={() => setBotMenuOpen((prev) => !prev)}
            disabled={isAddingBot}
            title="Nhấn vào đây để chọn loại Bot chơi"
            aria-label="Chọn loại Bot chơi vào ghế trống"
            aria-expanded={botMenuOpen}
          >
            <div className={styles.avatarWrap}>
              <div className={styles.avatar} data-empty="true" data-addable="true">
                {isAddingBot ? <Loader2 size={22} className={styles.spinner} /> : <Plus size={22} />}
              </div>
            </div>
            <div className={styles.meta}>
              <p className={styles.name}>{isAddingBot ? "Đang thêm..." : "+ Thêm Bot"}</p>
              <span className={styles.botHint}>Ghế trống</span>
            </div>
          </button>

          {botMenuOpen && (
            <div
              className={styles.addBotPopover}
              role="menu"
              aria-label="Tùy chọn loại Bot"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.botOption}
                onClick={(e) => {
                  e.stopPropagation();
                  setBotMenuOpen(false);
                  onAddBot("NORMAL");
                }}
              >
                <div className={styles.botOptionIcon}>
                  <Bot size={18} />
                </div>
                <div className={styles.botOptionText}>
                  <span className={styles.botOptionTitle}>🤖 Bot Thường (Quy tắc)</span>
                  <span className={styles.botOptionDesc}>Tính toán chuẩn theo luật, nhanh gọn</span>
                </div>
              </button>
              <button
                type="button"
                className={`${styles.botOption} ${styles.aiOption}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setBotMenuOpen(false);
                  onAddBot("AI");
                }}
              >
                <div className={styles.botOptionIcon}>
                  <Brain size={18} />
                </div>
                <div className={styles.botOptionText}>
                  <span className={styles.botOptionTitle}>🧠 Bot AI (Chiến thuật cao)</span>
                  <span className={styles.botOptionDesc}>Phân tích liên minh, nhận diện bảo kê</span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
              {isAi ? (
                <span className={styles.aiBadge}>AI</span>
              ) : isBot ? (
                <span className={styles.botBadge}>BOT</span>
              ) : null}
              <ChevronDown size={13} aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div className={styles.playerMenuPopover} role="menu">
                {!isBot && (
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
                )}
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
                    <span>{isAi ? "Hủy Bot AI (Mở lại ghế)" : isBot ? "Hủy Bot (Mở lại ghế)" : t("kick")}</span>
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
