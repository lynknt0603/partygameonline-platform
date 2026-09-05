import type {
  BloodBoundCard,
  BloodBoundPlayerPublic,
  BloodBoundView,
  BloodClan,
  ClueTokenType,
} from "./bloodBoundTypes";
import {
  processAttack,
  processIntervene,
  processPassIntervention,
  processWoundReveal,
  validateAttack,
  validateIntervene,
  type PlayerInitInfo,
} from "./bloodBoundRules";

export interface BotAttackDecision {
  targetPlayerId: string;
  targetName: string;
  reasoning: string;
}

export interface BotInterveneDecision {
  shouldIntervene: boolean;
  reasoning: string;
}

export interface BotWoundDecision {
  tokenType: ClueTokenType;
  reasoning: string;
}

export interface BotAbilityDecision {
  useAbility: boolean;
  targetPlayerId?: string;
  reasoning: string;
}

/**
 * Tự động tạo danh sách người chơi bổ sung bot khi thiếu người hoặc chơi 1 mình
 */
export function ensureFullPlayerList(
  currentPlayers: PlayerInitInfo[],
  minPlayers = 6,
): PlayerInitInfo[] {
  if (currentPlayers.length >= minPlayers) {
    return currentPlayers;
  }

  const botTemplates = [
    { id: "bot-alpha", name: "🤖 Alpha", clanPref: "ROSE" },
    { id: "bot-bravo", name: "🤖 Bravo", clanPref: "ROSE" },
    { id: "bot-charlie", name: "🤖 Charlie", clanPref: "FAN" },
    { id: "bot-delta", name: "🤖 Delta", clanPref: "FAN" },
    { id: "bot-echo", name: "🤖 Echo", clanPref: "FAN" },
    { id: "bot-foxtrot", name: "🤖 Foxtrot", clanPref: "ROSE" },
    { id: "bot-golf", name: "🤖 Golf", clanPref: "FAN" },
    { id: "bot-hotel", name: "🤖 Hotel", clanPref: "ROSE" },
    { id: "bot-india", name: "🤖 India", clanPref: "INQUISITOR" },
  ];

  const result = [...currentPlayers];
  let templateIndex = 0;

  while (result.length < minPlayers) {
    const template = botTemplates[templateIndex % botTemplates.length];
    const candidateId = `${template.id}-${result.length + 1}`;
    result.push({
      playerId: candidateId,
      displayName: template.name,
      avatarUrl: null,
    });
    templateIndex++;
  }

  return result;
}

/**
 * Suy luận và ra quyết định tấn công cho Bot
 */
