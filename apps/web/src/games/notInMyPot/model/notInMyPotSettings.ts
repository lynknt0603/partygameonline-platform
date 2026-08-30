export interface NotInMyPotSettings {
  turnSeconds: number;
  showActionHistory: boolean;
}

export const NIMP_DEFAULT_SETTINGS: NotInMyPotSettings = {
  turnSeconds: 30,
  showActionHistory: true,
};

export const NIMP_TURN_PRESETS = [10, 15, 20, 30, 45, 60, 90, 120] as const;

export function parseNotInMyPotSettings(value: unknown): NotInMyPotSettings {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const rawSeconds = typeof record.turnSeconds === "number" ? record.turnSeconds : Number(record.turnSeconds);
  const turnSeconds = Number.isFinite(rawSeconds) && rawSeconds >= 10 && rawSeconds <= 120
    ? Math.round(rawSeconds)
    : NIMP_DEFAULT_SETTINGS.turnSeconds;
  return {
    turnSeconds,
    showActionHistory: typeof record.showActionHistory === "boolean"
      ? record.showActionHistory
      : NIMP_DEFAULT_SETTINGS.showActionHistory,
  };
}

export function notInMyPotSettingsFromUnknown(value: unknown): NotInMyPotSettings | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const nested = record.notInMyPot ?? record["not-in-my-pot"];
  if (nested && typeof nested === "object") {
    return parseNotInMyPotSettings(nested);
  }
  if ("turnSeconds" in record || "showActionHistory" in record) {
    return parseNotInMyPotSettings(record);
  }
  return null;
}
