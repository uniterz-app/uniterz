/**
 * 予想カード上段（両チーム）を矢印と横スクロールで LAST 5 / H2H に切り替える。
 * LAST 5 は STATS タブと同じ `/api/nba/matchup-detail`（共有キャッシュ）、
 * H2H は H2H タブと同じ（NBA 静的 pack → 無ければ読み込み済みの試合）。
 * 横スクロールしても縦幅は 3 ページの最大で固定する。
 * 矢印はユニフォームのすぐ横（ページの外）に置く。
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNbaMatchupTeamStats } from "../../../../../../lib/nba/predict/useNbaMatchupTeamStats";
import type { NbaTeamFormGame } from "../../../../../../lib/predict/nbaTeamStatsPreviewMocks";
import { TEAM_SHORT } from "../../../../../../lib/team-short";
import { resolveStaticNbaH2hRows } from "../nbaStaticH2hFallback";
import { listFinalH2hGamesFromPeers, type PeerH2hLine } from "../peerH2hGames";
import type { NativeGameRow } from "../useTodayGames";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { MATCH_CARD_METRIC_FONT } from "../matchCardTypography";

/** STATS タブ LAST 5 と同じ勝敗色 */
const FORM_WIN = "#F5C518";
const FORM_LOSS = "#FF2D78";
const ROWS = 5;

function FormLine({ game, align }: { game: NbaTeamFormGame; align: "left" | "right" }) {
  const win = game.result === "W";
  return (
    <View
      style={[
        styles.line,
        styles.packInner,
        align === "right" ? styles.lineRight : null,
      ]}
    >
      <Text style={[styles.result, { color: win ? FORM_WIN : FORM_LOSS }]}>{game.result}</Text>
      <Text style={styles.score}>
        {game.teamScore}-{game.oppScore}
      </Text>
      <Text style={styles.venue}>{game.home ? "vs" : "@"}</Text>
      <Text style={styles.opp} numberOfLines={1}>
        {game.oppAbbr}
      </Text>
      <Text style={styles.date}>{game.dateLabel}</Text>
    </View>
  );
}

function FormColumn({
  games,
  align,
  accent,
}: {
  games: NbaTeamFormGame[];
  align: "left" | "right";
  accent: string;
}) {
  const wins = games.filter((g) => g.result === "W").length;
  /** 届くのは新しい順。上が古く下が最新になるよう反転する */
  const ordered = [...games].slice(0, ROWS).reverse();
  return (
    <View style={styles.col}>
      <View
        style={[
          styles.colHead,
          styles.packInner,
          align === "right" ? styles.lineRight : null,
        ]}
      >
        <View style={[styles.colMark, { backgroundColor: accent }]} />
        <Text style={styles.colRecord}>
          {wins}-{games.length - wins}
        </Text>
      </View>
      {Array.from({ length: ROWS }, (_, i) =>
        ordered[i] ? (
          <FormLine key={i} game={ordered[i]!} align={align} />
        ) : (
          <View key={i} style={styles.lineSpacer} />
        )
      )}
    </View>
  );
}

function sideName(side: unknown): string | undefined {
  const n = (side as { name?: unknown } | null)?.name;
  if (typeof n === "string" && n.trim()) return n.trim();
  return typeof side === "string" && side.trim() ? side.trim() : undefined;
}

function scoreOf(row: PeerH2hLine, teamId: string): number | null {
  if (row.leftTeamId === teamId) return row.leftScore;
  if (row.rightTeamId === teamId) return row.rightScore;
  if (row.homeTeamId === teamId) return row.homeScore;
  if (row.awayTeamId === teamId) return row.awayScore;
  return null;
}

function abbrOf(teamId: string | null): string {
  if (!teamId) return "";
  return (TEAM_SHORT[teamId] ?? teamId.replace(/^nba-/, "").slice(0, 3)).toUpperCase();
}

/** 年をまたぐので YY/MM/DD */
function h2hDate(ms: number): string {
  const d = new Date(ms);
  const yy = String(d.getFullYear()).slice(-2);
  return `${yy}/${d.getMonth() + 1}/${d.getDate()}`;
}

