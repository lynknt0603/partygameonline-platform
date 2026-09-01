import { api, clearCsrf, ensureCsrf } from "./http";
import { DISPLAY_NAME_MAX_LENGTH, type AuthPayload, type RegisterPayload, type SessionDto } from "./types";

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
      avatarUrl: typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : null,
      currentRoomId: typeof parsed.currentRoomId === "string" ? parsed.currentRoomId : null,
    };
  } catch {
    return null;
  }
}

export function storedDisplayName(): string {
  const value = localStorage.getItem(NAME_KEY)?.trim();
  return value && value.length > 0 ? value.slice(0, DISPLAY_NAME_MAX_LENGTH) : "Player";
}

export function storeDisplayName(name: string): void {
  localStorage.setItem(NAME_KEY, name.trim().slice(0, DISPLAY_NAME_MAX_LENGTH));
}

export function clearStoredIdentity(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(NAME_KEY);
  } catch {
    /* ignore unavailable storage */
  }
}

export async function fetchSession(): Promise<SessionDto> {
  return api<SessionDto>("/api/v1/session/me");
}

export async function createGuest(displayName: string): Promise<SessionDto> {
  storeDisplayName(displayName);
  const session = await api<SessionDto>("/api/v1/session/guest", {
    method: "POST",
    body: JSON.stringify({ displayName: displayName.trim().slice(0, DISPLAY_NAME_MAX_LENGTH) }),
  });
  cacheSession(session);
  return session;
}

export async function updateDisplayName(displayName: string, hideGameStats?: boolean): Promise<SessionDto> {
  const session = await api<SessionDto>("/api/v1/profile/me", {
    method: "PATCH",
    body: JSON.stringify({
      displayName: displayName.trim().slice(0, DISPLAY_NAME_MAX_LENGTH),
      ...(hideGameStats === undefined ? {} : { hideGameStats }),
    }),
  });
  cacheSession(session);
  return session;
}

export async function updateAvatar(avatarKey: string): Promise<SessionDto> {
  const session = await api<SessionDto>("/api/v1/profile/me/avatar", {
    method: "PATCH",
    body: JSON.stringify({ avatarKey }),
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

export async function registerUser(payload: RegisterPayload): Promise<SessionDto> {
  const session = await api<SessionDto>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  cacheSession(session);
  return session;
}

export async function endSession(): Promise<void> {
  try {
    await api<void>("/api/v1/session", { method: "DELETE" });
  } finally {
    clearStoredIdentity();
    clearCsrf();
  }
}

export async function bootstrapSession(): Promise<SessionDto> {
  await ensureCsrf();
  try {
    const fetchedSession = await fetchSession();
    const session = fetchedSession.kind === "MEMBER"
      ? fetchedSession
      : { ...fetchedSession, displayName: "Player" };
    if (fetchedSession.kind !== "MEMBER") {
      clearStoredIdentity();
    }
    cacheSession(session);
    return session;
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
      clearStoredIdentity();
      return createGuest("Player");
    }
    throw error;
  }
}
