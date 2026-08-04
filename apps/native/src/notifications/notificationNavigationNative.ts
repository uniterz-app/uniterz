/** Expo Push / ローカル通知タップ → 画面遷移 */
import type { PushNotificationData } from "@/lib/notifications/pushPayloadTypes";
import { navigationRef, runWhenNavigationReady } from "../navigation/navigationRef";

function navigateToGamePredict(gameId: string | undefined) {
  if (gameId) {
    navigationRef.navigate("Main", {
      screen: "GamesTab",
      params: {
        screen: "GamesHome",
        params: {
          openPredictGameId: gameId,
          expandScoreForm: true,
        },
      },
    });
    return;
  }
  navigationRef.navigate("Main", {
    screen: "GamesTab",
    params: { screen: "GamesHome" },
  });
}

export function navigateFromPushNotificationData(data: PushNotificationData) {
  runWhenNavigationReady(() => {
    if (!navigationRef.isReady()) return;

    switch (data.type) {
      case "game_start":
      case "injury_status":
      case "starter_change":
      case "prediction_deadline":
      case "pregame_digest":
      case "pro_insight_update":
        navigateToGamePredict(data.gameId);
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
      case "monthly_report":
        navigationRef.navigate("Main", {
          screen: "ProfileTab",
          params: {
            screen: "ProfileHome",
            params: { openReportTab: true },
          },
        });
        return;
    }
  });
}
