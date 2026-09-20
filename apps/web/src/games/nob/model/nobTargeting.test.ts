import { describe, expect, it } from "vitest";
import { nobSeatTargetState } from "./nobTargeting";

describe("nobSeatTargetState", () => {
  it("dims the actor and first target while keeping remaining Shapeshifter targets selectable", () => {
    const common = {
      pendingType: "CHOOSE_TARGET",
      allowedTargetIds: ["p3", "p4"],
      alive: true,
      frozen: false,
      actorId: "p1",
      hideActor: false,
    };

    expect(nobSeatTargetState({ ...common, playerId: "p1" })).toEqual({
      targetable: false,
      blocked: true,
      actorHighlighted: false,
    });
    expect(nobSeatTargetState({ ...common, playerId: "p2" })).toEqual({
      targetable: false,
      blocked: true,
      actorHighlighted: false,
    });
    expect(nobSeatTargetState({ ...common, playerId: "p3" })).toEqual({
      targetable: true,
      blocked: false,
      actorHighlighted: false,
    });
  });

  it("keeps the current actor highlight outside target selection", () => {
    expect(nobSeatTargetState({
      pendingType: "SHAPE_SWAP",
      allowedTargetIds: [],
      playerId: "p1",
      alive: true,
      frozen: false,
      actorId: "p1",
      hideActor: false,
    })).toEqual({
      targetable: false,
      blocked: false,
      actorHighlighted: true,
    });
  });
});
