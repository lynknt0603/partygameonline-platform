import { describe, it, expect } from "vitest";
import { formatCurrentElo } from "./nobElo";
import { parseNobTiming, NOB_DEFAULT_TIMING } from "./nobTiming";

describe("Night of Bloodlines - ELO formatting", () => {
  it("returns null if eloDelta is not a number", () => {
    expect(formatCurrentElo({ elo: 1200, eloDelta: undefined as unknown as number, newElo: 1200 })).toBeNull();
  });

  it("formats positive eloDelta with plus sign", () => {
    expect(formatCurrentElo({ elo: 1200, eloDelta: 25, newElo: 1225 })).toBe("1225 (+25)");
  });

  it("formats negative eloDelta correctly", () => {
    expect(formatCurrentElo({ elo: 1200, eloDelta: -15, newElo: 1185 })).toBe("1185 (-15)");
  });

  it("formats neutral zero eloDelta with plus-minus sign", () => {
    expect(formatCurrentElo({ elo: 1200, eloDelta: 0, newElo: 1200 })).toBe("1200 (±0)");
  });
});

describe("Night of Bloodlines - Timing Parser", () => {
  it("returns default timing for empty object", () => {
    const timing = parseNobTiming({});
    expect(timing.draftPickSeconds).toBe(NOB_DEFAULT_TIMING.draftPickSeconds);
    expect(timing.reactionDecisionSeconds).toBe(NOB_DEFAULT_TIMING.reactionDecisionSeconds);
  });

  it("clamps values exceeding limits", () => {
    const timing = parseNobTiming({
      draftPickSeconds: 9999,
      reactionDecisionSeconds: 1,
    });
    expect(timing.draftPickSeconds).toBe(120); // max is 120
    expect(timing.reactionDecisionSeconds).toBe(5); // min is 5
  });

  it("parses valid numbers correctly", () => {
    const timing = parseNobTiming({
      draftPickSeconds: 45,
      reactionDecisionSeconds: 15,
    });
    expect(timing.draftPickSeconds).toBe(45);
    expect(timing.reactionDecisionSeconds).toBe(15);
  });
});
