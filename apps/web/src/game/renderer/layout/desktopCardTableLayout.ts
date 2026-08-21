import type { CardTableLayout } from "./CardTableLayout";

export function desktopCardTableLayout(width: number, height: number): CardTableLayout {
  const pad = Math.max(28, width * 0.04);
  const cardWidth = Math.min(125, Math.max(105, Math.round(width * 0.085)));
  const cardHeight = Math.round(cardWidth * 1.4);
  const playW = Math.min(200, width * 0.2);
  const playH = Math.min(132, height * 0.18);
  const footer = 64;

  const opponentArea = { x: pad, y: 8, width: width - pad * 2, height: 24 };
  const opponentHand = {
    x: width * 0.3,
    y: 34,
    width: width * 0.4,
    height: Math.round(cardHeight * 0.7),
  };

  const innerW = Math.min(width * 0.76, 960);
  const innerH = Math.min(cardHeight + 88, height * 0.4);
  const innerBoard = {
    x: (width - innerW) / 2,
    y: opponentHand.y + opponentHand.height + 10,
    width: innerW,
    height: innerH,
  };

  const playZone = {
    x: innerBoard.x + (innerW - playW) / 2,
    y: innerBoard.y + (innerH - playH) / 2 + 8,
    width: playW,
    height: playH,
  };

  const pileY = playZone.y + (playH - cardHeight) / 2;
  const deck = {
    x: playZone.x - cardWidth - 28,
    y: pileY,
    width: cardWidth,
    height: cardHeight,
  };
  const discard = {
    x: playZone.x + playW + 28,
    y: pileY,
    width: cardWidth,
    height: cardHeight,
  };

  const localHand = {
    x: pad,
    y: Math.min(innerBoard.y + innerH + 8, height - footer - cardHeight - 28),
    width: width - pad * 2,
    height: cardHeight + 16,
  };

  return {
    width,
    height,
    isMobile: false,
    cardWidth,
    cardHeight,
    opponentArea,
    opponentHand,
    playZone,
    deck,
    discard,
    localHand,
    innerBoard,
    turnLabel: { x: width / 2, y: innerBoard.y + 20 },
  };
}
