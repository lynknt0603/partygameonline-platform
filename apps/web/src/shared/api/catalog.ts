import type { GameManifest } from "@/game/core/GameManifest";
import type { GameDto } from "./types";

interface Presentation {
  displayName: string;
  displayNameVi: string;
  genre: string;
  genreVi: string;
  summary: string;
  summaryVi: string;
  durationMin: number;
  durationMax: number;
  theme: GameManifest["theme"];
}

const PRESENTATION: Record<string, Presentation> = {
  "demo-card-game": {
    displayName: "Table Demo",
    displayNameVi: "Bàn bài thử",
    genre: "Card table",
    genreVi: "Bàn bài",
    summary: "Draw, play, and empty your hand.",
    summaryVi: "Rút bài, đánh bài, hết bài trên tay thì thắng.",
    durationMin: 5,
    durationMax: 15,
    theme: { id: "demo-felt", name: "Felt Table", prefersDarkCanvas: false, hudVariant: "platform" },
  },
  "night-of-bloodlines": {
    displayName: "Night of Bloodlines",
    displayNameVi: "Đêm huyết thống",
    genre: "Social deduction",
    genreVi: "Suy luận xã hội",
    summary: "Coming soon — listed until the engine ships.",
    summaryVi: "Sắp ra mắt — catalogue đã có, chưa có engine.",
    durationMin: 20,
    durationMax: 30,
    theme: { id: "bloodlines-gothic", name: "Gothic Night", prefersDarkCanvas: true, hudVariant: "platform" },
  },
};

const FALLBACK: Presentation = {
  displayName: "Game",
  displayNameVi: "Trò chơi",
  genre: "Table",
  genreVi: "Bàn",
  summary: "",
  summaryVi: "",
  durationMin: 10,
  durationMax: 20,
  theme: { id: "demo-felt", name: "Felt Table", prefersDarkCanvas: false, hudVariant: "platform" },
};

export function toGameManifest(game: GameDto): GameManifest {
  const extra = PRESENTATION[game.id] ?? { ...FALLBACK, displayName: game.name, displayNameVi: game.name };
  return {
    id: game.id,
    displayName: extra.displayName,
    displayNameVi: extra.displayNameVi,
    genre: extra.genre,
    genreVi: extra.genreVi,
    summary: extra.summary,
    summaryVi: extra.summaryVi,
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    durationMin: extra.durationMin,
    durationMax: extra.durationMax,
    enabled: game.enabled,
    theme: extra.theme,
  };
}
