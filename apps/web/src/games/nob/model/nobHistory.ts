import type { Locale } from "@/shared/i18n/locale";
import type { MessageKey } from "@/shared/i18n/messages";
import { nobCardName, replaceNobCardCodes } from "./nobCardLabel";
import type { NobPublicLog } from "./nobTypes";

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_all, key: string) => vars[key] ?? "");
}

export function formatNobHistory(
  entry: NobPublicLog,
  names: (playerId?: string | null) => string,
  t: (key: MessageKey) => string,
  locale: Locale,
  bloodlineLabel: string,
): string {
  const actor = names(entry.actorPlayerId);
  const target = names(entry.targetPlayerId);
  const extra = names(entry.extraTargetPlayerId);
  const card = nobCardName(entry.cardCode, locale) || nobCardName(entry.text?.match(/NOB-[A-Z0-9-]+/)?.[0], locale);
  const vars = { actor, target, a: target, b: extra, card, bloodline: bloodlineLabel };
  const code = entry.cardCode ?? "";

  if (entry.type === "NOB_SHAPE_PREVIEW" && actor && target && extra && card) {
    return fill(t("historyUseShapePreview"), vars);
  }
  if (entry.type === "NOB_SHAPE_SWAP" && actor && target && extra && card) {
    return fill(t("historyUseShapeSwap"), vars);
  }
  if (entry.type === "NOB_SHAPE_KEEP" && actor && target && extra && card) {
    return fill(t("historyUseShapeKeep"), vars);
  }
  if (entry.type === "NOB_MOON_STOLEN" && actor && target) {
    return fill(card ? t("historyUseSteal") : t("historyMoonReceived"), vars);
  }
  if (entry.type === "NOB_MOON_INSPECTED" && actor && target) {
    return fill(card ? t("historyUseMoonInspect") : t("historyInspect"), vars);
  }
  if (entry.type === "NOB_INSPECTED" && actor && target) {
    if (code.startsWith("NOB-BS")) {
      return fill(t("historyUseSeer"), vars);
    }
    return fill(card ? t("historyUseInspect") : t("historyInspect"), vars);
  }
  if (entry.type === "NOB_PLAYER_SPARED" && actor && target) {
    return fill(card ? t("historyUseSpare") : t("historySpared"), vars);
  }
  if (entry.type === "NOB_PLAYER_ELIMINATED" && target) {
    if (code.startsWith("NOB-SP-VEIL")) {
      return fill(t("historyUseVeil"), vars);
    }
    if (code.startsWith("NOB-SP-LAST-OFFERING")) {
      return fill(t("historyUseSacrifice"), vars);
    }
    if (actor && card) {
      return fill(t("historyUseEliminate"), vars);
    }
    return actor ? fill(t("historyKilled"), vars) : fill(t("historyDied"), vars);
  }
  if (entry.type === "NOB_BLOODLINE_PUBLICLY_REVEALED" && target) {
    return fill(t("historyBloodlineRevealed"), vars);
  }
  if (entry.type === "NOB_MOON_MARK_COUNT_CHANGED" && actor) {
    return fill(t("historyMoonReceived"), vars);
  }
  if (entry.type === "NOB_ROLE_REVEALED") {
    if (code === "NOB-SP-LAST-HOPE") {
      return fill(t("historyUseLastHope"), { ...vars, actor: actor || target });
    }
    return "";
  }
  if (entry.type === "NOB_GAME_STARTED") {
    return t("historyGameStarted");
  }
  if (entry.type === "NOB_ROUND_STARTED") {
    return t("historyRoundStarted");
  }
  if (entry.type === "NOB_ROUND_SUMMARY") {
    return t("roundEnd");
  }
  const fallback = replaceNobCardCodes(entry.text ?? entry.type ?? "", locale);
  return fallback;
}
