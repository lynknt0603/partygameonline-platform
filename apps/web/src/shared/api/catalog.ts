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
  "not-in-my-pot": {
    displayName: "Not In My Pot!",
    displayNameVi: "Not In My Pot!",
    genre: "Hidden role • bluff",
    genreVi: "Ẩn vai • nói dối",
    summary: "Someone put meat in the pot. Cook, bluff and figure out who is ruining dinner.",
    summaryVi: "Ai đó đã cho thịt vào nồi. Nấu ăn, nói dối và tìm ra ai đang phá bữa tối.",
    durationMin: 15,
    durationMax: 25,
    theme: {
      id: "not-in-my-pot-kitchen",
      name: "Warm Kitchen Table",
      prefersDarkCanvas: false,
      hudVariant: "platform",
      className: "not-in-my-pot",
    },
  },
  "wheres-the-bone": {
    displayName: "Where's the Bone",
    displayNameVi: "Where's the Bone",
    genre: "Hidden role • deduction",
    genreVi: "Ẩn vai • suy luận",
    summary: "Wake up, follow the clues and find the bone thief.",
    summaryVi: "Thức dậy, theo dấu vết và tìm ra kẻ trộm xương.",
    durationMin: 10,
    durationMax: 20,
    theme: { id: "wheres-the-bone-yard", name: "Moonlit Dog Yard", prefersDarkCanvas: true, hudVariant: "platform", className: "wheres-the-bone" },
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
  theme: { id: "platform-default", name: "Platform", prefersDarkCanvas: false, hudVariant: "platform" },
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
