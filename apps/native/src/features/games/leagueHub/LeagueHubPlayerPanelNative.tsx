import { useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  LEAGUE_HUB_PLAYER_SCATTER_PRESETS,
  type LeagueHubPlayerScatterPreset,
} from "../../../../../../lib/nba/leagueHub/leagueHubScatterPresets";
import {
  buildLeagueHubStyleIndex,
  similarLeagueHubPlayers,
} from "../../../../../../lib/nba/leagueHub/leagueHubStyleSimilarity";
import type {
  LeagueHubCountRow,
  LeagueHubHighStat,
  LeagueHubLadderRow,
  LeagueHubPlayer,
  LeagueHubPlayerMetric,
  LeagueHubWeekRow,
  NbaLeagueHubDoc,
} from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { useMyNbaFavoritesNative } from "../../profile/useMyNbaFavoritesNative";
import LeagueHubScatterNative, { type HubScatterPoint } from "./LeagueHubScatterNative";
import LeagueHubZoneKingsNative from "./LeagueHubZoneKingsNative";
import {
  HubChips,
  HubEmpty,
  HubRow,
  HubSection,
  HubTeamTag,
  HubPosToggle,
  HubToggle,
  HubTwoCol,
  type HubPosFilter,
  formatHubValue,
  hubStyles,
  playerNameStyle,
  teamAbbr,
  teamInk,
  type HubLang,
} from "./leagueHubUiNative";

type Props = {
  hub: NbaLeagueHubDoc;
  lang: HubLang;
  onSelectPlayer: (playerId: string) => void;
};

const MAX_ADDED = 5;
const SEARCH_LIMIT = 6;
const TEAM_SEARCH_LIMIT = 15;

function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\s'-]/g, "");
}

/** 名前（"S.Curry" → "scurry"）の部分一致か、チーム略称の完全一致 */
function searchHubPlayers(players: readonly LeagueHubPlayer[], query: string): LeagueHubPlayer[] {
  const q = normalizeSearch(query);
  if (!q) return [];
  const scored: Array<{ p: LeagueHubPlayer; s: number }> = [];
  for (const p of players) {
    const name = normalizeSearch(p.name);
    const last = normalizeSearch(p.name.split(".").pop() ?? "");
    let s = 0;
    if (teamAbbr(p.teamId).toLowerCase() === q) s = 90;
    else if (last.startsWith(q)) s = 80;
    else if (name.startsWith(q)) s = 70;
    else if (name.includes(q)) s = 40;
    if (s > 0) scored.push({ p, s });
  }
  const teamHit = scored.some((x) => x.s === 90);
  return scored
    .sort((a, b) => b.s - a.s || b.p.gp * b.p.min - a.p.gp * a.p.min)
    .slice(0, teamHit ? TEAM_SEARCH_LIMIT : SEARCH_LIMIT)
    .map((x) => x.p);
}

function noData(lang: HubLang) {
  return <HubEmpty text={lang === "ja" ? "まだデータがありません" : "No data yet"} />;
}

