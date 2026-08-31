import type { CSSProperties } from "react";
import type { NotInMyPotEvent, NotInMyPotPlayer } from "../model/notInMyPotTypes";
import styles from "../pages/NotInMyPotPlayPage.module.css";

interface TableEventAnimationProps {
  event: NotInMyPotEvent | null;
  cardBack: string;
  locale: "vi" | "en";
  players: NotInMyPotPlayer[];
}

type MotionStyle = CSSProperties & Record<`--motion-${string}`, string>;

function eventCount(event: NotInMyPotEvent, field: string, fallback: number): number {
  const value = event.payload[field];
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(4, Math.floor(value)))
    : fallback;
}

function playerPoint(players: NotInMyPotPlayer[], playerId: unknown) {
  const index = typeof playerId === "string"
    ? players.findIndex((player) => player.playerId === playerId)
    : -1;
  if (index < 0) {
    return { x: "50%", y: "88%" };
  }
  const angle = players.length > 1 ? 90 + (index * 360) / players.length : 90;
  return {
    x: `${50 + Math.cos((angle * Math.PI) / 180) * 42}%`,
    y: `${50 + Math.sin((angle * Math.PI) / 180) * 38}%`,
  };
}

function betweenPoints(from: { x: string; y: string }, to: { x: string; y: string }): MotionStyle {
  return {
    "--motion-from-x": from.x,
    "--motion-from-y": from.y,
    "--motion-to-x": to.x,
    "--motion-to-y": to.y,
  };
}

function MovingBacks({ count, className, cardBack, style }: { count: number; className: string; cardBack: string; style?: MotionStyle }) {
  return (
    <div className={className} style={style} aria-hidden="true">
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

export function TableEventAnimation({ event, cardBack, locale, players }: TableEventAnimationProps) {
  if (!event) return null;

  const drawPile = { x: "30%", y: "44%" };

  if (event.type === "INGREDIENT_DECLARED") {
    const actor = playerPoint(players, event.payload.playerId);
    const pot = { x: "50%", y: "48%" };
    return <MovingBacks count={1} className={`${styles.eventCardMotion} ${styles.cardToPotMotion}`} cardBack={cardBack} style={betweenPoints(actor, pot)} />;
  }

  if (event.type === "SCOOP_OUT_RESOLVED") {
    const count = eventCount(event, "removedCount", 2);
    return count > 0 ? <MovingBacks count={count} className={`${styles.eventCardMotion} ${styles.potToDiscardMotion}`} cardBack={cardBack} /> : null;
  }

  if (event.type === "POT_REORDER_REQUIRED" || event.type === "SLOTTED_SPOON_INSPECTION_REQUIRED") {
    const count = eventCount(event, "cardCount", 3);
    return (
      <div className={styles.inspectionMotion}>
        <MovingBacks count={count} className={styles.inspectionCards} cardBack={cardBack} />
        <span>{locale === "vi" ? "Đang kiểm tra nguyên liệu…" : "Inspecting ingredients…"}</span>
      </div>
    );
  }

  if (event.type === "CARDS_DRAWN") {
    const count = eventCount(event, "drawnCount", 1);
    const target = playerPoint(players, event.payload.playerId);
    return count > 0 ? <MovingBacks count={count} className={`${styles.eventCardMotion} ${styles.drawToHandMotion}`} cardBack={cardBack} style={betweenPoints(drawPile, target)} /> : null;
  }

  if (event.type === "EMERGENCY_SHOPPING_RESOLVED") {
    const count = eventCount(event, "drawnCount", 3);
    const target = playerPoint(players, event.payload.playerId);
    return count > 0 ? <MovingBacks count={count} className={`${styles.eventCardMotion} ${styles.drawToHandMotion}`} cardBack={cardBack} style={betweenPoints(drawPile, target)} /> : null;
  }

  if (event.type === "SHOPPING_CARDS_RETURNED") {
    const count = eventCount(event, "returnedCount", 2);
    const actor = playerPoint(players, event.payload.playerId);
    return count > 0 ? <MovingBacks count={count} className={`${styles.eventCardMotion} ${styles.handToDrawMotion}`} cardBack={cardBack} style={betweenPoints(actor, drawPile)} /> : null;
  }

  if (event.type === "TRASH_OUT_RESOLVED") {
    const discarded = eventCount(event, "discardedCount", 3);
    const drawn = eventCount(event, "drawnCount", 3);
    const actor = playerPoint(players, event.payload.playerId);
    const target = playerPoint(players, event.payload.targetPlayerId);
    const discard = { x: "88%", y: "45%" };
    return (
      <>
        <MovingBacks count={1} className={`${styles.eventCardMotion} ${styles.actionToTargetMotion}`} cardBack={cardBack} style={betweenPoints(actor, target)} />
        {discarded > 0 ? <MovingBacks count={discarded} className={`${styles.eventCardMotion} ${styles.handToDiscardMotion} ${styles.trashHandToDiscardMotion}`} cardBack={cardBack} style={betweenPoints(target, discard)} /> : null}
        {drawn > 0 ? <MovingBacks count={drawn} className={`${styles.eventCardMotion} ${styles.drawReplacementMotion} ${styles.trashDrawReplacementMotion}`} cardBack={cardBack} style={betweenPoints(drawPile, target)} /> : null}
      </>
    );
  }

  if (event.type === "PLAYER_DOOR_UPDATED") {
    const actor = playerPoint(players, event.payload.actorPlayerId);
    const target = playerPoint(players, event.payload.playerId);
    return typeof event.payload.actorPlayerId === "string"
      ? <MovingBacks count={1} className={`${styles.eventCardMotion} ${styles.actionToTargetMotion}`} cardBack={cardBack} style={betweenPoints(actor, target)} />
      : null;
  }

  return null;
}
