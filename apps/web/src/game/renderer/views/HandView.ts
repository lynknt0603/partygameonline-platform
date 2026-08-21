import type { CardView } from "./CardView";
import type { Rect } from "../layout/CardTableLayout";

export function assignFanRest(cards: CardView[], area: Rect, cardWidth: number): void {
  const count = cards.length;
  if (count === 0) {
    return;
  }

  const step = Math.min((area.width - 48) / Math.max(count - 1, 1), cardWidth * 0.7);
  const spread = step * (count - 1);
  const startX = area.x + (area.width - spread) / 2;
  const baseY = area.y + area.height / 2;

  cards.forEach((card, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1);
    card.handIndex = index;
    card.restX = startX + t * spread;
    card.restY = baseY;
    card.restRotation = (t - 0.5) * 0.12;
    card.zIndex = card.selected ? 50 : index;
  });
}

export function layoutFan(cards: CardView[], area: Rect, cardWidth: number): void {
  assignFanRest(cards, area, cardWidth);
  cards.forEach((card) => {
    card.position.set(card.restX, card.restY - (card.selected ? 18 : 0));
    card.rotation = card.restRotation;
  });
}
