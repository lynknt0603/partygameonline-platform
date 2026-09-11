import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Swords,
  LogOut,
  Heart,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { RoomDto } from "@/shared/api/types";
import type { RoomView } from "@/shared/lobby/roomView";
import { useSessionStore } from "@/shared/state/sessionStore";
import { leaveRoom } from "@/shared/api/rooms";
import { cacheSession } from "@/shared/api/session";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { saveActiveGame, clearActiveGame } from "@/shared/state/activeGameStorage";
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
  getEligibleAbilityTargets,
  isBloodBoundDemoRoom,
  requiresExitConfirmation,
  type InitBloodBoundOptions,
  type PlayerInitInfo,
} from "../model/bloodBoundRules";
import {
  ensureFullPlayerList,
  decideBotAttack,
  decideBotIntervene,
  decideBotWoundReveal,
} from "../model/bloodBoundBot";
import {
  type BloodBoundView,
  type BloodBoundCard,
  type BloodClan,
  type BloodBoundRoleRank,
  type ClueTokenType,
  type BloodBoundCommand,
  hydrateBloodBoundCard,
} from "../model/bloodBoundTypes";
import { useBloodBoundPrefs } from "../model/bloodBoundPrefs";
import { playBloodBoundSfx, unlockBloodBoundSfx } from "../model/bloodBoundSfx";
import { BloodBoundTable } from "../components/BloodBoundTable";
import { BloodBoundCheatsheet, type AiLogItem } from "../components/BloodBoundCheatsheet";
import { BloodBoundWoundModal } from "../components/BloodBoundWoundModal";
import { BloodBoundGodView } from "../components/BloodBoundGodView";
import { BloodBoundFireworks } from "../components/BloodBoundFireworks";
import { BloodBoundGameOverModal } from "../components/BloodBoundGameOverModal";
import type { SpeechBubbleData } from "../components/BloodBoundSpeechBubble";
import styles from "./BloodBoundPlayPage.module.css";

export interface BloodBoundPlayPageProps {
  roomId?: string;
  room?: RoomDto | RoomView | null;
  view?: BloodBoundView | null;
  snapshotPending?: boolean;
  snapshotError?: Error | null;
  notice?: string | null;
  rejectCode?: string | null;
  sendCommand?: (command: BloodBoundCommand) => string | null;
}

