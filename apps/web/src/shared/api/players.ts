import { api } from "./http";

export interface PlayerSearchResultDto {
  playerId: string;
  username?: string | null;
  displayName: string;
  avatarUrl?: string | null;
}

export async function searchPlayers(query: string, limit = 20): Promise<PlayerSearchResultDto[]> {
  const params = new URLSearchParams({
    query: query.trim(),
    limit: String(limit),
  });
  return api<PlayerSearchResultDto[]>(`/api/v1/players/search?${params.toString()}`);
}
