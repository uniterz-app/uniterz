/**
 * この起動で Buzz の広告を見た。画面を閉じても中身を出し、サーバー確認は裏で取る。
 */
let earned = false;

export function setTradeBuzzAdEarned(next: boolean) {
  earned = next;
}

export function peekTradeBuzzAdEarned(): boolean {
  return earned;
}
