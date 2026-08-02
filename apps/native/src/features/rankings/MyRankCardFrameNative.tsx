/**
 * Web `MyRankCardFrame` 相当 — Free（シンプル枠）/ Pro（ゴールド枠・ブラケット・チャムファー）。
 */
import type { ReactNode } from "react";
import { useId } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Polygon,
  Stop,
} from "react-native-svg";
import { myRankCardAccent } from "../../../../../lib/rankings/myRankCardFocus";
import {
  MY_RANK_PRO_BRACKET_ARM,
  MY_RANK_PRO_CHAMFER_CUT,
  resolveMyRankCardFrameTone,
  type MyRankCardFrameTone,
} from "../../../../../app/component/rankings/MyRankCardFrame";

export function resolveMyRankFrameTone(
  rankDeltaPlaces?: number | null
): MyRankCardFrameTone {
  return resolveMyRankCardFrameTone(rankDeltaPlaces);
}

const PRO_GOLD_LINE = "rgba(232,198,106,0.88)";
const PRO_GOLD_HI = "#f0cc72";
const PRO_GOLD_MID = "#d4af5a";
const PRO_GOLD_DIM = "#a67c28";

function ProChamferCornerNative({ idPrefix }: { idPrefix: string }) {
  const cut = MY_RANK_PRO_CHAMFER_CUT;
  const arm = MY_RANK_PRO_BRACKET_ARM;
  const size = cut + arm;
  const stroke = 1.5;
  const inset = stroke / 2;
  const gold = `${idPrefix}-gold`;
  const fill = `${idPrefix}-fill`;

  return (
    <View pointerEvents="none" style={[styles.chamferHost, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgLinearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#fff4d4" />
            <Stop offset="22%" stopColor="#e8c66a" />
            <Stop offset="55%" stopColor="#c89a3a" />
            <Stop offset="82%" stopColor="#f0cc72" />
            <Stop offset="100%" stopColor="#8f6820" />
          </SvgLinearGradient>
          <SvgLinearGradient id={fill} x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={PRO_GOLD_DIM} />
            <Stop offset="45%" stopColor={PRO_GOLD_MID} />
            <Stop offset="100%" stopColor={PRO_GOLD_HI} />
          </SvgLinearGradient>
        </Defs>
        <Polygon
          points={`${size - cut},${size} ${size},${size} ${size},${size - cut}`}
          fill={`url(#${fill})`}
        />
        <Path
          d={`M ${inset} ${size - inset} L ${size - cut} ${size - inset}`}
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth={stroke}
          strokeLinecap="square"
        />
        <Path
          d={`M ${size - inset} ${size - cut} L ${size - inset} ${inset}`}
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth={stroke}
          strokeLinecap="square"
        />
        <Path
          d={`M ${size - cut} ${size - inset} L ${size - inset} ${size - cut}`}
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth={stroke}
          strokeLinecap="square"
        />
      </Svg>
    </View>
  );
}

function ProBrackets() {
  const arm = MY_RANK_PRO_BRACKET_ARM;
  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.proBracket,
          styles.proBracketTl,
          { width: arm, height: arm, borderColor: PRO_GOLD_LINE },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.proBracket,
          styles.proBracketTr,
          { width: arm, height: arm, borderColor: PRO_GOLD_LINE },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.proBracket,
          styles.proBracketBl,
          { width: arm, height: arm, borderColor: PRO_GOLD_LINE },
        ]}
      />
    </>
  );
}

export function MyRankCardFrameNative({
  children,
  tone = "up",
  proSpec = false,
  hideLeftEdge = false,
  style,
}: {
  children: ReactNode;
  tone?: MyRankCardFrameTone;
  /** Web `proSpec` — Pro 枠（ゴールドブラケット + 右下チャムファー） */
  proSpec?: boolean;
  /** Free — 左端アクセント色を出さない */
  hideLeftEdge?: boolean;
  style?: ViewStyle;
}) {
  const accent = myRankCardAccent(tone);
  const chamferId = useId().replace(/[^a-zA-Z0-9-_]/g, "x");
  const edgeColor = proSpec ? "rgba(240,204,114,0.34)" : accent.hairline;

  const frame = (
    <View
      style={[
        styles.frame,
        proSpec ? styles.frameProSpec : null,
        proSpec ? { borderBottomRightRadius: 0 } : null,
        style,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          proSpec
            ? ["rgba(14,12,8,0.99)", "rgba(8,7,5,1)", "rgba(12,10,6,1)"]
            : ["rgba(14,16,22,0.98)", "rgba(9,11,16,0.99)", "rgba(6,7,10,1)"]
        }
        locations={[0, 0.46, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {proSpec ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(240,204,114,0.1)", "transparent"]}
            start={{ x: 0.14, y: 0.1 }}
            end={{ x: 0.7, y: 0.7 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View pointerEvents="none" style={styles.proScan} />
        </>
      ) : (
        <View pointerEvents="none" style={styles.freeGrid} />
      )}
      <View
        pointerEvents="none"
        style={[
          hideLeftEdge ? styles.edgeNoLeft : styles.edge,
          {
            borderTopColor: edgeColor,
            borderRightColor: edgeColor,
            borderBottomColor: edgeColor,
            ...(hideLeftEdge
              ? { borderLeftColor: "transparent" }
              : { borderLeftColor: edgeColor }),
          },
        ]}
      />
      {proSpec ? <ProBrackets /> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (!proSpec) return frame;

  return (
    <View style={styles.proHost}>
      {frame}
      <ProChamferCornerNative idPrefix={chamferId} />
    </View>
  );
}

const styles = StyleSheet.create({
  proHost: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
  frame: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  frameProSpec: {
    borderColor: "rgba(245,215,142,0.32)",
    // RN は clip-path 不可 — 右下はチャムファー SVG で見せ、枠は overflow で切る
    marginBottom: 0,
    shadowColor: PRO_GOLD_MID,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  freeGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    backgroundColor: "transparent",
  },
  proScan: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.28,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  edge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    opacity: 0.9,
  },
  edgeNoLeft: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    opacity: 0.9,
  },
  proBracket: {
    position: "absolute",
    zIndex: 3,
    borderWidth: 0,
  },
  proBracketTl: {
    top: 0,
    left: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  proBracketTr: {
    top: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
  },
  proBracketBl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 1.5,
    borderLeftWidth: 1.5,
  },
  chamferHost: {
    position: "absolute",
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  content: {
    position: "relative",
    zIndex: 4,
  },
});
