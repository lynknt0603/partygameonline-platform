import type { CSSProperties } from "react";
import type { NotInMyPotEvent } from "../model/notInMyPotTypes";
import styles from "../pages/NotInMyPotPlayPage.module.css";

interface TableEventAnimationProps {
  event: NotInMyPotEvent | null;
  cardBack: string;
  locale: "vi" | "en";
}

function eventCount(event: NotInMyPotEvent, field: string, fallback: number): number {
  const value = event.payload[field];
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(4, Math.floor(value)))
    : fallback;
}

function MovingBacks({ count, className, cardBack }: { count: number; className: string; cardBack: string }) {
  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <img
          key={index}
          src={cardBack}
          alt=""
          style={{ "--event-card-index": index } as CSSProperties}
        />
      ))}
    </div>
  );
}

export function TableEventAnimation({ event, cardBack, locale }: TableEventAnimationProps) {
  if (!event) return null;

  if (event.type === "SCOOP_OUT_RESOLVED") {
    const count = eventCount(event, "removedCount", 2);
    return count > 0 ? <MovingBacks count={count} className={`${styles.eventCardMotion} ${styles.potToDiscardMotion}`} cardBack={cardBack} /> : null;
  }

  if (event.type === "POT_REORDER_REQUIRED") {
    const count = eventCount(event, "cardCount", 3);
    return (
      <div className={styles.inspectionMotion}>
        <MovingBacks count={count} className={styles.inspectionCards} cardBack={cardBack} />
        <span>{locale === "vi" ? "Đang kiểm tra nguyên liệu…" : "Inspecting ingredients…"}</span>
      </div>
    );
  }

  if (event.type === "EMERGENCY_SHOPPING_RESOLVED") {
    const count = eventCount(event, "drawnCount", 3);
    return count > 0 ? <MovingBacks count={count} className={`${styles.eventCardMotion} ${styles.drawToHandMotion}`} cardBack={cardBack} /> : null;
  }

  if (event.type === "TRASH_OUT_RESOLVED") {
    const discarded = eventCount(event, "discardedCount", 3);
    const drawn = eventCount(event, "drawnCount", 3);
    return (
      <>
        {discarded > 0 ? <MovingBacks count={discarded} className={`${styles.eventCardMotion} ${styles.handToDiscardMotion}`} cardBack={cardBack} /> : null}
        {drawn > 0 ? <MovingBacks count={drawn} className={`${styles.eventCardMotion} ${styles.drawReplacementMotion}`} cardBack={cardBack} /> : null}
      </>
    );
  }

  if (event.type === "PLAYER_DOOR_UPDATED") {
    const doorCount = typeof event.payload.doorCount === "number" ? event.payload.doorCount : 1;
    return <div className={styles.doorMarkerMotion} aria-label={`${doorCount} / 3`}>🚪 <strong>{doorCount}/3</strong></div>;
  }

  return null;
}
