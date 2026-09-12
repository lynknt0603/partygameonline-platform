import { describe, it, expect } from "vitest";
import { generateRandomRoomName, THEMATIC_ROOM_NAMES } from "./randomRoomNames";

describe("randomRoomNames utility", () => {
  it("generates a random room name with a 3-digit suffix for blood-bound", () => {
    const name = generateRandomRoomName("blood-bound", "vi");
    expect(name).toMatch(/#\d{3}$/);
    const baseName = name.replace(/\s*#\d{3}$/, "");
    expect(THEMATIC_ROOM_NAMES["blood-bound"].vi).toContain(baseName);
  });

  it("generates English names when locale is en", () => {
    const name = generateRandomRoomName("blood-bound", "en");
    expect(name).toMatch(/#\d{3}$/);
    const baseName = name.replace(/\s*#\d{3}$/, "");
    expect(THEMATIC_ROOM_NAMES["blood-bound"].en).toContain(baseName);
  });

  it("falls back to default names if unknown gameId is provided", () => {
    const name = generateRandomRoomName("unknown-game", "vi");
    expect(name).toMatch(/#\d{3}$/);
    const baseName = name.replace(/\s*#\d{3}$/, "");
    expect(THEMATIC_ROOM_NAMES.default.vi).toContain(baseName);
  });

  it("generates names under 40 characters (server limit)", () => {
    for (let i = 0; i < 50; i++) {
      const nameVi = generateRandomRoomName("blood-bound", "vi");
      const nameEn = generateRandomRoomName("blood-bound", "en");
      expect(nameVi.length).toBeLessThanOrEqual(40);
      expect(nameEn.length).toBeLessThanOrEqual(40);
    }
  });
});
