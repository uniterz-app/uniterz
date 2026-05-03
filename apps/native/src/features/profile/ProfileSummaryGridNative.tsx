/**
 * Web 概要サマリー（投稿数・勝率・精度・アップセット・連勝・総合）に準拠。的中カードなし。
 * カード順は `lib/profile/profileSummaryGridOrder.ts` で Web と揃える。
 */
import { type ComponentProps, type ReactNode, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ProfileSummaryNative, ProfileSummaryRanksNative } from "./profileApi";
import ProfileSummaryCardShell from "./ProfileSummaryCardShell";
import type { HighlightV2 } from "../../../../../lib/stats/thresholdsV2";
import {
  evaluateMaxStreakV2,
  evaluatePointsSumV3V2,
  evaluateScorePrecisionSumV2,
  evaluateWinRateV2,
} from "../../../../../lib/stats/thresholdsV2";
import {
  profileSummaryGridKeysFreeTier,
  profileSummaryGridKeysProOverview,
  type ProfileSummaryCellKey,
} from "../../../../../lib/profile/profileSummaryGridOrder";

type Props = {
  summary: ProfileSummaryNative;
  ranks: ProfileSummaryRanksNative | null;
  maxStreak: number;
  language: "ja" | "en";
  /** Web Pro 概要グリッドと同じ視覚順（連勝を精度の前へ） */
  proOverviewLayout?: boolean;
};

function format1(v: number): string {
  return (Math.round(v * 10) / 10).toFixed(1);
}

/** 英語の順位接尾辞（179th） */
function ordinalEn(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (k >= 11 && k <= 13) return `${n}th`;
  if (j === 1) return `${n}st`;
  if (j === 2) return `${n}nd`;
  if (j === 3) return `${n}rd`;
  return `${n}th`;
}

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const MIN_RECENT3_POSTS = 4;

type CellModel = {
  key: ProfileSummaryCellKey;
  label: string;
  icon: IconName;
  showInfo?: boolean;
  valueMain: string;
  rank: number | null;
  /** Web `decorate(..., h*)` と同じ段階でメイン数値色を決める */
  valueHighlight: HighlightV2;
};

/** Web compact `gap-1.5`（6px） */
const GRID_GAP = 6;

