export const NOT_IN_MY_POT_ID = "not-in-my-pot";

export type NotInMyPotRole = "VEGETARIAN" | "MEAT_EATER";
export type NotInMyPotCardType =
  | "VEGETABLE"
  | "SALT"
  | "MEAT"
  | "OUT_OF_HOUSE"
  | "SCOOP_OUT"
  | "SLOTTED_SPOON"
  | "EMERGENCY_SHOPPING"
  | "TRASH_OUT"
  | string;

export interface NotInMyPotCard {
  cardId: string;
  category: "INGREDIENT" | "ACTION" | string;
  type: NotInMyPotCardType;
  score: number | null;
}

export interface NotInMyPotPlayer {
  playerId: string;
  displayName: string;
  seat: number;
  active: boolean;
  expelled: boolean;
  connected: boolean;
  you: boolean;
  doorCount: number;
  handCount: number;
  role: NotInMyPotRole | string | null;
  winner: boolean;
  oldElo: number | null;
  eloDelta: number | null;
  newElo: number | null;
}

export interface NotInMyPotEvent {
  type: string;
  payload: Record<string, unknown>;
}

export type NotInMyPotPendingType =
  | "SELECT_TARGET"
  | "REORDER_POT_CARDS"
  | "RETURN_SHOPPING_CARDS"
  | string;

export interface NotInMyPotPendingAction {
  type: NotInMyPotPendingType;
  actorPlayerId: string;
  requiredCardCount: number;
  allowedTargetPlayerIds: string[];
  allowedCardIds: string[];
  startedAt: string | null;
  deadline: string | null;
}

export interface NotInMyPotView {
  gameType: string;
  roomId: string;
  you: string;
  phase: string;
  stateVersion: number;
  serverTime: string | null;
  finished: boolean;
  currentPlayerId: string | null;
  turnNumber: number;
  targetScore: number;
  winnerFaction: NotInMyPotRole | string | null;
  winnerPlayerIds: string[];
  players: NotInMyPotPlayer[];
  myRole: NotInMyPotRole | string | null;
  myHand: NotInMyPotCard[];
  drawPileCount: number;
  potCardCount: number;
  discardPileCount: number;
  publicRoles: Record<string, string>;
  publicEvents: NotInMyPotEvent[];
  pendingAction: NotInMyPotPendingAction | null;
  privateInspectedCards: NotInMyPotCard[];
  finalPotScore: number | null;
  finalPot: NotInMyPotCard[];
  canDeclarePotReady: boolean;
  canAct: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
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

function parseCard(value: unknown): NotInMyPotCard | null {
  const record = asRecord(value);
  if (!record || typeof record.cardId !== "string" || typeof record.type !== "string") {
    return null;
  }
  return {
    cardId: record.cardId,
    category: asString(record.category, "INGREDIENT"),
    type: record.type,
    score: asNullableNumber(record.score),
  };
}

function parseCards(value: unknown): NotInMyPotCard[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(parseCard).filter((card): card is NotInMyPotCard => card !== null);
}

function parsePlayer(value: unknown, index: number): NotInMyPotPlayer | null {
  const record = asRecord(value);
  if (!record || typeof record.playerId !== "string") {
    return null;
  }
  return {
    playerId: record.playerId,
    displayName: asString(record.displayName, record.playerId),
    seat: asNumber(record.seat, index),
    active: record.active !== false,
    expelled: record.expelled === true,
    connected: record.connected !== false,
    you: record.you === true,
    doorCount: asNumber(record.doorCount),
    handCount: asNumber(record.handCount),
    role: asNullableString(record.role),
    winner: record.winner === true,
    oldElo: asNullableNumber(record.oldElo),
    eloDelta: asNullableNumber(record.eloDelta),
    newElo: asNullableNumber(record.newElo),
  };
}

function parsePlayers(value: unknown): NotInMyPotPlayer[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map(parsePlayer).filter((player): player is NotInMyPotPlayer => player !== null);
}

function parseEvents(value: unknown): NotInMyPotEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const record = asRecord(item);
    if (!record || typeof record.type !== "string") {
      return [];
    }
    return [{ type: record.type, payload: asRecord(record.payload) ?? {} }];
  });
}

function parsePending(value: unknown): NotInMyPotPendingAction | null {
  const record = asRecord(value);
  if (!record || typeof record.type !== "string") {
    return null;
  }
  return {
    type: record.type,
    actorPlayerId: asString(record.actorPlayerId),
    requiredCardCount: asNumber(record.requiredCardCount),
    allowedTargetPlayerIds: asStringList(record.allowedTargetPlayerIds),
    allowedCardIds: asStringList(record.allowedCardIds),
    startedAt: asNullableString(record.startedAt),
    deadline: asNullableString(record.deadline),
  };
}

export function isNotInMyPotView(value: unknown): value is Record<string, unknown> {
  const record = asRecord(value);
  return record?.gameType === NOT_IN_MY_POT_ID && Array.isArray(record.myHand);
}

export function parseNotInMyPotView(value: unknown): NotInMyPotView | null {
  if (!isNotInMyPotView(value)) {
    return null;
  }
  const record = value;
  const publicRoles: Record<string, string> = {};
  for (const [playerId, role] of Object.entries(asRecord(record.publicRoles) ?? {})) {
    if (typeof role === "string") {
      publicRoles[playerId] = role;
    }
  }
  return {
    gameType: NOT_IN_MY_POT_ID,
    roomId: asString(record.roomId),
    you: asString(record.you),
    phase: asString(record.phase, "WAITING"),
    stateVersion: asNumber(record.stateVersion, 1),
    serverTime: asNullableString(record.serverTime),
    finished: record.finished === true,
    currentPlayerId: asNullableString(record.currentPlayerId),
    turnNumber: asNumber(record.turnNumber, 1),
    targetScore: asNumber(record.targetScore),
    winnerFaction: asNullableString(record.winnerFaction),
    winnerPlayerIds: asStringList(record.winnerPlayerIds),
    players: parsePlayers(record.players),
    myRole: asNullableString(record.myRole),
    myHand: parseCards(record.myHand),
    drawPileCount: asNumber(record.drawPileCount),
    potCardCount: asNumber(record.potCardCount),
    discardPileCount: asNumber(record.discardPileCount),
    publicRoles,
    publicEvents: parseEvents(record.publicEvents),
    pendingAction: parsePending(record.pendingAction),
    privateInspectedCards: parseCards(record.privateInspectedCards),
    finalPotScore: asNullableNumber(record.finalPotScore),
    finalPot: parseCards(record.finalPot),
    canDeclarePotReady: record.canDeclarePotReady === true,
    canAct: record.canAct === true,
  };
}
