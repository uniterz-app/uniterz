/** Web `NbaSeasonAwardsPredictPanel` 相当（運営指定候補5 + ロスター全選手検索） */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { UiStrings } from "../../../../../../../lib/i18n/ui";
import {
  NBA_SEASON_AWARD_DEFS,
  awardCandidateLabel,
  awardName,
  filterAwardCandidatesByPrefix,
  filledSeasonAwardsCount,
  isSeasonAwardsComplete,
  popularAwardPicks,
  type NbaAwardCandidate,
  type NbaAwardId,
  type NbaSeasonAwardsPrediction,
} from "../../../../../../../lib/predict/nbaSeasonAwardsPredict";
import { AWARDS_PREVIEW_COACHES } from "../../../../../../../lib/predict/nbaSeasonAwardsPreviewMocks";
import { SEASON_AWARDS_CURATED_POPULAR } from "../../../../../../../lib/predict/seasonAwardsCuratedPopular";
import { seasonAwardsCatalogForAward } from "../../../../../../../lib/predict/seasonAwardsCatalogFromRosters";
import { useSeasonAwardsPlayerCatalog } from "../../../../../../../lib/predict/useSeasonAwardsPlayerCatalog";
import {
  seasonPredictAwardsPredictHint,
  type SeasonPredictUiLang,
} from "../../../../../../../lib/predict/seasonPredictUiCopy";
import { getUniterzApiBaseUrl } from "../../submitPredictionApi";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../../matchCardTypography";

type Props = {
  value: NbaSeasonAwardsPrediction;
  onChange?: (next: NbaSeasonAwardsPrediction) => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  language?: SeasonPredictUiLang;
};

const OX = "Oxanium_700Bold";

function awardSearchPlaceholder(
  awardId: NbaAwardId,
  kind: "player" | "coach"
): string {
  if (awardId === "roy") return "Rookie name…";
  if (kind === "coach") return "Coach name…";
  return "Player name…";
}

