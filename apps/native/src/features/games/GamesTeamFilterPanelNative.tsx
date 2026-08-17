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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../theme/tokens";
import type { ScheduleTeamOption } from "./useScheduleTeamsNative";
import type { GamesFilterState } from "./applyNativeGamesFilter";
import CountryFlagNative from "./CountryFlagNative";
import { teamIdToWcCountry } from "./legacyWcNativeShims";
import {
  gamesFilterHelpButtonLabel,
  gamesFilterHelpParagraphs,
} from "../../../../../lib/games/gamesFilterHelp";
import jaMessages from "../../../../../messages/ja";
import enMessages from "../../../../../messages/en";
import type { League } from "../../../../../lib/leagues";
import {
  getTeamPrimaryColor,
  softenTeamUiColor,
  teamColorOnFill,
  teamColorRgba,
} from "../../../../../lib/team-colors";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_15,
  MATCH_CARD_BRACKET_TEXT,
} from "./matchCardTypography";

const OXANIUM_BOLD = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
}) as string;

type Props = {
  visible: boolean;
  onClose: () => void;
  language: "ja" | "en";
  teams: ScheduleTeamOption[];
  onApply: (filter: GamesFilterState) => void;
  initial: GamesFilterState;
  league: League;
};

function parseMarginDraft(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = parseInt(t, 10);
  if (!Number.isFinite(n) || n < 0 || n > 200) return null;
  return n;
}

function FilterTeamFlagNative({ teamId }: { teamId: string }) {
  if (!teamIdToWcCountry(teamId)) return null;
  return <CountryFlagNative teamId={teamId} variant="inline" />;
}

