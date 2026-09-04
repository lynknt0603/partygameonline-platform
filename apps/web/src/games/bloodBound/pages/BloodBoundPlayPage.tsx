import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Swords,
  LogOut,
  Shield,
  Heart,
  Eye,
  Bug,
  Bot,
  Zap,
  Play,
  Pause,
  RotateCcw,
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
  ClueTokenType,
} from "../model/bloodBoundTypes";
import styles from "./BloodBoundPlayPage.module.css";

interface AiLogItem {
  id: string;
  time: string;
  botName: string;
  action: string;
  reasoning: string;
}

interface BloodBoundPlayPageProps {
  roomId: string;
  room?: RoomView | RoomDto;
}

export function BloodBoundPlayPage({ roomId, room }: BloodBoundPlayPageProps) {
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const myPlayerId = session?.playerId ?? "player-1";

  // 1. Tự động bù đắp Bot khi thiếu người chơi hoặc chơi 1 mình (Solo)
  const initialPlayers = useMemo(() => {
    const rawList = room && room.players.length > 0
      ? room.players.map((p) => ({
          playerId: p.playerId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
        }))
      : [{ playerId: myPlayerId, displayName: session?.displayName ?? "Chỉ Huy (Bạn)" }];

    return ensureFullPlayerList(rawList, 6);
  }, [room, myPlayerId, session?.displayName]);

  // 2. Game State & Secret Cards
  const [gameState, setGameState] = useState<BloodBoundView>(() => {
    const { view } = initBloodBoundGame(roomId, initialPlayers, myPlayerId);
    return view;
  });

  const [secretCards, setSecretCards] = useState<Record<string, BloodBoundCard>>(() => {
    const { secretCards: cards } = initBloodBoundGame(roomId, initialPlayers, myPlayerId);
    return cards;
  });

  const isDemo = !room || roomId.toLowerCase().includes("demo");
  const canDebug = isDemo || import.meta.env.DEV;

  // 3. Debug & Auto-Play Controls (Chỉ khả dụng trong phòng Demo / Dev)
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [autoPlayHuman, setAutoPlayHuman] = useState<boolean>(false);
  const [botSpeedMs, setBotSpeedMs] = useState<number>(1000);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeLogTab, setActiveLogTab] = useState<"ai" | "game">(isDemo ? "ai" : "game");
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

  // 4. Reset ván đấu mới
  const handleResetGame = useCallback(() => {
    const { view, secretCards: newCards } = initBloodBoundGame(roomId, initialPlayers, myPlayerId);
    setGameState(view);
    setSecretCards(newCards);
    setAiLogs([]);
    addAiLog("Hệ thống", "Khởi tạo ván mới", "Đã chia lại vai trò bí mật cho 6 người chơi trên bàn.");
  }, [roomId, initialPlayers, myPlayerId, addAiLog]);

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
              return processIntervene(curr, p.playerId, secretCards[p.playerId]);
            }
          }
          return curr;
        });
      }, Math.max(800, botSpeedMs));

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

  const handleStartPlay = () => {
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
      addAiLog(session?.displayName ?? "Bạn", "Nhảy vào can thiệp đỡ đòn!", "Người chơi tự nguyện nhận đòn thay.");
      setGameState((curr) => processIntervene(curr, myPlayerId, mySecret));
    }
  };

  const handlePassIntervene = () => {
    setGameState((curr) => processPassIntervention(curr));
  };

  const handleRevealToken = (tokenType: ClueTokenType) => {
    addAiLog(session?.displayName ?? "Bạn", `Lộ token [${tokenType}]`, "Người chơi chọn token manh mối theo ý muốn.");
    setGameState((curr) => processWoundReveal(curr, secretCards, tokenType));
  };

  const handleUseAbility = () => {
    if (!myCard || you?.hasUsedAbility) return;
    const target = gameState.players.find((p) => p.playerId !== myPlayerId && p.wounds < 4);
    if (target) {
      addAiLog(session?.displayName ?? "Bạn", `Dùng kỹ năng ${myCard.roleInfo.roleNameVi}`, `Nhắm vào ${target.displayName}.`);
      setGameState((curr) => applyRoleAbility(curr, myPlayerId, myCard.rank, target.playerId));
    }
  };

  const currentVictimId = gameState.intervenedByPlayerId ?? gameState.currentTargetPlayerId;
  const isVictimMe = currentVictimId === myPlayerId;

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
          {/* Seats Grid */}
          <div className={styles.seatsGrid}>
            {gameState.players.map((player) => {
              const isDaggerHolder = gameState.daggerHolderPlayerId === player.playerId;
              const isTarget = gameState.currentTargetPlayerId === player.playerId;
              const isIntervener = gameState.intervenedByPlayerId === player.playerId;
              const secret = secretCards[player.playerId];

              return (
                <div
                  key={player.playerId}
                  className={`${styles.seatCard} ${isDaggerHolder ? styles.isDagger : ""} ${
                    isTarget || isIntervener ? styles.isTarget : ""
                  }`}
                  onClick={() => handleSelectTarget(player.playerId)}
                  style={{
                    cursor:
                      isMyTurn && player.playerId !== myPlayerId ? "pointer" : "default",
                  }}
                >
                  <div className={styles.seatHeader}>
                    <span className={styles.seatName}>
                      {player.displayName} {player.playerId === myPlayerId ? "(Bạn)" : ""}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {isDaggerHolder && <Swords size={16} color="#f59e0b" />}
                      {player.isShielded && <Shield size={16} color="#38bdf8" />}
                    </div>
                  </div>

                  {/* God View / Debug Identity Badge (Chỉ hiện khi dev/demo và bật debug) */}
                  {canDebug && debugMode && secret && (
                    <div
                      className={`${styles.debugIdentity} ${
                        secret.clan === "ROSE"
                          ? styles.debugIdentityRose
                          : styles.debugIdentityBeast
                      }`}
                    >
                      <span>
                        {secret.clan === "ROSE" ? "🌹" : "🐺"} {secret.roleInfo.roleNameVi}
                      </span>
                      <span>Rank {secret.rank}</span>
                    </div>
                  )}

                  {/* Wounds Track */}
                  <div className={styles.woundsTrack}>
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`${styles.woundPip} ${idx < player.wounds ? styles.filled : ""}`}
                      />
                    ))}
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "4px" }}>
                      {player.wounds}/4
                    </span>
                  </div>

                  {/* Revealed Tokens */}
                  <div className={styles.tokensRow}>
                    {player.revealedTokens.map((t, idx) => {
                      let badgeClass = styles.tokenBadge;
                      if (t.type === "COLOR")
                        badgeClass += ` ${t.value === "RED" ? styles.tokenRed : styles.tokenBlue}`;
                      if (t.type === "RANK") badgeClass += ` ${styles.tokenRank}`;
                      if (t.type === "CREST") badgeClass += ` ${styles.tokenCrest}`;
                      return (
                        <span key={idx} className={badgeClass}>
                          {t.type === "RANK" ? `Rank ${t.value}` : String(t.value)}
                        </span>
                      );
                    })}
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
              <div style={{ margin: "16px 0", fontSize: "1.1rem", color: "#f43f5e", fontWeight: 700 }}>
                {gameState.leftNeighborClue ? (
                  <>
                    <Eye size={20} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                    Gia tộc: {gameState.leftNeighborClue.clan} ({gameState.leftNeighborClue.crest})
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
              <div className={styles.arenaTitle}>Cửa Sổ Can Thiệp Đỡ Đòn!</div>
              <div className={styles.arenaSubtitle}>
                Thời gian còn lại: <strong>{gameState.timeRemainingSeconds}s</strong>
              </div>
              <div className={styles.actionButtons}>
                {!isVictimMe && !you?.hasRevealedRank && (
                  <button className={styles.btnPrimary} onClick={handleIntervene}>
                    Nhảy Vào Đỡ Đòn! (Lộ Số & Dùng Kỹ Năng)
                  </button>
                )}
                <button className={styles.btnSecondary} onClick={handlePassIntervene}>
                  Bỏ Qua Không Can Thiệp
                </button>
              </div>
            </div>
          )}

          {gameState.phase === "WOUND_ASSIGNMENT" && (
            <div className={styles.arenaCenter}>
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

        {/* 3. Right Sidebar: AI Logs / Game Log Tabbed Panel */}
        <aside className={styles.logBox}>
          <div className={styles.logTabs}>
            {canDebug && (
              <button
                type="button"
                className={`${styles.logTabBtn} ${activeLogTab === "ai" ? styles.logTabBtnActive : ""}`}
                onClick={() => setActiveLogTab("ai")}
              >
                🧠 Log AI Suy Luận ({aiLogs.length})
              </button>
            )}
            <button
              type="button"
              className={`${styles.logTabBtn} ${activeLogTab === "game" || !canDebug ? styles.logTabBtnActive : ""}`}
              onClick={() => setActiveLogTab("game")}
            >
              📜 Sự Kiện Game
            </button>
          </div>

          {canDebug && activeLogTab === "ai" ? (
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
          ) : (
            <div>
              {gameState.publicLog.slice(-20).map((log, idx) => (
                <div key={idx} className={styles.logEntry}>
                  {log.textVi || log.text}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* 4. Bottom HUD: Player Identity & Role Info */}
      <footer className={styles.bottomHud}>
        <div className={styles.myCardBox}>
          <div
            className={`${styles.clanEmblem} ${
              myCard?.clan === "ROSE" ? styles.clanRose : styles.clanBeast
            }`}
          >
            {myCard?.clan === "ROSE" ? "🌹" : "🐺"}
          </div>
          <div className={styles.myCardInfo}>
            <h4>
              {myCard?.clan} • {myCard?.roleInfo.roleNameVi} (Rank {myCard?.rank})
            </h4>
            <p>{myCard?.roleInfo.abilityDescVi}</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {you?.hasRevealedRank && !you?.hasUsedAbility && myCard && myCard.rank !== 1 && (
            <button className={styles.btnPrimary} onClick={handleUseAbility}>
              <Heart size={16} /> Kích Hoạt Kỹ Năng Nhân Vật
            </button>
          )}
          {isMyTurn && (
            <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.9rem" }}>
              👉 Hãy click vào một người chơi trên bàn để tấn công!
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