function StyleMap({
  players,
  lang,
  onSelectPlayer,
}: {
  players: LeagueHubPlayer[];
  lang: HubLang;
  onSelectPlayer: (playerId: string) => void;
}) {
  const [presetId, setPresetId] = useState(LEAGUE_HUB_PLAYER_SCATTER_PRESETS[0]!.id);
  const [topN, setTopN] = useState<"30" | "50">("30");
  const [pos, setPos] = useState<HubPosFilter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const preset: LeagueHubPlayerScatterPreset =
    LEAGUE_HUB_PLAYER_SCATTER_PRESETS.find((p) => p.id === presetId) ??
    LEAGUE_HUB_PLAYER_SCATTER_PRESETS[0]!;

  const { favorites } = useMyNbaFavoritesNative();
  const favIds = useMemo(
    () => new Set(favorites.favoriteNbaPlayers.map((p) => p.playerId)),
    [favorites.favoriteNbaPlayers]
  );
  const styleIndex = useMemo(() => buildLeagueHubStyleIndex(players), [players]);

  const pool = useMemo(() => {
    const plottable = (p: LeagueHubPlayer) =>
      p.m[preset.x.metric] != null && p.m[preset.y.metric] != null;
    const inPos = (p: LeagueHubPlayer) =>
      pos === "all" || (p.positions ?? (p.pos ? [p.pos] : [])).includes(pos);
    const top = players
      .filter((p) => inPos(p) && plottable(p))
      .sort(
        (a, b) =>
          (b.m[preset.volume] ?? -1) - (a.m[preset.volume] ?? -1) || b.gp * b.min - a.gp * a.min
      )
      .slice(0, Number(topN));
    const shown = new Set(top.map((p) => p.playerId));
    const pinned = players.filter(
      (p) =>
        !shown.has(p.playerId) &&
        plottable(p) &&
        (p.playerId === selected ||
          added.includes(p.playerId) ||
          (favIds.has(p.playerId) && inPos(p)))
    );
    return { top, pinned };
  }, [players, preset, topN, pos, favIds, selected, added]);
  const hits = useMemo(() => searchHubPlayers(players, query), [players, query]);
  const addPlayer = (id: string) => {
    setAdded((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, MAX_ADDED));
    setSelected(id);
    setQuery("");
    Keyboard.dismiss();
  };
  const addedPlayers = added
    .map((id) => players.find((p) => p.playerId === id))
    .filter((p): p is LeagueHubPlayer => p != null);
  const points: HubScatterPoint[] = [...pool.top, ...pool.pinned].map((p, i) => ({
    id: p.playerId,
    x: p.m[preset.x.metric]!,
    y: p.m[preset.y.metric]!,
    label: p.name,
    color: teamInk(p.teamId),
    star: favIds.has(p.playerId),
    pinned: i >= pool.top.length,
    highlight: added.includes(p.playerId),
  }));
  const hasStar = points.some((p) => p.star);
  const sel = selected
    ? (pool.top.find((p) => p.playerId === selected) ??
      pool.pinned.find((p) => p.playerId === selected))
    : null;

  const rankOf = (metric: LeagueHubPlayerMetric, invert: boolean | undefined, v: number) => {
    const vals = players.map((p) => p.m[metric]).filter((x): x is number => x != null);
    return {
      rank: vals.filter((x) => (invert ? x < v : x > v)).length + 1,
      of: vals.length,
    };
  };
  const similar = useMemo(
    () =>
      sel
        ? similarLeagueHubPlayers(styleIndex, sel.playerId)
            .map((id) => players.find((p) => p.playerId === id))
            .filter((p): p is LeagueHubPlayer => p != null)
        : [],
    [sel, styleIndex, players]
  );

  return (
    <View>
      <HubChips
        items={LEAGUE_HUB_PLAYER_SCATTER_PRESETS.map((p) => ({ id: p.id, label: p.label.en }))}
        value={presetId}
        onChange={(id) => {
          setPresetId(id);
          setSelected(null);
        }}
        wrap
      />
      <Text style={styles.mapHint}>{preset.hint[lang]}</Text>
      <View style={styles.mapControls}>
        <HubPosToggle
          value={pos}
          onChange={(v) => {
            setPos(v);
            setSelected(null);
          }}
          lang={lang}
        />
        <HubToggle
          items={[
            { id: "30", label: "TOP 30" },
            { id: "50", label: "TOP 50" },
          ]}
          value={topN}
          onChange={setTopN}
        />
      </View>
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={18} color={CYBER_TAB_CYAN} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={
            lang === "ja" ? "選手を探してマップに追加（例: curry / GSW）" : "Add a player (e.g. curry / GSW)"
          }
          placeholderTextColor="rgba(0,245,255,0.5)"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={styles.searchInput}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={16} color="rgba(255,255,255,0.6)" />
          </Pressable>
        ) : null}
      </View>
      {query.trim() ? (
        <View style={styles.searchList}>
          {hits.length === 0 ? (
            <Text style={styles.searchEmpty}>
              {lang === "ja"
                ? "見つかりません（出場が少ない選手は載っていません）"
                : "No match (players with few minutes aren't listed)"}
            </Text>
          ) : (
            hits.map((p) => (
              <Pressable
                key={p.playerId}
                style={({ pressed }) => [styles.searchRow, pressed ? { opacity: 0.7 } : null]}
                onPress={() => addPlayer(p.playerId)}
              >
                <Text style={[styles.searchName, playerNameStyle]} numberOfLines={1}>
                  {p.name}
                </Text>
                <HubTeamTag teamId={p.teamId} />
                <Text style={styles.searchAdd}>＋</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
      {addedPlayers.length > 0 ? (
        <View style={styles.addedRow}>
          {addedPlayers.map((p) => (
            <View key={p.playerId} style={styles.addedChip}>
              <Pressable onPress={() => setSelected(p.playerId)} hitSlop={4}>
                <Text style={[styles.addedName, playerNameStyle]}>{p.name}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAdded((prev) => prev.filter((x) => x !== p.playerId));
                  if (selected === p.playerId) setSelected(null);
                }}
                hitSlop={8}
              >
                <Text style={styles.addedRemove}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <Text style={styles.mapPool}>
        {lang === "ja"
          ? `${pos === "all" ? "" : `${pos} の`}${preset.volumeLabel.ja}の上位 ${topN} 人`
          : `Top ${topN}${pos === "all" ? "" : ` ${pos}s`} by ${preset.volumeLabel.en}`}
        {hasStar ? (lang === "ja" ? " · ★ お気に入り選手" : " · ★ favorites") : ""}
      </Text>
      {points.length < 3 ? (
        noData(lang)
      ) : (
        <LeagueHubScatterNative
          points={points}
          xAxis={preset.x}
          yAxis={preset.y}
          quadrants={preset.quadrants}
          lang={lang}
          marker="dot"
          selectedId={selected}
          onSelect={setSelected}
          showRange
        />
      )}
      {sel ? (
        <View style={styles.selCard}>
          <Pressable style={styles.selRow} onPress={() => onSelectPlayer(sel.playerId)}>
            <View style={styles.selNameCol}>
              <View style={styles.selNameLine}>
                {favIds.has(sel.playerId) ? <Text style={styles.selStar}>★</Text> : null}
                <Text style={[styles.selName, playerNameStyle]}>{sel.name}</Text>
                <HubTeamTag teamId={sel.teamId} />
              </View>
              <Text style={styles.selSub}>
                {sel.gp} GP · {sel.min.toFixed(1)} MIN
              </Text>
            </View>
            <View style={styles.selStats}>
              {[preset.x, preset.y].map((ax) => {
                const v = sel.m[ax.metric];
                const r = v == null ? null : rankOf(ax.metric, ax.invert, v);
                return (
                  <Text key={ax.metric} style={styles.selStat}>
                    {ax.label[lang].replace(/（.*）|\(.*\)/, "").trim()}{" "}
                    <Text style={styles.selStatValue}>{formatHubValue(v, ax.format)}</Text>
                    {r ? (
                      <Text style={styles.selStatRank}>
                        {lang === "ja" ? `  ${r.rank}位/${r.of}` : `  #${r.rank}/${r.of}`}
                      </Text>
                    ) : null}
                  </Text>
                );
              })}
            </View>
            <Text style={styles.selGo}>›</Text>
          </Pressable>
          {similar.length > 0 ? (
            <View style={styles.simRow}>
              <Text style={styles.simLabel}>{lang === "ja" ? "似たスタイル" : "SIMILAR"}</Text>
              <View style={styles.simList}>
                {similar.map((p) => (
                  <Pressable
                    key={p.playerId}
                    style={styles.simItem}
                    onPress={() => setSelected(p.playerId)}
                    hitSlop={4}
                  >
                    <Text style={[styles.simName, playerNameStyle]} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <HubTeamTag teamId={p.teamId} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={styles.tapHint}>
          {lang === "ja" ? "点をタップで選手を表示" : "Tap a dot to see the player"}
        </Text>
      )}
    </View>
  );
}

function WeekCard({
  conf,
  row,
  onSelectPlayer,
}: {
  conf: string;
  row: LeagueHubWeekRow | null;
  onSelectPlayer: (playerId: string) => void;
}) {
  if (!row) {
    return (
      <View style={[hubStyles.card, styles.weekCard]}>
        <Text style={styles.weekConf}>{conf}</Text>
        <Text style={styles.weekName}>—</Text>
      </View>
    );
  }
  return (
    <Pressable
      style={[hubStyles.card, styles.weekCard, { borderColor: teamInk(row.teamId) }]}
      onPress={() => onSelectPlayer(row.playerId)}
    >
      <Text style={styles.weekConf}>{conf}</Text>
      <Text style={[styles.weekName, playerNameStyle]} numberOfLines={1}>
        {row.name}
      </Text>
      <Text style={styles.weekTeam}>
        {teamAbbr(row.teamId)} · {row.wins}-{row.games - row.wins}
      </Text>
      <Text style={styles.weekLine}>
        {row.pts.toFixed(1)} PTS · {row.reb.toFixed(1)} REB · {row.ast.toFixed(1)} AST
      </Text>
    </Pressable>
  );
}

const HIGH_LABEL: Record<LeagueHubHighStat, string> = {
  pts: "PTS",
  reb: "REB",
  ast: "AST",
  fg3m: "3PM",
  stl: "STL",
  blk: "BLK",
};

type CountId = "pts20" | "ddStreak" | "pts30" | "dd" | "td";

function ladderMove(r: LeagueHubLadderRow, index: number, hasPrev: boolean): number | "new" | null {
  if (!hasPrev) return null;
  return r.prevRank == null ? "new" : r.prevRank - (index + 1);
}

function draftLabel(r: LeagueHubLadderRow, ja: boolean): string {
  if (r.draftRound == null || r.draftNumber == null) return ja ? "ドラフト外" : "Undrafted";
  return ja ? `${r.draftRound} 巡 ${r.draftNumber} 位` : `R${r.draftRound} #${r.draftNumber}`;
}

type AwardId = "mvp" | "rookies" | "dpoy" | "sixth" | "mip";

const AWARD_CHIPS: readonly { id: AwardId; label: string }[] = [
  { id: "mvp", label: "MVP" },
  { id: "rookies", label: "ROY" },
  { id: "dpoy", label: "DPOY" },
  { id: "sixth", label: "6MOY" },
  { id: "mip", label: "MIP" },
];

const AWARD_FOOTNOTE: Record<AwardId, { ja: string; en: string }> = {
  mvp: {
    ja: "UNITERZ の試算。65 試合ルール（20 分以上の出場）にまだ届く選手だけを、個人の貢献度（PIE）5 割・効率込みの得点 2 割・チームの勝率 3 割で順位付け。公式の投票とは別物です。PTS / REB / AST。",
    en: "UNITERZ estimate. Players still on track for 65 games (20+ min), ranked by PIE (50%), efficiency-adjusted scoring (20%) and team win % (30%). Not the official vote. PTS / REB / AST.",
  },
  rookies: {
    ja: "UNITERZ の試算。前季までに NBA の試合に出ていない選手（ドラフト外も含む）を、Game Score（効率も含めた 1 試合の総合値）の平均 6 割・個人の貢献度（PIE）2 割・総出場時間 2 割で順位付け。チーム試合の半分以上・平均 12 分以上が対象。PTS / REB / AST。",
    en: "UNITERZ estimate. Players with no prior NBA games (undrafted included), ranked by average Game Score (60%), PIE (20%) and total minutes (20%). Half of team games and 12+ MPG required. PTS / REB / AST.",
  },
  dpoy: {
    ja: "UNITERZ の試算。65 試合ルールにまだ届く選手を、出場中の失点ペース（DRtg）3 割・STL＋BLK 2.5 割・ディフレクション＋シュートチェック 2 割・マークした相手の FG% 1.5 割・DREB 1 割で順位付け。STL / BLK と DRtg。",
    en: "UNITERZ estimate. Players still on track for 65 games, ranked by on-court DRtg (30%), STL+BLK (25%), deflections + contests (20%), opponent FG% when guarding (15%) and DREB (10%). STL / BLK and DRtg.",
  },
  sixth: {
    ja: "UNITERZ の試算。65 試合ルールにまだ届き、先発よりベンチ出場が多い選手を、ベンチ出場時の Game Score 平均 5 割・効率込みの得点 3 割・個人の貢献度（PIE）2 割で順位付け。PTS / REB / AST。",
    en: "UNITERZ estimate. Players still on track for 65 games who come off the bench more than they start, ranked by average Game Score off the bench (50%), efficiency-adjusted scoring (30%) and PIE (20%). PTS / REB / AST.",
  },
  mip: {
    ja: "UNITERZ の試算。前季 20 試合以上・前季平均 25 点未満で、65 試合ルールにまだ届く選手の前季からの伸び。得点の増分 3 割・得点の伸び率 2 割・個人の貢献度（PIE）の増分 3 割・出場時間の増分 2 割。シーズン序盤は数試合で大きく動きます。前季 → 今季の平均得点。",
    en: "UNITERZ estimate. Growth from last season for players with 20+ games and under 25 PPG last season, still on track for 65 games: points gained (30%), points growth rate (20%), PIE gained (30%) and minutes gained (20%). Swings a lot early in the season. Last season → this season PPG.",
  },
};

function awardRowText(
  award: AwardId,
  r: LeagueHubLadderRow,
  ja: boolean
): { sub?: string; value: string; valueSub?: string } {
  const line = `${r.pts.toFixed(1)} / ${r.reb.toFixed(1)} / ${r.ast.toFixed(1)}`;
  switch (award) {
    case "mvp":
      return {
        sub: r.pieRank != null ? (ja ? `貢献度 ${r.pieRank} 位` : `PIE #${r.pieRank}`) : undefined,
        value: line,
        valueSub:
          r.teamWins != null ? `${ja ? "チーム" : "TEAM"} ${r.teamWins}-${r.teamLosses}` : undefined,
      };
    case "rookies":
      return {
        sub: `${draftLabel(r, ja)} · ${r.gp} GP`,
        value: line,
        valueSub: r.gameScore != null ? `GmSc ${r.gameScore.toFixed(1)}` : undefined,
      };
    case "dpoy":
      return {
        sub:
          r.matchupFgPct != null
            ? `${ja ? "マーク相手 FG%" : "Opp FG%"} ${(r.matchupFgPct * 100).toFixed(1)}%`
            : `${r.gp} GP`,
        value: `${(r.stl ?? 0).toFixed(1)} / ${(r.blk ?? 0).toFixed(1)}`,
        valueSub: r.drtg != null ? `DRtg ${r.drtg.toFixed(1)}` : undefined,
      };
    case "sixth":
      return {
        sub: ja
          ? `ベンチ ${r.benchGames ?? 0} · 先発 ${r.startGames ?? 0}`
          : `Bench ${r.benchGames ?? 0} · Start ${r.startGames ?? 0}`,
        value: line,
        valueSub: r.gameScore != null ? `GmSc ${r.gameScore.toFixed(1)}` : undefined,
      };
    case "mip": {
      const dPts = r.prevPts != null ? r.pts - r.prevPts : null;
      const dPie = r.pieDelta != null ? r.pieDelta * 100 : null;
      const signed = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
      return {
        sub: dPie != null ? `${ja ? "貢献度" : "PIE"} ${signed(dPie)}` : undefined,
        value: r.prevPts != null ? `${r.prevPts.toFixed(1)} → ${r.pts.toFixed(1)}` : r.pts.toFixed(1),
        valueSub: dPts != null ? `PTS ${signed(dPts)}` : undefined,
      };
    }
  }
}

export default function LeagueHubPlayerPanelNative({ hub, lang, onSelectPlayer }: Props) {
  const [high, setHigh] = useState<LeagueHubHighStat>("pts");
  const [countId, setCountId] = useState<CountId>("pts20");
  const ja = lang === "ja";

  const countRows: LeagueHubCountRow[] =
    countId === "pts20"
      ? hub.streaks.pts20
      : countId === "ddStreak"
        ? hub.streaks.doubleDouble
        : countId === "pts30"
          ? hub.counts.pts30
          : countId === "dd"
            ? hub.counts.doubleDouble
            : hub.counts.tripleDouble;
  const isStreak = countId === "pts20" || countId === "ddStreak";
  const [award, setAward] = useState<AwardId>("mvp");
  const awardRows = (award === "rookies" ? hub.rookies : award === "mvp" ? hub.mvp : hub[award]) ?? [];
  const awardPrev = hub.ladderPrev?.[award];

  return (
    <View>
      <HubSection title="STYLE MAP">
        <StyleMap players={hub.players} lang={lang} onSelectPlayer={onSelectPlayer} />
      </HubSection>

      <HubSection
        title="BY ZONE"
        hint={
          ja
            ? "エリアごとの成功率トップ。コートかチップでエリアを切り替え。試投数の基準は試合が進むほど上がる。"
            : "Best FG% in each zone. Tap the court or a chip to switch zones. The attempt minimum rises as the season goes on."
        }
      >
        {hub.zones.length > 0 ? (
          <LeagueHubZoneKingsNative zones={hub.zones} lang={lang} onSelectPlayer={onSelectPlayer} />
        ) : (
          noData(lang)
        )}
      </HubSection>

      <HubSection title="AWARD LADDERS">
        <HubChips items={AWARD_CHIPS} value={award} onChange={setAward} />
        {awardRows.length === 0
          ? noData(lang)
          : awardRows.map((r, i) => (
              <HubRow
                key={r.playerId}
                rank={i + 1}
                rankMove={ladderMove(r, i, awardPrev != null)}
                teamId={r.teamId}
                name={r.name}
                {...awardRowText(award, r, ja)}
                onPress={() => onSelectPlayer(r.playerId)}
              />
            ))}
        <Text style={hubStyles.footnote}>{AWARD_FOOTNOTE[award][ja ? "ja" : "en"]}</Text>
      </HubSection>

      <HubSection
        title="PLAYERS OF THE WEEK"
        hint={
          hub.week
            ? `${hub.week.startLabel} – ${hub.week.endLabel}${
                hub.week.inProgress ? (ja ? "（今週・途中）" : " (in progress)") : ""
              } · ${ja ? "Game Score の平均" : "avg Game Score"}`
            : undefined
        }
      >
        {hub.week ? (
          <View>
            <View style={styles.weekRow}>
              <WeekCard conf="EAST" row={hub.week.east} onSelectPlayer={onSelectPlayer} />
              <WeekCard conf="WEST" row={hub.week.west} onSelectPlayer={onSelectPlayer} />
            </View>
            {hub.week.top.slice(0, 5).map((r, i) => (
              <HubRow
                key={r.playerId}
                rank={i + 1}
                teamId={r.teamId}
                name={r.name}
                sub={`${r.games} G`}
                value={r.gameScore.toFixed(1)}
                valueSub={`${r.pts.toFixed(1)} / ${r.reb.toFixed(1)} / ${r.ast.toFixed(1)}`}
                onPress={() => onSelectPlayer(r.playerId)}
              />
            ))}
          </View>
        ) : (
          noData(lang)
        )}
      </HubSection>

      <HubSection
        title="HOT / COLD"
        hint={ja ? "直近 5 試合の平均得点とそれより前の比較。" : "Last 5 games vs earlier, points per game."}
      >
        <HubTwoCol
          leftTitle="HOT"
          rightTitle="COLD"
          left={
            hub.hot.length === 0
              ? noData(lang)
              : hub.hot.map((r) => (
                  <HubRow
                    key={r.playerId}
                    teamId={r.teamId}
                    name={r.name}
                    value={r.recent.toFixed(1)}
                    valueSub={`${ja ? "前" : "was"} ${r.before.toFixed(1)}`}
                    onPress={() => onSelectPlayer(r.playerId)}
                  />
                ))
          }
          right={
            hub.cold.length === 0
              ? noData(lang)
              : hub.cold.map((r) => (
                  <HubRow
                    key={r.playerId}
                    teamId={r.teamId}
                    name={r.name}
                    value={r.recent.toFixed(1)}
                    valueSub={`${ja ? "前" : "was"} ${r.before.toFixed(1)}`}
                    onPress={() => onSelectPlayer(r.playerId)}
                  />
                ))
          }
        />
      </HubSection>

      <HubSection title="SEASON HIGHS">
        <HubChips
          items={(Object.keys(HIGH_LABEL) as LeagueHubHighStat[]).map((id) => ({
            id,
            label: HIGH_LABEL[id],
          }))}
          value={high}
          onChange={setHigh}
        />
        {(hub.highs[high] ?? []).length === 0
          ? noData(lang)
          : hub.highs[high].map((r, i) => (
              <HubRow
                key={`${r.playerId}-${r.gameId}`}
                rank={i + 1}
                teamId={r.teamId}
                name={r.name}
                sub={`vs ${r.oppAbbr} · ${r.dateLabel}`}
                value={String(r.value)}
                valueSub={`${r.pts} / ${r.reb} / ${r.ast}`}
                onPress={() => onSelectPlayer(r.playerId)}
              />
            ))}
      </HubSection>

      <HubSection
        title="STREAKS & COUNTS"
        hint={
          isStreak
            ? ja
              ? "継続中の連続試合（3 試合以上）。"
              : "Active streaks (3+ games)."
            : undefined
        }
      >
        <HubChips
          items={[
            { id: "pts20", label: "20+ PTS STREAK" },
            { id: "ddStreak", label: "DD STREAK" },
            { id: "pts30", label: "30+ PTS GAMES" },
            { id: "dd", label: "DOUBLE-DOUBLES" },
            { id: "td", label: "TRIPLE-DOUBLES" },
          ]}
          value={countId}
          onChange={setCountId}
        />
        {countRows.length === 0
          ? noData(lang)
          : countRows.map((r, i) => (
              <HubRow
                key={r.playerId}
                rank={i + 1}
                teamId={r.teamId}
                name={r.name}
                value={String(r.count)}
                valueSub={isStreak ? (ja ? "試合連続" : "straight") : ja ? "回" : "games"}
                onPress={() => onSelectPlayer(r.playerId)}
              />
            ))}
      </HubSection>
    </View>
  );
}

const styles = StyleSheet.create({
  mapHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 6,
  },
  mapControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  mapPool: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.55)",
    fontSize: 10,
    marginBottom: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: "rgba(0,245,255,0.08)",
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "700",
    paddingVertical: 9,
  },
  searchList: {
    borderWidth: 1.5,
    borderColor: CYBER_TAB_CYAN,
    backgroundColor: "#050808",
    marginTop: -6,
    marginBottom: 6,
  },
  searchEmpty: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  searchName: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  searchAdd: {
    marginLeft: "auto",
    color: CYBER_TAB_CYAN,
    fontSize: 14,
    fontWeight: "800",
  },
  addedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  addedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  addedName: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  addedRemove: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "800",
  },
  selCard: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  selRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  selStar: {
    color: "#fff",
    fontSize: 12,
    marginRight: -3,
  },
  selStatRank: {
    color: "rgba(0,245,255,0.75)",
    fontSize: 10,
    fontWeight: "700",
  },
  simRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,245,255,0.18)",
  },
  simLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700",
  },
  simList: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  simItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  simName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700",
  },
  selNameCol: {
    minWidth: 0,
  },
  selNameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  selName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  selSub: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
  },
  selStats: {
    flex: 1,
    alignItems: "flex-end",
    gap: 2,
  },
  selStat: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
  },
  selStatValue: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  selGo: {
    color: CYBER_TAB_CYAN,
    fontSize: 18,
    fontWeight: "800",
  },
  tapHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    textAlign: "center",
    marginTop: 6,
  },
  weekRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  weekCard: {
    flex: 1,
    minWidth: 0,
  },
  weekConf: {
    fontFamily: METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  weekName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
  weekTeam: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 1,
  },
  weekLine: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    marginTop: 4,
  },
});
