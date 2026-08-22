import { useCallback, useMemo, useState } from "react";
import { Accessibility, LogOut, MessageCircle, Settings } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { CardTableCanvas } from "@/game/renderer/CardTableCanvas";
import { cardFromId, type DemoCard } from "@/game/games/demo-card-game/demoCards";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { ThemeQuickToggle } from "@/shared/components/ThemeQuickToggle/ThemeQuickToggle";
import { useGame } from "@/shared/hooks/useGames";
import { useLeaveRoom, useRoom } from "@/shared/hooks/useRooms";
import { useRoomRealtime } from "@/shared/hooks/useRoomRealtime";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useThemeStore } from "@/shared/theme";
import type { GameThemeManifest } from "@/game/core/GameThemeManifest";
import { realtime } from "@/shared/api/ws";
import type { DemoView } from "@/shared/api/types";
import { useT } from "@/shared/i18n/useT";
import { NOB_CATALOGUE_ID, NobPlayPage, parseNobView, type NobView } from "@/games/nob";
import { GameSettingsPanel } from "./GameSettingsPanel";
import { HandDock } from "./HandDock";
import styles from "./GamePage.module.css";

const FALLBACK_THEME: GameThemeManifest = {
  id: "demo-felt",
  name: "Felt Table",
  prefersDarkCanvas: false,
  hudVariant: "platform",
};

const DEFAULT_PLAY = {
  music: 80,
  effects: 80,
  cardAnimations: true,
  haptics: true,
  confirmActions: true,
  reducedMotion: false,
  highContrast: false,
};

