import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Crown, Leaf, Shield, Swords, Trophy, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import {
  fetchRanking,
  type RankingBloodline,
  type RankingEntryDto,
  type RankingGameId,
  type RankingSort,
} from "@/shared/api/ranking";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import { useSessionStore } from "@/shared/state/sessionStore";
import styles from "./RankingPage.module.css";

const BLOODLINES: Array<{
  id: Exclude<RankingBloodline, null>;
  label: string;
  image: string;
  className: string;
}> = [
  {
    id: "WEREWOLF",
    label: "TOP WEREWOLF",
    image: "/assets/games/nob/bloodlines/werewolf-01.png",
    className: "werewolf",
  },
  {
    id: "VAMPIRE",
    label: "TOP VAMPIRE",
    image: "/assets/games/nob/bloodlines/vampire-01.png",
    className: "vampire",
  },
  {
    id: "HALFBLOOD",
    label: "TOP HALFBLOOD",
    image: "/assets/games/nob/bloodlines/halfblood.png",
    className: "halfblood",
  },
];

const SORT_OPTIONS: Array<{ id: RankingSort; label: string; icon: typeof Crown }> = [
  { id: "highestElo", label: "ELO CAO NHẤT", icon: Crown },
  { id: "wins", label: "SỐ TRẬN THẮNG", icon: Trophy },
  { id: "bloodlineWins", label: "ROLE NHIỀU ROUND THẮNG", icon: Shield },
  { id: "vegetarianWinRate", label: "TOP TỶ LỆ THẮNG ĂN CHAY", icon: Leaf },
  { id: "meatEaterWinRate", label: "TOP TỶ LỆ THẮNG ĂN THỊT", icon: Utensils },
];

const RANKING_GAMES: Array<{ id: RankingGameId; label: string }> = [
  { id: "night-of-bloodlines", label: "Night of Bloodlines" },
  { id: "not-in-my-pot", label: "Not In My Pot" },
];

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function rankingScore(entry: RankingEntryDto, sort: RankingSort): number {
  if (sort === "wins") return entry.totalWins;
  if (sort === "bloodlineWins") return entry.bloodlineWins;
  if (sort === "vegetarianWinRate") return entry.vegetarianWinRate ?? 0;
  if (sort === "meatEaterWinRate") return entry.meatEaterWinRate ?? 0;
  return entry.highestElo;
}

function profilePath(entry: RankingEntryDto): string {
  return `/profile/${encodeURIComponent(entry.username || entry.playerId)}`;
}

function bloodlineLabel(value?: string | null): string {
  switch (value) {
    case "VAMPIRE":
      return "VAMPIRE";
    case "WEREWOLF":
      return "WEREWOLF";
    case "HALFBLOOD":
      return "HALFBLOOD";
    default:
      return "YARD DOG";
  }
}

function bloodlineImage(value?: string | null): string {
  switch (value) {
    case "VAMPIRE":
      return "/assets/games/nob/bloodlines/vampire-01.png";
    case "WEREWOLF":
      return "/assets/games/nob/bloodlines/werewolf-01.png";
    case "HALFBLOOD":
      return "/assets/games/nob/bloodlines/halfblood.png";
    default:
      return "/assets/games/nob/bloodlines/vampire-01.png";
  }
}

