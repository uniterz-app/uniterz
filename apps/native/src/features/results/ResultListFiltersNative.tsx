import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CyberFilterChip } from "../../ui/CyberFilterBarNative";
import type { Language } from "../../../../../lib/i18n/language";
import { normalizeLanguage } from "../../../../../lib/i18n/language";
import { t } from "../../../../../lib/i18n/t";
import {
  DEFAULT_RESULT_LIST_FILTERS,
  isDefaultResultListFilters,
  type ResultListFilters,
} from "../../../../../lib/result/resultListFilterMatch";

export type { ResultListFilters };

/** UI 用：詳細パネル開閉を含む */
export type ResultFilterState = ResultListFilters & {
  detailOpen: boolean;
};

type Props = {
  language: Language;
  filters: ResultFilterState;
  onChange: (next: ResultFilterState) => void;
};

/** Web `ResultListWithOverlay` の折りたたみパネル内コンテンツのみ */
export default function ResultListFiltersNative({
  language,
  filters,
  onChange,
}: Props) {
  const lang = normalizeLanguage(language) ?? "en";
  const r = t(lang).results;

  const tierLabels = {
    all: r.filterAll,
    high: r.filterHighScore,
    mid: r.filterMidScore,
    low: r.filterLowScore,
  };

  const labels = {
    outcome: r.filterOutcome,
    settlement: r.filterMatchStatus,
    league: r.filterLeague,
    specialty: r.filterUpsetScore,
    points: r.filterTotalScore,
    reset: r.filterReset,
  };

  const outcomeOpts = {
    all: r.filterAll,
    win: r.filterWins,
    loss: r.filterLosses,
  };

  const settlementOpts = {
    all: r.filterAll,
    pending: r.filterPendingStatus,
    final: r.filterFinalStatus,
  };

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{r.filterTitle}</Text>
        {!isDefaultResultListFilters(filters) ? (
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
        {(["all", "nba"] as const).map((id) => (
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
          label={r.filterUpsetScore}
          active={filters.specialty === "upsetBonus"}
          onPress={() =>
            onChange({
              ...filters,
              specialty: filters.specialty === "upsetBonus" ? "none" : "upsetBonus",
            })
          }
        />
      </FilterGroup>

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
