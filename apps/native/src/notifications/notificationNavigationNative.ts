/** Expo Push / ローカル通知タップ → 画面遷移 */
import type { PushNotificationData } from "@/lib/notifications/pushPayloadTypes";
import { navigationRef, runWhenNavigationReady } from "../navigation/navigationRef";

export function navigateFromPushNotificationData(data: PushNotificationData) {
  runWhenNavigationReady(() => {
    if (!navigationRef.isReady()) return;

    switch (data.type) {
      case "game_start":
        if (data.gameId) {
          navigationRef.navigate("Main", {
            screen: "GamesTab",
            params: {
              screen: "GamePredict",
              params: { gameId: data.gameId },
            },
          });
        } else {
          navigationRef.navigate("Main", {
            screen: "GamesTab",
            params: { screen: "GamesHome" },
          });
        }
        return;
      case "game_final":
        if (data.postId) {
          navigationRef.navigate("Main", {
            screen: "ResultTab",
            params: {
              screen: "ResultDetail",
              params: { postId: data.postId },
            },
          });
        } else {
          navigationRef.navigate("Main", {
            screen: "ResultTab",
            params: { screen: "ResultHome" },
          });
        }
        return;
      case "ranking_updated":
        navigationRef.navigate("Main", {
          screen: "RankingsTab",
          params: { screen: "RankingsHome" },
        });
        return;
    }
  });
}
