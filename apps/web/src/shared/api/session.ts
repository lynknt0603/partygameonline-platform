import { api, clearCsrf, ensureCsrf } from "./http";
import type { SessionDto } from "./types";

const NAME_KEY = "pgo.displayName";
const SESSION_KEY = "pgo.session";

export function cacheSession(session: SessionDto): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    storeDisplayName(session.displayName);
  } catch {
    /* ignore quota */
  }
}

export function cachedSession(): SessionDto | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<SessionDto>;
    if (typeof parsed.playerId !== "string" || typeof parsed.displayName !== "string") {
      return null;
    }
    return {
      playerId: parsed.playerId,
      displayName: parsed.displayName,
      kind: typeof parsed.kind === "string" ? parsed.kind : "GUEST",
      currentRoomId: typeof parsed.currentRoomId === "string" ? parsed.currentRoomId : null,
    };
  } catch {
    return null;
  }
}

export function storedDisplayName(): string {
  const value = localStorage.getItem(NAME_KEY)?.trim();
  return value && value.length > 0 ? value.slice(0, 32) : "Player";
}

export function storeDisplayName(name: string): void {
  localStorage.setItem(NAME_KEY, name.trim().slice(0, 32));
}

export async function fetchSession(): Promise<SessionDto> {
  return api<SessionDto>("/api/v1/session/me");
}

export async function createGuest(displayName: string): Promise<SessionDto> {
  storeDisplayName(displayName);
  const session = await api<SessionDto>("/api/v1/session/guest", {
    method: "POST",
    body: JSON.stringify({ displayName: displayName.trim().slice(0, 32) }),
  });
  cacheSession(session);
  return session;
}

export async function endSession(): Promise<void> {
  await api<void>("/api/v1/session", { method: "DELETE" });
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  clearCsrf();
}

export async function bootstrapSession(): Promise<SessionDto> {
  await ensureCsrf();
  try {
    const session = await fetchSession();
    cacheSession(session);
    return session;
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
      return createGuest(storedDisplayName());
    }
    throw error;
  }
}
