export interface LiarsNumberSettings {
  turnSeconds: number;
}

export const LIARS_NUMBER_TURN_PRESETS = [0, 5, 10, 15, 20, 25, 30, 45, 60] as const;
export const LIARS_NUMBER_DEFAULT_SETTINGS: LiarsNumberSettings = { turnSeconds: 0 };

export function liarsNumberSettingsFromUnknown(value: unknown): LiarsNumberSettings | null {
  if (!value || typeof value !== "object") return null;
  const raw = (value as Record<string, unknown>).liarsNumber;
  if (!raw || typeof raw !== "object") return null;
  const turnSeconds = (raw as Record<string, unknown>).turnSeconds;
  return {
    turnSeconds: typeof turnSeconds === "number" && LIARS_NUMBER_TURN_PRESETS.includes(turnSeconds as (typeof LIARS_NUMBER_TURN_PRESETS)[number])
      ? turnSeconds
      : 0,
  };
}
