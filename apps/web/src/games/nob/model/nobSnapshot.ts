import { apiResponse } from "@/shared/api/http";
import { parseNobView, type NobView } from "./nobTypes";

interface CachedSnapshot {
  etag: string;
  view: NobView;
}

const snapshotCache = new Map<string, CachedSnapshot>();
const MAX_CACHED_ROOMS = 8;

export async function fetchNobSnapshot(roomId: string): Promise<NobView | null> {
  const normalizedRoomId = roomId.toUpperCase();
  const cached = snapshotCache.get(normalizedRoomId);
  const response = await apiResponse<unknown>(`/api/v1/games/nob/rooms/${normalizedRoomId}/snapshot`, {
    headers: cached ? { "If-None-Match": cached.etag } : undefined,
  });
  if (response.status === 304) {
    return cached?.view ?? null;
  }
  const view = parseNobView(response.data);
  if (view && response.etag) {
    snapshotCache.delete(normalizedRoomId);
    snapshotCache.set(normalizedRoomId, { etag: response.etag, view });
    while (snapshotCache.size > MAX_CACHED_ROOMS) {
      const oldestRoomId = snapshotCache.keys().next().value as string | undefined;
      if (!oldestRoomId) {
        break;
      }
      snapshotCache.delete(oldestRoomId);
    }
  }
  return view;
}
