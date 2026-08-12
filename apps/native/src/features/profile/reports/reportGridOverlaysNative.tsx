/** 週間レポート（方眼）・月間レポート（アイソメ）のカード背景格子 */
import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";
import { REPORT_FRAME } from "./reportThemeNative";

const SQUARE_CELL = 14;

const ISO_SIDE = 16;
const ISO_W = ISO_SIDE * 2;
const ISO_H = ISO_SIDE * Math.sqrt(3);

function reportIsometricGridPathD(side: number): string {
  const w = side * 2;
  const h = side * Math.sqrt(3);
  const mid = side;
  return [
    `M 0 0 L ${w} 0`,
    `M 0 ${h / 2} L ${w} ${h / 2}`,
    `M 0 ${h} L ${w} ${h}`,
    `M 0 ${h} L ${mid} 0`,
    `M ${mid} ${h} L ${w} 0`,
    `M 0 0 L ${mid} ${h}`,
    `M ${mid} 0 L ${w} ${h}`,
  ].join(" ");
}

/** 週間レポート用 — 14px 方眼（ランキング `RankingsShellGridOverlay` より細かめ） */
export function ReportSquareGridOverlay({ borderRadius = 3 }: { borderRadius?: number }) {
  const raw = useId();
  const pid = `rsg${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { borderRadius, overflow: "hidden", opacity: 0.48 },
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={pid}
            x="0"
            y="0"
            width={SQUARE_CELL}
            height={SQUARE_CELL}
            patternUnits="userSpaceOnUse"
          >
            <Path
              d={`M ${SQUARE_CELL} 0 L 0 0 0 ${SQUARE_CELL}`}
              stroke={REPORT_FRAME.weekly.grid}
              strokeWidth={1}
              fill="none"
            />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${pid})`} />
      </Svg>
    </View>
  );
}

/** 月間レポート用 — 三角格子のアイソメ風タイル */
export function ReportIsometricGridOverlay({ borderRadius = 3 }: { borderRadius?: number }) {
  const raw = useId();
  const pid = `rig${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { borderRadius, overflow: "hidden", opacity: 0.5 },
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={pid}
            x="0"
            y="0"
            width={ISO_W}
            height={ISO_H}
            patternUnits="userSpaceOnUse"
          >
            <Path
              d={reportIsometricGridPathD(ISO_SIDE)}
              stroke={REPORT_FRAME.monthly.grid}
              strokeWidth={1}
              fill="none"
            />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${pid})`} />
      </Svg>
    </View>
  );
}
