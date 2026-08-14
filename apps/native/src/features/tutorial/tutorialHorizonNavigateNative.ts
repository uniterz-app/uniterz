/**
 * horizon サブステップに応じた Native タブ遷移
 */
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../../navigation/types";
import { horizonStepHost } from "../../../../../lib/tutorial/tutorialHorizonSteps";

export function navigateNativeTabForHorizonStep(
  navigation: BottomTabNavigationProp<MainTabParamList>,
  step: number
): void {
  const host = horizonStepHost(step);
  if (host === "groups") {
    navigation.navigate("LeaderboardsTab", { screen: "LeaderboardsHome" });
    return;
  }
  navigation.navigate("ProfileTab", { screen: "ProfileHome", params: {} });
}
