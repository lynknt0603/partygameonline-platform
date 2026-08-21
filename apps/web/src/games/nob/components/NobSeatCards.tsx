import { X } from "lucide-react";
import { useLocale, useT } from "@/shared/i18n/useT";
import { nobCardName } from "../model/nobCardLabel";
import type { NobCardInstance } from "../model/nobTypes";
import { NobCard } from "./NobCard";
import styles from "./NobSeatCards.module.css";

export interface SeatCardBoard {
  playerId: string;
  displayName: string;
  revealed: NobCardInstance[];
  peeked: NobCardInstance[];
  hiddenCount: number;
  ownUnused: NobCardInstance[];
}

interface NobSeatCardsProps {
  board: SeatCardBoard;
  onOpen: () => void;
}

export function NobSeatCards({ board, onOpen }: NobSeatCardsProps) {
  const t = useT();
  const hiddenSlots =
    board.ownUnused.length > 0
      ? board.ownUnused.length
      : Math.max(0, board.hiddenCount - board.peeked.length);

  if (board.revealed.length === 0 && board.peeked.length === 0 && hiddenSlots === 0) {
    return null;
  }

  return (
    <div className={styles.rack} role="group" aria-label={t("playerCards")}>
      {board.revealed.map((card) => (
        <NobCard
          key={`up-${card.instanceId ?? card.cardCode}`}
          cardCode={card.cardCode}
          face="up"
          compact
          revealed
          onClick={onOpen}
        />
      ))}
      {board.peeked.map((card) => (
        <NobCard
          key={`peek-${card.instanceId ?? card.cardCode}`}
          cardCode={card.cardCode}
          face="up"
          compact
          peeked
          onClick={onOpen}
        />
      ))}
      {Array.from({ length: hiddenSlots }, (_, slot) => (
        <NobCard key={`down-${board.playerId}-${slot}`} face="down" compact onClick={onOpen} />
      ))}
    </div>
  );
}

interface NobSeatCardsZoomProps {
  board: SeatCardBoard | null;
  onClose: () => void;
}

export function NobSeatCardsZoom({ board, onClose }: NobSeatCardsZoomProps) {
  const t = useT();
  const locale = useLocale();
  if (!board) {
    return null;
  }
  const showOwn = board.ownUnused.length > 0;
  const hiddenSlots = showOwn ? 0 : Math.max(0, board.hiddenCount - board.peeked.length);
  const empty = board.revealed.length === 0 && board.peeked.length === 0 && hiddenSlots === 0 && !showOwn;

  return (
    <div className={styles.layer}>
      <button type="button" className={styles.backdrop} aria-label={t("closeCardDetail")} onClick={onClose} />
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="seat-cards-title">
        <header className={styles.head}>
          <h2 id="seat-cards-title">
            {board.displayName} · {t("playerCards")}
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t("closeCardDetail")}>
            <X size={18} />
          </button>
        </header>
        {empty ? (
          <p>{t("cardsHiddenEmpty")}</p>
        ) : (
          <div className={styles.zoomRow}>
            {board.revealed.map((card) => (
              <div key={`zoom-up-${card.instanceId ?? card.cardCode}`} className={styles.zoomItem}>
                <NobCard cardCode={card.cardCode} face="up" revealed onClick={() => undefined} />
                <span>{nobCardName(card.cardCode, locale)}</span>
              </div>
            ))}
            {board.peeked.map((card) => (
              <div key={`zoom-peek-${card.instanceId ?? card.cardCode}`} className={styles.zoomItem}>
                <NobCard cardCode={card.cardCode} face="up" peeked onClick={() => undefined} />
                <span>{nobCardName(card.cardCode, locale)}</span>
              </div>
            ))}
            {showOwn
              ? board.ownUnused.map((card) => (
                  <div key={`zoom-own-${card.instanceId ?? card.cardCode}`} className={styles.zoomItem}>
                    <NobCard cardCode={card.cardCode} face="up" onClick={() => undefined} />
                    <span>{nobCardName(card.cardCode, locale)}</span>
                  </div>
                ))
              : Array.from({ length: hiddenSlots }, (_, slot) => (
                  <NobCard key={`zoom-down-${slot}`} face="down" onClick={() => undefined} />
                ))}
          </div>
        )}
      </div>
    </div>
  );
}
