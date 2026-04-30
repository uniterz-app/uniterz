import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { GamesLanguage, GamesTexts } from "./gamesI18n";
import { listFinalH2hGamesFromPeers } from "./peerH2hGames";
import { rawTeamIdFromGameSide } from "./resolveNativeSeriesStanding";
import { colors, spacing } from "../../theme/tokens";
import type { NativeGameRow, SupportedLeague } from "./useTodayGames";
import { usePairTeamStats, type PairTeamStatsView } from "./usePairTeamStats";
import { usePredictionPostDistribution } from "./usePredictionPostDistribution";

type Props = {
  tab: "h2h" | "market" | "stats";
  language: GamesLanguage;
  t: GamesTexts;
  gameId: string;
  league: SupportedLeague;
  subjectGame: NativeGameRow;
  peerGames: ReadonlyArray<NativeGameRow>;
  formatGameDateMs: (ms: number) => string;
  homeColor: string;
  awayColor: string;
  isSoccerLeague: boolean;
};

function formatRankNba(
  n: number | undefined,
  language: GamesLanguage,
  t: GamesTexts
): string | null {
  if (n == null || n < 1 || !Number.isFinite(n)) return null;
  const r = Math.round(n);
  if (language === "en") return `#${r}`;
  return t.predictToolRank.replace("{n}", String(r));
}

function MarketBars({
  home,
  away,
  draw,
  isSoccer,
  homeC,
  awayC,
  t,
}: {
  home: number;
  away: number;
  draw: number;
  isSoccer: boolean;
  homeC: string;
  awayC: string;
  t: GamesTexts;
}) {
  const effTotal = isSoccer ? home + away + draw : home + away;
  if (effTotal <= 0) {
    return <Text style={s.muted}>{t.predictToolMarketNoPosts}</Text>;
  }
  const wHome = effTotal > 0 ? (100 * home) / effTotal : 0;
  const wAway = effTotal > 0 ? (100 * away) / effTotal : 0;
  const wDraw = effTotal > 0 && isSoccer ? (100 * draw) / effTotal : 0;
  return (
    <View style={s.marketWrap}>
      <View>
        <Text style={s.barLabel} numberOfLines={1}>
          HOME {home} ({wHome.toFixed(0)}%)
        </Text>
        <View style={s.barTrack}>
          <View style={[s.barFill, { width: `${wHome}%`, backgroundColor: homeC }]} />
        </View>
      </View>
      {isSoccer ? (
        <View>
          <Text style={s.barLabel} numberOfLines={1}>
            {t.predictToolDrawLabel} {draw} ({wDraw.toFixed(0)}%)
          </Text>
          <View style={s.barTrack}>
            <View
              style={[
                s.barFill,
                {
                  width: `${wDraw}%`,
                  backgroundColor: "rgba(156,163,175,0.85)",
                },
              ]}
            />
          </View>
        </View>
      ) : null}
      <View>
        <Text style={s.barLabel} numberOfLines={1}>
          AWAY {away} ({wAway.toFixed(0)}%)
        </Text>
        <View style={s.barTrack}>
          <View
            style={[s.barFill, { width: `${wAway}%`, backgroundColor: awayC }]}
          />
        </View>
      </View>
      <Text style={s.smallMuted}>
        {t.predictToolPostCount.replace("{n}", String(effTotal))}
      </Text>
    </View>
  );
}

function StatLine({
  label,
  left,
  right,
  leftRank,
  rightRank,
}: {
  label: string;
  left: string;
  right: string;
  leftRank: string | null;
  rightRank: string | null;
}) {
  return (
    <View style={s.statLine}>
      <View style={s.statSide}>
        <Text style={s.statVal}>{left}</Text>
        {leftRank ? <Text style={s.statRank}>{leftRank}</Text> : null}
      </View>
      <Text style={s.statKey}>{label}</Text>
      <View style={s.statSide}>
        <Text style={s.statVal}>{right}</Text>
        {rightRank ? <Text style={s.statRank}>{rightRank}</Text> : null}
      </View>
    </View>
  );
}

function NbaStatsBody({
  home,
  away,
  t,
  language,
}: {
  home: PairTeamStatsView;
  away: PairTeamStatsView;
  t: GamesTexts;
  language: GamesLanguage;
}) {
  const r = (n: number | undefined) => formatRankNba(n, language, t);
  return (
    <View style={s.statBlock}>
      <StatLine
        label={t.predictToolPpg}
        left={String(home.avgFor)}
        right={String(away.avgFor)}
        leftRank={r(home.ppgRank)}
        rightRank={r(away.ppgRank)}
      />
      <StatLine
        label={t.predictToolPapg}
        left={String(home.avgAgainst)}
        right={String(away.avgAgainst)}
        leftRank={r(home.papgRank)}
        rightRank={r(away.papgRank)}
      />
      <StatLine
        label={t.predictToolDiff}
        left={home.diff > 0 ? `+${home.diff}` : String(home.diff)}
        right={away.diff > 0 ? `+${away.diff}` : String(away.diff)}
        leftRank={r(home.diffRank)}
        rightRank={r(away.diffRank)}
      />
      {home.netrtg != null && away.netrtg != null ? (
        <StatLine
          label={t.predictToolNet}
          left={String(home.netrtg)}
          right={String(away.netrtg)}
          leftRank={r(home.netrtgRank)}
          rightRank={r(away.netrtgRank)}
        />
      ) : null}
      <View style={s.recCol}>
        <Text style={s.recText} numberOfLines={2}>
          HOME {t.predictToolRecordHome} {home.homeW}-{home.homeL} / {t.predictToolRecordAway}{" "}
          {home.awayW}-{home.awayL}
        </Text>
        <Text style={s.recText} numberOfLines={2}>
          AWAY {t.predictToolRecordHome} {away.homeW}-{away.homeL} / {t.predictToolRecordAway}{" "}
          {away.awayW}-{away.awayL}
        </Text>
      </View>
    </View>
  );
}

