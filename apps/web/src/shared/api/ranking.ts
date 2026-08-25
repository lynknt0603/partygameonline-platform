import { api } from "./http";

export type RankingSort = "highestElo" | "wins" | "bloodlineWins";
export type RankingBloodline = "VAMPIRE" | "WEREWOLF" | "HALFBLOOD" | null;

export interface RankingEntryDto {
  rank: number;
  playerId: string;
  displayName: string;
  elo: number;
  highestElo: number;
  totalWins: number;
  totalMatches: number;
  favoriteBloodline?: string | null;
  bloodlineWins: number;
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
  sort: RankingSort;
  bloodline: RankingBloodline;
  page?: number;
  size?: number;
}

export const DEFAULT_MOCK_RANKING: RankingDto = {
  gameId: "night-of-bloodlines",
  sort: "highestElo",
  podium: [
    { rank: 1, playerId: "usr_1", displayName: "BloodMoon", elo: 6321, highestElo: 6321, totalWins: 164, totalMatches: 256, favoriteBloodline: "VAMPIRE", bloodlineWins: 72 },
    { rank: 2, playerId: "usr_2", displayName: "NightHowl", elo: 5867, highestElo: 5867, totalWins: 142, totalMatches: 220, favoriteBloodline: "WEREWOLF", bloodlineWins: 59 },
    { rank: 3, playerId: "usr_3", displayName: "FangShadow", elo: 5512, highestElo: 5512, totalWins: 130, totalMatches: 210, favoriteBloodline: "HALFBLOOD", bloodlineWins: 33 },
  ],
  entries: [
    { rank: 4, playerId: "usr_4", displayName: "LunaVesper", elo: 5239, highestElo: 5239, totalWins: 128, totalMatches: 200, favoriteBloodline: "VAMPIRE", bloodlineWins: 43 },
    { rank: 5, playerId: "usr_5", displayName: "SilverPaw", elo: 5102, highestElo: 5102, totalWins: 104, totalMatches: 180, favoriteBloodline: "WEREWOLF", bloodlineWins: 37 },
    { rank: 6, playerId: "usr_6", displayName: "RavenClaw", elo: 4987, highestElo: 4987, totalWins: 98, totalMatches: 165, favoriteBloodline: "HALFBLOOD", bloodlineWins: 35 },
    { rank: 7, playerId: "usr_7", displayName: "ShadowKite", elo: 4876, highestElo: 4876, totalWins: 95, totalMatches: 160, favoriteBloodline: "VAMPIRE", bloodlineWins: 32 },
    { rank: 8, playerId: "usr_8", displayName: "DarkWhisper", elo: 4765, highestElo: 4765, totalWins: 87, totalMatches: 150, favoriteBloodline: "VAMPIRE", bloodlineWins: 31 },
    { rank: 9, playerId: "usr_9", displayName: "BoneHunter", elo: 4652, highestElo: 4652, totalWins: 76, totalMatches: 140, favoriteBloodline: "WEREWOLF", bloodlineWins: 28 },
    { rank: 10, playerId: "usr_10", displayName: "EchoPhantom", elo: 4521, highestElo: 4521, totalWins: 72, totalMatches: 130, favoriteBloodline: "HALFBLOOD", bloodlineWins: 27 },
  ],
  me: {
    rank: 15,
    playerId: "me",
    displayName: "You",
    elo: 4205,
    highestElo: 4205,
    totalWins: 58,
    totalMatches: 92,
    favoriteBloodline: "WEREWOLF",
    bloodlineWins: 21,
  },
  page: 0,
  size: 7,
  totalPlayers: 15,
  totalPages: 1,
};

export async function fetchRanking({ sort, bloodline, page = 0, size = 7 }: RankingQuery): Promise<RankingDto> {
  const params = new URLSearchParams({
    gameId: "night-of-bloodlines",
    sort,
    page: String(page),
    size: String(size),
  });
  if (bloodline) {
    params.set("bloodline", bloodline);
  }
  try {
    const data = await api<RankingDto>(`/api/v1/rankings?${params.toString()}`);
    if (data && (data.podium?.length > 0 || data.entries?.length > 0)) {
      return data;
    }
    return DEFAULT_MOCK_RANKING;
  } catch {
    return DEFAULT_MOCK_RANKING;
  }
}
