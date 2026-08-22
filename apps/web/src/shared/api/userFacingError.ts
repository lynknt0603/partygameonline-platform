import type { MessageKey } from "@/shared/i18n/messages";
import { ApiError } from "./types";

const TECHNICAL = /csrf|token is missing|token is invalid|exception|stack|forbidden|unauthorized|sql|jdbc|null pointer|server_unreachable/i;

export function toUserFacingError(error: unknown, t: (key: MessageKey) => string): string | null {
  if (error == null || error === "") {
    return null;
  }
  const code = error instanceof ApiError ? error.errorCode : "";
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!code && !raw) {
    return null;
  }
  if (isUnreachable(code, raw, error)) {
    return `${t("sessionError")} ${t("reloadThenRetry")}`;
  }
  if (raw && !TECHNICAL.test(raw)) {
    return raw;
  }
  return `${t("sessionError")} ${t("reloadThenRetry")}`;
}

function isUnreachable(code: string, raw: string, error: unknown): boolean {
  if (
    code === "CSRF_REJECTED" ||
    code === "CSRF_BOOTSTRAP_FAILED" ||
    code === "SERVER_UNREACHABLE" ||
    raw === "SERVER_UNREACHABLE"
  ) {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  return TECHNICAL.test(raw) || /failed to fetch|networkerror|load failed/i.test(raw);
}
