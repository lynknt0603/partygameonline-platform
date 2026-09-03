const ACCESS_TOKEN_KEY = "pgo.accessToken";

export function readAccessToken(): string | null {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)?.trim();
    return token || null;
  } catch {
    return null;
  }
}

export function storeAccessToken(token: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    /* ignore unavailable storage */
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* ignore unavailable storage */
  }
}
