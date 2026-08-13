/**
 * 雷スプラッシュ背景 — #010306 + ごく薄い青黒の環境光。
 */
import { Group, RadialGradient, Rect, vec } from "@shopify/react-native-skia";
import { LIGHTNING_SPLASH } from "./lightningTiming";

type Props = {
  width: number;
  height: number;
};

export default function CyberBackgroundLightningNative({
  width,
  height,
}: Props) {
  const cx = width * 0.5;
  const cy = height * 0.42;
  const r = Math.max(width, height) * 0.72;

  return (
    <Group>
      <Rect x={0} y={0} width={width} height={height} color={LIGHTNING_SPLASH.bg} />
      <Rect x={0} y={0} width={width} height={height} opacity={0.22}>
        <RadialGradient
          c={vec(cx, cy)}
          r={r}
          colors={["#0A1520", "#010306", "#010306"]}
          positions={[0, 0.55, 1]}
        />
      </Rect>
    </Group>
  );
}
