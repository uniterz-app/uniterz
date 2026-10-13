/**
 * RN の ScrollView 本体はここに差し替わる（metro.config.js）。
 * FlatList / SectionList / Animated.ScrollView / gesture-handler も内部でこれを描くので、
 * 全画面の縦スクロールで下部タブピルを縮められる。
 */
import { forwardRef, useCallback } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useNavBarCompactScrollHandler } from "../navigation/navBarCompactStore";

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Original = require("react-native/Libraries/Components/ScrollView/ScrollView")
  .default as any;

const ScrollView: any = forwardRef<unknown, any>(function ScrollView(props, ref) {
  const handleCompact = useNavBarCompactScrollHandler();  const userOnScroll = props.onScroll;
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
ScrollView.displayName = "ScrollView";
ScrollView.Context = Original.Context;

export default ScrollView;
