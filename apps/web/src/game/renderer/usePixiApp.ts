import { useEffect, useState, type RefObject } from "react";
import type { Application } from "pixi.js";
import { PixiGameHost } from "./PixiGameHost";

interface UsePixiAppOptions {
  background: number;
}

export function usePixiApp(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UsePixiAppOptions,
): Application | null {
  const [app, setApp] = useState<Application | null>(null);
  const background = options.background;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const host = new PixiGameHost();
    let cancelled = false;

    void host.mount(container, { background }).then((application) => {
      if (!cancelled && application) {
        setApp(application);
      }
    });

    return () => {
      cancelled = true;
      host.destroy();
      setApp(null);
    };
  }, [containerRef, background]);

  return app;
}
