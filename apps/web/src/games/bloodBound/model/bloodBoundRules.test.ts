import { describe, it, expect } from "vitest";
import {
  initBloodBoundGame,
  processAcknowledgeLookLeft,
  validateAttack,
  processAttack,
  validateIntervene,
  processIntervene,
  processPassIntervention,
  processWoundReveal,
  applyRoleAbility,
  validateAbility,
  canAbilityTargetSelf,
  getEligibleAbilityTargets,
  isBloodBoundDemoRoom,
  requiresExitConfirmation,
  type PlayerInitInfo,
} from "./bloodBoundRules";

describe("Blood Bound Rules - Game Initialization", () => {
  const players = [
    { playerId: "p1", displayName: "Alice" },
    { playerId: "p2", displayName: "Bob" },
    { playerId: "p3", displayName: "Charlie" },
    { playerId: "p4", displayName: "David" },
    { playerId: "p5", displayName: "Eve" },
    { playerId: "p6", displayName: "Frank" },
  ];

  it("divides players equally into Rose and Fan clans", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-1", players, "p1");
    expect(view.players).toHaveLength(6);
    expect(view.phase).toBe("LOOK_LEFT");
    expect(view.daggerHolderPlayerId).toBe("p1");

    // 3 Rose, 3 Fan
    const roseCount = Object.values(secretCards).filter((c) => c.clan === "ROSE").length;
    const fanCount = Object.values(secretCards).filter((c) => c.clan === "FAN").length;
    expect(roseCount).toBe(3);
    expect(fanCount).toBe(3);
  });

  it("supports MAX 8 players (4 Rose vs 4 Fan)", () => {
    const eightPlayers = [
      ...players,
      { playerId: "p7", displayName: "Grace" },
      { playerId: "p8", displayName: "Heidi" },
    ];
    const { view, secretCards } = initBloodBoundGame("room-bb-max", eightPlayers, "p1");
    expect(view.players).toHaveLength(8);
    const roseCount = Object.values(secretCards).filter((c) => c.clan === "ROSE").length;
    const fanCount = Object.values(secretCards).filter((c) => c.clan === "FAN").length;
    expect(roseCount).toBe(4);
    expect(fanCount).toBe(4);

    // Both clans have Leader (Rank 1)
    const roseLeader = Object.values(secretCards).find((c) => c.clan === "ROSE" && c.rank === 1);
    const fanLeader = Object.values(secretCards).find((c) => c.clan === "FAN" && c.rank === 1);
    expect(roseLeader).toBeDefined();
    expect(fanLeader).toBeDefined();
  });

  it("supports 7 players with Inquisitor role (3 Rose, 3 Fan, 1 Inquisitor)", () => {
    const sevenPlayers = [
      ...players,
      { playerId: "p7", displayName: "Grace" },
    ];
    const { view, secretCards } = initBloodBoundGame("room-bb-inq", sevenPlayers, "p1");
    expect(view.players).toHaveLength(7);
    const roseCount = Object.values(secretCards).filter((c) => c.clan === "ROSE").length;
    const fanCount = Object.values(secretCards).filter((c) => c.clan === "FAN").length;
    const inqCount = Object.values(secretCards).filter((c) => c.clan === "INQUISITOR").length;
    expect(roseCount).toBe(3);
    expect(fanCount).toBe(3);
    expect(inqCount).toBe(1);
    expect(secretCards["p7"].clan).toBe("INQUISITOR");
  });

  it("provides secret left-neighbor clue at start", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-1", players, "p1");
    // p1 seat is 0, left neighbor is seat 1 (p2)
    const p2Secret = secretCards["p2"];
    expect(view.leftNeighborClue?.clan).toBe(p2Secret.clan);
  });

  it("transitions from LOOK_LEFT to ATTACK_CHOICE upon acknowledge", () => {
    const { view } = initBloodBoundGame("room-bb-1", players, "p1");
    const nextView = processAcknowledgeLookLeft(view);
    expect(nextView.phase).toBe("ATTACK_CHOICE");
  });
});

