import { isRedSuit, type DemoCard } from "@/game/games/demo-card-game/demoCards";
import styles from "./HandDock.module.css";

interface HandDockProps {
  cards: DemoCard[];
  selectedId: string | null;
  onSelect: (card: DemoCard) => void;
  onPlay: (id: string) => void;
}

export function HandDock({ cards, selectedId, onSelect, onPlay }: HandDockProps) {
  return (
    <div className={styles.dock}>
      <p className={styles.you}>You</p>
      <div className={styles.scroller} role="list" aria-label="Your hand · Bài trên tay">
        {cards.map((card) => {
          const selected = card.id === selectedId;
          return (
            <button
              key={card.id}
              type="button"
              role="listitem"
              className={`${styles.card} ${selected ? styles.selected : ""}`}
              aria-pressed={selected}
              aria-label={`${card.name} · ${card.nameVi}`}
              onClick={() => onSelect(card)}
            >
              <span className={isRedSuit(card.suit) ? styles.red : styles.ink}>
                {card.rank}
                {card.suit}
              </span>
            </button>
          );
        })}
      </div>
      {selectedId ? (
        <button type="button" className={styles.play} onClick={() => onPlay(selectedId)}>
          Play · Đánh
        </button>
      ) : null}
    </div>
  );
}
