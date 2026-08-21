import type { GameThemeManifest } from "@/game/core/GameThemeManifest";
import type { ResolvedTheme } from "@/shared/theme";
import { PLATFORM_PIXI_COLORS } from "./platformThemeBridge";

export interface TablePalette {
  felt: number;
  feltInner: number;
  rail: number;
  playFill: number;
  playStroke: number;
  playHot: number;
  cardFace: number;
  cardBack: number;
  cardBackPattern: number;
  cardStroke: number;
  ink: number;
  redSuit: number;
  label: number;
  locked: boolean;
}

const GOTHIC: TablePalette = {
  felt: 0x141018,
  feltInner: 0x1c141c,
  rail: 0x3a2a18,
  playFill: 0x221820,
  playStroke: 0xc9a45c,
  playHot: 0xe2c47a,
  cardFace: 0xf4efe4,
  cardBack: 0x2a1620,
  cardBackPattern: 0x8b3a4a,
  cardStroke: 0xc9a45c,
  ink: 0x1a1410,
  redSuit: 0xa33a3a,
  label: 0xf2eee5,
  locked: true,
};

const MIDNIGHT_FELT: TablePalette = {
  felt: 0x12261f,
  feltInner: 0x1a3a2e,
  rail: 0x3a2a18,
  playFill: 0x14181d,
  playStroke: 0xc9a45c,
  playHot: 0x5ca0c9,
  cardFace: 0xf7f3ea,
  cardBack: 0x14181d,
  cardBackPattern: 0xc9a45c,
  cardStroke: 0x303844,
  ink: 0x202824,
  redSuit: 0xb04040,
  label: 0xf2eee5,
  locked: false,
};

const DAYBREAK_FELT: TablePalette = {
  felt: 0x2f6b55,
  feltInner: 0x3d8a6c,
  rail: 0x8b6944,
  playFill: 0x245c48,
  playStroke: 0xb88a3d,
  playHot: 0x3d9c8c,
  cardFace: 0xf7f3ea,
  cardBack: 0x1f4a3c,
  cardBackPattern: 0xb88a3d,
  cardStroke: 0xd9e1dc,
  ink: 0x202824,
  redSuit: 0xb04040,
  label: 0xf2eee5,
  locked: false,
};

export function resolveTablePalette(
  manifest: GameThemeManifest,
  resolvedTheme: ResolvedTheme,
): TablePalette {
  if (manifest.prefersDarkCanvas) {
    return GOTHIC;
  }

  const platform = PLATFORM_PIXI_COLORS[resolvedTheme];
  const base = resolvedTheme === "light" ? DAYBREAK_FELT : MIDNIGHT_FELT;

  return {
    ...base,
    playStroke: platform.brand,
    playHot: platform.accent,
    cardBackPattern: platform.brand,
    cardStroke: platform.border,
  };
}
