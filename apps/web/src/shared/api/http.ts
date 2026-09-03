import { ApiError, type ApiErrorBody } from "./types";
import { readAccessToken } from "./tokenStorage";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

function resolveUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await requestJson<T>(path, init)).data;
}

export interface ApiResponseResult<T> {
  data: T;
  status: number;
  etag: string | null;
}

export async function apiResponse<T>(path: string, init: RequestInit = {}): Promise<ApiResponseResult<T>> {
  return requestJson<T>(path, init);
}

async function requestJson<T>(path: string, init: RequestInit): Promise<ApiResponseResult<T>> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const accessToken = readAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  let response: Response;
  try {
    response = await fetch(resolveUrl(path), { ...init, method, headers });
  } catch {
    throw new ApiError(0, "SERVER_UNREACHABLE", "SERVER_UNREACHABLE");
  }
  if (response.status === 304) {
    return { data: undefined as T, status: response.status, etag: response.headers.get("ETag") };
  }
  if (response.status === 204) {
    return { data: undefined as T, status: response.status, etag: response.headers.get("ETag") };
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
    throw new ApiError(response.status, code, message);
  }
  return { data: data as T, status: response.status, etag: response.headers.get("ETag") };
}
