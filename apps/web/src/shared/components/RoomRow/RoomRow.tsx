import { useState } from "react";
import { Lock, LockOpen, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/shared/components/StatusBadge/StatusBadge";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import { useGame } from "@/shared/hooks/useGames";
import { useJoinRoom } from "@/shared/hooks/useRooms";
import { useActiveGame } from "@/shared/hooks/useActiveGame";
import { ActiveGameConflictDialog } from "@/shared/components/ActiveGameGuard/ActiveGameConflictDialog";
import { useLocale, useT } from "@/shared/i18n/useT";
import type { RoomView } from "@/shared/lobby/roomView";
import { useSessionStore } from "@/shared/state/sessionStore";
import styles from "./RoomRow.module.css";

interface RoomRowProps {
  room: RoomView;
}

export function RoomRow({ room }: RoomRowProps) {
  const t = useT();
  const locale = useLocale();
  const navigate = useNavigate();
  const join = useJoinRoom();
  const you = useSessionStore((state) => state.session?.playerId);
  const { game } = useGame(room.gameId);
  const { activeGame, rejoin, abandon } = useActiveGame();
  const [showConflict, setShowConflict] = useState(false);
  const live = room.status === "in_game";
  const member = room.players.some((player) => player.playerId === you);
  const title = locale === "vi" ? game?.displayNameVi : game?.displayName;

  const open = () => {
    if (member || (live && member)) {
      navigate(live && member ? `/play/${room.id}` : `/rooms/${room.id}`);
      return;
    }
    if (activeGame && activeGame.roomId.toUpperCase() !== room.id.toUpperCase()) {
      setShowConflict(true);
      return;
    }
    join.mutate(room.id);
  };

  const handleAbandonAndProceed = async () => {
    if (activeGame) {
      await abandon(activeGame.roomId);
    }
    setShowConflict(false);
    join.mutate(room.id);
  };

  return (
    <article className={`${styles.row} theme-card`}>
      <div className={styles.copy}>
        <p className={styles.kicker}>{title ?? room.gameId}</p>
        <h3 className={styles.name}>{room.name}</h3>
        <p className={styles.meta}>
          <span className={styles.flag}>
            {room.visibility === "private" ? <Lock size={12} /> : <LockOpen size={12} />}
            {room.visibility === "private" ? t("privateRoom") : t("publicRoom")}
          </span>
          <span>
            {t("host")} {room.host}
          </span>
          <span>
            <Users size={12} /> {room.occupied} / {room.capacity}
          </span>
        </p>
      </div>
      <div className={styles.participants} aria-label={t("players")}>
        {room.players.slice(0, 5).map((player) => (
          <PlayerAvatar
            key={player.playerId}
            playerId={player.playerId}
            displayName={player.displayName}
            avatarUrl={player.avatarUrl}
            size={32}
            decorative
          />
        ))}
        {room.players.length > 5 ? <span className={styles.morePlayers}>+{room.players.length - 5}</span> : null}
      </div>
      <div className={styles.aside}>
        <StatusBadge status={room.status === "in_game" ? "in_game" : "waiting"} />
        <button type="button" className={live ? styles.spectate : styles.join} onClick={open} disabled={join.isPending}>
          {member ? t("join") : live ? t("spectate") : t("join")}
        </button>
      </div>

      {showConflict && activeGame && (
        <ActiveGameConflictDialog
          open={showConflict}
          activeRoomId={activeGame.roomId}
          actionType="join"
          onRejoin={() => rejoin(activeGame.roomId)}
          onAbandonAndProceed={handleAbandonAndProceed}
          onCancel={() => setShowConflict(false)}
        />
      )}
    </article>
  );
}
