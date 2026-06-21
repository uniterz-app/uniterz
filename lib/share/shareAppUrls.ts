/** 共有・ディープリンク用の Uniterz URL 生成 */

export const DEFAULT_SHARE_APP_ORIGIN = "https://uniterz.app";

export function resolveShareAppOrigin(base?: string | null): string {
  const trimmed = base?.trim().replace(/\/$/, "");
  return trimmed || DEFAULT_SHARE_APP_ORIGIN;
}

export function buildResultShareUrl(
  postId: string,
  appBaseUrl?: string | null
): string {
  const id = postId.trim();
  if (!id) return resolveShareAppOrigin(appBaseUrl);
  return `${resolveShareAppOrigin(appBaseUrl)}/mobile/result/${encodeURIComponent(id)}`;
}

export function buildProfileShareUrl(
  handle: string,
  appBaseUrl?: string | null
): string {
  const safe = encodeURIComponent(handle.trim());
  return `${resolveShareAppOrigin(appBaseUrl)}/mobile/u/${safe}`;
}

export function buildRankingsShareUrl(appBaseUrl?: string | null): string {
  return `${resolveShareAppOrigin(appBaseUrl)}/mobile/rankings`;
}

/** PNG フッター用（https:// を省略） */
export function formatShareLinkDisplay(url: string): string {
  return url.replace(/^https?:\/\//i, "");
}

export type ShareDeepLinkTarget =
  | { kind: "result"; postId: string }
  | { kind: "profile"; handle: string }
  | { kind: "rankings" };

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
    }

    const mobileMatch = path.match(
      /^\/mobile\/(result|u|rankings)(?:\/([^/]+))?\/?$/
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
