import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { searchPlayers, type PlayerSearchResultDto } from "@/shared/api/players";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import { useT } from "@/shared/i18n/useT";
import styles from "./PlayersPage.module.css";

function profilePath(player: PlayerSearchResultDto): string {
  return `/profile/${encodeURIComponent(player.username || player.playerId)}`;
}

export function PlayersPage() {
  const t = useT();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  const search = useQuery({
    queryKey: ["player-search", query],
    queryFn: () => searchPlayers(query),
    enabled: query.length >= 2,
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(input.trim());
  };

  const shortQuery = input.trim().length > 0 && input.trim().length < 2;

  return (
    <div className={styles.page}>
      <header>
        <p className={styles.kicker}>{t("playersKicker")}</p>
        <h1 className={styles.title}>{t("playersTitle")}</h1>
        <p className={styles.subtitle}>{t("playersSub")}</p>
      </header>

      <section className={`${styles.searchPanel} theme-panel`}>
        <form onSubmit={submit} className={styles.searchForm}>
          <label htmlFor="playerSearch" className={styles.searchLabel}>
            <UserRound size={16} aria-hidden="true" />
            {t("playerSearchLabel")}
          </label>
          <div className={styles.searchRow}>
            <input
              id="playerSearch"
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("playerSearchPlaceholder")}
              autoComplete="off"
              className={`${styles.searchInput} theme-input`}
            />
            <button
              type="submit"
              className={styles.searchButton}
              disabled={input.trim().length < 2}
            >
              <Search size={17} aria-hidden="true" />
              {t("search")}
            </button>
          </div>
          <p className={styles.searchHint}>{t("playerSearchHint")}</p>
        </form>
      </section>

      {shortQuery ? <p className={styles.status}>{t("playerSearchHint")}</p> : null}
      {query.length === 0 ? <p className={styles.status}>{t("playerSearchInitial")}</p> : null}
      {search.isLoading ? <p className={styles.status}>{t("playerSearchLoading")}</p> : null}
      {search.isError ? <p className={styles.error}>{t("playerSearchError")}</p> : null}
      {!search.isLoading && !search.isError && query.length >= 2 && search.data?.length === 0 ? (
        <p className={styles.status}>{t("playerSearchEmpty")}</p>
      ) : null}

      {search.data && search.data.length > 0 ? (
        <ul className={styles.results}>
          {search.data.map((player) => (
            <li key={player.playerId}>
              <Link to={profilePath(player)} className={styles.resultLink}>
                <PlayerAvatar
                  playerId={player.playerId}
                  displayName={player.displayName}
                  avatarUrl={player.avatarUrl}
                  size={52}
                />
                <span className={styles.resultCopy}>
                  <span className={styles.resultName}>{player.displayName}</span>
                  <span className={styles.resultUsername}>
                    {player.username ? `@${player.username}` : t("noUsername")}
                  </span>
                  <span className={styles.resultId}>
                    <span>{t("userId")}</span>
                    <code>{player.playerId}</code>
                  </span>
                </span>
                <ArrowUpRight size={18} className={styles.resultIcon} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
