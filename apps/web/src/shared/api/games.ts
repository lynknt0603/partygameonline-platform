import { api } from "./http";
import type { GameDto } from "./types";

export function fetchGames(): Promise<GameDto[]> {
  return api<GameDto[]>("/api/v1/games");
}
