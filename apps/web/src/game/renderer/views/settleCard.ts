import type { CardView } from "./CardView";

const generation = new WeakMap<CardView, number>();

function bump(card: CardView): number {
  const next = (generation.get(card) ?? 0) + 1;
  generation.set(card, next);
  return next;
}

function applyRest(card: CardView, scale: number): void {
  card.position.set(card.restX, card.restY - (card.selected ? 18 : 0));
  card.rotation = card.restRotation;
  card.scale.set(scale);
  card.zIndex = card.selected ? 50 : card.handIndex;
}

export function cancelSettle(card: CardView): void {
  bump(card);
}

export function snapToRest(card: CardView, scale: number): void {
  bump(card);
  applyRest(card, scale);
}

export function settleToRest(card: CardView, scale: number, reduced: boolean): void {
  const token = bump(card);
  const endY = card.restY - (card.selected ? 18 : 0);
  if (reduced) {
    applyRest(card, scale);
    return;
  }

  const startX = card.position.x;
  const startY = card.position.y;
  const startR = card.rotation;
  const startS = card.scale.x;
  const t0 = performance.now();
  const duration = 180;

  const tick = (now: number) => {
    if (generation.get(card) !== token) {
      return;
    }
    const t = Math.min(1, (now - t0) / duration);
    const ease = 1 - (1 - t) * (1 - t);
    card.position.set(startX + (card.restX - startX) * ease, startY + (endY - startY) * ease);
    card.rotation = startR + (card.restRotation - startR) * ease;
    card.scale.set(startS + (scale - startS) * ease);
    if (t < 1) {
      requestAnimationFrame(tick);
      return;
    }
    applyRest(card, scale);
  };

  requestAnimationFrame(tick);
}
