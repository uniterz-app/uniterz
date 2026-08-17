/** Web `NbaSeasonAwardsPredictPanel` 相当（人気5 + 前方一致サジェスト・名簿はモック） */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  NBA_SEASON_AWARD_DEFS,
  awardCandidateLabel,
  filterAwardCandidatesByPrefix,
  filledSeasonAwardsCount,
  isSeasonAwardsComplete,
  popularAwardPicks,
  type NbaAwardCandidate,
  type NbaAwardId,
  type NbaSeasonAwardsPrediction,
  SEASON_AWARDS_SCORE_PREVIEW,
} from "../../../../../../../lib/predict/nbaSeasonAwardsPredict";
import {
  awardsPreviewCatalog,
  AWARDS_PREVIEW_POPULAR,
} from "../../../../../../../lib/predict/nbaSeasonAwardsPreviewMocks";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../../matchCardTypography";

type Props = {
  value: NbaSeasonAwardsPrediction;
  onChange?: (next: NbaSeasonAwardsPrediction) => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
};

const OX = "Oxanium_700Bold";

function findInCatalog(
  id: string | null | undefined,
  catalog: readonly NbaAwardCandidate[]
): NbaAwardCandidate | null {
  if (!id) return null;
  return catalog.find((c) => c.id === id) ?? null;
}

function AwardPickRow({
  awardId,
  labelEn,
  labelJa,
  kind,
  selectedId,
  onSelect,
}: {
  awardId: NbaAwardId;
  labelEn: string;
  labelJa: string;
  kind: "player" | "coach";
  selectedId: string | null | undefined;
  onSelect: (id: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const catalog = awardsPreviewCatalog(kind);
  const selected = findInCatalog(selectedId, catalog);

  const suggestions = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return popularAwardPicks(AWARDS_PREVIEW_POPULAR[awardId], catalog);
    return filterAwardCandidatesByPrefix(catalog, trimmed);
  }, [awardId, catalog, query]);

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text style={styles.rowLabelEn}>{labelEn}</Text>
        <Text style={styles.rowLabelJa}>{labelJa}</Text>
      </View>

      {selected ? (
        <View style={styles.selectedBox}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.selectedName} numberOfLines={1}>
              {awardCandidateLabel(selected)}
            </Text>
            {selected.teamAbbr ? <Text style={styles.selectedTeam}>{selected.teamAbbr}</Text> : null}
          </View>
          <Pressable
            onPress={() => {
              onSelect(null);
              setQuery("");
              setOpen(false);
            }}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        </View>
      ) : (
        <View>
          <TextInput
            value={query}
            placeholder={kind === "coach" ? "Coach name…" : "Player name…"}
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            onFocus={() => setOpen(true)}
            onChangeText={(t) => {
              setQuery(t);
              setOpen(true);
            }}
            style={styles.input}
          />
          {open ? (
            <View style={styles.dropdown}>
              <Text style={styles.dropdownTitle}>
                {query.trim() ? `Suggestions · “${query.trim()}”` : "Popular picks · top 5"}
              </Text>
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
                    {c.teamAbbr ? <Text style={styles.suggestionTeam}>{c.teamAbbr}</Text> : null}
                  </Pressable>
                ))
              )}
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
}: Props) {
  const filled = filledSeasonAwardsCount(value.picks);
  const total = NBA_SEASON_AWARD_DEFS.length;
  const allDone = isSeasonAwardsComplete(value);

  return (
    <View style={styles.card}>
      <View style={{ gap: 4, marginBottom: 12 }}>
        <Text style={styles.h2}>Season awards · {value.season}</Text>
        <Text style={styles.lead}>
          フォーカス直後は他ユーザー人気ピック約 5 人。入力すると N → NI → NIK の前方一致。選手名簿は API
          契約後に差し替え。採点は未定（仮 +{SEASON_AWARDS_SCORE_PREVIEW.exact}pt）。
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {NBA_SEASON_AWARD_DEFS.map((def) => (
          <AwardPickRow
            key={def.id}
            awardId={def.id}
            labelEn={def.labelEn}
            labelJa={def.labelJa}
            kind={def.kind}
            selectedId={value.picks[def.id]}
            onSelect={(id) =>
              onChange?.({ ...value, picks: { ...value.picks, [def.id]: id } })
            }
          />
        ))}
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
  row: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowHead: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 8 },
  rowLabelEn: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(253,230,138,0.85)",
    textTransform: "uppercase",
  },
  rowLabelJa: { fontSize: 11, color: "rgba(255,255,255,0.4)" },
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
  noMatch: { paddingHorizontal: 10, paddingVertical: 12, fontSize: 11, color: "rgba(255,255,255,0.35)" },
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
