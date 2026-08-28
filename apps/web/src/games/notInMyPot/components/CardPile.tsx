import type { CSSProperties } from "react";
import styles from "../pages/NotInMyPotPlayPage.module.css";

interface CardPileProps {
  count: number;
  label: string;
  emptyLabel: string;
  cardBack: string;
  className?: string;
  maxVisualCards?: number;
  cardLabel?: string;
}

export function CardPile({
  count,
  label,
  emptyLabel,
  cardBack,
  className = "",
  maxVisualCards = 4,
  cardLabel = "cards",
}: CardPileProps) {
  const safeCount = Math.max(0, Math.floor(count));
  const visualCount = safeCount === 0 ? 0 : Math.min(safeCount, maxVisualCards);
  const pileClassName = [styles.cardPile, className].filter(Boolean).join(" ");

  return (
    <section className={pileClassName} aria-label={`${label}: ${safeCount}`}>
      <div className={styles.pileHeading}>
        <span>{label}</span>
        <strong>{safeCount}</strong>
      </div>
      <div className={`${styles.pileStage} ${safeCount === 0 ? styles.pileStageEmpty : ""}`} data-count={safeCount}>
        {visualCount > 0 ? (
          Array.from({ length: visualCount }, (_, index) => (
            <img
              key={`${label}-${index}`}
              className={styles.pileCardBack}
              src={cardBack}
              alt=""
              aria-hidden="true"
              style={{ "--pile-index": index } as CSSProperties}
            />
          ))
        ) : (
          <div className={styles.emptyPileSlot}>
            <span>{emptyLabel}</span>
          </div>
        )}
        {safeCount > 3 ? <span className={styles.pileCountBadge}>{safeCount}</span> : null}
      </div>
      <span className={styles.pileHint}>{safeCount === 0 ? emptyLabel : `${safeCount} ${cardLabel}`}</span>
    </section>
  );
}
