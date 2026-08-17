/**
 * welcome の集合入場は「今の入場」で1回だけ。
 * サイドメニュー再開は begin で世代を進め、親が key でツリーを載せ替える。
 * Strict Mode の再マウントや試合ページの再描画では再生しない。
 */

let session = 0;
let playedFor = -1;
let treePlay: boolean | undefined;

export function beginTutorialWelcomeIntroSession(): number {
  session += 1;
  treePlay = undefined;
  return session;
}

export function getTutorialWelcomeIntroSession(): number {
  return session;
}

export function shouldPlayTutorialWelcomeIntro(): boolean {
  return playedFor !== session;
}

export function markTutorialWelcomeIntroPlayed(): void {
  playedFor = session;
}

/** welcome ツリーの先頭で1回だけ呼ぶ。同じ入場の再マウントでは false */
export function lockTutorialWelcomeIntroPlay(): boolean {
  if (playedFor === session) {
    treePlay = false;
    return false;
  }
  if (treePlay === undefined) {
    treePlay = true;
    markTutorialWelcomeIntroPlayed();
  }
  return treePlay;
}

/** ツリーが外れたら次のマウントが playedFor を見られるようにする */
export function releaseTutorialWelcomeIntroLock(): void {
  treePlay = undefined;
}

export function getLockedTutorialWelcomeIntroPlay(): boolean {
  return treePlay ?? shouldPlayTutorialWelcomeIntro();
}
