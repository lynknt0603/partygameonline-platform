import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WsEnvelope } from "@/shared/api/types";
import { useRoomRealtime } from "@/shared/hooks/useRoomRealtime";
import { fetchLiarsNumberSnapshot, sendLiarsNumberCommand, type LiarsNumberCommand } from "../api/liarsNumberApi";
import { LIARS_NUMBER_ID, parseLiarsNumberView, type LiarsNumberView } from "./liarsNumberTypes";

export interface UseLiarsNumberGameResult {
  view: LiarsNumberView | null;
  snapshotPending: boolean;
  snapshotError: Error | null;
  notice: string | null;
  rejectCode: string | null;
  sendCommand: (command: LiarsNumberCommand) => string | null;
}

export function useLiarsNumberGame(roomId: string | undefined, enabled: boolean): UseLiarsNumberGameResult {
  const normalizedRoomId = roomId?.toUpperCase();
  const snapshot = useQuery({
    queryKey: [LIARS_NUMBER_ID, normalizedRoomId],
    queryFn: () => fetchLiarsNumberSnapshot(normalizedRoomId!),
    enabled: Boolean(normalizedRoomId && enabled),
    staleTime: 1_000,
    gcTime: 0,
    refetchInterval: normalizedRoomId && enabled ? 2_000 : false,
  });
  const [view, setView] = useState<LiarsNumberView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectCode, setRejectCode] = useState<string | null>(null);

  useEffect(() => {
    if (!snapshot.data) return;
    setView((current) => current?.finished && !snapshot.data!.finished
      ? current
      : !current || snapshot.data!.stateVersion >= current.stateVersion ? snapshot.data : current);
    setRejectCode(null);
  }, [snapshot.data]);

  const onView = useCallback((rawView: Record<string, unknown>, _envelope: WsEnvelope) => {
    const next = parseLiarsNumberView(rawView);
    if (!next) return;
    setView((current) => current?.finished && !next.finished
      ? current
      : !current || next.stateVersion >= current.stateVersion ? next : current);
    setRejectCode(null);
    setNotice(null);
  }, []);
  const onRejected = useCallback((code: string, message: string) => {
    setRejectCode(code);
    setNotice(message);
  }, []);
  useRoomRealtime(enabled ? normalizedRoomId : undefined, { onView, onRejected });

  const sendCommand = useCallback((command: LiarsNumberCommand) => {
    if (!normalizedRoomId || !view) return null;
    setNotice(null);
    setRejectCode(null);
    return sendLiarsNumberCommand(normalizedRoomId, command, view.stateVersion);
  }, [normalizedRoomId, view]);

  return {
    view,
    snapshotPending: enabled && snapshot.isPending,
    snapshotError: enabled && snapshot.isError ? snapshot.error as Error : null,
    notice,
    rejectCode,
    sendCommand,
  };
}

export { LIARS_NUMBER_ID };
