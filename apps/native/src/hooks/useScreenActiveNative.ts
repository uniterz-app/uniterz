/**
 * タブフォーカスかつ App がフォアグラウンドのときだけ true。
 * freezeOnBlur を使わず、アニメ / ポーリング停止に使う。
 */
import { useIsFocused } from "@react-navigation/native";
import { useAppActiveNative } from "./useAppActiveNative";

export function useScreenActiveNative(): boolean {
  const focused = useIsFocused();
  const appActive = useAppActiveNative();
  return focused && appActive;
}