describe("Blood Bound Rules - Attack & Intervention Mechanism", () => {
  const players = [
    { playerId: "p1", displayName: "Alice" },
    { playerId: "p2", displayName: "Bob" },
    { playerId: "p3", displayName: "Charlie" },
    { playerId: "p4", displayName: "David" },
    { playerId: "p5", displayName: "Eve" },
    { playerId: "p6", displayName: "Frank" },
  ];

  it("validates attack permissions correctly", () => {
    const { view } = initBloodBoundGame("room-bb-1", players, "p1");
    const readyView = processAcknowledgeLookLeft(view);

    // Dagger holder is p1. p2 cannot attack
    const invalidAttacker = validateAttack(readyView, "p2", "p3");
    expect(invalidAttacker.valid).toBe(false);

    // Cannot attack oneself
    const selfAttack = validateAttack(readyView, "p1", "p1");
    expect(selfAttack.valid).toBe(false);

    // Valid attack on p2
    const validAttack = validateAttack(readyView, "p1", "p2");
    expect(validAttack.valid).toBe(true);
  });

  it("opens intervention window on attack", () => {
    const { view } = initBloodBoundGame("room-bb-1", players, "p1");
    const readyView = processAcknowledgeLookLeft(view);
    const attackView = processAttack(readyView, "p2");

    expect(attackView.phase).toBe("INTERVENTION_WINDOW");
    expect(attackView.currentTargetPlayerId).toBe("p2");
  });

  it("validates intervention constraints", () => {
    const { view } = initBloodBoundGame("room-bb-1", players, "p1");
    const readyView = processAcknowledgeLookLeft(view);
    const attackView = processAttack(readyView, "p2");

    // Attacker (p1) cannot intervene
    expect(validateIntervene(attackView, "p1").valid).toBe(false);

    // Victim (p2) cannot intervene for themselves
    expect(validateIntervene(attackView, "p2").valid).toBe(false);

    // Ally (p3) can intervene if rank is not yet revealed
    expect(validateIntervene(attackView, "p3").valid).toBe(true);

    // If p3 already revealed rank, intervention is blocked
    attackView.players[2].hasRevealedRank = true;
    expect(validateIntervene(attackView, "p3").valid).toBe(false);
  });
});

describe("Blood Bound Rules - Wound Assignment & Victory Evaluation", () => {
  const players = [
    { playerId: "p1", displayName: "Alice" }, // Rose Leader (rank 1)
    { playerId: "p2", displayName: "Bob" },   // Rose Assassin (rank 2)
    { playerId: "p3", displayName: "Charlie" },// Rose Harlequin (rank 3)
    { playerId: "p4", displayName: "David" }, // Beast Leader (rank 1)
    { playerId: "p5", displayName: "Eve" },   // Beast Assassin (rank 2)
    { playerId: "p6", displayName: "Frank" }, // Beast Harlequin (rank 3)
  ];

  it("adds wound and transfers dagger to the victim when game continues", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-1", players, "p1");
    const readyView = processAcknowledgeLookLeft(view);
    const attackView = processAttack(readyView, "p4"); // p1 attacks p4 (David)
    const passView = processPassIntervention(attackView);

    // p4 takes wound and chooses COLOR token
    const woundedView = processWoundReveal(passView, secretCards, "COLOR");
    const p4 = woundedView.players.find((p) => p.playerId === "p4");

    expect(p4?.wounds).toBe(1);
    expect(p4?.revealedTokens[0].type).toBe("COLOR");
    expect(p4?.revealedTokens[0].value).toBe("GREEN");
    expect(woundedView.daggerHolderPlayerId).toBe("p4"); // p4 now holds the dagger!
    expect(woundedView.phase).toBe("ATTACK_CHOICE");
  });

  it("forces intervener to reveal RANK token and take the strike", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-1", players, "p1");
    const readyView = processAcknowledgeLookLeft(view);
    const attackView = processAttack(readyView, "p4"); // p1 attacks p4

    // p5 (Eve - Beast Assassin) intervenes to save David!
    const intervened = processIntervene(attackView, "p5", secretCards["p5"]);
    const woundedView = processWoundReveal(intervened, secretCards, "COLOR");
    const p5 = woundedView.players.find((p) => p.playerId === "p5");

    expect(p5?.wounds).toBe(1);
    // Even though COLOR was passed, intervener is forced to reveal RANK!
    expect(p5?.revealedTokens[0].type).toBe("RANK");
    expect(p5?.hasRevealedRank).toBe(true);
    expect(woundedView.daggerHolderPlayerId).toBe("p5");
  });

  it("shields player from wound if Guardian Shield is active", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-1", players, "p1");
    const readyView = processAcknowledgeLookLeft(view);

    // Apply shield to p4
    readyView.players[3].isShielded = true;
    const attackView = processAttack(readyView, "p4");
    const passView = processPassIntervention(attackView);
    const shieldedView = processWoundReveal(passView, secretCards, "COLOR");
    const p4 = shieldedView.players.find((p) => p.playerId === "p4");

    expect(p4?.wounds).toBe(0); // Shield absorbed wound
    expect(p4?.isShielded).toBe(false); // Shield consumed
  });

  it("VICTORY CASE 1: Attacker captures enemy LEADER -> Attacker wins", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-1", players, "p1");
    const readyView = processAcknowledgeLookLeft(view);

    // p4 is Beast Leader (rank 1). Give p4 3 wounds already
    readyView.players[3].wounds = 3;
    const attackView = processAttack(readyView, "p4");
    const passView = processPassIntervention(attackView);

    // 4th wound captures p4
    const gameOverView = processWoundReveal(passView, secretCards, "RANK");

    expect(gameOverView.phase).toBe("GAME_OVER");
    expect(gameOverView.capturedPlayerId).toBe("p4");
    // p1 (ROSE) captured enemy Leader -> ROSE wins!
    expect(gameOverView.winnerClan).toBe("ROSE");
  });

  it("VICTORY CASE 2: Attacker captures WRONG player (non-leader) -> Defending clan wins!", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-1", players, "p1");
    const readyView = processAcknowledgeLookLeft(view);

    // p5 is Beast Assassin (rank 2, NOT leader). Give p5 3 wounds
    readyView.players[4].wounds = 3;
    const attackView = processAttack(readyView, "p5");
    const passView = processPassIntervention(attackView);

    // 4th wound captures p5 (wrong person!)
    const gameOverView = processWoundReveal(passView, secretCards, "RANK");

    expect(gameOverView.phase).toBe("GAME_OVER");
    expect(gameOverView.capturedPlayerId).toBe("p5");
    // p1 (ROSE) attacked, but p5 is NOT the leader -> FAN clan wins!
    expect(gameOverView.winnerClan).toBe("FAN");
  });
});

