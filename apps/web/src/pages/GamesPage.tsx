import { GameCard } from "@/shared/components/GameCard/GameCard";
import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { useGames } from "@/shared/hooks/useGames";
import { useT } from "@/shared/i18n/useT";
import styles from "./HomePage.module.css";

export function GamesPage() {
  const t = useT();
  const games = useGames();
  return (
    <div>
      <PageHeading title={t("gamesTitle")} subtitle={t("gamesSub")} />
      <div className={styles.grid}>
        {(games.data ?? []).map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
      {games.data?.length === 0 ? <p>{t("emptyGames")}</p> : null}
    </div>
  );
}
