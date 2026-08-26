import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { fetchNobSnapshot, NOB_CATALOGUE_ID, NobPlayPage, parseNobView, type NobView } from "@/games/nob";
import { NOT_IN_MY_POT_ID, NotInMyPotPlayPage, useNotInMyPotGame } from "@/games/notInMyPot";
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
  const isNob = room?.gameId === NOB_CATALOGUE_ID;
  const isNotInMyPot = room?.gameId === NOT_IN_MY_POT_ID;
  const notInMyPot = useNotInMyPotGame(roomId, Boolean(isNotInMyPot));

  useEffect(() => {
    if (session && roomId) {
      cacheSession({ ...session, currentRoomId: roomId.toUpperCase() });
    }
  }, [session, roomId]);

  useEffect(() => {
    if (
      !roomId ||
      !isNob ||
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
  }, [isNob, roomId, realtimeStatus]);

  useRoomRealtime(isNob ? roomId : undefined, {
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
    return <Navigate to="/" replace />;
  }

  if (room.gameId !== NOB_CATALOGUE_ID) {
    if (room.gameId === NOT_IN_MY_POT_ID) {
      return (
        <>
          <ConnectionStatusBadge />
          <NotInMyPotPlayPage
            room={room}
            view={notInMyPot.view}
            snapshotPending={notInMyPot.snapshotPending}
            snapshotError={notInMyPot.snapshotError}
            notice={notInMyPot.notice}
            rejectCode={notInMyPot.rejectCode}
            sendCommand={notInMyPot.sendCommand}
          />
        </>
      );
    }
    return <main role="alert">This game is no longer available.</main>;
  }

  return (
    <>
      <ConnectionStatusBadge />
      <NobPlayPage room={room} view={view} notice={notice} rejectCode={rejectCode} />
    </>
  );
}
