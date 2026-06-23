import { normalizeRoutePath } from "@/lib/profileSetupRoute";

/** MainTab / NavBar 共通の上部ワードマーク */
export type HeaderWordmark =
  | "UNITERZ"
  | "RESULT"
  | "RANKING"
  | "GROUP"
  | "PROFILE";

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

  return DEFAULT_HEADER_WORDMARK;
}

export function resolveHeaderWordmarkFromMainTab(
  tabName: string | undefined
): HeaderWordmark {
  if (!tabName) return DEFAULT_HEADER_WORDMARK;
  return HEADER_WORDMARK_BY_MAIN_TAB[tabName] ?? DEFAULT_HEADER_WORDMARK;
}
