import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WsEnvelope } from "@/shared/api/types";
import { useRoomRealtime } from "@/shared/hooks/useRoomRealtime";
import {
  fetchNotInMyPotSnapshot,
  sendNotInMyPotCommand,
  type NotInMyPotCommand,
} from "../api/notInMyPotApi";
import {
  NOT_IN_MY_POT_ID,
  parseNotInMyPotView,
  type NotInMyPotView,
} from "./notInMyPotTypes";

interface UseNotInMyPotGameResult {
  view: NotInMyPotView | null;
  snapshotPending: boolean;
  snapshotError: Error | null;
  notice: string | null;
  rejectCode: string | null;
  sendCommand: (command: NotInMyPotCommand) => string | null;
}

export function useNotInMyPotGame(roomId: string | undefined, enabled: boolean): UseNotInMyPotGameResult {
  const normalizedRoomId = roomId?.toUpperCase();
  const snapshot = useQuery({
    queryKey: ["not-in-my-pot", normalizedRoomId],
    queryFn: () => fetchNotInMyPotSnapshot(normalizedRoomId!),
    enabled: Boolean(normalizedRoomId && enabled),
    staleTime: 5_000,
  });
  const [view, setView] = useState<NotInMyPotView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectCode, setRejectCode] = useState<string | null>(null);

  useEffect(() => {
    if (!snapshot.data) {
      return;
    }
    setView((current) => {
      // A finished view is intentionally kept while the backend recycles the
      // room immediately after publishing GAME_FINISHED.
      if (current?.finished && !snapshot.data?.finished) {
        return current;
      }
      return snapshot.data;
    });
    setRejectCode(null);
  }, [snapshot.data]);

  const onView = useCallback((rawView: Record<string, unknown>, _envelope: WsEnvelope) => {
    const next = parseNotInMyPotView(rawView);
    if (!next) {
      return;
    }
    setView((current) => {
      if (current?.finished && !next.finished) {
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
    (command: NotInMyPotCommand): string | null => {
      if (!normalizedRoomId || !view) {
        return null;
      }
      setNotice(null);
      setRejectCode(null);
      return sendNotInMyPotCommand(normalizedRoomId, command, view.stateVersion);
    },
    [normalizedRoomId, view],
  );

  return {
    view,
    snapshotPending: enabled && snapshot.isPending,
    snapshotError: enabled && snapshot.isError ? (snapshot.error as Error) : null,
    notice,
    rejectCode,
    sendCommand,
  };
}

export { NOT_IN_MY_POT_ID };
