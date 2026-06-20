/** Web 通知タップ遷移相当 — Expo Push data から画面へ */
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { PushNotificationData } from "@/lib/notifications/pushPayloadTypes";

type TabNavigation = NavigationProp<ParamListBase>;

export function navigateFromPushNotificationData(
  navigation: TabNavigation,
  data: PushNotificationData
) {
  switch (data.type) {
    case "game_start":
      if (data.gameId) {
        navigation.navigate("GamesTab", {
          screen: "GamePredict",
          params: { gameId: data.gameId },
        });
      } else {
        navigation.navigate("GamesTab", { screen: "GamesHome" });
      }
      return;
    case "game_final":
      if (data.postId) {
        navigation.navigate("ResultTab", {
          screen: "ResultDetail",
          params: { postId: data.postId },
        });
      } else {
        navigation.navigate("ResultTab", { screen: "ResultHome" });
      }
      return;
    case "ranking_updated":
      navigation.navigate("RankingsTab", { screen: "RankingsHome" });
      return;
  }
}
