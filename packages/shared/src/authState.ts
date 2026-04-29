export type AuthStatus = "loading" | "guest" | "ready";

export function isResolvedAuthStatus(status: AuthStatus): boolean {
  return status === "guest" || status === "ready";
}
