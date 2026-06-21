import { useId } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";
import type { MobileMetric } from "../../../../../app/component/rankings/_data/mockRows";
import type { RankingRowWithCountry } from "../../../../../app/component/rankings/_data/mockRows";
import { formatMetricDecimals } from "../../../../../lib/format/metricDecimals";
import { rankingsTexts, type RankingsLanguage } from "./rankingsTexts";
import { rankingFlagImageUri } from "./rankingFlagUri";

/** Web `ShellGridOverlay` / `PROFILE_SHELL_GRID_STYLE` に相当（22px 方眼） */
export function RankingsShellGridOverlay({ borderRadius = 0 }: { borderRadius?: number }) {
  const raw = useId();
  const pid = `sg${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        { borderRadius, overflow: "hidden", opacity: 0.32 },
      ]}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={pid}
            x="0"
            y="0"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <Path
              d="M 22 0 L 0 0 0 22"
              stroke="rgba(148,163,184,0.14)"
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

/** Web `TopPodium.tsx` の `medal()` と同値 */
export function podiumMedal(rank: 1 | 2 | 3) {
  if (rank === 1) {
    return {
      ring: "rgba(255,215,90,0.26)",
      glow: "rgba(255,215,90,0.09)",
      solid: "#FFD65A",
      tint: "rgba(255,215,90,0.08)",
    };
  }
  if (rank === 2) {
    return {
      ring: "rgba(235,238,245,0.22)",
      glow: "rgba(230,235,245,0.08)",
      solid: "#E9EDF6",
      tint: "rgba(230,235,245,0.07)",
    };
  }
  return {
    ring: "rgba(205,127,50,0.22)",
    glow: "rgba(205,127,50,0.08)",
    solid: "#D59A5A",
    tint: "rgba(205,127,50,0.07)",
  };
}

/** Web `RankingCard.tsx` の `medal(rank)`（4位以下は白） */
export function listMedal(rank: number) {
  if (rank === 1) {
    return {
      text: "#FFD65A",
      glow: "rgba(255,215,90,0.08)",
      tint: "rgba(255,215,90,0.06)",
    };
  }
  if (rank === 2) {
    return {
      text: "#E9EDF6",
      glow: "rgba(230,235,245,0.06)",
      tint: "rgba(230,235,245,0.05)",
    };
  }
  if (rank === 3) {
    return {
      text: "#D59A5A",
      glow: "rgba(205,127,50,0.06)",
      tint: "rgba(205,127,50,0.05)",
    };
  }
  return {
    text: "#FFFFFF",
    glow: "rgba(255,255,255,0.04)",
    tint: "rgba(255,255,255,0.035)",
  };
}

/** Web `RankingCard.tsx` の `cardTone(rank)` */
export function listCardTone(rank: number) {
  if (rank === 1) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(255,215,90,0.07)",
    };
  }
  if (rank === 2) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(230,235,245,0.06)",
    };
  }
  if (rank === 3) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(205,127,50,0.055)",
    };
  }
  return {
    border: "rgba(255,255,255,0.14)",
    outerGlow: "rgba(255,255,255,0.035)",
  };
}

/** Web `RankingCard.tsx` の `MonoCornerFrame`（一覧行用・銀系 L 字＋細枠） */
export function MonoCornerFrameNative() {
  const color = "rgba(226,232,240,0.72)";
  const s = 16;
  const bw = 2.5;
  const corner = (pos: "tl" | "tr" | "bl" | "br") => {
    const base: object = {
      position: "absolute" as const,
      width: s,
      height: s,
      borderColor: color,
    };
    if (pos === "tl")
      return { ...base, left: 0, top: 0, borderTopWidth: bw, borderLeftWidth: bw };
    if (pos === "tr")
      return { ...base, right: 0, top: 0, borderTopWidth: bw, borderRightWidth: bw };
    if (pos === "bl")
      return { ...base, left: 0, bottom: 0, borderBottomWidth: bw, borderLeftWidth: bw };
    return { ...base, right: 0, bottom: 0, borderBottomWidth: bw, borderRightWidth: bw };
  };
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 30 }]}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: StyleSheet.hairlineWidth,
          right: StyleSheet.hairlineWidth,
          top: StyleSheet.hairlineWidth,
          bottom: StyleSheet.hairlineWidth,
          borderWidth: 0.6,
          borderColor: color,
          ...Platform.select({
            ios: {
              shadowColor: "rgba(226,232,240,0.16)",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.85,
              shadowRadius: 10,
            },
            default: {},
          }),
        }}
      />
      <View style={corner("tl")} />
      <View style={corner("tr")} />
      <View style={corner("bl")} />
      <View style={corner("br")} />
    </View>
  );
}

/** Web `TopPodium.tsx` の `PodiumCornerFrame` に相当（四隅の L 字） */
export function PodiumCornerFrameNative({ rank }: { rank: 1 | 2 | 3 }) {
  const tone =
    rank === 1
      ? "rgba(255,214,90,0.85)"
      : rank === 2
        ? "rgba(233,237,246,0.85)"
        : "rgba(213,154,90,0.85)";
  const s = 20;
  const bw = 2.5;
  const corner = (pos: "tl" | "tr" | "bl" | "br") => {
    const base: object = {
      position: "absolute" as const,
      width: s,
      height: s,
      borderColor: tone,
    };
    if (pos === "tl")
      return { ...base, left: 0, top: 0, borderTopWidth: bw, borderLeftWidth: bw };
    if (pos === "tr")
      return { ...base, right: 0, top: 0, borderTopWidth: bw, borderRightWidth: bw };
    if (pos === "bl")
      return { ...base, left: 0, bottom: 0, borderBottomWidth: bw, borderLeftWidth: bw };
    return { ...base, right: 0, bottom: 0, borderBottomWidth: bw, borderRightWidth: bw };
  };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={corner("tl")} />
      <View style={corner("tr")} />
      <View style={corner("bl")} />
      <View style={corner("br")} />
    </View>
  );
}

/** Web `TopPodium` の `ScoreText` 副行（avg + 投稿数 等） */
export function podiumScoreSubText(
  row: RankingRowWithCountry,
  metric: MobileMetric,
  language: RankingsLanguage
): string {
  const t = rankingsTexts(language);
  if (metric === "totalScore") {
    return `avg ${formatMetricDecimals(row.avgTotalScore ?? 0, 1)}  ${t.posts}:${row.posts ?? 0}`;
  }
  if (metric === "marginPrecision") {
    return `avg ${formatMetricDecimals(row.avgMarginPrecision ?? 0, 1)}  ${t.posts}:${row.posts ?? 0}`;
  }
  if (metric === "exactHits") {
    const n = Math.round(row.marginPrecisionScore ?? 0);
    return n > 0 ? `${n}  ${t.posts}:${row.posts ?? 0}` : `${t.posts}:${row.posts ?? 0}`;
  }
  if (metric === "upsetScore") {
    return `${t.posts}:${row.posts ?? 0}`;
  }
  if (metric === "winRate" || metric === "streak") {
    return `${t.posts} ${row.posts ?? 0}`;
  }
  return "";
}

/** Web `RankingCard` / `TopPodium` の `FadedFlagBg` に近い右側フラグ装飾 */
export function FadedFlagRanking({
  rank,
  countryCode,
  podium = false,
}: {
  rank: number;
  countryCode?: string;
  /** Web TopPodium は常に幅 38% */
  podium?: boolean;
}) {
  const src = rankingFlagImageUri(countryCode);
  if (!src) return null;
  const listRow = rank > 3;
  const widthPct = podium ? "38%" : listRow ? "38%" : "34%";
  /** Web の `-right-[0%]` に近づけ、カード右端へ国旗を寄せる */
  const rightOut = listRow ? -10 : podium ? -7 : -5;
  const innerOpacity = podium ? 0.64 : listRow ? 0.62 : 0.42;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        right: rightOut,
        bottom: 0,
        width: widthPct,
        zIndex: 1,
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          flex: 1,
          width: "76%",
          marginVertical: "2%",
          opacity: innerOpacity,
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        <Image
          source={{ uri: src }}
          resizeMode="contain"
          style={{
            width: "100%",
            height: "100%",
            opacity: 0.95,
          }}
        />
      </View>
    </View>
  );
}
