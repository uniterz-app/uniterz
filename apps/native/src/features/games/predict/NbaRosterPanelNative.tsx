/** Web `NbaRosterPanel` 相当（折りたたみ + 列ヘッダで昇降順ソート） */
import { useMemo, useState } from "react";
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
  { key: "gp", label: "GP", field: "gp" },
  { key: "min", label: "MIN", field: "mpg" },
  { key: "pts", label: "PTS", field: "ppg" },
  { key: "reb", label: "REB", field: "rpg" },
  { key: "ast", label: "AST", field: "apg" },
  { key: "fg", label: "FG%", field: "fgPct" },
  { key: "fgm", label: "FGM", field: "fgm" },
  { key: "fga", label: "FGA", field: "fga" },
  { key: "fg3", label: "3P%", field: "fg3Pct" },
  { key: "fg3m", label: "3PM", field: "fg3m" },
  { key: "fg3a", label: "3PA", field: "fg3a" },
  { key: "ft", label: "FT%", field: "ftPct" },
  { key: "ftm", label: "FTM", field: "ftm" },
  { key: "fta", label: "FTA", field: "fta" },
  { key: "stl", label: "STL", field: "spg" },
  { key: "blk", label: "BLK", field: "bpg" },
  { key: "tov", label: "TO", field: "tpg" },
] as const;

type StatColKey = (typeof STAT_COLS)[number]["key"];
type SortDir = "desc" | "asc";

type SortState = {
  key: StatColKey;
  dir: SortDir;
} | null;

const EMPHASIS = new Set(["pts", "fg", "fg3", "fga", "fg3a"]);
const IDENTITY_W = 172;
const IDENTITY_W_DETAIL = 148;
const STAT_COL_W = 48;
const ROW_H = 46;
const HEADER_H = 32;

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

function statValue(player: NbaRosterPlayer, key: StatColKey): number {
  const col = STAT_COLS.find((c) => c.key === key)!;
  const raw = player[col.field];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : Number.NEGATIVE_INFINITY;
}

function sortPlayersByCol(
  players: NbaRosterPlayer[],
  sort: SortState
): NbaRosterPlayer[] {
  if (!sort) return sortRosterPlayers(players);
  const mul = sort.dir === "desc" ? -1 : 1;
  return [...players].sort((a, b) => {
    const av = statValue(a, sort.key);
    const bv = statValue(b, sort.key);
    if (av !== bv) return av < bv ? -mul : mul;
    return playerCardName(a).localeCompare(playerCardName(b));
  });
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
  mode = "matchup",
}: {
  block: NbaRosterTeamBlock;
  injuryById: Record<string, string>;
  defaultOpen: boolean;
  /** detail: 常時展開・試合の HOME/AWAY バッジなし */
  mode?: "matchup" | "detail";
}) {
  const isDetail = mode === "detail";
  const [open, setOpen] = useState(defaultOpen || isDetail);
  const [sort, setSort] = useState<SortState>(null);
  const primary = getTeamJerseyPrimaryColor("nba", block.teamId);
  const players = useMemo(
    () => sortPlayersByCol(block.players, sort),
    [block.players, sort]
  );
  const title = teamFullLabel(block.teamId, block.teamName);
  const abbr = teamAbbr(block.teamId);
  const refCode = isDetail
    ? `REF: ${abbr}-ROSTER`
    : `REF: ${abbr}-24-${block.side === "home" ? "H" : "A"}`;
  const footerLeft = isDetail
    ? "ROSTER SCAN…"
    : block.side === "home"
      ? "ACTIVE SCANNING…"
      : "ANALYZING ROSTER DATA…";

  const onSortCol = (key: StatColKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  };

  const expanded = isDetail ? true : open;
  const identityW = isDetail ? IDENTITY_W_DETAIL : IDENTITY_W;

  return (
    <View style={[styles.teamCard, { borderColor: `${primary}88` }]}>
      <Pressable
        style={styles.teamHeader}
        onPress={isDetail ? undefined : () => setOpen((v) => !v)}
        disabled={isDetail}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerMain}>
          <View style={styles.headerTitleRow}>
            {!isDetail ? (
              <View style={[styles.sideBadge, { borderColor: primary }]}>
                <Text style={[styles.sideBadgeText, { color: primary }]}>
                  {block.side === "home" ? "HOME" : "AWAY"}
                </Text>
              </View>
            ) : null}
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
        {!isDetail ? <Chevron open={open} color={primary} /> : null}
      </Pressable>

      {expanded ? (
        <>
          <View style={styles.tableRow}>
            <View style={[styles.identityColumn, { width: identityW }]}>
              <Pressable
                style={[styles.identityHeader, { height: HEADER_H }]}
                onPress={() => setSort(null)}
                accessibilityRole="button"
                accessibilityLabel="Reset roster sort"
              >
                <Text style={styles.identityHeaderText}># PLAYER POS</Text>
              </Pressable>
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
                  {STAT_COLS.map((c) => {
                    const active = sort?.key === c.key;
                    const marker = active
                      ? sort.dir === "desc"
                        ? " ▼"
                        : " ▲"
                      : "";
                    return (
                      <Pressable
                        key={c.key}
                        onPress={() => onSortCol(c.key)}
                        style={styles.statHeaderPress}
                        accessibilityRole="button"
                        accessibilityLabel={`Sort by ${c.label}`}
                      >
                        <Text
                          style={[
                            styles.statHeaderCell,
                            active && styles.statHeaderActive,
                          ]}
                        >
                          {c.label}
                          {marker}
                        </Text>
                      </Pressable>
                    );
                  })}
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
            <Text
              style={[styles.footerLeft, { color: `${primary}d9` }]}
              numberOfLines={1}
            >
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

/** Team Detail 用 — 予想ロスターと同じ表スタイル・常時展開 */
export function NbaTeamRosterCardNative({
  block,
  injuryById = {},
}: {
  block: NbaRosterTeamBlock;
  injuryById?: Record<string, string>;
}) {
  return (
    <TeamRosterCard
      block={block}
      injuryById={injuryById}
      defaultOpen
      mode="detail"
    />
  );
}

export default function NbaRosterPanelNative({ report, injuryById = {} }: Props) {
  return (
    <View style={styles.shell}>
      <TeamRosterCard block={report.home} injuryById={injuryById} defaultOpen />
      <TeamRosterCard
        block={report.away}
        injuryById={injuryById}
        defaultOpen={false}
      />
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
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  teamName: {
    flex: 1,
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  availability: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  seedWrap: { alignItems: "flex-end" },
  seedLabel: {
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.35)",
  },
  seedNum: {
    fontFamily: OXANIUM,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
  },
  chevron: { fontSize: 16 },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  identityColumn: {
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
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.45)",
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
    width: 26,
    height: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  jerseyText: {
    fontFamily: OXANIUM,
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  identityNameCol: { flex: 1, minWidth: 0 },
  identityNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  playerName: {
    flexShrink: 1,
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  playerPos: {
    fontFamily: OXANIUM,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    fontVariant: ["tabular-nums"],
  },
  injuryChip: {
    alignSelf: "flex-start",
    marginTop: 2,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  injuryChipText: {
    fontFamily: OXANIUM,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  statHeaderPress: {
    width: STAT_COL_W,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  statHeaderCell: {
    textAlign: "center",
    fontFamily: OXANIUM,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.45)",
  },
  statHeaderActive: {
    color: "#00E5FF",
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
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
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
    paddingVertical: 8,
  },
  footerLeft: {
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  footerRight: {
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.35)",
  },
});