export function decideBotAttack(
  view: BloodBoundView,
  botPlayerId: string,
  secretCards: Record<string, BloodBoundCard>,
): BotAttackDecision {
  const botCard = secretCards[botPlayerId];
  const botClan: BloodClan = botCard?.clan ?? "ROSE";

  // Lọc danh sách mục tiêu hợp lệ
  const validTargets = view.players.filter((p) => {
    const check = validateAttack(view, botPlayerId, p.playerId);
    return check.valid;
  });

  if (validTargets.length === 0) {
    // Dự phòng không có mục tiêu hợp lệ
    return {
      targetPlayerId: "",
      targetName: "None",
      reasoning: "Không tìm thấy mục tiêu hợp lệ để tấn công.",
    };
  }

  // 1. Phân tích thông tin đã biết về từng mục tiêu
  interface TargetAnalysis {
    player: BloodBoundPlayerPublic;
    knownClan: BloodClan | "UNKNOWN";
    knownRank: number | null;
    isConfirmedLeader: boolean;
    isConfirmedEnemy: boolean;
    isConfirmedAlly: boolean;
    score: number;
    reasoning: string;
  }

  const scoredTargets: TargetAnalysis[] = validTargets.map((target) => {
    let knownClan: BloodClan | "UNKNOWN" = "UNKNOWN";
    let knownRank: number | null = null;

    // Kiểm tra token đã lộ
    for (const token of target.revealedTokens) {
      if (token.type === "COLOR") {
        knownClan = token.value === "RED" ? "ROSE" : token.value === "GREEN" ? "FAN" : "INQUISITOR";
      } else if (token.type === "CREST") {
        knownClan = String(token.value).startsWith("ROSE")
          ? "ROSE"
          : String(token.value).startsWith("FAN")
          ? "FAN"
          : "INQUISITOR";
      } else if (token.type === "RANK") {
        knownRank = Number(token.value);
      }
    }

    const isConfirmedLeader = knownRank === 1;
    const isConfirmedEnemy = knownClan !== "UNKNOWN" && knownClan !== botClan;
    const isConfirmedAlly = knownClan === botClan;

    let score = 50;
    let reason = "Mục tiêu thông thường.";

    // Ưu tiên cao nhất: Nếu đã biết chắc chắn là Thủ Lĩnh địch (Enemy Leader)
    if (isConfirmedEnemy && isConfirmedLeader) {
      if (target.wounds === 3) {
        score += 200; // Đòn dứt điểm bắt đúng Thủ Lĩnh để THẮNG GAME!
        reason = `🎯 BẮT ĐÚNG THỦ LĨNH! ${target.displayName} là Rank 1 địch và đã có 3 vết thương. Đòn này sẽ đem lại chiến thắng!`;
      } else {
        score += 100;
        reason = `🎯 Tập trung tấn công Thủ Lĩnh địch (${target.displayName}) đã lộ diện.`;
      }
    } else if (isConfirmedAlly) {
      // Tránh tấn công đồng đội
      score -= 150;
      reason = `🛡️ Tránh tấn công đồng đội (${target.displayName}) cùng phe ${botClan}.`;
    } else if (target.wounds === 3 && !isConfirmedLeader) {
      // NGUY HIỂM: Nếu đánh vào người đã 3 vết thương mà không chắc là Thủ Lĩnh -> Có nguy cơ bắt nhầm và THUA NGAY
      score -= 80;
      reason = `⚠️ Thận trọng! ${target.displayName} đã có 3 vết thương, nếu đánh nhầm không phải Thủ Lĩnh sẽ bị xử thua.`;
    } else if (isConfirmedEnemy) {
      score += 40 + target.wounds * 10;
      reason = `⚔️ Tấn công kẻ địch đã xác nhận (${target.displayName} - phe ${knownClan}) để khai thác thêm manh mối.`;
    } else {
      // Chưa rõ danh tính: ưu tiên người chưa có nhiều vết thương để lấy clue
      score += 20 - target.wounds * 5;
      reason = `🔍 Thăm dò danh tính bí mật của ${target.displayName}.`;
    }

    return {
      player: target,
      knownClan,
      knownRank,
      isConfirmedLeader,
      isConfirmedEnemy,
      isConfirmedAlly,
      score,
      reasoning: reason,
    };
  });

  // Chọn mục tiêu có điểm số cao nhất (thêm ngẫu nhiên khi bằng điểm để đa dạng hóa)
  scoredTargets.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return Math.random() - 0.5;
  });
  const best = scoredTargets[0];

  return {
    targetPlayerId: best.player.playerId,
    targetName: best.player.displayName,
    reasoning: best.reasoning,
  };
}

/**
 * Quyết định xem Bot có nên nhảy vào can thiệp đỡ đòn hay không
 */
