import { useEffect, useRef, type ReactNode } from "react";
import { realtime } from "@/shared/api/ws";
import { useSessionStore } from "@/shared/state/sessionStore";
import { useT } from "@/shared/i18n/useT";
import styles from "./SessionBootstrap.module.css";

export function SessionBootstrap({ children }: { children: ReactNode }) {
  const t = useT();
  const ready = useSessionStore((state) => state.ready);
  const error = useSessionStore((state) => state.error);
  const socketIdentity = useSessionStore((state) =>
    state.session ? `${state.session.kind}:${state.session.playerId}` : null,
  );
  const bootstrap = useSessionStore((state) => state.bootstrap);
  const connectedIdentity = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!ready || error) {
      return;
    }
    if (connectedIdentity.current === undefined) {
      connectedIdentity.current = socketIdentity;
      realtime.connect();
      return;
    }
    if (connectedIdentity.current !== socketIdentity) {
      connectedIdentity.current = socketIdentity;
      realtime.reconnect();
      return;
    }
    realtime.connect();
  }, [ready, error, socketIdentity]);

  if (!ready) {
    return (
      <div className={styles.wrap} role="status">
        <p className={styles.title}>{t("connecting")}</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.wrap} role="alert">
        <p className={styles.title}>{t("sessionError")}</p>
        <p className={styles.hint}>{t("sessionErrorHint")}</p>
        <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            className={styles.retry}
            onClick={() => {
              void bootstrap();
            }}
          >
            {t("tryAgain")}
          </button>
          <button
            type="button"
            className={styles.retry}
            style={{ background: "var(--brand, #8a1c1c)", color: "var(--on-brand, #ffffff)" }}
            onClick={() => {
              useSessionStore.getState().enterOfflineDemo();
            }}
          >
            🎮 Chơi thử nghiệm (Offline Demo)
          </button>
        </div>
      </div>
    );
  }
  return children;
}
