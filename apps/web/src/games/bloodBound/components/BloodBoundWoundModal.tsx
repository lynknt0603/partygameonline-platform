import React from "react";
import type { BloodBoundCard, ClueTokenType } from "../model/bloodBoundTypes";
import styles from "../pages/BloodBoundPlayPage.module.css";

interface BloodBoundWoundModalProps {
  isOpen: boolean;
  myCard: BloodBoundCard | null;
  onSelectToken: (tokenType: ClueTokenType) => void;
}

export const BloodBoundWoundModal: React.FC<BloodBoundWoundModalProps> = ({
  isOpen,
  myCard,
  onSelectToken,
}) => {
  if (!isOpen || !myCard) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>🩸 Bạn Vừa Chịu Vết Thương!</div>
        <div className={styles.modalDesc}>
          Theo luật Blood Bound, bạn phải chọn để lộ <strong>1 Token Manh Mối</strong> cho toàn bàn cờ:
        </div>
        <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => onSelectToken("COLOR")}
          >
            🎨 Lộ Màu Gia Tộc ({myCard.clan === "ROSE" ? "Màu Đỏ 🌹" : myCard.clan === "FAN" ? "Màu Xanh 🪭" : "Màu Vàng ⚖️"})
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => onSelectToken("CREST")}
          >
            🛡️ Lộ Phù Hiệu ({myCard.clan}-CREST)
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => onSelectToken("RANK")}
          >
            🔢 Lộ Cấp Số Thật ({myCard.rank})
          </button>
        </div>
      </div>
    </div>
  );
};
