import { api } from "./http";
import type { GameDto } from "./types";

export async function fetchGames(): Promise<GameDto[]> {
  try {
    return await api<GameDto[]>("/api/v1/games");
  } catch {
    return [
      { id: "blood-bound", name: "Huyết Thệ (Crimson Vow)", minPlayers: 4, maxPlayers: 16, enabled: true },
      { id: "not-in-my-pot", name: "Not In My Pot!", minPlayers: 3, maxPlayers: 6, enabled: true },
      { id: "wheres-the-bone", name: "Where's the Bone", minPlayers: 4, maxPlayers: 8, enabled: true },
      { id: "night-of-bloodlines", name: "Night of Bloodlines", minPlayers: 5, maxPlayers: 10, enabled: false },
    ];
  }
}
