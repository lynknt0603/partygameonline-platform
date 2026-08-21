import { Link } from "react-router-dom";
import { GameCard } from "@/shared/components/GameCard/GameCard";
import { RoomRow } from "@/shared/components/RoomRow/RoomRow";
import { useGames } from "@/shared/hooks/useGames";
import { useRooms } from "@/shared/hooks/useRooms";
import { useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import styles from "./HomePage.module.css";

export function HomePage() {
  const t = useT();
  const name = useSessionStore((state) => state.session?.displayName ?? "Player");
  const games = useGames();
  const rooms = useRooms();

  return (
    <div className={styles.page}>
      <section className={`${styles.hero} theme-surface`} aria-labelledby="welcome-title">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{t("homeKicker")}</p>
          <h1 id="welcome-title">{t("homeHello").replace("{name}", name)}</h1>
          <p className={styles.lede}>{t("homeLede")}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primary} to="/games">
              {t("homeBrowse")}
            </Link>
            <Link className={styles.ghost} to="/rooms">
              {t("homeOpenRooms")}
            </Link>
          </div>
        </div>
        <div className={styles.collage} aria-hidden="true">
          <span className={`${styles.poster} ${styles.pBlood}`} />
          <span className={`${styles.poster} ${styles.pFelt}`} />
          <span className={`${styles.poster} ${styles.pTavern}`} />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>{t("featured")}</h2>
        </div>
        <div className={styles.grid}>
          {(games.data ?? []).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
        {games.data?.length === 0 ? <p>{t("emptyGames")}</p> : null}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>{t("liveRooms")}</h2>
        </div>
        <div className={styles.list}>
          {(rooms.data ?? []).slice(0, 3).map((room) => (
            <RoomRow key={room.id} room={room} />
          ))}
        </div>
        {rooms.data?.length === 0 ? <p>{t("emptyRooms")}</p> : null}
      </section>
    </div>
  );
}