/** Web `GamesTeamFilterPanel` compact / layoutMobile 相当 */
export default function GamesTeamFilterPanelNative({
  visible,
  onClose,
  language,
  teams,
  onApply,
  initial,
  league,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const [state, setState] = useState(initial);
  const [q, setQ] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setState(initial);
      setQ("");
    } else {
      setHelpOpen(false);
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
        const selectedTeamIds = prev.selectedTeamIds.filter((x) => x !== id);
        return {
          ...prev,
          selectedTeamIds,
          matchMode: selectedTeamIds.length === 2 ? prev.matchMode : "any",
        };
      }
      const selectedTeamIds = [...prev.selectedTeamIds, id];
      return {
        ...prev,
        selectedTeamIds,
        matchMode: selectedTeamIds.length === 2 ? prev.matchMode : "any",
      };
    });
  }, []);

  const marginActive =
    parseMarginDraft(state.marginMin) != null || parseMarginDraft(state.marginMax) != null;

  const helpParagraphs = useMemo(
    () =>
      gamesFilterHelpParagraphs({
        language,
        selectedIds: state.selectedTeamIds,
        teams,
        matchMode: state.matchMode,
      }),
    [language, state.selectedTeamIds, state.matchMode, teams],
  );
  const helpButtonLabel = gamesFilterHelpButtonLabel(language);

  const m = isJa ? jaMessages : enMessages;
  const labels = {
    kicker: isJa ? "FILTER // 試合" : "FILTER // SCHEDULE",
    title: m.games.filterSchedule,
    teamSearch: isJa ? "チーム検索" : "TEAM SEARCH",
    marginRange: m.games.marginRange,
    marginMin: m.games.marginMin,
    marginMax: m.games.marginMax,
    matchScope: m.games.matchListScope,
    eitherTeam: m.games.eitherTeam,
    h2hOnly: m.games.h2hOnly,
    searchTeams: m.games.searchTeams,
    noTeamMatch: m.games.noTeamMatch,
    clearAll: m.games.clearAll,
    done: m.common.done,
    close: m.common.close,
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

  const dualSelected = state.selectedTeamIds.length === 2;

  if (!visible) return null;

  const canClear = state.selectedTeamIds.length > 0 || marginActive;

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
          style={[styles.sheet, dualSelected && styles.sheetDual]}
        >
          <View style={styles.panelShell}>
            <View style={styles.handleRow} accessibilityElementsHidden>
              <View style={styles.handle} />
            </View>

            <View style={styles.headerRow}>
              <View style={styles.headerTextCol}>
                <Text style={styles.kicker}>{labels.kicker}</Text>
                <Text style={styles.title}>{labels.title}</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  onPress={() => setHelpOpen((v) => !v)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: helpOpen }}
                  accessibilityLabel={helpButtonLabel}
                  style={[styles.helpBtn, helpOpen && styles.helpBtnActive]}
                >
                  <MaterialCommunityIcons
                    name="help-circle-outline"
                    size={15}
                    color={helpOpen ? "#050505" : "rgba(255,255,255,0.82)"}
                  />
                  <Text style={[styles.helpBtnText, helpOpen && styles.helpBtnTextActive]}>
                    {helpButtonLabel}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onClose}
                  accessibilityLabel={labels.close}
                  style={styles.closeBtn}
                >
                  <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.88)" />
                </Pressable>
              </View>
            </View>

            {helpOpen ? (
              <View style={styles.helpPanel}>
                {helpParagraphs.map((paragraph) => (
                  <Text key={paragraph} style={styles.helpParagraph}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            ) : null}

            {state.selectedTeamIds.length > 0 ? (
              <View style={[styles.selectionBar, dualSelected && styles.selectionBarDual]}>
                <View style={styles.chipRow}>
                  {state.selectedTeamIds.map((id) => {
                    const name = teams.find((t) => t.id === id)?.name ?? id;
                    const accent = softenTeamUiColor(getTeamPrimaryColor(league, id));
                    return (
                      <Pressable
                        key={id}
                        style={[
                          styles.selectedChip,
                          {
                            borderColor: accent,
                            backgroundColor: teamColorRgba(accent, 0.22),
                          },
                        ]}
                        onPress={() => toggleTeam(id)}
                      >
                        <FilterTeamFlagNative teamId={id} />
                        <Text style={[styles.selectedChipText, MATCH_CARD_BRACKET_TEXT]} numberOfLines={1}>
                          {name}
                        </Text>
                        <MaterialCommunityIcons
                          name="close"
                          size={12}
                          color="#fff"
                        />
                      </Pressable>
                    );
                  })}
                </View>
                {dualSelected ? (
                  <View style={styles.scopeInline}>
                    <Text style={styles.scopeLabel}>{labels.matchScope}</Text>
                    <View style={styles.modeRowCompact}>
                      {(["any", "h2h"] as const).map((mode) => (
                        <Pressable
                          key={mode}
                          style={[
                            styles.modeBtnCompact,
                            state.matchMode === mode && styles.modeBtnActive,
                          ]}
                          onPress={() => setState((s) => ({ ...s, matchMode: mode }))}
                        >
                          <Text
                            style={[
                              styles.modeBtnTextCompact,
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
              </View>
            ) : null}

            <View style={styles.teamSearchPrimary}>
              <View style={[styles.searchSection, dualSelected && styles.searchSectionDual]}>
                <View style={styles.searchKickerRow}>
                  <Text style={styles.searchKicker}>{labels.teamSearch}</Text>
                </View>
                <View style={styles.searchWrap}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={15}
                    color="rgba(255,255,255,0.4)"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    value={q}
                    onChangeText={setQ}
                    placeholder={labels.searchTeams}
                    placeholderTextColor="rgba(255,255,255,0.32)"
                  />
                </View>
              </View>

              <ScrollView
                style={styles.teamList}
                contentContainerStyle={styles.teamListContent}
                keyboardShouldPersistTaps="handled"
              >
                {filteredTeams.map((team) => {
                  const sel = state.selectedTeamIds.includes(team.id);
                  const accent = softenTeamUiColor(getTeamPrimaryColor(league, team.id));
                  return (
                    <Pressable
                      key={team.id}
                      style={[
                        styles.teamRow,
                        sel && {
                          borderColor: accent,
                          backgroundColor: teamColorRgba(accent, 0.22),
                        },
                      ]}
                      onPress={() => toggleTeam(team.id)}
                    >
                      <View
                        style={[
                          styles.teamCheck,
                          sel && {
                            borderColor: accent,
                            backgroundColor: accent,
                          },
                        ]}
                      >
                        {sel ? (
                          <Text style={[styles.teamCheckMark, { color: teamColorOnFill(accent) }]}>
                            ✓
                          </Text>
                        ) : null}
                      </View>
                      <FilterTeamFlagNative teamId={team.id} />
                      <Text
                        style={[
                          styles.teamName,
                          MATCH_CARD_BRACKET_TEXT,
                          { letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_15 },
                          sel && styles.teamNameSelected,
                        ]}
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
            </View>

            <View style={[styles.marginSection, dualSelected && styles.marginSectionDual]}>
              <View style={styles.marginGlass}>
                <View style={[styles.marginGlassContent, dualSelected && styles.marginGlassContentDual]}>
                  <View style={styles.marginInline}>
                    <View style={styles.marginKickerRow}>
                      <Text style={styles.marginKicker}>{labels.marginRange}</Text>
                    </View>
                    <View style={styles.marginRow}>
                      <View style={styles.marginField}>
                        <Text style={styles.marginLabel}>{labels.marginMin}</Text>
                        <TextInput
                          style={[styles.marginInput, dualSelected && styles.marginInputDual]}
                          value={state.marginMin}
                          onChangeText={(v) => setState((s) => ({ ...s, marginMin: v }))}
                          keyboardType="number-pad"
                          placeholder="—"
                          placeholderTextColor="rgba(255,255,255,0.32)"
                        />
                      </View>
                      <View style={styles.marginField}>
                        <Text style={styles.marginLabel}>{labels.marginMax}</Text>
                        <TextInput
                          style={[styles.marginInput, dualSelected && styles.marginInputDual]}
                          value={state.marginMax}
                          onChangeText={(v) => setState((s) => ({ ...s, marginMax: v }))}
                          keyboardType="number-pad"
                          placeholder="—"
                          placeholderTextColor="rgba(255,255,255,0.32)"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <Pressable
                disabled={!canClear}
                onPress={handleClearAll}
                style={!canClear ? styles.clearBtnDisabledWrap : undefined}
              >
                <Text style={[styles.clearBtnText, !canClear && styles.clearBtnTextDisabled]}>
                  {labels.clearAll}
                </Text>
              </Pressable>
              <Pressable onPress={handleDone} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>{labels.done}</Text>
              </Pressable>
            </View>
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
    height: "72%",
    maxHeight: "78%",
    flexDirection: "column",
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "#050505",
    overflow: "hidden",
  },
  sheetDual: {
    height: "80%",
    maxHeight: "85%",
  },
  panelShell: {
    flex: 1,
    minHeight: 0,
    zIndex: 1,
  },
  teamSearchPrimary: {
    flex: 1,
    minHeight: 0,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  kicker: {
    fontFamily: OXANIUM_BOLD,
    color: "rgba(255,255,255,0.42)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 3.2,
    textTransform: "uppercase",
  },
  title: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  helpBtn: {
    minHeight: 36,
    minWidth: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "transparent",
  },
  helpBtnActive: {
    borderColor: "#fff",
    backgroundColor: "#fff",
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  helpBtnText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    fontWeight: "600",
  },
  helpBtnTextActive: {
    color: "#050505",
  },
  helpPanel: {
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  helpParagraph: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    lineHeight: 16,
  },
  selectionBar: {
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  selectionBarDual: {
    paddingTop: 6,
    paddingBottom: 6,
    gap: 5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  scopeInline: {
    gap: 5,
  },
  scopeLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  modeRowCompact: {
    flexDirection: "row",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "#000",
    padding: 2,
  },
  modeBtnCompact: {
    flex: 1,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  modeBtnTextCompact: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  selectedChipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "400",
    maxWidth: 200,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_15,
  },
  modeBtnActive: {
    backgroundColor: "#fff",
  },
  modeBtnTextActive: {
    color: "#050505",
  },
  searchSection: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  searchSectionDual: {
    paddingTop: 5,
    paddingBottom: 3,
    gap: 5,
  },
  searchKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 1,
  },
  searchKickerMark: {
    width: 5,
    height: 5,
    backgroundColor: "rgba(0,245,255,0.75)",
    transform: [{ rotate: "45deg" }],
    shadowColor: "#00f5ff",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  searchKicker: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  searchWrap: {
    position: "relative",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "#000",
  },
  searchGlassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    zIndex: 1,
  },
  searchInput: {
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
    paddingVertical: 6,
    paddingLeft: 32,
    paddingRight: 10,
    color: "rgba(255,255,255,0.92)",
    fontSize: 16,
    lineHeight: 18,
  },
  teamList: {
    flex: 1,
    minHeight: 0,
  },
  teamListContent: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.025)",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  teamRowSelected: {
    borderColor: "#fff",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  teamRowDisabled: {
    opacity: 0.38,
  },
  teamCheck: {
    width: 20,
    height: 20,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  teamCheckSelected: {
    borderColor: "#fff",
    backgroundColor: "#fff",
  },
  teamCheckMark: {
    color: "#050505",
    fontSize: 10,
    fontWeight: "800",
  },
  teamName: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontSize: 16,
  },
  teamNameSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyTeams: {
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    paddingVertical: 24,
  },
  marginSection: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  marginSectionDual: {
    paddingVertical: 4,
  },
  marginGlass: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 0,
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  marginGlassBeam: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 0,
    height: 1,
  },
  marginGlassContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  marginGlassContentDual: {
    paddingVertical: 5,
  },
  marginInline: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  marginKickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 5,
    flexShrink: 0,
  },
  marginKickerMark: {
    width: 5,
    height: 5,
    backgroundColor: "rgba(0,245,255,0.75)",
    transform: [{ rotate: "45deg" }],
    shadowColor: "#00f5ff",
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  marginKicker: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  marginRow: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minWidth: 0,
  },
  marginField: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  marginLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
    lineHeight: 11,
  },
  marginInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 0,
    backgroundColor: "rgba(255,255,255,0.045)",
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "ios" ? 6 : 5,
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
  },
  marginInputDual: {
    paddingVertical: Platform.OS === "ios" ? 5 : 4,
    fontSize: 14,
  },
  footer: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    overflow: "hidden",
  },
  clearBtnDisabledWrap: {
    opacity: 0.35,
  },
  clearBtnFrame: {
    minWidth: 96,
  },
  clearBtnContent: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  clearBtnText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  clearBtnTextDisabled: {
    color: "rgba(255,255,255,0.55)",
  },
  doneBtn: {
    minWidth: 104,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fff",
  },
  doneBtnText: {
    color: "#050505",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
});
