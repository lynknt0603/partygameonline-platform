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

interface RoleSkillGuide {
  rank: number;
  rankDisplay: string;
  nameVi: string;
  nameEn: string;
  category: "ALL" | "ATTACK" | "SUPPORT" | "SPECIAL";
  categoryLabel: string;
  badgeBg: string;
  tagColor: string;
  tagBg: string;
  effect: string;
  trigger: string;
  tip: string;
}

const ROLE_SKILL_GUIDES: RoleSkillGuide[] = [
  {
    rank: 1,
    rankDisplay: "#1",
    nameVi: "Thủ Lĩnh",
    nameEn: "Leader",
    category: "SPECIAL",
    categoryLabel: "👑 Bị Động Tối Cao",
    badgeBg: "linear-gradient(135deg, #f59e0b, #b45309)",
    tagColor: "#fde68a",
    tagBg: "rgba(245, 158, 11, 0.2)",
    effect: "Không có kỹ năng chủ động khi lật số cấp. Là yếu nhân sống còn của toàn gia tộc!",
    trigger: "Bị Động: Nếu bị bắt giữ (chịu đủ 4 vết thương), gia tộc bạn THUA NGAY. Nếu đối phương bắt nhầm bất kỳ ai khác, gia tộc bạn THẮNG!",
    tip: "💡 Chiến thuật: Tuyệt đối không lật số 1 trừ khi bất khả kháng. Luôn để lộ Token Màu hoặc Phù hiệu trước. Đồng minh phải ưu tiên nhảy vào đỡ đòn thay Thủ Lĩnh.",
  },
  {
    rank: 2,
    rankDisplay: "#2",
    nameVi: "Sát Thủ",
    nameEn: "Assassin",
    category: "ATTACK",
    categoryLabel: "🗡️ Tấn Công Trực Tiếp",
    badgeBg: "linear-gradient(135deg, #ef4444, #991b1b)",
    tagColor: "#fca5a5",
    tagBg: "rgba(239, 68, 68, 0.2)",
    effect: "Gây ngay 1 vết thương trực tiếp lên bất kỳ người chơi nào khác trên bàn cờ. Đòn này không thể bị can thiệp!",
    trigger: "Kích hoạt tức thì khi lật Token Cấp Số 2 (bằng cách bấm 'Nhảy vào đỡ đòn' hoặc khi bị thương chọn lật Số).",
    tip: "💡 Chiến thuật: Nhảy vào đỡ đòn khi có một mục tiêu đối phương đã chịu 3 vết thương để chém kết liễu và bắt giữ ngay lập tức!",
  },
  {
    rank: 3,
    rankDisplay: "#3",
    nameVi: "Tắc Kè Hoa",
    nameEn: "Harlequin",
    category: "SPECIAL",
    categoryLabel: "🎭 Tung Hỏa Mù",
    badgeBg: "linear-gradient(135deg, #10b981, #7c3aed)",
    tagColor: "#c4b5fd",
    tagBg: "rgba(124, 58, 237, 0.2)",
    effect: "Có quyền để lộ Token Manh mối của cả 2 phe (vừa Đỏ vừa Xanh) để đánh lừa đối phương.",
    trigger: "Kích hoạt khi nhận vết thương và chọn lật manh mối màu gia tộc.",
    tip: "💡 Chiến thuật: Nếu thuộc phe Hoa Hồng, hãy cố tình lật màu Xanh để đối phương ngộ nhận bạn là phe Quạt, làm lá chắn che chở an toàn cho Thủ Lĩnh thật.",
  },
  {
    rank: 4,
    rankDisplay: "#4",
    nameVi: "Nhà Giả Kim",
    nameEn: "Alchemist",
    category: "SUPPORT",
    categoryLabel: "🧪 Hồi Phục Sinh Mệnh",
    badgeBg: "linear-gradient(135deg, #0d9488, #047857)",
    tagColor: "#6ee7b7",
    tagBg: "rgba(16, 185, 129, 0.2)",
    effect: "Hồi phục 1 vết thương cho bản thân hoặc cho 1 người chơi khác (giảm 1 vết thương, nhưng giữ nguyên các manh mối đã lộ).",
    trigger: "Kích hoạt khi lật Token Cấp Số 4 (đỡ đòn hoặc chọn lật số khi bị thương).",
    tip: "💡 Chiến thuật: Cứu viện khẩn cấp cho Thủ Lĩnh hoặc đồng minh nòng cốt khi đã chạm mốc 3/4 vết thương nguy kịch.",
  },
  {
    rank: 5,
    rankDisplay: "#5",
    nameVi: "Thần Trí",
    nameEn: "Mentalist",
    category: "SPECIAL",
    categoryLabel: "👁️ Ép Lộ Manh Mối",
    badgeBg: "linear-gradient(135deg, #6366f1, #0284c7)",
    tagColor: "#93c5fd",
    tagBg: "rgba(59, 130, 246, 0.2)",
    effect: "Chỉ định 1 người chơi bất kỳ. Người này bắt buộc phải tự rút và lật ngửa 1 Token Manh mối (màu phe hoặc phù hiệu).",
    trigger: "Kích hoạt khi lật Token Cấp Số 5.",
    tip: "💡 Chiến thuật: Ép một đối tượng ẩn danh chưa có vết thương nào phải để lộ thông tin để toàn đội tập trung truy tìm Thủ Lĩnh.",
  },
  {
    rank: 6,
    rankDisplay: "#6",
    nameVi: "Hộ Vệ",
    nameEn: "Guardian",
    category: "SUPPORT",
    categoryLabel: "🛡️ Ban Khiên Hộ Mệnh",
    badgeBg: "linear-gradient(135deg, #2563eb, #1e40af)",
    tagColor: "#bfdbfe",
    tagBg: "rgba(37, 99, 235, 0.2)",
    effect: "Ban 1 Khiên chắn hộ mệnh cho bản thân hoặc 1 đồng minh. Người có khiên sẽ hoàn toàn miễn nhiễm sát thương ở đòn đánh kế tiếp!",
    trigger: "Kích hoạt khi lật Token Cấp Số 6.",
    tip: "💡 Chiến thuật: Bọc lót khiên cho Thủ Lĩnh đã bị lộ diện để vô hiệu hóa hoàn toàn ý đồ kết liễu của phe địch.",
  },
  {
    rank: 7,
    rankDisplay: "#7",
    nameVi: "Cuồng Nộ",
    nameEn: "Berserker",
    category: "ATTACK",
    categoryLabel: "⚡ Phản Đòn Chí Mạng",
    badgeBg: "linear-gradient(135deg, #ea580c, #9a3412)",
    tagColor: "#fdba74",
    tagBg: "rgba(234, 88, 12, 0.2)",
    effect: "Phản lại ngay 1 vết thương trừng phạt lên chính kẻ vừa vung kiếm tấn công mình.",
    trigger: "Kích hoạt khi chịu đòn hoặc nhảy vào đỡ đòn và lật Token Cấp Số 7.",
    tip: "💡 Chiến thuật: Khiến kẻ địch có ý đồ chém bạn phải trả giá cực đắt, đặc biệt nếu kẻ tấn công cũng đang ở 3/4 vết thương.",
  },
  {
    rank: 8,
    rankDisplay: "#8",
    nameVi: "Mê Hoặc",
    nameEn: "Courtesan",
    category: "SPECIAL",
    categoryLabel: "💋 Thao Túng Kiếm Lệnh",
    badgeBg: "linear-gradient(135deg, #db2777, #831843)",
    tagColor: "#f472b6",
    tagBg: "rgba(219, 39, 119, 0.2)",
    effect: "Ép người cầm kiếm tiếp theo bắt buộc phải tấn công vào mục tiêu do Mê Hoặc chỉ định.",
    trigger: "Kích hoạt khi lật Token Cấp Số 8.",
    tip: "💡 Chiến thuật: Bẻ lái mũi kiếm của đối phương chém vào chính đồng minh của họ, hoặc ép người cầm kiếm dứt điểm đúng Thủ Lĩnh đối phương.",
  },
  {
    rank: 9,
    rankDisplay: "⚖️",
    nameVi: "Kẻ Phán Xét",
    nameEn: "Inquisitor",
    category: "SPECIAL",
    categoryLabel: "⚖️ Phe Độc Lập (Bàn 7P)",
    badgeBg: "linear-gradient(135deg, #eab308, #ca8a04)",
    tagColor: "#fef08a",
    tagBg: "rgba(234, 179, 8, 0.2)",
    effect: "Không thuộc Rose hay Fan. Mục tiêu duy nhất: Thao túng trận đấu sao cho bản thân là người bị bắt giữ (chịu đủ 4 vết thương) để THẮNG SOLO!",
    trigger: "Áp dụng trong các ván chơi 7 người (hoặc chế độ có Inquisitor).",
    tip: "💡 Chiến thuật: Khiêu khích đối phương tấn công mình hoặc chủ động nhảy vào đỡ đòn để nhanh chóng nhận đủ 4 vết thương trước khi một Thủ Lĩnh bị bắt!",
  },
];

