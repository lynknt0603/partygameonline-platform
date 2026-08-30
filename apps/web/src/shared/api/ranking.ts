import { api } from "./http";

export type RankingSort = "highestElo" | "wins" | "bloodlineWins" | "vegetarianWinRate" | "meatEaterWinRate";
export type RankingBloodline = "VAMPIRE" | "WEREWOLF" | "HALFBLOOD" | null;
export type RankingGameId = "night-of-bloodlines" | "not-in-my-pot" | "wheres-the-bone";

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
  page?: number;
  size?: number;
}

export async function fetchRanking({ gameId, sort, bloodline, page = 0, size = 7 }: RankingQuery): Promise<RankingDto> {
  const params = new URLSearchParams({
    gameId,
    sort,
    page: String(page),
    size: String(size),
  });
  if (bloodline) {
    params.set("bloodline", bloodline);
  }
  return api<RankingDto>(`/api/v1/rankings?${params.toString()}`);
}
