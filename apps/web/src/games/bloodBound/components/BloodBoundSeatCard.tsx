import React from "react";
import type { BloodBoundCard, BloodBoundPlayerPublic, BloodClan } from "../model/bloodBoundTypes";
import { BloodBoundSpeechBubble, type SpeechBubbleData } from "./BloodBoundSpeechBubble";
import styles from "../pages/BloodBoundPlayPage.module.css";

function getRolePortraitUrl(rank?: number | null, clan?: BloodClan | string | null): string {
  const normClan = clan?.toUpperCase();
  if (normClan === "ROSE") {
    switch (rank) {
      case 1: return "/assets/games/blood-bound/roles/rose/role-1.svg";
      case 2: return "/assets/games/blood-bound/roles/rose/role-2.svg";
      case 3: return "/assets/games/blood-bound/roles/rose/role-3.svg";
      case 4: return "/assets/games/blood-bound/roles/rose/role-4.svg";
      case 5: return "/assets/games/blood-bound/roles/rose/role-5.svg";
      case 6: return "/assets/games/blood-bound/roles/rose/role-6.svg";
      case 7: return "/assets/games/blood-bound/roles/rose/role-7.svg";
      case 8: return "/assets/games/blood-bound/roles/rose/role-8.svg";
      default: return "/assets/games/blood-bound/roles/mystery/role-mystery-rose.svg";
    }
  } else if (normClan === "FAN") {
    switch (rank) {
      case 1: return "/assets/games/blood-bound/roles/fan/role-1.svg";
      case 2: return "/assets/games/blood-bound/roles/fan/role-2.svg";
      case 3: return "/assets/games/blood-bound/roles/fan/role-3.svg";
      case 4: return "/assets/games/blood-bound/roles/fan/role-4.svg";
      case 5: return "/assets/games/blood-bound/roles/fan/role-5.svg";
      case 6: return "/assets/games/blood-bound/roles/fan/role-6.svg";
      case 7: return "/assets/games/blood-bound/roles/fan/role-7.svg";
      case 8: return "/assets/games/blood-bound/roles/fan/role-8.svg";
      default: return "/assets/games/blood-bound/roles/mystery/role-mystery-fan.svg";
    }
  } else if (normClan === "INQUISITOR" || rank === 8) {
    return "/assets/games/blood-bound/roles/inquisitor/role-8.svg";
  }

  switch (rank) {
    case 1: return "/assets/games/blood-bound/roles/rose/role-1.svg";
    case 2: return "/assets/games/blood-bound/roles/rose/role-2.svg";
    case 3: return "/assets/games/blood-bound/roles/rose/role-3.svg";
    case 4: return "/assets/games/blood-bound/roles/rose/role-4.svg";
    case 5: return "/assets/games/blood-bound/roles/rose/role-5.svg";
    case 6: return "/assets/games/blood-bound/roles/rose/role-6.svg";
    case 7: return "/assets/games/blood-bound/roles/rose/role-7.svg";
    case 8: return "/assets/games/blood-bound/roles/rose/role-8.svg";
    default: return "/assets/games/blood-bound/roles/role-mystery.svg";
  }
}

interface BloodBoundSeatCardProps {
  player: BloodBoundPlayerPublic;
  index: number;
  totalSeats: number;
  isYou: boolean;
  isLeftNeighbor: boolean;
  isOpposite: boolean;
  isDaggerHolder: boolean;
  isTarget: boolean;
  isIntervener: boolean;
  secret?: BloodBoundCard | null;
  pos: { left: string; top: string };
  isMyTurn: boolean;
  canDebug: boolean;
  debugMode: boolean;
  isGameOver: boolean;
  speechBubble?: SpeechBubbleData | null;
  onSelectTarget: (playerId: string) => void;
}