export const BloodBoundCheatsheet: React.FC<BloodBoundCheatsheetProps> = ({
  activeTab,
  onTabChange,
  canDebug,
  aiLogs,
  publicLog,
}) => {
  const [skillFilter, setSkillFilter] = React.useState<"ALL" | "ATTACK" | "SUPPORT" | "SPECIAL">("ALL");

  const filteredSkills = React.useMemo(() => {
    if (skillFilter === "ALL") return ROLE_SKILL_GUIDES;
    return ROLE_SKILL_GUIDES.filter((r) => r.category === skillFilter);
  }, [skillFilter]);

  const logEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (activeTab === "game") {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, publicLog.length]);

  return (
    <aside className={styles.logSidebar}>
      <div className={styles.logHeader}>
        <button
          type="button"
          className={`${styles.logTabBtn} ${activeTab === "guide" ? styles.logTabBtnActive : ""}`}
          onClick={() => onTabChange("guide")}
        >
          📖 Sổ Tay & Kỹ Năng
        </button>
        <button
          type="button"
          className={`${styles.logTabBtn} ${activeTab === "game" ? styles.logTabBtnActive : ""}`}
          onClick={() => onTabChange("game")}
        >
          📜 Sự Kiện ({publicLog.length})
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
                  <div>Manh mối: Token Đỏ, Phù hiệu Hoa Hồng hoàng gia</div>
                </div>

                <div className={styles.guideClanCardFan}>
                  <div className={styles.guideClanHeader}>
                    <img src="/assets/games/blood-bound/clans/clan-fan.svg" alt="Fan" style={{ width: 20, height: 20 }} />
                    <strong>Gia Tộc Quạt (Fan)</strong>
                  </div>
                  <div>Tông chủ đạo: <strong>Màu Xanh Lá 🪭</strong></div>
                  <div>Manh mối: Token Xanh, Phù hiệu Quạt ngọc bích</div>
                </div>

                <div className={styles.guideClanCardInq}>
                  <div className={styles.guideClanHeader}>
                    <img src="/assets/games/blood-bound/clans/clan-inquisitor.svg" alt="Inquisitor" style={{ width: 20, height: 20 }} />
                    <strong>Kẻ Phán Xét (Inquisitor)</strong>
                  </div>
                  <div>Tông chủ đạo: <strong>Màu Vàng ⚖️</strong> (Bàn có số người lẻ)</div>
                  <div>Mục tiêu: Phải là người chịu vết thương thứ 4 để thắng solo!</div>
                </div>
              </div>
            </div>

            <div className={styles.guideSection}>
              <h5 className={styles.guideHeading}>🛡️ Phù Hiệu (Crest) Là Gì & Cơ Chế Thật / Giả?</h5>
              <p className={styles.guideText}>
                Khi bị tấn công nhận vết thương, bạn được quyền lựa chọn lật một trong ba loại manh mối sau đây:
              </p>

              <table className={styles.crestCompareTable}>
                <thead>
                  <tr>
                    <th>Loại Manh Mối</th>
                    <th>Ý Nghĩa & Nhận Diện</th>
                    <th>Độ Tin Cậy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>🔴 Token Màu</strong><br /><small>(Color Token)</small></td>
                    <td>Chỉ để lộ màu sắc gia tộc: Đỏ (Rose), Xanh (Fan) hoặc Vàng (Inquisitor).</td>
                    <td>
                      <span className={styles.crestTagBluff}>CÓ THỂ GIẢ MẠO</span>
                      <br />
                      <small style={{ color: "#94a3b8" }}>Tắc Kè Hoa (#3 Harlequin) có thể nói dối lật màu của phe đối địch!</small>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>🛡️ Phù Hiệu</strong><br /><small>(Clan Crest)</small></td>
                    <td>
                      Biểu tượng gia huy tối cao: 🌹 Hoa Hồng, 🪭 Cánh Quạt, ⚖️ Cán Cân.
                    </td>
                    <td>
                      <span className={styles.crestTagTrue}>100% SỰ THẬT</span>
                      <br />
                      <small style={{ color: "#94a3b8" }}>Luật cấm Tắc Kè Hoa giả mạo Phù hiệu. Lật Phù hiệu là bằng chứng xác tín dòng máu!</small>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>🔢 Cấp Số</strong><br /><small>(Rank Token)</small></td>
                    <td>Để lộ chính xác cấp bậc từ 1 đến 8, đồng thời lập tức kích hoạt Kỹ năng vai trò.</td>
                    <td>
                      <span className={styles.crestTagTrue}>100% SỰ THẬT</span>
                      <br />
                      <small style={{ color: "#fca5a5" }}>⚠️ Nguy hiểm nếu #1 Thủ Lĩnh để lộ số.</small>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className={styles.crestTipBox}>
                <strong>💡 Chiến thuật lật Phù Hiệu:</strong>
                <br />• <strong>Khẳng định đồng minh</strong>: Khi bạn muốn đồng đội nhận ra mình 100% mà không còn nghi ngờ bạn là Tắc Kè Hoa đóng giả, hãy lật Phù hiệu để đồng đội an tâm can thiệp đỡ đòn hoặc cấp khiên bảo vệ.
                <br />• <strong>Cảnh giác Inquisitor</strong>: Nếu một người lật <strong>Phù hiệu Cán Cân (Inquisitor)</strong>, cả hai phe Rose và Fan phải lập tức ngừng tấn công người này, vì mục tiêu của hắn là muốn bị bắt giữ để thắng solo một mình!
              </div>
            </div>

            <div className={styles.guideSection}>
              <h5 className={styles.guideHeading}>🛡️ Can Thiệp Đỡ Đòn & Kích Hoạt Kỹ Năng</h5>
              <p className={styles.guideText}>
                Khi kẻ địch tấn công đồng minh, bạn có thể bấm <strong>"Nhảy vào đỡ đòn"</strong>:
              </p>
              <ul className={styles.guideList}>
                <li>Bạn nhận 1 vết thương thay cho đồng minh được bảo vệ.</li>
                <li>Được <strong>lật Token Cấp Số Thật</strong> của mình.</li>
                <li>Ngay lập tức kích hoạt <strong>Kỹ Năng Vai Trò</strong> đặc trưng bên dưới (tối đa 1 lần/ván).</li>
              </ul>
            </div>

            <div className={styles.guideSection}>
              <h5 className={styles.guideHeading}>🎭 Chi Tiết Kỹ Năng 8 Vai Trò</h5>
              <p className={styles.guideText}>
                Mỗi vai trò sở hữu năng lực đặc biệt khi lật số cấp (chủ động qua Đỡ Đòn hoặc khi bị thương):
              </p>

              <div className={styles.roleFilterBar}>
                <button
                  type="button"
                  className={`${styles.roleFilterBtn} ${skillFilter === "ALL" ? styles.roleFilterBtnActive : ""}`}
                  onClick={() => setSkillFilter("ALL")}
                >
                  Tất cả ({ROLE_SKILL_GUIDES.length})
                </button>
                <button
                  type="button"
                  className={`${styles.roleFilterBtn} ${skillFilter === "ATTACK" ? styles.roleFilterBtnActive : ""}`}
                  onClick={() => setSkillFilter("ATTACK")}
                >
                  ⚔️ Tấn Công ({ROLE_SKILL_GUIDES.filter((r) => r.category === "ATTACK").length})
                </button>
                <button
                  type="button"
                  className={`${styles.roleFilterBtn} ${skillFilter === "SUPPORT" ? styles.roleFilterBtnActive : ""}`}
                  onClick={() => setSkillFilter("SUPPORT")}
                >
                  🛡️ Hỗ Trợ/Thủ ({ROLE_SKILL_GUIDES.filter((r) => r.category === "SUPPORT").length})
                </button>
                <button
                  type="button"
                  className={`${styles.roleFilterBtn} ${skillFilter === "SPECIAL" ? styles.roleFilterBtnActive : ""}`}
                  onClick={() => setSkillFilter("SPECIAL")}
                >
                  ✨ Đặc Biệt ({ROLE_SKILL_GUIDES.filter((r) => r.category === "SPECIAL").length})
                </button>
              </div>

              <div className={styles.roleAbilitiesList}>
                {filteredSkills.map((role) => (
                  <div key={role.rank} className={styles.roleAbilityCard}>
                    <div className={styles.roleCardHeader}>
                      <div className={styles.roleCardIdentity}>
                        <span className={styles.roleRankBadge} style={{ background: role.badgeBg }}>
                          {role.rankDisplay}
                        </span>
                        <span className={styles.roleTitle}>
                          {role.nameVi} <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: "0.72rem" }}>({role.nameEn})</span>
                        </span>
                      </div>
                      <span
                        className={styles.roleCategoryTag}
                        style={{ color: role.tagColor, background: role.tagBg }}
                      >
                        {role.categoryLabel}
                      </span>
                    </div>

                    <p className={styles.roleDescText}>
                      <strong>⚡ Hiệu ứng:</strong> {role.effect}
                    </p>

                    <p className={styles.roleDescText} style={{ color: "#94a3b8", fontSize: "0.72rem" }}>
                      <strong>🎯 Kích hoạt:</strong> {role.trigger}
                    </p>

                    <p className={styles.roleTacticalTip}>
                      {role.tip}
                    </p>
                  </div>
                ))}
              </div>
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
          <div className={styles.logListContainer}>
            {publicLog.length === 0 ? (
              <p style={{ color: "#64748b", fontStyle: "italic", textAlign: "center", marginTop: "20px" }}>
                Chưa có sự kiện nào trong trận đấu.
              </p>
            ) : (
              publicLog.map((log, idx) => {
                const text = log.textVi || log.text;
                let entryClass = "";
                if (text.includes("Không có ai tác động")) {
                  entryClass = styles.logEntryPass;
                } else if (text.includes("tấn công") || text.includes("⚔️")) {
                  entryClass = styles.logEntryAttack;
                } else if (text.includes("đỡ đòn") || text.includes("can thiệp")) {
                  entryClass = styles.logEntryIntervene;
                } else if (text.includes("vết thương") || text.includes("token")) {
                  entryClass = styles.logEntryWound;
                } else if (text.includes("kỹ năng") || text.includes("Khiên")) {
                  entryClass = styles.logEntryAbility;
                } else if (text.includes("CHIẾN THẮNG") || text.includes("BẮT")) {
                  entryClass = styles.logEntryGameOver;
                }

                let timeStr = "";
                if (log.timestamp) {
                  try {
                    const d = new Date(log.timestamp);
                    if (!isNaN(d.getTime())) {
                      timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                    }
                  } catch {
                    /* ignore */
                  }
                }

                return (
                  <div key={idx} className={`${styles.logEntry} ${entryClass}`}>
                    <div className={styles.logEntryMeta}>
                      <span>#{idx + 1}</span>
                      {timeStr && <span>{timeStr}</span>}
                    </div>
                    <div>{text}</div>
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </aside>
  );
};
