import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchNobSnapshot, NOB_CATALOGUE_ID, NobPlayPage, parseNobView, type NobView } from "@/games/nob";
import { ConnectionStatusBadge } from "@/shared/components/ConnectionStatusBadge/ConnectionStatusBadge";
import { cacheSession } from "@/shared/api/session";
import { useRoomRealtime } from "@/shared/hooks/useRoomRealtime";
import { useRealtimeStatus } from "@/shared/hooks/useRealtimeStatus";
import { useRoom } from "@/shared/hooks/useRooms";
import { useSessionStore } from "@/shared/state/sessionStore";

export function GamePage() {
  const { roomId = "" } = useParams();
  const roomQuery = useRoom(roomId);
  const room = roomQuery.data;
  const realtimeStatus = useRealtimeStatus();
  const session = useSessionStore((state) => state.session);
  const [view, setView] = useState<NobView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectCode, setRejectCode] = useState<string | null>(null);

  useEffect(() => {
    if (session && roomId) {
      cacheSession({ ...session, currentRoomId: roomId.toUpperCase() });
    }
  }, [session, roomId]);

  useEffect(() => {
    if (
      !roomId ||
      room?.gameId !== NOB_CATALOGUE_ID ||
      (realtimeStatus !== "open" && realtimeStatus !== "connecting")
    ) {
      return;
    }
    let cancelled = false;
    const pull = async () => {
      try {
        const snapshot = await fetchNobSnapshot(roomId);
        if (!cancelled && snapshot) {
          setView(snapshot);
          setRejectCode(null);
        }
      } catch {
        // The authoritative WebSocket snapshot remains the fallback.
      }
    };
    void pull();
    return () => {
      cancelled = true;
    };
  }, [room?.gameId, roomId, realtimeStatus]);

  useRoomRealtime(roomId, {
    onView: (next) => {
      const nob = parseNobView(next);
      if (nob) {
        setView(nob);
        setRejectCode(null);
      }
    },
    onRejected: (code, message) => {
      setRejectCode(code);
      setNotice(message);
    },
  });

  if (roomQuery.isPending) {
    return <main aria-live="polite">Loading game…</main>;
  }

  if (roomQuery.isError || !room) {
    return <main role="alert">Unable to load this room.</main>;
  }

  if (room.gameId !== NOB_CATALOGUE_ID) {
    return <main role="alert">This game is no longer available.</main>;
  }

  return (
    <>
      <ConnectionStatusBadge />
      <NobPlayPage room={room} view={view} notice={notice} rejectCode={rejectCode} />
    </>
  );
}