export function deduceClanFromTokens(tokens: { type: string; value?: string | number }[]): BloodClan | null {
  const crestToken = tokens.find((t) => t.type === "CREST");
  if (crestToken) {
    const val = String(crestToken.value);
    if (val.includes("INQUISITOR")) return "INQUISITOR";
    if (val.includes("ROSE")) return "ROSE";
    return "FAN";
  }
  const colorToken = tokens.find((t) => t.type === "COLOR");
  if (colorToken?.value === "YELLOW") return "INQUISITOR";
  if (colorToken?.value === "RED") return "ROSE";
  if (colorToken?.value === "GREEN") return "FAN";
  return null;
}

export const BloodBoundSeatCard: React.FC<BloodBoundSeatCardProps> = ({
  player,
  totalSeats,
  secret,
  pos,
  isYou,
  isMyTurn,
  isDaggerHolder,
  isTarget,
  isIntervener,
  isLeftNeighbor,
  isOpposite,
  canDebug,
  debugMode,
  isGameOver,
  speechBubble,
  onSelectTarget,
}) => {
  const rankToken = player.revealedTokens.find((t) => t.type === "RANK");
  const tokenRank = rankToken?.value ? Number(rankToken.value) : null;

  const isRevealedToUser = isYou || (canDebug && debugMode) || (isGameOver && Boolean(secret));
  const trueClan = secret?.clan;
  const trueRank = secret?.rank;

  const deducedClan = deduceClanFromTokens(player.revealedTokens);

  const displayClan = isRevealedToUser ? (trueClan ?? deducedClan) : deducedClan;
  const hasRankRevealed = Boolean(rankToken);
  const displayRank = isRevealedToUser ? (trueRank ?? tokenRank) : hasRankRevealed ? (tokenRank ?? trueRank) : null;
  const portraitUrl = getRolePortraitUrl(displayRank, displayClan);
  const scale = totalSeats <= 8 ? 1 : totalSeats <= 10 ? 0.88 : totalSeats <= 12 ? 0.78 : 0.68;

  return (
    <div
      className={`${styles.seatCardRound} ${isDaggerHolder ? styles.isDagger : ""} ${
        isTarget || isIntervener ? styles.isTarget : ""
      } ${isYou ? styles.isYou : ""} ${isLeftNeighbor ? styles.isLeftNeighbor : ""} ${
        isOpposite ? styles.isOpposite : ""
      }`}
      style={{
        left: pos.left,
        top: pos.top,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center center",
        cursor: isMyTurn && !isYou ? "pointer" : "default",
      }}
      onClick={() => onSelectTarget(player.playerId)}
      title={
        isYou
          ? "Vị trí của bạn (Đáy bàn)"
          : isLeftNeighbor
          ? "Người ngồi bên trái bạn (Mục tiêu xem manh mối đầu trận)"
          : isOpposite
          ? "Người ngồi trực diện đối diện bạn qua tâm bàn"
          : ""
      }
    >
      <BloodBoundSpeechBubble data={speechBubble} />

      <div className={styles.seatAvatarRow}>
        <div
          className={`${styles.seatAvatarFrame} ${
            displayClan === "ROSE"
              ? styles.frameRose
              : displayClan === "FAN"
              ? styles.frameFan
              : displayClan === "INQUISITOR"
              ? styles.frameInquisitor
              : styles.frameMystery
          }`}
        >
          <img src={portraitUrl} alt="Portrait" className={styles.seatAvatarImg} />
        </div>

        <div className={styles.seatAvatarInfo}>
          <span className={styles.seatName}>{player.displayName}</span>
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", marginTop: "2px" }}>
            {isYou && <span className={`${styles.seatRelationBadge} ${styles.badgeYou}`}>BẠN</span>}
            {isLeftNeighbor && (
              <span className={`${styles.seatRelationBadge} ${styles.badgeLeft}`}>
                BÊN TRÁI ⟲
              </span>
            )}
            {isOpposite && (
              <span className={`${styles.seatRelationBadge} ${styles.badgeOpposite}`}>
                ĐỐI DIỆN ⚔️
              </span>
            )}
          </div>
        </div>

        <div className={styles.seatDaggerShield}>
          {isDaggerHolder && (
            <img
              src="/assets/games/blood-bound/tokens/token-dagger.svg"
              alt="Đoản Kiếm"
              style={{ width: 22, height: 22 }}
              title="Đang cầm Đoản Kiếm — Lượt tấn công!"
            />
          )}
          {player.isShielded && (
            <img
              src="/assets/games/blood-bound/tokens/token-shield.svg"
              alt="Khiên"
              style={{ width: 22, height: 22 }}
              title="Được Khiên Hộ Vệ bảo vệ"
            />
          )}
        </div>
      </div>

      {canDebug && debugMode && secret && (
        <div
          className={`${styles.debugIdentity} ${
            secret.clan === "ROSE"
              ? styles.debugIdentityRose
              : secret.clan === "FAN"
              ? styles.debugIdentityFan
              : styles.debugIdentityInquisitor
          }`}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <img
              src={
                secret.clan === "ROSE"
                  ? "/assets/games/blood-bound/clans/clan-rose.svg"
                  : secret.clan === "FAN"
                  ? "/assets/games/blood-bound/clans/clan-fan.svg"
                  : "/assets/games/blood-bound/clans/clan-inquisitor.svg"
              }
              alt={secret.clan}
              style={{ width: 18, height: 18 }}
            />
            {secret.roleInfo?.roleNameVi ?? `Cấp ${secret.rank}`}
          </span>
          <span>Rank {secret.rank}</span>
        </div>
      )}

      {/* Wounds Section (0/4) */}
      <div className={styles.woundSection}>
        <div className={styles.woundHeaderRow}>
          <span className={styles.woundTitle}>🩸 Vết thương:</span>
          <span
            className={`${styles.woundStatusBadge} ${
              player.wounds >= 4
                ? styles.statusCaptured
                : player.wounds === 3
                ? styles.statusCritical
                : styles.statusNormal
            }`}
          >
            {player.wounds >= 4
              ? "BỊ BẮT 💀"
              : player.wounds === 3
              ? "NGUY KỊCH ⚠️"
              : "BÌNH THƯỜNG"}
          </span>
        </div>

        <div className={styles.woundBar}>
          {[0, 1, 2, 3].map((slotIdx) => (
            <div
              key={slotIdx}
              className={`${styles.woundPip} ${
                slotIdx < player.wounds
                  ? slotIdx === 3
                    ? styles.pipCaptured
                    : styles.pipActive
                  : ""
              }`}
            />
          ))}
        </div>
      </div>

      {/* Clue Tokens */}
      <div className={styles.tokenArea}>
        <div className={styles.tokenAreaHeader}>
          <span>MANH MỐI LỘ:</span>
          <span>{player.revealedTokens.length}</span>
        </div>
        <div className={styles.tokenRow}>
          {player.revealedTokens.length === 0 ? (
            <span className={styles.tokenEmpty}>Chưa có</span>
          ) : (
            player.revealedTokens.map((token, tIdx) => (
              <span
                key={tIdx}
                className={`${styles.clueTokenChip} ${
                  token.type === "COLOR"
                    ? token.value === "RED"
                      ? styles.chipRose
                      : styles.chipFan
                    : token.type === "RANK"
                    ? styles.chipRank
                    : token.type === "CREST"
                    ? styles.chipCrest
                    : styles.chipMystery
                }`}
              >
                {token.type === "COLOR"
                  ? token.value === "RED"
                    ? "🔴 Đỏ"
                    : "🟢 Xanh"
                  : token.type === "RANK"
                  ? `№ ${token.value}`
                  : token.type === "CREST"
                  ? "🛡️ Phù hiệu"
                  : "❓ Ảo ảnh"}
              </span>
            ))
          )}
        </div>
      </div>

      {isMyTurn && !isYou && player.wounds < 4 && (
        <button
          type="button"
          className={styles.targetActionBtn}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTarget(player.playerId);
          }}
        >
          ⚔️ Tấn Công
        </button>
      )}
    </div>
  );
};
