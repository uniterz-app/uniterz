/**
 * __DEV__ 1位枠と同じ「短いグラデ棒が辺の上を滑る」光線。
 */
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { SharedValue } from "react-native-reanimated";
import { RANK_FIRST_EDGE_H_GRADIENT } from "../../../../../../lib/rankings/rankFirstBorderEdgeScan";
import { HexRankFirstEdgeScanNative, type HexPt } from "./HexRankFirstEdgeScanNative";

export type HexLightPatternId =
  | "rankGold"
  | "rankCyan"
  | "short"
  | "wide"
  | "pulse"
  | "twin"
  | "lime"
  | "soft"
  | "ghost"
  | "hot";

export type HexLightPatternMeta = {
  id: HexLightPatternId;
  code: string;
  nameJa: string;
  nameEn: string;
  noteJa: string;
  noteEn: string;
};

export const HEX_LIGHT_GALLERY: HexLightPatternMeta[] = [
  {
    id: "rankGold",
    code: "01",
    nameJa: "1位そのまま",
    nameEn: "Rank-1 exact",
    noteJa: "ランキング1位と同じ光線。短い棒が辺の上を滑る。",
    noteEn: "Exact rank-1 capsule sliding on the edges.",
  },
  {
    id: "rankCyan",
    code: "02",
    nameJa: "1位シアン",
    nameEn: "Rank-1 cyan",
    noteJa: "ネオンが枠を走る。尾を引いて移動する。",
    noteEn: "Neon traveling the frame with a tail.",
  },
  {
    id: "short",
    code: "03",
    nameJa: "もっと短く",
    nameEn: "Shorter capsule",
    noteJa: "棒をさらに短くした1位光線。",
    noteEn: "Shorter capsule.",
  },
  {
    id: "wide",
    code: "04",
    nameJa: "少し長く",
    nameEn: "Longer capsule",
    noteJa: "1位より少し長いが、辺より短い。",
    noteEn: "A bit longer, still shorter than one edge.",
  },
  {
    id: "pulse",
    code: "05",
    nameJa: "脈打つ",
    nameEn: "Pulse",
    noteJa: "滑りながら消えたり浮き上がったりする。",
    noteEn: "Slides while fading in and out.",
  },
  {
    id: "twin",
    code: "06",
    nameJa: "2本",
    nameEn: "Twin",
    noteJa: "短い棒が2つ、反対側を滑る。",
    noteEn: "Two capsules, opposite.",
  },
  {
    id: "lime",
    code: "07",
    nameJa: "ライム",
    nameEn: "Lime",
    noteJa: "1位の緑寄り。",
    noteEn: "Rank-1 lime.",
  },
  {
    id: "soft",
    code: "08",
    nameJa: "ソフト",
    nameEn: "Soft",
    noteJa: "同じ棒。ハロを少し強く。",
    noteEn: "Same capsule, softer glow.",
  },
  {
    id: "ghost",
    code: "09",
    nameJa: "ゴースト",
    nameEn: "Ghost",
    noteJa: "ごく薄い1位光線。",
    noteEn: "Faint rank-1 capsule.",
  },
  {
    id: "hot",
    code: "10",
    nameJa: "ホワイトコア",
    nameEn: "White core",
    noteJa: "中央が白く飛ぶ短い棒。",
    noteEn: "Short capsule with a white core.",
  },
];

const CYAN: readonly [string, string, string, string, string] = [
  "transparent",
  "rgba(0, 245, 255, 0.15)",
  "rgba(233, 253, 255, 0.95)",
  "rgba(0, 245, 255, 0.75)",
  "transparent",
];
const TAPER_CYAN: readonly [string, string, string, string, string] = [
  "transparent",
  "rgba(0, 180, 255, 0.16)",
  "rgba(0, 245, 255, 0.72)",
  "rgba(233, 253, 255, 1)",
  "transparent",
];
const LIME: readonly [string, string, string, string, string] = [
  "transparent",
  "rgba(184, 255, 60, 0.2)",
  "rgba(184, 255, 60, 0.95)",
  "rgba(0, 245, 255, 0.55)",
  "transparent",
];
const GHOST: readonly [string, string, string, string, string] = [
  "transparent",
  "rgba(0, 245, 255, 0.08)",
  "rgba(233, 253, 255, 0.45)",
  "rgba(0, 245, 255, 0.28)",
  "transparent",
];
const HOT: readonly [string, string, string, string, string] = [
  "transparent",
  "rgba(0, 245, 255, 0.2)",
  "#FFFFFF",
  "rgba(0, 245, 255, 0.85)",
  "transparent",
];

