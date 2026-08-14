/**
 * welcome「新機能だけ」: カメラ追い抜きをプロフィール画面で行うための引き渡し
 */
export type TutorialWelcomeHandoff = "profile";

export const TUTORIAL_WELCOME_HANDOFF_KEY = "uniterz:tutorialWelcomeHandoff:v1";

export function normalizeTutorialWelcomeHandoff(
  raw: string | null | undefined
): TutorialWelcomeHandoff | null {
  return raw === "profile" ? "profile" : null;
}

export function readTutorialWelcomeHandoff(): TutorialWelcomeHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeTutorialWelcomeHandoff(
      window.sessionStorage.getItem(TUTORIAL_WELCOME_HANDOFF_KEY)
    );
  } catch {
    return null;
  }
}

export function writeTutorialWelcomeHandoff(
  next: TutorialWelcomeHandoff | null
): void {
  if (typeof window === "undefined") return;
  try {
    if (!next) {
      window.sessionStorage.removeItem(TUTORIAL_WELCOME_HANDOFF_KEY);
    } else {
      window.sessionStorage.setItem(TUTORIAL_WELCOME_HANDOFF_KEY, next);
    }
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("uniterz-tutorial-welcome-handoff"));
}

/** マイページの href。試合ページに戻すとカメラが起動しない */
export function tutorialProfileHref(pathname: string | null | undefined): string {
  const prefix = pathname?.startsWith("/web") ? "/web" : "/mobile";
  const fallback = `${prefix}/u/guest`;
  if (typeof document === "undefined") return fallback;
  const el = document.querySelector(
    '[data-tutorial-target="nav-mypage"]'
  ) as HTMLAnchorElement | null;
  const href = el?.getAttribute("href")?.trim() ?? "";
  if (!href || href === "#") return fallback;
  /** `/mypage` ルートは存在しない。fly シェルは `u/[handle]` だけ */
  if (/(?:^|\/)mypage\/?$/.test(href.split("?")[0] ?? "")) return fallback;
  return href;
}
