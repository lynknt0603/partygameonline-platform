import React from "react";
import { Swords, Shield } from "lucide-react";
import type { BloodBoundPhase } from "../model/bloodBoundTypes";
import styles from "../pages/BloodBoundPlayPage.module.css";

interface BloodBoundActionPanelProps {
  phase: BloodBoundPhase;
  isMyTurn: boolean;
  canIIntervene: boolean;
  attackerName?: string;
  targetName?: string;
  onStartPlay: () => void;
  onIntervene: () => void;
  onPassIntervene: () => void;
}

export const BloodBoundActionPanel: React.FC<BloodBoundActionPanelProps> = ({
  phase,
  isMyTurn,
  canIIntervene,
  attackerName,
  targetName,
  onStartPlay,
  onIntervene,
  onPassIntervene,
}) => {
  if (phase === "LOOK_LEFT") {
    return (
      <div className={styles.actionBanner}>
        <div>
          <strong>Giai đoạn chuẩn bị:</strong> Hãy bí mật kiểm tra manh mối của người ngồi bên trái bạn ở góc dưới màn hình.
        </div>
        <button type="button" className={styles.btnPrimary} onClick={onStartPlay}>
          <Swords size={16} /> Sẵn Sàng Bắt Đầu Ván Đấu
        </button>
      </div>
    );
  }

  if (phase === "INTERVENTION_WINDOW") {
    return (
      <div className={styles.actionBannerIntervene}>
        <div>
          <strong>⚔️ CỬA SỔ CAN THIỆP:</strong> {attackerName ?? "Kẻ tấn công"} đang giương kiếm về phía {targetName ?? "Mục tiêu"}!
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {canIIntervene ? (
            <>
              <button type="button" className={styles.btnIntervene} onClick={onIntervene}>
                <Shield size={16} /> Nhảy Vào Đỡ Đòn!
              </button>
              <button type="button" className={styles.btnSecondary} onClick={onPassIntervene}>
                Bỏ Qua
              </button>
            </>
          ) : (
            <span style={{ fontSize: "0.85rem", color: "#fde68a" }}>
              Đang đợi người chơi khác phản hồi can thiệp...
            </span>
          )}
        </div>
      </div>
    );
  }

  if (phase === "ATTACK_CHOICE" && isMyTurn) {
    return (
      <div className={styles.actionBanner}>
        <div>
          <strong>🗡️ LƯỢT CỦA BẠN:</strong> Bạn đang nắm giữ Đoản Kiếm. Hãy click trực tiếp vào một người chơi trên bàn cờ để ra đòn tấn công!
        </div>
      </div>
    );
  }

  return null;
};
