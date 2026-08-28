import { useEffect, useRef, type ReactNode } from "react";
import { clearCsrf } from "@/shared/api/http";
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
        <button
          type="button"
          className={styles.retry}
          onClick={() => {
            clearCsrf();
            void bootstrap();
          }}
        >
          {t("tryAgain")}
        </button>
      </div>
    );
  }
  return children;
}
