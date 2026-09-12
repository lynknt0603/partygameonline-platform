export interface ActiveGameSession {
  roomId: string;
  gameId: string;
  gameTitle?: string;
  joinedAt: number;
}

const ACTIVE_GAME_KEY = "pgo.activeGame";

export function readActiveGame(): ActiveGameSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(ACTIVE_GAME_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ActiveGameSession;
    if (parsed && typeof parsed.roomId === "string" && typeof parsed.gameId === "string") {
      // Sessions older than 2 hours are considered stale
      if (Date.now() - (parsed.joinedAt || 0) > 2 * 60 * 60 * 1000) {
        clearActiveGame();
        return null;
      }
      return parsed;
    }
  } catch {
    /* ignore parse errors */
  }
  return null;
}

export function saveActiveGame(data: { roomId: string; gameId: string; gameTitle?: string }): void {
  if (typeof window === "undefined") {
    return;
  }
  const normalized = data.roomId.trim().toUpperCase();
  if (normalized.toLowerCase().includes("demo")) {
    return;
  }
  try {
    const session: ActiveGameSession = {
      roomId: normalized,
      gameId: data.gameId,
      gameTitle: data.gameTitle,
      joinedAt: Date.now(),
    };
    localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(session));
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event("pgo:activeGame"));
    }
  } catch {
    /* ignore storage errors */
  }
}

export function clearActiveGame(targetRoomId?: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (targetRoomId) {
      const current = readActiveGame();
      if (current && current.roomId.toUpperCase() !== targetRoomId.trim().toUpperCase()) {
        return; // Don't clear if it refers to another room
      }
    }
    localStorage.removeItem(ACTIVE_GAME_KEY);
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event("pgo:activeGame"));
    }
  } catch {
    /* ignore */
  }
}

/**
 * Kiểm tra xem có xung đột trận đấu hay không:
 * - Nếu không có activeGame -> false (không xung đột)
 * - Nếu không có targetRoomId (hoặc rỗng, ví dụ đang muốn Tạo phòng mới) -> true (xung đột vì đang dở trận)
 * - Nếu targetRoomId khác roomId hiện tại -> true (xung đột vì muốn vào phòng khác trong khi trận cũ chưa kết thúc)
 * - Nếu targetRoomId trùng roomId hiện tại -> false (hợp lệ để vào lại phòng đang chơi)
 */
export function checkActiveGameConflict(
  activeGame: ActiveGameSession | null,
  targetRoomId?: string | null
): boolean {
  if (!activeGame) {
    return false;
  }
  const cleanTarget = targetRoomId?.trim().toUpperCase();
  if (!cleanTarget) {
    return true;
  }
  return activeGame.roomId.toUpperCase() !== cleanTarget;
}

