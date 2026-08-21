import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/shared/api/types";
import { closeRoom, createRoom, fetchRoom, fetchRooms, joinRoom, leaveRoom, setReady, startRoom, updateRoomSettings } from "@/shared/api/rooms";
import type { NobTiming } from "@/games/nob/model/nobTiming";
import { toRoomView } from "@/shared/lobby/roomView";
import { useSessionStore } from "@/shared/state/sessionStore";

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    select: (rooms) => rooms.map(toRoomView),
  });
}

export function useRoom(roomId: string | undefined) {
  const normalized = roomId?.toUpperCase();
  return useQuery({
    queryKey: ["room", normalized],
    queryFn: () => fetchRoom(normalized!),
    enabled: Boolean(normalized),
    select: toRoomView,
  });
}

export function usePlayGame() {
  const navigate = useNavigate();
  const refresh = useSessionStore((state) => state.refresh);
  const session = useSessionStore((state) => state.session);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      try {
        return await createRoom({
          gameId,
          name: `${session?.displayName ?? "Player"}`,
          visibility: "PUBLIC",
        });
      } catch (error) {
        if (error instanceof ApiError && error.errorCode === "ALREADY_IN_ROOM") {
          await refresh();
          const current = useSessionStore.getState().session?.currentRoomId;
          if (current) {
            return fetchRoom(current);
          }
        }
        throw error;
      }
    },
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void refresh();
      navigate(`/rooms/${room.id}`);
    },
  });
}

export function useJoinRoom() {
  const navigate = useNavigate();
  const refresh = useSessionStore((state) => state.refresh);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => joinRoom(roomId.toUpperCase()),
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void queryClient.setQueryData(["room", room.id], room);
      void refresh();
      navigate(`/rooms/${room.id}`);
    },
  });
}

export function useLeaveRoom() {
  const navigate = useNavigate();
  const refresh = useSessionStore((state) => state.refresh);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => leaveRoom(roomId.toUpperCase()),
    onSuccess: (_void, roomId) => {
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void queryClient.removeQueries({ queryKey: ["room", roomId.toUpperCase()] });
      void refresh();
      navigate("/rooms");
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.errorCode === "NOT_ROOM_MEMBER" || error.errorCode === "ROOM_NOT_FOUND")) {
        void refresh();
        navigate("/rooms");
      }
    },
  });
}

export function useReadyRoom(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ready: boolean) => setReady(roomId, ready),
    onSuccess: (room) => {
      queryClient.setQueryData(["room", roomId], room);
    },
  });
}

export function useCloseRoom() {
  const navigate = useNavigate();
  const refresh = useSessionStore((state) => state.refresh);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => closeRoom(roomId.toUpperCase()),
    onSuccess: (_void, roomId) => {
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void queryClient.removeQueries({ queryKey: ["room", roomId.toUpperCase()] });
      void refresh();
      navigate("/rooms");
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.errorCode === "ROOM_CLOSED" || error.errorCode === "ROOM_NOT_FOUND")) {
        void refresh();
        navigate("/rooms");
      }
    },
  });
}

export function useUpdateRoomSettings(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nob: NobTiming) => updateRoomSettings(roomId.toUpperCase(), { nob }),
    onSuccess: (room) => {
      queryClient.setQueryData(["room", roomId.toUpperCase()], room);
      queryClient.setQueryData(["room", room.id], room);
    },
  });
}

export function useStartRoom(roomId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startRoom(roomId),
    onSuccess: (room) => {
      queryClient.setQueryData(["room", roomId], room);
      navigate(`/play/${room.id}`);
    },
  });
}
