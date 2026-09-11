/**
 * サイドメニュー → 各画面 → BACK（goBack）後にメニューをすぐ開き直す用。
 * MARK LIST の resume と同型。
 */
let resumePending = false;

export function requestSideMenuResume(): void {
  resumePending = true;
}

export function consumeSideMenuResume(): boolean {
  if (!resumePending) return false;
  resumePending = false;
  return true;
}
