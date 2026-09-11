import { useState } from "react";
import { LogOut, ArrowRight, X } from "lucide-react";
import { useLocale } from "@/shared/i18n/useT";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import modalStyles from "@/shared/components/ConfirmDialog/ConfirmDialog.module.css";
import styles from "./ActiveGameGuard.module.css";

interface ActiveGameConflictDialogProps {
  open: boolean;
  activeRoomId: string;
  onRejoin: () => void;
  onAbandonAndProceed: () => void;
  onCancel: () => void;
  actionType?: "create" | "join";
}

export function ActiveGameConflictDialog({
  open,
  activeRoomId,
  onRejoin,
  onAbandonAndProceed,
  onCancel,
  actionType = "join",
}: ActiveGameConflictDialogProps) {
  const [confirmAbandonOpen, setConfirmAbandonOpen] = useState(false);
  const locale = useLocale();
  if (!open) {
    return null;
  }

  const isVi = locale === "vi";

  return (
    <>
      <div className={modalStyles.layer} role="presentation">
        <button
          type="button"
          className={modalStyles.backdrop}
          aria-label="Close"
          onClick={onCancel}
        />
        <div
          className={`${modalStyles.dialog} theme-panel`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="conflict-dialog-title"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "460px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3
              id="conflict-dialog-title"
              className={modalStyles.title}
              style={{ color: "#f87171", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}
            >
              ⚠️ {isVi ? "Ván đấu cũ chưa hoàn thành!" : "Unfinished Match in Progress!"}
            </h3>
            <button
              type="button"
              onClick={onCancel}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <p className={modalStyles.body} style={{ marginTop: "12px", lineHeight: "1.5" }}>
            {isVi ? (
              <>
                Bạn đang có một ván đấu chưa kết thúc tại phòng <strong>{activeRoomId}</strong>.
                <br />
                {actionType === "create"
                  ? "Bạn phải vào lại chơi tiếp hoặc thoát hẳn phòng cũ trước khi tạo phòng mới."
                  : "Bạn phải vào lại chơi tiếp hoặc thoát hẳn phòng cũ trước khi tham gia phòng này."}
              </>
            ) : (
              <>
                You are currently in an active game in room <strong>{activeRoomId}</strong>.
                <br />
                {actionType === "create"
                  ? "You must finish or forfeit the previous match before creating a new room."
                  : "You must finish or forfeit the previous match before joining another room."}
              </>
            )}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
            <button
              type="button"
              className={styles.btnRejoin}
              onClick={onRejoin}
              style={{ justifyContent: "center", padding: "10px 16px" }}
            >
              <ArrowRight size={16} />
              {isVi ? `Vào lại phòng cũ (${activeRoomId})` : `Rejoin Old Room (${activeRoomId})`}
            </button>

            <button
              type="button"
              className={styles.btnAbandon}
              onClick={() => setConfirmAbandonOpen(true)}
              style={{ justifyContent: "center", padding: "10px 16px", borderColor: "rgba(239, 68, 68, 0.4)" }}
            >
              <LogOut size={16} />
              {isVi ? "Thoát hẳn phòng cũ & Tiếp tục" : "Forfeit Old Room & Proceed"}
            </button>

            <button
              type="button"
              className={modalStyles.cancel}
              onClick={onCancel}
              style={{ marginTop: "4px" }}
            >
              {isVi ? "Ở lại trang hiện tại" : "Cancel"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAbandonOpen}
        title={isVi ? "Thoát phòng cũ?" : "Forfeit old room?"}
        body={
          isVi
            ? "Bạn sẽ bị loại khỏi game nếu tiếp tục. Bạn có chắc chắn muốn thoát phòng cũ?"
            : "You will be eliminated from the game if you leave. Are you sure you want to forfeit your old room?"
        }
        confirmLabel={isVi ? "Xác nhận thoát" : "Confirm Leave"}
        cancelLabel={isVi ? "Ở lại" : "Stay"}
        onConfirm={() => {
          setConfirmAbandonOpen(false);
          onAbandonAndProceed();
        }}
        onCancel={() => setConfirmAbandonOpen(false)}
      />
    </>
  );
}