export default function ProfileSummaryGridNative({
  summary,
  ranks,
  maxStreak,
  language,
  proOverviewLayout = false,
}: Props) {
  const isJa = language === "ja";
  /** 常に 2 列×3 行にするため実幅からセル幅を決める（flexGrow だと横幅広い端末で1行になる） */
  const [gridLayoutW, setGridLayoutW] = useState(0);
  const winPct = Math.round((summary.winRate ?? 0) * 100);

  const onGridLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w <= 0) return;
    setGridLayoutW((prev) => (prev === w ? prev : w));
  };
  const cellWidth =
    gridLayoutW > 0 ? Math.max(0, (gridLayoutW - GRID_GAP) / 2) : undefined;

  /** Web `SummaryCardsV2` と同じ閾値ロジック（プロフィールは累計寄りなので period は `all`） */
  const enoughPosts = (summary.recent3Posts ?? 0) >= MIN_RECENT3_POSTS;
  const NONE: HighlightV2 = { level: "none" };
  const hWinRaw = enoughPosts ? evaluateWinRateV2(summary.winRate ?? 0) : NONE;
  const hWin =
    hWinRaw.level === "none" ? hWinRaw : { level: "yellow" as const };
  const hPrecisionRaw = enoughPosts
    ? evaluateScorePrecisionSumV2(summary.scorePrecisionSum ?? 0, "all")
    : NONE;
  const hPrecision =
    hPrecisionRaw.level === "none" ? hPrecisionRaw : { level: "yellow" as const };
  const hUpset = NONE;
  const hStreak = evaluateMaxStreakV2(maxStreak);
  const hTotalRaw = enoughPosts
    ? evaluatePointsSumV3V2(summary.pointsSumV3 ?? 0, "all")
    : NONE;
  const hTotal =
    hTotalRaw.level === "none" ? hTotalRaw : { level: "yellow" as const };

  const cellsUnordered: CellModel[] = [
    {
      key: "posts",
      label: isJa ? "投稿数" : "Posts",
      icon: "file-document-outline",
      valueMain: `${summary.posts}`,
      rank: null,
      valueHighlight: NONE,
    },
    {
      key: "winrate",
      label: isJa ? "勝率" : "Win rate",
      icon: "trophy-outline",
      valueMain: `${winPct}%`,
      rank: null,
      valueHighlight: hWin,
    },
    {
      key: "precision",
      label: isJa ? "スコア精度" : "Score precision",
      icon: "gauge",
      showInfo: true,
      valueMain: format1(summary.scorePrecisionSum),
      rank: ranks?.totalPrecision ?? null,
      valueHighlight: hPrecision,
    },
    {
      key: "upset",
      label: isJa ? "アップセット得点" : "Upset pts",
      icon: "lightning-bolt-outline",
      showInfo: true,
      valueMain: format1(summary.upsetPointsSum),
      rank: ranks?.totalUpset ?? null,
      valueHighlight: hUpset,
    },
    {
      key: "streak",
      label: isJa ? "最大連勝" : "Max win streak",
      icon: "fire",
      showInfo: true,
      valueMain: `${Math.max(0, Math.floor(maxStreak))}`,
      rank: null,
      valueHighlight: hStreak,
    },
    {
      key: "total",
      label: isJa ? "総合得点" : "Total pts",
      icon: "crown-outline",
      showInfo: true,
      valueMain: format1(summary.pointsSumV3),
      rank: ranks?.totalPoints ?? null,
      valueHighlight: hTotal,
    },
  ];

  const order = proOverviewLayout
    ? profileSummaryGridKeysProOverview
    : profileSummaryGridKeysFreeTier;
  const byKey = new Map(cellsUnordered.map((c) => [c.key, c] as const));
  const cells = order.map((k) => byKey.get(k)!);

  return (
    <View style={styles.grid} onLayout={onGridLayout}>
      {cells.map((c) => (
        <ProfileSummaryCardShell
          key={c.key}
          style={[styles.cell, cellWidth != null ? { width: cellWidth } : styles.cellUntilMeasure]}
        >
          <View style={styles.labelRow}>
            <MaterialCommunityIcons
              name={c.icon}
              size={13}
              color="rgba(255,255,255,0.85)"
              style={styles.labelIcon}
            />
            <Text style={styles.cellLabel}>{c.label}</Text>
            {c.showInfo ? (
              <MaterialCommunityIcons
                name="information-outline"
                size={11}
                color="rgba(255,255,255,0.7)"
                style={styles.infoIcon}
              />
            ) : null}
          </View>
          <View style={styles.valueRow}>
            <SummaryMainValue
              valueMain={c.valueMain}
              rankSuffix={
                c.rank != null
                  ? isJa
                    ? ` / ${c.rank}位`
                    : ` / ${ordinalEn(c.rank)}`
                  : null
              }
              rankHighlight={c.rank != null && c.rank <= 20}
              valueToneStyle={valueTextStyle(c.valueHighlight)}
              afterIcon={highlightAfterIcon(c.valueHighlight)}
            />
          </View>
        </ProfileSummaryCardShell>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    width: "100%",
    justifyContent: "flex-start",
  },
  /** onLayout 前の暫定（およそ 2 列） */
  cellUntilMeasure: {
    width: "47%",
    maxWidth: "47%",
    flexGrow: 0,
  },
  cell: {
    flexShrink: 0,
    flexGrow: 0,
  },
  labelRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    /** Web compact `mb-1` */
    marginBottom: 4,
    flexWrap: "wrap",
    /** Web `gap-1`（4px） */
    gap: 4,
  },
  labelIcon: { marginRight: 0 },
  infoIcon: { marginLeft: 2 },
  cellLabel: {
    flexShrink: 1,
    /** Web `text-white/85` + compact `text-[11px]` + `tracking-tight` */
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "600",
    /** Web `tracking-tight` + span の `tracking-[0.2px]` のバランス */
    letterSpacing: -0.08,
  },
  /** 参照: メイン数値はカード内で中央寄せ */
  valueRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 24,
  },
  /** Web compact より一段大きめ（プロフィール概要の視認性優先） */
  cellValueBase: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.25,
    fontFamily: Platform.select({
      ios: "Oxanium_800ExtraBold",
      android: "Oxanium_800ExtraBold",
      default: "sans-serif",
    }),
  },
  cellValue: {
    color: "rgba(255,255,255,0.98)",
  },
  /** Tailwind `text-yellow-300` */
  cellValueStrong: {
    color: "#fde047",
  },
  /** Tailwind `text-amber-300` */
  cellValueYellow: {
    color: "#fcd34d",
  },
  cellRankInline: {
    /** メイン数値に合わせて一段だけ大きく */
    fontSize: 10,
    fontWeight: "600",
    /** Web 通常順位 `text-white/55` */
    color: "rgba(255,255,255,0.55)",
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
  },
  /** Web 上位20位の順位色 `text-yellow-300` */
  cellRankInlineHighlight: {
    color: "#fde047",
  },
  /** 順位付き: 行全体を中央寄せしたうえでシフトするためのラッパ */
  valueRankCenterWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  valueRankRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  valueSimpleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  rankSuffixMeasure: {
    flexShrink: 0,
  },
});

