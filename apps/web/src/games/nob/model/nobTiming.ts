export interface NobTiming {
  draftPickSeconds: number;
  phaseSubmitSeconds: number;
  targetDecisionSeconds: number;
  optionDecisionSeconds: number;
  hunterDecisionSeconds: number;
  reactionDecisionSeconds: number;
  resolutionCardDisplayMs: number;
  announcementDisplayMs: number;
  roundSummarySeconds: number;
}

export const NOB_DEFAULT_TIMING: NobTiming = {
  draftPickSeconds: 30,
  phaseSubmitSeconds: 30,
  targetDecisionSeconds: 30,
  optionDecisionSeconds: 30,
  hunterDecisionSeconds: 30,
  reactionDecisionSeconds: 10,
  resolutionCardDisplayMs: 2500,
  announcementDisplayMs: 3000,
  roundSummarySeconds: 30,
};

export const NOB_GAMEPLAY_PRESETS = [10, 15, 20, 30, 45, 60, 90, 120] as const;
export const NOB_REACTION_PRESETS = [5, 10, 15, 20, 30] as const;

export function parseNobTiming(value: unknown): NobTiming {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const num = (key: keyof NobTiming, fallback: number, min: number, max: number) => {
    const raw = record[key];
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, Math.round(n)));
  };
  return {
    draftPickSeconds: num("draftPickSeconds", 30, 10, 120),
    phaseSubmitSeconds: num("phaseSubmitSeconds", 30, 10, 120),
    targetDecisionSeconds: num("targetDecisionSeconds", 30, 10, 120),
    optionDecisionSeconds: num("optionDecisionSeconds", 30, 10, 120),
    hunterDecisionSeconds: num("hunterDecisionSeconds", 30, 10, 120),
    reactionDecisionSeconds: num("reactionDecisionSeconds", 10, 5, 30),
    resolutionCardDisplayMs: num("resolutionCardDisplayMs", 2500, 500, 10_000),
    announcementDisplayMs: num("announcementDisplayMs", 3000, 500, 15_000),
    roundSummarySeconds: num("roundSummarySeconds", 30, 10, 120),
  };
}

export function nobSettingsFromUnknown(value: unknown): NobTiming | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record.nob && typeof record.nob === "object") {
    return parseNobTiming(record.nob);
  }
  if ("draftPickSeconds" in record) {
    return parseNobTiming(record);
  }
  return null;
}
