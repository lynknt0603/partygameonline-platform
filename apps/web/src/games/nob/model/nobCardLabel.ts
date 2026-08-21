import type { Locale } from "@/shared/i18n/locale";
import { describeNobCard } from "../assets/nobCardMeta";

const CODE = /NOB-[A-Z0-9-]+/g;

export function nobCardName(cardCode: string | null | undefined, locale: Locale): string {
  if (!cardCode) {
    return "";
  }
  return describeNobCard(cardCode, locale)?.name ?? cardCode;
}

export function replaceNobCardCodes(text: string, locale: Locale): string {
  return text.replace(CODE, (code) => nobCardName(code, locale) || code);
}
