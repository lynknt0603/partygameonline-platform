import { useState } from "react";
import { getNobCardArt, getNobCardBack, getNobCardText } from "../assets/nobArt";
import { useLocale } from "@/shared/i18n/useT";
import styles from "./NobCard.module.css";

interface NobCardProps {
  cardCode?: string | null;
  face?: "up" | "down";
  selected?: boolean;
  playable?: boolean;
  dimmed?: boolean;
  revealed?: boolean;
  compact?: boolean;
  peeked?: boolean;
  onClick?: () => void;
}

export function NobCard({
  cardCode,
  face = "up",
  selected = false,
  playable = false,
  dimmed = false,
  revealed = false,
  compact = false,
  peeked = false,
  onClick,
}: NobCardProps) {
  const locale = useLocale();
  const [backBroken, setBackBroken] = useState(false);
  const art = cardCode && face === "up" ? getNobCardArt(cardCode) : null;
  const back = face === "down" && !backBroken ? getNobCardBack() : null;
  const text = cardCode ? getNobCardText(cardCode, locale) : null;
  const label = text?.name ?? cardCode ?? "Hidden card";
  const tooltip = text?.tooltip ?? "";
  const inspectable = Boolean(onClick);

  return (
    <button
      type="button"
      className={`${styles.card} ${selected ? styles.selected : ""} ${playable ? styles.playable : ""} ${dimmed ? styles.dimmed : ""} ${peeked ? styles.peeked : ""} ${revealed ? styles.revealed : ""} ${compact ? styles.compact : ""}`}
      disabled={!inspectable}
      onClick={onClick}
      title={face === "up" ? tooltip || label : label}
      aria-label={face === "down" ? "Card back" : tooltip ? `${label}. ${tooltip}` : label}
    >
      {face === "down" && back ? (
        <img className={styles.art} src={back} alt="" draggable={false} onError={() => setBackBroken(true)} />
      ) : face === "down" || !art ? (
        <span className={styles.back} aria-hidden="true">
          {art ? null : cardCode ? "Missing artwork" : "NOB"}
        </span>
      ) : (
        <img className={styles.art} src={art} alt="" draggable={false} />
      )}
      {face === "up" && tooltip && !compact ? <span className={styles.caption}>{tooltip}</span> : null}
    </button>
  );
}
