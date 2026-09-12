import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearActiveGame,
  readActiveGame,
  saveActiveGame,
  checkActiveGameConflict,
  type ActiveGameSession,
} from "@/shared/state/activeGameStorage";
import { leaveRoom } from "@/shared/api/rooms";
import { useSessionStore } from "@/shared/state/sessionStore";
import { cacheSession } from "@/shared/api/session";

export function useActiveGame() {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState<ActiveGameSession | null>(() => readActiveGame());

  const refreshActiveGame = useCallback(() => {
    setActiveGame(readActiveGame());
  }, []);

  useEffect(() => {
    // Initial sync
    refreshActiveGame();

    // Listen for storage events (e.g. across tabs) and same-window custom events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "pgo.activeGame") {
        refreshActiveGame();
      }
    };
    const handleLocal = () => {
      refreshActiveGame();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("pgo:activeGame", handleLocal);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pgo:activeGame", handleLocal);
    };
  }, [refreshActiveGame]);

  const recordActiveGame = useCallback((roomId: string, gameId: string, gameTitle?: string) => {
    saveActiveGame({ roomId, gameId, gameTitle });
    refreshActiveGame();
  }, [refreshActiveGame]);

  const abandon = useCallback(async (roomIdToAbandon?: string) => {
    const target = roomIdToAbandon || activeGame?.roomId;
    if (target) {
      try {
        await leaveRoom(target);
      } catch {
        /* ignore network error when forfeiting */
      }
      clearActiveGame(target);
      clearActiveGame();
      const session = useSessionStore.getState().session;
      if (session && (!target || session.currentRoomId?.toUpperCase() === target.toUpperCase())) {
        const updated = { ...session, currentRoomId: null };
        useSessionStore.setState({ session: updated });
        cacheSession(updated);
      }
      refreshActiveGame();
    }
  }, [activeGame?.roomId, refreshActiveGame]);

  const rejoin = useCallback((roomIdToRejoin?: string) => {
    const target = roomIdToRejoin || activeGame?.roomId;
    if (target) {
      navigate(`/play/${target}`);
    }
  }, [activeGame?.roomId, navigate]);

  const hasConflict = useCallback((targetRoomId?: string) => {
    return checkActiveGameConflict(readActiveGame(), targetRoomId);
  }, []);

  return {
    activeGame,
    recordActiveGame,
    abandon,
    rejoin,
    hasConflict,
    refreshActiveGame,
  };
}
