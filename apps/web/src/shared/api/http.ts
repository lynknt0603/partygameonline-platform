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
          throw new ApiError(response.status, "CSRF_BOOTSTRAP_FAILED", "SERVER_UNREACHABLE");
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
  return requestJson<T>(path, init, true);
}

async function requestJson<T>(path: string, init: RequestInit, retryCsrf: boolean): Promise<T> {
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
  let response: Response;
  try {
    response = await fetch(path, { ...init, method, headers, credentials: "include" });
  } catch {
    throw new ApiError(0, "SERVER_UNREACHABLE", "SERVER_UNREACHABLE");
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    const body = (data ?? {}) as ApiErrorBody;
    const code = body.errorCode ?? "ERROR";
    const message = body.message ?? response.statusText;
    if (retryCsrf && response.status === 403 && /csrf/i.test(`${code} ${message}`)) {
      clearCsrf();
      return requestJson<T>(path, init, false);
    }
    throw new ApiError(response.status, code, message);
  }
  return data as T;
}
