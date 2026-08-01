/**
 * Web `GamesNbaSubpageShell` 入場と揃えた軽いサイバー入場。
 */
import { FadeIn, FadeInDown, Keyframe } from "react-native-reanimated";
import { gamesCyberEaseBezier } from "./gamesPageMotion";

/** ヘッダー帯: 上からすっと */
export const nbaSubpageHeaderEntering = FadeInDown.duration(300)
  .easing(gamesCyberEaseBezier)
  .withInitialValues({ opacity: 0, transform: [{ translateY: -8 }] });

/** 題名: 軽いロックオン（scaleX + 明滅） */
export const nbaSubpageTitleEntering = new Keyframe({
  0: { opacity: 0, transform: [{ scaleX: 1.12 }] },
  55: { opacity: 1, transform: [{ scaleX: 1.01 }] },
  72: { opacity: 0.62 },
  100: { opacity: 1, transform: [{ scaleX: 1 }] },
})
  .duration(420)
  .delay(40);

/** 本文: 少し遅れて下から */
export const nbaSubpageBodyEntering = FadeInDown.duration(340)
  .delay(90)
  .easing(gamesCyberEaseBezier)
  .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] });

/** ヘルプパネル展開 */
export const nbaSubpageHelpEntering = FadeIn.duration(180).easing(gamesCyberEaseBezier);
