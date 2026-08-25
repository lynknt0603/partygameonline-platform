import type { Locale } from "@/shared/i18n/locale";
import type { NobBloodline } from "./nobTypes";

export function bloodlineTitle(bloodline: NobBloodline | null | undefined, locale: Locale): string {
  if (!bloodline?.type) {
    return locale === "vi" ? "Gia tộc ẩn" : "Hidden bloodline";
  }
  if (bloodline.type === "HALFBLOOD") {
    return locale === "vi" ? "Con Lai" : "Halfblood";
  }
  const name =
    bloodline.type === "VAMPIRE"
      ? locale === "vi"
        ? "Ma Cà Rồng"
        : "Vampire"
      : locale === "vi"
        ? "Ma Sói"
        : "Werewolf";
  return bloodline.rank != null
    ? `${name} · ${locale === "vi" ? "Bậc" : "Rank"} ${bloodline.rank}`
    : name;
}

export function bloodlineFlavor(type: string | null | undefined, locale: Locale): string {
  const vi = locale === "vi";
  if (type === "VAMPIRE") {
    return vi
      ? "Phe Ma Cà Rồng. Thắng vòng khi Gia Tộc này được công bố là phe thắng."
      : "Vampire faction. Wins the round when this bloodline is declared the round winner.";
  }
  if (type === "WEREWOLF") {
    return vi
      ? "Phe Ma Sói. Thắng vòng khi Gia Tộc này được công bố là phe thắng."
      : "Werewolf faction. Wins the round when this bloodline is declared the round winner.";
  }
  if (type === "HALFBLOOD") {
    return vi
      ? "Con Lai. Hy Vọng Cuối Cùng còn sống đến Công Khai Thân Phận Kết Thúc Ván có thể đổi phe thắng của vòng."
      : "Halfblood. Last Hope, if alive at Final Reveal, can override the round winner.";
  }
  return vi ? "Gia tộc chưa rõ." : "Bloodline unknown.";
}

export function roundWinnerLine(
  result: string | null | undefined,
  winningBloodline: string | null | undefined,
  locale: Locale,
): { kicker: string; title: string } {
  const vi = locale === "vi";
  if (result === "LAST_HOPE_HALFBLOOD" || winningBloodline === "HALFBLOOD") {
    return {
      kicker: vi ? "CÔNG KHAI GIA TỘC" : "BLOODLINE REVEAL",
      title: vi ? "CON LAI THẮNG VÒNG" : "HALFBLOOD WINS THE ROUND",
    };
  }
  if (result === "TOTAL_TIE" || !winningBloodline) {
    return {
      kicker: vi ? "CÔNG KHAI GIA TỘC" : "BLOODLINE REVEAL",
      title: vi ? "HÒA VÒNG NÀY" : "THE ROUND IS TIED",
    };
  }
  if (winningBloodline === "WEREWOLF" || result === "WEREWOLF") {
    return {
      kicker: vi ? "CÔNG KHAI GIA TỘC" : "BLOODLINE REVEAL",
      title: vi ? "MA SÓI THẮNG VÒNG" : "WEREWOLVES WIN THE ROUND",
    };
  }
  return {
    kicker: vi ? "CÔNG KHAI GIA TỘC" : "BLOODLINE REVEAL",
    title: vi ? "MA CÀ RỒNG THẮNG VÒNG" : "VAMPIRES WIN THE ROUND",
  };
}
