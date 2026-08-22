import { useEffect, useState } from "react";
import { useRealtimeStatus } from "@/shared/hooks/useRealtimeStatus";
import { useT } from "@/shared/i18n/useT";
import styles from "./ConnectionStatusBadge.module.css";

export function ConnectionStatusBadge() {
  const t = useT();
  const status = useRealtimeStatus();
  const [hadOpen, setHadOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "open") {
      setHadOpen(true);
      const hide = window.setTimeout(() => setVisible(false), 480);
      return () => window.clearTimeout(hide);
    }
    if (status === "reconnecting" || (hadOpen && status === "connecting")) {
      setVisible(true);
    }
  }, [status, hadOpen]);

  if (!visible) {
    return null;
  }

  return (
    <div className={styles.badge} role="status" aria-live="polite">
      <span className={styles.dot} aria-hidden="true" />
      <span>{t("reconnecting")}</span>
    </div>
  );
}
