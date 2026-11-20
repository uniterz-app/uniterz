/**
 * TDL トレード予想バレット — 提出 UI（アワード予想と同型）。
 * 配点・日程は lib の確定値に従う。
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  TRADE_BALLOT_SLOT_COUNT,
  awardCandidateLabel,
  emptyTradeBallotPick,
  filledTradeBallotCount,
  filterAwardCandidatesByPrefix,
  filterTradeBallotTeamsByPrefix,
  isTradeBallotComplete,
  popularAwardPicks,
  tradeBallotDestinationTeams,
  tradeBallotTeamById,
  tradeBallotUsedPlayerIds,
  type NbaAwardCandidate,
  type NbaTradeBallotPrediction,
  type NbaTradeBallotTeamOption,
} from "../../../../../../../lib/predict/nbaTradeBallotPredict";
import { TRADE_BALLOT_CURATED_FEATURED_IDS } from "../../../../../../../lib/predict/nbaTradeBallotPreviewMocks";
import { useSeasonAwardsPlayerCatalog } from "../../../../../../../lib/predict/useSeasonAwardsPlayerCatalog";
import { getUniterzApiBaseUrl } from "../../submitPredictionApi";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../../matchCardTypography";

type Props = {
  value: NbaTradeBallotPrediction;
  onChange?: (next: NbaTradeBallotPrediction) => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  /** 提出後ロック表示 */
  readOnly?: boolean;
};

const OX = "Oxanium_700Bold";

