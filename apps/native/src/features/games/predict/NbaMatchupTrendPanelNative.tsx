/** 予想画面 TREND: 日程・状況別・勢い（両チーム 2 カラム） */
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type {
  NbaMatchupTrend,
  NbaTrendSide,
  NbaTrendWl,
} from "../../../../../../lib/nba/predict/buildMatchupTrend";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import type { GamesLanguage } from "../gamesI18n";
import { MATCH_CARD_TEAM_NAME_FONT } from "../matchCardTypography";

const OXANIUM = "Oxanium_700Bold";
const WIN = "#F5C518";
const LOSS = "#FF2D78";
const CYAN_DIM = "rgba(0,245,255,0.7)";

type Props = {
  trend: NbaMatchupTrend;
  homeTeamId: string;
  awayTeamId: string;
  language: GamesLanguage;
};

function teamLabel(teamId: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  return full ? getMobileTeamName("nba", full).toUpperCase() : teamId.toUpperCase();
}

function wl(r: NbaTrendWl | null | undefined): string {
  return r ? `${r.wins}-${r.losses}` : "—";
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View>{children}</View>
    </View>
  );
}

type Cell = { text: string; color?: string; sub?: string };

function CompareRow({
  label,
  labelSub,
  home,
  away,
}: {
  label: string;
  labelSub?: string;
  home: Cell;
  away: Cell;
}) {
  const value = (c: Cell) => (
    <View style={styles.valueCol}>
      <Text style={[styles.compareValue, c.color ? { color: c.color } : null]}>{c.text}</Text>
      {c.sub ? <Text style={styles.valueSub}>{c.sub}</Text> : null}
    </View>
  );
  return (
    <View style={styles.compareRow}>
      {value(home)}
      <View style={styles.labelCol}>
        <Text style={styles.compareLabel}>{label}</Text>
        {labelSub ? <Text style={styles.labelSub}>{labelSub}</Text> : null}
      </View>
      {value(away)}
    </View>
  );
}

function restCell(side: NbaTrendSide, ja: boolean): Cell {
  const d = side.schedule.restDays;
  if (d == null) return { text: "—" };
  if (d === 0) return { text: ja ? "連戦2日目" : "B2B", color: LOSS };
  if (d >= 3) return { text: ja ? "3日以上" : "3+ DAYS" };
  return { text: ja ? `${d}日` : `${d} DAY${d > 1 ? "S" : ""}` };
}

function streakCell(side: NbaTrendSide, ja: boolean): Cell {
  const s = side.streak;
  if (!s) return { text: "—" };
  const win = s.kind === "W";
  return {
    text: ja ? `${s.count}${win ? "連勝" : "連敗"}` : `${s.kind}${s.count}`,
    color: win ? WIN : LOSS,
  };
}

function vsOppCell(side: NbaTrendSide, ja: boolean): Cell {
  const v = side.situation.vsOpp;
  if (!v) return { text: "—" };
  return {
    text: wl(v.record),
    sub: ja ? (v.over500 ? "勝ち越し相手" : "負け越し相手") : v.over500 ? "vs .500+" : "vs SUB-.500",
  };
}

export default function NbaMatchupTrendPanelNative({
  trend,
  homeTeamId,
  awayTeamId,
  language,
}: Props) {
  const ja = language === "ja";
  const { home, away } = trend;
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.teamTitle} numberOfLines={1}>
          {teamLabel(homeTeamId)}
        </Text>
        <Text style={styles.heading}>TREND</Text>
        <Text style={styles.teamTitle} numberOfLines={1}>
          {teamLabel(awayTeamId)}
        </Text>
      </View>

      <Section label="SCHEDULE">
        <CompareRow
          label={ja ? "休み" : "REST"}
          home={restCell(home, ja)}
          away={restCell(away, ja)}
        />
        <CompareRow
          label={ja ? "4日で3試合目" : "3 IN 4"}
          home={home.schedule.threeInFour ? { text: "YES", color: LOSS } : { text: "NO" }}
          away={away.schedule.threeInFour ? { text: "YES", color: LOSS } : { text: "NO" }}
        />
        <CompareRow
          label={ja ? "連戦2日目の成績" : "B2B RECORD"}
          home={{ text: wl(home.schedule.b2bRecord) }}
          away={{ text: wl(away.schedule.b2bRecord) }}
        />
      </Section>

      <Section label="SITUATION">
        <CompareRow
          label={ja ? "会場別" : "VENUE"}
          home={{ text: wl(home.situation.venue), sub: ja ? "ホーム" : "HOME" }}
          away={{ text: wl(away.situation.venue), sub: ja ? "アウェー" : "AWAY" }}
        />
        <CompareRow
          label={ja ? "相手の強さ別" : "VS OPP TYPE"}
          home={vsOppCell(home, ja)}
          away={vsOppCell(away, ja)}
        />
        <CompareRow
          label={ja ? "接戦" : "CLOSE"}
          labelSub={ja ? "5点差以内" : "≤5 PTS"}
          home={{ text: wl(home.situation.close) }}
          away={{ text: wl(away.situation.close) }}
        />
      </Section>

      <Section label="MOMENTUM">
        <CompareRow
          label={ja ? "連続" : "STREAK"}
          home={streakCell(home, ja)}
          away={streakCell(away, ja)}
        />
        <CompareRow
          label={ja ? "直近10試合" : "LAST 10"}
          home={{ text: wl(home.last10) }}
          away={{ text: wl(away.last10) }}
        />
      </Section>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: MATCH_CARD_TEAM_NAME_FONT,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
    lineHeight: 18,
    color: "#fff",
    textAlign: "center",
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  heading: {
    paddingHorizontal: 8,
    color: CYAN_DIM,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  section: { gap: 4 },
  sectionLabel: {
    alignSelf: "center",
    fontFamily: OXANIUM,
    fontSize: 10,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.45)",
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  valueCol: { flex: 1, minWidth: 0, alignItems: "center" },
  compareValue: {
    fontFamily: OXANIUM,
    fontSize: 16,
    color: "#fff",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  valueSub: {
    marginTop: 1,
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
  },
  labelCol: { width: 104, alignItems: "center" },
  compareLabel: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.72)",
  },
  labelSub: {
    marginTop: 1,
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
  },
  empty: {
    paddingVertical: 8,
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
});