function H2hPage({
  rows,
  homeTeamId,
  awayTeamId,
  homeAccent,
  awayAccent,
}: {
  rows: PeerH2hLine[];
  homeTeamId: string;
  awayTeamId: string;
  homeAccent: string;
  awayAccent: string;
}) {
  const games = rows
    .map((r) => ({ r, h: scoreOf(r, homeTeamId), a: scoreOf(r, awayTeamId) }))
    .filter((g): g is { r: PeerH2hLine; h: number; a: number } => g.h != null && g.a != null)
    .slice(0, ROWS)
    .reverse();
  const homeWins = games.filter((g) => g.h > g.a).length;
  if (games.length === 0) return <Text style={styles.empty}>—</Text>;
  return (
    <View>
      <View style={styles.h2hHead}>
        <View style={[styles.colMark, { backgroundColor: homeAccent }]} />
        <Text style={styles.h2hAbbr}>{abbrOf(homeTeamId)}</Text>
        <Text style={styles.h2hRecord}>
          {homeWins} - {games.length - homeWins}
        </Text>
        <Text style={styles.h2hAbbr}>{abbrOf(awayTeamId)}</Text>
        <View style={[styles.colMark, { backgroundColor: awayAccent }]} />
      </View>
      {games.map(({ r, h, a }) => {
        const homeWon = h > a;
        return (
          <View key={r.id} style={styles.h2hRow}>
            <Text style={styles.h2hDate}>{h2hDate(r.startMs)}</Text>
            <View style={styles.h2hScore}>
              <Text style={[styles.h2hNum, homeWon ? styles.h2hNumWin : styles.h2hNumLose]}>{h}</Text>
              <Text style={styles.h2hDash}>-</Text>
              <Text style={[styles.h2hNum, !homeWon ? styles.h2hNumWin : styles.h2hNumLose]}>{a}</Text>
            </View>
            <Text style={styles.h2hVenue} numberOfLines={1}>
              {r.seriesGameLabel ? `${r.seriesGameLabel} · ` : ""}@{abbrOf(r.homeTeamId)}
              {r.wentToOvertime ? " · OT" : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** ユニフォームのすぐ横に矢印を置くための位置 */
export type MatchPagerJerseyAnchor = {
  /** ページ上端からユニフォーム上端まで */
  top: number;
  size: number;
  gap?: number;
  sideWidth?: number;
  inset?: number;
};

/** 予想カードの HOME / ユニフォーム 48 */
const PREDICT_JERSEY: MatchPagerJerseyAnchor = { top: 27, size: 48, gap: 6 };

export default function PredictMatchLast5PagerNative({
  homeTeamId,
  awayTeamId,
  homeAccent,
  awayAccent,
  apiBaseUrl,
  h2hSource,
  homeName,
  awayName,
  jerseyAnchor = PREDICT_JERSEY,
  children,
}: {
  homeTeamId: string;
  awayTeamId: string;
  homeAccent: string;
  awayAccent: string;
  apiBaseUrl: string | null;
  /** H2H タブと同じ元データ（この試合と読み込み済みの試合） */
  h2hSource?: { subject: NativeGameRow; peers: ReadonlyArray<NativeGameRow> } | null;
  /** h2hSource が無いとき（試合一覧から開くリザルト詳細）に静的 H2H pack を引く名前 */
  homeName?: string;
  awayName?: string;
  /** 省略時は予想カードのユニフォーム位置 */
  jerseyAnchor?: MatchPagerJerseyAnchor;
  /** 1 ページ目（今の両チーム表示） */
  children: ReactNode;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const pageRef = useRef(0);
  const [page, setPage] = useState(0);
  const { stats } = useNbaMatchupTeamStats({ homeTeamId, awayTeamId, apiBaseUrl });
  const home = stats?.season.home.recentFormGames ?? stats?.last10.home.recentFormGames ?? [];
  const away = stats?.season.away.recentFormGames ?? stats?.last10.away.recentFormGames ?? [];
  const h2hRows = useMemo(() => {
    const subject = h2hSource?.subject as Record<string, unknown> | undefined;
    const fromPack = resolveStaticNbaH2hRows(
      homeTeamId,
      awayTeamId,
      sideName(subject?.home) ?? homeName,
      sideName(subject?.away) ?? awayName
    );
    const rows =
      fromPack.length > 0 || !h2hSource
        ? fromPack
        : listFinalH2hGamesFromPeers(
            h2hSource.subject as Record<string, unknown>,
            h2hSource.peers as ReadonlyArray<Record<string, unknown>>,
            12
          );
    return [...rows].sort((x, y) => y.startMs - x.startMs);
  }, [homeTeamId, awayTeamId, h2hSource, homeName, awayName]);

  const pageCount = 3;
  const [pageWidth, setPageWidth] = useState(0);
  const [pageHeights, setPageHeights] = useState([0, 0, 0]);
  const stageH = Math.max(pageHeights[0] ?? 0, pageHeights[1] ?? 0, pageHeights[2] ?? 0);

  useEffect(() => {
    if (pageWidth <= 0) return;
    scrollRef.current?.scrollTo({ x: pageRef.current * pageWidth, animated: false });
  }, [pageWidth]);

  function onPageLayout(index: number, height: number) {
    const next = Math.ceil(height);
    if (next < 1) return;
    setPageHeights((prev) => {
      if (Math.abs((prev[index] ?? 0) - next) < 1) return prev;
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
  }

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(pageCount - 1, next));
    pageRef.current = clamped;
    setPage(clamped);
    if (pageWidth <= 0) return;
    scrollRef.current?.scrollTo({ x: clamped * pageWidth, animated: true });
  }

  const pages = [
    children,
    <View key="last5" style={[styles.page, styles.pageInset]}>
      <Text style={styles.title}>LAST 5</Text>
      {home.length === 0 && away.length === 0 ? (
        <Text style={styles.empty}>—</Text>
      ) : (
        <View style={styles.grid}>
          <FormColumn games={home} align="left" accent={homeAccent} />
          <View style={styles.divider} />
          <FormColumn games={away} align="right" accent={awayAccent} />
        </View>
      )}
    </View>,
    <View key="h2h" style={[styles.page, styles.pageInset]}>
      <Text style={styles.title}>H2H</Text>
      <H2hPage
        rows={h2hRows}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        homeAccent={homeAccent}
        awayAccent={awayAccent}
      />
    </View>,
  ];

  return (
    <View
      style={styles.stage}
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.width);
        if (next > 0 && next !== pageWidth) setPageWidth(next);
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={stageH > 0 ? { height: stageH } : undefined}
        onMomentumScrollEnd={(e) => {
          if (pageWidth <= 0) return;
          const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
          const clamped = Math.max(0, Math.min(pageCount - 1, next));
          pageRef.current = clamped;
          setPage(clamped);
        }}
      >
        {pages.map((node, index) => (
          <View
            key={index}
            onLayout={(e) => onPageLayout(index, e.nativeEvent.layout.height)}
            style={{
              width: pageWidth > 0 ? pageWidth : undefined,
              alignSelf: "flex-start",
            }}
          >
            {node}
          </View>
        ))}
      </ScrollView>
      <View
        pointerEvents="box-none"
        style={[
          styles.arrowLayer,
          {
            paddingHorizontal: jerseyAnchor.inset ?? 0,
            gap: jerseyAnchor.sideWidth ? 0 : (jerseyAnchor.gap ?? 6),
          },
        ]}
      >
        <View
          pointerEvents="box-none"
          style={[
            styles.arrowSide,
            jerseyAnchor.sideWidth
              ? { width: jerseyAnchor.sideWidth }
              : styles.arrowSideFlex,
          ]}
        >
          <View
            pointerEvents="box-none"
            style={[
              styles.jerseySlot,
              {
                marginTop: jerseyAnchor.top,
                width: jerseyAnchor.size,
                height: jerseyAnchor.size,
              },
            ]}
          >
            {page > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="前へ"
                onPress={() => goTo(page - 1)}
                hitSlop={8}
                style={[styles.arrowHit, styles.arrowHitLeft]}
              >
                <View style={[styles.tri, styles.triLeft]} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View pointerEvents="none" style={styles.arrowCenter} />
        <View
          pointerEvents="box-none"
          style={[
            styles.arrowSide,
            jerseyAnchor.sideWidth
              ? { width: jerseyAnchor.sideWidth }
              : styles.arrowSideFlex,
          ]}
        >
          <View
            pointerEvents="box-none"
            style={[
              styles.jerseySlot,
              {
                marginTop: jerseyAnchor.top,
                width: jerseyAnchor.size,
                height: jerseyAnchor.size,
              },
            ]}
          >
            {page < pageCount - 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="次へ"
                onPress={() => goTo(page + 1)}
                hitSlop={8}
                style={[styles.arrowHit, styles.arrowHitRight]}
              >
                <View style={[styles.tri, styles.triRight]} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: "relative",
    width: "100%",
  },
  page: {
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  /** 矢印が端の得点に乗らないよう、LAST 5 / H2H だけ内側に寄せる */
  pageInset: {
    paddingHorizontal: 28,
  },
  title: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 2,
  },
  empty: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  packInner: {
    justifyContent: "flex-end",
  },
  col: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  colHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 0,
  },
  colMark: {
    width: 8,
    height: 8,
    transform: [{ skewX: "-14deg" }],
  },
  colRecord: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 14,
  },
  lineRight: {
    flexDirection: "row-reverse",
  },
  lineSpacer: {
    height: 14,
  },
  result: {
    width: 12,
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  score: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  venue: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 9,
  },
  opp: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "700",
  },
  date: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
  },
  h2hHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginBottom: 2,
  },
  h2hAbbr: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  h2hRecord: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  h2hRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 14,
  },
  h2hDate: {
    flex: 1,
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
  },
  h2hScore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  h2hNum: {
    width: 30,
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  h2hNumWin: {
    color: "#fff",
  },
  h2hNumLose: {
    color: "rgba(255,255,255,0.4)",
  },
  h2hDash: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
  },
  h2hVenue: {
    flex: 1,
    textAlign: "right",
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
  },
  arrowLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    zIndex: 3,
  },
  arrowSide: {
    alignItems: "center",
  },
  arrowSideFlex: {
    flex: 1,
  },
  arrowCenter: {
    flex: 1,
  },
  jerseySlot: {
    position: "relative",
  },
  arrowHit: {
    position: "absolute",
    top: 0,
    height: "100%",
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowHitLeft: {
    right: "100%",
    marginRight: 2,
  },
  arrowHitRight: {
    left: "100%",
    marginLeft: 2,
  },
  /** キャリアのシーズン切替と同じ塗り三角 */
  tri: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 6,
  },
  triLeft: {
    borderRightWidth: 8,
    borderRightColor: "#00f5ff",
  },
  triRight: {
    borderLeftWidth: 8,
    borderLeftColor: "#00f5ff",
  },
});
