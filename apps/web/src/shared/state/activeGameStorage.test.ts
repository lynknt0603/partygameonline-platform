import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { clearActiveGame, readActiveGame, saveActiveGame, checkActiveGameConflict } from "./activeGameStorage";

describe("activeGameStorage", () => {
  let store: Record<string, string> = {};

  beforeAll(() => {
    const mockStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    const events: string[] = [];
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: mockStorage,
        dispatchEvent: (e: Event) => {
          events.push(e.type);
          return true;
        },
        _events: events,
      },
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      configurable: true,
    });
  });

  afterAll(() => {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { localStorage?: unknown }).localStorage;
  });

  beforeEach(() => {
    store = {};
    const win = (globalThis as unknown as { window?: { _events?: string[] } }).window;
    if (win?._events) win._events.length = 0;
  });

  it("saves and reads active game session and dispatches pgo:activeGame event", () => {
    saveActiveGame({ roomId: "LCHU5PTV", gameId: "blood-bound", gameTitle: "Huyết Thệ" });
    const session = readActiveGame();
    expect(session).not.toBeNull();
    expect(session?.roomId).toBe("LCHU5PTV");
    expect(session?.gameId).toBe("blood-bound");
    const win = (globalThis as unknown as { window?: { _events?: string[] } }).window;
    expect(win?._events).toContain("pgo:activeGame");
  });

  it("ignores demo rooms from persistence", () => {
    saveActiveGame({ roomId: "demo-blood-bound", gameId: "blood-bound" });
    expect(readActiveGame()).toBeNull();
  });

  it("clears active game session unconditionally and dispatches event", () => {
    saveActiveGame({ roomId: "ROOM123", gameId: "nob" });
    const win = (globalThis as unknown as { window?: { _events?: string[] } }).window;
    if (win?._events) win._events.length = 0;

    clearActiveGame();
    expect(readActiveGame()).toBeNull();
    expect(win?._events).toContain("pgo:activeGame");
  });

  it("clears active game only if roomId matches when targetRoomId provided", () => {
    saveActiveGame({ roomId: "ROOM123", gameId: "nob" });
    clearActiveGame("DIFFERENT_ROOM");
    expect(readActiveGame()?.roomId).toBe("ROOM123");

    clearActiveGame("room123");
    expect(readActiveGame()).toBeNull();
  });

  describe("checkActiveGameConflict", () => {
    it("returns false when there is no active game", () => {
      expect(checkActiveGameConflict(null, "ROOM123")).toBe(false);
      expect(checkActiveGameConflict(null, undefined)).toBe(false);
      expect(checkActiveGameConflict(null, "")).toBe(false);
    });

    it("returns false when targetRoomId matches active game roomId (case-insensitive)", () => {
      const active = { roomId: "LCHU5PTV", gameId: "blood-bound", joinedAt: Date.now() };
      expect(checkActiveGameConflict(active, "LCHU5PTV")).toBe(false);
      expect(checkActiveGameConflict(active, "lchu5ptv")).toBe(false);
      expect(checkActiveGameConflict(active, "  LCHU5PTV  ")).toBe(false);
    });

    it("returns true when player tries to create a new room while in active match", () => {
      const active = { roomId: "LCHU5PTV", gameId: "blood-bound", joinedAt: Date.now() };
      expect(checkActiveGameConflict(active, undefined)).toBe(true);
      expect(checkActiveGameConflict(active, null)).toBe(true);
      expect(checkActiveGameConflict(active, "")).toBe(true);
      expect(checkActiveGameConflict(active, "   ")).toBe(true);
    });

    it("returns true when player tries to join a different room", () => {
      const active = { roomId: "LCHU5PTV", gameId: "blood-bound", joinedAt: Date.now() };
      expect(checkActiveGameConflict(active, "OTHER_ROOM")).toBe(true);
      expect(checkActiveGameConflict(active, "ROOM456")).toBe(true);
    });
  });

  describe("crash recovery & abandon lifecycle", () => {
    it("preserves active game session on simulated browser crash/restart", () => {
      // User is in a match
      saveActiveGame({ roomId: "CRASH_ROOM", gameId: "blood-bound", gameTitle: "Huyết Thệ" });

      // Simulate browser crash and restart by reading anew
      const restored = readActiveGame();
      expect(restored).not.toBeNull();
      expect(restored?.roomId).toBe("CRASH_ROOM");

      // Verify conflict still prevents joining other rooms until explicitly abandoned
      expect(checkActiveGameConflict(restored, "NEW_ROOM")).toBe(true);

      // User confirms abandon
      clearActiveGame("CRASH_ROOM");
      expect(readActiveGame()).toBeNull();
      expect(checkActiveGameConflict(readActiveGame(), "NEW_ROOM")).toBe(false);
    });

    it("expires sessions older than 2 hours", () => {
      const expiredTimestamp = Date.now() - (3 * 60 * 60 * 1000); // 3 hours ago
      store["pgo.activeGame"] = JSON.stringify({
        roomId: "OLD_ROOM",
        gameId: "blood-bound",
        joinedAt: expiredTimestamp,
      });

      // Reading expired session clears it and returns null
      expect(readActiveGame()).toBeNull();
      expect(store["pgo.activeGame"]).toBeUndefined();
    });
  });
});
