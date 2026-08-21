import type { CardTableLayout } from "./CardTableLayout";

export function mobileCardTableLayout(width: number, height: number): CardTableLayout {
  const pad = 12;
  const cardWidth = Math.min(88, Math.max(72, Math.round(width * 0.2)));
  const cardHeight = Math.round(cardWidth * 1.4);
  const playW = Math.min(140, width - pad * 2 - cardWidth * 2 - 8);
  const playH = Math.min(108, Math.floor(height * 0.2));

  const opponentArea = { x: pad, y: 4, width: width - pad * 2, height: 22 };
  const opponentHand = {
    x: pad + 8,
    y: 28,
    width: width - pad * 2 - 16,
    height: Math.round(cardHeight * 0.55),
  };

  const innerW = width - pad * 2;
  const innerH = Math.min(height * 0.5, cardHeight + 72);
  const innerBoard = {
    x: pad,
    y: opponentHand.y + opponentHand.height + 8,
    width: innerW,
    height: innerH,
  };

  const playZone = {
    x: (width - playW) / 2,
    y: innerBoard.y + (innerH - playH) / 2 + 6,
    width: playW,
    height: playH,
  };

  const pileY = playZone.y + (playH - cardHeight * 0.9) / 2;
  const deck = { x: innerBoard.x + 8, y: pileY, width: cardWidth, height: cardHeight };
  const discard = {
    x: innerBoard.x + innerW - 8 - cardWidth,
    y: pileY,
    width: cardWidth,
    height: cardHeight,
  };

  const localHand = {
    x: pad,
    y: height + 40,
    width: width - pad * 2,
    height: cardHeight,
  };

  return {
    width,
    height,
    isMobile: true,
    cardWidth,
    cardHeight,
    opponentArea,
    opponentHand,
    playZone,
    deck,
    discard,
    localHand,
    innerBoard,
    turnLabel: { x: width / 2, y: innerBoard.y + 18 },
  };
}
