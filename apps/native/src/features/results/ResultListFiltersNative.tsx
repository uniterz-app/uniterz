import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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

const COLS = 4;

type ChipSpec = {
  key: string;
  label: string;
  active: boolean;
  onPress: () => void;
  /** 4列中の占有列数 */
  span?: number;
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
            onPress={() =>
              onChange({ ...filters, ...DEFAULT_RESULT_LIST_FILTERS })
            }
          >
            <Text style={styles.resetBtnText}>{r.filterReset}</Text>
          </Pressable>
        ) : null}
      </View>

      <FilterGroup
        title={r.filterOutcome}
        chips={(["all", "win", "loss"] as const).map((id) => ({
          key: id,
          label: outcomeOpts[id],
          active: filters.outcome === id,
          onPress: () => onChange({ ...filters, outcome: id }),
        }))}
      />

      <FilterGroup
        title={r.filterMatchStatus}
        chips={(["all", "pending", "final"] as const).map((id) => ({
          key: id,
          label: settlementOpts[id],
          active: filters.settlement === id,
          onPress: () => onChange({ ...filters, settlement: id }),
        }))}
      />

      <FilterGroup
        title={r.filterLeague}
        chips={(["all", "nba"] as const).map((id) => ({
          key: id,
          label: id.toUpperCase(),
          active: filters.league === id,
          onPress: () => onChange({ ...filters, league: id }),
        }))}
      />

      <FilterGroup
        title={r.filterUpsetScore}
        chips={[
          {
            key: "upset",
            label: r.filterUpsetScore,
            active: filters.specialty === "upsetBonus",
            span: 2,
            onPress: () =>
              onChange({
                ...filters,
                specialty:
                  filters.specialty === "upsetBonus" ? "none" : "upsetBonus",
              }),
          },
        ]}
      />

      <FilterGroup
        title={r.filterTotalScore}
        chips={(["all", "high", "mid", "low"] as const).map((id) => ({
          key: `pt-${id}`,
          label: id === "all" ? tierLabels.all : tierLabels[id],
          active: filters.pointsTier === id,
          onPress: () => onChange({ ...filters, pointsTier: id }),
        }))}
      />
    </View>
  );
}

function FilterGroup({
  title,
  chips,
}: {
  title: string;
  chips: ChipSpec[];
}) {
  const cells: ReactNode[] = [];
  let used = 0;
  for (const chip of chips) {
    const span = Math.min(chip.span ?? 1, COLS);
    cells.push(
      <FilterChip
        key={chip.key}
        label={chip.label}
        active={chip.active}
        onPress={chip.onPress}
        flex={span}
      />
    );
    used += span;
  }
  while (used < COLS) {
    cells.push(<View key={`pad-${used}`} style={styles.chipPad} />);
    used += 1;
  }

  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.chipRow}>{cells}</View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  flex,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  flex: number;
}) {
  return (
    <Pressable
      style={[styles.chip, { flex }, active ? styles.chipActive : null]}
      onPress={onPress}
    >
      <Text
        style={[styles.chipLabel, active ? styles.chipLabelActive : null]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 8,
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.55)",
    /** 下のドット背景を透けさせない */
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
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
    color: "rgba(255,255,255,0.55)",
  },
  resetBtn: {
    borderRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "#111111",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  group: {
    gap: 6,
  },
  groupTitle: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.45)",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
  },
  chipPad: {
    flex: 1,
  },
  chip: {
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 9,
    borderRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "#0A0A0A",
  },
  chipActive: {
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "#1A1A1A",
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  chipLabelActive: {
    color: "#FFFFFF",
  },
});
