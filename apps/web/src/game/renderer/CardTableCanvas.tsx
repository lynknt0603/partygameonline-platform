import { useEffect, useRef, useState } from "react";
import type { GameThemeManifest } from "@/game/core/GameThemeManifest";
import type { DemoCard } from "@/game/games/demo-card-game/demoCards";
import type { ResolvedTheme } from "@/shared/theme";
import { CardTableScene, type TableSync } from "./CardTableScene";
import { resolveTablePalette } from "./theme/tablePalette";
import { usePixiApp } from "./usePixiApp";
import styles from "./CardTableCanvas.module.css";

interface CardTableCanvasProps {
  manifest: GameThemeManifest;
  resolvedTheme: ResolvedTheme;
  reducedMotion?: boolean;
  dockHand?: boolean;
  onHandChange: (cards: DemoCard[]) => void;
  onPlayed: (card: DemoCard) => void;
  onSelect: (card: DemoCard | null) => void;
  playRequest: string | null;
  onPlayRequestHandled: () => void;
  table?: TableSync | null;
  onDraw?: () => void;
}

export function CardTableCanvas({
  manifest,
  resolvedTheme,
  reducedMotion = false,
  dockHand = false,
  onHandChange,
  onPlayed,
  onSelect,
  playRequest,
  onPlayRequestHandled,
  table,
  onDraw,
}: CardTableCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CardTableScene | null>(null);
  const handChangeRef = useRef(onHandChange);
  const playedRef = useRef(onPlayed);
  const selectRef = useRef(onSelect);
  const drawRef = useRef(onDraw);
  const [sceneReady, setSceneReady] = useState(false);
  const app = usePixiApp(containerRef, { background: 0x0b0d10 });

  handChangeRef.current = onHandChange;
  playedRef.current = onPlayed;
  selectRef.current = onSelect;
  drawRef.current = onDraw;

  useEffect(() => {
    if (!app) {
      sceneRef.current = null;
      setSceneReady(false);
      return;
    }

    const palette = resolveTablePalette(manifest, resolvedTheme);
    const scene = new CardTableScene(palette, {
      onHandChange: (cards) => handChangeRef.current(cards),
      onPlayed: (card) => playedRef.current(card),
      onSelect: (card) => selectRef.current(card),
      onDraw: () => drawRef.current?.(),
    });
    sceneRef.current = scene;
    app.stage.addChild(scene.root);
    scene.resize(Math.max(1, app.screen.width), Math.max(1, app.screen.height));
    setSceneReady(true);

    const container = containerRef.current;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        scene.resize(Math.max(1, app.screen.width), Math.max(1, app.screen.height));
      });
    });
    if (container) {
      observer.observe(container);
    }

    return () => {
      observer.disconnect();
      scene.destroy();
      sceneRef.current = null;
      setSceneReady(false);
    };
  }, [app, manifest]);

  useEffect(() => {
    sceneRef.current?.setPalette(resolveTablePalette(manifest, resolvedTheme));
  }, [manifest, resolvedTheme]);

  useEffect(() => {
    sceneRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    sceneRef.current?.setDockHand(dockHand);
  }, [dockHand]);

  useEffect(() => {
    if (sceneReady && table) {
      sceneRef.current?.syncTable(table);
    }
  }, [sceneReady, table]);

  useEffect(() => {
    if (!playRequest || !sceneReady) {
      return;
    }
    sceneRef.current?.playById(playRequest);
    onPlayRequestHandled();
  }, [playRequest, sceneReady, onPlayRequestHandled]);

  return <div ref={containerRef} className={styles.host} />;
}
