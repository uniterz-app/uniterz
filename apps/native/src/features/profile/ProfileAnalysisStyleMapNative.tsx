/**
 * Web `AnalysisStyleMap` のネイティブ版。
 */
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleMapPoint } from "./profileAnalysisUtils";
import { colors, radius } from "../../theme/tokens";

type Props = {
  points: StyleMapPoint[];
  language: "ja" | "en";
};

const clamp = (v: number, min = -1, max = 1) => Math.min(max, Math.max(min, v));

function winRateToSize(winRate: number) {
  const pct = Math.round(winRate * 100);
  if (pct < 40) return 8;
  if (pct < 47) return 10;
  if (pct < 54) return 13;
  if (pct < 61) return 16;
  if (pct < 68) return 19;
  if (pct < 75) return 22;
  return 26;
}

function buildStyleComment(p: StyleMapPoint, isJa: boolean) {
  const x = p.homeAwayBias;
  const y = -p.marketBias;
  const winPct = Math.round(p.winRate * 100);
  const DEAD = 0.12;

  if (isJa) {
    let axisLabel = "バランス";
    let typeLabel = "バランス型";
    let tendency = "条件に強い偏りはありません。";
    if (x > DEAD && y > DEAD) {
      axisLabel = "Home × 順当";
      typeLabel = "セオリー重視タイプ";
      tendency = "ホーム有利や市場評価を素直に信頼し、王道条件を重視する傾向があります。";
    } else if (x > DEAD && y < -DEAD) {
      axisLabel = "Home × 逆張り";
      typeLabel = "文脈判断タイプ";
      tendency = "ホーム条件でも状況次第で市場と逆の判断を行う柔軟さがあります。";
    } else if (x < -DEAD && y > DEAD) {
      axisLabel = "Away × 順当";
      typeLabel = "条件反転タイプ";
      tendency = "アウェイ条件を織り込んだ上で、順当な期待値を丁寧に評価しています。";
    } else if (x < -DEAD && y < -DEAD) {
      axisLabel = "Away × 逆張り";
      typeLabel = "高リスク選好タイプ";
      tendency = "不利条件や市場逆張りを積極的に取りにいく攻撃的な判断傾向があります。";
    }
    let performance = "勝率は平均的なレンジに収まっています。";
    if (winPct >= 66) performance = "勝率が高く、現在の分析スタイルは明確に機能しています。";
    else if (winPct < 50) performance = "勝率が低めで、判断軸の調整余地があります。";
    return {
      title: `あなたは ${axisLabel} の ${typeLabel} です`,
      body: `${tendency} 現在の勝率は ${winPct}%。${performance}`,
    };
  }

  let axisLabel = "Balanced";
  let typeLabel = "balanced style";
  let tendency = "No strong bias in your picks.";
  if (x > DEAD && y > DEAD) {
    axisLabel = "Home × favorite";
    typeLabel = "theory-first type";
    tendency = "You tend to trust home edges and market favorites.";
  } else if (x > DEAD && y < -DEAD) {
    axisLabel = "Home × contrarian";
    typeLabel = "context-driven type";
    tendency = "You flex against the market even on home spots.";
  } else if (x < -DEAD && y > DEAD) {
    axisLabel = "Away × favorite";
    typeLabel = "condition-aware type";
    tendency = "You weigh away spots while still respecting favorites.";
  } else if (x < -DEAD && y < -DEAD) {
    axisLabel = "Away × contrarian";
    typeLabel = "high-risk type";
    tendency = "You chase underdogs and away spots aggressively.";
  }
  let performance = "Win rate sits in an average range.";
  if (winPct >= 66) performance = "Win rate is strong and your style is working.";
  else if (winPct < 50) performance = "Win rate is low; your axes may need tuning.";
  return {
    title: `You are a ${axisLabel} ${typeLabel}`,
    body: `${tendency} Current win rate: ${winPct}%. ${performance}`,
  };
}

export default function ProfileAnalysisStyleMapNative({ points, language }: Props) {
  const isJa = language === "ja";
  const lastIndex = points.length - 1;
  const latest = points[lastIndex];
  const comment = useMemo(
    () => (latest ? buildStyleComment(latest, isJa) : null),
    [latest, isJa]
  );

  if (!points.length || !latest || !comment) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{isJa ? "あなたの分析スタイル" : "Your analysis style"}</Text>
      <View style={styles.map}>
        <View style={styles.gridH} />
        <View style={styles.gridV} />
        <Text style={[styles.axisLabel, styles.axisLeft]}>Away</Text>
        <Text style={[styles.axisLabel, styles.axisRight]}>Home</Text>
        <Text style={[styles.axisLabel, styles.axisTop]}>{isJa ? "順当" : "Favorite"}</Text>
        <Text style={[styles.axisLabel, styles.axisBottom]}>{isJa ? "逆張り" : "Underdog"}</Text>
        {points.map((p, i) => {
          const x = clamp(p.homeAwayBias);
          const y = clamp(-p.marketBias);
          const size = winRateToSize(p.winRate);
          const isLatest = i === lastIndex;
          return (
            <View
              key={p.key ?? String(i)}
              style={[
                styles.dot,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  left: `${50 + x * 40}%`,
                  top: `${50 - y * 40}%`,
                  opacity: isLatest ? 1 : 0.35,
                },
                isLatest && styles.dotLatest,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.commentBox}>
        <Text style={styles.commentTitle}>{comment.title}</Text>
        <Text style={styles.commentBody}>{comment.body}</Text>
      </View>
      <Text style={styles.footnote}>
        {isJa
          ? "横軸：Away ←→ Home / 縦軸：順当 ←→ 逆張り\n点の大きさ：勝率（40–85%・6段階）"
          : "X: Away ←→ Home / Y: Favorite ←→ Underdog\nDot size: win rate (40–85%, 6 tiers)"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
    backgroundColor: "rgba(5,8,20,0.85)",
    gap: 10,
  },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  map: {
    height: 180,
    borderRadius: 12,
    backgroundColor: "rgba(5,8,20,0.4)",
    overflow: "hidden",
    position: "relative",
  },
  gridH: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  gridV: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  axisLabel: {
    position: "absolute",
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "600",
  },
  axisLeft: { left: 8, top: "50%", marginTop: -7 },
  axisRight: { right: 8, top: "50%", marginTop: -7 },
  axisTop: { top: 8, left: "50%", marginLeft: -14 },
  axisBottom: { bottom: 8, left: "50%", marginLeft: -18 },
  dot: {
    position: "absolute",
    backgroundColor: "#fb923c",
    marginLeft: -6,
    marginTop: -6,
  },
  dotLatest: {
    shadowColor: "#fb923c",
    shadowOpacity: 0.75,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  commentBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    gap: 4,
  },
  commentTitle: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "700" },
  commentBody: { color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 18 },
  footnote: { color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 16 },
});
