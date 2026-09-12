import { api } from "./http";

export type RankingSort = "highestElo" | "wins" | "bloodlineWins" | "roleWins" | "vegetarianWins" | "meatEaterWins";
export type RankingBloodline = "VAMPIRE" | "WEREWOLF" | "HALFBLOOD" | "ROSE" | "FAN" | "INQUISITOR" | null;
export type RankingRole = "WHITE_DOG" | "YARD_TEAM" | "BONE_THIEF_TEAM" | null;
export type RankingGameId = "night-of-bloodlines" | "not-in-my-pot" | "wheres-the-bone" | "liars-number" | "blood-bound";

export interface RankingEntryDto {
  rank: number;
  playerId: string;
  username?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  elo: number;
  highestElo: number;
  totalWins: number;
  totalMatches: number;
  favoriteBloodline?: string | null;
  bloodlineWins: number;
  favoriteRole?: string | null;
  roleWins: number;
  vegetarianMatches: number;
  vegetarianWins: number;
  vegetarianWinRate: number;
  meatEaterMatches: number;
  meatEaterWins: number;
  meatEaterWinRate: number;
}

export interface RankingDto {
  gameId: string;
  sort: RankingSort;
  bloodline?: RankingBloodline;
  role?: RankingRole;
  podium: RankingEntryDto[];
  entries: RankingEntryDto[];
  me?: RankingEntryDto | null;
  page: number;
  size: number;
  totalPlayers: number;
  totalPages: number;
}

interface RankingQuery {
  gameId: RankingGameId;
  sort: RankingSort;
  bloodline: RankingBloodline;
  role: RankingRole;
  page?: number;
  size?: number;
}

export async function fetchRanking({ gameId, sort, bloodline, role, page = 0, size = 7 }: RankingQuery): Promise<RankingDto> {
  const params = new URLSearchParams({
    gameId,
    sort,
    page: String(page),
    size: String(size),
  });
  if (bloodline) {
    params.set("bloodline", bloodline);
  }
  if (role) {
    params.set("role", role);
  }
  return api<RankingDto>(`/api/v1/rankings?${params.toString()}`);
}
