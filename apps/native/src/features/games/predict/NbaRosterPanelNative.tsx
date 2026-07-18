/** Web `NbaRosterPanel` 相当（折りたたみ + 全17列スタッツ横スクロール + ジャージ/シード/稼働数） */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  playerCardName,
  sortRosterPlayers,
  type NbaRosterPlayer,
  type NbaRosterReport,
  type NbaRosterTeamBlock,
} from "../../../../../../lib/predict/nbaRoster";
import {
  injuryStatusLabel,
  injuryStatusTone,
} from "../../../../../../lib/predict/nbaInjuryReport";
import {
  getTeamJerseyPrimaryColor,
} from "../../../../../../lib/team-colors";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { TEAM_SHORT } from "../../../../../../lib/team-short";

type Props = {
  report: NbaRosterReport;
  injuryById?: Record<string, string>;
};

const STAT_COLS = [
  { key: "gp", label: "GP" },
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "fg", label: "FG%" },
  { key: "fgm", label: "FGM" },
  { key: "fga", label: "FGA" },
  { key: "fg3", label: "3P%" },
  { key: "fg3m", label: "3PM" },
  { key: "fg3a", label: "3PA" },
  { key: "ft", label: "FT%" },
  { key: "ftm", label: "FTM" },
  { key: "fta", label: "FTA" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "tov", label: "TO" },
] as const;

const EMPHASIS = new Set(["pts", "fg", "fg3", "fga", "fg3a"]);
const IDENTITY_W = 148;
const STAT_COL_W = 38;
const ROW_H = 34;
const HEADER_H = 26;

const INJURY_CHIP: Record<string, { border: string; bg: string; text: string }> = {
  out: { border: "rgba(255,45,120,0.7)", bg: "rgba(255,45,120,0.2)", text: "#FF8AB4" },
  doubt: { border: "rgba(255,138,61,0.7)", bg: "rgba(255,138,61,0.18)", text: "#FFB07A" },
  question: { border: "rgba(245,197,24,0.7)", bg: "rgba(245,197,24,0.15)", text: "#F5C518" },
  probable: { border: "rgba(0,229,255,0.6)", bg: "rgba(0,229,255,0.12)", text: "#00E5FF" },
  available: { border: "rgba(45,255,110,0.5)", bg: "rgba(45,255,110,0.1)", text: "#2DFF6E" },
  neutral: { border: "rgba(255,255,255,0.25)", bg: "rgba(255,255,255,0.08)", text: "rgba(255,255,255,0.6)" },
};

function teamFullLabel(teamId: string, fallback: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  if (full) return getMobileTeamName("nba", full).toUpperCase();
  return fallback.toUpperCase();
}
function teamAbbr(teamId: string): string {
  return (TEAM_SHORT[teamId] ?? teamId.slice(-3)).toUpperCase();
}
function fmt(n: number | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}
function fmtPct(n: number | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const pct = n <= 1 ? n * 100 : n;
  return pct.toFixed(1);
}
function playerStats(p: NbaRosterPlayer): string[] {
  return [
    String(p.gp),
    fmt(p.mpg),
    fmt(p.ppg),
    fmt(p.rpg),
    fmt(p.apg),
    fmtPct(p.fgPct),
    fmt(p.fgm),
    fmt(p.fga),
    fmtPct(p.fg3Pct),
    fmt(p.fg3m),
    fmt(p.fg3a),
    fmtPct(p.ftPct),
    fmt(p.ftm),
    fmt(p.fta),
    fmt(p.spg),
    fmt(p.bpg),
    fmt(p.tpg),
  ];
}

function InjuryChip({ status }: { status: string }) {
  const tone = injuryStatusTone(status);
  const c = INJURY_CHIP[tone] ?? INJURY_CHIP.neutral;
  return (
    <View style={[styles.injuryChip, { borderColor: c.border, backgroundColor: c.bg }]}>
      <Text style={[styles.injuryChipText, { color: c.text }]} numberOfLines={1}>
        {injuryStatusLabel(status)}
      </Text>
    </View>
  );
}

