import React from "react";
import { Shield, Swords, Eye, Clock, AlertTriangle } from "lucide-react";
import type { BloodBoundPhase } from "../model/bloodBoundTypes";
import styles from "../pages/BloodBoundPlayPage.module.css";

interface BloodBoundCenterHubProps {
  phase: BloodBoundPhase;
  isMyTurn: boolean;
  canIIntervene: boolean;
  attackerName?: string;
  targetName?: string;
  victimName?: string;
  isVictimMe?: boolean;
  daggerHolderName?: string;
  interventionCountdown?: number | null; // in seconds (e.g. 4.5 down to 0)
  totalCountdown?: number;
  onStartPlay: () => void;
  onIntervene: () => void;
  onPassIntervene: () => void;
}

export const BloodBoundCenterHub: React.FC<BloodBoundCenterHubProps> = ({
  phase,
  isMyTurn,
  canIIntervene,
  attackerName,
  targetName,
  victimName,
  isVictimMe,
  daggerHolderName,
  interventionCountdown,
  totalCountdown = 4.5,
  onStartPlay,
  onIntervene,
  onPassIntervene,
}) => {
  // 1. Giai đoạn Can Thiệp Đỡ Đòn (INTERVENTION_WINDOW) - Ưu tiên hàng đầu cho trực quan
  if (phase === "INTERVENTION_WINDOW") {
    const progressPct = interventionCountdown != null
      ? Math.max(0, Math.min(100, (interventionCountdown / totalCountdown) * 100))
      : 100;

    return (
      <div className={styles.centerHub}>
        <div className={styles.centerHubBadgeWarning}>
          <AlertTriangle size={14} /> CỬA SỔ CAN THIỆP
        </div>

        <div className={styles.centerHubClashRow}>
          <span className={styles.centerHubAttacker}>{attackerName ?? "Kẻ tấn công"}</span>
          <Swords size={20} className={styles.centerHubClashIcon} />
          <span className={styles.centerHubTarget}>{targetName ?? "Mục tiêu"}</span>
        </div>

        {canIIntervene ? (
          <div className={styles.centerHubActionCol}>
            <button
              type="button"
              className={styles.btnCenterIntervene}
              onClick={onIntervene}
              title="Nhảy vào chịu đòn thay cho đồng đội!"
            >
              <Shield size={20} className={styles.shieldPulseIcon} />
              <span>NHẢY VÀO ĐỠ ĐÒN!</span>
            </button>

            <button
              type="button"
              className={styles.btnCenterPass}
              onClick={onPassIntervene}
            >
              Bỏ Qua Can Thiệp
            </button>

            {interventionCountdown != null && (
              <div className={styles.centerHubTimerWrap}>
                <div className={styles.centerHubTimerRow}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} /> Thời gian suy nghĩ:
                  </span>
                  <span className={styles.timerNum}>{interventionCountdown.toFixed(1)}s</span>
                </div>
                <div className={styles.centerHubTimerTrack}>
                  <div
                    className={styles.centerHubTimerBar}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.centerHubWaiting}>
            <span className={styles.spinnerPulse} />
            <span style={{ fontSize: "0.82rem", color: "#fde68a", textAlign: "center" }}>
              Đang đợi người chơi khác phản hồi can thiệp...
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. Giai đoạn Lựa chọn Tấn công (ATTACK_CHOICE)
  if (phase === "ATTACK_CHOICE") {
    if (isMyTurn) {
      return (
        <div className={`${styles.centerHub} ${styles.centerHubMyTurn}`}>
          <div className={styles.centerHubBadgeGold}>
            <Swords size={15} /> LƯỢT TẤN CÔNG CỦA BẠN!
          </div>
          <p className={styles.centerHubPrompt}>
            👉 Nhấp trực tiếp vào <strong>1 người chơi</strong> trên bàn để phóng kiếm tấn công!
          </p>
        </div>
      );
    }

    return (
      <div className={styles.centerHub}>
        <div className={styles.centerHubBadgeNeutral}>
          <Swords size={13} /> LƯỢT TẤN CÔNG
        </div>
        <p className={styles.centerHubPromptMuted}>
          <strong>{daggerHolderName ?? "Đối thủ"}</strong> đang nhắm mục tiêu tấn công...
        </p>
      </div>
    );
  }

  // 3. Giai đoạn Chuẩn bị / Xem manh mối (LOOK_LEFT)
  if (phase === "LOOK_LEFT") {
    return (
      <div className={styles.centerHub}>
        <div className={styles.centerHubBadgeInfo}>
          <Eye size={14} /> GIAI ĐOẠN CHUẨN BỊ
        </div>
        <p className={styles.centerHubPromptSmall}>
          Hãy bí mật xem manh mối của người ngồi bên trái bạn ở thẻ đáy màn hình.
        </p>
        <button type="button" className={styles.btnCenterReady} onClick={onStartPlay}>
          <Swords size={16} /> Sẵn Sàng Bắt Đầu Trận Đấu
        </button>
      </div>
    );
  }

  // 4. Giai đoạn Nhận vết thương (WOUND_ASSIGNMENT)
  if (phase === "WOUND_ASSIGNMENT") {
    return (
      <div className={styles.centerHub}>
        <div className={styles.centerHubBadgeRed}>
          🩸 NHẬN VẾT THƯƠNG
        </div>
        <p className={styles.centerHubPrompt}>
          {isVictimMe
            ? "Bạn bị trúng đòn! Hãy chọn 1 token manh mối để lật ở cửa sổ bên dưới."
            : `${victimName ?? "Nạn nhân"} đang chọn token manh mối để lộ...`}
        </p>
      </div>
    );
  }

  // Default Compass Hub (cho các trạng thái tĩnh)
  return (
    <div className={styles.centerHubDefault}>
      <div className={styles.centerHubCompass}>
        <span className={styles.compassLeft}>⟲ BÊN TRÁI</span>
        <span className={styles.compassSub}>LOOK LEFT</span>
        <span className={styles.compassOpposite}>↕ ĐỐI DIỆN</span>
      </div>
    </div>
  );
};
