/**
 * スプラッシュ 3D 進捗共有（ref）。毎フレーム setState しない。
 */
import { createContext, useContext } from "react";

export type SplashProgressRef = { current: number };

export const SplashProgressCtx = createContext<SplashProgressRef>({
  current: 0,
});

export function useSplashProgressRef(): SplashProgressRef {
  return useContext(SplashProgressCtx);
}
