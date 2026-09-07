import { api } from "@/shared/api/http";
import { realtime } from "@/shared/api/ws";
import type { RoomDto } from "@/shared/api/types";
import { LIARS_NUMBER_ID, parseLiarsNumberView, type LiarsNumberView } from "../model/liarsNumberTypes";

export type LiarsNumberCommand = {
  type: "SELECT_CARD" | "SELECT_TARGET" | "DECLARE_TYPE" | "GUESS" | "PEEK_AND_PASS" | "SELECT_PASS_TARGET" | "PASS_DECLARE_TYPE";
  cardId?: string;
  targetPlayerId?: string;
  declaredType?: number;
  guess?: "TRUE" | "FALSE";
};

export function startLiarsNumberGame(roomId: string): Promise<RoomDto> {
  return api<RoomDto>(`/api/v1/games/${LIARS_NUMBER_ID}/rooms/${roomId.toUpperCase()}/start`, { method: "POST" });
}

export async function fetchLiarsNumberSnapshot(roomId: string): Promise<LiarsNumberView | null> {
  const raw = await api<unknown>(`/api/v1/games/${LIARS_NUMBER_ID}/rooms/${roomId.toUpperCase()}/snapshot`);
  return parseLiarsNumberView(raw);
}

export function sendLiarsNumberCommand(roomId: string, command: LiarsNumberCommand, expectedVersion?: number): string {
  return realtime.send("GAME_ACTION", roomId, {
    commandId: crypto.randomUUID(),
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
    ...command,
  });
}
