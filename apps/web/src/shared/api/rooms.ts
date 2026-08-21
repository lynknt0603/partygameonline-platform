import type { NobTiming } from "@/games/nob/model/nobTiming";
import { api } from "./http";
import type { RoomDto } from "./types";

export function fetchRooms(): Promise<RoomDto[]> {
  return api<RoomDto[]>("/api/v1/rooms");
}

export function fetchRoom(roomId: string): Promise<RoomDto> {
  return api<RoomDto>(`/api/v1/rooms/${roomId}`);
}

export function createRoom(input: {
  gameId: string;
  name: string;
  maxPlayers?: number;
  visibility?: "PUBLIC" | "PRIVATE";
}): Promise<RoomDto> {
  return api<RoomDto>("/api/v1/rooms", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function joinRoom(roomId: string): Promise<RoomDto> {
  return api<RoomDto>(`/api/v1/rooms/${roomId}/join`, { method: "POST" });
}

export function leaveRoom(roomId: string): Promise<void> {
  return api<void>(`/api/v1/rooms/${roomId}/leave`, { method: "POST" });
}

export function setReady(roomId: string, ready: boolean): Promise<RoomDto> {
  return api<RoomDto>(`/api/v1/rooms/${roomId}/ready`, {
    method: "PUT",
    body: JSON.stringify({ ready }),
  });
}

export function startRoom(roomId: string): Promise<RoomDto> {
  return api<RoomDto>(`/api/v1/rooms/${roomId}/start`, { method: "POST" });
}

export function closeRoom(roomId: string): Promise<void> {
  return api<void>(`/api/v1/rooms/${roomId}/close`, { method: "POST" });
}

export function updateRoomSettings(
  roomId: string,
  body: { nob: NobTiming },
): Promise<RoomDto> {
  return api<RoomDto>(`/api/v1/rooms/${roomId}/settings`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
