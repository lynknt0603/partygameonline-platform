import { useState } from "react";
import { Swords, LogOut, ArrowRight, X } from "lucide-react";
import { useActiveGame } from "@/shared/hooks/useActiveGame";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { useLocale } from "@/shared/i18n/useT";
import modalStyles from "@/shared/components/ConfirmDialog/ConfirmDialog.module.css";
import styles from "./ActiveGameGuard.module.css";

export function ActiveGameBanner() {
  const { activeGame, rejoin, abandon } = useActiveGame();
  const [promptModalOpen, setPromptModalOpen] = useState(true);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const locale = useLocale();

  if (!activeGame) {
    return null;
  }

  const isVi = locale === "vi";

  return (
    <>
      {/* 1. Top Bar Banner */}
      <div className={styles.banner} role="alert">
        <div className={styles.bannerContent}>
          <div className={styles.bannerIcon}>
            <Swords size={22} />
          </div>
          <div>
            <h4 className={styles.bannerTitle}>
              {isVi ? "Trận đấu đang diễn ra!" : "Match in progress!"}
            </h4>
            <p className={styles.bannerText}>
              {isVi ? (
                <>
                  Bạn đang có một ván đấu chưa kết thúc tại phòng{" "}
                  <span className={styles.bannerRoomCode}>{activeGame.roomId}</span>
                  {activeGame.gameTitle ? ` (${activeGame.gameTitle})` : ""}. Bạn có muốn tiếp tục chơi không?
                </>
              ) : (
                <>
                  You have an unfinished game in room{" "}
                  <span className={styles.bannerRoomCode}>{activeGame.roomId}</span>
                  {activeGame.gameTitle ? ` (${activeGame.gameTitle})` : ""}. Would you like to rejoin?
                </>
              )}
            </p>
          </div>
        </div>

        <div className={styles.bannerActions}>
          <button
            type="button"
            className={styles.btnAbandon}
            onClick={() => setConfirmAbandon(true)}
          >
            <LogOut size={16} />
            {isVi ? "Thoát ván đấu" : "Leave match"}
          </button>
          <button
            type="button"
            className={styles.btnRejoin}
            onClick={() => rejoin()}
          >
            {isVi ? "Vào lại chơi tiếp" : "Rejoin match"}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* 2. Cửa sổ thông báo nổi bật khi mở web ngoài trang chủ */}
      {promptModalOpen && (
        <div className={modalStyles.layer} role="presentation">
          <button
            type="button"
            className={modalStyles.backdrop}
            aria-label="Close"
            onClick={() => setPromptModalOpen(false)}
          />
          <div
            className={`${modalStyles.dialog} theme-panel`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="active-prompt-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "460px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3
                id="active-prompt-title"
                style={{
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  margin: 0,
                  fontSize: "1.15rem",
                  fontWeight: 700,
                }}
              >
                <Swords size={20} />
                {isVi ? "Trận đấu đang diễn ra!" : "Match in progress!"}
              </h3>
              <button
                type="button"
                onClick={() => setPromptModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "4px",
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ marginTop: "12px", lineHeight: "1.5", color: "var(--text-secondary)" }}>
              {isVi ? (
                <>
                  Hệ thống ghi nhận bạn đang có một ván đấu chưa hoàn thành tại phòng{" "}
                  <strong style={{ color: "var(--text, #f8fafc)" }}>{activeGame.roomId}</strong>
                  {activeGame.gameTitle ? ` (${activeGame.gameTitle})` : ""}.
                  <br />
                  Bạn có muốn vào lại phòng để tiếp tục ván đấu không?
                </>
              ) : (
                <>
                  You have an unfinished game in room{" "}
                  <strong>{activeGame.roomId}</strong>
                  {activeGame.gameTitle ? ` (${activeGame.gameTitle})` : ""}.
                  <br />
                  Would you like to return to the game?
                </>
              )}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className={styles.btnRejoin}
                onClick={() => rejoin()}
                style={{ justifyContent: "center", padding: "10px 16px" }}
              >
                <ArrowRight size={16} />
                {isVi ? "Vào lại chơi tiếp" : "Rejoin match"}
              </button>

              <button
                type="button"
                className={styles.btnAbandon}
                onClick={() => setConfirmAbandon(true)}
                style={{
                  justifyContent: "center",
                  padding: "10px 16px",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                }}
              >
                <LogOut size={16} />
                {isVi ? "Thoát ván đấu" : "Leave match"}
              </button>

              <button
                type="button"
                className={modalStyles.cancel}
                onClick={() => setPromptModalOpen(false)}
                style={{ marginTop: "4px" }}
              >
                {isVi ? "Để sau / Xem trang ngoài" : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Confirm Dialog Khi Bấm Thoát Ván Đấu */}
      <ConfirmDialog
        open={confirmAbandon}
        title={isVi ? "Thoát phòng?" : "Leave room?"}
        body={
          isVi
            ? "Bạn sẽ bị loại khỏi game nếu tiếp tục. Bạn có chắc chắn muốn thoát phòng?"
            : "You will be eliminated from the game if you leave. Are you sure you want to exit?"
        }
        confirmLabel={isVi ? "Xác nhận thoát" : "Confirm Leave"}
        cancelLabel={isVi ? "Ở lại" : "Stay"}
        onConfirm={async () => {
          await abandon();
          setConfirmAbandon(false);
          setPromptModalOpen(false);
        }}
        onCancel={() => setConfirmAbandon(false)}
      />
    </>
  );
}
