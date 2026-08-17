/**
 * 端末内だけの試合 ID（Opening Night プレビュー / チュートリアル）。
 * Firestore `posts` には存在しないので、予想取得の待ち対象にしない。
 */

export function isLocalOnlyScheduleGameId(id: string): boolean {
  const v = id.trim();
  return v.startsWith("preview-") || v.startsWith("tutorial-");
}
