import { create } from "zustand";
import { getStoredLocale, setStoredLocale, type Locale } from "./locale";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const initial = getStoredLocale() ?? "vi";

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: initial,
  setLocale: (locale) => {
    setStoredLocale(locale);
    set({ locale });
  },
}));
