import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing } from "../../theme/tokens";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import type { TeamFilterMatchMode } from "../../../../../lib/games/gameTeamFilter";
import type { ScheduleTeamOption } from "./useScheduleTeamsNative";
import type { GamesFilterState } from "./applyNativeGamesFilter";

type Props = {
  visible: boolean;
  onClose: () => void;
  language: "ja" | "en";
  teams: ScheduleTeamOption[];
  onApply: (filter: GamesFilterState) => void;
  initial: GamesFilterState;
};

function parseMarginDraft(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < 0 || n > 200) return null;
  return n;
}

function filterHelpText(
  language: "ja" | "en",
  selectedIds: string[],
  teams: ScheduleTeamOption[],
  matchMode: TeamFilterMatchMode
): string {
  if (selectedIds.length === 0) {
    return language === "ja"
      ? "チームは選ばなくても、下の点差だけで絞れます（任意で最大2チーム）。点差は上下どちらか空欄ならその側は制限なし。未開始の試合はそのまま表示されます。"
      : "Team filter is optional—you can use only the score margin below. Up to 2 teams if you want. Empty min/max side = no bound on that side. Scheduled games stay visible.";
  }
  if (selectedIds.length === 1) {
    const n = teams.find((t) => t.id === selectedIds[0])?.name ?? selectedIds[0];
    return language === "ja"
      ? `「${n}」が出る試合を表示しています。`
      : `Showing games that include ${n}.`;
  }
  const [id1, id2] = selectedIds;
  const n1 = teams.find((t) => t.id === id1)?.name ?? id1;
  const n2 = teams.find((t) => t.id === id2)?.name ?? id2;
  if (matchMode === "h2h") {
    return language === "ja"
      ? `「${n1}」対「${n2}」の試合だけを表示しています。`
      : `Showing only games between ${n1} and ${n2}.`;
  }
  return language === "ja"
    ? `「${n1}」または「${n2}」のどちらかが出る試合を表示しています（他チームとの対戦も含みます）。`
    : `Showing games where ${n1} or ${n2} plays—including games vs other teams.`;
}

