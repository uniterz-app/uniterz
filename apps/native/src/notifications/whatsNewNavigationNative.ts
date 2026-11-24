/**
 * 起動お知らせの CTA → 画面。
 * Free + proOnly は中身を開かず、呼び出し側が Pro ゲートを出す。
 */
import type { WhatsNewActionRoute, WhatsNewNoteAction } from "../../../../lib/launch/whatsNewNotes";
import { whatsNewActionNeedsProGate } from "../../../../lib/launch/whatsNewNotes";
import { navigationRef, runWhenNavigationReady } from "../navigation/navigationRef";

export function navigateWhatsNewAction(route: WhatsNewActionRoute): void {
  runWhenNavigationReady(() => {
    if (!navigationRef.isReady()) return;
    if (route === "notificationSettings") {
      navigationRef.navigate("Main", {
        screen: "ProfileTab",
        params: { screen: "NotificationSettings" },
      });
      return;
    }
    if (route === "gamesHome") {
      navigationRef.navigate("Main", {
        screen: "GamesTab",
        params: { screen: "GamesHome" },
      });
      return;
    }
    if (route === "resultHome") {
      navigationRef.navigate("Main", {
        screen: "ResultTab",
        params: { screen: "ResultHome" },
      });
      return;
    }
    navigationRef.navigate("Main", {
      screen: "ProfileTab",
      params: { screen: "Announcements" },
    });
  });
}

/**
 * Free + proOnly → onProGate（中身は開かない）。
 * それ以外 → 該当画面へ。
 */
export function handleWhatsNewAction(
  action: WhatsNewNoteAction,
  opts: { isPro: boolean; onProGate: () => void }
): void {
  if (whatsNewActionNeedsProGate(action, opts.isPro)) {
    opts.onProGate();
    return;
  }
  navigateWhatsNewAction(action.route);
}
