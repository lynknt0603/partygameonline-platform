import { parseNobTiming, type NobTiming } from "./nobTiming";

export interface NobBloodline {
  type: string;
  rank?: number | null;
}

export interface NobCardInstance {
  instanceId: string;
  cardCode: string;
  roleType?: string | null;
  number?: number | null;
  effectCode?: string | null;
}

export interface NobPlayerPublic {
  playerId: string;
  displayName: string;
  seat: number;
  alive: boolean;
  connected?: boolean;
  you?: boolean;
  moonMarkCount?: number;
  score?: number | null;
  publiclyRevealedBloodline: NobBloodline | null;
  revealedCards?: NobCardInstance[];
  hiddenCardCount?: number;
}

export interface NobPendingDecision {
  decisionId?: string;
  type?: string;
  kind?: string;
  actorPlayerId?: string | null;
  targetPlayerId?: string | null;
  sourceCardCode?: string | null;
  allowedTargetIds: string[];
  allowedOptions: string[];
  sourceCardInstanceId?: string | null;
  startedAt?: string | null;
  expiresAt?: string | null;
}

export interface NobObservation {
  kind: string;
  targetPlayerId: string;
  bloodline?: NobBloodline | null;
  cardCode?: string | null;
  moonMarkValue?: number | null;
}

export interface NobPublicLog {
  type?: string;
  text?: string;
  actorPlayerId?: string | null;
  targetPlayerId?: string | null;
}

export interface NobInspectReveal {
  targetPlayerId: string;
  bloodline?: NobBloodline | null;
  cardCode?: string | null;
  displayUntil?: string | null;
}

export interface NobAnnouncement {
  id?: string;
  type?: string;
  actorPlayerId?: string | null;
  targetPlayerId?: string | null;
  cardCode?: string | null;
  reactionCardCode?: string | null;
  messageKey?: string | null;
  createdAt?: string | null;
  displayUntil?: string | null;
}

export interface NobLastRoundResult {
  result?: string | null;
  winningBloodline?: string | null;
  lastHopeTriggered?: boolean;
}

export interface NobView {
  gameType?: string;
  roomId?: string;
  you: string;
  phase: string;
  phaseState?: string;
  roundNumber?: number;
  round?: number;
  version?: number;
  serverTime?: string | null;
  windowStartedAt?: string | null;
  deadline?: string | null;
  finished?: boolean;
  targetScore?: number;
  winnerPlayerIds?: string[];
  players: NobPlayerPublic[];
  myHand: NobCardInstance[];
  myDraftHand?: NobCardInstance[];
  myBloodline: NobBloodline | null;
  myBloodlineKnowledge?: string | null;
  myPendingDecision: NobPendingDecision | null;
  resolving?: NobCardInstance[];
  resolvingCardCode?: string | null;
  currentResolvingCard?: NobCardInstance | null;
  currentActorPlayerId?: string | null;
  currentDecisionType?: string | null;
  submittedPlayerIds?: string[];
  announcement?: NobAnnouncement | null;
  lastRoundResult?: NobLastRoundResult | null;
  roundRewardPlayerIds?: string[];
  timing?: NobTiming | null;
  myMoonMarkValues?: number[];
  myObservations?: NobObservation[];
  inspectReveal?: NobInspectReveal | null;
  echoCards?: NobCardInstance[];
  publicLog?: NobPublicLog[];
  discardCount?: number;
  undealtCount?: number;
}

export const NOB_CATALOGUE_ID = "night-of-bloodlines";
export const NOB_MODULE_ID = "nob";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asIso(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return null;
}

function parseCard(value: unknown): NobCardInstance | null {
  const record = asRecord(value);
  if (!record || typeof record.cardCode !== "string") {
    return null;
  }
  return {
    instanceId: typeof record.instanceId === "string" ? record.instanceId : record.cardCode,
    cardCode: record.cardCode,
    roleType: typeof record.roleType === "string" ? record.roleType : null,
    number: typeof record.number === "number" ? record.number : null,
    effectCode: typeof record.effectCode === "string" ? record.effectCode : null,
  };
}

function parsePending(value: unknown): NobPendingDecision | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  return {
    decisionId: typeof record.decisionId === "string" ? record.decisionId : undefined,
    type: typeof record.type === "string" ? record.type : undefined,
    kind: typeof record.kind === "string" ? record.kind : undefined,
    actorPlayerId: typeof record.actorPlayerId === "string" ? record.actorPlayerId : null,
    targetPlayerId: typeof record.targetPlayerId === "string" ? record.targetPlayerId : null,
    sourceCardCode: typeof record.sourceCardCode === "string" ? record.sourceCardCode : null,
    allowedTargetIds: asStringList(record.allowedTargetIds),
    allowedOptions: asStringList(record.allowedOptions),
    sourceCardInstanceId: typeof record.sourceCardInstanceId === "string" ? record.sourceCardInstanceId : null,
    startedAt: asIso(record.startedAt),
    expiresAt: asIso(record.expiresAt),
  };
}

