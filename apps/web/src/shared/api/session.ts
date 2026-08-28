import { api, clearCsrf, ensureCsrf } from "./http";
import type { AuthPayload, SessionDto } from "./types";

const NAME_KEY = "pgo.displayName";
const SESSION_KEY = "pgo.session";
const AVATAR_KEY_PREFIX = "pgo.avatarUrl.";

function avatarKey(playerId: string): string {
  return `${AVATAR_KEY_PREFIX}${playerId}`;
}

export function storedAvatarUrl(playerId: string): string | null {
  try {
    const value = localStorage.getItem(avatarKey(playerId))?.trim();
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function storeAvatarUrl(playerId: string, avatarUrl: string): void {
  try {
    localStorage.setItem(avatarKey(playerId), avatarUrl);
  } catch {
    /* ignore quota */
  }
}

export function cacheSession(session: SessionDto): void {
  try {
    const avatarUrl = session.avatarUrl ?? storedAvatarUrl(session.playerId);
    const nextSession = avatarUrl ? { ...session, avatarUrl } : session;
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    if (avatarUrl) {
      storeAvatarUrl(session.playerId, avatarUrl);
    }
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
      avatarUrl:
        typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : storedAvatarUrl(parsed.playerId),
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

export async function updateDisplayName(displayName: string): Promise<SessionDto> {
  const session = await api<SessionDto>("/api/v1/profile/me", {
    method: "PATCH",
    body: JSON.stringify({ displayName: displayName.trim().slice(0, 32) }),
  });
  cacheSession(session);
  return session;
}

export async function loginUser(payload: AuthPayload): Promise<SessionDto> {
  const session = await api<SessionDto>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  cacheSession(session);
  return session;
}

export async function registerUser(payload: AuthPayload): Promise<SessionDto> {
  const session = await api<SessionDto>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
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
