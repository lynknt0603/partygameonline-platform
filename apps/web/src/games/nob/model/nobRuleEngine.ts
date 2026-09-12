import { NOB_DEFAULT_TIMING } from "./nobTiming";
import type {
  NobBloodline,
  NobCardInstance,
  NobPlayerPublic,
  NobView,
} from "./nobTypes";
import { NOB_CATALOGUE_ID } from "./nobTypes";
import { NOB_DRAFT_PHASES, NOB_NIGHT_PHASES } from "./nobActions";

export interface NobActionPayload {
  type: string;
  cardInstanceId?: string;
  targetPlayerId?: string;
  option?: string;
  decisionId?: string;
  [key: string]: unknown;
}

export const NOB_PHASE_ORDER: string[] = [
  "DRAFT_PICK_1",
  "DRAFT_PICK_2",
  "SHADOW_STALKER",
  "BLOOD_SEER",
  "SHAPESHIFTER",
  "FERAL_KILLER",
  "HUNTER",
  "ROUND_SUMMARY",
];

export interface PlayerSetupInfo {
  playerId: string;
  displayName: string;
  avatarUrl?: string | null;
}

/**
 * Khởi tạo dữ liệu ván đấu ban đầu cho danh sách người chơi
 */
export function createInitialNobGame(
  roomId: string,
  playersInfo: PlayerSetupInfo[],
  viewingPlayerId: string,
): NobView {
  const playerCount = playersInfo.length;
  const halfCount = Math.floor(playerCount / 2);

  // Tạo phân bổ gia tộc: Nửa Vampire, nửa Werewolf, nếu lẻ thì thêm Halfblood
  const bloodlines: NobBloodline[] = [];
  for (let i = 0; i < halfCount; i += 1) {
    bloodlines.push({ type: "VAMPIRE", rank: i + 1 });
  }
  for (let i = 0; i < halfCount; i += 1) {
    bloodlines.push({ type: "WEREWOLF", rank: i + 1 });
  }
  if (playerCount % 2 !== 0) {
    bloodlines.push({ type: "HALFBLOOD", rank: null });
  }

  const players: NobPlayerPublic[] = playersInfo.map((info, idx) => ({
    playerId: info.playerId,
    displayName: info.displayName,
    avatarUrl: info.avatarUrl ?? null,
    seat: idx,
    alive: true,
    connected: true,
    you: info.playerId === viewingPlayerId,
    moonMarkCount: 0,
    score: 0,
    publiclyRevealedBloodline: null,
    revealedCards: [],
    hiddenCardCount: 2,
    elo: 1200,
    eloDelta: 0,
    newElo: 1200,
  }));

  // Gán bài draft mẫu (3 lá draft cho mỗi người)
  const myDraftHand: NobCardInstance[] = [
    { instanceId: "draft-1", cardCode: "NOB-SS-01", roleType: "SHADOW_STALKER", number: 1 },
    { instanceId: "draft-2", cardCode: "NOB-FK-01", roleType: "FERAL_KILLER", number: 1 },
    { instanceId: "draft-3", cardCode: "NOB-HU-01", roleType: "HUNTER", number: 1 },
  ];

  const viewingIndex = Math.max(0, playersInfo.findIndex((p) => p.playerId === viewingPlayerId));
  const myBloodline = bloodlines[viewingIndex] ?? { type: "VAMPIRE", rank: 1 };

  return {
    gameType: NOB_CATALOGUE_ID,
    roomId,
    you: viewingPlayerId,
    phase: "DRAFT_PICK_1",
    phaseState: "WAITING_FOR_PHASE_SUBMISSIONS",
    roundNumber: 1,
    round: 1,
    version: 1,
    serverTime: new Date().toISOString(),
    finished: false,
    targetScore: 4,
    winnerPlayerIds: [],
    players,
    myHand: [],
    myDraftHand,
    myBloodline,
    myPendingDecision: null,
    submittedPlayerIds: [],
    timing: NOB_DEFAULT_TIMING,
    myMoonMarkValues: [1, 2, 3],
    myObservations: [],
    inspectReveal: null,
    echoCards: [],
    publicLog: [],
  };
}

/**
 * Kiểm tra tính hợp lệ của một hành động gửi lên từ người chơi
 */
