import { describe, it, expect } from "vitest";
import {
  createInitialNobGame,
  validateNobAction,
  resolveDraftPick,
  resolveHunterDecision,
  resolveReaction,
  evaluateNobVictory,
  checkAndApplyVictory,
} from "./nobRuleEngine";
import type { NobPlayerPublic } from "./nobTypes";

describe("nobRuleEngine - Game Setup & Initial State", () => {
  const players = [
    { playerId: "p1", displayName: "Alice" },
    { playerId: "p2", displayName: "Bob" },
    { playerId: "p3", displayName: "Charlie" },
    { playerId: "p4", displayName: "David" },
  ];

  it("initializes game with correct player setup and draft phase", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    expect(game.roomId).toBe("room-1");
    expect(game.phase).toBe("DRAFT_PICK_1");
    expect(game.players).toHaveLength(4);
    expect(game.players[0].you).toBe(true);
    expect(game.players[1].you).toBe(false);
    expect(game.myDraftHand).toHaveLength(3);
    expect(game.finished).toBe(false);
  });
});

describe("nobRuleEngine - Action Validation", () => {
  const players = [
    { playerId: "p1", displayName: "Alice" },
    { playerId: "p2", displayName: "Bob" },
  ];

  it("rejects actions when game is already finished", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    game.finished = true;
    const result = validateNobAction(game, { type: "NOB_DRAFT_PICK", cardInstanceId: "draft-1" }, "p1");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Trò chơi đã kết thúc");
  });

  it("rejects actions from dead players", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    game.players[0].alive = false;
    const result = validateNobAction(game, { type: "NOB_DRAFT_PICK", cardInstanceId: "draft-1" }, "p1");
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("bị loại");
  });

  it("validates draft picks correctly", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    // Card not in draft hand
    const invalidPick = validateNobAction(game, { type: "NOB_DRAFT_PICK", cardInstanceId: "non-existent" }, "p1");
    expect(invalidPick.valid).toBe(false);

    // Card in draft hand
    const validPick = validateNobAction(game, { type: "NOB_DRAFT_PICK", cardInstanceId: "draft-1" }, "p1");
    expect(validPick.valid).toBe(true);
  });

  it("validates night phase card submissions", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    game.phase = "SHADOW_STALKER";
    game.myHand = [
      { instanceId: "c1", cardCode: "NOB-SS-01", roleType: "SHADOW_STALKER", number: 1 },
      { instanceId: "c2", cardCode: "NOB-FK-01", roleType: "FERAL_KILLER", number: 1 },
    ];

    // Card role matches phase
    const match = validateNobAction(game, { type: "NOB_PHASE_SUBMIT", cardInstanceId: "c1" }, "p1");
    expect(match.valid).toBe(true);

    // Card role mismatches phase
    const mismatch = validateNobAction(game, { type: "NOB_PHASE_SUBMIT", cardInstanceId: "c2" }, "p1");
    expect(mismatch.valid).toBe(false);
    expect(mismatch.reason).toContain("không khớp");
  });

  it("validates target choices against allowedTargetIds", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    game.myPendingDecision = {
      type: "CHOOSE_TARGET",
      actorPlayerId: "p1",
      allowedTargetIds: ["p2"],
      allowedOptions: [],
    };

    const validTarget = validateNobAction(game, { type: "NOB_CHOOSE_TARGET", targetPlayerId: "p2" }, "p1");
    expect(validTarget.valid).toBe(true);

    const invalidTarget = validateNobAction(game, { type: "NOB_CHOOSE_TARGET", targetPlayerId: "p999" }, "p1");
    expect(invalidTarget.valid).toBe(false);
  });
});

describe("nobRuleEngine - Draft Resolution & Transitions", () => {
  const players = [
    { playerId: "p1", displayName: "Alice" },
    { playerId: "p2", displayName: "Bob" },
  ];

  it("moves picked card from draft hand to player hand", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    const nextGame = resolveDraftPick(game, "p1", "draft-1");

    expect(nextGame.myHand).toHaveLength(1);
    expect(nextGame.myHand[0].instanceId).toBe("draft-1");
    expect(nextGame.myDraftHand).toHaveLength(2);
  });

  it("transitions from DRAFT_PICK_1 to DRAFT_PICK_2 when all players pick", () => {
    let game = createInitialNobGame("room-1", players, "p1");
    game = resolveDraftPick(game, "p1", "draft-1");
    // Player 1 submitted, waiting for Player 2
    expect(game.phase).toBe("DRAFT_PICK_1");

    // Player 2 submits
    game = resolveDraftPick(game, "p2", "draft-2");
    expect(game.phase).toBe("DRAFT_PICK_2");
    expect(game.submittedPlayerIds).toHaveLength(0);
  });

  it("transitions from DRAFT_PICK_2 to SHADOW_STALKER when round 2 draft ends", () => {
    let game = createInitialNobGame("room-1", players, "p1");
    game.phase = "DRAFT_PICK_2";
    game = resolveDraftPick(game, "p1", "draft-1");
    game = resolveDraftPick(game, "p2", "draft-2");

    expect(game.phase).toBe("SHADOW_STALKER");
  });
});

