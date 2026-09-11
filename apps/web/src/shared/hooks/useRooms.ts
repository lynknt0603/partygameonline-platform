import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/shared/api/types";
import { addBotToRoom, closeRoom, createRoom, fetchRoom, fetchRooms, joinRoom, kickRoom, leaveRoom, setReady, startRoom, updateRoomSettings } from "@/shared/api/rooms";
import type { NobTiming } from "@/games/nob/model/nobTiming";
import type { NotInMyPotSettings } from "@/games/notInMyPot/model/notInMyPotSettings";
import type { WheresTheBoneSettings } from "@/games/wheresTheBone/model/wheresTheBoneSettings";
import type { LiarsNumberSettings } from "@/games/liarsNumber/model/liarsNumberSettings";
import type { BloodBoundSettings } from "@/games/bloodBound/model/bloodBoundSettings";
import { toRoomView } from "@/shared/lobby/roomView";
import { useSessionStore } from "@/shared/state/sessionStore";
import { memberLoginPath } from "@/shared/auth/memberAccess";
import { clearActiveGame } from "@/shared/state/activeGameStorage";
import { cacheSession } from "@/shared/api/session";

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    select: (rooms) => rooms.map(toRoomView),
  });
}

export function useRoom(roomId: string | undefined) {
  const normalized = roomId?.toUpperCase();
  const isDemo = roomId?.toLowerCase().includes("demo");
  return useQuery({
    queryKey: ["room", normalized],
    queryFn: () => fetchRoom(normalized!),
    enabled: Boolean(normalized) && !isDemo,
    select: toRoomView,
  });
}

export function usePlayGame() {
  const navigate = useNavigate();
  const refresh = useSessionStore((state) => state.refresh);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gameId: string) => {
      const session = useSessionStore.getState().session;
      if (session?.kind !== "MEMBER") {
        navigate(memberLoginPath());
        throw new ApiError(401, "MEMBER_LOGIN_REQUIRED", "Login is required to play now");
      }

      const waitingRooms = (await fetchRooms())
        .filter((room) => room.gameId === gameId && room.status === "WAITING" && room.players.length < room.maxPlayers)
        .sort((left, right) => right.players.length - left.players.length);

      for (const room of waitingRooms) {
        try {
          return await joinRoom(room.id);
        } catch (error) {
          if (error instanceof ApiError && ["ROOM_FULL", "ROOM_NOT_FOUND", "ROOM_ALREADY_STARTED"].includes(error.errorCode)) {
            continue;
          }
          if (error instanceof ApiError && ["ALREADY_IN_ROOM", "ROOM_ALREADY_JOINED"].includes(error.errorCode)) {
            await refresh();
            const current = useSessionStore.getState().session?.currentRoomId;
            if (current) {
              return fetchRoom(current);
            }
          }
          throw error;
        }
      }

      try {
        return await createRoom({
          gameId,
          name: session.displayName,
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
    onError: (error, gameId) => {
      if (error instanceof ApiError && (error.errorCode === "MEMBER_LOGIN_REQUIRED" || error.errorCode === "UNAUTHENTICATED")) {
        navigate(memberLoginPath());
        return;
      }
      if (error instanceof ApiError && error.errorCode === "SERVER_UNREACHABLE") {
        navigate(`/play/demo-${gameId}`);
        return;
      }
    },
  });
}

export function useJoinRoom() {
  const navigate = useNavigate();
  const refresh = useSessionStore((state) => state.refresh);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => {
      if (useSessionStore.getState().session?.kind !== "MEMBER") {
        navigate(memberLoginPath());
        throw new ApiError(401, "MEMBER_LOGIN_REQUIRED", "Login is required to join a room");
      }
      return joinRoom(roomId.toUpperCase());
    },
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void queryClient.setQueryData(["room", room.id], room);
      void refresh();
      navigate(`/rooms/${room.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.errorCode === "MEMBER_LOGIN_REQUIRED" || error.errorCode === "UNAUTHENTICATED")) {
        navigate(memberLoginPath());
      }
    },
  });
}

export function useCreateRoom() {
  const navigate = useNavigate();
  const refresh = useSessionStore((state) => state.refresh);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      gameId: string;
      name: string;
      maxPlayers: number;
      visibility: "PUBLIC" | "PRIVATE";
    }) => {
      if (useSessionStore.getState().session?.kind !== "MEMBER") {
        navigate(memberLoginPath());
        throw new ApiError(401, "MEMBER_LOGIN_REQUIRED", "Login is required to create a room");
      }
      try {
        return await createRoom(input);
      } catch (error) {
        if (error instanceof ApiError && error.errorCode === "ALREADY_IN_ROOM") {
          // Tự động dọn phòng cũ: Người dùng muốn tạo phòng mới nên ưu tiên rời phòng cũ
          const staleRoomId = useSessionStore.getState().session?.currentRoomId;
          if (staleRoomId) {
            try {
              await leaveRoom(staleRoomId.toUpperCase());
            } catch {
              /* ignore error when leaving stale room */
            }
          }
          clearActiveGame();
          await refresh();
          const session = useSessionStore.getState().session;
          if (session?.currentRoomId) {
            const updated = { ...session, currentRoomId: null };
            useSessionStore.setState({ session: updated });
            cacheSession(updated);
          }
          // Thử lại tạo phòng mới ngay lập tức
          try {
            return await createRoom(input);
          } catch (retryError) {
            if (retryError instanceof ApiError && retryError.errorCode === "ALREADY_IN_ROOM") {
              await refresh();
              const current = useSessionStore.getState().session?.currentRoomId;
              if (current) {
                try {
                  return await fetchRoom(current);
                } catch {
                  /* ignore */
                }
              }
            }
            throw retryError;
          }
        }
        throw error;
      }
    },
    onSuccess: (room) => {
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void queryClient.setQueryData(["room", room.id], room);
      void refresh();
      navigate(`/rooms/${room.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && (error.errorCode === "MEMBER_LOGIN_REQUIRED" || error.errorCode === "UNAUTHENTICATED")) {
        navigate(memberLoginPath());
      }
    },
  });
}

