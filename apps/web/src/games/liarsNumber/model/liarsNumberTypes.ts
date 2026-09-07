export const LIARS_NUMBER_ID = "liars-number" as const;

export type LiarsNumberPhase =
  | "SELECT_CARD"
  | "SELECT_TARGET"
  | "DECLARE_TYPE"
  | "RECEIVER_DECISION"
  | "SELECT_PASS_TARGET"
  | "PASS_DECLARE_TYPE"
  | "GAME_OVER"
  | string;

export interface LiarsNumberCard {
  cardId: string | null;
  typeId: number | null;
  variant: "normal" | "roman" | null;
  label: string;
  faceUp: boolean;
  penaltyWeight: number;
}

export interface LiarsNumberClaim {
  senderId: string;
  receiverId: string;
  declaredType: number;
}

export interface LiarsNumberActiveRound {
  card: LiarsNumberCard;
  originalSenderId: string;
  currentSenderId: string;
  currentReceiverId: string | null;
  declaredType: number | null;
  history: LiarsNumberClaim[];
  seenBy: string[];
}

export interface LiarsNumberPlayer {
  playerId: string;
  displayName: string;
  seat: number;
  you: boolean;
  handCount: number;
  penaltyCards: LiarsNumberCard[];
  penaltyScores: Record<string, number>;
  winner: boolean;
  loser: boolean;
  oldElo: number | null;
  eloDelta: number | null;
  newElo: number | null;
}

export interface LiarsNumberEvent {
  type: string;
  payload: Record<string, unknown>;
}

