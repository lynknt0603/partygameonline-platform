import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, Link2, MessageCircle, Settings } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { PlayerSeat } from "@/shared/components/PlayerSeat/PlayerSeat";
import { useGame } from "@/shared/hooks/useGames";
import { useCloseRoom, useJoinRoom, useLeaveRoom, useReadyRoom, useRoom, useStartRoom } from "@/shared/hooks/useRooms";
import { useRoomRealtime } from "@/shared/hooks/useRoomRealtime";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useLocale, useT } from "@/shared/i18n/useT";
import { seatsForRoom } from "@/shared/lobby/roomView";
import { useSessionStore } from "@/shared/state/sessionStore";
import { useLobbyChat } from "@/shared/hooks/useLobbyChat";
import { LobbyChat } from "./LobbyChat";
import { RoomSettingsPanel } from "./RoomSettingsPanel";
import styles from "./LobbyPage.module.css";

export function LobbyPage() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const locale = useLocale();
  const isMobile = useMediaQuery("(max-width: 720px)");
  const youId = useSessionStore((state) => state.session?.playerId);
  const roomQuery = useRoom(roomId);
  const room = roomQuery.data;
  const { game } = useGame(room?.gameId);
  const join = useJoinRoom();
  const leave = useLeaveRoom();
  const ready = useReadyRoom(roomId);
  const start = useStartRoom(roomId);
  const close = useCloseRoom();
  const [chatOpen, setChatOpen] = useState(false);
  const [hostOpen, setHostOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useRoomRealtime(roomId);
  const chat = useLobbyChat(roomId, youId);
  const joinAttempted = useRef(false);

  // Websocket events are the fast path, but a lobby must also recover when a
  // tab reconnects while a join event is in flight (or a proxy drops it).
  // Refresh only while waiting so an open lobby stays authoritative without
  // adding polling traffic once the game has started.
  const refetchRoom = roomQuery.refetch;
  useEffect(() => {
    if (!roomId || room?.status !== "waiting") {
      return;
    }
    let stopped = false;
    let inFlight = false;

    const refresh = async () => {
      if (stopped || inFlight) {
        return;
      }
      inFlight = true;
      try {
        await refetchRoom();
      } finally {
        inFlight = false;
      }
    };

    const timer = window.setInterval(() => {
      void refresh();
    }, 2000);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [refetchRoom, room?.status, roomId]);

  useEffect(() => {
    if (!room || !youId) {
      return;
    }
    const member = room.players.some((player) => player.playerId === youId);
    if (!member && room.status === "waiting" && !joinAttempted.current) {
      joinAttempted.current = true;
      join.mutate(room.id);
    }
    if (room.status === "in_game" && member) {
      navigate(`/play/${room.id.toUpperCase()}`, { replace: true });
    }
  }, [room, youId, join, navigate]);

  const seats = useMemo(() => (room ? seatsForRoom(room, youId) : []), [room, youId]);
  const you = seats.find((seat) => seat.isYou);
  const isHost = Boolean(you?.isHost);
  const occupied = seats.filter((seat) => seat.state !== "empty");
  const waiting = occupied.filter((seat) => !seat.isHost && seat.state !== "ready");
  const canStart = occupied.length >= (game?.minPlayers ?? 2) && waiting.length === 0;
  const gameTitle = locale === "vi" ? game?.displayNameVi : game?.displayName;

  if (roomQuery.isError) {
    return <Navigate to="/rooms" replace />;
  }
  if (!room) {
    return <p>{t("connecting")}</p>;
  }

  const inviteUrl = `${window.location.origin}/rooms/${room.id}`;

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: room.name, url: inviteUrl });
      return;
    }
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  };

  const waitLabel =
    waiting.length === 0
      ? t("allReady")
      : t("waitingFor").replace("{name}", waiting.map((seat) => (seat.isYou ? t("you") : seat.name)).join(", "));

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <button type="button" className={styles.icon} onClick={() => navigate("/rooms")}>
          <ArrowLeft size={18} />
          <span>{t("navRooms")}</span>
        </button>
        <div className={styles.heading}>
          <h1>{room.name}</h1>
          <p>
            {gameTitle} · {room.visibility === "public" ? t("publicRoom") : t("privateRoom")} · {occupied.length}/
            {room.capacity} {t("players")}
          </p>
        </div>
        <div className={styles.tools}>
          <button type="button" className={styles.icon} onClick={() => void share()}>
            <Link2 size={16} />
            <span className={styles.desktopOnly}>{t("invite")}</span>
          </button>
          <button
            type="button"
            className={styles.icon}
            aria-expanded={chatOpen}
            onClick={() => {
              const next = !chatOpen;
              setChatOpen(next);
              chat.setOpen(next);
            }}
          >
            <MessageCircle size={16} />
            {chat.unread > 0 ? <span className={styles.badge}>{chat.unread}</span> : null}
          </button>
          <button type="button" className={styles.icon} onClick={() => setHostOpen(true)} aria-label={t("roomSettings")}>
            <Settings size={16} />
          </button>
        </div>
      </header>

      {isMobile ? (
        <>
          <div className={styles.codeBar}>
            <span>{t("roomCode")}</span>
            <strong>{room.code}</strong>
            <button type="button" onClick={() => void copyCode()}>
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          <div className={styles.board}>
            <p className={styles.boardTitle}>{gameTitle}</p>
            <p>
              {occupied.length} / {room.capacity}
            </p>
          </div>
          <section className={styles.list}>
            <h2>{t("players")}</h2>
            {seats.map((seat) => (
              <PlayerSeat key={seat.id} player={seat} compact />
            ))}
          </section>
        </>
      ) : (
        <div className={styles.arenaWide}>
          <div className={styles.board}>
            <p className={styles.boardName}>{room.name}</p>
            <p className={styles.boardTitle}>{gameTitle}</p>
            <p>
              {occupied.length} / {room.capacity}
            </p>
          </div>
          <div className={styles.seatRing}>
            {seats.map((seat) => (
              <PlayerSeat key={seat.id} player={seat} />
            ))}
          </div>
        </div>
      )}

      <section className={styles.footerBlock}>
        {isMobile && chatOpen ? (
          <LobbyChat
            variant="sheet"
            lines={chat.lines}
            youId={youId}
            onClose={() => {
              setChatOpen(false);
              chat.setOpen(false);
            }}
            onSend={chat.send}
          />
        ) : null}
        {isMobile ? null : (
          <div className={styles.codeBar}>
            <span>{t("roomCode")}</span>
            <strong>{room.code}</strong>
            <button type="button" onClick={() => void copyCode()}>
              <Copy size={14} />
              {copied ? t("copied") : t("copyCode")}
            </button>
            <button type="button" onClick={() => void share()}>
              <Link2 size={14} />
              {t("shareInvite")}
            </button>
          </div>
        )}
        <p className={styles.waitLine} data-ok={canStart}>
          {waitLabel}
        </p>
        <footer className={styles.footer}>
          <button type="button" className={styles.ghost} onClick={() => leave.mutate(room.id)}>
            {t("leaveRoom")}
          </button>
          {isHost ? null : (
            <button
              type="button"
              className={styles.ghost}
              onClick={() => ready.mutate(you?.state !== "ready")}
              disabled={!you}
            >
              {you?.state === "ready" ? t("cancelReady") : t("ready")}
            </button>
          )}
          {isHost ? (
            <button
              type="button"
              className={styles.primary}
              disabled={!canStart || start.isPending}
              onClick={() => start.mutate()}
            >
              {t("startGame")}
            </button>
          ) : null}
        </footer>
      </section>

      {!isMobile && chatOpen ? (
        <LobbyChat
          variant="drawer"
          lines={chat.lines}
          youId={youId}
          onClose={() => {
            setChatOpen(false);
            chat.setOpen(false);
          }}
          onSend={chat.send}
        />
      ) : null}
      {hostOpen ? (
        <RoomSettingsPanel
          room={room}
          maxCap={game?.maxPlayers ?? 11}
          isHost={isHost}
          onClose={() => setHostOpen(false)}
          onCloseRoom={() => close.mutate(room.id)}
        />
      ) : null}
    </div>
  );
}