function AwardPickRow({
  awardId,
  labelEn,
  name,
  kind,
  selected,
  selectedId,
  onSelect,
  language,
  catalog,
}: {
  awardId: NbaAwardId;
  labelEn: string;
  name: UiStrings;
  kind: "player" | "coach";
  selected: NbaAwardCandidate | null;
  selectedId: string | null | undefined;
  onSelect: (id: string | null) => void;
  language: SeasonPredictUiLang;
  catalog: readonly NbaAwardCandidate[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const placeholder = awardSearchPlaceholder(awardId, kind);

  const suggestions = useMemo(() => {
    if (selectedId) return [];
    const trimmed = query.trim();
    if (!trimmed) {
      // COTY: HC は知名度差が大きいので全30人を出す
      if (awardId === "coty") return [...catalog];
      return popularAwardPicks(
        SEASON_AWARDS_CURATED_POPULAR[awardId],
        catalog
      );
    }
    return filterAwardCandidatesByPrefix(catalog, trimmed);
  }, [awardId, catalog, query, selectedId]);

  const clearSelection = () => {
    onSelect(null);
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text style={styles.rowLabelEn}>{labelEn}</Text>
        <Text style={styles.rowLabelFullName}>
          {awardName(language, { name })}
        </Text>
      </View>

      {selected ? (
        <View style={styles.selectedBox}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.selectedName} numberOfLines={1}>
              {awardCandidateLabel(selected)}
            </Text>
            {selected.teamAbbr ? (
              <Text style={styles.selectedTeam}>{selected.teamAbbr}</Text>
            ) : null}
          </View>
          <Pressable
            onPressIn={clearSelection}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Clear"
            style={({ pressed }) => [
              styles.clearBtn,
              pressed ? styles.clearBtnPressed : null,
            ]}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        </View>
      ) : awardId === "coty" ? (
        <View>
          <Pressable
            onPress={() => setOpen((v) => !v)}
            style={styles.input}
            accessibilityRole="button"
            accessibilityLabel="Select head coach"
          >
            <Text style={styles.inputPlaceholder}>
              {open ? "Tap to close list…" : "Select head coach…"}
            </Text>
          </Pressable>
          {open ? (
            <View style={styles.coachList}>
              <Text style={styles.dropdownTitle}>All head coaches · 30</Text>
              {suggestions.map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.suggestion}
                  onPress={() => {
                    onSelect(c.id);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {awardCandidateLabel(c)}
                  </Text>
                  {c.teamAbbr ? (
                    <Text style={styles.suggestionTeam}>{c.teamAbbr}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View>
          <TextInput
            value={query}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            onFocus={() => setOpen(true)}
            onChangeText={(t) => {
              setQuery(t);
              setOpen(true);
            }}
            onBlur={() => {
              // 候補タップを先に処理させる
              setTimeout(() => setOpen(false), 120);
            }}
            style={styles.input}
          />
          {open ? (
            <View style={styles.dropdown}>
              <Text style={styles.dropdownTitle}>
                {query.trim()
                  ? `Suggestions · “${query.trim()}”`
                  : "Featured · top 5"}
              </Text>
              <ScrollView
                style={styles.dropdownScroll}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {suggestions.length === 0 ? (
                  <Text style={styles.noMatch}>No matches</Text>
                ) : (
                  suggestions.map((c) => (
                    <Pressable
                      key={c.id}
                      style={styles.suggestion}
                      onPress={() => {
                        onSelect(c.id);
                        setQuery("");
                        setOpen(false);
                      }}
                    >
                      <Text style={styles.suggestionName} numberOfLines={1}>
                        {awardCandidateLabel(c)}
                      </Text>
                      {c.teamAbbr ? (
                        <Text style={styles.suggestionTeam}>{c.teamAbbr}</Text>
                      ) : null}
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default function NbaSeasonAwardsPredictPanelNative({
  value,
  onChange,
  onSubmit,
  submitDisabled,
  language = "ja",
}: Props) {
  const filled = filledSeasonAwardsCount(value.picks);
  const total = NBA_SEASON_AWARD_DEFS.length;
  const allDone = isSeasonAwardsComplete(value);
  const { players, loading } = useSeasonAwardsPlayerCatalog({
    season: value.season,
    apiBaseUrl: getUniterzApiBaseUrl(),
  });
  const catalogsByAward = useMemo(() => {
    const out = {} as Record<NbaAwardId, readonly NbaAwardCandidate[]>;
    for (const def of NBA_SEASON_AWARD_DEFS) {
      out[def.id] = seasonAwardsCatalogForAward(
        def.id,
        players,
        value.season,
        AWARDS_PREVIEW_COACHES
      );
    }
    return out;
  }, [players, value.season]);
  const candidateById = useMemo(() => {
    const m = new Map<string, NbaAwardCandidate>();
    for (const list of Object.values(catalogsByAward)) {
      for (const c of list) m.set(c.id, c);
    }
    return m;
  }, [catalogsByAward]);

  return (
    <View style={styles.card}>
      <View style={{ gap: 4, marginBottom: 12 }}>
        <Text style={styles.h2}>Season awards · {value.season}</Text>
        <Text style={styles.lead}>
          {seasonPredictAwardsPredictHint(language)}
        </Text>
        {loading ? (
          <Text style={styles.loadingRoster}>Loading roster…</Text>
        ) : null}
      </View>

      <View style={{ gap: 10 }}>
        {NBA_SEASON_AWARD_DEFS.map((def) => {
          const selectedId = value.picks[def.id];
          return (
            <AwardPickRow
              key={def.id}
              awardId={def.id}
              labelEn={def.labelEn}
              name={def.name}
              kind={def.kind}
              catalog={catalogsByAward[def.id] ?? []}
              selected={
                typeof selectedId === "string" && selectedId
                  ? candidateById.get(selectedId) ?? null
                  : null
              }
              selectedId={selectedId}
              language={language}
              onSelect={(id) =>
                onChange?.({
                  ...value,
                  picks: { ...value.picks, [def.id]: id },
                })
              }
            />
          );
        })}
      </View>

      {onSubmit ? (
        <View style={styles.submitRow}>
          <Text style={[styles.progress, allDone && styles.progressReady]}>
            {allDone
              ? "Ready to submit · all awards picked"
              : `Progress · ${filled}/${total}`}
          </Text>
          <Pressable
            disabled={submitDisabled}
            onPress={() => {
              onSubmit();
            }}
            style={[
              styles.submitBtn,
              allDone && !submitDisabled
                ? styles.submitBtnReady
                : styles.submitBtnDisabled,
            ]}
          >
            <Text
              style={[
                styles.submitBtnText,
                !(allDone && !submitDisabled) && styles.submitBtnTextDisabled,
              ]}
            >
              {submitDisabled ? "Submitting…" : "Submit prediction"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.25)",
    backgroundColor: "rgba(6,10,16,0.96)",
    padding: 12,
  },
  h2: {
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(253,230,138,0.9)",
    textTransform: "uppercase",
  },
  lead: { fontSize: 11, lineHeight: 16, color: "rgba(255,255,255,0.45)" },
  loadingRoster: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
  },
  row: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "visible",
    zIndex: 1,
  },
  rowHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 8,
  },
  rowLabelEn: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(253,230,138,0.85)",
    textTransform: "uppercase",
  },
  rowLabelFullName: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
  selectedBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.25)",
    backgroundColor: "rgba(252,211,77,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectedName: {
    ...MATCH_CARD_BRACKET_TEXT,
    fontSize: 13,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    color: "#fff",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  selectedTeam: {
    ...MATCH_CARD_BRACKET_TEXT,
    fontSize: 10,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    color: "rgba(255,255,255,0.35)",
    transform: [{ skewX: "-6deg" }],
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnPressed: {
    opacity: 0.55,
  },
  clearText: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(4,10,16,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontFamily: OX,
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  dropdown: {
    marginTop: 4,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(6,10,16,0.98)",
  },
  dropdownScroll: {
    flexGrow: 0,
  },
  /** COTY: 内側スクロールせず親ページで全部見せる（誤選択防止） */
  coachList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(6,10,16,0.98)",
  },
  dropdownTitle: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  noMatch: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  suggestionName: {
    ...MATCH_CARD_BRACKET_TEXT,
    flex: 1,
    fontSize: 12,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  suggestionTeam: {
    ...MATCH_CARD_BRACKET_TEXT,
    fontSize: 10,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    color: "rgba(255,255,255,0.3)",
    transform: [{ skewX: "-6deg" }],
  },
  submitRow: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    gap: 10,
  },
  progress: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  progressReady: { color: "rgba(45,255,110,0.85)" },
  submitBtn: {
    alignSelf: "stretch",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  submitBtnReady: {
    borderColor: "rgba(252,211,77,0.5)",
    backgroundColor: "rgba(252,211,77,0.2)",
  },
  submitBtnDisabled: {
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  submitBtnText: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "center",
    color: "rgba(255,251,235,0.95)",
    textTransform: "uppercase",
  },
  submitBtnTextDisabled: { color: "rgba(255,255,255,0.3)" },
});
