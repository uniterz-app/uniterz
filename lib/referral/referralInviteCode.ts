/**
 * 紹介招待コード（docs/referral-design.md）
 * コミュニティ招待コードとは別系統。
 */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** signup /r/ からのクエリキー */
export const REFERRAL_INVITE_QUERY_KEYS = ["invite", "code", "ref"] as const;

export function normalizeReferralInviteCode(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}

export function isValidReferralInviteCodeFormat(code: string): boolean {
  const c = normalizeReferralInviteCode(code);
  // UNIT-XXXX または 6〜16 英数ハイフン
  if (!c) return false;
  if (c.length < 4 || c.length > 20) return false;
  return /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(c);
}

export function generateReferralInviteCode(): string {
  let body = "";
  for (let i = 0; i < 4; i++) {
    body += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `UNIT-${body}`;
}

/** URLSearchParams / クエリオブジェクトから招待コードを拾う */
export function pickReferralInviteCodeFromSearch(
  search: string | URLSearchParams | Record<string, string | string[] | undefined>
): string {
  let params: URLSearchParams;
  if (typeof search === "string") {
    params = new URLSearchParams(
      search.startsWith("?") ? search.slice(1) : search
    );
  } else if (search instanceof URLSearchParams) {
    params = search;
  } else {
    params = new URLSearchParams();
    for (const key of REFERRAL_INVITE_QUERY_KEYS) {
      const v = search[key];
      if (typeof v === "string" && v) params.set(key, v);
      else if (Array.isArray(v) && v[0]) params.set(key, v[0]);
    }
  }
  for (const key of REFERRAL_INVITE_QUERY_KEYS) {
    const raw = params.get(key);
    if (!raw) continue;
    const code = normalizeReferralInviteCode(raw);
    if (isValidReferralInviteCodeFormat(code)) return code;
  }
  return "";
}

export function buildReferralInvitePath(code: string): string {
  const c = normalizeReferralInviteCode(code);
  return `/r/${encodeURIComponent(c)}`;
}

export function buildReferralInviteSignupPath(
  code: string,
  platform: "mobile" | "web" = "mobile"
): string {
  const c = normalizeReferralInviteCode(code);
  const base = platform === "mobile" ? "/mobile/signup" : "/web/signup";
  return `${base}?invite=${encodeURIComponent(c)}`;
}
