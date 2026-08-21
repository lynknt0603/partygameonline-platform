import { useEffect, type ReactNode } from "react";
import { realtime } from "@/shared/api/ws";
import { useSessionStore } from "@/shared/state/sessionStore";
import { useT } from "@/shared/i18n/useT";

export function SessionBootstrap({ children }: { children: ReactNode }) {
  const t = useT();
  const ready = useSessionStore((state) => state.ready);
  const error = useSessionStore((state) => state.error);
  const bootstrap = useSessionStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!ready || error) {
      return;
    }
    realtime.connect();
  }, [ready, error]);

  if (!ready) {
    return <p style={{ padding: 24 }}>{t("connecting")}</p>;
  }
  if (error) {
    return (
      <p style={{ padding: 24 }}>
        {t("sessionError")} {error}
      </p>
    );
  }
  return children;
}
