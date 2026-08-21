export interface DemoCard {
  id: string;
  rank: string;
  suit: string;
  name: string;
  nameVi: string;
}

const SUITS: Record<string, string> = { C: "♣", D: "♦", H: "♥", S: "♠" };
const RANKS: Record<number, string> = { 1: "A", 11: "J", 12: "Q", 13: "K" };
const RANK_EN: Record<string, string> = { A: "Ace", J: "Jack", Q: "Queen", K: "King" };
const RANK_VI: Record<string, string> = { A: "Ách", J: "J", Q: "Q", K: "K" };
const SUIT_EN: Record<string, string> = { "♠": "Spades", "♥": "Hearts", "♦": "Diamonds", "♣": "Clubs" };
const SUIT_VI: Record<string, string> = { "♠": "bích", "♥": "cơ", "♦": "rô", "♣": "chuồn" };

export function cardFromId(id: string): DemoCard {
  const [suitCode, rankCode] = id.split("-");
  const suit = SUITS[suitCode] ?? suitCode;
  const rankNumber = Number(rankCode);
  const rank = RANKS[rankNumber] ?? String(rankNumber);
  const rankName = RANK_EN[rank] ?? rank;
  const rankVi = RANK_VI[rank] ?? rank;
  return {
    id,
    rank,
    suit,
    name: `${rankName} of ${SUIT_EN[suit] ?? suit}`,
    nameVi: `${rankVi} ${SUIT_VI[suit] ?? suit}`,
  };
}

export function isRedSuit(suit: string): boolean {
  return suit === "♥" || suit === "♦";
}
