/**
 * Web `AnalysisStyleMap` のネイティブ版。
 */
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleMapPoint } from "./profileAnalysisUtils";
import {
  analysisStyleMapUi,
  buildAnalysisStyleComment,
} from "./profileAnalysisStyleMapCopy";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import { colors, radius } from "../../theme/tokens";

type Props = {
  points: StyleMapPoint[];
  language: string;
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

export default function ProfileAnalysisStyleMapNative({ points, language }: Props) {
  const lang = resolveLocalizedLang(language);
  const ui = analysisStyleMapUi(lang);
  const lastIndex = points.length - 1;
  const latest = points[lastIndex];
  const comment = useMemo(
    () => (latest ? buildAnalysisStyleComment(latest, lang) : null),
    [latest, lang]
  );

  if (!points.length || !latest || !comment) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{ui.title}</Text>
      <View style={styles.map}>
        <View style={styles.gridH} />
        <View style={styles.gridV} />
        <Text style={[styles.axisLabel, styles.axisLeft]}>Away</Text>
        <Text style={[styles.axisLabel, styles.axisRight]}>Home</Text>
        <Text style={[styles.axisLabel, styles.axisTop]}>{ui.favorite}</Text>
        <Text style={[styles.axisLabel, styles.axisBottom]}>{ui.underdog}</Text>
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
      <Text style={styles.footnote}>{ui.footnote}</Text>
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
