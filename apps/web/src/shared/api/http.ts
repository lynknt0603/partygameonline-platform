import { ApiError, type ApiErrorBody } from "./types";

interface CsrfBootstrap {
  headerName: string;
  token: string;
}

let csrf: CsrfBootstrap | null = null;
let csrfPromise: Promise<CsrfBootstrap> | null = null;

export async function ensureCsrf(): Promise<CsrfBootstrap> {
  if (csrf) {
    return csrf;
  }
  if (!csrfPromise) {
    csrfPromise = fetch("/api/v1/csrf", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new ApiError(response.status, "CSRF_BOOTSTRAP_FAILED", "Could not load CSRF token");
        }
        const body = (await response.json()) as CsrfBootstrap;
        csrf = body;
        return body;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

export function clearCsrf(): void {
  csrf = null;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const token = await ensureCsrf();
    headers.set(token.headerName, token.token);
  }
  const response = await fetch(path, { ...init, method, headers, credentials: "include" });
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    const body = (data ?? {}) as ApiErrorBody;
    throw new ApiError(response.status, body.errorCode ?? "ERROR", body.message ?? response.statusText);
  }
  return data as T;
}