describe("nobRuleEngine - Hunter Decision & Reactions", () => {
  const players = [
    { playerId: "p1", displayName: "Alice" },
    { playerId: "p2", displayName: "Bob" },
    { playerId: "p3", displayName: "Charlie" },
  ];

  it("handles Hunter SPARE decision without eliminating target", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    game.myPendingDecision = {
      type: "HUNTER_DECISION",
      actorPlayerId: "p1",
      targetPlayerId: "p2",
      allowedTargetIds: ["p2"],
      allowedOptions: ["SPARE", "ELIMINATE"],
    };

    const nextGame = resolveHunterDecision(game, "p1", "SPARE");
    const p2 = nextGame.players.find((p) => p.playerId === "p2");
    expect(p2?.alive).toBe(true);
    expect(nextGame.announcement?.type).toBe("HUNTER_SPARED");
  });

  it("handles Hunter ELIMINATE decision and eliminates target", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    game.myPendingDecision = {
      type: "HUNTER_DECISION",
      actorPlayerId: "p1",
      targetPlayerId: "p2",
      allowedTargetIds: ["p2"],
      allowedOptions: ["SPARE", "ELIMINATE"],
    };

    const nextGame = resolveHunterDecision(game, "p1", "ELIMINATE");
    const p2 = nextGame.players.find((p) => p.playerId === "p2");
    expect(p2?.alive).toBe(false);
    expect(nextGame.announcement?.type).toBe("ELIMINATION_SUCCESS");
  });

  it("reflects damage back to attacker when VEIL_REVERSAL reaction is used", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    game.currentActorPlayerId = "p1"; // Attacker
    game.myPendingDecision = {
      type: "REACTION",
      actorPlayerId: "p1",
      targetPlayerId: "p2",
      allowedTargetIds: [],
      allowedOptions: ["VEIL_REVERSAL"],
    };

    const nextGame = resolveReaction(game, "p2", "VEIL_REVERSAL");
    const attacker = nextGame.players.find((p) => p.playerId === "p1");
    const target = nextGame.players.find((p) => p.playerId === "p2");

    expect(attacker?.alive).toBe(false); // Attacker gets eliminated
    expect(target?.alive).toBe(true);    // Target is saved
    expect(nextGame.announcement?.type).toBe("VEIL_REVERSAL");
  });

  it("grants moon mark when LAST_OFFERING reaction is used", () => {
    const game = createInitialNobGame("room-1", players, "p1");
    game.currentActorPlayerId = "p1";
    game.myPendingDecision = {
      type: "REACTION",
      actorPlayerId: "p1",
      targetPlayerId: "p2",
      allowedTargetIds: [],
      allowedOptions: ["LAST_OFFERING"],
    };

    const nextGame = resolveReaction(game, "p2", "LAST_OFFERING");
    const target = nextGame.players.find((p) => p.playerId === "p2");

    expect(target?.alive).toBe(false);
    expect(target?.moonMarkCount).toBe(1);
    expect(nextGame.announcement?.type).toBe("GLORIOUS_SACRIFICE");
  });
});

describe("nobRuleEngine - Victory Evaluation", () => {
  it("declares game over when only one player remains alive", () => {
    const players: NobPlayerPublic[] = [
      {
        playerId: "p1",
        displayName: "Alice",
        seat: 0,
        alive: true,
        publiclyRevealedBloodline: { type: "VAMPIRE", rank: 1 },
      },
      {
        playerId: "p2",
        displayName: "Bob",
        seat: 1,
        alive: false,
        publiclyRevealedBloodline: { type: "WEREWOLF", rank: 1 },
      },
    ];

    const victory = evaluateNobVictory(players);
    expect(victory.isOver).toBe(true);
    expect(victory.winnerPlayerIds).toEqual(["p1"]);
    expect(victory.winningBloodline).toBe("VAMPIRE");
  });

  it("updates view to GAME_OVER state upon victory", () => {
    const playersInfo = [
      { playerId: "p1", displayName: "Alice" },
      { playerId: "p2", displayName: "Bob" },
    ];
    let game = createInitialNobGame("room-1", playersInfo, "p1");
    game.players[1].alive = false; // Bob is eliminated

    game = checkAndApplyVictory(game);
    expect(game.phase).toBe("GAME_OVER");
    expect(game.finished).toBe(true);
    expect(game.winnerPlayerIds).toEqual(["p1"]);
  });
});