export interface LiarsNumberView {
  gameType: typeof LIARS_NUMBER_ID;
  roomId: string;
  you: string;
  phase: LiarsNumberPhase;
  stateVersion: number;
  serverTime: string | null;
  turnSeconds: number;
  turnDeadline: string | null;
  finished: boolean;
  playerCount: number;
  lossThreshold: number;
  roundNumber: number;
  currentRoundStarterId: string | null;
  activeRound: LiarsNumberActiveRound | null;
  players: LiarsNumberPlayer[];
  myHand: LiarsNumberCard[];
  myPenaltyCards: LiarsNumberCard[];
  removedCardCount: number;
  loserId: string | null;
  winnerPlayerIds: string[];
  publicEvents: LiarsNumberEvent[];
  legalActions: string[];
  availableTargetPlayerIds: string[];
  availablePassTargetPlayerIds: string[];
  lastResolvedCard: LiarsNumberCard | null;
  lastPenaltyPlayerId: string | null;
  lastPenaltyType: number | null;
  lastPenaltyScore: number | null;
  lastPenaltyThreshold: number | null;
  lastClaimIsTrue: boolean | null;
  lastReceiverCorrect: boolean | null;
  gameOverReason: string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseCard(value: unknown): LiarsNumberCard | null {
  const record = asRecord(value);
  if (!record || typeof record.label !== "string") return null;
  const variant = record.variant === "roman" || record.variant === "normal" ? record.variant : null;
  return {
    cardId: asNullableString(record.cardId),
    typeId: asNullableNumber(record.typeId),
    variant,
    label: asString(record.label, "CARD BACK"),
    faceUp: record.faceUp === true,
    penaltyWeight: asNumber(record.penaltyWeight),
  };
}

function parseCards(value: unknown): LiarsNumberCard[] {
  return Array.isArray(value) ? value.map(parseCard).filter((card): card is LiarsNumberCard => card !== null) : [];
}

function parsePlayer(value: unknown, index: number): LiarsNumberPlayer | null {
  const record = asRecord(value);
  if (!record || typeof record.playerId !== "string") return null;
  const scores: Record<string, number> = {};
  for (const [key, score] of Object.entries(asRecord(record.penaltyScores) ?? {})) {
    if (typeof score === "number" && Number.isFinite(score)) scores[key] = score;
  }
  return {
    playerId: record.playerId,
    displayName: asString(record.displayName, record.playerId),
    seat: asNumber(record.seat, index),
    you: record.you === true,
    handCount: asNumber(record.handCount),
    penaltyCards: parseCards(record.penaltyCards),
    penaltyScores: scores,
    winner: record.winner === true,
    loser: record.loser === true,
    oldElo: asNullableNumber(record.oldElo),
    eloDelta: asNullableNumber(record.eloDelta),
    newElo: asNullableNumber(record.newElo),
  };
}

function parseActiveRound(value: unknown): LiarsNumberActiveRound | null {
  const record = asRecord(value);
  const card = parseCard(record?.card);
  if (!record || !card || typeof record.originalSenderId !== "string" || typeof record.currentSenderId !== "string") return null;
  const history = Array.isArray(record.history) ? record.history.flatMap((item) => {
    const claim = asRecord(item);
    return claim && typeof claim.senderId === "string" && typeof claim.receiverId === "string"
      ? [{ senderId: claim.senderId, receiverId: claim.receiverId, declaredType: asNumber(claim.declaredType) }]
      : [];
  }) : [];
  return {
    card,
    originalSenderId: record.originalSenderId,
    currentSenderId: record.currentSenderId,
    currentReceiverId: asNullableString(record.currentReceiverId),
    declaredType: asNullableNumber(record.declaredType),
    history,
    seenBy: asStringList(record.seenBy),
  };
}

function parseEvents(value: unknown): LiarsNumberEvent[] {
  return Array.isArray(value) ? value.flatMap((item) => {
    const record = asRecord(item);
    return record && typeof record.type === "string"
      ? [{ type: record.type, payload: asRecord(record.payload) ?? {} }]
      : [];
  }) : [];
}

export function isLiarsNumberView(value: unknown): value is Record<string, unknown> {
  const record = asRecord(value);
  return record?.gameType === LIARS_NUMBER_ID && Array.isArray(record.myHand);
}

export function parseLiarsNumberView(value: unknown): LiarsNumberView | null {
  if (!isLiarsNumberView(value)) return null;
  const record = value;
  return {
    gameType: LIARS_NUMBER_ID,
    roomId: asString(record.roomId),
    you: asString(record.you),
    phase: asString(record.phase, "SELECT_CARD"),
    stateVersion: asNumber(record.stateVersion, 1),
    serverTime: asNullableString(record.serverTime),
    turnSeconds: asNumber(record.turnSeconds),
    turnDeadline: asNullableString(record.turnDeadline),
    finished: record.finished === true,
    playerCount: asNumber(record.playerCount),
    lossThreshold: asNumber(record.lossThreshold, 4),
    roundNumber: asNumber(record.roundNumber, 1),
    currentRoundStarterId: asNullableString(record.currentRoundStarterId),
    activeRound: parseActiveRound(record.activeRound),
    players: Array.isArray(record.players) ? record.players.map(parsePlayer).filter((player): player is LiarsNumberPlayer => player !== null) : [],
    myHand: parseCards(record.myHand),
    myPenaltyCards: parseCards(record.myPenaltyCards),
    removedCardCount: asNumber(record.removedCardCount),
    loserId: asNullableString(record.loserId),
    winnerPlayerIds: asStringList(record.winnerPlayerIds),
    publicEvents: parseEvents(record.publicEvents),
    legalActions: asStringList(record.legalActions),
    availableTargetPlayerIds: asStringList(record.availableTargetPlayerIds),
    availablePassTargetPlayerIds: asStringList(record.availablePassTargetPlayerIds),
    lastResolvedCard: parseCard(record.lastResolvedCard),
    lastPenaltyPlayerId: asNullableString(record.lastPenaltyPlayerId),
    lastPenaltyType: asNullableNumber(record.lastPenaltyType),
    lastPenaltyScore: asNullableNumber(record.lastPenaltyScore),
    lastPenaltyThreshold: asNullableNumber(record.lastPenaltyThreshold),
    lastClaimIsTrue: typeof record.lastClaimIsTrue === "boolean" ? record.lastClaimIsTrue : null,
    lastReceiverCorrect: typeof record.lastReceiverCorrect === "boolean" ? record.lastReceiverCorrect : null,
    gameOverReason: asNullableString(record.gameOverReason),
  };
}
