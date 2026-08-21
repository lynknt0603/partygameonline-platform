import type { Locale } from "@/shared/i18n/locale";
import { bloodlineTitle } from "./nobBloodlineCopy";
import { nobCardName } from "./nobCardLabel";
import type { NobAnnouncement, NobLastRoundResult, NobPlayerPublic } from "./nobTypes";

const COPY: Record<string, { vi: string; en: string }> = {
  "nob.card.resolving": { vi: "{name} đang thi triển {card}…", en: "{name} is resolving {card}…" },
  "nob.actor.selectingTarget": { vi: "{name} đang chọn mục tiêu…", en: "{name} is choosing a target…" },
  "nob.hunter.deciding": {
    vi: "{name} đang quyết định số phận {target}…",
    en: "{name} is deciding the fate of {target}…",
  },
  "nob.hunter.spared": { vi: "{actor} đã tha cho {target}.", en: "{actor} spared {target}." },
  "nob.elimination.success": { vi: "{actor} đã tiêu diệt {target}.", en: "{actor} eliminated {target}." },
  "nob.reaction.veilReversal": { vi: "{target} đã phản ngược đòn!", en: "{target} reflected the blow!" },
  "nob.reaction.gloriousSacrifice": {
    vi: "{target} đã hy sinh trong vinh quang. +1 Moon Mark.",
    en: "{target} made a Glorious Sacrifice. +1 Moon Mark.",
  },
  "nob.lastHope.triggered": { vi: "LAST HOPE ĐÃ SỐNG SÓT", en: "LAST HOPE HAS SURVIVED" },
  "nob.round.result": { vi: "Phe {bloodline} thắng vòng này.", en: "{bloodline} wins the round." },
  "nob.bloodline.revealed": {
    vi: "Bloodline của {target} đã bị công khai: {bloodline}",
    en: "{target}'s bloodline was revealed: {bloodline}",
  },
  "nob.round.tie": { vi: "Vòng này hòa / Halfblood.", en: "The round is tied / Halfblood." },
  "nob.timeout.autoAction": {
    vi: "{name} hết giờ — hệ thống đã hành động.",
    en: "{name} ran out of time — the server acted.",
  },
  "nob.moonMark.received": {
    vi: "{name} nhận 1 Moon Mark.",
    en: "{name} received 1 Moon Mark.",
  },
};

function playerName(players: NobPlayerPublic[], id: string | null | undefined, fallback = ""): string {
  if (!id) {
    return fallback;
  }
  return players.find((player) => player.playerId === id)?.displayName ?? fallback;
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_all, key: string) => vars[key] ?? "");
}

export function announceText(
  announcement: NobAnnouncement | null | undefined,
  players: NobPlayerPublic[],
  locale: Locale,
  lastRound?: NobLastRoundResult | null,
): string | null {
  if (!announcement) {
    return null;
  }
  const key = announcement.messageKey || "";
  const pack = COPY[key];
  const actor = playerName(players, announcement.actorPlayerId);
  const target = playerName(players, announcement.targetPlayerId);
  const card =
    nobCardName(announcement.cardCode ?? announcement.reactionCardCode, locale) ||
    (locale === "vi" ? "một lá" : "a card");
  const revealedLine = players.find((player) => player.playerId === announcement.targetPlayerId)
    ?.publiclyRevealedBloodline;
  const vars = {
    name: actor || target,
    actor,
    target,
    card,
    bloodline:
      announcement.messageKey === "nob.bloodline.revealed"
        ? bloodlineTitle(revealedLine, locale)
        : (lastRound?.winningBloodline ?? ""),
  };
  if (key === "nob.round.result") {
    if (!lastRound?.winningBloodline) {
      return locale === "vi" ? COPY["nob.round.tie"].vi : COPY["nob.round.tie"].en;
    }
    const line = pack ?? COPY["nob.round.result"];
    return fill(locale === "vi" ? line.vi : line.en, vars);
  }
  if (!pack) {
    return key;
  }
  return fill(locale === "vi" ? pack.vi : pack.en, vars);
}

export function animationFromAnnouncement(
  type: string | null | undefined,
): "CARD_RESOLVE" | "ELIMINATE" | "VEIL" | "SACRIFICE" | "LAST_HOPE" | null {
  switch (type) {
    case "CARD_RESOLVING":
      return "CARD_RESOLVE";
    case "ELIMINATION_SUCCESS":
      return "ELIMINATE";
    case "VEIL_REVERSAL":
      return "VEIL";
    case "GLORIOUS_SACRIFICE":
      return "SACRIFICE";
    case "LAST_HOPE_TRIGGERED":
      return "LAST_HOPE";
    default:
      return null;
  }
}
