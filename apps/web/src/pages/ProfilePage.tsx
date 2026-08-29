import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  Copy,
  Crosshair,
  Edit3,
  Globe,
  Gauge,
  Info,
  Lock,
  Medal,
  Moon,
  Swords,
  Trophy,
} from "lucide-react";
import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import { AVATAR_ASSETS, avatarUrlForPlayer } from "@/shared/avatar/avatar";
import { fetchPlayerStats, fetchPublicPlayerStats } from "@/shared/api/stats";
import { useLocale, useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import { Link } from "react-router-dom";
import styles from "./ProfilePage.module.css";

const ACHIEVEMENT_COPY: Record<"vi" | "en", Record<string, { title: string; description: string }>> = {
  vi: {
    NIMP_POT_REVEALED: { title: "Chủ bếp quyết đoán", description: "Mở nồi tính điểm 10 lần." },
    NIMP_TOFU_PLAYED: { title: "Đậu phụ thanh đạm", description: "Bỏ 20 lá Đậu phụ vào nồi." },
    NIMP_MEAT_PLAYED: { title: "Tín đồ ăn thịt", description: "Bỏ 20 lá Thịt vào nồi." },
    NIMP_VEGETABLE_PLAYED: { title: "Vườn rau xanh", description: "Bỏ 20 lá Rau củ vào nồi." },
    NIMP_VEGETARIAN_WINS: { title: "Bếp chay chiến thắng", description: "Thắng 10 trận với phe Người ăn chay." },
    NIMP_MEAT_EATER_WINS: { title: "Bữa tiệc thịt", description: "Thắng 10 trận với phe Người ăn thịt." },
    NOB_HALFBLOOD_PLAYED: { title: "Dòng máu lai", description: "Chơi 20 round với Halfblood." },
    NOB_VAMPIRE_PLAYED: { title: "Huyết tộc", description: "Chơi 20 round với Vampire." },
    NOB_WEREWOLF_PLAYED: { title: "Tiếng tru trăng", description: "Chơi 20 round với Werewolf." },
    NOB_HALFBLOOD_WINS: { title: "Halfblood bất bại", description: "Thắng 20 round với Halfblood." },
    NOB_VAMPIRE_WINS: { title: "Chúa tể Vampire", description: "Thắng 20 round với Vampire." },
    NOB_WEREWOLF_WINS: { title: "Alpha Werewolf", description: "Thắng 20 round với Werewolf." },
    RANKING_TOP_ONE: { title: "Đứng trên đỉnh", description: "Đạt Top 1 ở một bảng xếp hạng bất kỳ." },
    ACHIEVEMENT_MASTER: { title: "Bậc thầy BoardVerse", description: "Hoàn thành tất cả thành tựu để nhận hai avatar Master." },
  },
  en: {
    NIMP_POT_REVEALED: { title: "Decisive Chef", description: "Reveal the pot to score 10 times." },
    NIMP_TOFU_PLAYED: { title: "Pure Tofu", description: "Add 20 Tofu cards to the pot." },
    NIMP_MEAT_PLAYED: { title: "Meat Devotee", description: "Add 20 Meat cards to the pot." },
    NIMP_VEGETABLE_PLAYED: { title: "Green Garden", description: "Add 20 Vegetable cards to the pot." },
    NIMP_VEGETARIAN_WINS: { title: "Vegetarian Victory", description: "Win 10 matches as the Vegetarian faction." },
    NIMP_MEAT_EATER_WINS: { title: "Meat Feast", description: "Win 10 matches as the Meat Eater faction." },
    NOB_HALFBLOOD_PLAYED: { title: "Hybrid Bloodline", description: "Play 20 rounds as Halfblood." },
    NOB_VAMPIRE_PLAYED: { title: "Blood Clan", description: "Play 20 rounds as Vampire." },
    NOB_WEREWOLF_PLAYED: { title: "Moon Howl", description: "Play 20 rounds as Werewolf." },
    NOB_HALFBLOOD_WINS: { title: "Invincible Halfblood", description: "Win 20 rounds as Halfblood." },
    NOB_VAMPIRE_WINS: { title: "Vampire Lord", description: "Win 20 rounds as Vampire." },
    NOB_WEREWOLF_WINS: { title: "Alpha Werewolf", description: "Win 20 rounds as Werewolf." },
    RANKING_TOP_ONE: { title: "Peak of Glory", description: "Reach Top 1 on any leaderboard." },
    ACHIEVEMENT_MASTER: { title: "BoardVerse Master", description: "Complete all achievements to unlock two Master avatars." },
  },
};

export function ProfilePage({ profileUsername }: { profileUsername?: string } = {}) {
  const t = useT();
  const locale = useLocale();
  const session = useSessionStore((state) => state.session);
  const updateDisplayName = useSessionStore((state) => state.updateDisplayName);
  const setAvatar = useSessionStore((state) => state.setAvatar);

  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [avatarEditing, setAvatarEditing] = useState(false);
  const [selectedAvatarKey, setSelectedAvatarKey] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(session?.displayName ?? "BloodMoon");
  const [hideGameStats, setHideGameStats] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isPublicProfile = Boolean(profileUsername);

  const { data: stats, isError, refetch } = useQuery({
    queryKey: ["player-stats", profileUsername ?? session?.playerId],
    queryFn: () => profileUsername ? fetchPublicPlayerStats(profileUsername) : fetchPlayerStats(),
  });

  useEffect(() => {
    if (!isPublicProfile && stats) {
      setHideGameStats(Boolean(stats.gameStatsHidden));
    }
  }, [isPublicProfile, stats?.gameStatsHidden]);

  if (isPublicProfile && isError) {
    return (
      <div className={styles.page}>
        <PageHeading
          title={locale === "vi" ? "Không tìm thấy hồ sơ" : "Profile Not Found"}
          subtitle={`@${profileUsername}`}
        />
        <section className={`${styles.statsSection} theme-panel`}>
          <p>{locale === "vi" ? "Người chơi này không tồn tại hoặc hồ sơ chưa sẵn sàng." : "This player does not exist or their profile is not ready."}</p>
          <Link to="/ranking">{locale === "vi" ? "Quay lại bảng xếp hạng" : "Back to Ranking"}</Link>
        </section>
      </div>
    );
  }

  const displayName = (isPublicProfile ? stats?.player.displayName : session?.displayName || stats?.player.displayName) || profileUsername || "BloodMoon";
  const username = stats?.player.username?.trim() || null;
  const playerId = (isPublicProfile ? stats?.player.playerId : session?.playerId || stats?.player.playerId) || "NB-7X9X2M";
  const joinedDate = stats?.player.joinedAt || "12/02/2025";
  const platformName = stats?.player.platform || "Web";
  const memberRole = stats?.player.role || (isPublicProfile ? "Member" : t("memberBadge"));
  const currentAvatarUrl = avatarUrlForPlayer(playerId, isPublicProfile ? stats?.player.avatarUrl : session?.avatarUrl ?? stats?.player.avatarUrl);
  const gameStatsHidden = isPublicProfile && Boolean(stats?.gameStatsHidden);

  const nob = stats?.nobStats ?? {
    totalMatches: 0,
    matchesWon: 0,
    winRate: 0,
    vampire: { matchesPlayed: 0, matchesWon: 0, winRate: 0 },
    werewolf: { matchesPlayed: 0, matchesWon: 0, winRate: 0 },
    halfblood: { matchesPlayed: 0, matchesWon: 0, winRate: 0 },
    elo: 5000,
    highestElo: 5000,
  };

  const nimp = stats?.notInMyPotStats ?? {
    totalMatches: 0,
    matchesWon: 0,
    winRate: 0,
    vegetarian: { matchesPlayed: 0, matchesWon: 0, winRate: 0 },
    meatEater: { matchesPlayed: 0, matchesWon: 0, winRate: 0 },
    elo: 5000,
    highestElo: 5000,
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(playerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsSaving(true);
    try {
      await updateDisplayName(nameInput.trim(), hideGameStats);
      await refetch();
      setEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const openAvatarEditor = () => {
    const selected = stats?.avatars?.find((avatar) => avatar.selected)
      ?? stats?.avatars?.find((avatar) => avatar.url === currentAvatarUrl);
    setSelectedAvatarKey(selected?.key ?? "default.png");
    setAvatarEditing(true);
  };

  const handleSaveAvatar = async () => {
    if (!selectedAvatarKey) {
      return;
    }
    setIsSaving(true);
    try {
      await setAvatar(selectedAvatarKey);
      await refetch();
      setAvatarEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const availableAvatars = stats?.avatars?.length
    ? stats.avatars
    : AVATAR_ASSETS.map((avatar) => ({
        key: avatar.key,
        url: avatar.src,
        unlocked: avatar.free,
        selected: avatar.src === currentAvatarUrl,
        source: avatar.free ? "FREE" : "LOCKED",
        achievementCode: avatar.achievementCode,
      }));

  return (
    <div className={styles.page}>
      <PageHeading
        title={isPublicProfile ? displayName : t("profileTitle")}
        subtitle={isPublicProfile ? (username ? `@${username}` : t("guestProfileSub")) : t("profileSub")}
      />

      {/* Top User Info Card */}
      <section className={`${styles.profileCard} theme-card`}>
        <div className={styles.avatarColumn}>
          <div className={styles.avatarWrapper}>
            <PlayerAvatar
              playerId={playerId}
              displayName={displayName}
              avatarUrl={currentAvatarUrl}
              size={102}
              className={styles.avatarImg}
            />
            <span className={styles.onlineBadge} title="Online" />
          </div>
          {!isPublicProfile ? (
            <button type="button" className={styles.changeAvatarBtn} onClick={openAvatarEditor}>
              <Edit3 size={14} aria-hidden="true" />
              <span>{t("changeAvatar")}</span>
            </button>
          ) : null}
        </div>

        <div className={styles.profileDetails}>
          <div className={styles.profileNameBlock}>
            <span className={styles.identityLabel}>{t("profileName")}</span>
            <div className={styles.nameRow}>
              <h2 className={styles.displayName}>{displayName}</h2>
              <span className={styles.roleBadge}>{memberRole}</span>
            </div>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{t("profileUsername")}</span>
              <span className={`${styles.metaValue} ${!username ? styles.mutedValue : ""}`}>
                {username ? `@${username}` : t("noUsername")}
              </span>
            </div>

            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>{t("userId")}</span>
              <span className={styles.metaValue}>{playerId}</span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={copyId}
                title={t("copy")}
                aria-label={t("copy")}
              >
                {copied ? <Check size={14} className={styles.checkIcon} /> : <Copy size={14} />}
              </button>
            </div>

            <div className={styles.metaItem}>
              <Calendar size={14} className={styles.metaIcon} />
              <span className={styles.metaLabel}>{t("joinedDate")}</span>
              <span className={styles.metaValue}>{joinedDate}</span>
            </div>

            <div className={styles.metaItem}>
              <Globe size={14} className={styles.metaIcon} />
              <span className={styles.metaLabel}>{t("platform")}</span>
              <span className={styles.metaValue}>{platformName}</span>
            </div>
          </div>

          {!isPublicProfile ? (
            <button
              type="button"
              className={styles.editProfileBtn}
              onClick={() => {
                setNameInput(displayName);
                setHideGameStats(Boolean(stats?.gameStatsHidden));
                setEditing(true);
              }}
            >
              <Edit3 size={15} aria-hidden="true" />
              <span>{t("editProfile")}</span>
            </button>
          ) : null}
        </div>
      </section>

      {/* Quick Edit Name Dialog */}
      {editing ? (
        <div className={styles.modalBackdrop} onClick={() => setEditing(false)}>
          <div className={`${styles.editModal} theme-panel`} onClick={(e) => e.stopPropagation()}>
            <h3>{t("editProfile")}</h3>
            <form onSubmit={handleSaveName} className={styles.editForm}>
              <label htmlFor="profileNameInput">{t("profileName")}</label>
              <input
                id="profileNameInput"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={32}
                required
                autoFocus
              />
              <label className={styles.privacyOption} htmlFor="hideGameStatsInput">
                <input
                  id="hideGameStatsInput"
                  type="checkbox"
                  checked={hideGameStats}
                  onChange={(e) => setHideGameStats(e.target.checked)}
                />
                <span>{locale === "vi" ? "Ẩn thống kê game" : "Hide game statistics"}</span>
              </label>
              <div className={styles.editModalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setEditing(false)}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                  {isSaving ? t("saving") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {avatarEditing ? (
        <div className={styles.modalBackdrop} onClick={() => setAvatarEditing(false)}>
          <div
            className={`${styles.editModal} ${styles.avatarPickerModal} theme-panel`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t("chooseAvatar")}</h3>
            <div className={styles.avatarGrid} role="radiogroup" aria-label={t("chooseAvatar")}>
              {availableAvatars.map((avatar) => {
                const selected = selectedAvatarKey === avatar.key;
                return (
                  <button
                    key={avatar.key}
                    type="button"
                    className={`${styles.avatarOption} ${selected ? styles.avatarOptionSelected : ""} ${!avatar.unlocked ? styles.avatarOptionLocked : ""}`}
                    aria-pressed={selected}
                    disabled={!avatar.unlocked}
                    title={!avatar.unlocked ? (ACHIEVEMENT_COPY[locale]?.[avatar.achievementCode ?? ""]?.description ?? (locale === "vi" ? "Chưa mở khóa" : "Locked")) : undefined}
                    onClick={() => setSelectedAvatarKey(avatar.key)}
                  >
                    <PlayerAvatar
                      displayName={avatar.key}
                      avatarUrl={avatar.url}
                      size={56}
                      decorative
                    />
                    {!avatar.unlocked ? <Lock className={styles.avatarLock} size={20} aria-hidden="true" /> : null}
                    <span>
                      {avatar.key
                        .replace(/\.png$/i, "")
                        .replace(/^\d+[_-]?/, "")
                        .replace(/[_-]/g, " ")
                        .trim()}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className={styles.editModalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setAvatarEditing(false)}>
                {t("cancel")}
              </button>
              <button type="button" className={styles.saveBtn} onClick={handleSaveAvatar} disabled={!selectedAvatarKey || isSaving}>
                {isSaving ? t("saving") : t("saveAvatar")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {gameStatsHidden ? (
        <section className={`${styles.statsSection} ${styles.hiddenStatsNotice} theme-panel`}>
          <Lock size={20} aria-hidden="true" />
          <p>{locale === "vi" ? "Người chơi này đã ẩn thống kê game." : "This player has hidden their game statistics."}</p>
        </section>
      ) : (
        <>
      {/* Night of Bloodlines Statistics Section */}
      <section className={`${styles.statsSection} theme-panel`}>
        <div className={styles.sectionHeader}>
          <Moon size={20} className={styles.sectionMoonIcon} />
          <h3>{t("nobStatsTitle")}</h3>
        </div>

        {/* Top 3 KPI Stats */}
        <div className={styles.kpiGrid}>
          <div className={`${styles.kpiCard} theme-card`}>
            <div className={styles.kpiIconWrapper}>
              <Swords size={22} className={styles.kpiIcon} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>{t("totalMatches")}</span>
              <span className={styles.kpiValue}>{nob.totalMatches}</span>
            </div>
          </div>

          <div className={`${styles.kpiCard} theme-card`}>
            <div className={styles.kpiIconWrapper}>
              <Gauge size={22} className={styles.kpiIconGold} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>{t("eloRating")}</span>
              <span className={styles.kpiValue}>{nob.elo ?? 5000}</span>
              <small className={styles.kpiHint}>
                {t("highestElo")}: {nob.highestElo ?? nob.elo ?? 5000}
              </small>
            </div>
          </div>

          <div className={`${styles.kpiCard} theme-card`}>
            <div className={styles.kpiIconWrapper}>
              <Trophy size={22} className={styles.kpiIconGold} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>{t("matchesWon")}</span>
              <span className={styles.kpiValue}>{nob.matchesWon}</span>
            </div>
          </div>

          <div className={`${styles.kpiCard} theme-card`}>
            <div className={styles.kpiIconWrapper}>
              <Crosshair size={22} className={styles.kpiIconTarget} />
            </div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>{t("winRate")}</span>
              <span className={styles.kpiValue}>{nob.winRate}%</span>
            </div>
          </div>
        </div>

        {/* Bottom 3 Faction Cards */}
        <div className={styles.factionGrid}>
          {/* Vampire Card */}
          <div className={`${styles.factionCard} ${styles.vampireCard} theme-card`}>
            <div className={styles.factionArtWrapper}>
              <img
                src="/assets/games/nob/bloodlines/vampire-01.png"
                alt={t("vampireFaction")}
                className={styles.factionArt}
              />
              <div className={styles.factionArtOverlay} />
            </div>
            <div className={styles.factionDetails}>
              <h4 className={styles.vampireTitle}>{t("vampireFaction")}</h4>
              <div className={styles.factionRow}>
                <span>{t("matchesPlayed")}</span>
                <strong>{nob.vampire.matchesPlayed}</strong>
              </div>
              <div className={styles.factionRow}>
                <span>{t("matchesWon")}</span>
                <strong>{nob.vampire.matchesWon}</strong>
              </div>
              <div className={styles.factionRow}>
                <span>{t("winRate")}</span>
                <strong className={styles.vampireHighlight}>{nob.vampire.winRate}%</strong>
              </div>
            </div>
          </div>

          {/* Werewolf Card */}
          <div className={`${styles.factionCard} ${styles.werewolfCard} theme-card`}>
            <div className={styles.factionArtWrapper}>
              <img
                src="/assets/games/nob/bloodlines/werewolf-01.png"
                alt={t("werewolfFaction")}
                className={styles.factionArt}
              />
              <div className={styles.factionArtOverlay} />
            </div>
            <div className={styles.factionDetails}>
              <h4 className={styles.werewolfTitle}>{t("werewolfFaction")}</h4>
              <div className={styles.factionRow}>
                <span>{t("matchesPlayed")}</span>
                <strong>{nob.werewolf.matchesPlayed}</strong>
              </div>
              <div className={styles.factionRow}>
                <span>{t("matchesWon")}</span>
                <strong>{nob.werewolf.matchesWon}</strong>
              </div>
              <div className={styles.factionRow}>
                <span>{t("winRate")}</span>
                <strong className={styles.werewolfHighlight}>{nob.werewolf.winRate}%</strong>
              </div>
            </div>
          </div>

          {/* Halfblood Card */}
          <div className={`${styles.factionCard} ${styles.halfbloodCard} theme-card`}>
            <div className={styles.factionArtWrapper}>
              <img
                src="/assets/games/nob/bloodlines/halfblood.png"
                alt={t("halfbloodFaction")}
                className={styles.factionArt}
              />
              <div className={styles.factionArtOverlay} />
            </div>
            <div className={styles.factionDetails}>
              <h4 className={styles.halfbloodTitle}>{t("halfbloodFaction")}</h4>
              <div className={styles.factionRow}>
                <span>{t("matchesPlayed")}</span>
                <strong>{nob.halfblood.matchesPlayed}</strong>
              </div>
              <div className={styles.factionRow}>
                <span>{t("matchesWon")}</span>
                <strong>{nob.halfblood.matchesWon}</strong>
              </div>
              <div className={styles.factionRow}>
                <span>{t("winRate")}</span>
                <strong className={styles.halfbloodHighlight}>{nob.halfblood.winRate}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Realtime Stats Footer Note */}
        <div className={styles.sectionFooterNote}>
          <Info size={16} className={styles.infoIcon} />
          <span>{t("realtimeStatsNote")}</span>
        </div>
      </section>

      <section className={`${styles.statsSection} ${styles.nimpSection} theme-panel`}>
        <div className={styles.sectionHeader}>
          <Swords size={20} className={styles.sectionMoonIcon} />
          <h3>{locale === "vi" ? "Thống kê Not In My Pot" : "Not In My Pot Statistics"}</h3>
        </div>

        <div className={styles.kpiGrid}>
          <div className={`${styles.kpiCard} theme-card`}>
            <div className={styles.kpiIconWrapper}><Swords size={22} className={styles.kpiIcon} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>{t("totalMatches")}</span>
              <span className={styles.kpiValue}>{nimp.totalMatches}</span>
            </div>
          </div>
          <div className={`${styles.kpiCard} theme-card`}>
            <div className={styles.kpiIconWrapper}><Gauge size={22} className={styles.kpiIconGold} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>{t("eloRating")}</span>
              <span className={styles.kpiValue}>{nimp.elo}</span>
              <small className={styles.kpiHint}>{t("highestElo")}: {nimp.highestElo}</small>
            </div>
          </div>
          <div className={`${styles.kpiCard} theme-card`}>
            <div className={styles.kpiIconWrapper}><Trophy size={22} className={styles.kpiIconGold} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>{t("matchesWon")}</span>
              <span className={styles.kpiValue}>{nimp.matchesWon}</span>
            </div>
          </div>
          <div className={`${styles.kpiCard} theme-card`}>
            <div className={styles.kpiIconWrapper}><Crosshair size={22} className={styles.kpiIconTarget} /></div>
            <div className={styles.kpiInfo}>
              <span className={styles.kpiLabel}>{t("winRate")}</span>
              <span className={styles.kpiValue}>{nimp.winRate}%</span>
            </div>
          </div>
        </div>

        <div className={styles.nimpFactionGrid}>
          <div className={`${styles.nimpFactionCard} theme-card`}>
            <div className={styles.nimpFactionArtWrapper}>
              <img src="/assets/avatars/01_chef_girl.png" alt="" className={styles.nimpFactionArt} />
              <div className={styles.nimpFactionArtOverlay} />
            </div>
            <div className={styles.nimpFactionDetails}>
              <h4 className={`${styles.nimpFactionTitle} ${styles.nimpVegetarianTitle}`}>
                {locale === "vi" ? "Phe ăn chay" : "Vegetarian Faction"}
              </h4>
              <div className={styles.factionRow}>
                <span>{t("matchesPlayed")}</span>
                <strong>{nimp.vegetarian.matchesPlayed}</strong>
              </div>
              <div className={styles.factionRow}>
                <span>{t("matchesWon")}</span>
                <strong>{nimp.vegetarian.matchesWon}</strong>
              </div>
              <div className={styles.factionRow}>
                <span>{t("winRate")}</span>
                <strong className={styles.nimpVegetarianHighlight}>{nimp.vegetarian.winRate}%</strong>
              </div>
            </div>
          </div>

          <div className={`${styles.nimpFactionCard} theme-card`}>
            <div className={styles.nimpFactionArtWrapper}>
              <img src="/assets/avatars/03_smirking_guy.png" alt="" className={styles.nimpFactionArt} />
              <div className={styles.nimpFactionArtOverlay} />
            </div>
            <div className={styles.nimpFactionDetails}>
              <h4 className={`${styles.nimpFactionTitle} ${styles.nimpMeatEaterTitle}`}>
                {locale === "vi" ? "Phe ăn thịt" : "Meat Eater Faction"}
              </h4>
              <div className={styles.factionRow}>
                <span>{t("matchesPlayed")}</span>
                <strong>{nimp.meatEater.matchesPlayed}</strong>
              </div>
              <div className={styles.factionRow}>
                <span>{t("matchesWon")}</span>
                <strong>{nimp.meatEater.matchesWon}</strong>
              </div>
              <div className={styles.factionRow}>
                <span>{t("winRate")}</span>
                <strong className={styles.nimpMeatEaterHighlight}>{nimp.meatEater.winRate}%</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.sectionFooterNote}>
          <Info size={16} className={styles.infoIcon} />
          <span>{t("realtimeStatsNote")}</span>
        </div>
      </section>
        </>
      )}
      {/* Achievements Section at the bottom */}
      <section className={`${styles.achievementSection} theme-panel`}>
        <div className={styles.sectionHeader}>
          <Medal size={21} className={styles.achievementHeadingIcon} />
          <div>
            <h3>{locale === "vi" ? "Thành tựu" : "Achievements"}</h3>
            <p className={styles.sectionSubtitle}>
              {locale === "vi"
                ? "Hoàn thành thử thách để mở khóa avatar độc quyền."
                : "Complete challenges to unlock exclusive avatars."}
            </p>
          </div>
        </div>
        <div className={styles.achievementGrid}>
          {(stats?.achievements ?? []).map((achievement) => {
            const copy = ACHIEVEMENT_COPY[locale]?.[achievement.code] ?? {
              title: achievement.code,
              description: locale === "vi" ? "Hoàn thành thử thách để nhận phần thưởng." : "Complete the challenge to claim rewards.",
            };
            const percentage = Math.min(100, Math.round((achievement.progress / Math.max(achievement.target, 1)) * 100));
            return (
              <article
                key={achievement.code}
                className={`${styles.achievementCard} ${achievement.unlocked ? styles.achievementUnlocked : styles.achievementLocked}`}
              >
                <div className={styles.achievementRewards}>
                  {achievement.rewardAvatarUrls.map((url) => (
                    <div className={styles.achievementReward} key={url}>
                      <img src={url} alt="" />
                      {!achievement.unlocked ? <Lock size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
                    </div>
                  ))}
                </div>
                <div className={styles.achievementBody}>
                  <div className={styles.achievementTitleRow}>
                    <h4>{copy.title}</h4>
                    <strong>{achievement.progress}/{achievement.target}</strong>
                  </div>
                  <p>{copy.description}</p>
                  <div className={styles.progressTrack} aria-label={`${percentage}%`}>
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </article>
            );
          })}
          {!stats?.achievements?.length ? (
            <p className={styles.emptyAchievements}>
              {locale === "vi" ? "Chưa tải được tiến độ thành tựu." : "Unable to load achievement progress."}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
