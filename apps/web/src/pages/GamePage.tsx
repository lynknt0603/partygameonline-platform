import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { fetchNobSnapshot, NOB_CATALOGUE_ID, NobPlayPage, parseNobView, type NobView } from "@/games/nob";
import {
  BLOOD_BOUND_ID,
  BloodBoundPlayPage,
  isBloodBoundDemoRoom,
  useBloodBoundGame,
} from "@/games/bloodBound";
import { NOT_IN_MY_POT_ID, NotInMyPotPlayPage, useNotInMyPotGame } from "@/games/notInMyPot";
import { WHERES_THE_BONE_ID, WheresTheBonePlayPage, useWheresTheBoneGame } from "@/games/wheresTheBone";
import { LIARS_NUMBER_ID, LiarsNumberPlayPage, useLiarsNumberGame } from "@/games/liarsNumber";
import { ConnectionStatusBadge } from "@/shared/components/ConnectionStatusBadge/ConnectionStatusBadge";
import { cacheSession } from "@/shared/api/session";
import { useRealtimeStatus } from "@/shared/hooks/useRealtimeStatus";
import { useRoomRealtime } from "@/shared/hooks/useRoomRealtime";
import { useRoom } from "@/shared/hooks/useRooms";
import { useSessionStore } from "@/shared/state/sessionStore";

export function GamePage() {
  const { roomId = "" } = useParams();
  const roomQuery = useRoom(roomId);
  const room = roomQuery.data;
  const session = useSessionStore((state) => state.session);
  const realtimeStatus = useRealtimeStatus();
  const [view, setView] = useState<NobView | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectCode, setRejectCode] = useState<string | null>(null);
  const isNob = room?.gameId === NOB_CATALOGUE_ID;
  const isNotInMyPot = room?.gameId === NOT_IN_MY_POT_ID;
  const isWheresTheBone = room?.gameId === WHERES_THE_BONE_ID;
  const isBloodBound = room?.gameId === BLOOD_BOUND_ID;
  const isLiarsNumber = room?.gameId === LIARS_NUMBER_ID;
  const isInGame = room?.status === "in_game";
  const notInMyPot = useNotInMyPotGame(roomId, Boolean(isNotInMyPot && isInGame));
  const wheresTheBone = useWheresTheBoneGame(roomId, Boolean(isWheresTheBone && isInGame));
  const liarsNumber = useLiarsNumberGame(roomId, Boolean(isLiarsNumber && isInGame));
  const bloodBound = useBloodBoundGame(roomId, Boolean(isBloodBound && isInGame));

  useEffect(() => {
    if (session && roomId) {
      cacheSession({ ...session, currentRoomId: roomId.toUpperCase() });
    }
  }, [session, roomId]);

  useEffect(() => {
    if (!roomId || !isNob || !isInGame) {
      return;
    }
    let cancelled = false;
    let requestInFlight = false;
    const pull = async () => {
      if (cancelled || requestInFlight) {
        return;
      }
      requestInFlight = true;
      try {
        const snapshot = await fetchNobSnapshot(roomId);
        if (!cancelled && snapshot) {
          // A snapshot can race a realtime GAME_EVENTS message. Keep the
          // newest state so a slower HTTP response cannot roll the table
          // back to the pre-card-submit view.
          setView((current) => {
            const currentVersion = current?.version ?? -1;
            const snapshotVersion = snapshot.version ?? -1;
            return snapshotVersion >= currentVersion ? snapshot : current;
          });
          setRejectCode(null);
        }
      } catch {
        // The authoritative WebSocket snapshot remains the fallback.
      } finally {
        requestInFlight = false;
      }
    };
    void pull();
    // WebSocket is authoritative while healthy. Only poll as a two-second
    // fallback while it is unavailable so a reconnecting player cannot remain
    // stuck on a stale table. The pull above also performs one final resync
    // whenever the socket becomes open again.
    const pollId = realtimeStatus === "open"
      ? null
      : window.setInterval(() => void pull(), 2000);
    return () => {
      cancelled = true;
      if (pollId !== null) {
        window.clearInterval(pollId);
      }
    };
  }, [isNob, realtimeStatus, room?.status, roomId]);

  useRoomRealtime(isNob ? roomId : undefined, {
    onView: (next) => {
      const nob = parseNobView(next);
      if (nob) {
        setView((current) => {
          const currentVersion = current?.version ?? -1;
          const nextVersion = nob.version ?? -1;
          return nextVersion >= currentVersion ? nob : current;
        });
        setRejectCode(null);
      }
    },
    onRejected: (code, message) => {
      setRejectCode(code);
      setNotice(message);
    },
  });

  const isDemoBloodBound = isBloodBoundDemoRoom(roomId);
  if (isDemoBloodBound) {
    return (
      <>
        <ConnectionStatusBadge />
        <BloodBoundPlayPage roomId={roomId} room={room} />
      </>
    );
  }

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
    if (room.gameId === WHERES_THE_BONE_ID) {
      return (
        <>
          <ConnectionStatusBadge />
          <WheresTheBonePlayPage
            room={room}
            view={wheresTheBone.view}
            snapshotPending={wheresTheBone.snapshotPending}
            snapshotError={wheresTheBone.snapshotError}
            notice={wheresTheBone.notice}
            rejectCode={wheresTheBone.rejectCode}
            sendCommand={wheresTheBone.sendCommand}
          />
        </>
      );
    }
    if (room.gameId === LIARS_NUMBER_ID) {
      return (
        <>
          <ConnectionStatusBadge />
          <LiarsNumberPlayPage
            room={room}
            view={liarsNumber.view}
            snapshotPending={liarsNumber.snapshotPending}
            snapshotError={liarsNumber.snapshotError}
            notice={liarsNumber.notice}
            rejectCode={liarsNumber.rejectCode}
            sendCommand={liarsNumber.sendCommand}
          />
        </>
      );
    }
    if (room.gameId === BLOOD_BOUND_ID) {
      return (
        <>
          <ConnectionStatusBadge />
          <BloodBoundPlayPage
            roomId={roomId}
            room={room}
            view={bloodBound.view}
            snapshotPending={bloodBound.snapshotPending}
            snapshotError={bloodBound.snapshotError}
            notice={bloodBound.notice}
            rejectCode={bloodBound.rejectCode}
            sendCommand={bloodBound.sendCommand}
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
