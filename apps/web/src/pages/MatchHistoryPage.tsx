import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { fetchMatches } from "@/shared/api/matches";
import { useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import styles from "./MatchHistoryPage.module.css";

export function MatchHistoryPage() {
  const t = useT();
  const you = useSessionStore((state) => state.session?.playerId);
  const matches = useQuery({
    queryKey: ["matches"],
    queryFn: () => fetchMatches(0, 20),
  });

  return (
    <div>
      <PageHeading title={t("matchHistory")} subtitle={t("matchHistorySub")} />
      {matches.isError ? <p>{matches.error.message}</p> : null}
      <ul className={styles.list}>
        {(matches.data?.content ?? []).map((match) => {
          const winners = match.players.filter((player) => player.winner || player.result === "WIN");
          const youWon = Boolean(you && winners.some((player) => player.playerId === you));
          return (
            <li key={match.id} className={`${styles.row} theme-card`}>
              <div>
                <strong>{match.gameId === "wheres-the-bone" ? "Where's the Bone" : match.gameId}</strong>
                <p>
                  {match.finishedAt ? new Date(match.finishedAt).toLocaleString() : match.roomId}
                </p>
              </div>
              <div className={styles.result} data-win={youWon ? "true" : "false"}>
                {youWon ? t("youWin") : t("youLose")}
                <p>
                  {winners.length
                    ? winners.map((player) => player.displayName).join(", ")
                    : match.winnerPlayerId ?? "—"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      {matches.data?.content.length === 0 ? <p>{t("matchHistoryEmpty")}</p> : null}
      <Link className={styles.back} to="/profile">
        {t("navProfile")}
      </Link>
    </div>
  );
}
