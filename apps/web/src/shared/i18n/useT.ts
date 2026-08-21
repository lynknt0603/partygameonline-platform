import { translate, type MessageKey } from "./messages";
import { useLocaleStore } from "./useLocaleStore";

export function useT(): (key: MessageKey) => string {
  const locale = useLocaleStore((state) => state.locale);
  return (key) => translate(locale, key);
}

export function useLocale(): "vi" | "en" {
  return useLocaleStore((state) => state.locale);
}