export function BloodBoundPlayPage({
  roomId = "demo-blood-bound",
  room,
  view: serverView,
  snapshotPending,
  snapshotError,
  notice,
  rejectCode,
  sendCommand,
}: BloodBoundPlayPageProps) {
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const myPlayerId = session?.playerId ?? "player-you";

  // Web Audio User Interaction Unlock
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

  const [playerCount, setPlayerCount] = useState<number>(6);

  // 1. Tự động bù đắp Bot khi thiếu người chơi trong phòng Demo/Solo
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

  // 3. Fallback Client Game State & Secret Cards
  const [initialGameData] = useState(() => {
    const defaultOpts = { shuffle: true };
    return initBloodBoundGame(roomId, initialPlayers, myPlayerId, defaultOpts);
  });
  const [gameState, setGameState] = useState<BloodBoundView>(initialGameData.view);
  const [secretCards, setSecretCards] = useState<Record<string, BloodBoundCard>>(initialGameData.secretCards);

  // Dual-mode state determination
  const isRoomInGame = room?.status === "IN_GAME" || (room?.status as string) === "in_game";
  const isServerAuthoritative = Boolean(serverView && sendCommand && isRoomInGame);
  const activeView: BloodBoundView = isServerAuthoritative && serverView ? serverView : gameState;

  // Sắp xếp danh sách ghế để "Bạn" luôn ngồi ở vị trí đáy bàn
  const tableSeats = useMemo(() => {
    const youIdx = activeView.players.findIndex((p) => p.playerId === myPlayerId);
    if (youIdx <= 0) return activeView.players;
    return [...activeView.players.slice(youIdx), ...activeView.players.slice(0, youIdx)];
  }, [activeView.players, myPlayerId]);

  const isDemo = !room || isBloodBoundDemoRoom(roomId);
  const canDebug = isDemo || import.meta.env.DEV;

  // 4. Debug & Auto-Play Controls
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [autoPlayHuman, setAutoPlayHuman] = useState<boolean>(false);
  const [botSpeedMs, setBotSpeedMs] = useState<number>(2200); // Tăng thời gian mặc định lên 2.2s để người chơi kịp đọc & tư duy
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState<"guide" | "game" | "ai">("guide");
  const [aiLogs, setAiLogs] = useState<AiLogItem[]>([]);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(true);

  // 4b. Popup Lời nói nhân vật (Speech Bubbles) & Đếm ngược Can Thiệp
  const [speechBubbles, setSpeechBubbles] = useState<Record<string, SpeechBubbleData>>({});
  const [interventionCountdown, setInterventionCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const totalCountdown = 4.5;

  const triggerBubble = useCallback(
    (playerId: string, text: string, type: SpeechBubbleData["type"] = "info", durationMs: number = 3200) => {
      const bubbleData: SpeechBubbleData = { text, type, timestamp: Date.now() };
      setSpeechBubbles((prev) => ({ ...prev, [playerId]: bubbleData }));
      window.setTimeout(() => {
        setSpeechBubbles((prev) => {
          if (prev[playerId]?.timestamp === bubbleData.timestamp) {
            const copy = { ...prev };
            delete copy[playerId];
            return copy;
          }
          return prev;
        });
      }, durationMs);
    },
    [],
  );

  const getClueLabel = useCallback((tokenType: ClueTokenType, card?: BloodBoundCard | null): string => {
    if (tokenType === "COLOR") {
      const clan = card?.clan ?? "ROSE";
      return clan === "ROSE" ? "Màu Đỏ" : clan === "FAN" ? "Màu Xanh" : "Màu Vàng";
    }
    if (tokenType === "CREST") {
      const clan = card?.clan ?? "ROSE";
      return clan === "ROSE" ? "Phù Hiệu Hoa Hồng" : clan === "FAN" ? "Phù Hiệu Quạt" : "Phù Hiệu Phán Xét";
    }
    if (tokenType === "RANK") {
      return `Cấp Số ${card?.rank ?? "?"}`;
    }
    return "Hỏi Số Chẵn / Lẻ";
  }, []);

  useEffect(() => {
    if (!isDemo && roomId) {
      if (activeView.phase === "GAME_OVER") {
        clearActiveGame(roomId);
      } else {
        saveActiveGame({ roomId, gameId: "blood-bound", gameTitle: "Huyết Thệ" });
      }
    }
  }, [isDemo, roomId, activeView.phase]);

  const purgeAndNavigateRooms = useCallback(async () => {
    if (!isDemo && roomId) {
      try {
        await leaveRoom(roomId);
      } catch {
        /* ignore network error when forfeiting */
      }
    }
    clearActiveGame(roomId);
    clearActiveGame();
    const session = useSessionStore.getState().session;
    if (session && (!roomId || session.currentRoomId?.toUpperCase() === roomId.toUpperCase())) {
      const updated = { ...session, currentRoomId: null };
      useSessionStore.setState({ session: updated });
      cacheSession(updated);
    }
    navigate("/rooms");
  }, [isDemo, roomId, navigate]);

  const addAiLog = useCallback((botName: string, action: string, reasoning: string) => {
    setAiLogs((prev) => [
      {
        id: crypto.randomUUID(),
        time: new Date().toLocaleTimeString(),
        botName,
        action,
        reasoning,
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const handleChangePlayerCount = (count: number) => {
    setPlayerCount(count);
    const newPlayers = ensureFullPlayerList(
      [{ playerId: myPlayerId, displayName: session?.displayName ?? "Bạn" }],
      count,
    );
    const opts = buildInitOptions(selectedRole, startingDaggerChoice, newPlayers);
    const { view, secretCards: cards } = initBloodBoundGame(roomId, newPlayers, myPlayerId, opts);
    setGameState(view);
    setSecretCards(cards);
    setAiLogs([]);
  };

  const handleSelectRole = (roleKey: string) => {
    setSelectedRole(roleKey);
    const opts = buildInitOptions(roleKey, startingDaggerChoice, initialPlayers);
    const { view, secretCards: cards } = initBloodBoundGame(roomId, initialPlayers, myPlayerId, opts);
    setGameState(view);
    setSecretCards(cards);
  };

  const handleToggleStartingDagger = () => {
    const nextChoice = startingDaggerChoice === "YOU" ? "BOT" : "YOU";
    setStartingDaggerChoice(nextChoice);
    const opts = buildInitOptions(selectedRole, nextChoice, initialPlayers);
    const { view, secretCards: cards } = initBloodBoundGame(roomId, initialPlayers, myPlayerId, opts);
    setGameState(view);
    setSecretCards(cards);
  };

  const handleResetGame = () => {
    const opts = buildInitOptions(selectedRole, startingDaggerChoice, initialPlayers);
    const { view, secretCards: cards } = initBloodBoundGame(roomId, initialPlayers, myPlayerId, opts);
    setGameState(view);
    setSecretCards(cards);
    setAiLogs([]);
  };

  // 4c. Derived State & Turn Status
  const you = activeView.players.find((p) => p.playerId === myPlayerId);
  const isMyTurn = activeView.daggerHolderPlayerId === myPlayerId && activeView.phase === "ATTACK_CHOICE";
  const rawMyCard = activeView.mySecretCard ?? secretCards[myPlayerId] ?? null;
  const myCard = hydrateBloodBoundCard(rawMyCard);

  const currentVictimId = activeView.intervenedByPlayerId ?? activeView.currentTargetPlayerId;
  const isVictimMe = currentVictimId === myPlayerId;
  const isAttacker = activeView.daggerHolderPlayerId === myPlayerId;
  const isTarget = activeView.currentTargetPlayerId === myPlayerId;
  const canIIntervene =
    activeView.phase === "INTERVENTION_WINDOW" &&
    !isAttacker &&
    !isTarget &&
    !you?.hasRevealedRank &&
    (you?.wounds ?? 0) < 4;

  const attackerPlayer = activeView.players.find((p) => p.playerId === activeView.daggerHolderPlayerId);
  const targetPlayer = activeView.players.find((p) => p.playerId === activeView.currentTargetPlayerId);
  const victimPlayer = activeView.players.find((p) => p.playerId === currentVictimId);

  const tableSecretCards = useMemo(() => {
    if (isServerAuthoritative) {
      return myCard ? { [myPlayerId]: myCard } : {};
    }
    return secretCards;
  }, [isServerAuthoritative, myCard, myPlayerId, secretCards]);

  const winningPlayers = useMemo(() => {
    if (!activeView.winnerClan) return [];
    return activeView.players
      .filter((p) => {
        const card = tableSecretCards[p.playerId];
        return card && card.clan === activeView.winnerClan;
      })
      .map((p) => p.playerId);
  }, [activeView.winnerClan, activeView.players, tableSecretCards]);

  const gameOverReason = useMemo(() => {
    if (activeView.phase !== "GAME_OVER") return null;
    const captured = activeView.players.find((p) => p.playerId === activeView.capturedPlayerId);
    const capturedCard = activeView.capturedPlayerId ? tableSecretCards[activeView.capturedPlayerId] : null;
    if (captured && capturedCard) {
      if (capturedCard.rank === 1) {
        return `Bắt giữ thành công Thủ Lĩnh đối phương (${captured.displayName} - Cấp 1)!`;
      }
      return `Bắt nhầm người vô tội (${captured.displayName} - Cấp ${capturedCard.rank})!`;
    }
    return "Trận đấu đã phân định thắng bại!";
  }, [activeView.phase, activeView.capturedPlayerId, activeView.players, tableSecretCards]);

  const handlePassIntervene = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setInterventionCountdown(null);
    if (isServerAuthoritative && sendCommand) {
      sendCommand({ type: "PASS_INTERVENE" });
    } else {
      setGameState((curr) => processPassIntervention(curr));
    }
  }, [isServerAuthoritative, sendCommand]);

  // 4d. Đếm ngược Cửa Sổ Can Thiệp (Cho phép người chơi có 4.5s suy nghĩ, không bị rush)
  useEffect(() => {
    if (activeView.phase === "INTERVENTION_WINDOW" && canIIntervene && !autoPlayHuman) {
      setInterventionCountdown(totalCountdown);
      const startTime = Date.now();
      countdownIntervalRef.current = window.setInterval(() => {
        const elapsedSec = (Date.now() - startTime) / 1000;
        const remain = Math.max(0, totalCountdown - elapsedSec);
        setInterventionCountdown(remain);
        if (remain <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          handlePassIntervene();
        }
      }, 100);
      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      };
    } else {
      setInterventionCountdown(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [activeView.phase, canIIntervene, autoPlayHuman, handlePassIntervene, totalCountdown]);

  // 5. Bot Decision Loop (Chỉ chạy khi ở chế độ Client Simulation)
  const autoPlayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isServerAuthoritative || isPaused || activeView.phase === "GAME_OVER") {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      return;
    }

    // Phase: ATTACK_CHOICE
    if (gameState.phase === "ATTACK_CHOICE") {
      const isDaggerMe = gameState.daggerHolderPlayerId === myPlayerId;
      if (!isDaggerMe || autoPlayHuman) {
        autoPlayTimerRef.current = window.setTimeout(() => {
          setGameState((curr) => {
            if (curr.phase !== "ATTACK_CHOICE") return curr;
            const attackerId = curr.daggerHolderPlayerId;
            const attacker = curr.players.find((p) => p.playerId === attackerId);
            if (!attacker) return curr;

            const decision = decideBotAttack(curr, attackerId, secretCards);
            addAiLog(attacker.displayName, `Tấn công ${decision.targetName}`, decision.reasoning);
            triggerBubble(attackerId, `⚔️ Ta tấn công ${decision.targetName}!`, "attack", 3500);
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
      // Nếu người chơi thật có thể can thiệp thì chờ người chơi bấm hoặc hết giờ đếm ngược
      if (canIIntervene && !autoPlayHuman) {
        return;
      }

      const candidates = gameState.players.filter(
        (p) =>
          p.playerId !== gameState.daggerHolderPlayerId &&
          p.playerId !== gameState.currentTargetPlayerId &&
          !p.hasRevealedRank &&
          p.wounds < 4,
      );

      const botCandidates = candidates.filter((p) => p.playerId !== myPlayerId);

      autoPlayTimerRef.current = window.setTimeout(() => {
        setGameState((curr) => {
          if (curr.phase !== "INTERVENTION_WINDOW") return curr;

          for (const bot of botCandidates) {
            const botSecret = secretCards[bot.playerId];
            if (!botSecret) continue;

            const decision = decideBotIntervene(curr, bot.playerId, secretCards);
            if (decision.shouldIntervene) {
              addAiLog(bot.displayName, "Nhảy vào đỡ đòn cứu đồng đội!", decision.reasoning);
              triggerBubble(bot.playerId, "🛡️ Dừng tay! Ta sẽ đỡ đòn này!", "intervene", 3500);
              playBloodBoundSfx("intervene");
              const next = processIntervene(curr, bot.playerId, botSecret);
              return processWoundReveal(next, secretCards, "RANK");
            }
          }

          return processPassIntervention(curr);
        });
      }, botSpeedMs + 400);

      return () => {
        if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      };
    }

    // Phase: WOUND_ASSIGNMENT
    if (gameState.phase === "WOUND_ASSIGNMENT") {
      const victimId = gameState.intervenedByPlayerId ?? gameState.currentTargetPlayerId;
      const isVictimMeCheck = victimId === myPlayerId;

      if (victimId && (!isVictimMeCheck || autoPlayHuman)) {
        autoPlayTimerRef.current = window.setTimeout(() => {
          setGameState((curr) => {
            if (curr.phase !== "WOUND_ASSIGNMENT") return curr;
            const currentVictim = curr.players.find((p) => p.playerId === victimId);
            if (!currentVictim) return curr;

            const alreadyTokens = currentVictim.revealedTokens.map((t) => t.type);
            const decision = decideBotWoundReveal(victimId, secretCards, alreadyTokens);
            const clueText = getClueLabel(decision.tokenType, secretCards[victimId]);

            addAiLog(currentVictim.displayName, `Chọn lộ token [${decision.tokenType}]`, decision.reasoning);
            triggerBubble(victimId, `🩸 Ta để lộ manh mối: [${clueText}]!`, "wound", 3500);
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
    isServerAuthoritative,
    gameState.phase,
    gameState.daggerHolderPlayerId,
    gameState.currentTargetPlayerId,
    gameState.intervenedByPlayerId,
    isPaused,
    autoPlayHuman,
    botSpeedMs,
    myPlayerId,
    secretCards,
    canIIntervene,
    addAiLog,
    triggerBubble,
    getClueLabel,
  ]);

  // 6. Audio Feedback on Phase Transitions
  useEffect(() => {
    if (activeView.phase === "GAME_OVER") {
      if (activeView.winnerClan && myCard?.clan && activeView.winnerClan === myCard.clan) {
        playBloodBoundSfx("victory");
      } else {
        playBloodBoundSfx("defeat");
      }
    } else if (activeView.phase === "ATTACK_CHOICE" && activeView.daggerHolderPlayerId === myPlayerId) {
      playBloodBoundSfx("turn");
    }
  }, [activeView.phase, activeView.winnerClan, activeView.daggerHolderPlayerId, myCard?.clan, myPlayerId]);

  // 7. User Action Handlers (Dual Mode)
  const handleStartPlay = () => {
    triggerBubble(myPlayerId, "👁️ Đã xem manh mối bên trái!", "info", 3000);
    playBloodBoundSfx("reveal");
    if (isServerAuthoritative && sendCommand) {
      sendCommand({ type: "ACKNOWLEDGE_LOOK_LEFT" });
    } else {
      setGameState((curr) => processAcknowledgeLookLeft(curr));
    }
  };

  const handleSelectTarget = (targetPlayerId: string) => {
    if (!isMyTurn) return;
    const check = validateAttack(activeView, myPlayerId, targetPlayerId);
    if (!check.valid) {
      alert(check.reason);
      return;
    }
    const target = activeView.players.find((p) => p.playerId === targetPlayerId);
    triggerBubble(myPlayerId, `⚔️ Ta tấn công ${target?.displayName ?? "Mục tiêu"}!`, "attack", 3500);
    addAiLog(session?.displayName ?? "Bạn", `Tấn công ${target?.displayName ?? "Mục tiêu"}`, "Người chơi chủ động chọn mục tiêu trên bàn.");
    playBloodBoundSfx("attack");

    if (isServerAuthoritative && sendCommand) {
      sendCommand({ type: "ATTACK", targetPlayerId });
    } else {
      setGameState((curr) => processAttack(curr, targetPlayerId));
    }
  };

  const handleIntervene = () => {
    const check = validateIntervene(activeView, myPlayerId);
    if (!check.valid) {
      alert(check.reason);
      return;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setInterventionCountdown(null);
    triggerBubble(myPlayerId, "🛡️ Ta nhảy vào đỡ đòn cứu đồng đội!", "intervene", 3500);
    addAiLog(session?.displayName ?? "Bạn", "Nhảy vào can thiệp đỡ đòn!", "Người chơi dũng cảm xông ra chịu đòn thay cho đồng đội.");
    playBloodBoundSfx("intervene");

    if (isServerAuthoritative && sendCommand) {
      sendCommand({ type: "INTERVENE" });
    } else {
      const mySecret = secretCards[myPlayerId];
      if (mySecret) {
        setGameState((curr) => {
          const next = processIntervene(curr, myPlayerId, mySecret);
          return processWoundReveal(next, secretCards, "RANK");
        });
      }
    }
  };

  const handleRevealToken = (tokenType: ClueTokenType) => {
    const clueText = getClueLabel(tokenType, myCard);
    triggerBubble(myPlayerId, `🩸 Ta để lộ manh mối: [${clueText}]!`, "wound", 3500);
    addAiLog(session?.displayName ?? "Bạn", `Lộ token [${tokenType}]`, "Người chơi chọn token manh mối theo ý muốn.");
    playBloodBoundSfx("wound");

    if (isServerAuthoritative && sendCommand) {
      sendCommand({ type: "REVEAL_CLUE", tokenType });
    } else {
      setGameState((curr) => processWoundReveal(curr, secretCards, tokenType));
    }
  };

  const handleUseAbilityTarget = (targetPlayerId: string) => {
    if (!myCard || you?.hasUsedAbility) return;
    const target = activeView.players.find((p) => p.playerId === targetPlayerId);
    if (target) {
      triggerBubble(myPlayerId, `✨ Dùng kỹ năng ${myCard.roleInfo?.roleNameVi ?? "Vai trò"} lên ${target.displayName}!`, "ability", 3500);
      addAiLog(session?.displayName ?? "Bạn", `Dùng kỹ năng ${myCard.roleInfo?.roleNameVi ?? "Vai trò"}`, `Nhắm vào ${target.displayName}.`);
      if (myCard.rank === 4) {
        playBloodBoundSfx("heal");
      } else if (myCard.rank === 6) {
        playBloodBoundSfx("shield");
      } else {
        playBloodBoundSfx("attack");
      }

      if (isServerAuthoritative && sendCommand) {
        sendCommand({
          type: "USE_ABILITY",
          targetPlayerId: target.playerId,
          abilityTargetPlayerId: target.playerId,
        });
      } else {
        setGameState((curr) => applyRoleAbility(curr, myPlayerId, myCard.rank, target.playerId, secretCards));
      }
      setShowAbilityModal(false);
    }
  };

  const showWoundModal = activeView.phase === "WOUND_ASSIGNMENT" && isVictimMe && !autoPlayHuman;
  const soundPrefs = useBloodBoundPrefs();

  if (!isDemo && isRoomInGame && !serverView) {
    if (snapshotError) {
      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h2 className={styles.gameTitle}>Huyết Thệ</h2>
            </div>
            <div className={styles.headerRight}>
              <button
                type="button"
                className={styles.btnNavBack}
                onClick={() => void purgeAndNavigateRooms()}
              >
                <LogOut size={16} /> Thoát phòng
              </button>
            </div>
          </header>
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#f87171" }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>Không thể tải ván đấu Huyết Thệ từ máy chủ</p>
            <p style={{ color: "#94a3b8", margin: "12px 0 24px" }}>
              {snapshotError.message || "Vui lòng kiểm tra lại kết nối mạng."}
            </p>
            <button type="button" className={styles.btnPrimary} onClick={() => window.location.reload()}>
              Thử lại
            </button>
          </div>
        </div>
      );
    }
    if (snapshotPending || !serverView) {
      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h2 className={styles.gameTitle}>Huyết Thệ</h2>
            </div>
            <div className={styles.headerRight}>
              <button
                type="button"
                className={styles.btnNavBack}
                onClick={() => void purgeAndNavigateRooms()}
              >
                <LogOut size={16} /> Thoát phòng
              </button>
            </div>
          </header>
          <div style={{ padding: "80px 20px", textAlign: "center", color: "#94a3b8" }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Đang kết nối bàn cờ Huyết Thệ...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className={styles.container}>
      {notice && (
        <div style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid #ef4444", color: "#fca5a5", padding: "8px 16px", borderRadius: "8px", margin: "10px 16px 0", fontSize: "0.85rem" }}>
          ⚠️ {notice} {rejectCode ? `[${rejectCode}]` : ""}
        </div>
      )}
      {/* 1. Header with Title, Sound & Controls */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.gameTitle}>Huyết Thệ</h2>
          <span className={styles.phaseBadge}>
            <Swords size={16} /> Phase: {activeView.phase}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
            Vòng {activeView.roundNumber}
          </span>
          {isServerAuthoritative && (
            <span style={{ fontSize: "0.75rem", background: "rgba(34, 197, 94, 0.2)", color: "#4ade80", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
              ● LIVE SERVER
            </span>
          )}
        </div>

        <div className={styles.headerRight}>
          <button
            type="button"
            className={styles.btnIcon}
            onClick={soundPrefs.toggleSound}
            title={soundPrefs.sound ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {soundPrefs.sound ? <Volume2 size={16} color="#4ade80" /> : <VolumeX size={16} color="#94a3b8" />}
          </button>

          {canDebug && !isServerAuthoritative && (
            <BloodBoundGodView
              playerCount={playerCount}
              selectedRole={selectedRole}
              startingDaggerChoice={startingDaggerChoice}
              debugMode={debugMode}
              autoPlayHuman={autoPlayHuman}
              botSpeedMs={botSpeedMs}
              isPaused={isPaused}
              onChangePlayerCount={handleChangePlayerCount}
              onSelectRole={handleSelectRole}
              onToggleStartingDagger={handleToggleStartingDagger}
              onToggleDebugMode={() => setDebugMode(!debugMode)}
              onToggleAutoPlay={() => setAutoPlayHuman(!autoPlayHuman)}
              onToggleSpeed={() => setBotSpeedMs((s) => (s === 500 ? 1200 : 500))}
              onTogglePause={() => setIsPaused(!isPaused)}
              onResetGame={handleResetGame}
            />
          )}

          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => {
              if (!requiresExitConfirmation(roomId, activeView.phase)) {
                void purgeAndNavigateRooms();
              } else {
                setConfirmLeaveOpen(true);
              }
            }}
            title="Thoát về trang chủ"
          >
            <LogOut size={16} /> Thoát
          </button>
        </div>
      </header>

      {/* 2. Main Arena: Radial Table (with Center Action Hub) + Cheatsheet Sidebar */}
      <div className={styles.mainArena}>
        <BloodBoundTable
          tableSeats={tableSeats}
          myPlayerId={myPlayerId}
          daggerHolderPlayerId={activeView.daggerHolderPlayerId}
          currentTargetPlayerId={activeView.currentTargetPlayerId}
          intervenedByPlayerId={activeView.intervenedByPlayerId}
          secretCards={tableSecretCards}
          isMyTurn={isMyTurn}
          canDebug={canDebug}
          debugMode={debugMode}
          isGameOver={activeView.phase === "GAME_OVER"}
          phase={activeView.phase}
          canIIntervene={canIIntervene}
          attackerName={attackerPlayer?.displayName}
          targetName={targetPlayer?.displayName}
          victimName={victimPlayer?.displayName}
          isVictimMe={isVictimMe}
          daggerHolderName={attackerPlayer?.displayName}
          interventionCountdown={interventionCountdown}
          totalCountdown={totalCountdown}
          speechBubbles={speechBubbles}
          onStartPlay={handleStartPlay}
          onIntervene={handleIntervene}
          onPassIntervene={handlePassIntervene}
          onSelectTarget={handleSelectTarget}
        />

        <BloodBoundCheatsheet
          activeTab={activeLogTab}
          onTabChange={setActiveLogTab}
          canDebug={canDebug}
          aiLogs={aiLogs}
          publicLog={activeView.publicLog}
        />
      </div>

      {/* 4. Bottom HUD: My Identity & Ability */}
      <footer className={styles.bottomHud}>
        <div className={styles.myIdentityBox}>
          <div className={styles.myCardVisual}>
            <div className={styles.myCardGlow} />
            <div
              className={`${styles.myCardFrame} ${
                myCard?.clan === "ROSE"
                  ? styles.frameRose
                  : myCard?.clan === "FAN"
                  ? styles.frameFan
                  : myCard?.clan === "INQUISITOR"
                  ? styles.frameInquisitor
                  : styles.frameMystery
              }`}
            >
              <img
                src={
                  myCard?.clan === "ROSE"
                    ? `/assets/games/blood-bound/roles/rose/role-${myCard.rank}.svg`
                    : myCard?.clan === "FAN"
                    ? `/assets/games/blood-bound/roles/fan/role-${myCard.rank}.svg`
                    : `/assets/games/blood-bound/roles/inquisitor/role-8.svg`
                }
                alt="My Card"
                className={styles.myCardImg}
              />
            </div>
          </div>
          <div className={styles.myCardInfo}>
            <div className={styles.myCardTitleRow}>
              <h4 style={{ margin: 0 }}>
                {myCard?.clan === "ROSE" ? "🌹 Gia Tộc Hoa Hồng" : myCard?.clan === "FAN" ? "🪭 Gia Tộc Quạt" : "⚖️ Kẻ Phán Xét"} • {myCard?.roleInfo?.roleNameVi ?? `Cấp ${myCard?.rank}`} (Cấp {myCard?.rank})
              </h4>
              <span className={styles.myWoundBadge}>
                🩸 Máu: {you?.wounds ?? 0}/4 ({4 - (you?.wounds ?? 0)} vết thương còn lại trước khi bị bắt)
              </span>
            </div>
            <p className={styles.myAbilityDesc}>
              <strong>Kỹ năng:</strong> {myCard?.roleInfo?.abilityDescVi ?? "Đang cập nhật"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {you?.hasRevealedRank && !you?.hasUsedAbility && myCard && myCard.rank !== 1 && (
            <button className={styles.btnPrimary} onClick={() => setShowAbilityModal(true)}>
              <Heart size={16} /> Kích Hoạt Kỹ Năng {myCard.roleInfo?.roleNameVi ?? "Vai trò"} (Cấp {myCard.rank})
            </button>
          )}
          {isMyTurn && (
            <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.9rem" }}>
              👉 Hãy click vào một người chơi trên bàn để tấn công!
            </span>
          )}
        </div>
      </footer>

      {/* 5. Modal Chọn Token Manh Mối Khi Chịu Đòn */}
      <BloodBoundWoundModal
        isOpen={showWoundModal}
        myCard={myCard}
        onSelectToken={handleRevealToken}
      />

      {/* 6. Modal Chọn Mục Tiêu Dùng Kỹ Năng */}
      {showAbilityModal && myCard && (
        <div className={styles.modalOverlay} onClick={() => setShowAbilityModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              <Heart size={20} color="#f43f5e" />
              Kỹ Năng: {myCard.roleInfo?.roleNameVi ?? "Vai trò"} (Cấp {myCard.rank})
            </div>
            <div className={styles.modalDesc}>
              {myCard.roleInfo?.abilityDescVi ?? ""}
              <br />
              <strong style={{ color: "#f8fafc", display: "inline-block", marginTop: "6px" }}>
                Hãy chọn 1 người chơi làm mục tiêu:
              </strong>
            </div>
            <div className={styles.targetGrid}>
              {getEligibleAbilityTargets(activeView.players, myPlayerId, myCard.rank).map((target) => (
                <button
                  key={target.playerId}
                  type="button"
                  className={styles.targetBtn}
                  onClick={() => handleUseAbilityTarget(target.playerId)}
                >
                  <span>
                    {target.displayName}
                    {target.playerId === myPlayerId ? " (Bạn)" : ""}
                  </span>
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

      {/* 7. Confirm Dialog Khi Bấm Thoát Phòng */}
      <ConfirmDialog
        open={confirmLeaveOpen}
        title="Thoát phòng?"
        body="Bạn sẽ bị loại khỏi game nếu tiếp tục. Bạn có chắc chắn muốn thoát phòng?"
        confirmLabel="Xác nhận thoát"
        cancelLabel="Ở lại"
        onConfirm={async () => {
          setConfirmLeaveOpen(false);
          await purgeAndNavigateRooms();
        }}
        onCancel={() => setConfirmLeaveOpen(false)}
      />

      {/* 8. Hiệu ứng pháo hoa rực rỡ theo màu của đội thắng */}
      {activeView.phase === "GAME_OVER" && (
        <BloodBoundFireworks winnerClan={activeView.winnerClan} />
      )}

      {/* 9. Bảng vinh danh chiến thắng hoành tráng */}
      {activeView.phase === "GAME_OVER" && (
        <BloodBoundGameOverModal
          isOpen={showGameOverModal}
          winnerClan={activeView.winnerClan}
          winningPlayers={winningPlayers}
          gameOverReason={gameOverReason}
          allPlayers={activeView.players}
          secretCards={tableSecretCards}
          isDemo={isDemo}
          onRestart={handleResetGame}
          onClose={() => setShowGameOverModal(false)}
          onLeaveRoom={() => void purgeAndNavigateRooms()}
        />
      )}
    </div>
  );
}
