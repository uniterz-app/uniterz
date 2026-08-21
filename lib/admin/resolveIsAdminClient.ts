/**
 * クライアント共通: Custom Claim + /api/admin/session で管理者判定（UID リスト非公開）
 */
import { ADMIN_CLAIM } from "@/lib/admin/adminClaim";

type TokenUser = {
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
  getIdTokenResult: (forceRefresh?: boolean) => Promise<{
    claims: Record<string, unknown>;
  }>;
};

export async function resolveIsAdminClient(
  user: TokenUser,
  apiBaseUrl?: string | null
): Promise<boolean> {
  const base = (apiBaseUrl ?? "").replace(/\/$/, "");
  const path = `${base}/api/admin/session`;

  try {
    const token = await user.getIdToken();
    const res = await fetch(path, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        admin?: boolean;
      } | null;
      if (json?.ok === true && json.admin === true) {
        await user.getIdToken(true);
        return true;
      }
      return false;
    }
  } catch {
    // オフライン時は既存 claim にフォールバック
  }

  try {
    const result = await user.getIdTokenResult();
    return result.claims?.[ADMIN_CLAIM] === true;
  } catch {
    return false;
  }
}
