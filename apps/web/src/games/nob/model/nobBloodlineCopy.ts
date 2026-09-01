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

export interface NobBloodlineGuide {
  winCondition: string;
  tips: string[];
}

export function bloodlineGuide(type: string | null | undefined, locale: Locale): NobBloodlineGuide {
  const vi = locale === "vi";
  if (type === "VAMPIRE") {
    return {
      winCondition: vi
        ? "Giúp phe Ma Cà Rồng thắng vòng để nhận Điểm Trăng. Khi một hoặc nhiều người đạt điểm mục tiêu, người có tổng Điểm Trăng cao nhất thắng ván."
        : "Help the Vampire faction win rounds to earn Moon Points. Once one or more players reach the target, the player with the highest total wins the game.",
      tips: vi
        ? [
            "Giữ kín gia tộc khi chưa cần công khai và quan sát những người đang bảo vệ nhau.",
            "Ưu tiên loại hoặc làm suy yếu Ma Sói có bậc mạnh; khi so gia tộc, bậc số nhỏ hơn có lợi thế.",
          ]
        : [
            "Keep your bloodline hidden until revealing it creates an advantage, and watch who protects whom.",
            "Prioritize eliminating or weakening high-value Werewolves; lower rank numbers have the advantage in the bloodline comparison.",
          ],
    };
  }
  if (type === "WEREWOLF") {
    return {
      winCondition: vi
        ? "Giúp phe Ma Sói thắng vòng để nhận Điểm Trăng. Khi một hoặc nhiều người đạt điểm mục tiêu, người có tổng Điểm Trăng cao nhất thắng ván."
        : "Help the Werewolf faction win rounds to earn Moon Points. Once one or more players reach the target, the player with the highest total wins the game.",
      tips: vi
        ? [
            "Suy luận đồng minh qua hành động và tránh để phe Ma Cà Rồng xác định toàn bộ đội hình quá sớm.",
            "Bảo vệ Ma Sói có bậc mạnh và nhắm vào Ma Cà Rồng bậc nhỏ; khi so gia tộc, bậc số nhỏ hơn có lợi thế.",
          ]
        : [
            "Infer allies from their actions and avoid letting Vampires map your whole faction too early.",
            "Protect strong Werewolves and target low-rank Vampires; lower rank numbers have the advantage in the bloodline comparison.",
          ],
    };
  }
  if (type === "HALFBLOOD") {
    return {
      winCondition: vi
        ? "Sống sót đến cuối vòng để được nhận Điểm Trăng cùng phe thắng. Nếu bạn còn sống và giữ Hy Vọng Cuối Cùng, Con Lai thắng vòng. Người có tổng Điểm Trăng cao nhất khi đạt điểm mục tiêu sẽ thắng ván."
        : "Survive to the end of the round to earn Moon Points with the winning faction. If you are alive while holding Last Hope, Halfblood wins the round. The player with the highest total when the target is reached wins the game.",
      tips: vi
        ? [
            "Ưu tiên sống sót và tránh bộc lộ mình là Con Lai quá sớm.",
            "Nếu có Hy Vọng Cuối Cùng, hãy bảo vệ lá bài và bản thân đến lúc Công Khai Gia Tộc.",
          ]
        : [
            "Prioritize survival and avoid revealing that you are Halfblood too early.",
            "If you have Last Hope, protect both the card and yourself until Bloodline Reveal.",
          ],
    };
  }
  return {
    winCondition: vi ? "Gia tộc của bạn chưa được xác định." : "Your bloodline is not known yet.",
    tips: [],
  };
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