/** Web `GamesTeamFilterPanel` compact / layoutMobile 相当 */
export default function GamesTeamFilterPanelNative({
  visible,
  onClose,
  language,
  teams,
  onApply,
  initial,
}: Props) {
  const isJa = language === "ja";
  const [state, setState] = useState(initial);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (visible) {
      setState(initial);
      setQ("");
    }
  }, [visible, initial]);

  const filteredTeams = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(needle));
  }, [teams, q]);

  const toggleTeam = useCallback((id: string) => {
    setState((prev) => {
      if (prev.selectedTeamIds.includes(id)) {
        return {
          ...prev,
          selectedTeamIds: prev.selectedTeamIds.filter((x) => x !== id),
        };
      }
      if (prev.selectedTeamIds.length >= 2) return prev;
      return { ...prev, selectedTeamIds: [...prev.selectedTeamIds, id] };
    });
  }, []);

  const marginActive =
    parseMarginDraft(state.marginMin) != null || parseMarginDraft(state.marginMax) != null;

  const help = filterHelpText(language, state.selectedTeamIds, teams, state.matchMode);

  const labels = {
    title: isJa ? "スケジュールを絞り込む" : "Filter schedule",
    marginRange: isJa ? "得点差" : "Score margin",
    marginMin: isJa ? "最小" : "Min",
    marginMax: isJa ? "最大" : "Max",
    marginHint: isJa
      ? "得点差（大きい方の差）が、左の数以上かつ右の数以下の試合に絞ります（両方入れたとき）。"
      : "|Home − Away| must be ≥ min and ≤ max (inclusive).",
    matchScope: isJa ? "対戦の範囲" : "Match scope",
    eitherTeam: isJa ? "どちらかが出る試合" : "Either team",
    h2hOnly: isJa ? "直接対決のみ" : "Head-to-head only",
    searchTeams: isJa ? "チームを検索" : "Search teams",
    noTeamMatch: isJa ? "該当するチームがありません" : "No teams match your search.",
    clearAll: isJa ? "すべてクリア" : "Clear all",
    done: isJa ? "完了" : "Done",
    close: isJa ? "閉じる" : "Close",
  };

  function handleClearAll() {
    setState({
      selectedTeamIds: [],
      matchMode: "any",
      marginMin: "",
      marginMax: "",
    });
  }

  function handleDone() {
    onApply(state);
    onClose();
  }

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlayRoot}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFillObject}
        >
          <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={labels.close} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.springify().damping(36).stiffness(420).mass(0.85)}
          exiting={SlideOutDown.duration(220)}
          style={styles.sheet}
        >
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={Platform.OS === "ios" ? 32 : 24}
              tint="dark"
              {...nativeBlurViewExtraProps()}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <View style={styles.sheetTint} pointerEvents="none" />

          <View style={styles.handleRow} accessibilityElementsHidden>
            <View style={styles.handle} />
          </View>

          <View style={styles.headerRow}>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>{labels.title}</Text>
              <Text style={styles.help}>{help}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={labels.close}
            >
              <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.85)" />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionKicker}>{labels.marginRange}</Text>
            <Text style={styles.sectionHint}>{labels.marginHint}</Text>
            <View style={styles.marginRow}>
              <View style={styles.marginField}>
                <Text style={styles.marginLabel}>{labels.marginMin}</Text>
                <TextInput
                  style={styles.input}
                  value={state.marginMin}
                  onChangeText={(v) => setState((s) => ({ ...s, marginMin: v }))}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.marginField}>
                <Text style={styles.marginLabel}>{labels.marginMax}</Text>
                <TextInput
                  style={styles.input}
                  value={state.marginMax}
                  onChangeText={(v) => setState((s) => ({ ...s, marginMax: v }))}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>
          </View>

          {state.selectedTeamIds.length > 0 ? (
            <View style={styles.chipRow}>
              {state.selectedTeamIds.map((id) => {
                const name = teams.find((t) => t.id === id)?.name ?? id;
                return (
                  <Pressable
                    key={id}
                    style={styles.selectedChip}
                    onPress={() => toggleTeam(id)}
                  >
                    <Text style={styles.selectedChipText} numberOfLines={1}>
                      {name}
                    </Text>
                    <MaterialCommunityIcons name="close" size={12} color="rgba(165,243,252,0.85)" />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {state.selectedTeamIds.length === 2 ? (
            <View style={styles.section}>
              <Text style={styles.sectionKicker}>{labels.matchScope}</Text>
              <View style={styles.modeRow}>
                {(["any", "h2h"] as const).map((mode) => (
                  <Pressable
                    key={mode}
                    style={[styles.modeBtn, state.matchMode === mode && styles.modeBtnActive]}
                    onPress={() => setState((s) => ({ ...s, matchMode: mode }))}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        state.matchMode === mode && styles.modeBtnTextActive,
                      ]}
                    >
                      {mode === "any" ? labels.eitherTeam : labels.h2hOnly}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.searchWrap}>
            <MaterialCommunityIcons
              name="magnify"
              size={16}
              color="rgba(255,255,255,0.35)"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={q}
              onChangeText={setQ}
              placeholder={labels.searchTeams}
              placeholderTextColor="rgba(255,255,255,0.35)"
            />
          </View>

          <ScrollView
            style={styles.teamList}
            contentContainerStyle={styles.teamListContent}
            keyboardShouldPersistTaps="handled"
          >
            {filteredTeams.map((team) => {
              const sel = state.selectedTeamIds.includes(team.id);
              const atCap = state.selectedTeamIds.length >= 2 && !sel;
              return (
                <Pressable
                  key={team.id}
                  disabled={atCap}
                  style={[styles.teamRow, sel && styles.teamRowSelected, atCap && styles.teamRowDisabled]}
                  onPress={() => toggleTeam(team.id)}
                >
                  <View style={[styles.teamCheck, sel && styles.teamCheckSelected]}>
                    {sel ? <Text style={styles.teamCheckMark}>✓</Text> : null}
                  </View>
                  <Text
                    style={[styles.teamName, sel && styles.teamNameSelected]}
                    numberOfLines={1}
                  >
                    {team.name}
                  </Text>
                </Pressable>
              );
            })}
            {filteredTeams.length === 0 ? (
              <Text style={styles.emptyTeams}>{labels.noTeamMatch}</Text>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[
                styles.clearBtn,
                state.selectedTeamIds.length === 0 && !marginActive && styles.clearBtnDisabled,
              ]}
              disabled={state.selectedTeamIds.length === 0 && !marginActive}
              onPress={handleClearAll}
            >
              <Text style={styles.clearBtnText}>{labels.clearAll}</Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={handleDone}>
              <Text style={styles.doneBtnText}>{labels.done}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    maxHeight: "85%",
    minHeight: "40%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(34,211,238,0.2)",
    backgroundColor: "rgba(7,13,20,0.96)",
    overflow: "hidden",
  },
  sheetTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,13,20,0.55)",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTextCol: { flex: 1, minWidth: 0, gap: 4 },
  title: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  help: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    lineHeight: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
    gap: 6,
  },
  sectionKicker: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionHint: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    lineHeight: 14,
  },
  marginRow: { flexDirection: "row", gap: 8 },
  marginField: { flex: 1, gap: 4 },
  marginLabel: { color: "rgba(255,255,255,0.45)", fontSize: 10 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedChipText: {
    color: "rgba(207,250,254,0.95)",
    fontSize: 11,
    fontWeight: "600",
    maxWidth: 200,
  },
  modeRow: {
    flexDirection: "row",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 4,
  },
  modeBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  modeBtnActive: {
    backgroundColor: "rgba(34,211,238,0.25)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
  },
  modeBtnText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  modeBtnTextActive: { color: "rgba(207,250,254,0.95)" },
  searchWrap: {
    marginHorizontal: spacing.md,
    marginTop: 10,
    marginBottom: 6,
    position: "relative",
    justifyContent: "center",
  },
  searchIcon: { position: "absolute", left: 12, zIndex: 1 },
  searchInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 10,
    paddingLeft: 36,
    paddingRight: 12,
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
  },
  teamList: { flexGrow: 0, maxHeight: 280 },
  teamListContent: { paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  teamRowSelected: {
    borderColor: "rgba(34,211,238,0.4)",
    backgroundColor: "rgba(34,211,238,0.14)",
  },
  teamRowDisabled: { opacity: 0.4 },
  teamCheck: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  teamCheckSelected: {
    borderColor: "rgba(103,232,249,0.6)",
    backgroundColor: "rgba(34,211,238,0.2)",
  },
  teamCheckMark: { color: "#ecfeff", fontSize: 10, fontWeight: "800" },
  teamName: { flex: 1, color: "rgba(255,255,255,0.88)", fontSize: 14 },
  teamNameSelected: { color: "#fff", fontWeight: "600" },
  emptyTeams: {
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    paddingVertical: 24,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
  },
  clearBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clearBtnDisabled: { opacity: 0.35 },
  clearBtnText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  doneBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  doneBtnText: { color: "rgba(207,250,254,0.95)", fontSize: 12, fontWeight: "800" },
});
