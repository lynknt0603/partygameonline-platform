export interface ApiErrorBody {
  errorCode: string;
  message: string;
  path?: string;
  requestId?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode: string;

  constructor(status: number, errorCode: string, message: string) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

export interface SessionDto {
  playerId: string;
  displayName: string;
  kind: string;
  currentRoomId?: string | null;
}

export interface GameDto {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  enabled: boolean;
}

export interface RoomPlayerDto {
  playerId: string;
  displayName: string;
  state: "CONNECTED" | "READY" | "DISCONNECTED";
}

export interface RoomDto {
  id: string;
  name: string;
  gameId: string;
  hostPlayerId: string;
  maxPlayers: number;
  visibility: "PUBLIC" | "PRIVATE";
  status: "WAITING" | "STARTING" | "IN_GAME" | "FINISHED";
  serverSequence: number;
  createdAt: string;
  players: RoomPlayerDto[];
  settings?: Record<string, unknown> | null;
}

export interface DemoView {
  you: string;
  currentPlayerId: string;
  turnNumber: number;
  yourTurn: boolean;
  hasDrawn: boolean;
  hasPlayed: boolean;
  hand: string[];
  deckSize: number;
  opponentHandSize: number;
  discard: string[];
  finished: boolean;
  winnerPlayerId: string | null;
}

export interface WsEnvelope {
  version: number;
  type: string;
  roomId?: string | null;
  serverSequence?: number | null;
  requestId?: string | null;
  payload?: Record<string, unknown> | null;
}