export function validateNobAction(
  view: NobView,
  action: NobActionPayload,
  actingPlayerId: string,
): { valid: boolean; reason?: string } {
  if (view.finished) {
    return { valid: false, reason: "Trò chơi đã kết thúc" };
  }

  const player = view.players.find((p) => p.playerId === actingPlayerId);
  if (!player) {
    return { valid: false, reason: "Người chơi không tồn tại trong phòng" };
  }

  if (!player.alive && action.type !== "NOB_REACTION") {
    return { valid: false, reason: "Người chơi đã bị loại không thể thực hiện hành động này" };
  }

  switch (action.type) {
    case "NOB_DRAFT_PICK": {
      if (!NOB_DRAFT_PHASES.has(view.phase)) {
        return { valid: false, reason: "Không phải giai đoạn Draft" };
      }
      if (view.submittedPlayerIds?.includes(actingPlayerId)) {
        return { valid: false, reason: "Bạn đã chọn bài Draft ở lượt này" };
      }
      const hasCard = view.myDraftHand?.some((c) => c.instanceId === action.cardInstanceId);
      if (!hasCard) {
        return { valid: false, reason: "Thẻ bài không có trong tay Draft của bạn" };
      }
      return { valid: true };
    }

    case "NOB_PHASE_SUBMIT": {
      if (!NOB_NIGHT_PHASES.has(view.phase)) {
        return { valid: false, reason: "Không phải giai đoạn giải quyết ban đêm" };
      }
      if (view.submittedPlayerIds?.includes(actingPlayerId)) {
        return { valid: false, reason: "Bạn đã chọn bài cho lượt này" };
      }
      const card = view.myHand.find((c) => c.instanceId === action.cardInstanceId);
      if (!card) {
        return { valid: false, reason: "Không tìm thấy thẻ bài trong tay" };
      }
      if (card.roleType !== view.phase) {
        return {
          valid: false,
          reason: `Thẻ bài ${card.roleType} không khớp với giai đoạn hiện tại (${view.phase})`,
        };
      }
      return { valid: true };
    }

    case "NOB_CHOOSE_TARGET": {
      const pending = view.myPendingDecision;
      if (!pending || pending.type !== "CHOOSE_TARGET") {
        return { valid: false, reason: "Hiện tại không có yêu cầu chọn mục tiêu" };
      }
      if (pending.actorPlayerId && pending.actorPlayerId !== actingPlayerId) {
        return { valid: false, reason: "Không phải lượt bạn chọn mục tiêu" };
      }
      if (!action.targetPlayerId) {
        return { valid: false, reason: "Chưa chỉ định mục tiêu" };
      }
      if (!pending.allowedTargetIds.includes(action.targetPlayerId)) {
        return { valid: false, reason: "Mục tiêu không nằm trong danh sách được phép chọn" };
      }
      const target = view.players.find((p) => p.playerId === action.targetPlayerId);
      if (!target || !target.alive) {
        return { valid: false, reason: "Mục tiêu không còn sống" };
      }
      return { valid: true };
    }

    case "NOB_HUNTER_DECISION": {
      const pending = view.myPendingDecision;
      if (!pending || pending.type !== "HUNTER_DECISION") {
        return { valid: false, reason: "Không có quyết định Thợ Săn nào cần xử lý" };
      }
      if (action.option !== "SPARE" && action.option !== "ELIMINATE") {
        return { valid: false, reason: "Lựa chọn không hợp lệ, phải là SPARE hoặc ELIMINATE" };
      }
      return { valid: true };
    }

    case "NOB_REACTION": {
      const pending = view.myPendingDecision;
      if (!pending || pending.type !== "REACTION") {
        return { valid: false, reason: "Không có cửa sổ phản đòn đang mở" };
      }
      if (pending.targetPlayerId && pending.targetPlayerId !== actingPlayerId) {
        return { valid: false, reason: "Chỉ mục tiêu bị tấn công mới có quyền phản đòn" };
      }
      if (action.option && !pending.allowedOptions.includes(action.option)) {
        return { valid: false, reason: "Tùy chọn phản đòn không nằm trong danh sách cho phép" };
      }
      return { valid: true };
    }

    default:
      return { valid: true };
  }
}

/**
 * Xử lý khi người chơi chọn 1 lá bài trong giai đoạn Draft
 */
export function resolveDraftPick(
  view: NobView,
  playerId: string,
  cardInstanceId: string,
): NobView {
  const card = view.myDraftHand?.find((c) => c.instanceId === cardInstanceId);
  if (!card) {
    return view;
  }

  const nextDraftHand = (view.myDraftHand ?? []).filter((c) => c.instanceId !== cardInstanceId);
  const nextHand = [...view.myHand, card];
  const nextSubmitted = Array.from(new Set([...(view.submittedPlayerIds ?? []), playerId]));

  // Nếu tất cả người chơi còn sống đã submit, chuyển phase
  const alivePlayers = view.players.filter((p) => p.alive);
  const allSubmitted = alivePlayers.every((p) => nextSubmitted.includes(p.playerId));

  let nextPhase = view.phase;
  let nextSubList = nextSubmitted;

  if (allSubmitted) {
    if (view.phase === "DRAFT_PICK_1") {
      nextPhase = "DRAFT_PICK_2";
      nextSubList = [];
    } else if (view.phase === "DRAFT_PICK_2") {
      nextPhase = "SHADOW_STALKER";
      nextSubList = [];
    }
  }

  return {
    ...view,
    phase: nextPhase,
    version: (view.version ?? 0) + 1,
    myHand: nextHand,
    myDraftHand: nextDraftHand,
    submittedPlayerIds: nextSubList,
  };
}

/**
 * Xử lý quyết định của Thợ Săn (Hunter): Tha (SPARE) hoặc Tiêu Diệt (ELIMINATE)
 */
