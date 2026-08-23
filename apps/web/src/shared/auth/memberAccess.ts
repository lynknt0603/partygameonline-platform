export function memberLoginPath(returnTo?: string): string {
  const target = returnTo || `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const params = new URLSearchParams({ required: "member", returnTo: target || "/" });
  return `/login?${params.toString()}`;
}

export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}
