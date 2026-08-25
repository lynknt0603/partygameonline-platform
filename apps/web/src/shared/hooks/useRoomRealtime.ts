import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { realtime } from "@/shared/api/ws";
import type { RoomDto, WsEnvelope } from "@/shared/api/types";
import { useSessionStore } from "@/shared/state/sessionStore";

interface Options {
  onView?: (view: Record<string, unknown>, envelope: WsEnvelope) => void;
  onRejected?: (code: string, message: string) => void;
}

export function useRoomRealtime(roomId: string | undefined, options: Options = {}): void {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const playerId = useSessionStore((state) => state.session?.playerId);
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  const staleResynced = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      return;
    }
    const normalized = roomId.toUpperCase();
    staleResynced.current = null;
    const requestSnapshot = () => realtime.send("ROOM_SNAPSHOT", normalized);
    const unsubStatus = realtime.subscribeStatus((status) => {
      if (status === "open") {
        requestSnapshot();
        void queryClient.invalidateQueries({ queryKey: ["room", normalized] });
      }
    });
    const unsubscribe = realtime.subscribe((message) => {
      if (message.roomId && message.roomId.toUpperCase() !== normalized) {
        return;
      }
      if (message.type === "CONNECTED") {
        requestSnapshot();
        return;
      }
      if (message.type === "ROOM_CLOSED") {
        navigate("/rooms", { replace: true });
        return;
      }
      const payload = message.payload ?? {};
      const room = payload.room as RoomDto | undefined;
      if (room) {
        queryClient.setQueryData(["room", normalized], room);
        queryClient.setQueryData(["room", roomId], room);

        // GAME_STARTED is a transient event. A client that reconnects after
        // that event must still leave the lobby as soon as the authoritative
        // room snapshot says the game is already running.
        const isMember = Boolean(playerId && room.players.some((player) => player.playerId === playerId));
        if (isMember && (room.status === "IN_GAME" || room.status === "STARTING") && !pathRef.current.startsWith("/play/")) {
          navigate(`/play/${normalized}`, { replace: true });
        }
      }
      const view = payload.view;
      if (view && typeof view === "object" && !Array.isArray(view)) {
        optionsRef.current.onView?.(view as Record<string, unknown>, message);
      }
      if (message.type === "GAME_STARTED" && !pathRef.current.startsWith("/play/")) {
        navigate(`/play/${normalized}`, { replace: true });
      }
      if (message.type === "RESYNC_REQUIRED") {
        requestSnapshot();
        return;
      }
      if (message.type === "ACTION_REJECTED" || message.type === "ERROR") {
        const code = String(payload.errorCode ?? "ERROR");
        const text = String(payload.message ?? code);
        optionsRef.current.onRejected?.(code, text);
        if (code === "ROOM_CLOSED") {
          navigate("/rooms", { replace: true });
          return;
        }
        if (code === "NOT_ROOM_MEMBER") {
          return;
        }
        if (code === "STALE_DECISION") {
          const stamp = `${normalized}:${payload.requestId ?? message.requestId ?? code}`;
          if (staleResynced.current !== stamp) {
            staleResynced.current = stamp;
            requestSnapshot();
          }
        }
      }
    });

    // Register listeners before opening the socket. This closes the small
    // race where a previously idle global socket could emit CONNECTED or a
    // queued snapshot before this hook had subscribed.
    realtime.connect();
    requestSnapshot();
    return () => {
      unsubStatus();
      unsubscribe();
    };
  }, [roomId, playerId, queryClient, navigate]);
}
