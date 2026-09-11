import React from "react";
import { Trophy, RotateCcw, Eye, LogOut } from "lucide-react";
import type { BloodBoundCard, BloodBoundPlayerPublic, BloodClan } from "../model/bloodBoundTypes";
import styles from "../pages/BloodBoundPlayPage.module.css";

interface BloodBoundGameOverModalProps {
  isOpen: boolean;
  winnerClan?: BloodClan | null;
  winningPlayers: string[];
  gameOverReason?: string | null;
  allPlayers: BloodBoundPlayerPublic[];
  secretCards: Record<string, BloodBoundCard>;
  isDemo: boolean;
  onRestart: () => void;
  onClose: () => void;
  onLeaveRoom: () => void;
}

export const BloodBoundGameOverModal: React.FC<BloodBoundGameOverModalProps> = ({
  isOpen,
  winnerClan,
  winningPlayers,
  gameOverReason,
  allPlayers,
  secretCards,
  isDemo,
  onRestart,
  onClose,
  onLeaveRoom,
}) => {
  if (!isOpen) return null;

  const clanName =
    winnerClan === "ROSE"
      ? "Gia Tộc Hoa Hồng"
      : winnerClan === "FAN"
      ? "Gia Tộc Quạt"
      : winnerClan === "INQUISITOR"
      ? "Kẻ Phán Xét"
      : "Ván Đấu Kết Thúc";

  const clanColor =
    winnerClan === "ROSE"
      ? "#f43f5e"
      : winnerClan === "FAN"
      ? "#10b981"
      : winnerClan === "INQUISITOR"
      ? "#f59e0b"
      : "#a855f7";

  const winningTeamList = allPlayers.filter(
    (p) => winningPlayers.includes(p.playerId) || (secretCards[p.playerId] && secretCards[p.playerId].clan === winnerClan),
  );

  return (
    <div className={styles.gameOverOverlay} onClick={onClose}>
      <div
        className={`${styles.gameOverCard} ${
          winnerClan === "ROSE"
            ? styles.gameOverRose
            : winnerClan === "FAN"
            ? styles.gameOverFan
            : styles.gameOverInquisitor
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.trophyGlowWrap}>
          <div className={styles.trophyIcon} style={{ background: `${clanColor}25`, borderColor: clanColor }}>
            <Trophy size={42} color={clanColor} />
          </div>
        </div>

        <h2 className={styles.gameOverTitle} style={{ color: clanColor }}>
          👑 {clanName.toUpperCase()} TOÀN THẮNG!
        </h2>

        {gameOverReason && <p className={styles.gameOverReason}>{gameOverReason}</p>}

        {winningTeamList.length > 0 && (
          <div className={styles.winningRosterWrap}>
            <span className={styles.winningRosterHeader}>CÁC THÀNH VIÊN CHIẾN THẮNG:</span>
            <div className={styles.winningRosterGrid}>
              {winningTeamList.map((player) => {
                const card = secretCards[player.playerId];
                return (
                  <div key={player.playerId} className={styles.winningMemberCard}>
                    <span className={styles.winningMemberCrown}>👑</span>
                    <span className={styles.winningMemberName}>{player.displayName}</span>
                    {card && (
                      <span className={styles.winningMemberRole}>
                        {card.roleInfo?.roleNameVi ?? `Cấp ${card.rank}`} (Cấp {card.rank})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.gameOverBtnGroup}>
          <button type="button" className={styles.btnReviewBoard} onClick={onClose}>
            <Eye size={16} /> Xem Lại Bàn Cờ
          </button>
          {isDemo && (
            <button type="button" className={styles.btnRestartGame} onClick={onRestart}>
              <RotateCcw size={16} /> Chơi Lại Ván Mới
            </button>
          )}
          <button type="button" className={styles.btnSecondary} onClick={onLeaveRoom}>
            <LogOut size={16} /> Về Phòng Chờ
          </button>
        </div>
      </div>
    </div>
  );
};
