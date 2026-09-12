export interface BloodBoundSettings {
  turnSeconds: number;
  interventionSeconds: number;
}

export const BLOOD_BOUND_TURN_PRESETS = [15, 20, 30, 45, 60] as const;
export const BLOOD_BOUND_INTERVENTION_PRESETS = [5, 10, 15, 20, 30] as const;

export const BLOOD_BOUND_DEFAULT_SETTINGS: BloodBoundSettings = {
  turnSeconds: 30,
  interventionSeconds: 15,
};

export function bloodBoundSettingsFromUnknown(value: unknown): BloodBoundSettings | null {
  if (!value || typeof value !== "object") return null;
  const raw = (value as Record<string, unknown>).bloodBound;
  if (!raw || typeof raw !== "object") return null;
  const turnSeconds = (raw as Record<string, unknown>).turnSeconds;
  const interventionSeconds = (raw as Record<string, unknown>).interventionSeconds;
  return {
    turnSeconds:
      typeof turnSeconds === "number" && BLOOD_BOUND_TURN_PRESETS.includes(turnSeconds as (typeof BLOOD_BOUND_TURN_PRESETS)[number])
        ? turnSeconds
        : BLOOD_BOUND_DEFAULT_SETTINGS.turnSeconds,
    interventionSeconds:
      typeof interventionSeconds === "number" &&
      BLOOD_BOUND_INTERVENTION_PRESETS.includes(interventionSeconds as (typeof BLOOD_BOUND_INTERVENTION_PRESETS)[number])
        ? interventionSeconds
        : BLOOD_BOUND_DEFAULT_SETTINGS.interventionSeconds,
  };
}