function PlayerPicker({
  selected,
  selectedId,
  catalog,
  usedIds,
  onSelect,
  disabled,
}: {
  selected: NbaAwardCandidate | null;
  selectedId: string | null;
  catalog: readonly NbaAwardCandidate[];
  usedIds: Set<string>;
  onSelect: (id: string | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (selectedId) return [];
    const base = query.trim()
      ? filterAwardCandidatesByPrefix(catalog, query)
      : popularAwardPicks(TRADE_BALLOT_CURATED_FEATURED_IDS, catalog, 8);
    return base.filter((c) => !usedIds.has(c.id));
  }, [catalog, query, selectedId, usedIds]);

  if (selected) {
    return (
      <View style={styles.selectedBox}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.selectedName} numberOfLines={1}>
            {awardCandidateLabel(selected)}
          </Text>
          {selected.teamAbbr ? (
            <Text style={styles.selectedTeam}>NOW · {selected.teamAbbr}</Text>
          ) : null}
        </View>
        {disabled ? null : (
          <Pressable
            onPressIn={() => {
              onSelect(null);
              setQuery("");
              setOpen(false);
            }}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Clear player"
            style={({ pressed }) => [
              styles.clearBtn,
              pressed ? styles.clearBtnPressed : null,
            ]}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (disabled) {
    return (
      <View style={styles.selectedBox}>
        <Text style={styles.inputPlaceholder}>—</Text>
      </View>
    );
  }

  return (
    <View>
      <TextInput
        value={query}
        placeholder="Player name…"
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
          setTimeout(() => setOpen(false), 120);
        }}
        style={styles.input}
      />
      {open ? (
        <View style={styles.dropdown}>
          <Text style={styles.dropdownTitle}>
            {query.trim()
              ? `Suggestions · “${query.trim()}”`
              : "Featured · trade buzz"}
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
  );
}

function TeamPicker({
  teams,
  selected,
  onSelect,
  disabled,
}: {
  teams: readonly NbaTradeBallotTeamOption[];
  selected: NbaTradeBallotTeamOption | null;
  onSelect: (teamId: string | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    if (selected) return [];
    return filterTradeBallotTeamsByPrefix(teams, query, 30);
  }, [query, selected, teams]);

  if (selected) {
    return (
      <View style={styles.selectedBox}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.selectedName} numberOfLines={1}>
            → {selected.abbr}
          </Text>
          <Text style={styles.selectedTeam} numberOfLines={1}>
            {selected.name}
          </Text>
        </View>
        {disabled ? null : (
          <Pressable
            onPressIn={() => {
              onSelect(null);
              setQuery("");
              setOpen(false);
            }}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel="Clear team"
            style={({ pressed }) => [
              styles.clearBtn,
              pressed ? styles.clearBtnPressed : null,
            ]}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (disabled) {
    return (
      <View style={styles.selectedBox}>
        <Text style={styles.inputPlaceholder}>—</Text>
      </View>
    );
  }

  return (
    <View>
      <TextInput
        value={query}
        placeholder="Destination team…"
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
          setTimeout(() => setOpen(false), 120);
        }}
        style={styles.input}
      />
      {open ? (
        <View style={styles.dropdown}>
          <Text style={styles.dropdownTitle}>
            {query.trim() ? `Teams · “${query.trim()}”` : "All teams · 29"}
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
              suggestions.map((t) => (
                <Pressable
                  key={t.teamId}
                  style={styles.suggestion}
                  onPress={() => {
                    onSelect(t.teamId);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {t.abbr}
                  </Text>
                  <Text style={styles.suggestionTeam} numberOfLines={1}>
                    {t.name}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function SlotRow({
  index,
  player,
  playerId,
  toTeamId,
  catalog,
  usedIds,
  onChangePlayer,
  onChangeTeam,
  readOnly,
}: {
  index: number;
  player: NbaAwardCandidate | null;
  playerId: string | null;
  toTeamId: string | null;
  catalog: readonly NbaAwardCandidate[];
  usedIds: Set<string>;
  onChangePlayer: (id: string | null) => void;
  onChangeTeam: (teamId: string | null) => void;
  readOnly?: boolean;
}) {
  const destTeams = useMemo(
    () => tradeBallotDestinationTeams(player?.teamAbbr),
    [player?.teamAbbr]
  );
  const selectedTeam = tradeBallotTeamById(toTeamId);

  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text style={styles.rowLabelEn}>#{String(index + 1).padStart(2, "0")}</Text>
        <Text style={styles.rowLabelFullName}>Player → destination</Text>
      </View>

      <PlayerPicker
        selected={player}
        selectedId={playerId}
        catalog={catalog}
        usedIds={usedIds}
        onSelect={onChangePlayer}
        disabled={readOnly}
      />

      {playerId ? (
        <View style={{ marginTop: 8 }}>
          <TeamPicker
            teams={destTeams}
            selected={selectedTeam}
            onSelect={onChangeTeam}
            disabled={readOnly}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function NbaTradeBallotPredictPanelNative({
  value,
  onChange,
  onSubmit,
  submitDisabled,
  readOnly,
}: Props) {
  const filled = filledTradeBallotCount(value.picks);
  const allDone = isTradeBallotComplete(value);
  const { players, loading } = useSeasonAwardsPlayerCatalog({
    season: value.season,
    apiBaseUrl: getUniterzApiBaseUrl(),
  });

  const candidateById = useMemo(() => {
    const m = new Map<string, NbaAwardCandidate>();
    for (const c of players) m.set(c.id, c);
    return m;
  }, [players]);

  const updatePick = (
    index: number,
    patch: Partial<{ playerId: string | null; toTeamId: string | null }>
  ) => {
    if (!onChange || readOnly) return;
    const next = value.picks.map((p, i) => {
      if (i !== index) return p;
      const merged = { ...p, ...patch };
      if (patch.playerId !== undefined && patch.playerId !== p.playerId) {
        merged.toTeamId = null;
      }
      return merged;
    });
    onChange({ ...value, picks: next });
  };

  return (
    <View style={styles.card}>
      <View style={{ gap: 4, marginBottom: 12 }}>
        <Text style={styles.h2}>Trade ballot · {value.season}</Text>
        <Text style={styles.lead}>
          TDL で移籍しそうな選手を 7 人選び、移籍先チームもセットで提出。総合は 7
          枠合計の 700 点満点。締切は TDL の 3 日前。当たった枠は固定、ほかは締切まで変更可。
        </Text>
        {loading ? (
          <Text style={styles.loadingRoster}>Loading roster…</Text>
        ) : null}
      </View>

      <View style={styles.scoreHint}>
        <Text style={styles.scoreHintTitle}>Score · /700</Text>
        <Text style={styles.scoreHintLine}>Player hit · 40</Text>
        <Text style={styles.scoreHintLine}>Team hit · +30</Text>
        <Text style={styles.scoreHintLine}>
          Rarity · +0 / +5 / +10 / +20 / +30（50%+ → +0）
        </Text>
        <Text style={styles.scoreHintLine}>
          Close · Feb 8 23:59 JST · hit slots lock
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {value.picks.map((pick, index) => {
          const playerId =
            typeof pick.playerId === "string" && pick.playerId.trim()
              ? pick.playerId.trim()
              : null;
          const player = playerId ? candidateById.get(playerId) ?? null : null;
          return (
            <SlotRow
              key={`slot-${index}`}
              index={index}
              player={player}
              playerId={playerId}
              toTeamId={pick.toTeamId}
              catalog={players}
              usedIds={tradeBallotUsedPlayerIds(value.picks, index)}
              readOnly={readOnly}
              onChangePlayer={(id) => updatePick(index, { playerId: id })}
              onChangeTeam={(teamId) => updatePick(index, { toTeamId: teamId })}
            />
          );
        })}
      </View>

      {onSubmit && !readOnly ? (
        <View style={styles.submitRow}>
          <Text style={[styles.progress, allDone && styles.progressReady]}>
            {allDone
              ? `Ready to submit · ${TRADE_BALLOT_SLOT_COUNT}/${TRADE_BALLOT_SLOT_COUNT}`
              : `Progress · ${filled}/${TRADE_BALLOT_SLOT_COUNT}`}
          </Text>
          <Pressable
            disabled={submitDisabled || !allDone}
            onPress={() => {
              if (!allDone) return;
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
              {submitDisabled ? "Submitting…" : "Submit ballot"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {readOnly ? (
        <View style={styles.submitRow}>
          <Text style={[styles.progress, styles.progressReady]}>
            Submitted · mock lock
          </Text>
          {onChange ? (
            <Pressable
              onPress={() =>
                onChange({
                  ...value,
                  picks: value.picks.map(() => emptyTradeBallotPick()),
                })
              }
              style={[styles.submitBtn, styles.submitBtnReady]}
            >
              <Text style={styles.submitBtnText}>Reset mock</Text>
            </Pressable>
          ) : null}
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
  scoreHint: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  scoreHintTitle: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    color: "rgba(252,211,77,0.75)",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  scoreHintLine: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.4)",
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
  clearBtnPressed: { opacity: 0.55 },
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
  inputPlaceholder: {
    fontFamily: OX,
    fontSize: 15,
    fontWeight: "700",
    color: "rgba(255,255,255,0.25)",
  },
  dropdown: {
    marginTop: 4,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(6,10,16,0.98)",
  },
  dropdownScroll: { flexGrow: 0 },
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
