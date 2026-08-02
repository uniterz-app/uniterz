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
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../theme/tokens";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
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
import GamesFilterPanelDecorNative from "./GamesFilterPanelDecorNative";
import PredictOverlayCornerButtonNative from "./PredictOverlayCornerButtonNative";
import PredictOverlayChamferedFrameNative from "./PredictOverlayChamferedFrameNative";
import {
  PREDICT_OVERLAY_SUBMIT_BTN_CUT,
} from "./matchListCyberClipPath";

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
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={Platform.OS === "ios" ? 28 : 20}
              tint="dark"
              {...nativeBlurViewExtraProps()}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <LinearGradient
            colors={["rgba(9,13,20,0.97)", "rgba(6,9,15,0.95)", "rgba(4,7,12,0.93)"]}
            locations={[0, 0.48, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <GamesFilterPanelDecorNative />

          <View style={styles.panelShell}>
            <View style={styles.handleRow} accessibilityElementsHidden>
              <View style={styles.handle} />
            </View>

            <View style={styles.headerRow}>
              <LinearGradient
                colors={["rgba(0,245,255,0.07)", "transparent"]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
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
                >
                  <PredictOverlayChamferedFrameNative
                    cut={6}
                    gradientColors={
                      helpOpen
                        ? ["rgba(0,245,255,0.1)", "rgba(0,245,255,0.08)"]
                        : ["rgba(255,255,255,0.04)", "rgba(255,255,255,0.03)"]
                    }
                    borderColor={
                      helpOpen ? "rgba(0,245,255,0.38)" : "rgba(255,255,255,0.12)"
                    }
                    shadowColor={helpOpen ? "#00f5ff" : "#000"}
                    shadowOpacity={helpOpen ? 0.12 : 0}
                    shadowRadius={helpOpen ? 14 : 0}
                    style={styles.helpBtnFrame}
                    contentStyle={styles.helpBtnContent}
                  >
                    <MaterialCommunityIcons
                      name="help-circle-outline"
                      size={15}
                      color={helpOpen ? "rgba(224,252,255,0.95)" : "rgba(255,255,255,0.78)"}
                    />
                    <Text style={[styles.helpBtnText, helpOpen && styles.helpBtnTextActive]}>
                      {helpButtonLabel}
                    </Text>
                  </PredictOverlayChamferedFrameNative>
                </Pressable>
                <PredictOverlayCornerButtonNative
                  embedded
                  onPress={onClose}
                  accessibilityLabel={labels.close}
                />
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
                    return (
                      <Pressable
                        key={id}
                        style={styles.selectedChip}
                        onPress={() => toggleTeam(id)}
                      >
                        <FilterTeamFlagNative teamId={id} />
                        <Text style={styles.selectedChipText} numberOfLines={1}>
                          {name}
                        </Text>
                        <MaterialCommunityIcons
                          name="close"
                          size={12}
                          color="rgba(165,243,252,0.85)"
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
                  <View style={styles.searchKickerMark} />
                  <Text style={styles.searchKicker}>{labels.teamSearch}</Text>
                </View>
                <View style={styles.searchWrap}>
                  {(Platform.OS === "ios" || Platform.OS === "android") && (
                    <BlurView
                      intensity={Platform.OS === "ios" ? 10 : 8}
                      tint="dark"
                      {...nativeBlurViewExtraProps()}
                      style={StyleSheet.absoluteFillObject}
                    />
                  )}
                  <View style={styles.searchGlassTint} pointerEvents="none" />
                  <MaterialCommunityIcons
                    name="magnify"
                    size={15}
                    color="rgba(103,232,249,0.45)"
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
                  return (
                    <Pressable
                      key={team.id}
                      style={[styles.teamRow, sel && styles.teamRowSelected]}
                      onPress={() => toggleTeam(team.id)}
                    >
                      <View style={[styles.teamCheck, sel && styles.teamCheckSelected]}>
                        {sel ? <Text style={styles.teamCheckMark}>✓</Text> : null}
                      </View>
                      <FilterTeamFlagNative teamId={team.id} />
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
            </View>

            <View style={[styles.marginSection, dualSelected && styles.marginSectionDual]}>
              <View style={styles.marginGlass}>
                {(Platform.OS === "ios" || Platform.OS === "android") && (
                  <BlurView
                    intensity={Platform.OS === "ios" ? 12 : 10}
                    tint="dark"
                    {...nativeBlurViewExtraProps()}
                    style={StyleSheet.absoluteFillObject}
                  />
                )}
                <LinearGradient
                  colors={[
                    "rgba(255,255,255,0.055)",
                    "rgba(255,255,255,0.018)",
                    "rgba(0,245,255,0.025)",
                  ]}
                  locations={[0, 0.55, 1]}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,245,255,0.32)", "transparent"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.marginGlassBeam}
                  pointerEvents="none"
                />
                <View style={[styles.marginGlassContent, dualSelected && styles.marginGlassContentDual]}>
                  <View style={styles.marginInline}>
                    <View style={styles.marginKickerRow}>
                      <View style={styles.marginKickerMark} />
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
              <LinearGradient
                colors={["transparent", "rgba(0,245,255,0.04)"]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <Pressable
                disabled={!canClear}
                onPress={handleClearAll}
                style={!canClear ? styles.clearBtnDisabledWrap : undefined}
              >
                <PredictOverlayChamferedFrameNative
                  cut={6}
                  gradientColors={["rgba(255,255,255,0.03)", "rgba(255,255,255,0.02)"]}
                  borderColor="rgba(255,255,255,0.12)"
                  style={styles.clearBtnFrame}
                  contentStyle={styles.clearBtnContent}
                >
                  <Text style={[styles.clearBtnText, !canClear && styles.clearBtnTextDisabled]}>
                    {labels.clearAll}
                  </Text>
                </PredictOverlayChamferedFrameNative>
              </Pressable>
              <Pressable onPress={handleDone} style={styles.doneBtnWrap}>
                <PredictOverlayChamferedFrameNative
                  cut={PREDICT_OVERLAY_SUBMIT_BTN_CUT}
                  gradientColors={[
                    "rgba(0,245,255,0.26)",
                    "rgba(0,190,230,0.36)",
                    "rgba(0,110,150,0.46)",
                  ]}
                  gradientLocations={[0, 0.42, 1]}
                  borderColor="rgba(0,245,255,0.42)"
                  shadowColor="#00f5ff"
                  shadowOpacity={0.2}
                  shadowRadius={22}
                  style={styles.doneBtnFrame}
                  contentStyle={styles.doneBtnContent}
                >
                  <Text style={styles.doneBtnText}>{labels.done}</Text>
                </PredictOverlayChamferedFrameNative>
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
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "rgba(9,13,20,0.97)",
    overflow: "hidden",
    shadowColor: "#00f5ff",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
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
    backgroundColor: "rgba(34,211,238,0.35)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
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
    borderBottomColor: "rgba(0,245,255,0.14)",
    overflow: "hidden",
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  kicker: {
    fontFamily: OXANIUM_BOLD,
    color: "rgba(34,211,238,0.58)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 3.2,
    textTransform: "uppercase",
    textShadowColor: "rgba(0,245,255,0.25)",
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
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
  helpBtnFrame: {
    minWidth: 72,
  },
  helpBtnContent: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 10,
  },
  helpBtnText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "600",
  },
  helpBtnTextActive: {
    color: "rgba(224,252,255,0.95)",
  },
  helpPanel: {
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,245,255,0.1)",
    backgroundColor: "rgba(0,245,255,0.04)",
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
    borderBottomColor: "rgba(0,245,255,0.1)",
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
    color: "rgba(148,163,184,0.78)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  modeRowCompact: {
    flexDirection: "row",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.35)",
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
    borderColor: "rgba(0,245,255,0.32)",
    backgroundColor: "rgba(0,245,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  selectedChipText: {
    color: "rgba(224,252,255,0.94)",
    fontSize: 11,
    fontWeight: "600",
    maxWidth: 200,
  },
  modeBtnActive: {
    backgroundColor: "rgba(0,245,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.32)",
  },
  modeBtnTextActive: {
    color: "rgba(224,252,255,0.96)",
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
    color: "rgba(148,163,184,0.82)",
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
    borderColor: "rgba(0,245,255,0.16)",
    backgroundColor: "rgba(0,0,0,0.12)",
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
    borderColor: "rgba(0,245,255,0.38)",
    borderLeftWidth: 3,
    borderLeftColor: "rgba(0,245,255,0.55)",
    backgroundColor: "rgba(0,245,255,0.08)",
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
    borderColor: "rgba(0,245,255,0.5)",
    backgroundColor: "rgba(0,245,255,0.18)",
  },
  teamCheckMark: {
    color: "rgba(224,252,255,0.98)",
    fontSize: 10,
    fontWeight: "800",
  },
  teamName: {
    flex: 1,
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
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
    borderTopColor: "rgba(0,245,255,0.1)",
  },
  marginSectionDual: {
    paddingVertical: 4,
  },
  marginGlass: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.16)",
    borderRadius: 0,
    backgroundColor: "rgba(255,255,255,0.02)",
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
    color: "rgba(148,163,184,0.82)",
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
    color: "rgba(165,243,252,0.5)",
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
    borderTopColor: "rgba(0,245,255,0.12)",
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
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "600",
  },
  clearBtnTextDisabled: {
    color: "rgba(255,255,255,0.72)",
  },
  doneBtnWrap: {
    flexShrink: 0,
  },
  doneBtnFrame: {
    minWidth: 104,
  },
  doneBtnContent: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  doneBtnText: {
    color: "#f0fdff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    textShadowColor: "rgba(0,245,255,0.42)",
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
});
