import type { GameThemeManifest } from "./GameThemeManifest";

export interface GameManifest {
  id: string;
  displayName: string;
  displayNameVi: string;
  genre: string;
  genreVi: string;
  summary: string;
  summaryVi: string;
  minPlayers: number;
  maxPlayers: number;
  durationMin: number;
  durationMax: number;
  enabled: boolean;
  theme: GameThemeManifest;
}

export function playerRangeLabel(game: Pick<GameManifest, "minPlayers" | "maxPlayers">): string {
  if (game.minPlayers === game.maxPlayers) {
    return `${game.minPlayers} players`;
  }
  return `${game.minPlayers}–${game.maxPlayers} players`;
}
