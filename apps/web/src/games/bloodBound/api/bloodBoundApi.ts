import { api } from "@/shared/api/http";
import { realtime } from "@/shared/api/ws";
import type { RoomDto } from "@/shared/api/types";
import type { BloodBoundCommand, BloodBoundView } from "../model/bloodBoundTypes";

export function startBloodBoundGame(roomId: string): Promise<RoomDto> {
  return api<RoomDto>(`/api/v1/games/blood-bound/rooms/${roomId.toUpperCase()}/start`, {
    method: "POST",
  });
}

export async function fetchBloodBoundSnapshot(roomId: string): Promise<BloodBoundView | null> {
  try {
    const raw = await api<BloodBoundView>(`/api/v1/games/blood-bound/rooms/${roomId.toUpperCase()}/snapshot`);
    return raw;
  } catch {
    return null;
  }
}

export function sendBloodBoundAction(roomId: string, command: BloodBoundCommand): string {
  const commandId = crypto.randomUUID();
  return realtime.send("GAME_ACTION", roomId, {
    commandId,
    ...command,
  });
}
