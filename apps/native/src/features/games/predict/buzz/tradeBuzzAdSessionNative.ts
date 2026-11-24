/**
 * トレード Buzz 画面を一度閉じてリワード広告を出したあと、開き直した先へ渡す。
 */
let earned = false;

export function setTradeBuzzAdEarned(next: boolean) {
  earned = next;
}

export function peekTradeBuzzAdEarned(): boolean {
  return earned;
}