describe("Blood Bound Rules - Character Abilities", () => {
  const players = [
    { playerId: "p1", displayName: "Alice" },
    { playerId: "p2", displayName: "Bob" },
  ];

  it("Assassin ability deals 1 direct wound", () => {
    const { view } = initBloodBoundGame("room-bb-1", players, "p1");
    const nextView = applyRoleAbility(view, "p1", 2, "p2");
    const p2 = nextView.players.find((p) => p.playerId === "p2");
    expect(p2?.wounds).toBe(1);
    expect(nextView.players[0].hasUsedAbility).toBe(true);
  });

  it("Alchemist ability heals 1 wound", () => {
    const { view } = initBloodBoundGame("room-bb-1", players, "p1");
    view.players[1].wounds = 2;
    const nextView = applyRoleAbility(view, "p1", 4, "p2");
    const p2 = nextView.players.find((p) => p.playerId === "p2");
    expect(p2?.wounds).toBe(1);
  });

  it("Guardian ability grants an active shield", () => {
    const { view } = initBloodBoundGame("room-bb-1", players, "p1");
    const nextView = applyRoleAbility(view, "p1", 6, "p2");
    const p2 = nextView.players.find((p) => p.playerId === "p2");
    expect(p2?.isShielded).toBe(true);
  });

  it("Harlequin ability places a mystery question token", () => {
    const { view } = initBloodBoundGame("room-bb-1", players, "p1");
    const nextView = applyRoleAbility(view, "p1", 3, "p2");
    const p2 = nextView.players.find((p) => p.playerId === "p2");
    expect(p2?.revealedTokens.some((t) => t.type === "QUESTION")).toBe(true);
  });

  it("Mentalist ability forces clue token reveal", () => {
    const { view } = initBloodBoundGame("room-bb-1", players, "p1");
    const nextView = applyRoleAbility(view, "p1", 5, "p2");
    const p2 = nextView.players.find((p) => p.playerId === "p2");
    expect(p2?.revealedTokens.some((t) => t.type === "CREST")).toBe(true);
  });

  it("Berserker ability deals 1 retaliatory wound", () => {
    const { view } = initBloodBoundGame("room-bb-1", players, "p1");
    const nextView = applyRoleAbility(view, "p1", 7, "p2");
    const p2 = nextView.players.find((p) => p.playerId === "p2");
    expect(p2?.wounds).toBe(1);
  });

  it("Assassin lethal wound on enemy Leader triggers GAME_OVER with attacker winning", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-1", [
      { playerId: "p1", displayName: "Alice" }, // Rose Assassin (rank 2)
      { playerId: "p2", displayName: "Bob" },   // Fan Leader (rank 1)
    ], "p1", {
      assignedRoles: {
        p1: { clan: "ROSE", rank: 2 },
        p2: { clan: "FAN", rank: 1 },
      },
    });

    // Bob already has 3 wounds
    view.players[1].wounds = 3;
    // Alice has revealed rank
    view.players[0].hasRevealedRank = true;

    const nextView = applyRoleAbility(view, "p1", 2, "p2", secretCards);
    expect(nextView.phase).toBe("GAME_OVER");
    expect(nextView.capturedPlayerId).toBe("p2");
    expect(nextView.winnerClan).toBe("ROSE");
  });

  it("Assassin lethal wound on enemy Non-Leader triggers GAME_OVER with wrongful capture defending clan winning", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-1", [
      { playerId: "p1", displayName: "Alice" }, // Rose Assassin (rank 2)
      { playerId: "p2", displayName: "Bob" },   // Fan Harlequin (rank 3)
    ], "p1", {
      assignedRoles: {
        p1: { clan: "ROSE", rank: 2 },
        p2: { clan: "FAN", rank: 3 },
      },
    });

    view.players[1].wounds = 3;
    view.players[0].hasRevealedRank = true;

    const nextView = applyRoleAbility(view, "p1", 2, "p2", secretCards);
    expect(nextView.phase).toBe("GAME_OVER");
    expect(nextView.capturedPlayerId).toBe("p2");
    expect(nextView.winnerClan).toBe("FAN");
  });
});

