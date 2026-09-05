import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Swords,
  LogOut,
  Heart,
  Bug,
  Bot,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { RoomDto } from "@/shared/api/types";
import type { RoomView } from "@/shared/lobby/roomView";
import { useSessionStore } from "@/shared/state/sessionStore";
import {
  initBloodBoundGame,
  processAcknowledgeLookLeft,
  processAttack,
  processIntervene,
  processPassIntervention,
  processWoundReveal,
  applyRoleAbility,
  validateAttack,
  validateIntervene,
  type InitBloodBoundOptions,
  type PlayerInitInfo,
} from "../model/bloodBoundRules";
import {
  ensureFullPlayerList,
  decideBotAttack,
  decideBotIntervene,
  decideBotWoundReveal,
} from "../model/bloodBoundBot";
import type {
  BloodBoundView,
  BloodBoundCard,
  BloodClan,
  BloodBoundRoleRank,
  ClueTokenType,
} from "../model/bloodBoundTypes";
import { useBloodBoundPrefs } from "../model/bloodBoundPrefs";
import { playBloodBoundSfx, unlockBloodBoundSfx } from "../model/bloodBoundSfx";
import styles from "./BloodBoundPlayPage.module.css";

interface AiLogItem {
  id: string;
  time: string;
  botName: string;
  action: string;
  reasoning: string;
}

function getRolePortraitUrl(rank?: number | null, clan?: BloodClan | string | null): string {
  const normClan = clan?.toUpperCase();
  if (normClan === "ROSE") {
    switch (rank) {
      case 1:
        return "/assets/games/blood-bound/roles/rose/role-1.svg";
      case 2:
        return "/assets/games/blood-bound/roles/rose/role-2.svg";
      case 3:
        return "/assets/games/blood-bound/roles/rose/role-3.svg";
      case 4:
        return "/assets/games/blood-bound/roles/rose/role-4.svg";
      case 6:
        return "/assets/games/blood-bound/roles/rose/role-6.svg";
      default:
        return "/assets/games/blood-bound/roles/mystery/role-mystery-rose.svg";
    }
  } else if (normClan === "FAN") {
    switch (rank) {
      case 1:
        return "/assets/games/blood-bound/roles/fan/role-1.svg";
      case 2:
        return "/assets/games/blood-bound/roles/fan/role-2.svg";
      case 3:
        return "/assets/games/blood-bound/roles/fan/role-3.svg";
      case 4:
        return "/assets/games/blood-bound/roles/fan/role-4.svg";
      case 6:
        return "/assets/games/blood-bound/roles/fan/role-6.svg";
      default:
        return "/assets/games/blood-bound/roles/mystery/role-mystery-fan.svg";
    }
  } else if (normClan === "INQUISITOR" || rank === 8) {
    return "/assets/games/blood-bound/roles/inquisitor/role-8.svg";
  }

  // Nếu chưa rõ gia tộc:
  switch (rank) {
    case 1:
      return "/assets/games/blood-bound/roles/rose/role-1.svg";
    case 2:
      return "/assets/games/blood-bound/roles/rose/role-2.svg";
    case 3:
      return "/assets/games/blood-bound/roles/rose/role-3.svg";
    case 4:
      return "/assets/games/blood-bound/roles/rose/role-4.svg";
    case 6:
      return "/assets/games/blood-bound/roles/rose/role-6.svg";
    case 8:
      return "/assets/games/blood-bound/roles/inquisitor/role-8.svg";
    default:
      return "/assets/games/blood-bound/roles/role-mystery.svg";
  }
}

function getRankName(rank: number): string {
  switch (rank) {
    case 1:
      return "Thủ Lĩnh";
    case 2:
      return "Sát Thủ";
    case 3:
      return "Tắc Kè Hoa";
    case 4:
      return "Nhà Giả Kim";
    case 5:
      return "Thần Trí";
    case 6:
      return "Hộ Vệ";
    case 7:
      return "Cuồng Chiến";
    case 8:
      return "Phán Quan";
    default:
      return `Cấp ${rank}`;
  }
}

function getTokenBadgeInfo(t: { type: ClueTokenType; value: string | number }) {
  if (t.type === "COLOR") {
    if (t.value === "RED") {
      return {
        label: "Màu: Đỏ 🌹",
        tooltip: "Manh mối Đỏ: Người này thuộc Phe Hoa Hồng (Rose) hoặc Kẻ Phán Xét (Inquisitor)",
        colorClass: styles.tokenRed,
      };
    }
    if (t.value === "GREEN") {
      return {
        label: "Màu: Xanh 🪭",
        tooltip: "Manh mối Xanh: Người này thuộc Phe Quạt (Fan) hoặc Kẻ Phán Xét (Inquisitor)",
        colorClass: styles.tokenGreen,
      };
    }
    return {
      label: "Màu: Vàng ⚖️",
      tooltip: "Manh mối Vàng: Người này chắc chắn là Kẻ Phán Xét (Inquisitor)!",
      colorClass: styles.tokenYellow,
    };
  }
  if (t.type === "RANK") {
    const num = Number(t.value);
    return {
      label: `Cấp ${num}: ${getRankName(num)}`,
      tooltip: `Token Cấp Số ${num}: Xác định chính xác vai trò ${getRankName(num)}!`,
      colorClass: styles.tokenRank,
    };
  }
  if (t.type === "CREST") {
    const isRose = t.value === "ROSE";
    return {
      label: isRose ? "Huy Hiệu: Hoa Hồng 🌹" : "Huy Hiệu: Quạt 🪭",
      tooltip: `Huy Hiệu Gia Tộc: Xác thực 100% thuộc Phe ${isRose ? "Hoa Hồng" : "Quạt"} (Chỉ Thủ Lĩnh hoặc Tắc Kè Hoa sở hữu)`,
      colorClass: styles.tokenCrest,
    };
  }
  return {
    label: "❓ Chưa rõ",
    tooltip: "Manh mối chưa được phân định",
    colorClass: styles.tokenBadge,
  };
}

interface BloodBoundPlayPageProps {
  roomId: string;
  room?: RoomView | RoomDto;
}

