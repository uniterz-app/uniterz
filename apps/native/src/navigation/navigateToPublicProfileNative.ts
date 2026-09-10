/**
 * 他人プロフィールへ遷移する。
 * 今いるタブのスタックへ push し、タブ選択と BACK（goBack）を保つ。
 * Profile タブへ差し替えるとナビのプロフィールが点灯し、BACK が壊れる。
 *
 * 全経路で identity を同期 prime してから遷移する（コールドオープン防止）。
 */
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { PublicProfileParams } from "./types";
import { warmPublicProfileNative } from "../features/profile/warmPublicProfileNative";
import { peekPublicProfileIdentity } from "../../../../lib/profile/publicProfileIdentityCache";

export type OpenPublicProfileWarm = {
  uid?: string | null;
  handle?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  plan?: "free" | "pro" | string | null;
  planProBgVariant?: string | null;
  countryCode?: string | null;
  /** 既定 true（ランキング行の stats prime は呼び出し側で別途） */
  skipStatsPrime?: boolean;
};

export type OpenPublicProfileParams = {
  handle: string;
  fromRankings?: boolean;
  fromLeaderboards?: boolean;
  leaderboardsGroupId?: string;
  fromResultDetail?: boolean;
  resultDetailPostId?: string;
  fromMarkList?: boolean;
  fromWeeklyReport?: boolean;
  /** 省略時も handle だけは prime する */
  warm?: OpenPublicProfileWarm;
};

type StackNav = NavigationProp<ParamListBase> & {
  push?: (name: string, params: PublicProfileParams) => void;
};

function screenParamsFrom(
  params: OpenPublicProfileParams,
  handle: string
): PublicProfileParams {
  const resultDetailPostId = params.resultDetailPostId?.trim();
  return {
    handle,
    ...(params.fromRankings ? { fromRankings: true } : {}),
    ...(params.fromLeaderboards ? { fromLeaderboards: true } : {}),
    ...(params.fromResultDetail ? { fromResultDetail: true } : {}),
    ...(params.fromMarkList ? { fromMarkList: true } : {}),
    ...(params.fromWeeklyReport ? { fromWeeklyReport: true } : {}),
    ...(resultDetailPostId ? { resultDetailPostId } : {}),
    ...(params.leaderboardsGroupId
      ? { leaderboardsGroupId: params.leaderboardsGroupId }
      : {}),
  };
}

function openOnCurrentStack(
  navigation: NavigationProp<ParamListBase>,
  screenParams: PublicProfileParams
): void {
  const nav = navigation as StackNav;
  if (typeof nav.push === "function") {
    nav.push("PublicProfile", screenParams);
    return;
  }
  navigation.navigate("PublicProfile" as never, screenParams as never);
}

export function navigateToPublicProfileNative(
  navigation: NavigationProp<ParamListBase>,
  params: OpenPublicProfileParams
): void {
  const handle = params.handle.trim();
  if (!handle) return;

  const warm = params.warm;
  const existing = peekPublicProfileIdentity(handle);
  /**
   * 呼び出し側が先に ranking 行で prime していることがある。
   * warm 省略時に plan=free / skin=null で上書きしない（グループ→プロフィールのチラつき防止）。
   */
  warmPublicProfileNative({
    routeKey: handle,
    uid: warm?.uid ?? existing?.targetUid,
    handle: warm?.handle?.trim() || existing?.handle || handle,
    displayName: warm?.displayName ?? existing?.displayName,
    photoURL: warm?.photoURL ?? existing?.photoURL,
    plan: warm?.plan ?? existing?.plan,
    planProBgVariant: warm?.planProBgVariant ?? existing?.planProBgVariant,
    countryCode: warm?.countryCode ?? existing?.countryCode,
    skipStatsPrime: warm?.skipStatsPrime ?? true,
  });

  const screenParams = screenParamsFrom(params, handle);
  const state = navigation.getState();
  const routeNames = state?.routeNames ?? [];

  if (routeNames.includes("PublicProfile")) {
    openOnCurrentStack(navigation, screenParams);
    return;
  }

  const currentTab = state?.routes[state.index]?.name;
  if (
    currentTab === "LeaderboardsTab" ||
    currentTab === "RankingsTab" ||
    currentTab === "ResultTab"
  ) {
    navigation.navigate(
      currentTab as never,
      { screen: "PublicProfile", params: screenParams } as never
    );
    return;
  }

  navigation.navigate(
    "ProfileTab" as never,
    { screen: "PublicProfile", params: screenParams } as never
  );
}