function NonNbaStatsBody({ home, away, t }: { home: PairTeamStatsView; away: PairTeamStatsView; t: GamesTexts }) {
  return (
    <View style={s.statBlock}>
      <StatLine
        label={t.predictToolPpg}
        left={String(home.avgFor)}
        right={String(away.avgFor)}
        leftRank={null}
        rightRank={null}
      />
      <StatLine
        label={t.predictToolPapg}
        left={String(home.avgAgainst)}
        right={String(away.avgAgainst)}
        leftRank={null}
        rightRank={null}
      />
      <StatLine
        label={t.predictToolDiff}
        left={home.diff > 0 ? `+${home.diff}` : String(home.diff)}
        right={away.diff > 0 ? `+${away.diff}` : String(away.diff)}
        leftRank={null}
        rightRank={null}
      />
    </View>
  );
}

export function PredictToolTabContent({
  tab,
  language,
  t,
  gameId,
  league,
  subjectGame,
  peerGames,
  formatGameDateMs,
  homeColor,
  awayColor,
  isSoccerLeague,
}: Props) {
  const homeId = rawTeamIdFromGameSide(subjectGame.home);
  const awayId = rawTeamIdFromGameSide(subjectGame.away);

  const h2hRows = useMemo(
    () => listFinalH2hGamesFromPeers(subjectGame as Record<string, unknown>, peerGames, 12),
    [subjectGame, peerGames]
  );

  const { data: postDist, loading: postLoad, error: postErr } = usePredictionPostDistribution(
    tab === "market" ? gameId : null
  );
  const { home: sHome, away: sAway, loading: stLoad, error: stErr } = usePairTeamStats(
    tab === "stats" ? homeId : null,
    tab === "stats" ? awayId : null
  );

  if (tab === "h2h") {
    if (h2hRows.length === 0) {
      return (
        <View>
          <Text style={s.muted}>{t.predictToolH2hEmpty}</Text>
          <Text style={s.footnote}>{t.predictToolH2hScope}</Text>
        </View>
      );
    }
    return (
      <View style={s.h2hWrap}>
        {h2hRows.map((row) => (
          <Text key={row.id} style={s.h2hLine} numberOfLines={2}>
            {formatGameDateMs(row.startMs)} — {row.homeScore} - {row.awayScore}
          </Text>
        ))}
        <Text style={s.footnote}>{t.predictToolH2hScope}</Text>
      </View>
    );
  }

  if (tab === "market") {
    if (postLoad) {
      return <Text style={s.muted}>{t.predictToolLoading}</Text>;
    }
    if (postErr) {
      return <Text style={s.muted}>{t.predictToolLoadError}</Text>;
    }
    return (
      <MarketBars
        home={postDist.home}
        away={postDist.away}
        draw={postDist.draw}
        isSoccer={isSoccerLeague}
        homeC={homeColor}
        awayC={awayColor}
        t={t}
      />
    );
  }

  if (!homeId || !awayId) {
    return <Text style={s.muted}>{t.predictToolStatsNoTeam}</Text>;
  }
  if (stLoad) {
    return <Text style={s.muted}>{t.predictToolLoading}</Text>;
  }
  if (stErr) {
    return <Text style={s.muted}>{t.predictToolLoadError}</Text>;
  }
  if (!sHome || !sAway) {
    return <Text style={s.muted}>{t.predictToolLoadError}</Text>;
  }
  if (league === "nba") {
    return <NbaStatsBody home={sHome} away={sAway} t={t} language={language} />;
  }
  return <NonNbaStatsBody home={sHome} away={sAway} t={t} />;
}

const s = StyleSheet.create({
  muted: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    lineHeight: 16,
  },
  footnote: {
    marginTop: spacing.xs,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
    lineHeight: 14,
  },
  h2hWrap: {
    gap: 4,
  },
  h2hLine: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    lineHeight: 16,
  },
  smallMuted: {
    marginTop: 4,
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
  },
  marketWrap: { gap: 8 },
  barLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginBottom: 4,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3, minWidth: 2 },
  statBlock: { gap: 8 },
  statLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statKey: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    paddingHorizontal: 6,
    minWidth: 64,
    textAlign: "center",
  },
  statSide: { flex: 1, alignItems: "center" },
  statVal: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  statRank: { color: "rgba(255,255,255,0.4)", fontSize: 9, marginTop: 1 },
  recCol: { gap: 4, marginTop: 6, alignItems: "stretch" },
  recText: { color: "rgba(255,255,255,0.5)", fontSize: 9, lineHeight: 12 },
});
