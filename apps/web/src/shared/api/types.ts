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

export const DISPLAY_NAME_MAX_LENGTH = 10;

export interface AuthPayload {
  username: string;
  password: string;
}

export interface RegisterPayload extends AuthPayload {
  displayName: string;
}

export interface SessionDto {
  playerId: string;
  displayName: string;
  kind: string;
  avatarUrl?: string | null;
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
  avatarUrl?: string | null;
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

export interface WsEnvelope {
  version: number;
  type: string;
  roomId?: string | null;
  serverSequence?: number | null;
  requestId?: string | null;
  payload?: Record<string, unknown> | null;
}