export function useLeaveRoom() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const purgeRoomCache = (roomId?: string) => {
    if (roomId) {
      clearActiveGame(roomId.toUpperCase());
    }
    clearActiveGame();
    const session = useSessionStore.getState().session;
    if (session && (!roomId || session.currentRoomId?.toUpperCase() === roomId.toUpperCase())) {
      const updated = { ...session, currentRoomId: null };
      useSessionStore.setState({ session: updated });
      cacheSession(updated);
    }
    if (roomId) {
      queryClient.removeQueries({ queryKey: ["room", roomId.toUpperCase()] });
    }
    queryClient.removeQueries({ queryKey: ["room"] });
  };

  return useMutation({
    mutationFn: async (roomId: string) => {
      const normalized = roomId.toUpperCase();
      purgeRoomCache(normalized);
      try {
        await leaveRoom(normalized);
      } catch (error) {
        if (error instanceof ApiError && (error.errorCode === "NOT_ROOM_MEMBER" || error.errorCode === "ROOM_NOT_FOUND")) {
          return;
        }
        throw error;
      }
    },
    onSuccess: async (_void, roomId) => {
      purgeRoomCache(roomId);
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void useSessionStore.getState().refresh();
      navigate("/rooms");
    },
    onError: async (_error, roomId) => {
      purgeRoomCache(roomId);
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void useSessionStore.getState().refresh();
      navigate("/rooms");
    },
  });
}

export function useKickRoom(roomId: string) {
  const queryClient = useQueryClient();
  const normalized = roomId.toUpperCase();
  return useMutation({
    mutationFn: (playerId: string) => kickRoom(normalized, playerId),
    onSuccess: (room) => {
      queryClient.setQueryData(["room", normalized], room);
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useAddBot(roomId: string) {
  const queryClient = useQueryClient();
  const normalized = roomId.toUpperCase();
  return useMutation({
    mutationFn: (options?: { botType?: "NORMAL" | "AI" }) => addBotToRoom(normalized, options?.botType ?? "NORMAL"),
    onSuccess: (room) => {
      queryClient.setQueryData(["room", normalized], room);
      void queryClient.invalidateQueries({ queryKey: ["room", normalized] });
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useReadyRoom(roomId: string) {
  const queryClient = useQueryClient();
  const normalized = roomId.toUpperCase();
  return useMutation({
    mutationFn: (ready: boolean) => setReady(normalized, ready),
    onSuccess: (room) => {
      queryClient.setQueryData(["room", normalized], room);
    },
  });
}

export function useCloseRoom() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const purgeRoomCache = (roomId?: string) => {
    if (roomId) {
      clearActiveGame(roomId.toUpperCase());
    }
    clearActiveGame();
    const session = useSessionStore.getState().session;
    if (session && (!roomId || session.currentRoomId?.toUpperCase() === roomId.toUpperCase())) {
      const updated = { ...session, currentRoomId: null };
      useSessionStore.setState({ session: updated });
      cacheSession(updated);
    }
    if (roomId) {
      queryClient.removeQueries({ queryKey: ["room", roomId.toUpperCase()] });
    }
    queryClient.removeQueries({ queryKey: ["room"] });
  };

  return useMutation({
    mutationFn: async (roomId: string) => {
      const normalized = roomId.toUpperCase();
      purgeRoomCache(normalized);
      try {
        await closeRoom(normalized);
      } catch (error) {
        if (error instanceof ApiError && (error.errorCode === "ROOM_CLOSED" || error.errorCode === "ROOM_NOT_FOUND")) {
          return;
        }
        throw error;
      }
    },
    onSuccess: async (_void, roomId) => {
      purgeRoomCache(roomId);
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void useSessionStore.getState().refresh();
      navigate("/rooms");
    },
    onError: async (_error, roomId) => {
      purgeRoomCache(roomId);
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      void useSessionStore.getState().refresh();
      navigate("/rooms");
    },
  });
}

export function useUpdateRoomSettings(roomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: {
      nob?: NobTiming;
      notInMyPot?: NotInMyPotSettings;
      wheresTheBone?: WheresTheBoneSettings;
      liarsNumber?: LiarsNumberSettings;
      bloodBound?: BloodBoundSettings;
      locked?: boolean;
      maxPlayers?: number;
    }) => updateRoomSettings(roomId.toUpperCase(), settings),
    onSuccess: (room) => {
      queryClient.setQueryData(["room", roomId.toUpperCase()], room);
      queryClient.setQueryData(["room", room.id], room);
      void queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useStartRoom(roomId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const normalized = roomId.toUpperCase();
  return useMutation({
    mutationFn: () => startRoom(normalized),
    onSuccess: (room) => {
      queryClient.setQueryData(["room", normalized], room);
      navigate(`/play/${room.id}`);
    },
  });
}