describe("Blood Bound Rules - Role Customization & Shuffling", () => {
  const sixPlayers = [
    { playerId: "p1", displayName: "Alice" },
    { playerId: "p2", displayName: "Bob" },
    { playerId: "p3", displayName: "Charlie" },
    { playerId: "p4", displayName: "David" },
    { playerId: "p5", displayName: "Eve" },
    { playerId: "p6", displayName: "Frank" },
  ];

  it("allows assigning a specific role (e.g. Assassin) to human player", () => {
    const { secretCards } = initBloodBoundGame("room-bb-custom", sixPlayers, "p1", {
      assignedRoles: {
        p1: { clan: "FAN", rank: 2 },
      },
    });

    expect(secretCards["p1"].clan).toBe("FAN");
    expect(secretCards["p1"].rank).toBe(2);
    expect(secretCards["p1"].roleInfo.roleName).toBe("Assassin");
  });

  it("allows specifying a custom starting dagger holder", () => {
    const { view } = initBloodBoundGame("room-bb-dagger", sixPlayers, "p1", {
      startingDaggerPlayerId: "p3",
    });

    expect(view.daggerHolderPlayerId).toBe("p3");
    expect(view.players.find((p) => p.playerId === "p3")?.isDaggerHolder).toBe(true);
    expect(view.players.find((p) => p.playerId === "p1")?.isDaggerHolder).toBe(false);
  });

  it("friendly fire lethal attack on own Leader awards victory to opponent clan", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-ff-1", [
      { playerId: "p1", displayName: "Alice" }, // Rose
      { playerId: "p2", displayName: "Bob" },   // Rose Leader (Rank 1)
    ], "p1", {
      assignedRoles: {
        p1: { clan: "ROSE", rank: 2 },
        p2: { clan: "ROSE", rank: 1 },
      },
    });

    view.players[1].wounds = 3;
    view.phase = "WOUND_ASSIGNMENT";
    view.currentTargetPlayerId = "p2";
    view.daggerHolderPlayerId = "p1";
    const nextView = processWoundReveal(view, secretCards, "RANK");
    expect(nextView.phase).toBe("GAME_OVER");
    expect(nextView.capturedPlayerId).toBe("p2");
    // Friendly fire suicide on own Leader -> FAN wins!
    expect(nextView.winnerClan).toBe("FAN");
  });

  it("friendly fire lethal attack on own teammate awards victory to opponent clan", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-ff-2", [
      { playerId: "p1", displayName: "Alice" }, // Rose
      { playerId: "p2", displayName: "Bob" },   // Rose Harlequin (Rank 3)
    ], "p1", {
      assignedRoles: {
        p1: { clan: "ROSE", rank: 2 },
        p2: { clan: "ROSE", rank: 3 },
      },
    });

    view.players[1].wounds = 3;
    view.phase = "WOUND_ASSIGNMENT";
    view.currentTargetPlayerId = "p2";
    view.daggerHolderPlayerId = "p1";
    const nextView = processWoundReveal(view, secretCards, "RANK");

    expect(nextView.phase).toBe("GAME_OVER");
    expect(nextView.capturedPlayerId).toBe("p2");
    // Friendly fire kill on own teammate -> FAN wins!
    expect(nextView.winnerClan).toBe("FAN");
  });

  it("friendly fire ability on own Leader awards victory to opponent clan", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-ff-3", [
      { playerId: "p1", displayName: "Alice" }, // Rose Assassin (Rank 2)
      { playerId: "p2", displayName: "Bob" },   // Rose Leader (Rank 1)
    ], "p1", {
      assignedRoles: {
        p1: { clan: "ROSE", rank: 2 },
        p2: { clan: "ROSE", rank: 1 },
      },
    });

    view.players[1].wounds = 3;
    view.players[0].hasRevealedRank = true;

    const nextView = applyRoleAbility(view, "p1", 2, "p2", secretCards);
    expect(nextView.phase).toBe("GAME_OVER");
    expect(nextView.capturedPlayerId).toBe("p2");
    // Rose shot own Leader -> FAN wins!
    expect(nextView.winnerClan).toBe("FAN");
  });

  it("rejects Berserker targeting self", () => {
    const { view } = initBloodBoundGame("room-bb-berserk", [
      { playerId: "p1", displayName: "Alice" },
      { playerId: "p2", displayName: "Bob" },
    ], "p1");

    view.phase = "ATTACK_CHOICE";
    view.players[0].hasRevealedRank = true;
    const check = validateAbility(view, "p1", 7, "p1");
    expect(check.valid).toBe(false);
    expect(check.reasonVi).toContain("chính mình");
  });

  it("Rank 8 Courtesan ability forces the next attack to target chosen player", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-rank8", [
      { playerId: "p1", displayName: "Alice" },
      { playerId: "p2", displayName: "Bob" },
      { playerId: "p3", displayName: "Charlie" },
      { playerId: "p4", displayName: "David" },
    ], "p1", {
      assignedRoles: {
        p1: { clan: "ROSE", rank: 8 },
        p2: { clan: "FAN", rank: 3 },
        p3: { clan: "FAN", rank: 4 },
        p4: { clan: "ROSE", rank: 5 },
      },
    });

    view.phase = "ATTACK_CHOICE";
    view.players[0].hasRevealedRank = true;

    // Use ability to force attack on p3
    const nextView = applyRoleAbility(view, "p1", 8, "p3", secretCards);
    expect(nextView.forcedAttackTargetId).toBe("p3");

    // Attacking p2 is rejected
    const invalidAttack = validateAttack(nextView, "p1", "p2");
    expect(invalidAttack.valid).toBe(false);
    expect(invalidAttack.reason).toContain("Mưu lược Mê Hoặc");

    // Attacking p3 is valid
    const validAttack = validateAttack(nextView, "p1", "p3");
    expect(validAttack.valid).toBe(true);

    // After processing attack, forcedAttackTargetId is cleared
    const afterAttackView = processAttack(nextView, "p3");
    expect(afterAttackView.forcedAttackTargetId).toBeNull();
  });

  it("VICTORY CASE: Inquisitor captured with 4 wounds wins solo victory", () => {
    const sevenPlayers = [
      { playerId: "p1", displayName: "Alice" }, // Rose
      { playerId: "p2", displayName: "Bob" },   // Fan
      { playerId: "p3", displayName: "Charlie" },
      { playerId: "p4", displayName: "David" },
      { playerId: "p5", displayName: "Eve" },
      { playerId: "p6", displayName: "Frank" },
      { playerId: "p7", displayName: "Inq" },   // Inquisitor
    ];
    const { view, secretCards } = initBloodBoundGame("room-bb-inq-win", sevenPlayers, "p1", {
      assignedRoles: {
        p1: { clan: "ROSE", rank: 1 },
        p7: { clan: "INQUISITOR", rank: 8 },
      },
    });

    const readyView = processAcknowledgeLookLeft(view);
    const inqPlayer = readyView.players.find((p) => p.playerId === "p7");
    if (inqPlayer) inqPlayer.wounds = 3;

    const attackView = processAttack(readyView, "p7");
    const passView = processPassIntervention(attackView);
    const gameOverView = processWoundReveal(passView, secretCards, "RANK");

    expect(gameOverView.phase).toBe("GAME_OVER");
    expect(gameOverView.capturedPlayerId).toBe("p7");
    expect(gameOverView.winnerClan).toBe("INQUISITOR");
  });

  it("VICTORY CASE: Inquisitor eliminated by lethal ability awards solo victory to Inquisitor", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-inq-ability", [
      { playerId: "p1", displayName: "Alice" }, // Rose Assassin
      { playerId: "p2", displayName: "Inq" },   // Inquisitor
    ], "p1", {
      assignedRoles: {
        p1: { clan: "ROSE", rank: 2 },
        p2: { clan: "INQUISITOR", rank: 8 },
      },
    });

    view.players[1].wounds = 3;
    view.players[0].hasRevealedRank = true;

    const nextView = applyRoleAbility(view, "p1", 2, "p2", secretCards);
    expect(nextView.phase).toBe("GAME_OVER");
    expect(nextView.capturedPlayerId).toBe("p2");
    expect(nextView.winnerClan).toBe("INQUISITOR");
  });

  it("Inquisitor revealing CREST generates INQUISITOR-CREST token value", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-inq-crest", [
      { playerId: "p1", displayName: "Alice" },
      { playerId: "p2", displayName: "Inq" },
    ], "p1", {
      assignedRoles: {
        p1: { clan: "ROSE", rank: 1 },
        p2: { clan: "INQUISITOR", rank: 8 },
      },
    });

    const readyView = processAcknowledgeLookLeft(view);
    const attackView = processAttack(readyView, "p2");
    const passView = processPassIntervention(attackView);
    const woundedView = processWoundReveal(passView, secretCards, "CREST");

    const inqPlayer = woundedView.players.find((p) => p.playerId === "p2");
    expect(inqPlayer?.revealedTokens[0].type).toBe("CREST");
    expect(inqPlayer?.revealedTokens[0].value).toBe("INQUISITOR-CREST");
  });
});

