/**
 * 落雷後の粒子残光 — 少数・固定シード。毎フレーム乱数なし。
 */
import { Circle, Group } from "@shopify/react-native-skia";
import { useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";
import { LIGHTNING_T } from "./lightningTiming";

type Particle = {
  x: number;
  y: number;
  r: number;
  phase: number;
};

type Props = {
  width: number;
  height: number;
  /** 落雷中心付近 */
  cx: number;
  cy: number;
  progress: SharedValue<number>;
  staticPose: boolean;
};

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function LightningResidualNative({
  width,
  height,
  cx,
  cy,
  progress,
  staticPose,
}: Props) {
  const particles = useMemo((): Particle[] => {
    return Array.from({ length: 12 }, (_, i) => {
      const a = seeded(i * 2.1 + 1) * Math.PI * 2;
      const d = 18 + seeded(i * 3.7 + 2) * Math.min(width, height) * 0.22;
      return {
        x: cx + Math.cos(a) * d,
        y: cy + Math.sin(a) * d * 0.7,
        r: 0.8 + seeded(i * 5.3 + 3) * 1.8,
        phase: seeded(i * 7.1 + 4),
      };
    });
  }, [cx, cy, width, height]);

  const opacity = useDerivedValue(() => {
    if (staticPose) return 0.08;
    const t = progress.value;
    // メイン落雷後に出現し、ホールドで薄く残す
    if (t < LIGHTNING_T.mainStart) return 0;
    if (t < LIGHTNING_T.mainEnd) {
      const u = (t - LIGHTNING_T.mainStart) / (LIGHTNING_T.mainEnd - LIGHTNING_T.mainStart);
      return u * 0.35;
    }
    // 終了後は弱く残す
    const fade =
      0.22 +
      0.08 * Math.sin((t - LIGHTNING_T.mainEnd) * 18);
    return Math.max(0.06, fade * (1 - (t - LIGHTNING_T.mainEnd) * 0.4));
  });

  return (
    <Group opacity={opacity}>
      {particles.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          color={`rgba(200, 230, 255, ${0.35 + p.phase * 0.4})`}
        />
      ))}
    </Group>
  );
}
