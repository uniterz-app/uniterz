import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Language } from "../../../../../lib/i18n/language";
import { MAX_RANKING_TEAM_IDS } from "../../../../../lib/communities/rankingTeams";
import type { ScheduleTeamOption } from "../games/useScheduleTeamsNative";
import { communityPressableTapStyle } from "./communityCrtThemeNative";

type Props = {
  teams: ScheduleTeamOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  language: Language;
};

/** Web `CommunityTeamPicker` */
export default function CommunityTeamPickerNative({
  teams,
  selectedIds,
  onChange,
  language,
}: Props) {
  const [q, setQ] = useState("");

  const labels = useMemo(
    () =>
      language === "en"
        ? {
            search: "Search teams…",
            hint: `Optional — up to ${MAX_RANKING_TEAM_IDS} teams. Leave empty for the whole league.`,
            selected: "Selected",
            clear: "Clear",
            empty: "—",
          }
        : {
            search: "チームを検索…",
            hint: `任意 — 最大 ${MAX_RANKING_TEAM_IDS} チーム。未選択の場合はリーグ全体が対象です。`,
            selected: "選択中",
            clear: "クリア",
            empty: "—",
          },
    [language]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(needle));
  }, [teams, q]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
      return;
    }
    if (selectedIds.length >= MAX_RANKING_TEAM_IDS) return;
    onChange([...selectedIds, id]);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>{labels.hint}</Text>

      {selectedIds.length > 0 ? (
        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>{labels.selected}:</Text>
          <View style={styles.chipWrap}>
            {selectedIds.map((id) => {
              const name = teams.find((t) => t.id === id)?.name ?? id;
              return (
                <Pressable
                  key={id}
                  onPress={() => toggle(id)}
                  style={({ pressed }) => [styles.chip, pressed && communityPressableTapStyle(true)]}
                >
                  <Text style={styles.chipText}>{name} ×</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => onChange([])}>
            <Text style={styles.clearText}>{labels.clear}</Text>
          </Pressable>
        </View>
      ) : null}

      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={labels.search}
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={styles.search}
      />

      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>{labels.empty}</Text>
        ) : (
          filtered.map((team) => {
            const on = selectedIds.includes(team.id);
            const disabled = !on && selectedIds.length >= MAX_RANKING_TEAM_IDS;
            return (
              <Pressable
                key={team.id}
                disabled={disabled}
                onPress={() => toggle(team.id)}
                style={({ pressed }) => [
                  styles.row,
                  on && styles.rowOn,
                  disabled && styles.rowDisabled,
                  pressed && !disabled && communityPressableTapStyle(true),
                ]}
              >
                <View style={[styles.check, on && styles.checkOn]}>
                  {on ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
                <Text style={[styles.rowName, on && styles.rowNameOn]} numberOfLines={1}>
                  {team.name}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  hint: {
    fontSize: 10,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
  },
  selectedRow: {
    gap: 6,
  },
  selectedLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(207,250,254,0.95)",
  },
  clearText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    textDecorationLine: "underline",
  },
  search: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
  },
  list: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: 4,
  },
  empty: {
    paddingVertical: 12,
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rowOn: {
    backgroundColor: "rgba(34,211,238,0.2)",
  },
  rowDisabled: {
    opacity: 0.4,
  },
  check: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: {
    borderColor: "rgba(103,232,249,0.8)",
    backgroundColor: "rgba(34,211,238,0.3)",
  },
  checkMark: {
    fontSize: 10,
    color: "rgba(207,250,254,0.95)",
    lineHeight: 12,
  },
  rowName: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
  },
  rowNameOn: {
    color: "rgba(207,250,254,0.95)",
  },
});
