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
import { BloodBoundActionPanel } from "../components/BloodBoundActionPanel";
import { BloodBoundWoundModal } from "../components/BloodBoundWoundModal";
import { BloodBoundGodView } from "../components/BloodBoundGodView";
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

  // Dual-mode state determination
  const isServerAuthoritative = Boolean(serverView && sendCommand && room?.status === "in_game");
  const activeView: BloodBoundView = isServerAuthoritative && serverView ? serverView : gameState;

  // Sắp xếp danh sách ghế để "Bạn" luôn ngồi ở vị trí đáy bàn
  const tableSeats = useMemo(() => {
    const youIdx = activeView.players.findIndex((p) => p.playerId === myPlayerId);
    if (youIdx <= 0) return activeView.players;
    return [...activeView.players.slice(youIdx), ...activeView.players.slice(0, youIdx)];
  }, [activeView.players, myPlayerId]);

  const isDemo = !room || roomId.toLowerCase().includes("demo");
  const canDebug = isDemo || import.meta.env.DEV;

  // 4. Debug & Auto-Play Controls
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [autoPlayHuman, setAutoPlayHuman] = useState<boolean>(false);
  const [botSpeedMs, setBotSpeedMs] = useState<number>(1000);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeLogTab, setActiveLogTab] = useState<"guide" | "game" | "ai">("guide");
  const [aiLogs, setAiLogs] = useState<AiLogItem[]>([]);

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

  // 5. Bot Decision Loop (Chỉ chạy khi ở chế độ Client Simulation)
  const autoPlayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isDemo || isServerAuthoritative || isPaused || activeView.phase === "GAME_OVER") {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      return;
    }

    // Phase: ATTACK_CHOICE
    if (gameState.phase === "ATTACK_CHOICE") {
      const isMyTurn = gameState.daggerHolderPlayerId === myPlayerId;
      if (!isMyTurn || autoPlayHuman) {
        autoPlayTimerRef.current = window.setTimeout(() => {
          setGameState((curr) => {
            if (curr.phase !== "ATTACK_CHOICE") return curr;
            const attackerId = curr.daggerHolderPlayerId;
            const attacker = curr.players.find((p) => p.playerId === attackerId);
            if (!attacker) return curr;

            const decision = decideBotAttack(curr, attackerId, secretCards);
            addAiLog(attacker.displayName, `Tấn công ${decision.targetName}`, decision.reasoning);
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
      const isVictimMe = victimId === myPlayerId;

      if (victimId && (!isVictimMe || autoPlayHuman)) {
        autoPlayTimerRef.current = window.setTimeout(() => {
          setGameState((curr) => {
            if (curr.phase !== "WOUND_ASSIGNMENT") return curr;
            const currentVictim = curr.players.find((p) => p.playerId === victimId);
            if (!currentVictim) return curr;

            const alreadyTokens = currentVictim.revealedTokens.map((t) => t.type);
            const decision = decideBotWoundReveal(victimId, secretCards, alreadyTokens);

            addAiLog(currentVictim.displayName, `Chọn lộ token [${decision.tokenType}]`, decision.reasoning);
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
    addAiLog,
  ]);

  // 6. Audio Feedback on Phase Transitions
  const you = activeView.players.find((p) => p.playerId === myPlayerId);
  const isMyTurn = activeView.daggerHolderPlayerId === myPlayerId && activeView.phase === "ATTACK_CHOICE";
  const rawMyCard = activeView.mySecretCard ?? secretCards[myPlayerId] ?? null;
  const myCard = hydrateBloodBoundCard(rawMyCard);

  const tableSecretCards = useMemo(() => {
    if (isServerAuthoritative) {
      return myCard ? { [myPlayerId]: myCard } : {};
    }
    return secretCards;
  }, [isServerAuthoritative, myCard, myPlayerId, secretCards]);

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

  const handlePassIntervene = () => {
    if (isServerAuthoritative && sendCommand) {
      sendCommand({ type: "PASS_INTERVENE" });
    } else {
      setGameState((curr) => processPassIntervention(curr));
    }
  };

  const handleRevealToken = (tokenType: ClueTokenType) => {
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

  const currentVictimId = activeView.intervenedByPlayerId ?? activeView.currentTargetPlayerId;
  const isVictimMe = currentVictimId === myPlayerId;
  const showWoundModal = activeView.phase === "WOUND_ASSIGNMENT" && isVictimMe && !autoPlayHuman;

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

  const soundPrefs = useBloodBoundPrefs();

  if (!isDemo && room?.status === "in_game" && !serverView) {
    if (snapshotError) {
      return (
        <div className={styles.container}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <h2 className={styles.gameTitle}>Blood Bound</h2>
            </div>
            <div className={styles.headerRight}>
              <button
                type="button"
                className={styles.btnNavBack}
                onClick={() => navigate("/rooms")}
              >
                <LogOut size={16} /> Thoát phòng
              </button>
            </div>
          </header>
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#f87171" }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>Không thể tải ván đấu Blood Bound từ máy chủ</p>
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
              <h2 className={styles.gameTitle}>Blood Bound</h2>
            </div>
            <div className={styles.headerRight}>
              <button
                type="button"
                className={styles.btnNavBack}
                onClick={() => navigate("/rooms")}
              >
                <LogOut size={16} /> Thoát phòng
              </button>
            </div>
          </header>
          <div style={{ padding: "80px 20px", textAlign: "center", color: "#94a3b8" }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>Đang kết nối bàn cờ Blood Bound...</p>
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
          <h2 className={styles.gameTitle}>Blood Bound</h2>
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
            onClick={() => navigate("/")}
            title="Thoát về trang chủ"
          >
            <LogOut size={16} /> Thoát
          </button>
        </div>
      </header>

      {/* 2. Action Banner */}
      <BloodBoundActionPanel
        phase={activeView.phase}
        isMyTurn={isMyTurn}
        canIIntervene={canIIntervene}
        attackerName={attackerPlayer?.displayName}
        targetName={targetPlayer?.displayName}
        onStartPlay={handleStartPlay}
        onIntervene={handleIntervene}
        onPassIntervene={handlePassIntervene}
      />

      {/* 3. Main Arena: Radial Table + Cheatsheet Sidebar */}
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
              {activeView.players
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
