import React from "react";
import { Bug, Bot, Zap, Play, Pause, RotateCcw } from "lucide-react";
import styles from "../pages/BloodBoundPlayPage.module.css";

interface BloodBoundGodViewProps {
  playerCount: number;
  selectedRole: string;
  startingDaggerChoice: "YOU" | "BOT";
  debugMode: boolean;
  autoPlayHuman: boolean;
  botSpeedMs: number;
  isPaused: boolean;
  onChangePlayerCount: (count: number) => void;
  onSelectRole: (role: string) => void;
  onToggleStartingDagger: () => void;
  onToggleDebugMode: () => void;
  onToggleAutoPlay: () => void;
  onToggleSpeed: () => void;
  onTogglePause: () => void;
  onResetGame: () => void;
}

export const BloodBoundGodView: React.FC<BloodBoundGodViewProps> = ({
  playerCount,
  selectedRole,
  startingDaggerChoice,
  debugMode,
  autoPlayHuman,
  botSpeedMs,
  isPaused,
  onChangePlayerCount,
  onSelectRole,
  onToggleStartingDagger,
  onToggleDebugMode,
  onToggleAutoPlay,
  onToggleSpeed,
  onTogglePause,
  onResetGame,
}) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      {/* Player Count Selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(255, 255, 255, 0.05)", padding: "2px 6px", borderRadius: "8px" }}>
        <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>Quy mô:</span>
        {[6, 7, 8].map((cnt) => (
          <button
            key={cnt}
            type="button"
            className={playerCount === cnt ? styles.btnDebugActive : styles.btnDebug}
            onClick={() => onChangePlayerCount(cnt)}
            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
            title={cnt === 8 ? "Tối đa 8 người chơi (4 Rose vs 4 Fan)" : cnt === 7 ? "7 người chơi (Có Inquisitor ⚖️)" : "6 người chơi chuẩn"}
          >
            {cnt}P {cnt === 8 ? "🔥Max" : cnt === 7 ? "⚖️" : ""}
          </button>
        ))}
      </div>

      {/* Role Picker */}
      <div className={styles.rolePickerBox}>
        <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>Vai:</span>
        <select
          className={styles.roleSelect}
          value={selectedRole}
          onChange={(e) => onSelectRole(e.target.value)}
          title="Chọn nhân vật để hóa thân hoặc chọn Random để thử nghiệm"
        >
          <option value="RANDOM">🎲 Ngẫu Nhiên (Mỗi ván 1 vai)</option>
          <optgroup label="🌹 Gia Tộc Hoa Hồng (Rose)">
            <option value="ROSE_1">🌹 Cấp 1: Thủ Lĩnh (Leader)</option>
            <option value="ROSE_2">🌹 Cấp 2: Sát Thủ (Assassin)</option>
            <option value="ROSE_3">🌹 Cấp 3: Tắc Kè Hoa (Harlequin)</option>
            <option value="ROSE_4">🌹 Cấp 4: Nhà Giả Kim (Alchemist)</option>
          </optgroup>
          <optgroup label="🪭 Gia Tộc Quạt (Fan)">
            <option value="FAN_1">🪭 Cấp 1: Thủ Lĩnh (Leader)</option>
            <option value="FAN_2">🪭 Cấp 2: Sát Thủ (Assassin)</option>
            <option value="FAN_3">🪭 Cấp 3: Tắc Kè Hoa (Harlequin)</option>
            <option value="FAN_4">🪭 Cấp 4: Nhà Giả Kim (Alchemist)</option>
          </optgroup>
          {playerCount === 7 && (
            <optgroup label="⚖️ Kẻ Phán Xét (Inquisitor)">
              <option value="INQUISITOR_8">⚖️ Cấp 8: Kẻ Phán Xét</option>
            </optgroup>
          )}
        </select>
      </div>

      {/* Starting Dagger Toggle */}
      <button
        type="button"
        className={startingDaggerChoice === "BOT" ? styles.btnAutoActive : styles.btnDebug}
        onClick={onToggleStartingDagger}
        title="Đổi ai cầm kiếm mở màn"
      >
        🗡️ {startingDaggerChoice === "BOT" ? "Bot mở màn (Test đỡ đòn)" : "Bạn mở màn"}
      </button>

      {/* Debug Mode Toggle */}
      <button
        type="button"
        className={debugMode ? styles.btnDebugActive : styles.btnDebug}
        onClick={onToggleDebugMode}
        title="Bật/Tắt hiển thị danh tính bí mật và bảng log AI"
      >
        <Bug size={15} /> Debug: {debugMode ? "BẬT" : "TẮT"}
      </button>

      {/* AI Takeover */}
      <button
        type="button"
        className={autoPlayHuman ? styles.btnAutoActive : styles.btnAuto}
        onClick={onToggleAutoPlay}
        title="Cho phép Bot tự động đánh hộ lượt của bạn"
      >
        <Bot size={15} /> AI Đánh Hộ: {autoPlayHuman ? "BẬT" : "TẮT"}
      </button>

      {/* Speed Toggle */}
      <button
        type="button"
        className={styles.btnIcon}
        onClick={onToggleSpeed}
        title="Tốc độ lượt bot"
      >
        <Zap size={15} color={botSpeedMs === 500 ? "#f59e0b" : "#94a3b8"} />
        {botSpeedMs === 500 ? "0.5s" : "1.2s"}
      </button>

      {/* Pause / Resume */}
      <button
        type="button"
        className={styles.btnIcon}
        onClick={onTogglePause}
        title={isPaused ? "Tiếp tục" : "Tạm dừng"}
      >
        {isPaused ? <Play size={15} color="#22c55e" /> : <Pause size={15} />}
      </button>

      {/* Reset Game */}
      <button
        type="button"
        className={styles.btnIcon}
        onClick={onResetGame}
        title="Chia bài và bắt đầu lại ván mới"
      >
        <RotateCcw size={15} /> Ván Mới
      </button>
    </div>
  );
};