export function decideBotIntervene(
  view: BloodBoundView,
  botPlayerId: string,
  secretCards: Record<string, BloodBoundCard>,
): BotInterveneDecision {
  const check = validateIntervene(view, botPlayerId);
  if (!check.valid) {
    return { shouldIntervene: false, reasoning: check.reason ?? "Không đủ điều kiện can thiệp." };
  }

  const botCard = secretCards[botPlayerId];
  if (!botCard) {
    return { shouldIntervene: false, reasoning: "Không tìm thấy thẻ bài của bot." };
  }

  const victimId = view.currentTargetPlayerId;
  const victim = view.players.find((p) => p.playerId === victimId);
  const victimCard = victimId ? secretCards[victimId] : null;

  if (!victim || !victimCard) {
    return { shouldIntervene: false, reasoning: "Không xác định được nạn nhân bị tấn công." };
  }

  const isVictimAlly = victimCard.clan === botCard.clan;
  const isVictimLeader = victimCard.rank === 1;

  // Bot là đồng đội:
  if (isVictimAlly) {
    // Nếu nạn nhân là THỦ LĨNH phe mình và sắp bị bắt (hoặc bị nhắm tới)
    if (isVictimLeader) {
      if (victim.wounds >= 2) {
        return {
          shouldIntervene: true,
          reasoning: `🛡️ BẢO VỆ THỦ LĨNH! ${victim.displayName} là Thủ Lĩnh phe ta (${victimCard.clan}), phải liều mình đỡ đòn!`,
        };
      }
      // Thủ lĩnh bị tấn công lần đầu, can thiệp để bảo toàn bí mật
      return {
        shouldIntervene: true,
        reasoning: `🛡️ Che chắn cho Thủ Lĩnh ${victim.displayName} trước khi bị lộ thêm manh mối.`,
      };
    }

    // Nếu đồng đội đang 3 vết thương và sắp bị bắt
    if (victim.wounds === 3 && botCard.rank !== 1) {
      return {
        shouldIntervene: true,
        reasoning: `🛡️ Cứu đồng đội ${victim.displayName} đang cận kề cái chết (3/4 vết thương).`,
      };
    }
  }

  return {
    shouldIntervene: false,
    reasoning: `Bỏ qua can thiệp. Giữ kín vai trò của mình cho thời khắc quyết định.`,
  };
}

/**
 * Quyết định chọn loại token để lộ khi Bot nhận vết thương
 */
export function decideBotWoundReveal(
  victimId: string,
  secretCards: Record<string, BloodBoundCard>,
  alreadyRevealed: ClueTokenType[] = [],
): BotWoundDecision {
  const secret = secretCards[victimId];
  if (!secret) {
    return { tokenType: "COLOR", reasoning: "Mặc định lộ màu phe." };
  }

  const isLeader = secret.rank === 1;

  // 1. Nếu là THỦ LĨNH (Rank 1):
  // Tuyệt đối hạn chế để lộ RANK (Token Số) vì sẽ bị địch tập trung tiêu diệt
  if (isLeader) {
    if (!alreadyRevealed.includes("QUESTION")) {
      return {
        tokenType: "QUESTION",
        reasoning: `❓ [Thủ Lĩnh] Chọn lộ dấu hỏi (?) để đánh lạc hướng và bảo vệ danh tính tối thượng.`,
      };
    }
    if (!alreadyRevealed.includes("CREST")) {
      return {
        tokenType: "CREST",
        reasoning: `⚜️ [Thủ Lĩnh] Chọn lộ phù hiệu gia tộc thay vì tiết lộ cấp bậc.`,
      };
    }
    if (!alreadyRevealed.includes("COLOR")) {
      return {
        tokenType: "COLOR",
        reasoning: `🎨 [Thủ Lĩnh] Chọn lộ màu phe ${secret.clan} để giữ kín số cấp 1.`,
      };
    }
    return {
      tokenType: "RANK",
      reasoning: `⚠️ [Thủ Lĩnh] Buộc phải lộ cấp bậc 1 do không còn lựa chọn nào khác.`,
    };
  }

  // 2. Nếu là các vai trò chiến thuật cần mở khóa kỹ năng (Assassin Rank 2, Guardian Rank 3, Harlequin Rank 6)
  if ([2, 3, 6, 8].includes(secret.rank) && !alreadyRevealed.includes("RANK")) {
    return {
      tokenType: "RANK",
      reasoning: `⚡ [${secret.roleInfo.roleNameVi}] Chọn lộ Token Số (Rank ${secret.rank}) để kích hoạt kỹ năng đặc biệt!`,
    };
  }

  // 3. Các vai trò khác: Ưu tiên lộ COLOR hoặc CREST trước
  if (!alreadyRevealed.includes("COLOR")) {
    return {
      tokenType: "COLOR",
      reasoning: `🎨 Tiết lộ màu phe (${secret.clan}) cho các người chơi trên bàn.`,
    };
  }
  if (!alreadyRevealed.includes("CREST")) {
    return {
      tokenType: "CREST",
      reasoning: `⚜️ Tiết lộ phù hiệu của gia tộc.`,
    };
  }
  if (!alreadyRevealed.includes("QUESTION")) {
    return {
      tokenType: "QUESTION",
      reasoning: `❓ Đặt token dấu hỏi (?) để gây nhiễu thông tin.`,
    };
  }

  return {
    tokenType: "RANK",
    reasoning: `Tiết lộ Token Số của bản thân.`,
  };
}

