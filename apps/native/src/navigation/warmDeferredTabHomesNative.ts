import { InteractionManager } from "react-native";

/**
 * Games 以外のタブホーム JS を裏で評価する。マウントはしない（lazy タブのまま）。
 * スワイプ初回のパース引っかかりを防ぐ。
 */
export function warmDeferredTabHomesNative() {
  InteractionManager.runAfterInteractions(() => {
    try {
      require("../features/results/ResultHomeScreen");
      require("../features/rankings/RankingsHomeScreen");
      require("../features/leaderboards/LeaderboardsHomeScreen");
      require("../features/profile/ProfileHomeScreen");
    } catch {
      /* 起動を止めない */
    }
  });
}