function parseAnnouncement(value: unknown): NobAnnouncement | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  return {
    id: typeof record.id === "string" ? record.id : undefined,
    type: typeof record.type === "string" ? record.type : undefined,
    actorPlayerId: typeof record.actorPlayerId === "string" ? record.actorPlayerId : null,
    targetPlayerId: typeof record.targetPlayerId === "string" ? record.targetPlayerId : null,
    cardCode: typeof record.cardCode === "string" ? record.cardCode : null,
    reactionCardCode: typeof record.reactionCardCode === "string" ? record.reactionCardCode : null,
    messageKey: typeof record.messageKey === "string" ? record.messageKey : null,
    createdAt: asIso(record.createdAt),
    displayUntil: asIso(record.displayUntil),
  };
}

function parseBloodline(value: unknown): NobBloodline | null {
  const record = asRecord(value);
  if (!record || typeof record.type !== "string") {
    return null;
  }
  return {
    type: record.type,
    rank: typeof record.rank === "number" ? record.rank : null,
  };
}

function parsePlayers(value: unknown): NobPlayerPublic[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const players: NobPlayerPublic[] = [];
  for (const item of value) {
    const record = asRecord(item);
    if (!record || typeof record.playerId !== "string") {
      continue;
    }
    players.push({
      ...(record as unknown as NobPlayerPublic),
      playerId: record.playerId,
      displayName: typeof record.displayName === "string" ? record.displayName : record.playerId,
      seat: typeof record.seat === "number" ? record.seat : players.length,
      alive: record.alive !== false,
      publiclyRevealedBloodline: parseBloodline(record.publiclyRevealedBloodline),
    });
  }
  return players;
}

function parseInspectReveal(value: unknown): NobInspectReveal | null {
  const record = asRecord(value);
  if (!record || typeof record.targetPlayerId !== "string") {
    return null;
  }
  return {
    targetPlayerId: record.targetPlayerId,
    bloodline: parseBloodline(record.bloodline),
    cardCode: typeof record.cardCode === "string" ? record.cardCode : null,
    displayUntil: asIso(record.displayUntil),
  };
}

function parsePublicLog(value: unknown): NobPublicLog[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const entries: NobPublicLog[] = [];
  for (const item of value) {
    const record = asRecord(item);
    if (!record) {
      continue;
    }
    entries.push({
      type: typeof record.type === "string" ? record.type : undefined,
      text: typeof record.text === "string" ? record.text : undefined,
      actorPlayerId: typeof record.actorPlayerId === "string" ? record.actorPlayerId : null,
      targetPlayerId: typeof record.targetPlayerId === "string" ? record.targetPlayerId : null,
    });
  }
  return entries;
}

function parseRoundResult(value: unknown): NobLastRoundResult | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  return {
    result: typeof record.result === "string" ? record.result : null,
    winningBloodline: typeof record.winningBloodline === "string" ? record.winningBloodline : null,
    lastHopeTriggered: record.lastHopeTriggered === true,
  };
}

export function isNobView(value: unknown): value is NobView {
  const record = asRecord(value);
  if (!record) {
    return false;
  }
  return (
    record.gameType === "night-of-bloodlines" ||
    Array.isArray(record.myHand) ||
    Array.isArray(record.myDraftHand)
  );
}

export function parseNobView(value: unknown): NobView | null {
  if (!isNobView(value)) {
    return null;
  }
  return {
    ...value,
    you: String(value.you ?? ""),
    phase: String(value.phase ?? "UNKNOWN"),
    players: parsePlayers(value.players),
    myHand: Array.isArray(value.myHand) ? value.myHand : [],
    myDraftHand: Array.isArray(value.myDraftHand) ? value.myDraftHand : [],
    myBloodline: value.myBloodline ?? null,
    myPendingDecision: parsePending(value.myPendingDecision),
    winnerPlayerIds: Array.isArray(value.winnerPlayerIds) ? value.winnerPlayerIds : [],
    myObservations: Array.isArray(value.myObservations) ? value.myObservations : [],
    inspectReveal: parseInspectReveal(value.inspectReveal),
    echoCards: Array.isArray(value.echoCards) ? value.echoCards : [],
    publicLog: parsePublicLog(value.publicLog),
    submittedPlayerIds: asStringList(value.submittedPlayerIds),
    serverTime: asIso(value.serverTime),
    windowStartedAt: asIso(value.windowStartedAt),
    deadline: asIso(value.deadline),
    currentResolvingCard: parseCard(value.currentResolvingCard),
    currentActorPlayerId: typeof value.currentActorPlayerId === "string" ? value.currentActorPlayerId : null,
    currentDecisionType: typeof value.currentDecisionType === "string" ? value.currentDecisionType : null,
    announcement: parseAnnouncement(value.announcement),
    lastRoundResult: parseRoundResult(value.lastRoundResult),
    roundRewardPlayerIds: asStringList(value.roundRewardPlayerIds),
    timing: value.timing ? parseNobTiming(value.timing) : null,
  };
}