/** Web `decorate`（yellow-300 / amber-300 / 白）に相当 */
function valueTextStyle(h: HighlightV2) {
  if (h.level === "strong") return styles.cellValueStrong;
  if (h.level === "yellow") return styles.cellValueYellow;
  return styles.cellValue;
}

/** メイン数値 18px に合わせた装飾アイコン */
function highlightAfterIcon(h: HighlightV2): ReactNode {
  const size = 12;
  const color =
    h.level === "strong"
      ? "#fde047"
      : h.level === "yellow"
        ? "#fcd34d"
        : "rgba(255,255,255,0.92)";
  if (h.icon === "crown") {
    return (
      <MaterialCommunityIcons
        name="crown"
        size={size}
        color={color}
        style={{ marginLeft: 4 }}
      />
    );
  }
  if (h.icon === "fire") {
    return (
      <MaterialCommunityIcons name="fire" size={size} color={color} style={{ marginLeft: 4 }} />
    );
  }
  return null;
}

/**
 * 順位サフィックスがあるとき、[数値][順位] をまとめて中央寄せすると数値が左にずれる。
 * サフィックス幅 R を計測し、行を右へ R/2 ずらして数値の中心をカード中央に合わせる。
 * Web と同様、`afterIcon`（クラウン／炎）は行末。
 */
function SummaryMainValue({
  valueMain,
  rankSuffix,
  rankHighlight,
  valueToneStyle,
  afterIcon,
}: {
  valueMain: string;
  rankSuffix: string | null;
  rankHighlight: boolean;
  valueToneStyle: object;
  afterIcon: ReactNode;
}) {
  const [suffixW, setSuffixW] = useState(0);

  if (rankSuffix == null) {
    return (
      <View style={styles.valueSimpleRow}>
        <Text style={[styles.cellValueBase, valueToneStyle]} maxFontSizeMultiplier={1.25}>
          {valueMain}
        </Text>
        {afterIcon}
      </View>
    );
  }

  const shift = suffixW > 0 ? suffixW / 2 : 0;

  return (
    <View style={styles.valueRankCenterWrap}>
      <View
        style={[
          styles.valueRankRow,
          shift > 0 ? { transform: [{ translateX: shift }] } : null,
        ]}
      >
        <Text style={[styles.cellValueBase, valueToneStyle]} maxFontSizeMultiplier={1.25}>
          {valueMain}
        </Text>
        <View
          style={styles.rankSuffixMeasure}
          onLayout={(e) => setSuffixW(e.nativeEvent.layout.width)}
        >
          <Text
            style={[
              styles.cellRankInline,
              rankHighlight && styles.cellRankInlineHighlight,
            ]}
            maxFontSizeMultiplier={1.25}
          >
            {rankSuffix}
          </Text>
        </View>
        {afterIcon}
      </View>
    </View>
  );
}