describe("Blood Bound Clue Deduction - deduceClanFromTokens", () => {
  it("deduces INQUISITOR from INQUISITOR-CREST token", async () => {
    const { deduceClanFromTokens } = await import("../components/BloodBoundSeatCard");
    const tokens = [{ type: "CREST", value: "INQUISITOR-CREST" }];
    expect(deduceClanFromTokens(tokens)).toBe("INQUISITOR");
  });

  it("deduces ROSE from ROSE-CREST token", async () => {
    const { deduceClanFromTokens } = await import("../components/BloodBoundSeatCard");
    const tokens = [{ type: "CREST", value: "ROSE-CREST" }];
    expect(deduceClanFromTokens(tokens)).toBe("ROSE");
  });

  it("deduces FAN from FAN-CREST token", async () => {
    const { deduceClanFromTokens } = await import("../components/BloodBoundSeatCard");
    const tokens = [{ type: "CREST", value: "FAN-CREST" }];
    expect(deduceClanFromTokens(tokens)).toBe("FAN");
  });

  it("deduces INQUISITOR from YELLOW color token if no crest", async () => {
    const { deduceClanFromTokens } = await import("../components/BloodBoundSeatCard");
    const tokens = [{ type: "COLOR", value: "YELLOW" }];
    expect(deduceClanFromTokens(tokens)).toBe("INQUISITOR");
  });
});

