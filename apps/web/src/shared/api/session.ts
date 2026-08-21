import { api, clearCsrf, ensureCsrf } from "./http";
import type { SessionDto } from "./types";

const NAME_KEY = "pgo.displayName";

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
  return api<SessionDto>("/api/v1/session/guest", {
    method: "POST",
    body: JSON.stringify({ displayName: displayName.trim().slice(0, 32) }),
  });
}

export async function endSession(): Promise<void> {
  await api<void>("/api/v1/session", { method: "DELETE" });
  clearCsrf();
}

export async function bootstrapSession(): Promise<SessionDto> {
  await ensureCsrf();
  try {
    return await fetchSession();
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
      return createGuest(storedDisplayName());
    }
    throw error;
  }
}
