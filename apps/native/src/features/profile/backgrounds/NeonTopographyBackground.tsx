/**
 * NeonTopographyBackground — 角・縁の細い等高線スキャン。
 * 中央はほぼ真っ暗。cyan / purple のみ。最小限の星・クロスヘア。
 */
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import ProfileBgCanvas from "./ProfileBgCanvas";
import { CornerHudMarks } from "./svgHelpers";
import { FUTURISTIC_BG_THEME as PROFILE_BG } from "./theme";
import type { ProfileBgProps } from "./types";

type Contour = { d: string; color: string; opacity: number };

/** 角ピーク周りの閉じない等高線弧（地形スキャン風） */
function cornerContours(
  ox: number,
  oy: number,
  inwardX: 1 | -1,
  inwardY: 1 | -1,
  color: string,
  count: number,
  step: number,
): Contour[] {
  const out: Contour[] = [];
  for (let i = 0; i < count; i++) {
    const r = 28 + i * step;
    // 角から内側へ開く楕円弧（中央には踏み込まない）
    const x0 = ox + inwardX * r * 0.15;
    const y0 = oy + inwardY * r;
    const x1 = ox + inwardX * r;
    const y1 = oy + inwardY * r * 0.15;
    const c1x = ox + inwardX * r * 0.08;
    const c1y = oy + inwardY * r * 0.72;
    const c2x = ox + inwardX * r * 0.72;
    const c2y = oy + inwardY * r * 0.08;
    out.push({
      d: `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`,
      color,
      opacity: 0.16 + i * 0.05,
    });
  }
  return out;
}

/** 縁沿いの短い平行等高線 */
function edgeBands(
  w: number,
  h: number,
  edge: "top" | "bottom" | "left" | "right",
  color: string,
  count: number,
): Contour[] {
  const out: Contour[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    if (edge === "top") {
      const y = 10 + i * 9;
      const dip = 4 + i * 1.5;
      out.push({
        d: `M ${w * 0.18} ${y} C ${w * 0.35} ${y + dip} ${w * 0.5} ${y - dip} ${w * 0.65} ${y + dip * 0.4} S ${w * 0.82} ${y} ${w * 0.82} ${y}`,
        color,
        opacity: 0.12 + t * 0.1,
      });
    } else if (edge === "bottom") {
      const y = h - 12 - i * 10;
      const dip = 5 + i * 1.5;
      out.push({
        d: `M ${w * 0.16} ${y} C ${w * 0.32} ${y - dip} ${w * 0.48} ${y + dip} ${w * 0.64} ${y - dip * 0.5} S ${w * 0.84} ${y} ${w * 0.84} ${y}`,
        color,
        opacity: 0.14 + t * 0.1,
      });
    } else if (edge === "left") {
      const x = 10 + i * 9;
      const bul = 5 + i;
      out.push({
        d: `M ${x} ${h * 0.22} C ${x + bul} ${h * 0.38} ${x - bul * 0.4} ${h * 0.55} ${x + bul * 0.5} ${h * 0.72}`,
        color,
        opacity: 0.12 + t * 0.1,
      });
    } else {
      const x = w - 10 - i * 9;
      const bul = 5 + i;
      out.push({
        d: `M ${x} ${h * 0.2} C ${x - bul} ${h * 0.36} ${x + bul * 0.4} ${h * 0.52} ${x - bul * 0.5} ${h * 0.7}`,
        color,
        opacity: 0.12 + t * 0.1,
      });
    }
  }
  return out;
}

type Spark = { x: number; y: number; kind: "dot" | "cross"; color: string };

function NeonTopographyArt({ width: w, height: h }: { width: number; height: number }) {
  const { contours, sparks } = useMemo(() => {
    const contours: Contour[] = [
      // 四隅の地形ピーク
      ...cornerContours(0, 0, 1, 1, PROFILE_BG.cyan, 5, 14),
      ...cornerContours(w, 0, -1, 1, PROFILE_BG.purple, 5, 14),
      ...cornerContours(0, h, 1, -1, PROFILE_BG.purple, 4, 15),
      ...cornerContours(w, h, -1, -1, PROFILE_BG.cyan, 4, 15),
      // 縁の薄い帯（中央は踏まない）
      ...edgeBands(w, h, "top", PROFILE_BG.cyan, 2),
      ...edgeBands(w, h, "bottom", PROFILE_BG.purple, 3),
      ...edgeBands(w, h, "left", PROFILE_BG.purple, 2),
      ...edgeBands(w, h, "right", PROFILE_BG.cyan, 2),
    ];

    const sparks: Spark[] = [
      { x: w * 0.1, y: h * 0.12, kind: "cross", color: PROFILE_BG.cyan },
      { x: w * 0.88, y: h * 0.1, kind: "dot", color: PROFILE_BG.purple },
      { x: w * 0.12, y: h * 0.86, kind: "dot", color: PROFILE_BG.cyan },
      { x: w * 0.9, y: h * 0.84, kind: "cross", color: PROFILE_BG.purple },
      { x: w * 0.22, y: h * 0.08, kind: "dot", color: PROFILE_BG.cyan },
      { x: w * 0.78, y: h * 0.92, kind: "dot", color: PROFILE_BG.purple },
      { x: w * 0.06, y: h * 0.4, kind: "dot", color: PROFILE_BG.purple },
      { x: w * 0.94, y: h * 0.48, kind: "dot", color: PROFILE_BG.cyan },
    ];

    return { contours, sparks };
  }, [w, h]);

  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* 等高線レイヤー */}
      {contours.map((c, i) => (
        <Path
          key={`c-${i}`}
          d={c.d}
          fill="none"
          stroke={c.color}
          strokeWidth={0.7}
          strokeOpacity={c.opacity}
          strokeLinecap="round"
        />
      ))}

      {/* 微小スパーク（星点 / クロスヘア） */}
      {sparks.map((s, i) =>
        s.kind === "dot" ? (
          <Circle
            key={`s-${i}`}
            cx={s.x}
            cy={s.y}
            r={1.1}
            fill={s.color}
            fillOpacity={0.55}
          />
        ) : (
          <Path
            key={`s-${i}`}
            d={`M ${s.x - 3.5} ${s.y} H ${s.x + 3.5} M ${s.x} ${s.y - 3.5} V ${s.y + 3.5}`}
            stroke={s.color}
            strokeWidth={0.7}
            strokeOpacity={0.5}
          />
        ),
      )}

      <CornerHudMarks width={w} height={h} inset={8} arm={14} strokeWidth={0.6} opacity={0.3} />
    </Svg>
  );
}

function NeonTopographyBackground({ width, height, style, children }: ProfileBgProps) {
  return (
    <ProfileBgCanvas
      width={width}
      height={height}
      style={style}
      overlay={children ? <View style={styles.overlay} pointerEvents="box-none">{children}</View> : null}
    >
      {(size) => <NeonTopographyArt {...size} />}
    </ProfileBgCanvas>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
});

export default memo(NeonTopographyBackground);