describe("Blood Bound Ability Targeting - canAbilityTargetSelf & getEligibleAbilityTargets", () => {
  const mockPlayers: import("./bloodBoundTypes").BloodBoundPlayerPublic[] = [
    { playerId: "p1", displayName: "Alice", wounds: 2, isShielded: false, hasRevealedRank: true, hasUsedAbility: false, revealedTokens: [], seatIndex: 0, isDaggerHolder: true },
    { playerId: "p2", displayName: "Bob", wounds: 1, isShielded: false, hasRevealedRank: false, hasUsedAbility: false, revealedTokens: [], seatIndex: 1, isDaggerHolder: false },
    { playerId: "p3", displayName: "Charlie", wounds: 4, isShielded: false, hasRevealedRank: false, hasUsedAbility: false, revealedTokens: [], seatIndex: 2, isDaggerHolder: false }, // captured
  ];

  it("Alchemist (Rank 4) can target self and is included in eligible targets", () => {
    expect(canAbilityTargetSelf(4)).toBe(true);
    const targets = getEligibleAbilityTargets(mockPlayers, "p1", 4);
    const targetIds = targets.map((t) => t.playerId);
    expect(targetIds).toContain("p1"); // Self included!
    expect(targetIds).toContain("p2");
    expect(targetIds).not.toContain("p3"); // Captured player excluded
  });

  it("Alchemist actually heals own wound when applying ability to self", () => {
    const { view } = initBloodBoundGame("room-heal-self", [
      { playerId: "p1", displayName: "Alice" },
      { playerId: "p2", displayName: "Bob" },
    ], "p1");

    view.phase = "ATTACK_CHOICE";
    view.players[0].wounds = 2;
    view.players[0].hasRevealedRank = true;

    // Apply Alchemist ability to self
    const nextView = applyRoleAbility(view, "p1", 4, "p1");
    expect(nextView.players[0].wounds).toBe(1);
    expect(nextView.publicLog.some((l) => l.textVi?.includes("Nhà giả kim"))).toBe(true);
  });

  it("Guardian (Rank 6) can target self to grant shield", () => {
    expect(canAbilityTargetSelf(6)).toBe(true);
    const targets = getEligibleAbilityTargets(mockPlayers, "p1", 6);
    expect(targets.map((t) => t.playerId)).toContain("p1");
  });

  it("Assassin (Rank 2) cannot target self", () => {
    expect(canAbilityTargetSelf(2)).toBe(false);
    const targets = getEligibleAbilityTargets(mockPlayers, "p1", 2);
    expect(targets.map((t) => t.playerId)).not.toContain("p1");
    expect(targets.map((t) => t.playerId)).toContain("p2");
  });

  it("Berserker (Rank 7) cannot target self", () => {
    expect(canAbilityTargetSelf(7)).toBe(false);
    const targets = getEligibleAbilityTargets(mockPlayers, "p1", 7);
    expect(targets.map((t) => t.playerId)).not.toContain("p1");
  });
});

