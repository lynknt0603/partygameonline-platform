import { api } from "./http";

export interface MatchPlayerDto {
  playerId: string;
  displayName: string;
  seat?: number | null;
  winner: boolean;
  result?: string | null;
}

export interface MatchDto {
  id: string;
  gameId: string;
  roomId: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  winnerPlayerId?: string | null;
  result?: string | null;
  players: MatchPlayerDto[];
}

export interface MatchPageDto {
  content: MatchDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export function fetchMatches(page = 0, size = 20): Promise<MatchPageDto> {
  return api<MatchPageDto>(`/api/v1/matches?page=${page}&size=${size}`);
}
