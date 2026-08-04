/** Web `NbaSeasonStandingsPredictPanel` 相当（順位タップ → チームスロット配置） */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import JerseyMarkSvg from "../../JerseyMarkSvg";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../../rankings/CyberSlantedTabNative";
import type { NbaConferenceId } from "../../../../../../../lib/nba/nbaConferenceTeams";
import { NBA_STANDINGS_RANKS } from "../../../../../../../lib/nba/nbaConferenceTeams";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../../lib/nba-team-names";
import { TEAM_SHORT } from "../../../../../../../lib/team-short";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
  softenTeamUiColor,
} from "../../../../../../../lib/team-colors";
import {
  assignTeamToRank,
  availableTeamIds,
  clearRank,
  filledRankCount,
  firstEmptyRank,
  isConferenceComplete,
  type NbaConferenceStandingsPicks,
  type NbaSeasonStandingsPrediction,
  type NbaStandingsRank,
  SEASON_STANDINGS_SCORE_PREVIEW,
} from "../../../../../../../lib/predict/nbaSeasonStandingsPredict";

type Props = {
  value: NbaSeasonStandingsPrediction;
  onChange: (next: NbaSeasonStandingsPrediction) => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
};

type StandingsBand = "straight" | "playin" | "out";

const OX = "Oxanium_700Bold";

function bandForRank(rank: NbaStandingsRank): StandingsBand {
  if (rank <= 6) return "straight";
  if (rank <= 10) return "playin";
  return "out";
}

function fullName(teamId: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  if (full) return full.toUpperCase();
  return (TEAM_SHORT[teamId] ?? teamId).toUpperCase();
}

function abbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? "—").toUpperCase();
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return `rgba(0,245,255,${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ZoneDivider({ label, tone }: { label: string; tone: StandingsBand }) {
  const lineColor =
    tone === "straight"
      ? "rgba(103,232,249,0.2)"
      : tone === "playin"
        ? "rgba(252,211,77,0.18)"
        : "rgba(255,255,255,0.1)";
  const textColor =
    tone === "straight"
      ? "rgba(165,243,252,0.45)"
      : tone === "playin"
        ? "rgba(253,230,138,0.4)"
        : "rgba(255,255,255,0.28)";
  return (
    <View style={styles.zoneRow}>
      <View style={[styles.zoneLine, { backgroundColor: lineColor }]} />
      <Text style={[styles.zoneLabel, { color: textColor }]}>{label}</Text>
      <View style={[styles.zoneLine, { backgroundColor: lineColor }]} />
    </View>
  );
}

function RankRow({
  rank,
  teamId,
  selected,
  onSelect,
}: {
  rank: NbaStandingsRank;
  teamId: string | null | undefined;
  selected: boolean;
  onSelect: () => void;
}) {
  const primary = teamId
    ? softenTeamUiColor(getTeamJerseyPrimaryColor("nba", teamId))
    : "#00F5FF";
  const filled = Boolean(teamId);
  const band = bandForRank(rank);
  const rankColor =
    band === "straight"
      ? "rgba(165,243,252,0.7)"
      : band === "playin"
        ? "rgba(253,230,138,0.55)"
        : "rgba(255,255,255,0.35)";

  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.rankRow,
        selected
          ? styles.rankRowSelected
          : filled
            ? { borderColor: hexToRgba(primary, 0.35), backgroundColor: "rgba(255,255,255,0.025)" }
            : styles.rankRowEmpty,
      ]}
    >
      <Text style={[styles.rankNum, { color: rankColor }]}>{rank}</Text>
      {filled && teamId ? (
        <>
          <JerseyMarkSvg
            accent={getTeamJerseyPrimaryColor("nba", teamId)}
            accentEnd={getTeamJerseySecondaryColor("nba", teamId)}
            size={28}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.rankTeamName} numberOfLines={1}>
              {fullName(teamId)}
            </Text>
            {selected ? <Text style={styles.rankHint}>もう一度タップでクリア</Text> : null}
          </View>
        </>
      ) : (
        <Text style={styles.rankPlaceholder}>
          {selected ? "下からチームを選ぶ" : "タップして配置"}
        </Text>
      )}
    </Pressable>
  );
}

function TeamSlotTray({
  teamIds,
  onPick,
}: {
  teamIds: string[];
  onPick: (teamId: string) => void;
}) {
  if (teamIds.length === 0) {
    return <Text style={styles.trayEmpty}>全チーム配置済み</Text>;
  }
  return (
    <View style={styles.tray}>
      {teamIds.map((teamId) => {
        const primary = softenTeamUiColor(getTeamJerseyPrimaryColor("nba", teamId));
        return (
          <Pressable
            key={teamId}
            onPress={() => onPick(teamId)}
            style={[
              styles.trayItem,
              { borderColor: hexToRgba(primary, 0.4), backgroundColor: hexToRgba(primary, 0.07) },
            ]}
          >
            <JerseyMarkSvg
              accent={getTeamJerseyPrimaryColor("nba", teamId)}
              accentEnd={getTeamJerseySecondaryColor("nba", teamId)}
              size={32}
            />
            <Text style={styles.trayAbbr}>{abbr(teamId)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ConferenceBoard({
  conference,
  picks,
  onPicksChange,
}: {
  conference: NbaConferenceId;
  picks: NbaConferenceStandingsPicks;
  onPicksChange: (next: NbaConferenceStandingsPicks) => void;
}) {
  const [selectedRank, setSelectedRank] = useState<NbaStandingsRank | null>(null);

  const available = useMemo(() => {
    const ids = availableTeamIds(conference, picks);
    return [...ids].sort((a, b) => {
      const na = NBA_TEAM_NAME_BY_ID[a] ?? TEAM_SHORT[a] ?? a;
      const nb = NBA_TEAM_NAME_BY_ID[b] ?? TEAM_SHORT[b] ?? b;
      return na.localeCompare(nb, "en", { sensitivity: "base" });
    });
  }, [conference, picks]);
  const filled = filledRankCount(picks);
  const complete = isConferenceComplete(picks);

  const place = (teamId: string) => {
    if (selectedRank == null) return;
    const result = assignTeamToRank(conference, picks, selectedRank, teamId);
    if (!result.ok) return;
    onPicksChange(result.picks);
    setSelectedRank(firstEmptyRank(result.picks));
  };

  const onRankTap = (rank: NbaStandingsRank) => {
    if (selectedRank === rank) {
      if (picks[rank]) {
        onPicksChange(clearRank(picks, rank));
        setSelectedRank(rank);
        return;
      }
      setSelectedRank(null);
      return;
    }
    setSelectedRank(rank);
  };

  const ranks = Array.from(
    { length: NBA_STANDINGS_RANKS },
    (_, i) => (i + 1) as NbaStandingsRank
  );

  const renderRankBlock = (list: NbaStandingsRank[]) =>
    list.map((rank) => (
      <View key={rank} style={{ gap: 6 }}>
        <RankRow
          rank={rank}
          teamId={picks[rank]}
          selected={selectedRank === rank}
          onSelect={() => onRankTap(rank)}
        />
        {selectedRank === rank ? (
          <View style={styles.slotBox}>
            <Text style={styles.slotTitle}>
              Team slots · #{rank}
              <Text style={styles.slotLeft}> · {available.length} left</Text>
            </Text>
            <TeamSlotTray teamIds={available} onPick={place} />
          </View>
        ) : null}
      </View>
    ));

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.boardHead}>
        <Text style={styles.boardTitle}>
          {conference === "east" ? "Eastern" : "Western"} · 1–15
        </Text>
        <Text style={[styles.boardCount, complete ? styles.boardCountDone : null]}>
          {filled}/{NBA_STANDINGS_RANKS}
        </Text>
      </View>

      <ZoneDivider label="Straight in · 1–6" tone="straight" />
      <View style={{ gap: 4 }}>{renderRankBlock(ranks.slice(0, 6))}</View>

      <ZoneDivider label="Play-in · 7–10" tone="playin" />
      <View style={{ gap: 4 }}>{renderRankBlock(ranks.slice(6, 10))}</View>

      <ZoneDivider label="Out · 11–15" tone="out" />
      <View style={{ gap: 4 }}>{renderRankBlock(ranks.slice(10))}</View>

      <Text style={styles.boardNote}>
        順位をタップ → 下にチームスロット。配置済みはスロットから消えます。同じ順位をもう一度タップでクリア。
      </Text>
    </View>
  );
}

export default function NbaSeasonStandingsPredictPanelNative({
  value,
  onChange,
  onSubmit,
  submitDisabled,
}: Props) {
  const [conference, setConference] = useState<NbaConferenceId>("east");
  const eastDone = isConferenceComplete(value.east);
  const westDone = isConferenceComplete(value.west);
  const allDone = eastDone && westDone;

  return (
    <View style={styles.card}>
      <View style={{ gap: 4, marginBottom: 12 }}>
        <Text style={styles.h2}>Season standings · {value.season}</Text>
        <Text style={styles.lead}>
          1–6 ストレートイン / 7–10 プレーイン / 11–15 圏外。シーズン終了後に採点。 仮: 完全一致 +
          {SEASON_STANDINGS_SCORE_PREVIEW.exact} · ±1 +{SEASON_STANDINGS_SCORE_PREVIEW.within1} · ±2 +
          {SEASON_STANDINGS_SCORE_PREVIEW.within2}。
        </Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <CyberSlantedTabBarNative fill>
          <CyberSlantedTabNative
            label={eastDone ? "EAST ✓" : "EAST"}
            active={conference === "east"}
            onPress={() => setConference("east")}
            compact
            fontWeight="700"
          />
          <CyberSlantedTabNative
            label={westDone ? "WEST ✓" : "WEST"}
            active={conference === "west"}
            onPress={() => setConference("west")}
            compact
            fontWeight="700"
          />
        </CyberSlantedTabBarNative>
      </View>

      {conference === "east" ? (
        <ConferenceBoard
          conference="east"
          picks={value.east}
          onPicksChange={(east) => onChange({ ...value, east })}
        />
      ) : (
        <ConferenceBoard
          conference="west"
          picks={value.west}
          onPicksChange={(west) => onChange({ ...value, west })}
        />
      )}

      <View style={styles.footer}>
        <Text style={[styles.footerNote, allDone ? styles.footerNoteDone : null]}>
          {allDone
            ? "Ready to submit · East + West complete"
            : `Progress · E ${filledRankCount(value.east)}/15 · W ${filledRankCount(value.west)}/15`}
        </Text>
        <Pressable
          disabled={submitDisabled}
          onPress={() => {
            onSubmit?.();
          }}
          style={[styles.submitBtn, allDone && !submitDisabled ? styles.submitBtnOn : styles.submitBtnOff]}
        >
          <Text style={[styles.submitText, allDone && !submitDisabled ? styles.submitTextOn : styles.submitTextOff]}>
            {submitDisabled ? "Submitting…" : "Submit prediction"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(6,10,16,0.96)",
    padding: 12,
  },
  h2: {
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "#a5f3fc",
    textTransform: "uppercase",
  },
  lead: { fontSize: 11, lineHeight: 16, color: "rgba(255,255,255,0.45)" },
  zoneRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  zoneLine: { flex: 1, height: 1 },
  zoneLabel: { fontFamily: OX, fontSize: 8, fontWeight: "700", letterSpacing: 1.6, textTransform: "uppercase" },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rankRowSelected: { borderColor: "rgba(103,232,249,0.55)", backgroundColor: "rgba(103,232,249,0.08)" },
  rankRowEmpty: { borderColor: "rgba(255,255,255,0.12)", borderStyle: "dashed", backgroundColor: "transparent" },
  rankNum: { width: 24, fontFamily: OX, fontSize: 12, fontWeight: "900", fontVariant: ["tabular-nums"] },
  rankTeamName: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#fff",
    textTransform: "uppercase",
  },
  rankHint: { marginTop: 1, fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.32)" },
  rankPlaceholder: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.28)",
    textTransform: "uppercase",
  },
  slotBox: {
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.2)",
    backgroundColor: "rgba(4,10,16,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  slotTitle: {
    marginBottom: 6,
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(165,243,252,0.5)",
    textTransform: "uppercase",
  },
  slotLeft: { color: "rgba(255,255,255,0.3)" },
  tray: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  trayItem: {
    width: "18%",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  trayAbbr: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.85)",
  },
  trayEmpty: { paddingHorizontal: 4, paddingVertical: 8, fontSize: 11, color: "rgba(255,255,255,0.35)" },
  boardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 2 },
  boardTitle: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  boardCount: { fontFamily: OX, fontSize: 10, fontWeight: "800", color: "rgba(165,243,252,0.7)", fontVariant: ["tabular-nums"] },
  boardCountDone: { color: "rgba(45,255,110,0.85)" },
  boardNote: { paddingTop: 4, fontSize: 10, lineHeight: 15, color: "rgba(255,255,255,0.3)" },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 12,
    gap: 8,
  },
  footerNote: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  footerNoteDone: { color: "rgba(45,255,110,0.85)" },
  submitBtn: { alignSelf: "flex-start", borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  submitBtnOn: { borderColor: "rgba(103,232,249,0.5)", backgroundColor: "rgba(103,232,249,0.2)" },
  submitBtnOff: { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)" },
  submitText: { fontFamily: OX, fontSize: 11, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  submitTextOn: { color: "#ecfeff" },
  submitTextOff: { color: "rgba(255,255,255,0.3)" },
});
