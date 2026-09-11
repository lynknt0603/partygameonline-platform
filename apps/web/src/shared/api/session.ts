import { api } from "./http";
import { clearAccessToken, readAccessToken, storeAccessToken } from "./tokenStorage";
import { DISPLAY_NAME_MAX_LENGTH, type AuthPayload, type RegisterPayload, type SessionDto } from "./types";

const NAME_KEY = "pgo.displayName";
const SESSION_KEY = "pgo.session";
export function cacheSession(session: SessionDto): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    storeAccessToken(session.accessToken);
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
    const accessToken = typeof parsed.accessToken === "string" ? parsed.accessToken : readAccessToken();
    if (typeof parsed.playerId !== "string" || typeof parsed.displayName !== "string" || !accessToken) {
      return null;
    }
    return {
      playerId: parsed.playerId,
      displayName: parsed.displayName,
      kind: typeof parsed.kind === "string" ? parsed.kind : "GUEST",
      avatarUrl: typeof parsed.avatarUrl === "string" ? parsed.avatarUrl : null,
      currentRoomId: typeof parsed.currentRoomId === "string" ? parsed.currentRoomId : null,
      accessToken,
    };
  } catch {
    return null;
  }
}

export function storedDisplayName(): string {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlName = params.get("name") || params.get("guest") || params.get("player");
      if (urlName && urlName.trim().length > 0) {
        return urlName.trim().slice(0, DISPLAY_NAME_MAX_LENGTH);
      }
    } catch {
      /* ignore */
    }
  }
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
    clearAccessToken();
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
  }
}

export async function bootstrapSession(): Promise<SessionDto> {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get("token")?.trim();
      if (queryToken) {
        storeAccessToken(queryToken);
      }
    } catch {
      /* ignore */
    }
  }
  const desiredName = storedDisplayName();
  if (!readAccessToken()) {
    return createGuest(desiredName);
  }
  try {
    const fetchedSession = await fetchSession();
    let session = fetchedSession.kind === "MEMBER"
      ? fetchedSession
      : { ...fetchedSession, displayName: desiredName };
    if (fetchedSession.kind !== "MEMBER" && fetchedSession.displayName !== desiredName) {
      try {
        session = await updateDisplayName(desiredName);
      } catch {
        /* ignore */
      }
    }
    cacheSession(session);
    return session;
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
      clearStoredIdentity();
      return createGuest(desiredName);
    }
    throw error;
  }
}
