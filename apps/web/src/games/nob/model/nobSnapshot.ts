import { api } from "@/shared/api/http";
import { parseNobView, type NobView } from "./nobTypes";

export async function fetchNobSnapshot(roomId: string): Promise<NobView | null> {
  const raw = await api<unknown>(`/api/v1/games/nob/rooms/${roomId.toUpperCase()}/snapshot`);
  return parseNobView(raw);
}
