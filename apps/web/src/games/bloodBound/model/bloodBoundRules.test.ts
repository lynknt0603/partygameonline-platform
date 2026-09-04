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

  it("divides players equally into Rose and Beast clans", () => {
    const { view, secretCards } = initBloodBoundGame("room-bb-1", players, "p1");
    expect(view.players).toHaveLength(6);
    expect(view.phase).toBe("LOOK_LEFT");
    expect(view.daggerHolderPlayerId).toBe("p1");

    // 3 Rose, 3 Beast
    const roseCount = Object.values(secretCards).filter((c) => c.clan === "ROSE").length;
    const beastCount = Object.values(secretCards).filter((c) => c.clan === "BEAST").length;
    expect(roseCount).toBe(3);
    expect(beastCount).toBe(3);
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
    expect(p4?.revealedTokens[0].value).toBe("BLUE");
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
    // p1 (ROSE) attacked, but p5 is NOT the leader -> BEAST clan wins!
    expect(gameOverView.winnerClan).toBe("BEAST");
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
});