function PodiumCard({
  entry,
  position,
  sort,
  bloodline,
}: {
  entry: RankingEntryDto;
  position: 1 | 2 | 3;
  sort: RankingSort;
  bloodline: RankingBloodline;
}) {
  const isFirst = position === 1;
  const isSecond = position === 2;

  let subtitle = "ELO CAO NHẤT";
  let scoreValue = rankingScore(entry, sort);

  if (sort === "wins") {
    subtitle = "SỐ TRẬN THẮNG";
    scoreValue = entry.totalWins;
  } else if (sort === "bloodlineWins") {
    subtitle = bloodline ? `ROUND THẮNG ${bloodline}` : "ROLE NHIỀU ROUND THẮNG";
  } else if (sort === "vegetarianWinRate") {
    subtitle = "TỶ LỆ THẮNG ĂN CHAY";
  } else if (sort === "meatEaterWinRate") {
    subtitle = "TỶ LỆ THẮNG ĂN THỊT";
  }

  return (
    <article className={`${styles.podiumCard} ${styles[`podium${position}`]}`}>
      {/* Top Shield Rank */}
      <div className={styles.shieldWrapper}>
        <div className={`${styles.shieldBadge} ${isFirst ? styles.shieldGold : isSecond ? styles.shieldSilver : styles.shieldBronze}`}>
          <span className={styles.shieldNumber}>{position}</span>
        </div>
      </div>

      {/* Avatar */}
      <div className={styles.podiumAvatarWrapper}>
        <PlayerAvatar playerId={entry.playerId} displayName={entry.displayName} avatarUrl={entry.avatarUrl} size={64} />
      </div>

      {/* Name & Title */}
      <div className={styles.podiumInfo}>
        <Link className={styles.podiumNameLink} to={profilePath(entry)}>
          <strong className={styles.podiumName}>{entry.displayName}</strong>
        </Link>
        <span className={styles.podiumSubtitle}>{subtitle}</span>
      </div>

      {/* Score with Icon */}
      <div className={styles.podiumScoreRow}>
        {sort === "wins" ? (
          <Trophy size={16} className={isFirst ? styles.goldCup : isSecond ? styles.silverIcon : styles.bronzeCup} aria-hidden="true" />
        ) : sort === "bloodlineWins" ? (
          <Swords size={16} className={isFirst ? styles.goldCup : isSecond ? styles.silverIcon : styles.bronzeCup} aria-hidden="true" />
        ) : isFirst ? (
          <Trophy size={16} className={styles.goldCup} aria-hidden="true" />
        ) : isSecond ? (
          <Shield size={16} className={styles.silverIcon} aria-hidden="true" />
        ) : (
          <Trophy size={16} className={styles.bronzeCup} aria-hidden="true" />
        )}
        <strong className={styles.podiumScore}>{formatNumber(scoreValue)}{sort.endsWith("WinRate") ? "%" : ""}</strong>
      </div>
    </article>
  );
}

function RankingTableRow({
  entry,
  sort,
  isNob,
}: {
  entry: RankingEntryDto;
  sort: RankingSort;
  isNob: boolean;
}) {
  const image = bloodlineImage(entry.favoriteBloodline);
  return (
    <div className={styles.tableRow}>
      <div className={styles.rankCell}>
        <span>{entry.rank}</span>
      </div>
      <div className={styles.nameCell}>
        <Link className={styles.playerProfileLink} to={profilePath(entry)}>
          <PlayerAvatar playerId={entry.playerId} displayName={entry.displayName} avatarUrl={entry.avatarUrl} size={36} />
          <span className={styles.playerName}>{entry.displayName}</span>
        </Link>
      </div>
      <div className={`${styles.numberCell} ${sort === "highestElo" ? styles.activeCell : ""}`}>
        {formatNumber(entry.highestElo)}
      </div>
      <div className={`${styles.numberCell} ${sort === "wins" ? styles.activeCell : ""}`}>
        {formatNumber(entry.totalWins)}
      </div>
      {isNob ? (
        <div className={`${styles.bloodlineCell} ${sort === "bloodlineWins" ? styles.activeCell : ""}`}>
          <img src={image} alt="" className={styles.bloodlineThumb} aria-hidden="true" />
          <span className={styles.bloodlineName}>{bloodlineLabel(entry.favoriteBloodline)}</span>
          <strong className={styles.bloodlineScore}>{entry.bloodlineWins}</strong>
        </div>
      ) : (
        <div className={`${styles.numberCell} ${sort === "vegetarianWinRate" || sort === "meatEaterWinRate" ? styles.activeCell : ""}`}>
          {sort === "vegetarianWinRate"
            ? `${entry.vegetarianWinRate ?? 0}%`
            : sort === "meatEaterWinRate"
              ? `${entry.meatEaterWinRate ?? 0}%`
              : formatNumber(entry.elo)}
        </div>
      )}
    </div>
  );
}