describe("Blood Bound Demo Room Matching - isBloodBoundDemoRoom", () => {
  it("matches exact demo room identifiers", () => {
    expect(isBloodBoundDemoRoom("demo")).toBe(true);
    expect(isBloodBoundDemoRoom("demo-blood-bound")).toBe(true);
    expect(isBloodBoundDemoRoom("demo-bloodbound")).toBe(true);
    expect(isBloodBoundDemoRoom("demo-huyet-the")).toBe(true);
    expect(isBloodBoundDemoRoom("demo-huyetthe")).toBe(true);
    expect(isBloodBoundDemoRoom("demo-crimson-vow")).toBe(true);
    expect(isBloodBoundDemoRoom("DEMO-BLOOD-BOUND")).toBe(true);
  });

  it("matches demo- or demo_ prefix with Blood Bound keywords", () => {
    expect(isBloodBoundDemoRoom("demo-blood-bound-1")).toBe(true);
    expect(isBloodBoundDemoRoom("demo-bloodbound-table-9")).toBe(true);
    expect(isBloodBoundDemoRoom("demo-huyet-the-test")).toBe(true);
    expect(isBloodBoundDemoRoom("demo_crimson_vow_session")).toBe(true);
  });

  it("does NOT match real multiplayer rooms that merely contain the game name", () => {
    expect(isBloodBoundDemoRoom("blood-bound-1")).toBe(false);
    expect(isBloodBoundDemoRoom("bloodbound-room-42")).toBe(false);
    expect(isBloodBoundDemoRoom("room-blood-bound")).toBe(false);
    expect(isBloodBoundDemoRoom("huyet-the-tournament")).toBe(false);
    expect(isBloodBoundDemoRoom("crimson-vow-live")).toBe(false);
    expect(isBloodBoundDemoRoom("my-bloodbound-party")).toBe(false);
  });

  it("does NOT match demo rooms of other games or empty input", () => {
    expect(isBloodBoundDemoRoom("demo-nob-1")).toBe(false);
    expect(isBloodBoundDemoRoom("demo-not-in-my-pot")).toBe(false);
    expect(isBloodBoundDemoRoom("demo-wheres-the-bone")).toBe(false);
    expect(isBloodBoundDemoRoom("")).toBe(false);
    expect(isBloodBoundDemoRoom(null)).toBe(false);
    expect(isBloodBoundDemoRoom(undefined)).toBe(false);
  });
});

