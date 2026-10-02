/**
 * MARK LIST → PublicProfile → BACK で goBack したあと、
 * 親 ProfileHome のリストを再オープンするための同期フラグ。
 * navigate(openMarkList) だとスタック再アニメ＋detach 再アタッチが重くなる。
 */
let resumePending = false;

export function requestMarkListResume(): void {
  resumePending = true;
}

export function consumeMarkListResume(): boolean {
  if (!resumePending) return false;
  resumePending = false;
  return true;
}
