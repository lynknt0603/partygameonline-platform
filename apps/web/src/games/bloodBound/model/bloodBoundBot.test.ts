import { describe, it, expect } from "vitest";
import { initBloodBoundGame } from "./bloodBoundRules";
import {
  ensureFullPlayerList,
  decideBotAttack,
  decideBotIntervene,
  decideBotWoundReveal,
  decideBotAbility,
  executeBotTurnStep,
} from "./bloodBoundBot";

describe("BloodBound Bot AI & Solo Simulation", () => {
  it("ensureFullPlayerList should auto-fill bot players when playing solo or under min players", () => {
    const solo = [{ playerId: "player-1", displayName: "Solo Human" }];
    const full = ensureFullPlayerList(solo, 6);
    expect(full.length).toBe(6);
    expect(full[0].playerId).toBe("player-1");
    expect(full[1].displayName).toContain("🤖");
  });

  it("decideBotAttack should choose a legal target and avoid attacking self", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { view, secretCards } = initBloodBoundGame("room-1", players, "p1");

    // Bot 2 is attacking
    const decision = decideBotAttack(
      { ...view, phase: "ATTACK_CHOICE", daggerHolderPlayerId: players[1].playerId },
      players[1].playerId,
      secretCards,
    );

    expect(decision.targetPlayerId).toBeDefined();
    expect(decision.targetPlayerId).not.toBe(players[1].playerId);
    expect(decision.reasoning).toBeTruthy();
  });

  it("decideBotAttack should strongly target enemy leader if confirmed", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { view, secretCards } = initBloodBoundGame("room-1", players, "p1");

    // p1 is Rose Rank 1. Let's say Bot Charlie (Beast) holds dagger and p1 revealed Rank 1
    const beastAttacker = players[3].playerId; // Beast
    const roseLeader = players[0].playerId; // Rose Leader

    const stateWithRevealedLeader = {
      ...view,
      phase: "ATTACK_CHOICE" as const,
      daggerHolderPlayerId: beastAttacker,
      players: view.players.map((p) =>
        p.playerId === roseLeader
          ? {
              ...p,
              wounds: 3,
              revealedTokens: [
                { type: "COLOR" as const, value: "RED" as const },
                { type: "RANK" as const, value: 1 as const },
              ],
            }
          : p,
      ),
    };

    const decision = decideBotAttack(stateWithRevealedLeader, beastAttacker, secretCards);
    expect(decision.targetPlayerId).toBe(roseLeader);
    expect(decision.reasoning).toContain("BẮT ĐÚNG THỦ LĨNH");
  });

  it("decideBotWoundReveal should keep leader rank secret if possible", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { secretCards } = initBloodBoundGame("room-1", players, "p1");

    // p1 is Leader (Rank 1)
    const decision = decideBotWoundReveal("p1", secretCards, []);
    expect(decision.tokenType).not.toBe("RANK");
    expect(["QUESTION", "CREST", "COLOR"]).toContain(decision.tokenType);
    expect(decision.reasoning).toContain("Thủ Lĩnh");
  });

  it("decideBotWoundReveal should reveal rank for Assassin (Rank 2) to unlock ability", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { secretCards } = initBloodBoundGame("room-1", players, "p1");

    // Player 2 is Rose Rank 2 (Assassin)
    const assassinId = players[1].playerId;
    const decision = decideBotWoundReveal(assassinId, secretCards, []);
    expect(decision.tokenType).toBe("RANK");
    expect(decision.reasoning).toContain("Rank 2");
  });

  it("decideBotIntervene should intervene to protect ally leader in danger", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { view, secretCards } = initBloodBoundGame("room-1", players, "p1");

    // Target is Rose Leader (p1), attacker is Beast (p4), intervener is Rose Assassin (p2)
    const state = {
      ...view,
      phase: "INTERVENTION_WINDOW" as const,
      daggerHolderPlayerId: players[3].playerId,
      currentTargetPlayerId: players[0].playerId,
      players: view.players.map((p) =>
        p.playerId === players[0].playerId ? { ...p, wounds: 2 } : p,
      ),
    };

    const decision = decideBotIntervene(state, players[1].playerId, secretCards);
    expect(decision.shouldIntervene).toBe(true);
    expect(decision.reasoning).toContain("BẢO VỆ THỦ LĨNH");
  });

  it("executeBotTurnStep should automatically advance through attack and intervention loop", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { view, secretCards } = initBloodBoundGame("room-1", players, "p1");

    // 1. Attack Step
    const attackState = {
      ...view,
      phase: "ATTACK_CHOICE" as const,
      daggerHolderPlayerId: players[1].playerId, // Bot 2
    };
    const step1 = executeBotTurnStep(attackState, secretCards);
    expect(step1.nextView.phase).toBe("INTERVENTION_WINDOW");
    expect(step1.logAction).toBeDefined();

    // 2. Intervention Step (Pass or Intervene)
    const step2 = executeBotTurnStep(step1.nextView, secretCards);
    expect(["WOUND_ASSIGNMENT", "ATTACK_CHOICE", "GAME_OVER"]).toContain(step2.nextView.phase);

    // 3. If no bot intervened, wound assignment resolves next
    if (step2.nextView.phase === "WOUND_ASSIGNMENT") {
      const step3 = executeBotTurnStep(step2.nextView, secretCards);
      expect(["ATTACK_CHOICE", "GAME_OVER"]).toContain(step3.nextView.phase);
    }
  });

  it("executeBotTurnStep deterministic: passes intervention to WOUND_ASSIGNMENT when nobody can intervene", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { view, secretCards } = initBloodBoundGame("room-1", players, "p1");

    // Attack target is players[0]. All other potential interveners have revealed rank (cannot intervene)
    const interventionState = {
      ...view,
      phase: "INTERVENTION_WINDOW" as const,
      daggerHolderPlayerId: players[1].playerId,
      currentTargetPlayerId: players[0].playerId,
      players: view.players.map((p) => ({ ...p, hasRevealedRank: true })),
    };

    const step = executeBotTurnStep(interventionState, secretCards);
    expect(step.nextView.phase).toBe("WOUND_ASSIGNMENT");

    const woundStep = executeBotTurnStep(step.nextView, secretCards);
    expect(["ATTACK_CHOICE", "GAME_OVER"]).toContain(woundStep.nextView.phase);
  });

  it("executeBotTurnStep deterministic: ally intervenes and directly resolves to ATTACK_CHOICE", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { view, secretCards } = initBloodBoundGame("room-1", players, "p1", {
      assignedRoles: {
        [players[0].playerId]: { clan: "ROSE", rank: 1 }, // Target: Leader
        [players[1].playerId]: { clan: "FAN", rank: 2 },  // Attacker
        [players[2].playerId]: { clan: "ROSE", rank: 6 }, // Ally: Guardian
      },
    });

    const interventionState = {
      ...view,
      phase: "INTERVENTION_WINDOW" as const,
      daggerHolderPlayerId: players[1].playerId,
      currentTargetPlayerId: players[0].playerId,
      players: view.players.map((p) => {
        if (p.playerId === players[0].playerId) return { ...p, wounds: 2 };
        if (p.playerId === players[2].playerId) return { ...p, hasRevealedRank: false };
        return { ...p, hasRevealedRank: true };
      }),
    };

    const step = executeBotTurnStep(interventionState, secretCards);
    // Guardian intervenes to protect leader -> directly reveals wound and advances to ATTACK_CHOICE
    expect(step.nextView.phase).toBe("ATTACK_CHOICE");
    expect(step.logAction?.action).toContain("can thiệp");
  });

  it("decideBotAttack avoids killing ally with 3 wounds", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { view, secretCards } = initBloodBoundGame("room-1", players, "p1", {
      assignedRoles: {
        [players[0].playerId]: { clan: "ROSE", rank: 1 },
        [players[1].playerId]: { clan: "ROSE", rank: 2 },
        [players[2].playerId]: { clan: "FAN", rank: 3 },
      },
    });

    // Bot 1 (Rose) attacks. Ally (p1) has 3 wounds. Enemy (p3) has 0 wounds.
    const state = {
      ...view,
      phase: "ATTACK_CHOICE" as const,
      daggerHolderPlayerId: players[1].playerId,
      players: view.players.map((p) => {
        if (p.playerId === players[0].playerId) {
          return {
            ...p,
            wounds: 3,
            revealedTokens: [{ type: "COLOR" as const, value: "RED" as const }],
          };
        }
        return p;
      }),
    };

    const decision = decideBotAttack(state, players[1].playerId, secretCards);
    // Bot must not attack its ally who has 3 wounds!
    expect(decision.targetPlayerId).not.toBe(players[0].playerId);
  });

  it("decideBotAbility Assassin bot targets enemy and never targets self", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { view, secretCards } = initBloodBoundGame("room-1", players, "p1", {
      assignedRoles: {
        [players[0].playerId]: { clan: "ROSE", rank: 1 },
        [players[1].playerId]: { clan: "FAN", rank: 2 }, // Fan Assassin
      },
    });

    const state = {
      ...view,
      phase: "ATTACK_CHOICE" as const,
      players: view.players.map((p) =>
        p.playerId === players[1].playerId ? { ...p, hasRevealedRank: true } : p,
      ),
    };

    const decision = decideBotAbility(state, players[1].playerId, secretCards);
    expect(decision.useAbility).toBe(true);
    expect(decision.targetPlayerId).not.toBe(players[1].playerId);
    expect(decision.reasoning).toContain("Sát Thủ");
  });

  it("decideBotAbility Alchemist heals wounded ally", () => {
    const players = ensureFullPlayerList([{ playerId: "p1", displayName: "You" }], 6);
    const { view, secretCards } = initBloodBoundGame("room-1", players, "p1", {
      assignedRoles: {
        [players[0].playerId]: { clan: "ROSE", rank: 1 },
        [players[1].playerId]: { clan: "ROSE", rank: 4 }, // Rose Alchemist
      },
    });

    const state = {
      ...view,
      phase: "ATTACK_CHOICE" as const,
      players: view.players.map((p) => {
        if (p.playerId === players[1].playerId) return { ...p, hasRevealedRank: true };
        if (p.playerId === players[0].playerId) return { ...p, wounds: 2 };
        return p;
      }),
    };

    const decision = decideBotAbility(state, players[1].playerId, secretCards);
    expect(decision.useAbility).toBe(true);
    expect(decision.targetPlayerId).toBe(players[0].playerId);
    expect(decision.reasoning).toContain("Nhà Giả Kim");
  });
});

