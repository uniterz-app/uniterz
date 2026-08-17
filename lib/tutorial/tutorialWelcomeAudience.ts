/**
 * welcome の案内先。
 * first = 未プレイの初回（全体案内のみ）
 * returning = サイドメニューから再開（全体 / 新機能の二択）
 */

export type TutorialWelcomeAudience = "first" | "returning";

export const TUTORIAL_WELCOME_AUDIENCE_KEY =
  "uniterz:tutorialWelcomeAudience:v1";

let cached: TutorialWelcomeAudience | null | undefined;

export function normalizeTutorialWelcomeAudience(
  raw: string | null | undefined
): TutorialWelcomeAudience | null {
  if (raw === "first" || raw === "returning") return raw;
  return null;
}

function persist(next: TutorialWelcomeAudience | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!next) {
      window.sessionStorage.removeItem(TUTORIAL_WELCOME_AUDIENCE_KEY);
      return;
    }
    window.sessionStorage.setItem(TUTORIAL_WELCOME_AUDIENCE_KEY, next);
  } catch {
    /* ignore */
  }
}

function readStored(): TutorialWelcomeAudience | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeTutorialWelcomeAudience(
      window.sessionStorage.getItem(TUTORIAL_WELCOME_AUDIENCE_KEY)
    );
  } catch {
    return null;
  }
}

export function readTutorialWelcomeAudience(): TutorialWelcomeAudience | null {
  if (cached !== undefined) return cached;
  cached = readStored();
  return cached;
}

export function resolveTutorialWelcomeAudience(): TutorialWelcomeAudience {
  return readTutorialWelcomeAudience() ?? "first";
}

export function writeTutorialWelcomeAudience(
  next: TutorialWelcomeAudience | null
): void {
  cached = next;
  persist(next);
}

/** サイドメニュー再開 */
export function markTutorialWelcomeReturning(): void {
  writeTutorialWelcomeAudience("returning");
}

/**
 * 初回起動。メニュー再開の returning が残っていれば上書きしない
 * （既読クリア後のコールドスタートでも二択を保つ）
 */
export function ensureTutorialWelcomeFirst(): TutorialWelcomeAudience {
  const existing = readTutorialWelcomeAudience();
  if (existing === "returning") return "returning";
  writeTutorialWelcomeAudience("first");
  return "first";
}

export function tutorialWelcomeBriefingProps(
  practice: {
    welcomeTitle: string;
    welcomeBody: string;
    welcomeReturningBody: string;
    welcomeFullCta: string;
    welcomeFeaturesCta: string;
  },
  audience: TutorialWelcomeAudience
): {
  title: string;
  body: string;
  nextLabel: string;
  altNextLabel: string | undefined;
} {
  const returning = audience === "returning";
  return {
    title: practice.welcomeTitle,
    body: returning ? practice.welcomeReturningBody : practice.welcomeBody,
    nextLabel: practice.welcomeFullCta,
    altNextLabel: practice.welcomeFeaturesCta,
  };
}
