/**
 * 落雷時の周辺照明 — RadialGradient の opacity を短時間で上下。
 */
import {
  Circle,
  Group,
  RadialGradient,
  vec,
} from "@shopify/react-native-skia";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";

type Props = {
  width: number;
  height: number;
  /** 落雷中心 */
  cx: number;
  cy: number;
  /** 0〜1 */
  intensity: SharedValue<number>;
};

export default function LightningAmbientNative({
  width,
  height,
  cx,
  cy,
  intensity,
}: Props) {
  const r = Math.max(width, height) * 0.85;
  const opacity = useDerivedValue(() => intensity.value * 0.62);

  return (
    <Group opacity={opacity}>
      <Circle cx={cx} cy={cy} r={r}>
        <RadialGradient
          c={vec(cx, cy)}
          r={r}
          colors={[
            "rgba(180, 220, 255, 0.55)",
            "rgba(80, 140, 200, 0.22)",
            "rgba(1, 3, 6, 0)",
          ]}
          positions={[0, 0.35, 1]}
        />
      </Circle>
    </Group>
  );
}
