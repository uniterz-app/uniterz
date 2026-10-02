/** Custom Claim 名（クライアント可） */
export const ADMIN_CLAIM = "admin" as const;

export function hasAdminClaim(
  claims: Record<string, unknown> | null | undefined
): boolean {
  return claims?.[ADMIN_CLAIM] === true;
}
