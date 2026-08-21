import { NOB_BLOODLINE_ART, NOB_CARD_ART, NOB_CARD_BACK, NOB_MOON_MARK_ART, NOB_MOON_MARK_BACK } from "./nobAssetManifest";
import { describeNobCard, NOB_CARD_META, type NobCardMeta, type NobCardText } from "./nobCardMeta";

function warn(message: string): void {
  if (import.meta.env.DEV) {
    console.warn(`[NOB] ${message}`);
  }
}

export function getNobCardArt(cardCode: string): string | null {
  const src = NOB_CARD_ART[cardCode];
  if (!src) {
    warn(`Missing artwork mapping for ${cardCode}`);
    return null;
  }
  return src;
}

export function getNobCardMeta(cardCode: string): NobCardMeta | null {
  return NOB_CARD_META[cardCode] ?? null;
}

export function getNobCardText(cardCode: string, locale: "vi" | "en"): NobCardText | null {
  return describeNobCard(cardCode, locale);
}

export function getNobBloodlineArt(type: string, rank?: number | null): string | null {
  if (type === "HALFBLOOD") {
    return NOB_BLOODLINE_ART.HALFBLOOD;
  }
  if (type === "VAMPIRE" || type === "WEREWOLF") {
    if (rank !== 1 && rank !== 2 && rank !== 3 && rank !== 4 && rank !== 5) {
      warn(`Bloodline ${type} missing or invalid rank`);
      return null;
    }
    const pack = NOB_BLOODLINE_ART[type];
    return pack[rank];
  }
  warn(`Unknown bloodline type ${type}`);
  return null;
}

export function getNobMoonMarkArt(value: number): string | null {
  if (value === 2 || value === 3 || value === 4) {
    return NOB_MOON_MARK_ART[value];
  }
  warn(`Missing Moon Mark art for ${value}`);
  return null;
}

export function getNobMoonMarkBack(): string {
  return NOB_MOON_MARK_BACK;
}

export function getNobCardBack(): string {
  return NOB_CARD_BACK;
}