export function BloodBoundPlayPage({ roomId, room }: BloodBoundPlayPageProps) {
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const myPlayerId = session?.playerId ?? "player-1";

  const [playerCount, setPlayerCount] = useState<number>(8);
  const sound = useBloodBoundPrefs((s) => s.sound);
  const toggleSound = useBloodBoundPrefs((s) => s.toggleSound);

  // Mở khóa AudioContext khi người dùng tương tác lần đầu
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockBloodBoundSfx();
    };
    window.addEventListener("pointerdown", handleFirstGesture, { once: true });
    window.addEventListener("keydown", handleFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, []);

  // 1. Tự động bù đắp Bot khi thiếu người chơi hoặc chơi 1 mình (Solo)
  const initialPlayers = useMemo(() => {
    const rawList = room && room.players.length > 0
      ? room.players.map((p) => ({
          playerId: p.playerId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
        }))
      : [{ playerId: myPlayerId, displayName: session?.displayName ?? "Bạn" }];

    return ensureFullPlayerList(rawList, playerCount);
  }, [room, myPlayerId, session?.displayName, playerCount]);

  // 2. Debug & Role Customization Controls
  const [selectedRole, setSelectedRole] = useState<string>("RANDOM");
  const [startingDaggerChoice, setStartingDaggerChoice] = useState<"YOU" | "BOT">("YOU");
  const [showAbilityModal, setShowAbilityModal] = useState<boolean>(false);

  const buildInitOptions = useCallback(
    (roleKey: string, daggerChoice: "YOU" | "BOT", playersList: PlayerInitInfo[]): InitBloodBoundOptions => {
      const options: InitBloodBoundOptions = {
        shuffle: true,
      };

      if (roleKey !== "RANDOM") {
        const parts = roleKey.split("_");
        const clan = parts[0] as BloodClan;
        const rank = Number(parts[1]) as BloodBoundRoleRank;
        options.assignedRoles = {
          [myPlayerId]: { clan, rank },
        };
      }

      if (daggerChoice === "BOT") {
        const firstBot = playersList.find((p) => p.playerId !== myPlayerId);
        if (firstBot) {
          options.startingDaggerPlayerId = firstBot.playerId;
        }
      } else {
        options.startingDaggerPlayerId = myPlayerId;
      }

      return options;
    },
    [myPlayerId],
  );

  // 3. Game State & Secret Cards
  const [gameState, setGameState] = useState<BloodBoundView>(() => {
    const defaultOpts = { shuffle: true };
    const { view } = initBloodBoundGame(roomId, initialPlayers, myPlayerId, defaultOpts);
    return view;
  });

  const [secretCards, setSecretCards] = useState<Record<string, BloodBoundCard>>(() => {
    const defaultOpts = { shuffle: true };
    const { secretCards: cards } = initBloodBoundGame(roomId, initialPlayers, myPlayerId, defaultOpts);
    return cards;
  });

  // Sắp xếp danh sách ghế để "Bạn" luôn ngồi ở vị trí trang trọng dưới đáy bàn (Index 0),
  // Người bên trái ngồi bên trái (Index 1), và người đối diện ngồi ngay trên đỉnh đối xứng.
  const tableSeats = useMemo(() => {
    const youIdx = gameState.players.findIndex((p) => p.playerId === myPlayerId);
    if (youIdx <= 0) return gameState.players;
    return [...gameState.players.slice(youIdx), ...gameState.players.slice(0, youIdx)];
  }, [gameState.players, myPlayerId]);

  // Tính toán vị trí elip cho từng ghế quanh bàn tròn
  const getSeatPosition = useCallback((index: number, total: number) => {
    if (total <= 0) return { left: "50%", top: "50%" };
    // Bắt đầu từ 90 độ (Đáy bàn / 6 giờ)
    // Tăng góc theo chiều kim đồng hồ tương ứng với hướng bên trái của bạn
    const angle = Math.PI / 2 + (index * 2 * Math.PI) / total;
    const rx = 41; // Bán kính ngang (%)
    const ry = 39; // Bán kính dọc (%)
    const left = 50 + Math.cos(angle) * rx;
    const top = 50 + Math.sin(angle) * ry;
    return { left: `${left.toFixed(1)}%`, top: `${top.toFixed(1)}%` };
  }, []);

  const isDemo = !room || roomId.toLowerCase().includes("demo");
  const canDebug = isDemo || import.meta.env.DEV;

  // 4. Debug & Auto-Play Controls (Chỉ khả dụng trong phòng Demo / Dev)
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [autoPlayHuman, setAutoPlayHuman] = useState<boolean>(false);
  const [botSpeedMs, setBotSpeedMs] = useState<number>(1000);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeLogTab, setActiveLogTab] = useState<"guide" | "game" | "ai">("guide");
  const [aiLogs, setAiLogs] = useState<AiLogItem[]>([]);

  const addAiLog = useCallback((botName: string, action: string, reasoning: string) => {
    setAiLogs((prev) => [
      {
        id: Math.random().toString(36).slice(2, 9),
        time: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
        botName,
        action,
        reasoning,
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  // 5. Reset & Change Settings
  const handleResetGame = useCallback(() => {
    const options = buildInitOptions(selectedRole, startingDaggerChoice, initialPlayers);
    const { view, secretCards: newCards } = initBloodBoundGame(roomId, initialPlayers, myPlayerId, options);
    setGameState(view);
    setSecretCards(newCards);
    setAiLogs([]);
    setShowAbilityModal(false);
    addAiLog(
      "Hệ thống",
      "Khởi tạo ván mới",
      `Đã chia bài mới cho ${initialPlayers.length} người chơi (${selectedRole === "RANDOM" ? "Vai trò ngẫu nhiên" : selectedRole.replace("_", " Cấp ")}).`,
    );
  }, [roomId, initialPlayers, myPlayerId, selectedRole, startingDaggerChoice, buildInitOptions, addAiLog]);

  const handleSelectRole = useCallback(
    (newRoleKey: string) => {
      setSelectedRole(newRoleKey);
      const options = buildInitOptions(newRoleKey, startingDaggerChoice, initialPlayers);
      const { view, secretCards: newCards } = initBloodBoundGame(roomId, initialPlayers, myPlayerId, options);
      setGameState(view);
      setSecretCards(newCards);
      setAiLogs([]);
      setShowAbilityModal(false);
      addAiLog(
        "Hệ thống",
        "Thay đổi nhân vật",
        newRoleKey === "RANDOM"
          ? "Đã chuyển sang chế độ random vai trò cho bạn."
          : `Bạn đã hóa thân thành ${newRoleKey.replace("_", " Cấp ")}.`,
      );
    },
    [buildInitOptions, startingDaggerChoice, initialPlayers, roomId, myPlayerId, addAiLog],
  );

  const handleToggleStartingDagger = useCallback(() => {
    const nextChoice = startingDaggerChoice === "YOU" ? "BOT" : "YOU";
    setStartingDaggerChoice(nextChoice);
    const options = buildInitOptions(selectedRole, nextChoice, initialPlayers);
    const { view, secretCards: newCards } = initBloodBoundGame(roomId, initialPlayers, myPlayerId, options);
    setGameState(view);
    setSecretCards(newCards);
    setAiLogs([]);
    setShowAbilityModal(false);
    addAiLog(
      "Hệ thống",
      "Đổi người mở màn",
      nextChoice === "BOT"
        ? "Bot sẽ mở màn tấn công trước! Bạn có thể nhảy vào đỡ đòn ngay từ đầu."
        : "Bạn sẽ cầm đoản kiếm mở màn trận đấu.",
    );
  }, [startingDaggerChoice, buildInitOptions, selectedRole, initialPlayers, roomId, myPlayerId, addAiLog]);

  const handleChangePlayerCount = useCallback((count: number) => {
    setPlayerCount(count);
    const rawList = room && room.players.length > 0
      ? room.players.map((p) => ({
          playerId: p.playerId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
        }))
      : [{ playerId: myPlayerId, displayName: session?.displayName ?? "Bạn" }];
    const newPlayers = ensureFullPlayerList(rawList, count);
    const options = buildInitOptions(selectedRole, startingDaggerChoice, newPlayers);
    const { view, secretCards: newCards } = initBloodBoundGame(roomId, newPlayers, myPlayerId, options);
    setGameState(view);
    setSecretCards(newCards);
    setAiLogs([]);
    setShowAbilityModal(false);
    addAiLog("Hệ thống", "Đổi số lượng người chơi", `Đã thiết lập bàn chơi ${count} người (${count === 7 ? "Có phe Inquisitor ⚖️" : count === 8 ? "Chế độ Max 8 người ⚔️" : "Tiêu chuẩn 6 người"}).`);
  }, [room, myPlayerId, session?.displayName, roomId, buildInitOptions, selectedRole, startingDaggerChoice, addAiLog]);

  // 5. Bot Auto-Play Loop
  const autoPlayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Chỉ kích hoạt vòng lặp Bot trong phòng Demo / Simulation.
    // Trong phòng Live Multiplayer thật, hành động do người thật qua WebSocket điều khiển.
    if (!isDemo || isPaused || gameState.phase === "GAME_OVER") {
      return;
    }

    // Phase: LOOK_LEFT -> Tự động bắt đầu nếu bật autoPlayHuman
    if (gameState.phase === "LOOK_LEFT" && autoPlayHuman) {
      autoPlayTimerRef.current = window.setTimeout(() => {
        setGameState((curr) => processAcknowledgeLookLeft(curr));
        addAiLog("Bot Bạn", "Bắt đầu ván đấu", "Tự động ghi nhớ manh mối bên trái và vào trận.");
      }, botSpeedMs);
      return () => {
        if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      };
    }

    // Phase: ATTACK_CHOICE
    if (gameState.phase === "ATTACK_CHOICE") {
      const attackerId = gameState.daggerHolderPlayerId;
      const isMyTurn = attackerId === myPlayerId;

      if (!isMyTurn || autoPlayHuman) {
        autoPlayTimerRef.current = window.setTimeout(() => {
          setGameState((curr) => {
            if (curr.phase !== "ATTACK_CHOICE" || curr.daggerHolderPlayerId !== attackerId) {
              return curr;
            }
            const decision = decideBotAttack(curr, attackerId, secretCards);
            if (!decision.targetPlayerId) {
              return curr;
            }
            const attacker = curr.players.find((p) => p.playerId === attackerId);
            addAiLog(
              attacker?.displayName ?? "Bot",
              `Tấn công ${decision.targetName}`,
              decision.reasoning,
            );
            playBloodBoundSfx("attack");
            return processAttack(curr, decision.targetPlayerId);
          });
        }, botSpeedMs);

        return () => {
          if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
        };
      }
    }

    // Phase: INTERVENTION_WINDOW
    if (gameState.phase === "INTERVENTION_WINDOW") {
      const isAttacker = gameState.daggerHolderPlayerId === myPlayerId;
      const isTarget = gameState.currentTargetPlayerId === myPlayerId;
      const userPlayer = gameState.players.find((p) => p.playerId === myPlayerId);
      const canIIntervene = !isAttacker && !isTarget && !userPlayer?.hasRevealedRank && (userPlayer?.wounds ?? 0) < 4;

      // Đếm ngược cửa sổ can thiệp
      const countdown = window.setInterval(() => {
        setGameState((curr) => {
          if (curr.phase !== "INTERVENTION_WINDOW") {
            clearInterval(countdown);
            return curr;
          }
          if (curr.timeRemainingSeconds <= 1) {
            clearInterval(countdown);
            addAiLog("Hệ thống", "Hết giờ can thiệp", "Chuyển sang gán vết thương cho mục tiêu ban đầu.");
            return processPassIntervention(curr);
          }
          return { ...curr, timeRemainingSeconds: curr.timeRemainingSeconds - 1 };
        });
      }, 1000);

      // Thử đánh giá xem có bot đồng minh nào muốn nhảy vào can thiệp đỡ đòn không
      // Nếu người chơi có cơ hội can thiệp (bystander), hãy cho người chơi thời gian suy nghĩ (ít nhất 4.5s)
      const botDelayMs = canIIntervene && !autoPlayHuman ? Math.max(4500, botSpeedMs * 3) : Math.max(1000, botSpeedMs);

      autoPlayTimerRef.current = window.setTimeout(() => {
        setGameState((curr) => {
          if (curr.phase !== "INTERVENTION_WINDOW") return curr;

          for (const p of curr.players) {
            if (p.playerId === myPlayerId && !autoPlayHuman) continue;
            if (p.playerId === curr.daggerHolderPlayerId || p.playerId === curr.currentTargetPlayerId) {
              continue;
            }
            const check = validateIntervene(curr, p.playerId);
            if (!check.valid) continue;

            const decision = decideBotIntervene(curr, p.playerId, secretCards);
            if (decision.shouldIntervene) {
              addAiLog(p.displayName, "Nhảy vào can thiệp đỡ đòn!", decision.reasoning);
              playBloodBoundSfx("intervene");
              return processIntervene(curr, p.playerId, secretCards[p.playerId]);
            }
          }
          return curr;
        });
      }, botDelayMs);

      return () => {
        clearInterval(countdown);
        if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      };
    }

    // Phase: WOUND_ASSIGNMENT
    if (gameState.phase === "WOUND_ASSIGNMENT") {
      const victimId = gameState.intervenedByPlayerId ?? gameState.currentTargetPlayerId;
      const isVictimMe = victimId === myPlayerId;

      if (victimId && (!isVictimMe || autoPlayHuman)) {
        autoPlayTimerRef.current = window.setTimeout(() => {
          setGameState((curr) => {
            if (curr.phase !== "WOUND_ASSIGNMENT") return curr;
            const currentVictim = curr.players.find((p) => p.playerId === victimId);
            if (!currentVictim) return curr;

            const alreadyTokens = currentVictim.revealedTokens.map((t) => t.type);
            const decision = decideBotWoundReveal(victimId, secretCards, alreadyTokens);

            addAiLog(
              currentVictim.displayName,
              `Chọn lộ token [${decision.tokenType}]`,
              decision.reasoning,
            );
            playBloodBoundSfx("wound");
            return processWoundReveal(curr, secretCards, decision.tokenType);
          });
        }, botSpeedMs);

        return () => {
          if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
        };
      }
    }
  }, [
    gameState.phase,
    gameState.daggerHolderPlayerId,
    gameState.currentTargetPlayerId,
    gameState.intervenedByPlayerId,
    isPaused,
    autoPlayHuman,
    botSpeedMs,
    myPlayerId,
    secretCards,
    addAiLog,
  ]);

  // 6. User Handlers
  const you = gameState.players.find((p) => p.playerId === myPlayerId);
  const isMyTurn = gameState.daggerHolderPlayerId === myPlayerId && gameState.phase === "ATTACK_CHOICE";
  const myCard = gameState.mySecretCard;

  // Hiệu ứng âm thanh khi chuyển lượt hoặc kết thúc trận đấu
  useEffect(() => {
    if (gameState.phase === "GAME_OVER") {
      const myClan = myCard?.clan;
      if (myClan && gameState.winnerClan === myClan) {
        playBloodBoundSfx("victory");
      } else {
        playBloodBoundSfx("defeat");
      }
    } else if (gameState.phase === "ATTACK_CHOICE" && gameState.daggerHolderPlayerId === myPlayerId) {
      playBloodBoundSfx("turn");
    }
  }, [gameState.phase, gameState.winnerClan, gameState.daggerHolderPlayerId, myCard?.clan, myPlayerId]);

  const handleStartPlay = () => {
    playBloodBoundSfx("reveal");
    setGameState((curr) => processAcknowledgeLookLeft(curr));
  };

  const handleSelectTarget = (targetPlayerId: string) => {
    if (!isMyTurn) return;
    const check = validateAttack(gameState, myPlayerId, targetPlayerId);
    if (!check.valid) {
      alert(check.reason);
      return;
    }
    const target = gameState.players.find((p) => p.playerId === targetPlayerId);
    addAiLog(
      session?.displayName ?? "Bạn",
      `Tấn công ${target?.displayName ?? "Mục tiêu"}`,
      "Người chơi chủ động chọn mục tiêu trên bàn cờ.",
    );
    playBloodBoundSfx("attack");
    setGameState((curr) => processAttack(curr, targetPlayerId));
  };

  const handleIntervene = () => {
    const check = validateIntervene(gameState, myPlayerId);
    if (!check.valid) {
      alert(check.reason);
      return;
    }
    const mySecret = secretCards[myPlayerId];
    if (mySecret) {
      addAiLog(session?.displayName ?? "Bạn", "Nhảy vào can thiệp đỡ đòn!", "Người chơi dũng cảm xông ra chịu đòn thay cho đồng đội.");
      playBloodBoundSfx("intervene");
      setGameState((curr) => processIntervene(curr, myPlayerId, mySecret));
    }
  };

  const handlePassIntervene = () => {
    setGameState((curr) => processPassIntervention(curr));
  };

  const handleRevealToken = (tokenType: ClueTokenType) => {
    addAiLog(session?.displayName ?? "Bạn", `Lộ token [${tokenType}]`, "Người chơi chọn token manh mối theo ý muốn.");
    playBloodBoundSfx("wound");
    setGameState((curr) => processWoundReveal(curr, secretCards, tokenType));
  };

  const handleUseAbilityTarget = (targetPlayerId: string) => {
    if (!myCard || you?.hasUsedAbility) return;
    const target = gameState.players.find((p) => p.playerId === targetPlayerId);
    if (target) {
      addAiLog(
        session?.displayName ?? "Bạn",
        `Dùng kỹ năng ${myCard.roleInfo.roleNameVi}`,
        `Nhắm vào ${target.displayName}.`,
      );
      if (myCard.rank === 4) {
        playBloodBoundSfx("heal");
      } else if (myCard.rank === 6) {
        playBloodBoundSfx("shield");
      } else {
        playBloodBoundSfx("attack");
      }
      setGameState((curr) => applyRoleAbility(curr, myPlayerId, myCard.rank, target.playerId));
      setShowAbilityModal(false);
    }
  };

  const currentVictimId = gameState.intervenedByPlayerId ?? gameState.currentTargetPlayerId;
  const isVictimMe = currentVictimId === myPlayerId;
  const isIntervenerMe = gameState.intervenedByPlayerId === myPlayerId;

  const isAttacker = gameState.daggerHolderPlayerId === myPlayerId;
  const isTarget = gameState.currentTargetPlayerId === myPlayerId;
  const canIIntervene =
    gameState.phase === "INTERVENTION_WINDOW" &&
    !isAttacker &&
    !isTarget &&
    !you?.hasRevealedRank &&
    (you?.wounds ?? 0) < 4;

  const attackerPlayer = gameState.players.find((p) => p.playerId === gameState.daggerHolderPlayerId);
  const targetPlayer = gameState.players.find((p) => p.playerId === gameState.currentTargetPlayerId);

  return (
    <div className={styles.container}>
      {/* 1. Header with Controls */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.gameTitle}>Blood Bound</h2>
          <span className={styles.phaseBadge}>
            <Swords size={16} /> Phase: {gameState.phase}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Vòng {gameState.roundNumber}
          </span>
        </div>

        <div className={styles.headerRight}>
          {canDebug && (
            <>
              {/* Player Count Selector (6, 7, 8 Max) */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255, 255, 255, 0.05)", padding: "2px 6px", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>Quy mô:</span>
                {[6, 7, 8].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    className={playerCount === cnt ? styles.btnDebugActive : styles.btnDebug}
                    onClick={() => handleChangePlayerCount(cnt)}
                    style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                    title={cnt === 8 ? "Tối đa 8 người chơi (4 Rose vs 4 Fan)" : cnt === 7 ? "7 người chơi (Có Inquisitor ⚖️)" : "6 người chơi chuẩn"}
                  >
                    {cnt}P {cnt === 8 ? "🔥Max" : cnt === 7 ? "⚖️" : ""}
                  </button>
                ))}
              </div>

              {/* Role Picker */}
              <div className={styles.rolePickerBox}>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>Vai:</span>
                <select
                  className={styles.roleSelect}
                  value={selectedRole}
                  onChange={(e) => handleSelectRole(e.target.value)}
                  title="Chọn nhân vật để hóa thân hoặc chọn Random để thử nghiệm nhiều tình huống"
                >
                  <option value="RANDOM">🎲 Ngẫu Nhiên (Mỗi ván 1 vai)</option>
                  <optgroup label="🌹 Gia Tộc Hoa Hồng (Rose)">
                    <option value="ROSE_1">🌹 Cấp 1: Thủ Lĩnh (Leader)</option>
                    <option value="ROSE_2">🌹 Cấp 2: Sát Thủ (Assassin)</option>
                    <option value="ROSE_3">🌹 Cấp 3: Tắc Kè Hoa (Harlequin)</option>
                    <option value="ROSE_4">🌹 Cấp 4: Nhà Giả Kim (Alchemist)</option>
                  </optgroup>
                  <optgroup label="🪭 Gia Tộc Quạt (Fan)">
                    <option value="FAN_1">🪭 Cấp 1: Thủ Lĩnh (Leader)</option>
                    <option value="FAN_2">🪭 Cấp 2: Sát Thủ (Assassin)</option>
                    <option value="FAN_3">🪭 Cấp 3: Tắc Kè Hoa (Harlequin)</option>
                    <option value="FAN_4">🪭 Cấp 4: Nhà Giả Kim (Alchemist)</option>
                  </optgroup>
                  {playerCount === 7 && (
                    <optgroup label="⚖️ Kẻ Phán Xét (Inquisitor)">
                      <option value="INQUISITOR_8">⚖️ Cấp 8: Kẻ Phán Xét</option>
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Starting Dagger Toggle */}
              <button
                type="button"
                className={startingDaggerChoice === "BOT" ? styles.btnAutoActive : styles.btnDebug}
                onClick={handleToggleStartingDagger}
                title="Đổi ai cầm kiếm mở màn. Chọn 'Bot mở màn' để bot tấn công trước -> Bạn có thể nhảy vào đỡ đòn ngay từ đầu!"
              >
                🗡️ {startingDaggerChoice === "BOT" ? "Bot mở màn (Test đỡ đòn)" : "Bạn mở màn"}
              </button>

              {/* Debug Mode Toggle */}
              <button
                type="button"
                className={debugMode ? styles.btnDebugActive : styles.btnDebug}
                onClick={() => setDebugMode(!debugMode)}
                title="Bật/Tắt hiển thị danh tính bí mật và bảng log AI (Chỉ dùng trong Demo/Dev)"
              >
                <Bug size={15} /> Debug: {debugMode ? "BẬT" : "TẮT"}
              </button>

              {/* AI Takeover (Auto-Play Human) */}
              <button
                type="button"
                className={autoPlayHuman ? styles.btnAutoActive : styles.btnAuto}
                onClick={() => setAutoPlayHuman(!autoPlayHuman)}
                title="Cho phép Bot tự động đánh hộ lượt của bạn (Thích hợp chạy mô phỏng)"
              >
                <Bot size={15} /> AI Đánh Hộ: {autoPlayHuman ? "BẬT" : "TẮT"}
              </button>

              {/* Speed Toggle */}
              <button
                type="button"
                className={styles.btnIcon}
                onClick={() => setBotSpeedMs((s) => (s === 500 ? 1200 : 500))}
                title="Tốc độ lượt bot"
              >
                <Zap size={15} color={botSpeedMs === 500 ? "#f59e0b" : "#94a3b8"} />
                {botSpeedMs === 500 ? "0.5s" : "1.2s"}
              </button>

              {/* Pause / Resume */}
              <button
                type="button"
                className={styles.btnIcon}
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? "Tiếp tục" : "Tạm dừng"}
              >
                {isPaused ? <Play size={15} color="#22c55e" /> : <Pause size={15} />}
              </button>

              {/* Reset Game */}
              <button
                type="button"
                className={styles.btnIcon}
                onClick={handleResetGame}
                title="Chia bài và bắt đầu lại ván mới"
              >
                <RotateCcw size={15} /> Ván Mới
              </button>
            </>
          )}

          {/* Sound Toggle */}
          <button
            type="button"
            className={styles.btnIcon}
            onClick={toggleSound}
            title={sound ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {sound ? <Volume2 size={16} color="#38bdf8" /> : <VolumeX size={16} color="#94a3b8" />}
            <span>{sound ? "Âm Thanh" : "Tắt Tiếng"}</span>
          </button>

          {/* Exit Room */}
          <button
            type="button"
            className={styles.btnIcon}
            onClick={() => navigate(room ? `/rooms/${room.id}` : "/rooms")}
          >
            <LogOut size={16} /> Rời Bàn
          </button>
        </div>
      </header>

      {/* 2. Main Table & Log Sidebar */}
      <div className={styles.mainBoard}>
        <div className={styles.tableArea}>
          <div className={styles.tableWrapper}>
            {/* 1. Chiếc bàn tròn / bầu dục trung tâm */}
            <div className={styles.pokerTable} />

            {/* 2. Lớp SVG các mũi tên khép kín chỉ hướng bên trái và trục đối diện */}
            <svg
              className={styles.tableOverlaySvg}
              viewBox="0 0 1000 700"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <marker
                  id="arrow-rose"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
                </marker>
                <marker
                  id="arrow-purple"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" />
                </marker>
                <marker
                  id="arrow-green"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                </marker>
                <marker
                  id="arrow-amber"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                </marker>
              </defs>

              {/* Viền nỉ nhung & chỉ vàng của mặt bàn */}
              <ellipse
                cx="500"
                cy="350"
                rx="420"
                ry="285"
                fill="none"
                stroke="rgba(245, 158, 11, 0.16)"
                strokeWidth="1.8"
                strokeDasharray="8 6"
              />

              {/* Vòng định vị thu hẹp bên trong (Inner concentric guiding circle) */}
              <ellipse
                cx="500"
                cy="350"
                rx="200"
                ry="130"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />

              {/* Trục đối diện: Đường nối xác định người đối diện (Opposite Sightline thu hẹp) */}
              <line
                x1="500"
                y1="220"
                x2="500"
                y2="480"
                stroke="#f59e0b"
                strokeWidth="1.6"
                strokeDasharray="5 5"
                opacity="0.4"
              />

              {/* VÒNG MŨI TÊN KHÉP KÍN THU HẸP (rx=200, ry=130 - NẰM GỌN TRONG TÂM BÀN, CÁCH XA GHẾ NGỒI) */}
              {/* Cung 1: Từ Đáy (Bạn) -> Vòng sang Bên Trái */}
              <path
                d="M 440 477 A 200 130 0 0 1 300 370"
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.2"
                strokeDasharray="5 4"
                markerEnd="url(#arrow-rose)"
                opacity="0.9"
              />
              {/* Cung 2: Từ Bên Trái -> Vòng lên Đỉnh (Người Đối Diện) */}
              <path
                d="M 300 330 A 200 130 0 0 1 440 223"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2.2"
                strokeDasharray="5 4"
                markerEnd="url(#arrow-purple)"
                opacity="0.9"
              />
              {/* Cung 3: Từ Đỉnh -> Vòng sang Bên Phải */}
              <path
                d="M 560 223 A 200 130 0 0 1 700 330"
                fill="none"
                stroke="#34d399"
                strokeWidth="2.2"
                strokeDasharray="5 4"
                markerEnd="url(#arrow-green)"
                opacity="0.9"
              />
              {/* Cung 4: Từ Bên Phải -> Vòng về Đáy (Bạn) */}
              <path
                d="M 700 370 A 200 130 0 0 1 560 477"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.2"
                strokeDasharray="5 4"
                markerEnd="url(#arrow-amber)"
                opacity="0.9"
              />

              {/* La bàn / Tâm chỉ hướng bàn tròn thu gọn tinh xảo */}
              <g transform="translate(500, 350)">
                <circle r="46" fill="rgba(15, 10, 24, 0.88)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1.8" />
                <circle r="38" fill="none" stroke="rgba(192, 132, 252, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
                <text y="-6" textAnchor="middle" fill="#fda4af" fontSize="9.5" fontWeight="bold" letterSpacing="0.8">
                  ⟲ HƯỚNG BÊN TRÁI
                </text>
                <text y="8" textAnchor="middle" fill="#94a3b8" fontSize="8" letterSpacing="0.5">
                  LOOK LEFT
                </text>
                <text y="21" textAnchor="middle" fill="#fde68a" fontSize="8" fontWeight="600">
                  ↕ ĐỐI DIỆN
                </text>
              </g>
            </svg>

            {/* 3. Vùng Ghế Ngồi Xung Quanh Bàn Tròn */}
            <div className={styles.seatsRoundArea}>
              {tableSeats.map((player, index) => {
                const isYou = player.playerId === myPlayerId;
                const isLeftNeighbor = index === 1;
                const isOpposite = index === Math.floor(tableSeats.length / 2);
                const isDaggerHolder = gameState.daggerHolderPlayerId === player.playerId;
                const isTarget = gameState.currentTargetPlayerId === player.playerId;
                const isIntervener = gameState.intervenedByPlayerId === player.playerId;
                const secret = secretCards[player.playerId];
                const pos = getSeatPosition(index, tableSeats.length);

                // Xác định thông tin hiển thị danh tính & gia tộc:
                const isRevealedToUser = isYou || (canDebug && debugMode) || gameState.phase === "GAME_OVER";
                const trueClan = secret?.clan;
                const trueRank = secret?.rank;

                // Suy luận gia tộc từ các token manh mối đã công khai
                let deducedClan: BloodClan | null = null;
                const crestToken = player.revealedTokens.find((t) => t.type === "CREST");
                if (crestToken) {
                  deducedClan = crestToken.value === "ROSE" ? "ROSE" : "FAN";
                } else {
                  const colorToken = player.revealedTokens.find((t) => t.type === "COLOR");
                  if (colorToken?.value === "YELLOW") deducedClan = "INQUISITOR";
                  else if (colorToken?.value === "RED") deducedClan = "ROSE";
                  else if (colorToken?.value === "GREEN") deducedClan = "FAN";
                }

                const displayClan = isRevealedToUser ? trueClan : deducedClan;
                const hasRankRevealed = player.revealedTokens.some((t) => t.type === "RANK");
                const displayRank = isRevealedToUser ? trueRank : hasRankRevealed ? trueRank : null;
                const portraitUrl = getRolePortraitUrl(displayRank, displayClan);

                return (
                  <div
                    key={player.playerId}
                    className={`${styles.seatCardRound} ${isDaggerHolder ? styles.isDagger : ""} ${
                      isTarget || isIntervener ? styles.isTarget : ""
                    } ${isYou ? styles.isYou : ""} ${isLeftNeighbor ? styles.isLeftNeighbor : ""} ${
                      isOpposite ? styles.isOpposite : ""
                    }`}
                    style={{
                      left: pos.left,
                      top: pos.top,
                      cursor: isMyTurn && !isYou ? "pointer" : "default",
                    }}
                    onClick={() => handleSelectTarget(player.playerId)}
                    title={
                      isYou
                        ? "Vị trí của bạn (Đáy bàn)"
                        : isLeftNeighbor
                        ? "Người ngồi bên trái bạn (Mục tiêu xem manh mối đầu trận)"
                        : isOpposite
                        ? "Người ngồi trực diện đối diện bạn qua tâm bàn"
                        : ""
                    }
                  >
                    {/* Header: Avatar Chân Dung Nhân Vật theo phe, Tên & Biểu Tượng Kiếm/Khiên */}
                    <div className={styles.seatAvatarRow}>
                      <div
                        className={`${styles.seatAvatarFrame} ${
                          displayClan === "ROSE"
                            ? styles.frameRose
                            : displayClan === "FAN"
                            ? styles.frameFan
                            : displayClan === "INQUISITOR"
                            ? styles.frameInquisitor
                            : styles.frameMystery
                        }`}
                        title={
                          isYou
                            ? `Vai trò của bạn: ${secret?.roleInfo.roleNameVi ?? "Chưa rõ"}`
                            : isRevealedToUser && secret
                            ? `${secret.clan} - ${secret.roleInfo.roleNameVi} (Rank ${secret.rank})`
                            : displayClan
                            ? `Đã nhận diện: Phe ${displayClan === "ROSE" ? "Hoa Hồng 🌹" : displayClan === "FAN" ? "Quạt 🪭" : "Phán Xét ⚖️"}`
                            : "Danh tính còn trong bóng tối"
                        }
                      >
                        <img
                          src={portraitUrl}
                          alt="Portrait"
                          className={styles.seatAvatarImg}
                        />
                      </div>

                      <div className={styles.seatAvatarInfo}>
                        <span className={styles.seatName}>{player.displayName}</span>
                        <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginTop: "2px" }}>
                          {isYou && (
                            <span className={`${styles.seatRelationBadge} ${styles.badgeYou}`}>BẠN</span>
                          )}
                          {isLeftNeighbor && (
                            <span className={`${styles.seatRelationBadge} ${styles.badgeLeft}`} title="Người ngồi bên trái bạn">
                              BÊN TRÁI ⟲
                            </span>
                          )}
                          {isOpposite && (
                            <span className={`${styles.seatRelationBadge} ${styles.badgeOpposite}`} title="Người ngồi đối diện bạn">
                              ĐỐI DIỆN ⚔️
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.seatDaggerShield}>
                        {isDaggerHolder && (
                          <img
                            src="/assets/games/blood-bound/tokens/token-dagger.svg"
                            alt="Đoản Kiếm"
                            style={{ width: 22, height: 22 }}
                            title="Đang cầm Đoản Kiếm — Lượt tấn công!"
                          />
                        )}
                        {player.isShielded && (
                          <img
                            src="/assets/games/blood-bound/tokens/token-shield.svg"
                            alt="Khiên"
                            style={{ width: 22, height: 22 }}
                            title="Được Khiên Hộ Vệ bảo vệ (Miễn nhiễm sát thương)"
                          />
                        )}
                      </div>
                    </div>

                    {/* God View / Debug Identity Badge (Chỉ hiện khi dev/demo và bật debug) */}
                    {canDebug && debugMode && secret && (
                      <div
                        className={`${styles.debugIdentity} ${
                          secret.clan === "ROSE"
                            ? styles.debugIdentityRose
                            : secret.clan === "FAN"
                            ? styles.debugIdentityFan
                            : styles.debugIdentityInquisitor
                        }`}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <img
                            src={
                              secret.clan === "ROSE"
                                ? "/assets/games/blood-bound/clans/clan-rose.svg"
                                : secret.clan === "FAN"
                                ? "/assets/games/blood-bound/clans/clan-fan.svg"
                                : "/assets/games/blood-bound/clans/clan-inquisitor.svg"
                            }
                            alt={secret.clan}
                            style={{ width: 18, height: 18 }}
                          />
                          {secret.roleInfo.roleNameVi}
                        </span>
                        <span>Rank {secret.rank}</span>
                      </div>
                    )}

                    {/* Wounds Section - Chú thích rõ chỉ số 0/4 vết thương */}
                    <div className={styles.woundSection}>
                      <div className={styles.woundHeaderRow}>
                        <span className={styles.woundTitle} title="Chỉ số Vết thương: Chịu đủ 4 vết thương sẽ bị BẮT GIỮ">
                          🩸 Vết thương:
                        </span>
                        <span className={`${styles.woundValue} ${player.wounds >= 3 ? styles.woundDanger : ""}`}>
                          {player.wounds}/4
                        </span>
                        {player.wounds >= 4 && <span className={styles.statusCaptured}>BỊ BẮT</span>}
                        {player.wounds === 3 && <span className={styles.statusDanger}>NGUY KỊCH</span>}
                      </div>

                      <div className={styles.woundsTrack}>
                        {[0, 1, 2, 3].map((idx) => (
                          <div
                            key={idx}
                            className={`${styles.woundPip} ${idx < player.wounds ? styles.filled : ""}`}
                            title={`Vết thương thứ ${idx + 1}/4`}
                          >
                            {idx < player.wounds && (
                              <img
                                src="/assets/games/blood-bound/tokens/token-wound.svg"
                                alt="Wound"
                                style={{ width: "100%", height: "100%" }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className={styles.woundHint}>
                        {player.wounds === 0
                          ? "Chưa nhận vết thương nào"
                          : player.wounds >= 4
                          ? "Đã chịu đủ 4 đòn — Bị Bắt Giữ!"
                          : `Đã dính ${player.wounds}/4 vết thương (còn ${4 - player.wounds} đòn)`}
                      </div>
                    </div>

                    {/* Revealed Tokens Section - Chú thích chi tiết manh mối đã lộ */}
                    <div className={styles.tokensSection}>
                      <div className={styles.tokensHeader}>
                        <span>🔍 Manh mối đã lộ:</span>
                      </div>
                      <div className={styles.tokensRow}>
                        {player.revealedTokens.length === 0 ? (
                          <span className={styles.noTokensText}>Chưa có manh mối</span>
                        ) : (
                          player.revealedTokens.map((t, idx) => {
                            const badgeInfo = getTokenBadgeInfo(t);
                            return (
                              <span
                                key={idx}
                                className={`${styles.tokenBadge} ${badgeInfo.colorClass}`}
                                title={badgeInfo.tooltip}
                              >
                                {badgeInfo.label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          {/* Center Popups per Phase */}
          {gameState.phase === "LOOK_LEFT" && (
            <div className={styles.arenaCenter}>
              <div className={styles.arenaTitle}>Giai đoạn: Liếc Bên Trái (Look Left)</div>
              <div className={styles.arenaSubtitle}>
                Bạn bí mật biết được manh mối của người ngồi cạnh bên trái:
              </div>
              <div style={{ margin: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                {gameState.leftNeighborClue ? (
                  <>
                    <img
                      src={
                        gameState.leftNeighborClue.clan === "ROSE"
                          ? "/assets/games/blood-bound/clans/clan-rose.svg"
                          : gameState.leftNeighborClue.clan === "FAN"
                          ? "/assets/games/blood-bound/clans/clan-fan.svg"
                          : "/assets/games/blood-bound/clans/clan-inquisitor.svg"
                      }
                      alt={gameState.leftNeighborClue.clan}
                      style={{ width: 64, height: 64 }}
                    />
                    <div style={{ fontSize: "1.1rem", color: "#f43f5e", fontWeight: 700 }}>
                      Gia tộc: {gameState.leftNeighborClue.clan === "ROSE" ? "Hoa Hồng (Rose)" : gameState.leftNeighborClue.clan === "FAN" ? "Quạt (Fan)" : "Kẻ Phán Xét (Inquisitor)"}
                    </div>
                  </>
                ) : (
                  "Không có manh mối"
                )}
              </div>
              <button className={styles.btnPrimary} onClick={handleStartPlay}>
                Tôi Đã Nhớ, Bắt Đầu Cuộc Chiến!
              </button>
            </div>
          )}

          {gameState.phase === "INTERVENTION_WINDOW" && (
            <div className={styles.arenaCenter}>
              {isAttacker ? (
                <>
                  <div className={styles.arenaTitle} style={{ color: "#38bdf8" }}>
                    ⚔️ Bạn Đang Tấn Công {targetPlayer?.displayName}!
                  </div>
                  <div className={styles.arenaSubtitle}>
                    Cửa sổ can thiệp mở ({gameState.timeRemainingSeconds}s). Bạn là kẻ tấn công (không thể tự đỡ đòn). Đang chờ xem có đồng minh nào của đối phương nhảy ra đỡ đòn không...
                  </div>
                  <div className={styles.actionButtons}>
                    <button className={styles.btnPrimary} onClick={handlePassIntervene}>
                      ⏩ Tiếp Tục Đòn Đánh (Không Cần Chờ)
                    </button>
                  </div>
                </>
              ) : isTarget ? (
                <>
                  <div className={styles.arenaTitle} style={{ color: "#f59e0b" }}>
                    🎯 Bạn Đang Là Mục Tiêu Bị Tấn Công!
                  </div>
                  <div className={styles.arenaSubtitle}>
                    {attackerPlayer?.displayName} đang nhắm đoản kiếm vào bạn! ({gameState.timeRemainingSeconds}s). Bạn là nạn nhân (không thể tự đỡ cho mình). Đang chờ xem có đồng minh nào nhảy ra đỡ đòn cứu bạn không...
                  </div>
                  <div className={styles.actionButtons}>
                    <button className={styles.btnSecondary} onClick={handlePassIntervene}>
                      🛡️ Nhận Đòn Ngay (Không Chờ Cứu)
                    </button>
                  </div>
                </>
              ) : canIIntervene ? (
                <>
                  <div className={styles.arenaTitle} style={{ color: "#f43f5e" }}>
                    🚨 CƠ HỘI CAN THIỆP ĐỠ ĐÒN! 🚨
                  </div>
                  <div className={styles.arenaSubtitle}>
                    <strong>{attackerPlayer?.displayName}</strong> đang tấn công <strong>{targetPlayer?.displayName}</strong>! ({gameState.timeRemainingSeconds}s)
                    <br />
                    Bạn có muốn nhảy vào nhận đòn thay không? Khi nhảy vào, bạn nhận 1 vết thương, được <strong>lộ Token Số</strong> và kích hoạt kỹ năng đặc biệt của <strong>{myCard?.roleInfo.roleNameVi ?? "nhân vật"}</strong>!
                  </div>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.btnPrimary}
                      onClick={handleIntervene}
                      style={{
                        background: "linear-gradient(135deg, #e11d48, #be123c)",
                        padding: "10px 22px",
                        fontSize: "1rem",
                        boxShadow: "0 0 15px rgba(225, 29, 72, 0.5)",
                      }}
                    >
                      🛡️ NHẢY VÀO ĐỠ ĐÒN HỘ {targetPlayer?.displayName}!
                    </button>
                    <button className={styles.btnSecondary} onClick={handlePassIntervene}>
                      Bỏ Qua (Không Đỡ) ⏭️
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.arenaTitle}>Cửa Sổ Can Thiệp Đỡ Đòn</div>
                  <div className={styles.arenaSubtitle}>
                    {attackerPlayer?.displayName} đang tấn công {targetPlayer?.displayName} ({gameState.timeRemainingSeconds}s).
                    {you?.hasRevealedRank ? " Bạn đã lộ Token Số nên không thể can thiệp nữa." : " Đang chờ các người chơi khác..."}
                  </div>
                  <div className={styles.actionButtons}>
                    <button className={styles.btnSecondary} onClick={handlePassIntervene}>
                      Bỏ Qua Chờ ⏭️
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {gameState.phase === "WOUND_ASSIGNMENT" && (
            <div className={styles.arenaCenter}>
              {isIntervenerMe ? (
                <>
                  <div className={styles.arenaTitle} style={{ color: "#f43f5e" }}>
                    🛡️ Can Thiệp Đỡ Đòn Thành Công!
                  </div>
                  <div className={styles.arenaSubtitle}>
                    Bạn vừa dũng cảm nhận đòn thay đồng đội! Bạn nhận 1 vết thương và <strong>bắt buộc phải để lộ Token Cấp Số ({myCard?.rank})</strong> để kích hoạt kỹ năng đặc biệt của {myCard?.roleInfo.roleNameVi}:
                  </div>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => handleRevealToken("RANK")}
                      style={{ background: "linear-gradient(135deg, #e11d48, #be123c)", padding: "10px 24px", fontSize: "1rem" }}
                    >
                      ✨ Lộ Token Số {myCard?.rank} & Mở Khóa Kỹ Năng!
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.arenaTitle}>Nhận Vết Thương & Chọn Lộ Manh Mối</div>
                  <div className={styles.arenaSubtitle}>
                    {isVictimMe
                      ? "Bạn vừa bị tấn công! Hãy chọn 1 token manh mối để lộ trước mặt:"
                      : "Đang đợi nạn nhân chọn token manh mối lộ diện..."}
                  </div>
                  {isVictimMe && !autoPlayHuman && (
                    <div className={styles.actionButtons}>
                      <button className={styles.btnSecondary} onClick={() => handleRevealToken("COLOR")}>
                        Lộ Màu Phe
                      </button>
                      <button className={styles.btnSecondary} onClick={() => handleRevealToken("CREST")}>
                        Lộ Phù Hiệu
                      </button>
                      <button className={styles.btnPrimary} onClick={() => handleRevealToken("RANK")}>
                        Lộ Token Số (Rank)
                      </button>
                      <button className={styles.btnSecondary} onClick={() => handleRevealToken("QUESTION")}>
                        Lộ Dấu Hỏi (?)
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {gameState.phase === "GAME_OVER" && (
            <div className={styles.arenaCenter}>
              <div className={styles.arenaTitle} style={{ color: "#fbbf24", fontSize: "1.4rem" }}>
                🏆 TRẬN ĐẤU KẾT THÚC 🏆
              </div>
              <div
                className={styles.arenaSubtitle}
                style={{ fontSize: "1.1rem", color: "#f8fafc", margin: "14px 0" }}
              >
                Gia tộc chiến thắng: <strong>{gameState.winnerClan}</strong>!
              </div>
              <div className={styles.actionButtons}>
                <button className={styles.btnPrimary} onClick={handleResetGame}>
                  Chơi Lại Ván Mới
                </button>
                <button className={styles.btnSecondary} onClick={() => navigate("/rooms")}>
                  Trở Về Sảnh Chờ
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* 3. Right Sidebar: Guide Cheatsheet, AI Logs, Game Event Logs */}
        <aside className={styles.logBox}>
          <div className={styles.logTabs}>
            <button
              type="button"
              className={`${styles.logTabBtn} ${activeLogTab === "guide" ? styles.logTabBtnActive : ""}`}
              onClick={() => setActiveLogTab("guide")}
            >
              📖 Sổ Tay (0/4)
            </button>
            <button
              type="button"
              className={`${styles.logTabBtn} ${activeLogTab === "game" ? styles.logTabBtnActive : ""}`}
              onClick={() => setActiveLogTab("game")}
            >
              📜 Sự Kiện
            </button>
            {canDebug && (
              <button
                type="button"
                className={`${styles.logTabBtn} ${activeLogTab === "ai" ? styles.logTabBtnActive : ""}`}
                onClick={() => setActiveLogTab("ai")}
              >
                🧠 AI ({aiLogs.length})
              </button>
            )}
          </div>

          <div className={styles.logContentArea}>
            {activeLogTab === "guide" && (
              <div className={styles.guideContainer}>
                <div className={styles.guideSection}>
                  <h5 className={styles.guideHeading}>🩸 Chỉ số Vết thương (0/4) là gì?</h5>
                  <p className={styles.guideText}>
                    Mỗi người chơi có thanh chịu đòn gồm <strong>4 vết thương</strong> (0/4):
                  </p>
                  <ul className={styles.guideList}>
                    <li>Mỗi lần bị tấn công hoặc nhảy vào can thiệp đỡ đòn sẽ nhận <strong>+1 vết thương</strong>.</li>
                    <li>Khi bị thương, người chơi <strong>bắt buộc phải lật 1 Token Manh mối</strong> (Màu phe hoặc Huy hiệu).</li>
                    <li>Ai chịu <strong>vết thương thứ 4 (4/4)</strong> sẽ ngay lập tức bị <strong>BẮT GIỮ</strong> và ván đấu kết thúc!</li>
                    <li style={{ color: "#fb7185" }}>
                      <strong>🎯 Quy tắc Thắng / Thua:</strong>
                      <br />• Bắt trúng <strong>Thủ Lĩnh (#1)</strong> đối phương 👉 Phe bạn <strong>Thắng</strong>!
                      <br />• Bắt nhầm người khác 👉 Phe đối phương <strong>Thắng</strong>!
                    </li>
                  </ul>
                </div>

                <div className={styles.guideSection}>
                  <h5 className={styles.guideHeading}>🔍 Manh Mối & Phe Phái</h5>
                  <div className={styles.guideClanGrid}>
                    <div className={styles.guideClanCardRose}>
                      <div className={styles.guideClanHeader}>
                        <img src="/assets/games/blood-bound/clans/clan-rose.svg" alt="Rose" style={{ width: 20, height: 20 }} />
                        <strong>Gia Tộc Hoa Hồng (Rose)</strong>
                      </div>
                      <div>Tông chủ đạo: <strong>Màu Đỏ 🌹</strong></div>
                      <div>Manh mối: Token Đỏ, Huy hiệu Hoa Hồng hoàng gia</div>
                    </div>

                    <div className={styles.guideClanCardFan}>
                      <div className={styles.guideClanHeader}>
                        <img src="/assets/games/blood-bound/clans/clan-fan.svg" alt="Fan" style={{ width: 20, height: 20 }} />
                        <strong>Gia Tộc Quạt (Fan)</strong>
                      </div>
                      <div>Tông chủ đạo: <strong>Màu Xanh Lá 🪭</strong></div>
                      <div>Manh mối: Token Xanh, Huy hiệu Quạt ngọc bích</div>
                    </div>

                    <div className={styles.guideClanCardInq}>
                      <div className={styles.guideClanHeader}>
                        <img src="/assets/games/blood-bound/clans/clan-inquisitor.svg" alt="Inquisitor" style={{ width: 20, height: 20 }} />
                        <strong>Kẻ Phán Xét (Inquisitor)</strong>
                      </div>
                      <div>Tông chủ đạo: <strong>Màu Vàng ⚖️</strong> (Bàn lẻ 7 người)</div>
                      <div>Mục tiêu: Phải là người chịu vết thương thứ 4 để thắng solo!</div>
                    </div>
                  </div>
                </div>

                <div className={styles.guideSection}>
                  <h5 className={styles.guideHeading}>🛡️ Can Thiệp Đỡ Đòn & Kỹ Năng</h5>
                  <p className={styles.guideText}>
                    Khi kẻ địch tấn công đồng minh, bạn có thể bấm <strong>"Nhảy vào đỡ đòn"</strong>:
                  </p>
                  <ul className={styles.guideList}>
                    <li>Bạn nhận 1 vết thương thay cho đồng minh.</li>
                    <li>Được <strong>lật Token Cấp Số</strong> của mình.</li>
                    <li>Ngay lập tức kích hoạt <strong>Kỹ Năng Vai Trò</strong> (Sát thủ chém mục tiêu, Giả kim hồi máu, Hộ vệ ban khiên...).</li>
                  </ul>
                </div>
              </div>
            )}

            {activeLogTab === "ai" && canDebug && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {aiLogs.length === 0 ? (
                  <p style={{ color: "#64748b", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
                    Chưa có hành động AI. Các lượt suy luận và tấn công của Bot sẽ hiển thị tại đây theo thời gian thực.
                  </p>
                ) : (
                  aiLogs.map((item) => (
                    <div key={item.id} className={styles.aiLogCard}>
                      <div className={styles.aiLogTop}>
                        <span className={styles.aiLogBotName}>{item.botName}</span>
                        <span>{item.time}</span>
                      </div>
                      <div className={styles.aiLogAction}>{item.action}</div>
                      <div className={styles.aiLogReason}>{item.reasoning}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeLogTab === "game" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {gameState.publicLog.length === 0 ? (
                  <p style={{ color: "#64748b", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
                    Chưa có sự kiện nào trong trận đấu.
                  </p>
                ) : (
                  gameState.publicLog.slice(-30).map((log, idx) => (
                    <div key={idx} className={styles.logEntry}>
                      {log.textVi || log.text}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* 4. Bottom HUD: Player Identity & Role Info */}
      <footer className={styles.bottomHud}>
        <div className={styles.myCardBox}>
          <div className={styles.myPortraitContainer}>
            <img
              src={getRolePortraitUrl(myCard?.rank, myCard?.clan)}
              alt="Portrait"
              className={styles.myPortraitImg}
            />
            <div className={styles.myClanBadgeOverlay}>
              <img
                src={
                  myCard?.clan === "ROSE"
                    ? "/assets/games/blood-bound/clans/clan-rose.svg"
                    : myCard?.clan === "FAN"
                    ? "/assets/games/blood-bound/clans/clan-fan.svg"
                    : "/assets/games/blood-bound/clans/clan-inquisitor.svg"
                }
                alt={myCard?.clan ?? "Clan"}
                style={{ width: 18, height: 18 }}
              />
            </div>
          </div>
          <div className={styles.myCardInfo}>
            <div className={styles.myCardTitleRow}>
              <h4 style={{ margin: 0 }}>
                {myCard?.clan === "ROSE" ? "🌹 Gia Tộc Hoa Hồng" : myCard?.clan === "FAN" ? "🪭 Gia Tộc Quạt" : "⚖️ Kẻ Phán Xét"} • {myCard?.roleInfo.roleNameVi} (Cấp {myCard?.rank})
              </h4>
              <span className={styles.myWoundBadge}>
                🩸 Máu: {you?.wounds ?? 0}/4 ({4 - (you?.wounds ?? 0)} vết thương còn lại trước khi bị bắt)
              </span>
            </div>
            <p className={styles.myAbilityDesc}>
              <strong>Kỹ năng:</strong> {myCard?.roleInfo.abilityDescVi}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {you?.hasRevealedRank && !you?.hasUsedAbility && myCard && myCard.rank !== 1 && (
            <button className={styles.btnPrimary} onClick={() => setShowAbilityModal(true)}>
              <Heart size={16} /> Kích Hoạt Kỹ Năng {myCard.roleInfo.roleNameVi} (Cấp {myCard.rank})
            </button>
          )}
          {isMyTurn && (
            <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.9rem" }}>
              👉 Hãy click vào một người chơi trên bàn để tấn công!
            </span>
          )}
        </div>
      </footer>

      {/* 5. Modal Chọn Mục Tiêu Kích Hoạt Kỹ Năng Nhân Vật */}
      {showAbilityModal && myCard && (
        <div className={styles.modalOverlay} onClick={() => setShowAbilityModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              <Heart size={20} color="#f43f5e" />
              Kỹ Năng: {myCard.roleInfo.roleNameVi} (Cấp {myCard.rank})
            </div>
            <div className={styles.modalDesc}>
              {myCard.roleInfo.abilityDescVi}
              <br />
              <strong style={{ color: "#f8fafc", display: "inline-block", marginTop: "6px" }}>
                Hãy chọn 1 người chơi làm mục tiêu:
              </strong>
            </div>
            <div className={styles.targetGrid}>
              {gameState.players
                .filter((p) => p.playerId !== myPlayerId && p.wounds < 4)
                .map((target) => (
                  <button
                    key={target.playerId}
                    type="button"
                    className={styles.targetBtn}
                    onClick={() => handleUseAbilityTarget(target.playerId)}
                  >
                    <span>{target.displayName}</span>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      Vết thương: {target.wounds}/4 {target.isShielded ? "🛡️ (Có khiên)" : ""}
                    </span>
                  </button>
                ))}
            </div>
            <button
              type="button"
              className={styles.btnSecondary}
              style={{ alignSelf: "flex-end", marginTop: "6px" }}
              onClick={() => setShowAbilityModal(false)}
            >
              Hủy Bỏ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
