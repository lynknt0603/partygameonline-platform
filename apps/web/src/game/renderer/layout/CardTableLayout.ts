export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CardTableLayout {
  width: number;
  height: number;
  isMobile: boolean;
  cardWidth: number;
  cardHeight: number;
  opponentArea: Rect;
  opponentHand: Rect;
  playZone: Rect;
  deck: Rect;
  discard: Rect;
  localHand: Rect;
  innerBoard: Rect;
  turnLabel: { x: number; y: number };
}

export function isMobileTable(width: number, height: number): boolean {
  return width < 720 || height > width * 1.12;
}

export function centerRect(rect: Rect, width: number, height: number): { x: number; y: number } {
  return {
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
  };
}
