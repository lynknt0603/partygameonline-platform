import {
  BLOOD_BOUND_ID,
  BLOOD_BOUND_ROLES,
  type BloodBoundCard,
  type BloodBoundPhase,
  type BloodBoundPlayerPublic,
  type BloodBoundRoleRank,
  type BloodBoundView,
  type BloodClan,
  type ClueTokenType,
  type RevealedToken,
} from "./bloodBoundTypes";

export interface PlayerInitInfo {
  playerId: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface GameInitResult {
  view: BloodBoundView;
  secretCards: Record<string, BloodBoundCard>;
}

export interface InitBloodBoundOptions {
  shuffle?: boolean;
  assignedRoles?: Record<string, { clan: BloodClan; rank: BloodBoundRoleRank }>;
  startingDaggerPlayerId?: string;
}

/**
 * Khởi tạo trận đấu Blood Bound với luật chia bài nguyên bản (Rose vs Fan, kèm Inquisitor)
 */
export function initBloodBoundGame(
  roomId: string,
  playersInfo: PlayerInitInfo[],
  viewingPlayerId: string,
  options?: InitBloodBoundOptions,
): GameInitResult {
  const count = playersInfo.length;
  const half = Math.floor(count / 2);

  const secretCards: Record<string, BloodBoundCard> = {};

  if (!options?.shuffle && !options?.assignedRoles) {
    // 1. Phân chia vai trò tất định (giữ nguyên cho unit test)
    playersInfo.forEach((p, idx) => {
      let clan: BloodClan;
      let rank: BloodBoundRoleRank;

      if (idx < half) {
        clan = "ROSE";
        rank = Math.min(8, idx + 1) as BloodBoundRoleRank;
      } else if (idx < half * 2) {
        clan = "FAN";
        rank = Math.min(8, idx - half + 1) as BloodBoundRoleRank;
      } else {
        clan = "INQUISITOR";
        rank = 8;
      }

      secretCards[p.playerId] = {
        clan,
        rank,
        roleInfo: BLOOD_BOUND_ROLES[rank],
      };
    });
  } else {
    // 2. Phân chia vai trò ngẫu nhiên hoặc chỉ định vai trò cho người chơi test
    const deck: Array<{ clan: BloodClan; rank: BloodBoundRoleRank }> = [];
    for (let r = 1; r <= half; r++) {
      deck.push({ clan: "ROSE", rank: Math.min(8, r) as BloodBoundRoleRank });
      deck.push({ clan: "FAN", rank: Math.min(8, r) as BloodBoundRoleRank });
    }
    if (count % 2 === 1) {
      deck.push({ clan: "INQUISITOR", rank: 8 });
    }

    const assignedPlayerIds = new Set<string>();
    if (options?.assignedRoles) {
      for (const [pid, role] of Object.entries(options.assignedRoles)) {
        if (playersInfo.some((p) => p.playerId === pid)) {
          secretCards[pid] = {
            clan: role.clan,
            rank: role.rank,
            roleInfo: BLOOD_BOUND_ROLES[role.rank],
          };
          assignedPlayerIds.add(pid);

          // Rút thẻ tương ứng ra khỏi bộ bài
          const deckIdx = deck.findIndex((c) => c.clan === role.clan && c.rank === role.rank);
          if (deckIdx >= 0) {
            deck.splice(deckIdx, 1);
          } else {
            const sameClanIdx = deck.findIndex((c) => c.clan === role.clan);
            if (sameClanIdx >= 0) {
              deck.splice(sameClanIdx, 1);
            } else {
              deck.pop();
            }
          }
        }
      }
    }

    // Xáo trộn các lá bài còn lại
    if (options?.shuffle !== false) {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }

    // Chia đều cho các người chơi còn lại
    playersInfo.forEach((p) => {
      if (!assignedPlayerIds.has(p.playerId)) {
        const card = deck.shift() ?? { clan: "ROSE", rank: 1 as BloodBoundRoleRank };
        secretCards[p.playerId] = {
          clan: card.clan,
          rank: card.rank,
          roleInfo: BLOOD_BOUND_ROLES[card.rank],
        };
      }
    });
  }

  const startingDaggerPlayerId =
    options?.startingDaggerPlayerId && playersInfo.some((p) => p.playerId === options.startingDaggerPlayerId)
      ? options.startingDaggerPlayerId
      : playersInfo[0]?.playerId ?? "";

  const players: BloodBoundPlayerPublic[] = playersInfo.map((p, idx) => ({
    playerId: p.playerId,
    displayName: p.displayName,
    avatarUrl: p.avatarUrl ?? null,
    seatIndex: idx,
    wounds: 0,
    revealedTokens: [],
    hasRevealedRank: false,
    hasUsedAbility: false,
    isShielded: false,
    isDaggerHolder: p.playerId === startingDaggerPlayerId,
  }));

  const viewerCard = secretCards[viewingPlayerId] ?? null;
  const viewerSeat = playersInfo.findIndex((p) => p.playerId === viewingPlayerId);
  const leftNeighborSeat = (viewerSeat + 1) % count;
  const leftNeighborPlayer = playersInfo[leftNeighborSeat];
  const leftNeighborSecret = leftNeighborPlayer ? secretCards[leftNeighborPlayer.playerId] : null;

  const leftNeighborClue = leftNeighborSecret
    ? { clan: leftNeighborSecret.clan, crest: `${leftNeighborSecret.clan}-CREST` }
    : null;

  const view: BloodBoundView = {
    gameId: BLOOD_BOUND_ID,
    roomId,
    you: viewingPlayerId,
    phase: "LOOK_LEFT",
    roundNumber: 1,
    daggerHolderPlayerId: startingDaggerPlayerId,
    currentTargetPlayerId: null,
    intervenedByPlayerId: null,
    players,
    mySecretCard: viewerCard,
    leftNeighborClue,
    timeRemainingSeconds: 30,
    winnerClan: null,
    capturedPlayerId: null,
    publicLog: [
      {
        text: "Game started. Inspect your left neighbor's clue.",
        textVi: "Trò chơi bắt đầu. Hãy bí mật xem manh mối của người bên trái.",
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return { view, secretCards };
}

/**
 * Người chơi xác nhận đã xem thông tin bên trái -> Chuyển sang chọn mục tiêu tấn công
 */
export function processAcknowledgeLookLeft(view: BloodBoundView): BloodBoundView {
  if (view.phase !== "LOOK_LEFT") {
    return view;
  }
  return {
    ...view,
    phase: "ATTACK_CHOICE",
    publicLog: [
      ...view.publicLog,
      {
        text: "The dagger is ready. Choose an opponent to attack.",
        textVi: "Thanh đoản kiếm đã sẵn sàng. Hãy chọn mục tiêu để tấn công.",
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Kiểm tra tính hợp lệ của lệnh tấn công
 */
export function validateAttack(
  view: BloodBoundView,
  attackerPlayerId: string,
  targetPlayerId: string,
): { valid: boolean; reason?: string } {
  if (view.phase !== "ATTACK_CHOICE") {
    return { valid: false, reason: "Chưa đến giai đoạn tấn công" };
  }
  if (view.daggerHolderPlayerId !== attackerPlayerId) {
    return { valid: false, reason: "Bạn không phải người đang giữ Đoản Kiếm" };
  }
  if (attackerPlayerId === targetPlayerId) {
    return { valid: false, reason: "Không thể tự tấn công chính mình" };
  }
  const target = view.players.find((p) => p.playerId === targetPlayerId);
  if (!target) {
    return { valid: false, reason: "Mục tiêu không tồn tại" };
  }
  if (target.wounds >= 4) {
    return { valid: false, reason: "Mục tiêu đã bị bắt giữ từ trước" };
  }
  if (view.forcedAttackTargetId) {
    const forcedTarget = view.players.find((p) => p.playerId === view.forcedAttackTargetId);
    if (forcedTarget && forcedTarget.wounds < 4 && forcedTarget.playerId !== attackerPlayerId) {
      if (targetPlayerId !== view.forcedAttackTargetId) {
        return {
          valid: false,
          reason: `Mưu lược Mê Hoặc ép bạn phải tấn công ${forcedTarget.displayName}!`,
        };
      }
    }
  }
  return { valid: true };
}

/**
 * Xử lý khi người cầm kiếm ra đòn tấn công -> Mở cửa sổ can thiệp (Intervention Window)
 */
export function processAttack(
  view: BloodBoundView,
  targetPlayerId: string,
): BloodBoundView {
  const attacker = view.players.find((p) => p.playerId === view.daggerHolderPlayerId);
  const target = view.players.find((p) => p.playerId === targetPlayerId);

  return {
    ...view,
    phase: "INTERVENTION_WINDOW",
    currentTargetPlayerId: targetPlayerId,
    intervenedByPlayerId: null,
    forcedAttackTargetId: null,
    timeRemainingSeconds: 10,
    publicLog: [
      ...view.publicLog,
      {
        text: `${attacker?.displayName ?? "Attacker"} strikes at ${target?.displayName ?? "Target"}.`,
        textVi: `⚔️ ${attacker?.displayName ?? "Người tấn công"} giương kiếm tấn công ${target?.displayName ?? "Mục tiêu"}.`,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Kiểm tra tính hợp lệ của hành động can thiệp (nhảy vào đỡ đòn)
 */
export function validateIntervene(
  view: BloodBoundView,
  intervenerPlayerId: string,
): { valid: boolean; reason?: string } {
  if (view.phase !== "INTERVENTION_WINDOW") {
    return { valid: false, reason: "Cửa sổ can thiệp hiện không mở" };
  }
  if (intervenerPlayerId === view.daggerHolderPlayerId) {
    return { valid: false, reason: "Kẻ tấn công không thể tự can thiệp" };
  }
  if (intervenerPlayerId === view.currentTargetPlayerId) {
    return { valid: false, reason: "Nạn nhân không thể tự can thiệp đỡ cho chính mình" };
  }
  const player = view.players.find((p) => p.playerId === intervenerPlayerId);
  if (!player) {
    return { valid: false, reason: "Người chơi không tồn tại" };
  }
  if (player.hasRevealedRank) {
    return { valid: false, reason: "Người đã lộ Token Số không được phép can thiệp nữa" };
  }
  if (player.wounds >= 4) {
    return { valid: false, reason: "Người chơi đã bị loại" };
  }
  return { valid: true };
}

/**
 * Kiểm tra tính hợp lệ khi kích hoạt kỹ năng nhân vật
 */
export function validateAbility(
  view: BloodBoundView,
  actorPlayerId: string,
  rank: BloodBoundRoleRank,
  targetPlayerId?: string,
): { valid: boolean; reason?: string; reasonVi?: string } {
  if (view.phase === "LOOK_LEFT" || view.phase === "GAME_OVER") {
    return {
      valid: false,
      reason: "Cannot use ability in current phase",
      reasonVi: "Không thể dùng kỹ năng ở giai đoạn này",
    };
  }
  if (rank === 1) {
    return {
      valid: false,
      reason: "Leader ability is passive",
      reasonVi: "Kỹ năng Thủ Lĩnh là bị động, không thể kích hoạt chủ động",
    };
  }
  const actor = view.players.find((p) => p.playerId === actorPlayerId);
  if (!actor) {
    return { valid: false, reason: "Player not found", reasonVi: "Không tìm thấy người chơi" };
  }
  if (!actor.hasRevealedRank) {
    return {
      valid: false,
      reason: "Must have revealed rank to use ability",
      reasonVi: "Phải để lộ Token Số trước khi kích hoạt kỹ năng",
    };
  }
  if (actor.hasUsedAbility) {
    return {
      valid: false,
      reason: "Ability already used",
      reasonVi: "Kỹ năng đã được sử dụng trước đó trong ván này",
    };
  }
  if ((rank === 2 || rank === 7) && actorPlayerId === targetPlayerId) {
    return {
      valid: false,
      reason: "Cannot target self",
      reasonVi: "Không thể nhắm vào chính mình",
    };
  }
  if (rank === 7 && targetPlayerId && targetPlayerId !== view.daggerHolderPlayerId) {
    return {
      valid: false,
      reason: "Berserker can only reflect damage to the attacker",
      reasonVi: "Cuồng Nộ chỉ có thể phản đòn lên người vừa tấn công mình",
    };
  }
  if (targetPlayerId) {
    const target = view.players.find((p) => p.playerId === targetPlayerId);
    if (!target) {
      return { valid: false, reason: "Target not found", reasonVi: "Mục tiêu không tồn tại" };
    }
    if (target.wounds >= 4) {
      return {
        valid: false,
        reason: "Target is already captured",
        reasonVi: "Mục tiêu đã bị bắt giữ",
      };
    }
  }
  return { valid: true };
}

/**
 * Kiểm tra xem một vai trò có được phép chọn chính mình làm mục tiêu kỹ năng hay không.
 * - Sát Thủ (Rank 2) và Cuồng Chiến (Rank 7) không thể nhắm vào chính mình.
 * - Nhà Giả Kim (Rank 4) được phép tự hồi máu cho bản thân.
 * - Hộ Vệ (Rank 6) được phép tự ban khiên cho bản thân.
 */
export function canAbilityTargetSelf(rank: BloodBoundRoleRank): boolean {
  return rank !== 2 && rank !== 7;
}

/**
 * Lọc danh sách mục tiêu hợp lệ cho kỹ năng của vai trò.
 * Đảm bảo Nhà Giả Kim (Rank 4) và các vai trò hợp lệ khác có thể nhắm vào chính mình trên UI.
 */
export function getEligibleAbilityTargets(
  players: BloodBoundPlayerPublic[],
  actorPlayerId: string,
  rank: BloodBoundRoleRank,
): BloodBoundPlayerPublic[] {
  const allowSelf = canAbilityTargetSelf(rank);
  return players.filter((p) => {
    if (p.wounds >= 4) return false;
    if (!allowSelf && p.playerId === actorPlayerId) return false;
    return true;
  });
}

/**
 * Kiểm tra xem một roomId có phải là phòng demo cục bộ của Huyết Thệ (Blood Bound) hay không.
 * Phòng demo PHẢI có tiền tố 'demo-' hoặc 'demo_' (hoặc đúng bằng 'demo') kết hợp với định danh game.
 * Tránh kiểm tra .includes() rộng để không chiếm dụng các phòng multiplayer thật như 'bloodbound-match-1', 'room-blood-bound'.
 */
export function isBloodBoundDemoRoom(roomId?: string | null): boolean {
  if (!roomId) return false;
  const lower = roomId.trim().toLowerCase();
  const normalized = lower.replace(/_/g, "-");

  if (
    normalized === "demo" ||
    normalized === "demo-blood-bound" ||
    normalized === "demo-bloodbound" ||
    normalized === "demo-huyet-the" ||
    normalized === "demo-huyetthe" ||
    normalized === "demo-crimson-vow"
  ) {
    return true;
  }

  if (normalized.startsWith("demo-")) {
    const suffix = normalized.slice(5);
    return (
      suffix.startsWith("blood-bound") ||
      suffix.startsWith("bloodbound") ||
      suffix.startsWith("huyet-the") ||
      suffix.startsWith("huyetthe") ||
      suffix.startsWith("crimson-vow")
    );
  }

  return false;
}

/**
 * Kiểm tra xem người chơi có cần phải xác nhận trước khi thoát hay không:
 * - Trong phòng demo: không cần xác nhận loại (trả về false)
 * - Khi ván đấu đã kết thúc (GAME_OVER): không cần xác nhận loại (trả về false)
 * - Trong ván đấu multiplayer thật đang diễn ra: bắt buộc phải xác nhận (trả về true)
 */
export function requiresExitConfirmation(
  roomId: string | undefined | null,
  phase: BloodBoundPhase
): boolean {
  if (isBloodBoundDemoRoom(roomId)) {
    return false;
  }
  return phase !== "GAME_OVER";
}


/**
 * Xử lý khi có người can thiệp đỡ đòn:
 * - Người can thiệp BẮT BUỘC nhận sát thương & LỘ TOKEN SỐ (Rank Token)
 * - Kích hoạt quyền sử dụng kỹ năng đặc biệt
 */
export function processIntervene(
  view: BloodBoundView,
  intervenerPlayerId: string,
  _secretCard?: BloodBoundCard,
): BloodBoundView {
  const intervener = view.players.find((p) => p.playerId === intervenerPlayerId);
  const target = view.players.find((p) => p.playerId === view.currentTargetPlayerId);

  return {
    ...view,
    phase: "WOUND_ASSIGNMENT",
    intervenedByPlayerId: intervenerPlayerId,
    publicLog: [
      ...view.publicLog,
      {
        text: `${intervener?.displayName ?? "A player"} boldly intervenes to take the strike for ${target?.displayName ?? "the target"}!`,
        textVi: `🛡️ ${intervener?.displayName ?? "Một người chơi"} dũng cảm nhảy ra đỡ đòn thay cho ${target?.displayName ?? "mục tiêu"}!`,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Xử lý khi không có ai can thiệp (hết giờ hoặc toàn bộ bỏ qua)
 * -> Chuyển sang gán vết thương cho nạn nhân ban đầu
 */
export function processPassIntervention(view: BloodBoundView): BloodBoundView {
  const target = view.players.find((p) => p.playerId === view.currentTargetPlayerId);
  return {
    ...view,
    phase: "WOUND_ASSIGNMENT",
    intervenedByPlayerId: null,
    publicLog: [
      ...view.publicLog,
      {
        text: `No one intervened. The strike directly hits ${target?.displayName ?? "the target"}.`,
        textVi: `🛡️ Không có ai tác động (bỏ qua đỡ đòn).`,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Xử lý gán vết thương & lộ token manh mối:
 * - Nếu người bị đánh có khiên (isShielded), khiên đỡ đòn và không tăng vết thương.
 * - Thêm token lộ diện vào danh sách của người chơi.
 * - Kiểm tra nếu đạt 4 vết thương -> BỊ BẮT (GAME OVER).
 * - Nếu chưa đủ 4 vết thương -> Chuyển quyền cầm Đoản Kiếm cho người vừa nhận đòn.
 */
export function processWoundReveal(
  view: BloodBoundView,
  secretCards: Record<string, BloodBoundCard>,
  chosenTokenType: ClueTokenType,
): BloodBoundView {
  const victimId = view.intervenedByPlayerId ?? view.currentTargetPlayerId;
  if (!victimId) {
    return view;
  }

  const secret = secretCards[victimId];
  if (!secret) {
    return view;
  }

  const victim = view.players.find((p) => p.playerId === victimId);
  if (!victim) {
    return view;
  }

  // 1. Kiểm tra khiên bảo vệ (Guardian Shield)
  if (victim.isShielded) {
    const updatedPlayers = view.players.map((p) => {
      if (p.playerId === victimId) {
        return { ...p, isShielded: false };
      }
      return p;
    });

    return {
      ...view,
      phase: "ATTACK_CHOICE",
      players: updatedPlayers,
      currentTargetPlayerId: null,
      intervenedByPlayerId: null,
      publicLog: [
        ...view.publicLog,
        {
          text: `${victim.displayName}'s Guardian Shield absorbed the damage!`,
          textVi: `Khiên Hộ Vệ của ${victim.displayName} đã hấp thụ hoàn toàn sát thương!`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  // 2. Tính toán token lộ diện
  let tokenValue: string | number;
  let hasRevealedRank = victim.hasRevealedRank;

  // Người can thiệp luôn bắt buộc lộ số
  const actualTokenType: ClueTokenType = view.intervenedByPlayerId ? "RANK" : chosenTokenType;

  switch (actualTokenType) {
    case "RANK":
      tokenValue = secret.rank;
      hasRevealedRank = true;
      break;
    case "COLOR":
      tokenValue = secret.clan === "ROSE" ? "RED" : secret.clan === "FAN" ? "GREEN" : "YELLOW";
      break;
    case "CREST":
      tokenValue = `${secret.clan}-CREST`;
      break;
    case "QUESTION":
    default:
      tokenValue = "?";
      break;
  }

  const newRevealedToken: RevealedToken = {
    type: actualTokenType,
    value: tokenValue,
  };

  const newWounds = victim.wounds + 1;
  const isCaptured = newWounds >= 4;

  const updatedPlayers = view.players.map((p) => {
    if (p.playerId === victimId) {
      return {
        ...p,
        wounds: newWounds,
        hasRevealedRank,
        revealedTokens: [...p.revealedTokens, newRevealedToken],
        isDaggerHolder: !isCaptured, // Trở thành người cầm kiếm tiếp theo nếu chưa chết
      };
    }
    // Người cầm kiếm cũ mất kiếm
    if (p.playerId === view.daggerHolderPlayerId && !isCaptured) {
      return { ...p, isDaggerHolder: false };
    }
    return p;
  });

  // 3. Kiểm tra điều kiện kết thúc trận đấu nếu bị bắt (Wounds == 4)
  if (isCaptured) {
    const isLeader = secret.rank === 1;
    const attackerSecret = secretCards[view.daggerHolderPlayerId];
    const attackerClan = attackerSecret?.clan ?? "ROSE";
    const victimClan = secret.clan;

    // Luật cốt lõi Blood Bound:
    // Bắt đúng Thủ Lĩnh (Leader) của đối phương -> Phe tấn công thắng.
    // Bắt nhầm người vô tội của địch hoặc tự hại phe mình -> Phe đối phương thắng.
    let winnerClan: BloodClan;
    if (victimClan === "INQUISITOR") {
      winnerClan = "INQUISITOR";
    } else if (attackerClan !== victimClan && isLeader) {
      winnerClan = attackerClan;
    } else {
      winnerClan = attackerClan === "ROSE" ? "FAN" : "ROSE";
    }

    return {
      ...view,
      phase: "GAME_OVER",
      players: updatedPlayers,
      winnerClan,
      capturedPlayerId: victimId,
      publicLog: [
        ...view.publicLog,
        {
          text: `${victim.displayName} is CAPTURED! Secret identity: ${secret.clan} ${secret.roleInfo.roleName} (Rank ${secret.rank}).`,
          textVi: `${victim.displayName} ĐÃ BỊ BẮT! Danh tính thật: Gia tộc ${secret.clan} - ${secret.roleInfo.roleNameVi} (Cấp ${secret.rank}).`,
          timestamp: new Date().toISOString(),
        },
        {
          text: isLeader
            ? `Target was the LEADER! ${winnerClan} clan emerges VICTORIOUS!`
            : `Target was NOT the leader! ${winnerClan} clan WINS due to wrongful capture!`,
          textVi: isLeader
            ? `Bắt đúng THỦ LĨNH! Gia tộc ${winnerClan} GIÀNH CHIẾN THẮNG!`
            : `Bắt NHẦM người vô tội! Gia tộc ${winnerClan} CHIẾN THẮNG!`,
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  // 4. Nếu chưa bị bắt -> Chuyển thanh kiếm cho người vừa nhận thương
  return {
    ...view,
    phase: "ATTACK_CHOICE",
    daggerHolderPlayerId: victimId,
    currentTargetPlayerId: null,
    intervenedByPlayerId: null,
    players: updatedPlayers,
    roundNumber: view.roundNumber + 1,
    publicLog: [
      ...view.publicLog,
      {
        text: `${victim.displayName} took 1 wound (${newWounds}/4) and revealed token [${actualTokenType}: ${tokenValue}]. Now holds the dagger.`,
        textVi: `${victim.displayName} nhận 1 vết thương (${newWounds}/4) và để lộ token [${actualTokenType}: ${tokenValue}]. Giờ nắm giữ Đoản Kiếm.`,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Xử lý kích hoạt kỹ năng nhân vật (khi người chơi đã lộ Token Số)
 */
export function applyRoleAbility(
  view: BloodBoundView,
  actorPlayerId: string,
  roleRank: BloodBoundRoleRank,
  targetPlayerId?: string,
  secretCards?: Record<string, BloodBoundCard>,
): BloodBoundView {
  const actor = view.players.find((p) => p.playerId === actorPlayerId);
  if (!actor || actor.hasUsedAbility) {
    return view;
  }

  let updatedPlayers = view.players;
  let logText = "";
  let logTextVi = "";
  let isGameOver = false;
  let winnerClan: BloodClan | null = view.winnerClan;
  let capturedPlayerId: string | null = view.capturedPlayerId;

  switch (roleRank) {
    case 1: // Leader: Bị động, kiên cường giữ vững sĩ khí
      logText = `Leader ${actor.displayName} rallies the clan with unwavering resolve!`;
      logTextVi = `Thủ Lĩnh ${actor.displayName} kiên cường cổ vũ toàn gia tộc!`;
      break;

    case 2: // Assassin: Gây ngay 1 vết thương lên mục tiêu
      if (targetPlayerId) {
        let lethal = false;
        updatedPlayers = view.players.map((p) => {
          if (p.playerId === targetPlayerId) {
            const nextWounds = p.wounds + 1;
            if (nextWounds >= 4) lethal = true;
            return { ...p, wounds: Math.min(4, nextWounds) };
          }
          return p;
        });
        const target = view.players.find((p) => p.playerId === targetPlayerId);
        logText = `Assassin ${actor.displayName} strikes ${target?.displayName ?? "target"}, dealing 1 direct wound!`;
        logTextVi = `Sát thủ ${actor.displayName} xuất chiêu, gây ngay 1 vết thương lên ${target?.displayName ?? "mục tiêu"}!`;

        if (lethal) {
          isGameOver = true;
          capturedPlayerId = targetPlayerId;
          const targetCard = secretCards?.[targetPlayerId];
          const isLeader = targetCard ? targetCard.rank === 1 : false;
          const actorClan = secretCards?.[actorPlayerId]?.clan ?? "ROSE";
          const targetClan = targetCard?.clan ?? (actorClan === "ROSE" ? "FAN" : "ROSE");
          if (targetClan === "INQUISITOR") {
            winnerClan = "INQUISITOR";
          } else if (actorClan !== targetClan && isLeader) {
            winnerClan = actorClan;
          } else {
            winnerClan = actorClan === "ROSE" ? "FAN" : "ROSE";
          }
        }
      }
      break;

    case 3: // Harlequin: Tung ảo ảnh, gắn thêm Token Manh Mối Dấu Hỏi (?) cho mục tiêu
      if (targetPlayerId) {
        updatedPlayers = view.players.map((p) => {
          if (p.playerId === targetPlayerId) {
            return {
              ...p,
              revealedTokens: [...p.revealedTokens, { type: "QUESTION" as ClueTokenType, value: "?" }],
            };
          }
          return p;
        });
        const target = view.players.find((p) => p.playerId === targetPlayerId);
        logText = `Harlequin ${actor.displayName} casts an illusion on ${target?.displayName ?? "target"}, adding a Mystery (?) token!`;
        logTextVi = `Tắc Kè Hoa ${actor.displayName} tung ảo ảnh lên ${target?.displayName ?? "mục tiêu"}, gắn thêm Token Dấu Hỏi (?)!`;
      }
      break;

    case 4: // Alchemist: Hồi 1 vết thương cho bản thân hoặc đồng đội
      if (targetPlayerId) {
        updatedPlayers = view.players.map((p) => {
          if (p.playerId === targetPlayerId) {
            return { ...p, wounds: Math.max(0, p.wounds - 1) };
          }
          return p;
        });
        const target = view.players.find((p) => p.playerId === targetPlayerId);
        logText = `Alchemist ${actor.displayName} uses healing concoction on ${target?.displayName ?? "target"} (-1 wound).`;
        logTextVi = `Nhà giả kim ${actor.displayName} dùng thuốc tiên hồi phục cho ${target?.displayName ?? "mục tiêu"} (-1 vết thương).`;
      }
      break;

    case 5: // Mentalist: Ép đối phương để lộ manh mối chưa công khai
      if (targetPlayerId) {
        const target = view.players.find((p) => p.playerId === targetPlayerId);
        const targetCard = secretCards?.[targetPlayerId];
        const targetClan = targetCard?.clan ?? "ROSE";
        const hasColor = target?.revealedTokens.some((t) => t.type === "COLOR");
        const hasCrest = target?.revealedTokens.some((t) => t.type === "CREST");
        let tokenToReveal: RevealedToken;
        if (!hasColor) {
          tokenToReveal = {
            type: "COLOR",
            value: targetClan === "ROSE" ? "RED" : targetClan === "FAN" ? "GREEN" : "YELLOW",
          };
        } else if (!hasCrest) {
          tokenToReveal = {
            type: "CREST",
            value: `${targetClan}-CREST`,
          };
        } else {
          tokenToReveal = {
            type: "QUESTION",
            value: "?",
          };
        }

        updatedPlayers = view.players.map((p) => {
          if (p.playerId === targetPlayerId) {
            return {
              ...p,
              revealedTokens: [...p.revealedTokens, tokenToReveal],
            };
          }
          return p;
        });
        logText = `Mentalist ${actor.displayName} peers into the thoughts of ${target?.displayName ?? "target"}, forcing a clue token reveal (${tokenToReveal.type})!`;
        logTextVi = `Thần Trí ${actor.displayName} dùng ngoại cảm nhìn thấu ${target?.displayName ?? "mục tiêu"}, ép lộ manh mối (${tokenToReveal.type === "COLOR" ? "Màu phe" : tokenToReveal.type === "CREST" ? "Phù hiệu" : "Dấu hỏi"})!`;
      }
      break;

    case 6: // Guardian: Ban khiên chắn bảo vệ
      if (targetPlayerId) {
        updatedPlayers = view.players.map((p) => {
          if (p.playerId === targetPlayerId) {
            return { ...p, isShielded: true };
          }
          return p;
        });
        const target = view.players.find((p) => p.playerId === targetPlayerId);
        logText = `Guardian ${actor.displayName} grants an Aegis Shield to ${target?.displayName ?? "target"}.`;
        logTextVi = `Hộ vệ ${actor.displayName} ban khiên bảo vệ cho ${target?.displayName ?? "mục tiêu"}.`;
      }
      break;

    case 7: { // Berserker: Phản đòn 1 vết thương lên chính kẻ tấn công
      const berserkerTargetId = targetPlayerId ?? view.daggerHolderPlayerId;
      if (berserkerTargetId && berserkerTargetId !== actorPlayerId) {
        let lethal = false;
        updatedPlayers = view.players.map((p) => {
          if (p.playerId === berserkerTargetId) {
            const nextWounds = p.wounds + 1;
            if (nextWounds >= 4) lethal = true;
            return { ...p, wounds: Math.min(4, nextWounds) };
          }
          return p;
        });
        const target = view.players.find((p) => p.playerId === berserkerTargetId);
        logText = `Berserker ${actor.displayName} strikes back, dealing 1 wound to attacker ${target?.displayName ?? "attacker"}!`;
        logTextVi = `Cuồng Nộ ${actor.displayName} phản đòn trừng phạt, gây 1 vết thương lên kẻ tấn công ${target?.displayName ?? "kẻ tấn công"}!`;

        if (lethal) {
          isGameOver = true;
          capturedPlayerId = berserkerTargetId;
          const targetCard = secretCards?.[berserkerTargetId];
          const isLeader = targetCard ? targetCard.rank === 1 : false;
          const actorClan = secretCards?.[actorPlayerId]?.clan ?? "ROSE";
          const targetClan = targetCard?.clan ?? "FAN";

          if (targetClan === "INQUISITOR") {
            winnerClan = "INQUISITOR";
          } else if (actorClan !== targetClan && isLeader) {
            winnerClan = actorClan;
          } else {
            winnerClan = actorClan === "ROSE" ? "FAN" : "ROSE";
          }
        }
      }
      break;
    }

    case 8: // Courtesan / Inquisitor: Mưu kế thao túng
      if (targetPlayerId) {
        const target = view.players.find((p) => p.playerId === targetPlayerId);
        logText = `${actor.displayName} schemes with Courtesan intrigue, forcing next attack on ${target?.displayName ?? "target"}!`;
        logTextVi = `${actor.displayName} dùng mưu lược Mê Hoặc, ép đòn tấn công tiếp theo phải nhắm vào ${target?.displayName ?? "mục tiêu"}!`;
      }
      break;

    default:
      break;
  }

  // Đánh dấu đã dùng kỹ năng
  updatedPlayers = updatedPlayers.map((p) => {
    if (p.playerId === actorPlayerId) {
      return { ...p, hasUsedAbility: true };
    }
    return p;
  });

  return {
    ...view,
    phase: isGameOver ? "GAME_OVER" : view.phase,
    winnerClan: isGameOver ? winnerClan : view.winnerClan,
    capturedPlayerId: isGameOver ? capturedPlayerId : view.capturedPlayerId,
    forcedAttackTargetId: targetPlayerId ?? view.forcedAttackTargetId,
    players: updatedPlayers,
    publicLog: [
      ...view.publicLog,
      ...(logText ? [{ text: logText, textVi: logTextVi, timestamp: new Date().toISOString() }] : []),
      ...(isGameOver
        ? [
            {
              text: `Player is CAPTURED! ${winnerClan} clan WINS!`,
              textVi: `Người chơi ĐÃ BỊ BẮT! Gia tộc ${winnerClan} CHIẾN THẮNG!`,
              timestamp: new Date().toISOString(),
            },
          ]
        : []),
    ],
  };
}