describe("Blood Bound 16 Players Scaling and High Rank Roles", () => {
  it("initializes a 16-player game with all 8 ranks for both Rose and Fan clans", () => {
    const players: PlayerInitInfo[] = Array.from({ length: 16 }, (_, i) => ({
      playerId: `p${i + 1}`,
      displayName: `Player ${i + 1}`,
    }));

    const { view, secretCards } = initBloodBoundGame("room-16p", players, "p1", { shuffle: false });

    expect(view.players).toHaveLength(16);
    expect(Object.keys(secretCards)).toHaveLength(16);

    const roseCards = Object.values(secretCards).filter((c) => c.clan === "ROSE");
    const fanCards = Object.values(secretCards).filter((c) => c.clan === "FAN");

    expect(roseCards).toHaveLength(8);
    expect(fanCards).toHaveLength(8);

    // Verify all ranks 1..8 exist in both clans
    const roseRanks = roseCards.map((c) => c.rank).sort((a, b) => a - b);
    const fanRanks = fanCards.map((c) => c.rank).sort((a, b) => a - b);

    expect(roseRanks).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(fanRanks).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

    // Check presence of high rank roles: Mentalist(5), Guardian(6), Berserker(7), Courtesan(8)
    const mentalists = Object.values(secretCards).filter((c) => c.rank === 5);
    const guardians = Object.values(secretCards).filter((c) => c.rank === 6);
    const berserkers = Object.values(secretCards).filter((c) => c.rank === 7);
    const courtesans = Object.values(secretCards).filter((c) => c.rank === 8);

    expect(mentalists).toHaveLength(2);
    expect(guardians).toHaveLength(2);
    expect(berserkers).toHaveLength(2);
    expect(courtesans).toHaveLength(2);
  });

  it("initializes a 15-player odd game with ranks 1..7 plus 1 Inquisitor (rank 8)", () => {
    const players: PlayerInitInfo[] = Array.from({ length: 15 }, (_, i) => ({
      playerId: `p${i + 1}`,
      displayName: `Player ${i + 1}`,
    }));

    const { view, secretCards } = initBloodBoundGame("room-15p", players, "p1", { shuffle: false });

    expect(view.players).toHaveLength(15);
    const inquisitors = Object.values(secretCards).filter((c) => c.clan === "INQUISITOR");
    expect(inquisitors).toHaveLength(1);
    expect(inquisitors[0].rank).toBe(8);
  });
});

describe("Blood Bound Room Leave / Guard Rules", () => {
  it("determines whether exit confirmation is required using requiresExitConfirmation", () => {
    // In demo rooms, exit confirmation is bypassed
    expect(requiresExitConfirmation("demo-blood-bound", "ATTACK_CHOICE")).toBe(false);
    expect(requiresExitConfirmation("demo", "INTERVENTION_WINDOW")).toBe(false);

    // In real multiplayer match that is in progress, exit confirmation MUST be required
    expect(requiresExitConfirmation("LCHU5PTV", "LOOK_LEFT")).toBe(true);
    expect(requiresExitConfirmation("LCHU5PTV", "ATTACK_CHOICE")).toBe(true);
    expect(requiresExitConfirmation("LCHU5PTV", "INTERVENTION_WINDOW")).toBe(true);
    expect(requiresExitConfirmation("LCHU5PTV", "WOUND_ASSIGNMENT")).toBe(true);

    // When game is over in real match, player can exit without elimination warning
    expect(requiresExitConfirmation("LCHU5PTV", "GAME_OVER")).toBe(false);
  });
});
