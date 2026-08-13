/**
 * 他人プロフィールへ遷移する。
 * ProfileHome（自分）が一瞬出てから切り替わるのを防ぐため、
 * Profile スタックを PublicProfile だけの状態で一気に差し替える。
 */
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { ProfileStackParamList } from "./types";

export type OpenPublicProfileParams = {
  handle: string;
  fromRankings?: boolean;
  fromLeaderboards?: boolean;
  leaderboardsGroupId?: string;
  fromResultDetail?: boolean;
  resultDetailPostId?: string;
};

export function navigateToPublicProfileNative(
  navigation: NavigationProp<ParamListBase>,
  params: OpenPublicProfileParams
): void {
  const handle = params.handle.trim();
  if (!handle) return;

  const resultDetailPostId = params.resultDetailPostId?.trim();
  const screenParams: ProfileStackParamList["PublicProfile"] = {
    handle,
    ...(params.fromRankings ? { fromRankings: true } : {}),
    ...(params.fromLeaderboards ? { fromLeaderboards: true } : {}),
    ...(params.fromResultDetail ? { fromResultDetail: true } : {}),
    ...(resultDetailPostId ? { resultDetailPostId } : {}),
    ...(params.leaderboardsGroupId
      ? { leaderboardsGroupId: params.leaderboardsGroupId }
      : {}),
  };

  navigation.navigate("ProfileTab", {
    state: {
      routes: [{ name: "PublicProfile", params: screenParams }],
      index: 0,
    },
  });
}
