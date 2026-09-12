import { describe, it, expect } from "vitest";
import { resolveNextBloodBoundView } from "./useBloodBoundGame";
import type { BloodBoundView } from "./bloodBoundTypes";

function createMockView(roomId: string, version: number, phase: BloodBoundView["phase"] = "ATTACK_CHOICE"): BloodBoundView {
  return {
    roomId,
    gameId: "blood-bound",
    phase,
    version,
    you: "p1",
    roundNumber: 1,
    players: [],
    daggerHolderPlayerId: "p1",
    currentTargetPlayerId: null,
    intervenedByPlayerId: null,
    forcedAttackTargetId: null,
    capturedPlayerId: null,
    winnerClan: null,
    mySecretCard: null,
    leftNeighborClue: null,
    publicLog: [],
  };
}

describe("useBloodBoundGame - resolveNextBloodBoundView", () => {
  it("accepts new room view immediately even if new room has a lower version number", () => {
    const roomAView = createMockView("ROOM-A", 12, "ATTACK_CHOICE");
    const roomBView = createMockView("ROOM-B", 1, "LOOK_LEFT");

    // User is now in ROOM-B
    const resolved = resolveNextBloodBoundView(roomAView, roomBView, "ROOM-B");
    expect(resolved?.roomId).toBe("ROOM-B");
    expect(resolved?.version).toBe(1);
    expect(resolved?.phase).toBe("LOOK_LEFT");
  });

  it("accepts new room view immediately even if old room was in GAME_OVER", () => {
    const roomAView = createMockView("ROOM-A", 20, "GAME_OVER");
    const roomBView = createMockView("ROOM-B", 1, "LOOK_LEFT");

    const resolved = resolveNextBloodBoundView(roomAView, roomBView, "ROOM-B");
    expect(resolved?.roomId).toBe("ROOM-B");
    expect(resolved?.phase).toBe("LOOK_LEFT");
  });

  it("rejects snapshot or websocket payload if roomId does not match active room", () => {
    const roomBView = createMockView("ROOM-B", 2, "ATTACK_CHOICE");
    const staleRoomAView = createMockView("ROOM-A", 15, "GAME_OVER");

    // Active room is ROOM-B, stale packet from ROOM-A arrives
    const resolved = resolveNextBloodBoundView(roomBView, staleRoomAView, "ROOM-B");
    expect(resolved?.roomId).toBe("ROOM-B");
    expect(resolved?.version).toBe(2);
  });

  it("advances version within the same room and ignores stale older versions", () => {
    const v1 = createMockView("ROOM-B", 1, "LOOK_LEFT");
    const v2 = createMockView("ROOM-B", 2, "ATTACK_CHOICE");
    const staleV1 = createMockView("ROOM-B", 1, "LOOK_LEFT");

    const resolved = resolveNextBloodBoundView(v1, v2, "ROOM-B");
    expect(resolved?.version).toBe(2);

    const ignored = resolveNextBloodBoundView(resolved, staleV1, "ROOM-B");
    expect(ignored?.version).toBe(2);
  });

  it("preserves GAME_OVER in the same room when out-of-order phase message arrives", () => {
    const gameOver = createMockView("ROOM-B", 10, "GAME_OVER");
    const oldPhase = createMockView("ROOM-B", 10, "ATTACK_CHOICE");

    const resolved = resolveNextBloodBoundView(gameOver, oldPhase, "ROOM-B");
    expect(resolved?.phase).toBe("GAME_OVER");
  });
});
