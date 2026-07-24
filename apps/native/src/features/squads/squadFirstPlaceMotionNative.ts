/**
 * Web 1位フェードイン（squadFirstPlaceMotion）の Native 相当。
 */
import { FadeIn } from "react-native-reanimated";
import {
  SQUAD_FIRST_FADE_IN_MS,
} from "../../../../../lib/squads/squadFirstPlaceMotion";

/** 1位カード入場 — フェードインのみ（溜めなし） */
export const squadFirstFadeInEntering = FadeIn.duration(SQUAD_FIRST_FADE_IN_MS);
