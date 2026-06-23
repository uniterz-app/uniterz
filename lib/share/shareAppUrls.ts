/** 共有・ディープリンク用の Uniterz URL 生成 */

export const DEFAULT_SHARE_APP_ORIGIN = "https://uniterz.app";

function isLocalDevOrigin(raw: string): boolean {
  try {
    const url = raw.includes("://") ? raw : `https://${raw}`;
    const { hostname } = new URL(url);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0"
    );
  } catch {
    return true;
  }
}

export function resolveShareAppOrigin(base?: string | null): string {
  const trimmed = base?.trim().replace(/\/$/, "");
  return trimmed || DEFAULT_SHARE_APP_ORIGIN;
}

/**
 * 共有リンク用オリジン（API ベース URL ではなく公開 Web オリジン）。
 * 未設定時は本番 `uniterz.app` — 開発中も localhost を貼らない。
 */
export function getShareAppOrigin(): string {
  const explicitShare = process.env.EXPO_PUBLIC_UNITERZ_SHARE_BASE_URL?.trim();
  if (explicitShare) return resolveShareAppOrigin(explicitShare);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl && !isLocalDevOrigin(appUrl)) {
    return resolveShareAppOrigin(appUrl);
  }

  return DEFAULT_SHARE_APP_ORIGIN;
}

function resolveShareLinkOrigin(appBaseUrl?: string | null): string {
  if (appBaseUrl === undefined || appBaseUrl === null) return getShareAppOrigin();
  if (isLocalDevOrigin(appBaseUrl)) return DEFAULT_SHARE_APP_ORIGIN;
  return resolveShareAppOrigin(appBaseUrl);
}

export function buildResultShareUrl(
  postId: string,
  appBaseUrl?: string | null
): string {
  const id = postId.trim();
  const origin = resolveShareLinkOrigin(appBaseUrl);
  if (!id) return origin;
  return `${origin}/mobile/result/${encodeURIComponent(id)}`;
}

export function buildProfileShareUrl(
  handle: string,
  appBaseUrl?: string | null
): string {
  const safe = encodeURIComponent(handle.trim());
  const origin = resolveShareLinkOrigin(appBaseUrl);
  return `${origin}/mobile/u/${safe}`;
}

export function buildRankingsShareUrl(appBaseUrl?: string | null): string {
  const origin = resolveShareLinkOrigin(appBaseUrl);
  return `${origin}/mobile/rankings`;
}

export function buildCommunityShareUrl(
  groupId: string,
  appBaseUrl?: string | null
): string {
  const id = groupId.trim();
  const origin = resolveShareLinkOrigin(appBaseUrl);
  if (!id) return `${origin}/mobile/leaderboards`;
  return `${origin}/mobile/communities/${encodeURIComponent(id)}`;
}

/** PNG フッター用（https:// を省略） */
export function formatShareLinkDisplay(url: string): string {
  return url.replace(/^https?:\/\//i, "");
}

export type ShareDeepLinkTarget =
  | { kind: "result"; postId: string }
  | { kind: "profile"; handle: string }
  | { kind: "rankings" }
  | { kind: "community"; groupId: string };

/**
 * 共有 URL / Universal Link / カスタムスキームをアプリ内ルートに解釈。
 * 例: https://uniterz.app/mobile/result/abc · uniterz://result/abc
 */
export function parseShareDeepLink(rawUrl: string): ShareDeepLinkTarget | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/\/+$/, "") || "/";

    if (parsed.protocol === "uniterz:") {
      const host = parsed.hostname;
      const segments = path.split("/").filter(Boolean);
      if (host === "result" && segments[0]) {
        return { kind: "result", postId: decodeURIComponent(segments[0]) };
      }
      if (host === "u" && segments[0]) {
        return { kind: "profile", handle: decodeURIComponent(segments[0]) };
      }
      if (host === "rankings" || path === "/rankings") {
        return { kind: "rankings" };
      }
      if (host === "communities" && segments[0]) {
        return { kind: "community", groupId: decodeURIComponent(segments[0]) };
      }
    }

    const mobileMatch = path.match(
      /^\/mobile\/(result|u|rankings|communities)(?:\/([^/]+))?\/?$/
    );
    if (mobileMatch) {
      const [, section, idRaw] = mobileMatch;
      if (section === "result" && idRaw) {
        return { kind: "result", postId: decodeURIComponent(idRaw) };
      }
      if (section === "u" && idRaw) {
        return { kind: "profile", handle: decodeURIComponent(idRaw) };
      }
      if (section === "rankings") {
        return { kind: "rankings" };
      }
      if (section === "communities" && idRaw) {
        return { kind: "community", groupId: decodeURIComponent(idRaw) };
      }
    }

    const webCommunity = path.match(/^\/web\/communities\/([^/]+)\/?$/);
    if (webCommunity?.[1]) {
      return { kind: "community", groupId: decodeURIComponent(webCommunity[1]) };
    }

    const webResult = path.match(/^\/web\/result\/([^/]+)\/?$/);
    if (webResult?.[1]) {
      return { kind: "result", postId: decodeURIComponent(webResult[1]) };
    }
  } catch {
    return null;
  }

  return null;
}
