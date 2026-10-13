/**
 * 全画面の縦スクロールで下部タブピルを縮める。
 * RN の ScrollView（FlatList / SectionList も内部でこれを描く）を起動時に 1 回だけ包む。
 * gesture-handler / reanimated が ScrollView を包む前に読み込むこと（index.ts の先頭）。
 */
import { forwardRef, useCallback } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useNavBarCompactScrollHandler } from "./navBarCompactStore";

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("react-native/Libraries/Components/ScrollView/ScrollView") as {
    default: any;
  };
  const Original = mod.default;
  if (Original && !Original.__navCompactPatched) {
    const Patched: any = forwardRef<unknown, any>(function ScrollView(props, ref) {
      const handleCompact = useNavBarCompactScrollHandler();
      const userOnScroll = props.onScroll;
      /** Animated.event / reanimated のハンドラ（関数以外）は素通し */
      const enabled =
        !props.horizontal &&
        (userOnScroll == null || typeof userOnScroll === "function");
      const onScroll = useCallback(
        (e: ScrollEvent) => {
          handleCompact(e);
          userOnScroll?.(e);
        },
        [handleCompact, userOnScroll]
      );
      if (!enabled) return <Original {...props} ref={ref} />;
      return (
        <Original
          {...props}
          ref={ref}
          onScroll={onScroll}
          scrollEventThrottle={props.scrollEventThrottle ?? 32}
        />
      );
    });
    Patched.displayName = "ScrollView";
    Patched.Context = Original.Context;
    Patched.__navCompactPatched = true;
    mod.default = Patched;
    if (__DEV__ && mod.default !== Patched) {
      console.warn("[navBarCompact] ScrollView patch did not apply");
    }
  }
} catch (e) {
  if (__DEV__) console.warn("[navBarCompact] ScrollView patch failed", e);
}
