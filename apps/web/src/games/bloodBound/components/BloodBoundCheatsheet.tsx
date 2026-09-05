import React from "react";
import type { BloodBoundView } from "../model/bloodBoundTypes";
import styles from "../pages/BloodBoundPlayPage.module.css";

export interface AiLogItem {
  id: string;
  time: string;
  botName: string;
  action: string;
  reasoning: string;
}

interface BloodBoundCheatsheetProps {
  activeTab: "guide" | "game" | "ai";
  onTabChange: (tab: "guide" | "game" | "ai") => void;
  canDebug: boolean;
  aiLogs: AiLogItem[];
  publicLog: BloodBoundView["publicLog"];
}

export const BloodBoundCheatsheet: React.FC<BloodBoundCheatsheetProps> = ({
  activeTab,
  onTabChange,
  canDebug,
  aiLogs,
  publicLog,
}) => {
  return (
    <aside className={styles.logSidebar}>
      <div className={styles.logHeader}>
        <button
          type="button"
          className={`${styles.logTabBtn} ${activeTab === "guide" ? styles.logTabBtnActive : ""}`}
          onClick={() => onTabChange("guide")}
        >
          📖 Sổ Tay (0/4)
        </button>
        <button
          type="button"
          className={`${styles.logTabBtn} ${activeTab === "game" ? styles.logTabBtnActive : ""}`}
          onClick={() => onTabChange("game")}
        >
          📜 Sự Kiện
        </button>
        {canDebug && (
          <button
            type="button"
            className={`${styles.logTabBtn} ${activeTab === "ai" ? styles.logTabBtnActive : ""}`}
            onClick={() => onTabChange("ai")}
          >
            🧠 AI ({aiLogs.length})
          </button>
        )}
      </div>

      <div className={styles.logContentArea}>
        {activeTab === "guide" && (
          <div className={styles.guideContainer}>
            <div className={styles.guideSection}>
              <h5 className={styles.guideHeading}>🩸 Chỉ số Vết thương (0/4) là gì?</h5>
              <p className={styles.guideText}>
                Mỗi người chơi có thanh chịu đòn gồm <strong>4 vết thương</strong> (0/4):
              </p>
              <ul className={styles.guideList}>
                <li>Mỗi lần bị tấn công hoặc nhảy vào can thiệp đỡ đòn sẽ nhận <strong>+1 vết thương</strong>.</li>
                <li>Khi bị thương, người chơi <strong>bắt buộc phải lật 1 Token Manh mối</strong> (Màu phe hoặc Huy hiệu).</li>
                <li>Ai chịu <strong>vết thương thứ 4 (4/4)</strong> sẽ ngay lập tức bị <strong>BẮT GIỮ</strong> và ván đấu kết thúc!</li>
                <li style={{ color: "#fb7185" }}>
                  <strong>🎯 Quy tắc Thắng / Thua:</strong>
                  <br />• Bắt trúng <strong>Thủ Lĩnh (#1)</strong> đối phương 👉 Phe bạn <strong>Thắng</strong>!
                  <br />• Bắt nhầm người khác 👉 Phe đối phương <strong>Thắng</strong>!
                </li>
              </ul>
            </div>

            <div className={styles.guideSection}>
              <h5 className={styles.guideHeading}>🔍 Manh Mối & Phe Phái</h5>
              <div className={styles.guideClanGrid}>
                <div className={styles.guideClanCardRose}>
                  <div className={styles.guideClanHeader}>
                    <img src="/assets/games/blood-bound/clans/clan-rose.svg" alt="Rose" style={{ width: 20, height: 20 }} />
                    <strong>Gia Tộc Hoa Hồng (Rose)</strong>
                  </div>
                  <div>Tông chủ đạo: <strong>Màu Đỏ 🌹</strong></div>
                  <div>Manh mối: Token Đỏ, Huy hiệu Hoa Hồng hoàng gia</div>
                </div>

                <div className={styles.guideClanCardFan}>
                  <div className={styles.guideClanHeader}>
                    <img src="/assets/games/blood-bound/clans/clan-fan.svg" alt="Fan" style={{ width: 20, height: 20 }} />
                    <strong>Gia Tộc Quạt (Fan)</strong>
                  </div>
                  <div>Tông chủ đạo: <strong>Màu Xanh Lá 🪭</strong></div>
                  <div>Manh mối: Token Xanh, Huy hiệu Quạt ngọc bích</div>
                </div>

                <div className={styles.guideClanCardInq}>
                  <div className={styles.guideClanHeader}>
                    <img src="/assets/games/blood-bound/clans/clan-inquisitor.svg" alt="Inquisitor" style={{ width: 20, height: 20 }} />
                    <strong>Kẻ Phán Xét (Inquisitor)</strong>
                  </div>
                  <div>Tông chủ đạo: <strong>Màu Vàng ⚖️</strong> (Bàn lẻ 7 người)</div>
                  <div>Mục tiêu: Phải là người chịu vết thương thứ 4 để thắng solo!</div>
                </div>
              </div>
            </div>

            <div className={styles.guideSection}>
              <h5 className={styles.guideHeading}>🛡️ Can Thiệp Đỡ Đòn & Kỹ Năng</h5>
              <p className={styles.guideText}>
                Khi kẻ địch tấn công đồng minh, bạn có thể bấm <strong>"Nhảy vào đỡ đòn"</strong>:
              </p>
              <ul className={styles.guideList}>
                <li>Bạn nhận 1 vết thương thay cho đồng minh.</li>
                <li>Được <strong>lật Token Cấp Số</strong> của mình.</li>
                <li>Ngay lập tức kích hoạt <strong>Kỹ Năng Vai Trò</strong> (Sát thủ chém mục tiêu, Giả kim hồi máu, Hộ vệ ban khiên...).</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "ai" && canDebug && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {aiLogs.length === 0 ? (
              <p style={{ color: "#64748b", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
                Chưa có hành động AI. Các lượt suy luận và tấn công của Bot sẽ hiển thị tại đây theo thời gian thực.
              </p>
            ) : (
              aiLogs.map((item) => (
                <div key={item.id} className={styles.aiLogCard}>
                  <div className={styles.aiLogTop}>
                    <span className={styles.aiLogBotName}>{item.botName}</span>
                    <span>{item.time}</span>
                  </div>
                  <div className={styles.aiLogAction}>{item.action}</div>
                  <div className={styles.aiLogReason}>{item.reasoning}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "game" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {publicLog.length === 0 ? (
              <p style={{ color: "#64748b", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
                Chưa có sự kiện nào trong trận đấu.
              </p>
            ) : (
              publicLog.slice(-30).map((log, idx) => (
                <div key={idx} className={styles.logEntry}>
                  {log.textVi || log.text}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
