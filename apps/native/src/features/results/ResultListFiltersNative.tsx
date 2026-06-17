import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CyberFilterChip } from "../../ui/CyberFilterBarNative";
import {
  DEFAULT_RESULT_LIST_FILTERS,
  type ResultListFilters,
} from "../../../../../lib/result/resultListFilterMatch";

export type { ResultListFilters };

/** UI 用：詳細パネル開閉を含む */
export type ResultFilterState = ResultListFilters & {
  detailOpen: boolean;
};

type Props = {
  language: "ja" | "en";
  filters: ResultFilterState;
  onChange: (next: ResultFilterState) => void;
  /** WC タブ時はスコア精度フィルターを非表示（Web 同等） */
  hideScorePrecision?: boolean;
};

/** Web `ResultListWithOverlay` の折りたたみパネル内コンテンツのみ */
export default function ResultListFiltersNative({
  language,
  filters,
  onChange,
  hideScorePrecision = false,
}: Props) {
  const isJa = language === "ja";

  const tierLabels = isJa
    ? {
        all: "すべて",
        high: "高（7+）",
        mid: "中（4–6）",
        low: "低（<4）",
      }
    : {
        all: "All",
        high: "High (7+)",
        mid: "Mid (4–6)",
        low: "Low (<4)",
      };

  const labels = isJa
    ? {
        outcome: "勝敗",
        settlement: "確定状態",
        league: "リーグ",
        specialty: "スペシャル",
        scorePrecision: "スコア精度",
        points: "総合スコア",
        reset: "リセット",
      }
    : {
        outcome: "Outcome",
        settlement: "Status",
        league: "League",
        specialty: "Special",
        scorePrecision: "Score precision",
        points: "Total score",
        reset: "Reset",
      };

  const outcomeOpts = isJa
    ? { all: "すべて", win: "勝", loss: "負" }
    : { all: "All", win: "Win", loss: "Loss" };

  const settlementOpts = isJa
    ? { all: "全状態", pending: "未確定", final: "確定" }
    : { all: "Any", pending: "Open", final: "Final" };

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{isJa ? "フィルター" : "Filters"}</Text>
        {!isDefaultFilters(filters) ? (
          <Pressable
            style={styles.resetBtn}
            onPress={() => onChange({ ...filters, ...DEFAULT_RESULT_LIST_FILTERS })}
          >
            <Text style={styles.resetBtnText}>{labels.reset}</Text>
          </Pressable>
        ) : null}
      </View>

      <FilterGroup title={labels.outcome}>
        {(["all", "win", "loss"] as const).map((id) => (
          <CyberFilterChip
            key={id}
            label={outcomeOpts[id]}
            active={filters.outcome === id}
            onPress={() => onChange({ ...filters, outcome: id })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={labels.settlement}>
        {(["all", "pending", "final"] as const).map((id) => (
          <CyberFilterChip
            key={id}
            label={settlementOpts[id]}
            active={filters.settlement === id}
            onPress={() => onChange({ ...filters, settlement: id })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={labels.league}>
        {(["all", "nba", "wc"] as const).map((id) => (
          <CyberFilterChip
            key={id}
            label={id.toUpperCase()}
            active={filters.league === id}
            onPress={() => onChange({ ...filters, league: id })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title={labels.specialty}>
        <CyberFilterChip
          label={isJa ? "Upset加点" : "Upset bonus"}
          active={filters.specialty === "upsetBonus"}
          onPress={() =>
            onChange({
              ...filters,
              specialty: filters.specialty === "upsetBonus" ? "none" : "upsetBonus",
            })
          }
        />
      </FilterGroup>

      {!hideScorePrecision ? (
        <FilterGroup title={labels.scorePrecision}>
          {(["all", "high", "mid", "low"] as const).map((id) => (
            <CyberFilterChip
              key={`sp-${id}`}
              label={id === "all" ? tierLabels.all : tierLabels[id]}
              active={filters.scorePrecisionTier === id}
              onPress={() => onChange({ ...filters, scorePrecisionTier: id })}
            />
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup title={labels.points}>
        {(["all", "high", "mid", "low"] as const).map((id) => (
          <CyberFilterChip
            key={`pt-${id}`}
            label={id === "all" ? tierLabels.all : tierLabels[id]}
            active={filters.pointsTier === id}
            onPress={() => onChange({ ...filters, pointsTier: id })}
          />
        ))}
      </FilterGroup>
    </View>
  );
}

function isDefaultFilters(filters: ResultFilterState) {
  return (
    filters.outcome === DEFAULT_RESULT_LIST_FILTERS.outcome &&
    filters.settlement === DEFAULT_RESULT_LIST_FILTERS.settlement &&
    filters.league === DEFAULT_RESULT_LIST_FILTERS.league &&
    filters.specialty === DEFAULT_RESULT_LIST_FILTERS.specialty &&
    filters.scorePrecisionTier === DEFAULT_RESULT_LIST_FILTERS.scorePrecisionTier &&
    filters.pointsTier === DEFAULT_RESULT_LIST_FILTERS.pointsTier
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginBottom: 8,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.2)",
    backgroundColor: "rgba(9,13,20,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
  },
  resetBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  group: {
    gap: 6,
  },
  groupTitle: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
