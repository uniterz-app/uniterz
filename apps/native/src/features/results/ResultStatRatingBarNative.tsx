import { useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Canvas, Group, RoundedRect } from "@shopify/react-native-skia";

const SEGMENTS = 5;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function segmentFill(overallRatio: number, index: number, segmentCount: number) {
  const pos = overallRatio * segmentCount;
  return clamp01(pos - index);
}

type BarPalette = { core: string; edge: string };

/** Web `ResultStatRatingBar` の paletteForRatio に相当 */
function paletteForRatio(r: number): BarPalette {
  const x = clamp01(r);
  if (x < 0.2) {
    return {
      core: "rgba(34,211,238,0.22)",
      edge: "rgba(15,118,110,0.55)",
    };
  }
  if (x < 0.45) {
    return {
      core: "rgba(34,211,238,0.88)",
      edge: "rgba(8,145,178,0.92)",
    };
  }
  if (x < 0.7) {
    return {
      core: "rgba(129,140,248,0.9)",
      edge: "rgba(59,130,246,0.95)",
    };
  }
  return {
    core: "rgba(232,121,249,0.92)",
    edge: "rgba(168,85,247,0.95)",
  };
}

type Props = {
  ratio: number;
  /** Web 互換（API 揃え） */
  animateMs?: number;
  delayMs?: number;
  size?: "sm" | "md";
};

/**
 * Web `ResultStatRatingBar` のネイティブ版（Skia でセグメント＋縦グラデ、外枠は従来どおりスキュー）
 */
export default function ResultStatRatingBarNative({ ratio, size = "md" }: Props) {
  const r = clamp01(ratio);
  const pal = paletteForRatio(r);
  const h = size === "sm" ? 7 : 9;
  const [rowW, setRowW] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - rowW) > 0.5) setRowW(w);
  };

  const layout = useMemo(() => {
    if (rowW <= 0) return null;
    const gap = 1;
    const inner = rowW - gap * (SEGMENTS - 1);
    const segW = inner / SEGMENTS;
    return { segW, gap, h };
  }, [rowW, h]);

  return (
    <View style={[styles.skewWrap, { transform: [{ skewX: "-14deg" }] }]}>
      <View style={styles.rowInner} onLayout={onLayout}>
        {layout ? (
          <Canvas style={{ width: rowW, height: layout.h }} pointerEvents="none">
            {Array.from({ length: SEGMENTS }, (_, i) => {
              const x = i * (layout.segW + layout.gap);
              const target = segmentFill(r, i, SEGMENTS);
              const fillW = layout.segW * target;
              return (
                <Group key={i}>
                  <RoundedRect
                    x={x}
                    y={0}
                    width={layout.segW}
                    height={layout.h}
                    r={2}
                    color="rgba(255,255,255,0.06)"
                  />
                  {/* Skia 2.x では子 LinearGradient が確実に効かない環境があるため、縦グラデは edge→core の2枚で近似 */}
                  {fillW > 0.5 ? (
                    <Group>
                      <RoundedRect
                        x={x}
                        y={0}
                        width={fillW}
                        height={layout.h}
                        r={2}
                        color={pal.edge}
                      />
                      <RoundedRect
                        x={x}
                        y={layout.h * 0.22}
                        width={fillW}
                        height={Math.max(1, layout.h * 0.56)}
                        r={1.5}
                        color={pal.core}
                      />
                    </Group>
                  ) : null}
                </Group>
              );
            })}
          </Canvas>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skewWrap: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  rowInner: {
    flexDirection: "row",
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
});
