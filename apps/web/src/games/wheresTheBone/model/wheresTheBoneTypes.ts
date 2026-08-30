export const WHERES_THE_BONE_ID = "wheres-the-bone";
export type BoneRole = "BONE_THIEF" | "YARD_DOG" | "WHITE_DOG" | "PACKMATE" | string;

export interface BonePlayer {
  playerId: string; displayName: string; seat: number; connected: boolean; me: boolean;
  role: BoneRole | null; winner: boolean; awake: boolean; voted: boolean; wakeHours: number[];
  oldElo: number | null; eloDelta: number | null; newElo: number | null;
}
export interface BoneEvent { type: string; payload: Record<string, unknown>; }
export interface WheresTheBoneView {
  gameId: string; roomId: string; viewerPlayerId: string; phase: string; version: number; serverTime: string;
  phaseStartedAt: string; deadline: string; finished: boolean; currentHour: number; boneTaken: boolean;
  boneTakenHour: number | null; boneTakenBy: string | null; currentAwakePlayerIds: string[]; players: BonePlayer[];
  myRole: BoneRole | null; myDice: number[]; myWakeHours: number[]; mySelectedWakeHours: number[];
  myPeekResults: Record<string, number[]>; myClues: string[]; knownPackmateIds: string[]; packmateCandidateIds: string[]; winnerPlayerIds: string[];
  winnerFaction: string | null; votes: Record<string, string>; voteCounts: Record<string, number>; events: BoneEvent[]; eloChanges: Record<string, number>;
  discussionSkipVoteStarted: boolean; discussionSkipVoteOpen: boolean; discussionSkipVoteDeadline: string | null; discussionSkipVotes: Record<string, boolean>;
  legalActions: string[]; canAct: boolean;
}
function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function list(value: unknown): string[] { return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : []; }
function nums(value: unknown): number[] { return Array.isArray(value) ? value.filter((x): x is number => typeof x === "number") : []; }
export function parseWheresTheBoneView(value: unknown): WheresTheBoneView | null {
  const r = record(value); if (!r || r.gameId !== WHERES_THE_BONE_ID || !Array.isArray(r.players)) return null;
  const players: BonePlayer[] = r.players.flatMap((x) => { const p=record(x); return p && typeof p.playerId === "string" ? [{ playerId:p.playerId, displayName:typeof p.displayName === "string"?p.displayName:p.playerId, seat:typeof p.seat === "number"?p.seat:0, connected:p.connected!==false, me:p.me===true, role:typeof p.role === "string"?p.role:null, winner:p.winner===true, awake:p.awake===true, voted:p.voted===true, wakeHours:nums(p.wakeHours), oldElo:typeof p.oldElo === "number"?p.oldElo:null, eloDelta:typeof p.eloDelta === "number"?p.eloDelta:null, newElo:typeof p.newElo === "number"?p.newElo:null }] : []; });
  const events: BoneEvent[] = Array.isArray(r.events) ? r.events.flatMap((x) => { const e=record(x); return e && typeof e.type === "string" ? [{ type:e.type, payload:record(e.payload) ?? {} }] : []; }) : [];
  const peek: Record<string, number[]> = {}; for (const [k,v] of Object.entries(record(r.myPeekResults) ?? {})) peek[k]=nums(v);
  const voteCounts: Record<string, number> = {}; for (const [k,v] of Object.entries(record(r.voteCounts) ?? {})) if(typeof v === "number") voteCounts[k]=v;
  const votes: Record<string, string> = {}; for (const [k,v] of Object.entries(record(r.votes) ?? {})) if(typeof v === "string") votes[k]=v;
  const discussionSkipVotes: Record<string, boolean> = {}; for (const [k,v] of Object.entries(record(r.discussionSkipVotes) ?? {})) if(typeof v === "boolean") discussionSkipVotes[k]=v;
  const eloChanges: Record<string, number> = {}; for (const [k,v] of Object.entries(record(r.eloChanges) ?? {})) if(typeof v === "number") eloChanges[k]=v;
  return { gameId:WHERES_THE_BONE_ID, roomId:typeof r.roomId === "string"?r.roomId:"", viewerPlayerId:typeof r.viewerPlayerId === "string"?r.viewerPlayerId:"", phase:typeof r.phase === "string"?r.phase:"WAKE_SELECTION", version:typeof r.version === "number"?r.version:1, serverTime:typeof r.serverTime === "string"?r.serverTime:new Date().toISOString(), phaseStartedAt:typeof r.phaseStartedAt === "string"?r.phaseStartedAt:new Date().toISOString(), deadline:typeof r.deadline === "string"?r.deadline:new Date().toISOString(), finished:r.finished===true, currentHour:typeof r.currentHour === "number"?r.currentHour:0, boneTaken:r.boneTaken===true, boneTakenHour:typeof r.boneTakenHour === "number"?r.boneTakenHour:null, boneTakenBy:typeof r.boneTakenBy === "string"?r.boneTakenBy:null, currentAwakePlayerIds:list(r.currentAwakePlayerIds), players, myRole:typeof r.myRole === "string"?r.myRole:null, myDice:nums(r.myDice), myWakeHours:nums(r.myWakeHours), mySelectedWakeHours:nums(r.mySelectedWakeHours), myPeekResults:peek, myClues:list(r.myClues), knownPackmateIds:list(r.knownPackmateIds), packmateCandidateIds:list(r.packmateCandidateIds), winnerPlayerIds:list(r.winnerPlayerIds), winnerFaction:typeof r.winnerFaction === "string"?r.winnerFaction:null, votes, voteCounts, discussionSkipVoteStarted:r.discussionSkipVoteStarted===true, discussionSkipVoteOpen:r.discussionSkipVoteOpen===true, discussionSkipVoteDeadline:typeof r.discussionSkipVoteDeadline === "string"?r.discussionSkipVoteDeadline:null, discussionSkipVotes, events, eloChanges, legalActions:list(r.legalActions), canAct:r.canAct===true };
}
