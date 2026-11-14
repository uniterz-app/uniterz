/**
 * NavigationContainer の状態から、いま前面にある画面を GA4 の page_view として記録する。
 */
import type { NavigationState, PartialState } from "@react-navigation/native";
import { navigationRef } from "../navigation/navigationRef";
import { trackPageViewNative } from "./appAnalyticsNative";

type AnyState = NavigationState | PartialState<NavigationState>;

type FocusedRoute = {
  key: string;
  name: string;
  params: Record<string, unknown> | undefined;
  tab: string | null;
};

/** 画面の中で表示を切り替えるため、画面側（`useTrackViewNative`）が記録するルート */
const SELF_TRACKED_ROUTES = new Set([
  "RankingsHome",
  "LeagueStats",
  "LeagueTeamStats",
  "LeaguePlayerStats",
  "TeamDetailPreview",
  "PlayerDetailPreview",
]);

const CONTAINER_ROUTES = new Set(["Main", "Auth"]);

const ROUTE_PAGES: Record<string, { title: string; path: string }> = {
  GamesHome: { title: "Games", path: "games" },
  GamePredict: { title: "Predict", path: "games/predict" },
  GamePredictions: { title: "Predictions", path: "games/predictions" },
  Standings: { title: "Standings", path: "games/standings" },
  DailyLeaders: { title: "Today Leaders", path: "games/today" },
  NbaAsk: { title: "Ask", path: "games/ask" },
  TeamDetail: { title: "Team Detail", path: "team" },
  TeamDetailPreview: { title: "Team Detail", path: "team" },
  PlayerDetailPreview: { title: "Player Detail", path: "player" },
  PlayoffBracket: { title: "Playoff Bracket", path: "games/bracket" },
  PlayoffBracketView: { title: "Playoff Bracket", path: "games/bracket" },
  BracketMarket: { title: "Bracket Market", path: "games/bracket-market" },
  PublicProfile: { title: "Public Profile", path: "user" },
  ResultHome: { title: "Results", path: "results" },
  ResultDetail: { title: "Result Detail", path: "results/detail" },
  SquadBattle: { title: "Squad Battle", path: "squad-battle" },
  LeaderboardsHome: { title: "Groups", path: "groups" },
  CommunityDetail: { title: "Group Detail", path: "groups/detail" },
  ProfileHome: { title: "Profile", path: "profile" },
  ProSubscribe: { title: "Pro Subscribe", path: "pro/subscribe" },
  ProSubscribeModal: { title: "Pro Subscribe", path: "pro/subscribe" },
  PlanStatus: { title: "Plan Status", path: "pro/plan" },
  Badges: { title: "Badges", path: "profile/badges" },
  UnitLedger: { title: "Unit Ledger", path: "profile/units" },
  Redeem: { title: "Redeem", path: "profile/redeem" },
  Invite: { title: "Invite", path: "profile/invite" },
  UserSearch: { title: "User Search", path: "profile/search" },
  Announcements: { title: "Announcements", path: "announcements" },
  AnnouncementDetail: { title: "Announcement Detail", path: "announcements/detail" },
};

const TAB_SLUGS: Record<string, string> = {
  GamesTab: "games",
  ResultTab: "results",
  RankingsTab: "rankings",
  LeaderboardsTab: "groups",
  ProfileTab: "profile",
};

function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function focusedRoute(state: AnyState | undefined): FocusedRoute | null {
  let current: AnyState | undefined = state;
  let found: FocusedRoute | null = null;
  let tab: string | null = null;
  while (current?.routes?.length) {
    const index = typeof current.index === "number" ? current.index : current.routes.length - 1;
    const route = current.routes[index];
    if (!route) break;
    if (route.name in TAB_SLUGS) tab = route.name;
    found = {
      key: route.key ?? route.name,
      name: route.name,
      params: route.params as Record<string, unknown> | undefined,
      tab,
    };
    current = route.state as AnyState | undefined;
  }
  return found;
}

function pageForRoute(route: FocusedRoute): { title: string; path: string } {
  if (route.name === "SeasonPredict") {
    return route.params?.mode === "awards"
      ? { title: "Season Awards", path: "games/season-awards" }
      : { title: "Season Standings", path: "games/season-standings" };
  }
  const handle = route.params?.handle;
  if (
    (route.name === "PublicProfile" || route.name === "ProfileHome") &&
    typeof handle === "string" &&
    handle !== ""
  ) {
    return { title: "Public Profile", path: `user/${encodeURIComponent(handle)}` };
  }
  const groupId = route.params?.groupId;
  if (route.name === "CommunityDetail" && typeof groupId === "string") {
    return { title: "Group Detail", path: `groups/${encodeURIComponent(groupId)}` };
  }
  return ROUTE_PAGES[route.name] ?? { title: route.name, path: kebab(route.name) };
}

let lastRouteKey: string | null = null;

/** `onReady` と `onStateChange` から呼ぶ。同じ画面のパラメータ更新では記録しない */
export function trackNavigationStateNative(): void {
  if (!navigationRef.isReady()) return;
  const route = focusedRoute(navigationRef.getRootState());
  if (!route || route.key === lastRouteKey) return;
  // 子スタックがまだ載っていないタブ / 入れ物のルート。次の onStateChange で中の画面が来る
  if (route.name in TAB_SLUGS || CONTAINER_ROUTES.has(route.name)) return;
  lastRouteKey = route.key;
  if (SELF_TRACKED_ROUTES.has(route.name)) return;
  const page = pageForRoute(route);
  const tabSlug = route.tab ? TAB_SLUGS[route.tab] : undefined;
  trackPageViewNative(page.title, page.path, tabSlug ? { tab: tabSlug } : undefined);
}