export function GamePage() {
  const { roomId = "" } = useParams();
  const t = useT();
  const navigate = useNavigate();
  const leaveRoom = useLeaveRoom();
  const isMobile = useMediaQuery("(max-width: 720px)");
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const roomQuery = useRoom(roomId);
  const room = roomQuery.data;
  const { game } = useGame(room?.gameId ?? "demo-card-game");
  const manifest = game?.theme ?? FALLBACK_THEME;
  const isNob = room?.gameId === NOB_CATALOGUE_ID;

  const [view, setView] = useState<DemoView | null>(null);
  const [nobView, setNobView] = useState<NobView | null>(null);
  const [hand, setHand] = useState<DemoCard[]>([]);
  const [selected, setSelected] = useState<DemoCard | null>(null);
  const [playRequest, setPlayRequest] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [gameplay, setGameplay] = useState(DEFAULT_PLAY);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectCode, setRejectCode] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useRoomRealtime(roomId, {
    onView: (next) => {
      const nob = parseNobView(next);
      if (nob) {
        setNobView(nob);
        setRejectCode(null);
        return;
      }
      if (!Array.isArray(next.hand)) {
        return;
      }
      const demo = next as unknown as DemoView;
      setView(demo);
      setRejectCode(null);
      if (demo.finished) {
        setNotice(null);
      }
    },
    onRejected: (code, message) => {
      setRejectCode(code);
      setNotice(message);
    },
  });

  const table = useMemo(() => {
    if (!view?.hand) {
      return null;
    }
    return {
      hand: view.hand.map(cardFromId),
      opponentHandSize: view.opponentHandSize ?? 0,
      discard: (view.discard ?? []).map(cardFromId),
      deckSize: view.deckSize ?? 0,
      yourTurn: Boolean(view.yourTurn),
    };
  }, [view]);

  const handlePlayHandled = useCallback(() => setPlayRequest(null), []);
  const askLeave = () => setConfirmLeave(true);
  const confirmAndLeave = () => leaveRoom.mutate(room?.id ?? roomId);

  const playCard = (cardId: string) => {
    if (!view?.yourTurn || view.finished) {
      setNotice(t("waitingTurn"));
      return;
    }
    if (view.hasPlayed) {
      setNotice(t("alreadyPlayedCard"));
      return;
    }
    realtime.send("GAME_ACTION", roomId, { type: "PLAY_CARD", cardId });
  };

  const draw = () => {
    if (!view?.yourTurn || view.finished) {
      return;
    }
    realtime.send("GAME_ACTION", roomId, { type: "DRAW_CARD" });
  };

  const endTurn = () => {
    if (!view?.yourTurn || view.finished) {
      return;
    }
    realtime.send("GAME_ACTION", roomId, { type: "END_TURN" });
  };

  if (isNob && room) {
    return <NobPlayPage room={room} view={nobView} notice={notice} rejectCode={rejectCode} />;
  }

  return (
    <div className={`${styles.page} ${gameplay.highContrast ? styles.contrast : ""}`}>
      <header className={`${styles.hud} theme-header`}>
        <button type="button" className={styles.leave} onClick={askLeave}>
          <LogOut size={16} aria-hidden="true" />
          <span className={styles.leaveText}>{t("leaveRoom")}</span>
        </button>
        <div className={styles.titleBlock}>
          <h1>{game?.displayName ?? "Table Demo"}</h1>
          <p>
            {room?.name ?? roomId} · {view ? `${t("yourTurn").split(" ")[0]} ${view.turnNumber}` : t("connecting")}
          </p>
        </div>
        <div className={styles.tools}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-expanded={settingsOpen}
            aria-label="Game settings · Cài đặt ván"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={18} aria-hidden="true" />
          </button>
          {isMobile ? null : <ThemeQuickToggle />}
          <button
            type="button"
            className={styles.iconBtn}
            aria-expanded={chatOpen}
            aria-controls="table-chat"
            aria-label="Chat"
            onClick={() => setChatOpen((open) => !open)}
          >
            <MessageCircle size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div id="main" className={styles.stage}>
        <CardTableCanvas
          manifest={manifest}
          resolvedTheme={resolvedTheme}
          reducedMotion={gameplay.reducedMotion}
          dockHand={isMobile}
          onHandChange={setHand}
          onPlayed={(card) => playCard(card.id)}
          onSelect={setSelected}
          playRequest={playRequest}
          onPlayRequestHandled={handlePlayHandled}
          table={table}
          onDraw={draw}
        />

        {isMobile ? null : (
          <button type="button" className={styles.endTurn} onClick={endTurn} disabled={!view?.yourTurn}>
            {view?.yourTurn ? t("endTurn") : t("waitingTurn")}
          </button>
        )}
      </div>

      {isMobile ? (
        <HandDock
          cards={hand}
          selectedId={selected?.id ?? null}
          onSelect={(card) => setSelected(card.id === selected?.id ? null : card)}
          onPlay={(id) => setPlayRequest(id)}
        />
      ) : null}

      {isMobile ? (
        <button type="button" className={styles.endTurnBar} onClick={endTurn} disabled={!view?.yourTurn}>
          {view?.yourTurn ? t("endTurn") : t("waitingTurn")}
        </button>
      ) : null}

      {notice ? <p className={styles.endTurnBar}>{notice}</p> : null}

      {view?.finished ? (
        <div className={styles.overLayer}>
          <div className={`${styles.over} theme-panel`}>
            <h2>{t("gameOver")}</h2>
            <p>
              {t("winnerLine")
                .replace(
                  "{name}",
                  room?.players.find((player) => player.playerId === view.winnerPlayerId)?.displayName
                    ?? view.winnerPlayerId
                    ?? "",
                )
                .replace("{score}", "—")}
            </p>
            <div className={styles.overActions}>
              <button type="button" className={styles.endTurn} onClick={() => navigate(`/rooms/${room?.id ?? roomId}`)}>
                {t("playAgain")}
              </button>
              <button type="button" className={styles.leave} onClick={askLeave}>
                <LogOut size={16} aria-hidden="true" />
                {t("leaveRoom")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmLeave}
        title={t("leaveConfirmTitle")}
        body={t("leaveConfirmBody")}
        confirmLabel={t("leaveConfirmYes")}
        cancelLabel={t("leaveConfirmNo")}
        pending={leaveRoom.isPending}
        error={leaveRoom.error?.message ?? null}
        onConfirm={confirmAndLeave}
        onCancel={() => setConfirmLeave(false)}
      />

      <button
        type="button"
        className={styles.a11yToggle}
        aria-expanded={a11yOpen}
        onClick={() => setA11yOpen((open) => !open)}
      >
        <Accessibility size={16} aria-hidden="true" />
        Card controls
      </button>

      {a11yOpen ? (
        <section className={styles.a11y} aria-label="Accessibility hand · Bài trợ năng">
          <div className={styles.handList}>
            {hand.length === 0 ? (
              <p className={styles.empty}>No cards · Hết bài trên tay</p>
            ) : (
              hand.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={styles.cardBtn}
                  onClick={() => playCard(card.id)}
                >
                  Play {card.name}
                  <span> · {card.nameVi}</span>
                </button>
              ))
            )}
          </div>
        </section>
      ) : null}

      {chatOpen ? (
        <aside id="table-chat" className={`${styles.chat} theme-panel`}>
          <p>{t("friendsEmpty")}</p>
        </aside>
      ) : null}

      <GameSettingsPanel
        open={settingsOpen}
        sheet={isMobile}
        gameplay={gameplay}
        onGameplay={setGameplay}
        onClose={() => setSettingsOpen(false)}
        onLeave={() => {
          setSettingsOpen(false);
          askLeave();
        }}
      />
    </div>
  );
}
