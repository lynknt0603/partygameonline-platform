import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Crown, Shield, Trophy } from "lucide-react";
import { fetchRanking, type RankingBloodline, type RankingEntryDto, type RankingSort } from "@/shared/api/ranking";
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
];

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
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

function PodiumCard({ entry, position }: { entry: RankingEntryDto; position: 1 | 2 | 3 }) {
  const isFirst = position === 1;
  const isSecond = position === 2;

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
        <PlayerAvatar playerId={entry.playerId} displayName={entry.displayName} size={64} />
      </div>

      {/* Name & Title */}
      <div className={styles.podiumInfo}>
        <strong className={styles.podiumName}>{entry.displayName}</strong>
        <span className={styles.podiumSubtitle}>ELO CAO NHẤT</span>
      </div>

      {/* Score with Icon */}
      <div className={styles.podiumScoreRow}>
        {isFirst ? (
          <Trophy size={16} className={styles.goldCup} aria-hidden="true" />
        ) : isSecond ? (
          <Shield size={16} className={styles.silverIcon} aria-hidden="true" />
        ) : (
          <Trophy size={16} className={styles.bronzeCup} aria-hidden="true" />
        )}
        <strong className={styles.podiumScore}>{formatNumber(entry.highestElo)}</strong>
      </div>
    </article>
  );
}

function RankingTableRow({ entry }: { entry: RankingEntryDto }) {
  const image = bloodlineImage(entry.favoriteBloodline);
  return (
    <div className={styles.tableRow}>
      <div className={styles.rankCell}>
        <span>{entry.rank}</span>
      </div>
      <div className={styles.nameCell}>
        <PlayerAvatar playerId={entry.playerId} displayName={entry.displayName} size={36} />
        <span className={styles.playerName}>{entry.displayName}</span>
      </div>
      <div className={styles.numberCell}>{formatNumber(entry.highestElo)}</div>
      <div className={styles.numberCell}>{formatNumber(entry.totalWins)}</div>
      <div className={styles.bloodlineCell}>
        <img src={image} alt="" className={styles.bloodlineThumb} aria-hidden="true" />
        <span className={styles.bloodlineName}>{bloodlineLabel(entry.favoriteBloodline)}</span>
        <strong className={styles.bloodlineScore}>{entry.bloodlineWins}</strong>
      </div>
    </div>
  );
}

export function RankingPage() {
  const currentDisplayName = useSessionStore((state) => state.session?.displayName) || "You";

  const [sort, setSort] = useState<RankingSort>("highestElo");
  const [bloodline, setBloodline] = useState<RankingBloodline>(null);
  const [page, setPage] = useState(0);

  const ranking = useQuery({
    queryKey: ["ranking", sort, bloodline, page],
    queryFn: () => fetchRanking({ sort, bloodline, page, size: 7 }),
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

          <div className={styles.filterList} role="tablist" aria-label="Ranking sort">
            {SORT_OPTIONS.map(({ id, label, icon: Icon }) => (
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
        </aside>

        {/* Right Main Content */}
        <main className={styles.content}>
          <header className={styles.header}>
            <h2 className={styles.headerTitle}>BẢNG XẾP HẠNG</h2>
          </header>

          {ranking.isLoading ? (
            <div className={styles.emptyNotice}>
              <p>Đang tải dữ liệu xếp hạng…</p>
            </div>
          ) : isEmpty ? (
            <div className={styles.emptyNotice}>
              <p>Chưa có người chơi hoàn tất trận NOB nào.</p>
              <span>Hãy vào phòng và chơi ván đầu tiên để bắt đầu ghi danh lên bảng xếp hạng!</span>
            </div>
          ) : (
            <>
              {/* Top 3 Podium Cards (Order: 2, 1, 3) */}
              {podium.length > 0 ? (
                <section className={styles.podium} aria-label="Top 3 players">
                  {top2 ? <PodiumCard entry={top2} position={2} /> : <div className={styles.podiumPlaceholder} />}
                  {top1 ? <PodiumCard entry={top1} position={1} /> : <div className={styles.podiumPlaceholder} />}
                  {top3 ? <PodiumCard entry={top3} position={3} /> : <div className={styles.podiumPlaceholder} />}
                </section>
              ) : null}

              {/* Leaderboard Table (Ranks 4-10) */}
              {entries.length > 0 ? (
                <section className={styles.tableCard} aria-label="Leaderboard table">
                  <div className={styles.tableHeader}>
                    <span>HẠNG</span>
                    <span>NGƯỜI CHƠI</span>
                    <span>ELO CAO NHẤT</span>
                    <span>SỐ TRẬN THẮNG</span>
                    <span>ROLE NHIỀU ROUND THẮNG</span>
                  </div>

                  <div className={styles.tableBody}>
                    {entries.map((entry) => (
                      <RankingTableRow key={entry.playerId} entry={entry} />
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
                    <PlayerAvatar playerId={me.playerId} displayName={me.displayName || currentDisplayName} size={38} />
                    <span className={styles.meNameText}>{me.displayName || "You"}</span>
                  </div>

                  <div className={styles.meEloCol}>{formatNumber(me.highestElo)}</div>
                  <div className={styles.meWinsCol}>{formatNumber(me.totalWins)}</div>

                  <div className={styles.meBloodlineCol}>
                    <img
                      src={bloodlineImage(me.favoriteBloodline)}
                      alt=""
                      className={styles.bloodlineThumb}
                      aria-hidden="true"
                    />
                    <span className={styles.bloodlineName}>{bloodlineLabel(me.favoriteBloodline)}</span>
                    <strong className={styles.bloodlineScore}>{me.bloodlineWins}</strong>
                  </div>
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