export function RankingPage() {
  const currentDisplayName = useSessionStore((state) => state.session?.displayName) || "You";

  const [gameId, setGameId] = useState<RankingGameId>("night-of-bloodlines");
  const [sort, setSort] = useState<RankingSort>("highestElo");
  const [bloodline, setBloodline] = useState<RankingBloodline>(null);
  const [page, setPage] = useState(0);

  const isNob = gameId === "night-of-bloodlines";
  const visibleSortOptions = SORT_OPTIONS.filter((option) =>
    isNob
      ? option.id !== "vegetarianWinRate" && option.id !== "meatEaterWinRate"
      : option.id !== "bloodlineWins"
  );

  const ranking = useQuery({
    queryKey: ["ranking", gameId, sort, bloodline, page],
    queryFn: () => fetchRanking({ gameId, sort, bloodline: isNob ? bloodline : null, page, size: 7 }),
  });

  const podium = ranking.data?.podium ?? [];
  const entries = ranking.data?.entries ?? [];
  const me = ranking.data?.me ?? null;
  const isEmpty = !ranking.isLoading && podium.length === 0 && entries.length === 0;

  const selectSort = (nextSort: RankingSort) => {
    setSort(nextSort);
    setPage(0);
  };

  const selectBloodline = (nextBloodline: RankingBloodline) => {
    setBloodline(nextBloodline);
    setSort("bloodlineWins");
    setPage(0);
  };

  const selectGame = (nextGameId: RankingGameId) => {
    setGameId(nextGameId);
    setBloodline(null);
    setSort("highestElo");
    setPage(0);
  };

  // Find top 1, 2, 3
  const top1 = podium.find((p) => p.rank === 1);
  const top2 = podium.find((p) => p.rank === 2);
  const top3 = podium.find((p) => p.rank === 3);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.board}>
        {/* Left Sidebar */}
        <aside className={styles.sidebar} aria-label="Ranking filters">
          <div className={styles.brandLockup}>
            <strong>RANKING</strong>
          </div>

          <label className={styles.gameSelector}>
            <span>TRÒ CHƠI</span>
            <select
              value={gameId}
              onChange={(event) => selectGame(event.target.value as RankingGameId)}
              aria-label="Chọn bảng xếp hạng theo trò chơi"
            >
              {RANKING_GAMES.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.filterList} role="tablist" aria-label="Ranking sort">
            {visibleSortOptions.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`${styles.filterButton} ${sort === id && bloodline === null ? styles.filterActive : ""}`}
                onClick={() => {
                  setBloodline(null);
                  selectSort(id);
                }}
                role="tab"
                aria-selected={sort === id && bloodline === null}
              >
                <Icon size={20} className={styles.filterIcon} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {isNob ? (
            <div className={styles.bloodlineFilters}>
              {BLOODLINES.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`${styles.bloodlineFilter} ${styles[item.className]} ${bloodline === item.id ? styles.bloodlineActive : ""}`}
                onClick={() => selectBloodline(item.id)}
              >
                <div className={styles.bloodlineCrestWrapper}>
                  <img src={item.image} alt="" className={styles.bloodlineCrestImg} aria-hidden="true" />
                </div>
                <span className={styles.bloodlineFilterLabel}>{item.label}</span>
                <ChevronRight size={16} className={styles.bloodlineChevron} aria-hidden="true" />
              </button>
              ))}
            </div>
          ) : (
            <div className={styles.notInMyPotSidebarNote}>
              <span>NOT IN MY POT</span>
              <p>ELO và thành tích được tính độc lập với Night of Bloodlines.</p>
            </div>
          )}
        </aside>

        {/* Right Main Content */}
        <main className={styles.content}>
          <header className={styles.header}>
            <div>
              <h2 className={styles.headerTitle}>BẢNG XẾP HẠNG</h2>
              <p className={styles.headerGameName}>
                {isNob ? "Night of Bloodlines" : "Not In My Pot"}
              </p>
            </div>
          </header>

          {ranking.isLoading ? (
            <div className={styles.emptyNotice}>
              <p>Đang tải dữ liệu xếp hạng…</p>
            </div>
          ) : isEmpty ? (
            <div className={styles.emptyNotice}>
              <p>Chưa có người chơi hoàn tất trận {isNob ? "NOB" : "Not In My Pot"} nào.</p>
              <span>Hãy vào phòng và chơi ván đầu tiên để bắt đầu ghi danh lên bảng xếp hạng!</span>
            </div>
          ) : (
            <>
              {/* Top 3 Podium Cards (Order: 2, 1, 3) */}
              {podium.length > 0 ? (
                <section className={styles.podium} aria-label="Top 3 players">
                  {top2 ? <PodiumCard entry={top2} position={2} sort={sort} bloodline={bloodline} /> : <div className={styles.podiumPlaceholder} />}
                  {top1 ? <PodiumCard entry={top1} position={1} sort={sort} bloodline={bloodline} /> : <div className={styles.podiumPlaceholder} />}
                  {top3 ? <PodiumCard entry={top3} position={3} sort={sort} bloodline={bloodline} /> : <div className={styles.podiumPlaceholder} />}
                </section>
              ) : null}

              {/* Leaderboard Table (Ranks 4-10) */}
              {entries.length > 0 ? (
                <section className={styles.tableCard} aria-label="Leaderboard table">
                  <div className={styles.tableHeader}>
                    <span>HẠNG</span>
                    <span>NGƯỜI CHƠI</span>
                    <span className={sort === "highestElo" ? styles.activeHeader : ""}>ELO CAO NHẤT</span>
                    <span className={sort === "wins" ? styles.activeHeader : ""}>SỐ TRẬN THẮNG</span>
                    <span className={sort === "bloodlineWins" || sort === "vegetarianWinRate" || sort === "meatEaterWinRate" ? styles.activeHeader : ""}>
                      {isNob
                        ? "ROLE NHIỀU ROUND THẮNG"
                        : sort === "vegetarianWinRate"
                          ? "TỶ LỆ THẮNG ĂN CHAY"
                          : sort === "meatEaterWinRate"
                            ? "TỶ LỆ THẮNG ĂN THỊT"
                            : "ELO HIỆN TẠI"}
                    </span>
                  </div>

                  <div className={styles.tableBody}>
                    {entries.map((entry) => (
                      <RankingTableRow key={entry.playerId} entry={entry} sort={sort} isNob={isNob} />
                    ))}
                  </div>
                </section>
              ) : null}

              {/* User's Rank Bottom Bar (HẠNG CỦA BẠN) */}
              {me ? (
                <section className={styles.meCard} aria-label="Your rank">
                  <div className={styles.meRankCol}>
                    <div className={styles.meLabel}>
                      <span>HẠNG</span>
                      <span>CỦA BẠN</span>
                    </div>
                    <span className={styles.meRankNumber}>{me.rank}</span>
                  </div>

                  <div className={styles.meNameCol}>
                    <Link className={styles.meNameLink} to={profilePath(me)}>
                      <PlayerAvatar playerId={me.playerId} displayName={me.displayName || currentDisplayName} avatarUrl={me.avatarUrl} size={38} />
                      <span className={styles.meNameText}>{me.displayName || "You"}</span>
                    </Link>
                  </div>

                  <div className={`${styles.meEloCol} ${sort === "highestElo" ? styles.activeMeNumber : ""}`}>
                    {formatNumber(me.highestElo)}
                  </div>
                  <div className={`${styles.meWinsCol} ${sort === "wins" ? styles.activeMeNumber : ""}`}>
                    {formatNumber(me.totalWins)}
                  </div>

                  {isNob ? (
                    <div className={`${styles.meBloodlineCol} ${sort === "bloodlineWins" ? styles.activeMeNumber : ""}`}>
                      <img
                        src={bloodlineImage(me.favoriteBloodline)}
                        alt=""
                        className={styles.bloodlineThumb}
                        aria-hidden="true"
                      />
                      <span className={styles.bloodlineName}>{bloodlineLabel(me.favoriteBloodline)}</span>
                      <strong className={styles.bloodlineScore}>{me.bloodlineWins}</strong>
                    </div>
                  ) : (
                    <div className={`${styles.meEloCol} ${sort === "vegetarianWinRate" || sort === "meatEaterWinRate" ? styles.activeMeNumber : ""}`}>
                      {sort === "vegetarianWinRate"
                        ? `${me.vegetarianWinRate ?? 0}%`
                        : sort === "meatEaterWinRate"
                          ? `${me.meatEaterWinRate ?? 0}%`
                          : formatNumber(me.elo)}
                    </div>
                  )}
                </section>
              ) : null}

              {/* Pagination if multiple pages */}
              {ranking.data && ranking.data.totalPages > 1 ? (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    Trước
                  </button>
                  <span>
                    {page + 1} / {ranking.data.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page + 1 >= ranking.data.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Sau
                  </button>
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
