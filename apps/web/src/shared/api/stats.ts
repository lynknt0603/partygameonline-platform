import { api } from "./http";

export interface FactionStats {
  matchesPlayed: number;
  matchesWon: number;
  winRate: number;
}

export interface PlayerStatsDto {
  /** True when this player's game statistics are intentionally private. */
  gameStatsHidden?: boolean;
  player: {
    playerId: string;
    username?: string | null;
    displayName: string;
    avatarUrl?: string;
    joinedAt?: string;
    role?: string;
    platform?: string;
  };
  nobStats?: {
    totalMatches: number;
    matchesWon: number;
    winRate: number;
    vampire: FactionStats;
    werewolf: FactionStats;
    halfblood: FactionStats;
    elo?: number;
    highestElo?: number;
  };
  notInMyPotStats?: {
    totalMatches: number;
    matchesWon: number;
    winRate: number;
    vegetarian: FactionStats;
    meatEater: FactionStats;
    elo: number;
    highestElo: number;
  };
  achievements: AchievementDto[];
  avatars: AvatarDto[];
}

export interface AchievementDto {
  code: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string | null;
  rewardAvatarUrls: string[];
}

export interface AvatarDto {
  key: string;
  url: string;
  unlocked: boolean;
  selected: boolean;
  source: string;
  achievementCode?: string | null;
}

export const DEFAULT_PLAYER_STATS: PlayerStatsDto = {
  gameStatsHidden: false,
  player: {
    playerId: "NB-7X9X2M",
    username: "bloodmoon",
    displayName: "BloodMoon",
    avatarUrl: "/assets/avatars/default.png",
    joinedAt: "12/02/2025",
    role: "Member",
    platform: "Web",
  },
  nobStats: {
    totalMatches: 0,
    matchesWon: 0,
    winRate: 0,
    vampire: {
      matchesPlayed: 0,
      matchesWon: 0,
      winRate: 0,
    },
    werewolf: {
      matchesPlayed: 0,
      matchesWon: 0,
      winRate: 0,
    },
    halfblood: {
      matchesPlayed: 0,
      matchesWon: 0,
      winRate: 0,
    },
    elo: 5000,
    highestElo: 5000,
  },
  notInMyPotStats: {
    totalMatches: 0,
    matchesWon: 0,
    winRate: 0,
    vegetarian: { matchesPlayed: 0, matchesWon: 0, winRate: 0 },
    meatEater: { matchesPlayed: 0, matchesWon: 0, winRate: 0 },
    elo: 5000,
    highestElo: 5000,
  },
  achievements: [],
  avatars: [],
};

export async function fetchPlayerStats(): Promise<PlayerStatsDto> {
  try {
    return await api<PlayerStatsDto>("/api/v1/profile/me/stats");
  } catch {
    return DEFAULT_PLAYER_STATS;
  }
}

export async function fetchPublicPlayerStats(username: string): Promise<PlayerStatsDto> {
  return api<PlayerStatsDto>(`/api/v1/profile/${encodeURIComponent(username)}`);
}

