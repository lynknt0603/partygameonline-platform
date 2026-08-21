import { Lock, LockOpen, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/shared/components/StatusBadge/StatusBadge";
import { useGame } from "@/shared/hooks/useGames";
import { useJoinRoom } from "@/shared/hooks/useRooms";
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
  const live = room.status === "in_game";
  const member = room.players.some((player) => player.playerId === you);
  const title = locale === "vi" ? game?.displayNameVi : game?.displayName;

  const open = () => {
    if (member || live) {
      navigate(live && member ? `/play/${room.id}` : `/rooms/${room.id}`);
      return;
    }
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
      <div className={styles.aside}>
        <StatusBadge status={room.status === "in_game" ? "in_game" : "waiting"} />
        <button type="button" className={live ? styles.spectate : styles.join} onClick={open} disabled={join.isPending}>
          {member ? t("join") : live ? t("spectate") : t("join")}
        </button>
      </div>
    </article>
  );
}
