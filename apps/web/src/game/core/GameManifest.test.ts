import { describe, it, expect } from "vitest";
import { playerRangeLabel } from "./GameManifest";

describe("GameManifest playerRangeLabel", () => {
  it("formats single player capacity when min equals max", () => {
    expect(playerRangeLabel({ minPlayers: 4, maxPlayers: 4 })).toBe("4 players");
  });

  it("formats player range with en-dash when min differs from max", () => {
    expect(playerRangeLabel({ minPlayers: 2, maxPlayers: 8 })).toBe("2–8 players");
  });
});
