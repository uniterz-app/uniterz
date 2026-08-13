/**
 * メイン雷 + 枝 — 複層 Path（白芯 → シアン → Glow → Ambient）。
 * Path は親で生成済みの SkPath を受け取る。毎フレーム再生成しない。
 */
import {
  BlurMask,
  Group,
  Path,
  type SkPath,
} from "@shopify/react-native-skia";
import type { SharedValue } from "react-native-reanimated";
import { LIGHTNING_SPLASH } from "./lightningTiming";

export type BoltLayerSpec = {
  path: SkPath;
  /** main | branch | twig */
  kind: "main" | "branch" | "twig";
};

type Props = {
  bolts: BoltLayerSpec[];
  intensity: SharedValue<number>;
};

function strokeForKind(kind: BoltLayerSpec["kind"]) {
  switch (kind) {
    case "main":
      return { core: 1.8, cyan: 4.2, glow: 16, ambient: 48 };
    case "branch":
      return { core: 1.2, cyan: 2.8, glow: 10, ambient: 28 };
    case "twig":
      return { core: 0.9, cyan: 1.8, glow: 6, ambient: 16 };
  }
}

function BoltLayers({ path, kind }: BoltLayerSpec) {
  const s = strokeForKind(kind);
  return (
    <Group>
      {/* Layer 4: Ambient Glow */}
      <Path
        path={path}
        style="stroke"
        strokeWidth={s.ambient}
        color="rgba(140, 200, 255, 0.12)"
        strokeCap="round"
        strokeJoin="round"
      >
        <BlurMask blur={22} style="normal" />
      </Path>
      {/* Layer 3: Glow */}
      <Path
        path={path}
        style="stroke"
        strokeWidth={s.glow}
        color="rgba(168, 228, 255, 0.32)"
        strokeCap="round"
        strokeJoin="round"
      >
        <BlurMask blur={10} style="normal" />
      </Path>
      {/* Layer 2: Cyan */}
      <Path
        path={path}
        style="stroke"
        strokeWidth={s.cyan}
        color="rgba(200, 235, 255, 0.82)"
        strokeCap="round"
        strokeJoin="round"
      />
      {/* Layer 1: White core */}
      <Path
        path={path}
        style="stroke"
        strokeWidth={s.core}
        color={LIGHTNING_SPLASH.accentCore}
        strokeCap="round"
        strokeJoin="round"
      />
    </Group>
  );
}

export default function LightningBoltNative({ bolts, intensity }: Props) {
  return (
    <Group opacity={intensity}>
      {bolts.map((b, i) => (
        <BoltLayers key={i} path={b.path} kind={b.kind} />
      ))}
    </Group>
  );
}
