import { normalizeRoutePath } from "@/lib/profileSetupRoute";

/** MainTab / NavBar 共通の上部ワードマーク */
export type HeaderWordmark =
  | "UNITERZ"
  | "RESULT"
  | "RANKING"
  | "GROUP"
  | "PROFILE"
  | "AWARDS"
  | "STANDINGS"
  | "SQUAD BATTLE";

export const DEFAULT_HEADER_WORDMARK: HeaderWordmark = "UNITERZ";

/** Native `MainTabParamList` → ワードマーク */
export const HEADER_WORDMARK_BY_MAIN_TAB: Partial<
  Record<string, HeaderWordmark>
> = {
  ResultTab: "RESULT",
  RankingsTab: "RANKING",
  LeaderboardsTab: "GROUP",
  ProfileTab: "PROFILE",
};

const PROFILE_ROUTE =
  /^\/(?:u\/|mypage(?:\/|$)|settings\/|badges(?:\/|$)|announcements(?:\/|$)|plan-status(?:\/|$)|plan-change(?:\/|$)|cancel-plan(?:\/|$)|cancel-complete(?:\/|$)|pro\/)/;

/**
 * モバイル Web / Web アプリの pathname からワードマークを決める。
 * `/mobile/*` と `/web/*` のみ対象。それ以外は UNITERZ。
 */
export function resolveHeaderWordmark(
  pathname: string | null | undefined
): HeaderWordmark {
  const normalized = normalizeRoutePath(pathname);
  if (!normalized.startsWith("/mobile") && !normalized.startsWith("/web")) {
    return DEFAULT_HEADER_WORDMARK;
  }

  const rest = normalized.replace(/^\/(?:mobile|web)/, "") || "/";

  if (rest === "/result" || rest.startsWith("/result/")) return "RESULT";
  if (rest === "/rankings" || rest.startsWith("/rankings/")) return "RANKING";
  if (
    rest === "/leaderboards" ||
    rest.startsWith("/leaderboards/") ||
    rest.startsWith("/communities/")
  ) {
    return "GROUP";
  }
  if (PROFILE_ROUTE.test(rest)) return "PROFILE";
  if (rest === "/season-awards" || rest.startsWith("/season-awards")) {
    return "AWARDS";
  }
  if (rest === "/season-standings" || rest.startsWith("/season-standings")) {
    return "STANDINGS";
  }
  if (
    rest === "/squad-battle" ||
    rest.startsWith("/squad-battle/") ||
    rest === "/squad-battle-preview" ||
    rest.startsWith("/squad-battle-preview/")
  ) {
    return "SQUAD BATTLE";
  }

  return DEFAULT_HEADER_WORDMARK;
}

export function resolveHeaderWordmarkFromMainTab(
  tabName: string | undefined
): HeaderWordmark {
  if (!tabName) return DEFAULT_HEADER_WORDMARK;
  return HEADER_WORDMARK_BY_MAIN_TAB[tabName] ?? DEFAULT_HEADER_WORDMARK;
}

const HEADER_WORDMARK_SET = new Set<string>([
  "UNITERZ",
  "RESULT",
  "RANKING",
  "GROUP",
  "PROFILE",
  "AWARDS",
  "STANDINGS",
  "SQUAD BATTLE",
]);

export function isHeaderWordmark(value: string): value is HeaderWordmark {
  return HEADER_WORDMARK_SET.has(value);
}

/** titleInBrandShelf 中のページ名で棚の文字を上書き */
let wordmarkOverride: HeaderWordmark | null = null;
let wordmarkAcquireCount = 0;
const wordmarkListeners = new Set<() => void>();

function emitWordmarkOverride(): void {
  wordmarkListeners.forEach((listener) => listener());
}

export function getAppBrandWordmarkOverride(): HeaderWordmark | null {
  return wordmarkAcquireCount > 0 ? wordmarkOverride : null;
}

export function acquireAppBrandWordmark(mark: HeaderWordmark): () => void {
  wordmarkAcquireCount += 1;
  wordmarkOverride = mark;
  emitWordmarkOverride();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    wordmarkAcquireCount = Math.max(0, wordmarkAcquireCount - 1);
    if (wordmarkAcquireCount === 0) wordmarkOverride = null;
    emitWordmarkOverride();
  };
}

export function subscribeAppBrandWordmarkOverride(
  listener: () => void
): () => void {
  wordmarkListeners.add(listener);
  return () => {
    wordmarkListeners.delete(listener);
  };
}

/** Games スタックのアワード / 順位予想 → 棚のワードマーク */
export function resolveHeaderWordmarkFromGamesStack(
  routeName: string | undefined,
  params?: { mode?: string } | null
): HeaderWordmark | null {
  if (routeName !== "SeasonPredict") return null;
  return params?.mode === "awards" ? "AWARDS" : "STANDINGS";
}

/** Rankings / GROUP スタックの SQUAD BATTLE → 棚のワードマーク */
export function resolveHeaderWordmarkFromSquadBattleStack(
  routeName: string | undefined
): HeaderWordmark | null {
  if (routeName !== "SquadBattle" && routeName !== "SquadBattlePreview") {
    return null;
  }
  return "SQUAD BATTLE";
}
