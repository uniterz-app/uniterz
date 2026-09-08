/**
 * ScrollVisibilityProvider 配下で画面外の Skia ジャージを載せずサイズだけ確保。
 * 一度近くに来たらアンマウントしない（スクロール中の Skia 生成・破棄を防ぐ）。
 * Provider が無い画面では常に描画。
 */
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import type { JerseyDotDensity } from "../../../../../lib/jersey/jerseyDensity";
import JerseyMarkAdaptive from "./JerseyMarkAdaptive";
import { useNearViewportNative } from "./ScrollVisibilityNative";

type DeferredJerseyMarkNativeProps = {
  accent: string;
  accentEnd?: string;
  size: number;
  density?: JerseyDotDensity;
};

export default function DeferredJerseyMarkNative({
  accent,
  accentEnd,
  size,
  density = "coarse",
}: DeferredJerseyMarkNativeProps) {
  const hostRef = useRef<View>(null);
  const { near, onLayout } = useNearViewportNative(hostRef, true);
  const [mounted, setMounted] = useState(near);

  useEffect(() => {
    if (near) setMounted(true);
  }, [near]);

  return (
    <View
      ref={hostRef}
      collapsable={false}
      style={{ width: size, height: size }}
      onLayout={onLayout}
    >
      {mounted ? (
        <JerseyMarkAdaptive
          accent={accent}
          accentEnd={accentEnd}
          size={size}
          density={density}
        />
      ) : null}
    </View>
  );
}