export function resolveHunterDecision(
  view: NobView,
  actorPlayerId: string,
  option: "SPARE" | "ELIMINATE",
): NobView {
  const targetId = view.myPendingDecision?.targetPlayerId;

  let nextPlayers = view.players;
  let nextAnnouncement = view.announcement;

  if (option === "SPARE") {
    nextAnnouncement = {
      id: crypto.randomUUID(),
      type: "HUNTER_SPARED",
      actorPlayerId,
      targetPlayerId: targetId ?? null,
      messageKey: "nob.hunter.spared",
      createdAt: new Date().toISOString(),
    };
  } else {
    // ELIMINATE: Nếu mục tiêu bị loại
    nextPlayers = view.players.map((p) => {
      if (p.playerId === targetId) {
        return { ...p, alive: false };
      }
      return p;
    });
    nextAnnouncement = {
      id: crypto.randomUUID(),
      type: "ELIMINATION_SUCCESS",
      actorPlayerId,
      targetPlayerId: targetId ?? null,
      messageKey: "nob.elimination.success",
      createdAt: new Date().toISOString(),
    };
  }

  // Chuyển sang phase tiếp theo sau Hunter
  const nextView: NobView = {
    ...view,
    players: nextPlayers,
    myPendingDecision: null,
    announcement: nextAnnouncement,
    version: (view.version ?? 0) + 1,
  };

  return checkAndApplyVictory(nextView);
}

/**
 * Xử lý phản đòn (Reaction): Veil Reversal (phản đòn) hoặc Last Offering (hiến tế)
 */
export function resolveReaction(
  view: NobView,
  targetPlayerId: string,
  option: "VEIL_REVERSAL" | "LAST_OFFERING",
): NobView {
  const actorId = view.currentActorPlayerId;
  let nextPlayers = view.players;
  let announcementType = "VEIL_REVERSAL";

  if (option === "VEIL_REVERSAL") {
    // Phản ngược sát thương lên kẻ tấn công
    nextPlayers = view.players.map((p) => {
      if (p.playerId === actorId) {
        return { ...p, alive: false };
      }
      return p;
    });
    announcementType = "VEIL_REVERSAL";
  } else {
    // Last Offering: Hy sinh nhận +1 Moon Mark
    nextPlayers = view.players.map((p) => {
      if (p.playerId === targetPlayerId) {
        return { ...p, alive: false, moonMarkCount: (p.moonMarkCount ?? 0) + 1 };
      }
      return p;
    });
    announcementType = "GLORIOUS_SACRIFICE";
  }

  const nextView: NobView = {
    ...view,
    players: nextPlayers,
    myPendingDecision: null,
    announcement: {
      id: crypto.randomUUID(),
      type: announcementType,
      actorPlayerId: actorId,
      targetPlayerId,
      reactionCardCode: option === "VEIL_REVERSAL" ? "NOB-SP-VEIL-REVERSAL" : "NOB-SP-LAST-OFFERING",
      createdAt: new Date().toISOString(),
    },
    version: (view.version ?? 0) + 1,
  };

  return checkAndApplyVictory(nextView);
}

/**
 * Phân định thắng thua của ván đấu
 */
export function evaluateNobVictory(players: NobPlayerPublic[]): {
  isOver: boolean;
  winningBloodline?: string;
  winnerPlayerIds: string[];
} {
  const alivePlayers = players.filter((p) => p.alive);

  // Nếu chỉ còn 1 hoặc 0 người sống
  if (alivePlayers.length <= 1) {
    const winnerIds = alivePlayers.map((p) => p.playerId);
    const winningType = alivePlayers[0]?.publiclyRevealedBloodline?.type ?? "VAMPIRE";
    return {
      isOver: true,
      winningBloodline: winningType,
      winnerPlayerIds: winnerIds,
    };
  }

  // Nếu bất kỳ người chơi nào đạt đủ targetScore (ví dụ 4 điểm)
  const maxScore = Math.max(...players.map((p) => p.score ?? p.moonMarkCount ?? 0));
  if (maxScore >= 4) {
    const topWinners = players.filter(
      (p) => (p.score ?? p.moonMarkCount ?? 0) === maxScore,
    );
    return {
      isOver: true,
      winningBloodline: topWinners[0]?.publiclyRevealedBloodline?.type ?? "VAMPIRE",
      winnerPlayerIds: topWinners.map((p) => p.playerId),
    };
  }

  return {
    isOver: false,
    winnerPlayerIds: [],
  };
}

/**
 * Kiểm tra và gán trạng thái GAME_OVER nếu có kết quả thắng cuộc
 */
export function checkAndApplyVictory(view: NobView): NobView {
  const victory = evaluateNobVictory(view.players);
  if (!victory.isOver) {
    return view;
  }

  return {
    ...view,
    phase: "GAME_OVER",
    finished: true,
    winnerPlayerIds: victory.winnerPlayerIds,
    lastRoundResult: {
      result: "WIN",
      winningBloodline: victory.winningBloodline,
      lastHopeTriggered: false,
    },
    version: (view.version ?? 0) + 1,
  };
}
