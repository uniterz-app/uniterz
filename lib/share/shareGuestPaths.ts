/**
 * 共有リンクの着地ページ（/mobile/u/:handle · /mobile/result/:postId · /mobile/communities/:groupId）。
 * 未ログイン・Web メンテ中でも共有用の画面を出す。
 */
const SHARE_GUEST_PATH = /^\/mobile\/(u|result|communities)\/[^/]+\/?$/;

/** 動的ルートパラメータの decode（不正な % 列は元の文字列のまま） */
export function safeDecodeRouteParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function isShareGuestPath(pathname: string | null | undefined): boolean {
  return !!pathname && SHARE_GUEST_PATH.test(pathname);
}
