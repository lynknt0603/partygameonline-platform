import { api } from "@/shared/api/http";
import { realtime } from "@/shared/api/ws";
import type { RoomDto } from "@/shared/api/types";
import { parseNotInMyPotView, type NotInMyPotView } from "../model/notInMyPotTypes";

export interface NotInMyPotCommand {
  type:
    | "PLAY_INGREDIENT"
    | "PLAY_ACTION"
    | "SELECT_TARGET"
    | "ACKNOWLEDGE_SLOTTED_SPOON"
    | "RETURN_SHOPPING_CARDS"
    | "DECLARE_POT_READY";
  cardId?: string;
  declaredType?: string;
  actionType?: string;
  targetPlayerId?: string;
  cardIds?: string[];
}

export function startNotInMyPotGame(roomId: string): Promise<RoomDto> {
  return api<RoomDto>(`/api/v1/games/not-in-my-pot/rooms/${roomId.toUpperCase()}/start`, { method: "POST" });
}

export async function fetchNotInMyPotSnapshot(roomId: string): Promise<NotInMyPotView | null> {
  const raw = await api<unknown>(`/api/v1/games/not-in-my-pot/rooms/${roomId.toUpperCase()}/snapshot`);
  return parseNotInMyPotView(raw);
}

/**
 * Send a game command over the shared room socket. The server returns a
 * player-specific projected view in GAME_EVENTS/GAME_FINISHED, so secrets
 * never need to travel through a client-authored optimistic state.
 */
export function sendNotInMyPotCommand(
  roomId: string,
  command: NotInMyPotCommand,
  expectedVersion?: number,
): string {
  const commandId = crypto.randomUUID();
  return realtime.send("GAME_ACTION", roomId, {
    commandId,
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
    ...command,
  });
}

export async function postNotInMyPotCommand(
  roomId: string,
  command: NotInMyPotCommand,
  expectedVersion?: number,
): Promise<NotInMyPotView | null> {
  const raw = await api<unknown>(`/api/v1/games/not-in-my-pot/rooms/${roomId.toUpperCase()}/command`, {
    method: "POST",
    body: JSON.stringify({
      commandId: crypto.randomUUID(),
      ...(expectedVersion === undefined ? {} : { expectedVersion }),
      ...command,
    }),
  });
  return parseNotInMyPotView(raw);
}
