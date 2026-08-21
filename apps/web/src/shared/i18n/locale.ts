export type Locale = "vi" | "en";

export const LOCALE_STORAGE_KEY = "boardverse_locale";

export function isLocale(value: unknown): value is Locale {
  return value === "vi" || value === "en";
}

export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}
