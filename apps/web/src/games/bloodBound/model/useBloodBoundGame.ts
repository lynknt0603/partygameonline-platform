import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WsEnvelope } from "@/shared/api/types";
import { useRoomRealtime } from "@/shared/hooks/useRoomRealtime";
import {
  fetchBloodBoundSnapshot,
  sendBloodBoundAction,
} from "../api/bloodBoundApi";
import {
  BLOOD_BOUND_ID,
  type BloodBoundCommand,
  type BloodBoundView,
} from "./bloodBoundTypes";

export interface UseBloodBoundGameResult {
  view: BloodBoundView | null;
  snapshotPending: boolean;
  snapshotError: Error | null;
  notice: string | null;
  rejectCode: string | null;
  sendCommand: (command: BloodBoundCommand) => string | null;
}

export function useBloodBoundGame(
  roomId: string | undefined,
  enabled: boolean
): UseBloodBoundGameResult {
  const normalizedRoomId = roomId?.toUpperCase();
  const snapshot = useQuery({
    queryKey: ["blood-bound", normalizedRoomId],
    queryFn: () => fetchBloodBoundSnapshot(normalizedRoomId!),
    enabled: Boolean(normalizedRoomId && enabled),
    staleTime: 5_000,
    gcTime: 0,
    refetchInterval: normalizedRoomId && enabled ? 2_000 : false,
  });

  const [view, setView] = useState<BloodBoundView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectCode, setRejectCode] = useState<string | null>(null);

  useEffect(() => {
    const next = snapshot.data;
    if (!next) return;
    setView((current) => {
      if (current?.phase === "GAME_OVER" && next.phase !== "GAME_OVER") {
        return current;
      }
      return !current || next.roundNumber >= current.roundNumber ? next : current;
    });
    setRejectCode(null);
  }, [snapshot.data]);

  const onView = useCallback((rawView: Record<string, unknown>, _envelope: WsEnvelope) => {
    const next = rawView as unknown as BloodBoundView;
    if (!next || next.gameId !== BLOOD_BOUND_ID) return;
    setView((current) => {
      if (current?.phase === "GAME_OVER" && next.phase !== "GAME_OVER") {
        return current;
      }
      return next;
    });
    setRejectCode(null);
    setNotice(null);
  }, []);

  const onRejected = useCallback((code: string, message: string) => {
    setRejectCode(code);
    setNotice(message);
  }, []);

  useRoomRealtime(enabled ? normalizedRoomId : undefined, { onView, onRejected });

  const sendCommand = useCallback(
    (command: BloodBoundCommand): string | null => {
      if (!normalizedRoomId) return null;
      return sendBloodBoundAction(normalizedRoomId, command);
    },
    [normalizedRoomId]
  );

  return {
    view,
    snapshotPending: snapshot.isPending,
    snapshotError: snapshot.error as Error | null,
    notice,
    rejectCode,
    sendCommand,
  };
}