function IdentityRow({
  player,
  accent,
  injuryStatus,
}: {
  player: NbaRosterPlayer;
  accent: string;
  injuryStatus?: string;
}) {
  const jersey = player.jerseyNumber?.replace(/^#/, "") ?? "—";
  const stroke = player.dimmed ? "rgba(255,255,255,0.35)" : accent;
  return (
    <View style={[styles.identityRow, player.dimmed && styles.dim]}>
      <View style={[styles.jerseyBox, { borderColor: stroke }]}>
        <Text style={[styles.jerseyText, { color: stroke }]}>{jersey}</Text>
      </View>
      <View style={styles.identityNameCol}>
        <View style={styles.identityNameRow}>
          <Text style={styles.playerName} numberOfLines={1}>
            {playerCardName(player)}
          </Text>
          <Text style={styles.playerPos}>{player.position}</Text>
        </View>
        {injuryStatus ? <InjuryChip status={injuryStatus} /> : null}
      </View>
    </View>
  );
}

function StatsRow({ values }: { values: string[] }) {
  return (
    <View style={styles.statsRow}>
      {values.map((v, i) => (
        <Text
          key={STAT_COLS[i]!.key}
          style={[styles.statCell, EMPHASIS.has(STAT_COLS[i]!.key) ? styles.statEmph : null]}
        >
          {v}
        </Text>
      ))}
    </View>
  );
}

function Chevron({ open, color }: { open: boolean; color: string }) {
  return <Text style={[styles.chevron, { color }]}>{open ? "▾" : "▸"}</Text>;
}

function TeamRosterCard({
  block,
  injuryById,
  defaultOpen,
}: {
  block: NbaRosterTeamBlock;
  injuryById: Record<string, string>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const primary = getTeamJerseyPrimaryColor("nba", block.teamId);
  const players = sortRosterPlayers(block.players);
  const title = teamFullLabel(block.teamId, block.teamName);
  const abbr = teamAbbr(block.teamId);
  const refCode = `REF: ${abbr}-24-${block.side === "home" ? "H" : "A"}`;
  const footerLeft = block.side === "home" ? "ACTIVE SCANNING…" : "ANALYZING ROSTER DATA…";

  return (
    <View style={[styles.teamCard, { borderColor: `${primary}88` }]}>
      <Pressable
        style={styles.teamHeader}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.headerMain}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.sideBadge, { borderColor: primary }]}>
              <Text style={[styles.sideBadgeText, { color: primary }]}>
                {block.side === "home" ? "HOME" : "AWAY"}
              </Text>
            </View>
            <Text style={styles.teamName} numberOfLines={1}>
              {title}
            </Text>
          </View>
          <Text style={[styles.availability, { color: `${primary}e6` }]}>
            AVAILABILITY: {block.activeCount}/{block.rosterCount} ACTIVE
          </Text>
        </View>
        {block.seed != null ? (
          <View style={styles.seedWrap}>
            <Text style={styles.seedLabel}>SEED</Text>
            <Text style={[styles.seedNum, { color: primary }]}>#{block.seed}</Text>
          </View>
        ) : null}
        <Chevron open={open} color={primary} />
      </Pressable>

      {open ? (
        <>
          <View style={styles.tableRow}>
            <View style={styles.identityColumn}>
              <View style={[styles.identityHeader, { height: HEADER_H }]}>
                <Text style={styles.identityHeaderText}># PLAYER POS</Text>
              </View>
              {players.map((p) => (
                <IdentityRow
                  key={String(p.id)}
                  player={p}
                  accent={primary}
                  injuryStatus={injuryById[String(p.id)]}
                />
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={[styles.statsHeader, { height: HEADER_H }]}>
                  {STAT_COLS.map((c) => (
                    <Text key={c.key} style={styles.statHeaderCell}>
                      {c.label}
                    </Text>
                  ))}
                </View>
                {players.map((p) => (
                  <View key={String(p.id)} style={p.dimmed ? styles.dim : null}>
                    <StatsRow values={playerStats(p)} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={[styles.footer, { borderTopColor: `${primary}59` }]}>
            <Text style={[styles.footerLeft, { color: `${primary}d9` }]} numberOfLines={1}>
              {footerLeft}
            </Text>
            <Text style={styles.footerRight} numberOfLines={1}>
              {refCode}
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

export default function NbaRosterPanelNative({ report, injuryById = {} }: Props) {
  return (
    <View style={styles.shell}>
      <TeamRosterCard block={report.home} injuryById={injuryById} defaultOpen />
      <TeamRosterCard block={report.away} injuryById={injuryById} defaultOpen={false} />
    </View>
  );
}

const OXANIUM = "Oxanium_700Bold";

const styles = StyleSheet.create({
  shell: { gap: 10 },
  teamCard: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "rgba(8,10,16,0.94)",
    overflow: "hidden",
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerMain: { flex: 1, minWidth: 0 },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sideBadge: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sideBadgeText: {
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  teamName: {
    flex: 1,
    fontFamily: OXANIUM,
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  availability: {
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 3,
  },
  seedWrap: { alignItems: "flex-end" },
  seedLabel: {
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.35)",
  },
  seedNum: {
    fontFamily: OXANIUM,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 20,
  },
  chevron: { fontSize: 14 },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  identityColumn: {
    width: IDENTITY_W,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(8,10,16,0.98)",
  },
  identityHeader: {
    justifyContent: "center",
    paddingHorizontal: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  identityHeaderText: {
    fontFamily: OXANIUM,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
  },
  identityRow: {
    height: ROW_H,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  jerseyBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  jerseyText: {
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  identityNameCol: { flex: 1, minWidth: 0 },
  identityNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  playerName: {
    flexShrink: 1,
    fontFamily: OXANIUM,
    fontSize: 10.5,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  playerPos: {
    fontFamily: OXANIUM,
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
    fontVariant: ["tabular-nums"],
  },
  injuryChip: {
    alignSelf: "flex-start",
    marginTop: 1,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 3,
    paddingVertical: 0,
  },
  injuryChipText: {
    fontFamily: OXANIUM,
    fontSize: 6,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  statHeaderCell: {
    width: STAT_COL_W,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.4)",
  },
  statsRow: {
    height: ROW_H,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  statCell: {
    width: STAT_COL_W,
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.78)",
    fontVariant: ["tabular-nums"],
  },
  statEmph: { color: "#fff" },
  dim: { opacity: 0.45 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  footerLeft: {
    fontFamily: OXANIUM,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1,
  },
  footerRight: {
    fontFamily: OXANIUM,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.35)",
  },
});