const SQRT3 = Math.sqrt(3);

function hexCorners(cx: number, cy: number, size: number): HexPt[] {
  const pts: HexPt[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = Math.PI / 6 + i * (Math.PI / 3);
    pts.push({ x: cx + size * Math.cos(a), y: cy + size * Math.sin(a) });
  }
  return pts;
}

function buildHoneycomb(width: number, height: number) {
  const cols = 4;
  const rows = 3;
  const size = Math.min(width / (cols * SQRT3 + 0.6), height / (rows * 1.5 + 0.4));
  const colW = SQRT3 * size;
  const rowH = 1.5 * size;
  const originX = (width - (cols - 1) * colW) / 2;
  const originY = (height - (rows - 1) * rowH) / 2;

  const mesh: string[] = [];
  const seen = new Set<string>();
  const hexes: HexPt[][] = [];

  for (let r = 0; r < rows; r += 1) {
    for (let q = 0; q < cols; q += 1) {
      const cx = originX + colW * (q + (r % 2) * 0.5);
      const cy = originY + rowH * r;
      if (cx < size * 0.35 || cx > width - size * 0.35) continue;
      if (cy < size * 0.35 || cy > height - size * 0.35) continue;
      const pts = hexCorners(cx, cy, size);
      hexes.push(pts);
      for (let i = 0; i < 6; i += 1) {
        const a = pts[i];
        const b = pts[(i + 1) % 6];
        const k1 = `${a.x.toFixed(1)},${a.y.toFixed(1)}`;
        const k2 = `${b.x.toFixed(1)},${b.y.toFixed(1)}`;
        const id = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
        if (seen.has(id)) continue;
        seen.add(id);
        mesh.push(`M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`);
      }
    }
  }

  return { mesh: mesh.join(" "), hexes };
}

export function HexLightPatternTile({
  id,
  width,
  height,
  clock,
}: {
  id: HexLightPatternId;
  width: number;
  height: number;
  clock: SharedValue<number>;
}) {
  const geo = useMemo(() => buildHoneycomb(width, height), [width, height]);

  if (width <= 0) return <View style={{ height }} />;

  const colors =
    id === "rankGold"
      ? RANK_FIRST_EDGE_H_GRADIENT
      : id === "lime"
        ? LIME
        : id === "ghost"
          ? GHOST
          : id === "hot"
            ? HOT
            : id === "rankCyan" || id === "pulse"
              ? TAPER_CYAN
              : CYAN;

  const beamRatio =
    id === "short" ? 0.22 : id === "wide" ? 0.58 : id === "rankCyan" ? 0.7 : 0.38;
  const pulse = id === "pulse";
  const glow = id === "soft" || id === "rankCyan" || id === "pulse" || id === "ghost";
  const trail = id === "rankCyan";
  const locations =
    id === "rankCyan"
      ? ([0, 0.16, 0.48, 0.86, 1] as const)
      : id === "pulse"
        ? ([0, 0.2, 0.5, 0.8, 1] as const)
        : ([0, 0.25, 0.5, 0.75, 1] as const);
  const glowColor = id === "lime" ? "rgba(184, 255, 60, 0.5)" : "rgba(0, 245, 255, 0.7)";

  return (
    <View style={[styles.tile, { width, height }]}>
      <Svg width={width} height={height}>
        <Path
          d={geo.mesh}
          fill="none"
          stroke="rgba(0, 90, 140, 0.38)"
          strokeWidth={1}
        />
      </Svg>
      {geo.hexes.map((pts, i) => (
        <HexRankFirstEdgeScanNative
          key={i}
          pts={pts}
          progress={clock}
          phase={(i * 0.17) % 1}
          colors={colors}
          beamRatio={beamRatio}
          pulse={pulse}
          glow={glow}
          trail={trail}
          glowColor={glowColor}
          locations={locations}
        />
      ))}
      {id === "twin"
        ? geo.hexes.map((pts, i) => (
            <HexRankFirstEdgeScanNative
              key={`t-${i}`}
              pts={pts}
              progress={clock}
              phase={(i * 0.17 + 0.5) % 1}
              colors={CYAN}
              beamRatio={0.38}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: "#000000",
    overflow: "hidden",
  },
});
