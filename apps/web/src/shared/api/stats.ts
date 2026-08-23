import { api } from "./http";

export interface FactionStats {
  matchesPlayed: number;
  matchesWon: number;
  winRate: number;
}

export interface PlayerStatsDto {
  player: {
    playerId: string;
    displayName: string;
    avatarUrl?: string;
    joinedAt?: string;
    role?: string;
    platform?: string;
  };
  nobStats: {
    totalMatches: number;
    matchesWon: number;
    winRate: number;
    vampire: FactionStats;
    werewolf: FactionStats;
    halfblood: FactionStats;
  };
}

export const DEFAULT_PLAYER_STATS: PlayerStatsDto = {
  player: {
    playerId: "NB-7X9X2M",
    displayName: "BloodMoon",
    avatarUrl: "/assets/avatar-default.png",
    joinedAt: "12/02/2025",
    role: "Member",
    platform: "Web",
  },
  nobStats: {
    totalMatches: 256,
    matchesWon: 164,
    winRate: 64.1,
    vampire: {
      matchesPlayed: 112,
      matchesWon: 72,
      winRate: 64.3,
    },
    werewolf: {
      matchesPlayed: 98,
      matchesWon: 59,
      winRate: 60.2,
    },
    halfblood: {
      matchesPlayed: 46,
      matchesWon: 33,
      winRate: 71.7,
    },
  },
};

export async function fetchPlayerStats(): Promise<PlayerStatsDto> {
  try {
    return await api<PlayerStatsDto>("/api/v1/profile/me/stats");
  } catch {
    return DEFAULT_PLAYER_STATS;
  }
}

