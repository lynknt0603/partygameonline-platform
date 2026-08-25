import { useState } from "react";
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
  Moon,
  Swords,
  Trophy,
} from "lucide-react";
import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import { AVATAR_ASSETS, avatarUrlForPlayer } from "@/shared/avatar/avatar";
import { fetchPlayerStats, fetchPublicPlayerStats } from "@/shared/api/stats";
import { useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import { Link } from "react-router-dom";
import styles from "./ProfilePage.module.css";

export function ProfilePage({ profileUsername }: { profileUsername?: string } = {}) {
  const t = useT();
  const session = useSessionStore((state) => state.session);
  const rename = useSessionStore((state) => state.rename);
  const setAvatar = useSessionStore((state) => state.setAvatar);

  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [avatarEditing, setAvatarEditing] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(session?.displayName ?? "BloodMoon");
  const [isSaving, setIsSaving] = useState(false);
  const isPublicProfile = Boolean(profileUsername);

  const { data: stats, isError } = useQuery({
    queryKey: ["player-stats", profileUsername ?? session?.playerId],
    queryFn: () => profileUsername ? fetchPublicPlayerStats(profileUsername) : fetchPlayerStats(),
  });

  if (isPublicProfile && isError) {
    return (
      <div className={styles.page}>
        <PageHeading title="Không tìm thấy hồ sơ" subtitle={`@${profileUsername}`} />
        <section className={`${styles.statsSection} theme-panel`}>
          <p>Người chơi này không tồn tại hoặc hồ sơ chưa sẵn sàng.</p>
          <Link to="/ranking">Quay lại bảng xếp hạng</Link>
        </section>
      </div>
    );
  }

  const displayName = (isPublicProfile ? stats?.player.displayName : session?.displayName || stats?.player.displayName) || profileUsername || "BloodMoon";
  const playerId = (isPublicProfile ? stats?.player.playerId : session?.playerId || stats?.player.playerId) || "NB-7X9X2M";
  const joinedDate = stats?.player.joinedAt || "12/02/2025";
  const platformName = stats?.player.platform || "Web";
  const memberRole = stats?.player.role || (isPublicProfile ? "Member" : t("memberBadge"));
  const currentAvatarUrl = avatarUrlForPlayer(playerId, isPublicProfile ? stats?.player.avatarUrl : session?.avatarUrl ?? stats?.player.avatarUrl);

  const nob = stats?.nobStats ?? {
    totalMatches: isPublicProfile ? 0 : 256,
    matchesWon: isPublicProfile ? 0 : 164,
    winRate: isPublicProfile ? 0 : 64.1,
    vampire: { matchesPlayed: isPublicProfile ? 0 : 112, matchesWon: isPublicProfile ? 0 : 72, winRate: isPublicProfile ? 0 : 64.3 },
    werewolf: { matchesPlayed: isPublicProfile ? 0 : 98, matchesWon: isPublicProfile ? 0 : 59, winRate: isPublicProfile ? 0 : 60.2 },
    halfblood: { matchesPlayed: isPublicProfile ? 0 : 46, matchesWon: isPublicProfile ? 0 : 33, winRate: isPublicProfile ? 0 : 71.7 },
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
      await rename(nameInput.trim());
      setEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const openAvatarEditor = () => {
    setSelectedAvatarUrl(currentAvatarUrl);
    setAvatarEditing(true);
  };

  const handleSaveAvatar = () => {
    if (!selectedAvatarUrl) {
      return;
    }
    setAvatar(selectedAvatarUrl);
    setAvatarEditing(false);
  };

  return (
    <div className={styles.page}>
      <PageHeading
        title={isPublicProfile ? displayName : t("profileTitle")}
        subtitle={isPublicProfile ? `@${profileUsername}` : t("profileSub")}
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
          <div className={styles.nameRow}>
            <h2 className={styles.displayName}>{displayName}</h2>
            <span className={styles.roleBadge}>{memberRole}</span>
          </div>

          <div className={styles.metaGrid}>
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
              <label htmlFor="profileNameInput">{t("guestName")}</label>
              <input
                id="profileNameInput"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={24}
                required
                autoFocus
              />
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
              {AVATAR_ASSETS.map((avatar) => {
                const selected = selectedAvatarUrl === avatar.src;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    className={`${styles.avatarOption} ${selected ? styles.avatarOptionSelected : ""}`}
                    aria-pressed={selected}
                    onClick={() => setSelectedAvatarUrl(avatar.src)}
                  >
                    <PlayerAvatar
                      displayName={avatar.id}
                      avatarUrl={avatar.src}
                      size={72}
                      decorative
                    />
                    <span>{avatar.id.replace(/-/g, " ")}</span>
                  </button>
                );
              })}
            </div>
            <div className={styles.editModalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setAvatarEditing(false)}>
                {t("cancel")}
              </button>
              <button type="button" className={styles.saveBtn} onClick={handleSaveAvatar} disabled={!selectedAvatarUrl}>
                {t("saveAvatar")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
    </div>
  );
}