/**
 * Thực hiện 1 bước tự động hoàn chỉnh cho Bot trong vòng lặp game
 */
export function executeBotTurnStep(
  view: BloodBoundView,
  secretCards: Record<string, BloodBoundCard>,
): {
  nextView: BloodBoundView;
  logAction?: { botName: string; action: string; reasoning: string };
} {
  // Phase 1: ATTACK_CHOICE
  if (view.phase === "ATTACK_CHOICE") {
    const attackerId = view.daggerHolderPlayerId;
    const attacker = view.players.find((p) => p.playerId === attackerId);
    if (!attacker) return { nextView: view };

    const decision = decideBotAttack(view, attackerId, secretCards);
    if (!decision.targetPlayerId) return { nextView: view };

    const nextView = processAttack(view, decision.targetPlayerId);
    return {
      nextView,
      logAction: {
        botName: attacker.displayName,
        action: `Tấn công ${decision.targetName}`,
        reasoning: decision.reasoning,
      },
    };
  }

  // Phase 2: INTERVENTION_WINDOW
  if (view.phase === "INTERVENTION_WINDOW") {
    // Duyệt qua tất cả các bot đủ điều kiện can thiệp
    for (const p of view.players) {
      if (p.playerId === view.daggerHolderPlayerId || p.playerId === view.currentTargetPlayerId) {
        continue;
      }
      const check = validateIntervene(view, p.playerId);
      if (!check.valid) continue;

      const decision = decideBotIntervene(view, p.playerId, secretCards);
      if (decision.shouldIntervene) {
        const nextView = processIntervene(view, p.playerId, secretCards[p.playerId]);
        return {
          nextView,
          logAction: {
            botName: p.displayName,
            action: `Nhảy vào can thiệp đỡ đòn`,
            reasoning: decision.reasoning,
          },
        };
      }
    }

    // Nếu không ai can thiệp -> Chuyển sang gán vết thương
    const nextView = processPassIntervention(view);
    return {
      nextView,
      logAction: {
        botName: "Hệ thống",
        action: "Không có ai can thiệp",
        reasoning: "Toàn bộ người chơi/bot bỏ qua lượt đỡ đòn.",
      },
    };
  }

  // Phase 3: WOUND_ASSIGNMENT
  if (view.phase === "WOUND_ASSIGNMENT") {
    const victimId = view.intervenedByPlayerId ?? view.currentTargetPlayerId;
    if (!victimId) return { nextView: view };

    const victim = view.players.find((p) => p.playerId === victimId);
    if (!victim) return { nextView: view };

    const alreadyTokens: ClueTokenType[] = victim.revealedTokens.map((t) => t.type);
    const decision = decideBotWoundReveal(victimId, secretCards, alreadyTokens);

    const nextView = processWoundReveal(view, secretCards, decision.tokenType);
    return {
      nextView,
      logAction: {
        botName: victim.displayName,
        action: `Nhận vết thương & Chọn lộ token [${decision.tokenType}]`,
        reasoning: decision.reasoning,
      },
    };
  }

  return { nextView: view };
}
