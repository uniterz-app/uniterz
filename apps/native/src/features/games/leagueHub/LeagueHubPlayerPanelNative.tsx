import { useMemo, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  LEAGUE_HUB_PLAYER_SCATTER_GROUPS,
  LEAGUE_HUB_PLAYER_SCATTER_PRESETS,
  type LeagueHubPlayerScatterGroupId,
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
  LeagueHubTopGame,
  NbaLeagueHubDoc,
} from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { useMyNbaFavoritesNative } from "../../profile/useMyNbaFavoritesNative";
import LeagueHubScatterNative, { type HubScatterPoint } from "./LeagueHubScatterNative";
import LeagueHubZoneKingsNative from "./LeagueHubZoneKingsNative";
import HubShareSectionNative, { useHubCapturing } from "./HubShareSectionNative";
import LeagueHubCompareNative from "./LeagueHubCompareNative";
import {
  HubCellHeader,
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

export type LeagueHubPlayerSection = "style" | "zone" | "ladder" | "trend";

export const LEAGUE_HUB_PLAYER_SECTIONS: readonly { id: LeagueHubPlayerSection; label: string }[] = [
  { id: "style", label: "STYLE" },
  { id: "zone", label: "ZONE" },
  { id: "ladder", label: "LADDER" },
  { id: "trend", label: "TREND" },
];

type Props = {
  hub: NbaLeagueHubDoc;
  lang: HubLang;
  section: LeagueHubPlayerSection;
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
  stamp,
  onSelectPlayer,
}: {
  players: LeagueHubPlayer[];
  lang: HubLang;
  stamp: string;
  onSelectPlayer: (playerId: string) => void;
}) {
  const capturing = useHubCapturing();
  const [groupId, setGroupId] = useState<LeagueHubPlayerScatterGroupId>("scoring");
  /** グループを行き来しても、それぞれ最後に見たマップに戻る */
  const [presetByGroup, setPresetByGroup] = useState<Record<LeagueHubPlayerScatterGroupId, string>>(
    () =>
      Object.fromEntries(
        LEAGUE_HUB_PLAYER_SCATTER_GROUPS.map((g) => [g.id, g.presetIds[0]])
      ) as Record<LeagueHubPlayerScatterGroupId, string>
  );
  const presetId = presetByGroup[groupId];
  const group =
    LEAGUE_HUB_PLAYER_SCATTER_GROUPS.find((g) => g.id === groupId) ?? LEAGUE_HUB_PLAYER_SCATTER_GROUPS[0];
  const [topN, setTopN] = useState<"30" | "50">("30");
  const [pos, setPos] = useState<HubPosFilter>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  /** 比較の 2 人目。1 人目（selected）を選んだ状態で別の選手を選ぶと入る */
  const [compareB, setCompareB] = useState<string | null>(null);
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
          p.playerId === compareB ||
          added.includes(p.playerId) ||
          (favIds.has(p.playerId) && inPos(p)))
    );
    return { top, pinned };
  }, [players, preset, topN, pos, favIds, selected, added, compareB]);
  const hits = useMemo(() => searchHubPlayers(players, query), [players, query]);
  const clearSel = () => {
    setSelected(null);
    setCompareB(null);
  };
  const unselect = (id: string) => {
    if (id === selected) {
      setSelected(compareB);
      setCompareB(null);
    } else if (id === compareB) {
      setCompareB(null);
    }
  };
  const choose = (id: string) => {
    if (selected == null) setSelected(id);
    else if (id !== selected) setCompareB(id);
  };
  const tapMap = (id: string | null) => {
    if (id == null) clearSel();
    else if (id === selected || id === compareB) unselect(id);
    else choose(id);
  };
  const addPlayer = (id: string) => {
    setAdded((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, MAX_ADDED));
    choose(id);
    setQuery("");
    Keyboard.dismiss();
  };
  const findPlayer = (id: string | null) =>
    id ? (players.find((p) => p.playerId === id) ?? null) : null;
  const cmpA = compareB ? findPlayer(selected) : null;
  const cmpB = findPlayer(compareB);
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
      {capturing ? (
        <Text style={styles.captureMapTitle}>
          {group.label} · {preset.label.en}
        </Text>
      ) : (
        <>
          <HubToggle
            items={LEAGUE_HUB_PLAYER_SCATTER_GROUPS.map((g) => ({ id: g.id, label: g.label }))}
            value={groupId}
            onChange={(id) => {
              setGroupId(id);
              clearSel();
            }}
            fill
          />
          <HubChips
            items={group.presetIds.flatMap((id) => {
              const p = LEAGUE_HUB_PLAYER_SCATTER_PRESETS.find((x) => x.id === id);
              return p ? [{ id: p.id, label: p.label.en }] : [];
            })}
            value={presetId}
            onChange={(id) => {
              setPresetByGroup((prev) => ({ ...prev, [groupId]: id }));
              clearSel();
            }}
            wrap
            columns={4}
          />
        </>
      )}
      <Text style={styles.mapHint}>{preset.hint[lang]}</Text>
      {capturing ? null : (
        <View style={styles.mapControls}>
          <HubPosToggle
            value={pos}
            onChange={(v) => {
              setPos(v);
              clearSel();
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
      )}
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
          secondId={compareB}
          onSelect={setSelected}
          onTap={tapMap}
          showRange
        />
      )}
      {capturing ? null : cmpA && cmpB ? (
        <View style={styles.compareWrap}>
          <LeagueHubCompareNative
            a={cmpA}
            b={cmpB}
            players={players}
            lang={lang}
            stamp={stamp}
            onClose={() => setCompareB(null)}
          />
        </View>
      ) : sel ? (
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
                    onPress={() => choose(p.playerId)}
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
          <Text style={styles.compareHint}>
            {lang === "ja" ? "もう 1 人タップで比較" : "Tap another player to compare"}
          </Text>
        </View>
      ) : (
        <Text style={styles.tapHint}>
          {lang === "ja" ? "点をタップで選手を表示" : "Tap a dot to see the player"}
        </Text>
      )}
      {capturing ? null : (
        <>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={18} color={CYBER_TAB_CYAN} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={
                lang === "ja"
                  ? "選手を探してマップに追加（例: curry / GSW）"
                  : "Add a player (e.g. curry / GSW)"
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
                  <Pressable onPress={() => choose(p.playerId)} hitSlop={4}>
                    <Text style={[styles.addedName, playerNameStyle]}>{p.name}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setAdded((prev) => prev.filter((x) => x !== p.playerId));
                      unselect(p.playerId);
                    }}
                    hitSlop={8}
                  >
                    <Text style={styles.addedRemove}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const TOP_GAME_EXTRA_MIN = 5;

function topGameSub(g: LeagueHubTopGame): string {
  const extras = [
    g.fg3m >= TOP_GAME_EXTRA_MIN ? `${g.fg3m} 3PM` : null,
    g.stl >= TOP_GAME_EXTRA_MIN ? `${g.stl} STL` : null,
    g.blk >= TOP_GAME_EXTRA_MIN ? `${g.blk} BLK` : null,
  ].filter(Boolean);
  return [`${g.home ? "vs" : "@"} ${g.oppAbbr} · ${g.dateLabel} · ${g.result}`, ...extras].join(
    " · "
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

/** LADDER タブに上から並べる順 */
const AWARD_SECTIONS: readonly { id: AwardId; title: string }[] = [
  { id: "mvp", title: "MVP LADDER" },
  { id: "rookies", title: "ROOKIE LADDER" },
  { id: "dpoy", title: "DPOY LADDER" },
  { id: "sixth", title: "SIXTH MAN LADDER" },
  { id: "mip", title: "MIP LADDER" },
];

const AWARD_FOOTNOTE: Record<AwardId, { ja: string; en: string }> = {
  mvp: {
    ja: "UNITERZ の試算。65 試合ルール（20 分以上の出場）にまだ届く選手だけを、個人の貢献度（PIE）5 割・効率込みの得点 2 割・チームの勝率 3 割で順位付け。公式の投票とは別物です。",
    en: "UNITERZ estimate. Players still on track for 65 games (20+ min), ranked by PIE (50%), efficiency-adjusted scoring (20%) and team win % (30%). Not the official vote.",
  },
  rookies: {
    ja: "UNITERZ の試算。前季までに NBA の試合に出ていない選手（ドラフト外も含む）を、Game Score（効率も含めた 1 試合の総合値）の平均 6 割・個人の貢献度（PIE）2 割・総出場時間 2 割で順位付け。チーム試合の半分以上・平均 12 分以上が対象。",
    en: "UNITERZ estimate. Players with no prior NBA games (undrafted included), ranked by average Game Score (60%), PIE (20%) and total minutes (20%). Half of team games and 12+ MPG required.",
  },
  dpoy: {
    ja: "UNITERZ の試算。65 試合ルールにまだ届く選手を、出場中の失点ペース（DRtg）3 割・STL＋BLK 2.5 割・ディフレクション＋シュートチェック 2 割・マークした相手の FG% 1.5 割・DREB 1 割で順位付け。",
    en: "UNITERZ estimate. Players still on track for 65 games, ranked by on-court DRtg (30%), STL+BLK (25%), deflections + contests (20%), opponent FG% when guarding (15%) and DREB (10%).",
  },
  sixth: {
    ja: "UNITERZ の試算。65 試合ルールにまだ届き、先発よりベンチ出場が多い選手を、ベンチ出場時の Game Score 平均 5 割・効率込みの得点 3 割・個人の貢献度（PIE）2 割で順位付け。",
    en: "UNITERZ estimate. Players still on track for 65 games who come off the bench more than they start, ranked by average Game Score off the bench (50%), efficiency-adjusted scoring (30%) and PIE (20%).",
  },
  mip: {
    ja: "UNITERZ の試算。前季 20 試合以上・前季平均 25 点未満で、65 試合ルールにまだ届く選手の前季からの伸び。得点の増分 3 割・得点の伸び率 2 割・個人の貢献度（PIE）の増分 3 割・出場時間の増分 2 割。シーズン序盤は数試合で大きく動きます。",
    en: "UNITERZ estimate. Growth from last season for players with 20+ games and under 25 PPG last season, still on track for 65 games: points gained (30%), points growth rate (20%), PIE gained (30%) and minutes gained (20%). Swings a lot early in the season.",
  },
};

/** 数値列の見出し（`awardRowText` の cells と同じ並び） */
function awardCellLabels(award: AwardId, ja: boolean): string[] {
  switch (award) {
    case "dpoy":
      return ["STL", "BLK", "DRtg"];
    case "mip":
      return ja ? ["前季", "今季", "増減"] : ["LAST", "NOW", "+/-"];
    default:
      return ["PTS", "REB", "AST"];
  }
}

function awardCellCaption(award: AwardId, ja: boolean): string {
  switch (award) {
    case "dpoy":
      return ja ? "1 試合平均 · DRtg は低いほど良い" : "Per game · lower DRtg is better";
    case "mip":
      return ja ? "1 試合の平均得点" : "Points per game";
    default:
      return ja ? "1 試合平均" : "Per game";
  }
}

function awardRowText(
  award: AwardId,
  r: LeagueHubLadderRow,
  ja: boolean
): { sub?: string; cells: string[]; valueSub?: string } {
  const line = [r.pts.toFixed(1), r.reb.toFixed(1), r.ast.toFixed(1)];
  const gameScore = r.gameScore != null ? `Game Score ${r.gameScore.toFixed(1)}` : undefined;
  const signed = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
  switch (award) {
    case "mvp":
      return {
        sub: r.pieRank != null ? (ja ? `貢献度 ${r.pieRank} 位` : `PIE #${r.pieRank}`) : undefined,
        cells: line,
        valueSub:
          r.teamWins != null ? `${ja ? "チーム" : "TEAM"} ${r.teamWins}-${r.teamLosses}` : undefined,
      };
    case "rookies":
      return { sub: `${draftLabel(r, ja)} · ${r.gp} GP`, cells: line, valueSub: gameScore };
    case "dpoy":
      return {
        sub:
          r.matchupFgPct != null
            ? `${ja ? "マーク相手 FG%" : "Opp FG%"} ${(r.matchupFgPct * 100).toFixed(1)}%`
            : `${r.gp} GP`,
        cells: [
          (r.stl ?? 0).toFixed(1),
          (r.blk ?? 0).toFixed(1),
          r.drtg != null ? r.drtg.toFixed(1) : "—",
        ],
      };
    case "sixth":
      return {
        sub: ja
          ? `ベンチ ${r.benchGames ?? 0} · 先発 ${r.startGames ?? 0}`
          : `Bench ${r.benchGames ?? 0} · Start ${r.startGames ?? 0}`,
        cells: line,
        valueSub: gameScore,
      };
    case "mip": {
      const dPie = r.pieDelta != null ? r.pieDelta * 100 : null;
      return {
        sub: dPie != null ? `${ja ? "貢献度" : "PIE"} ${signed(dPie)}` : undefined,
        cells: [
          r.prevPts != null ? r.prevPts.toFixed(1) : "—",
          r.pts.toFixed(1),
          r.prevPts != null ? signed(r.pts - r.prevPts) : "—",
        ],
      };
    }
  }
}

export default function LeagueHubPlayerPanelNative({ hub, lang, section, onSelectPlayer }: Props) {
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
  const ladderRows = (award: AwardId) =>
    (award === "rookies" ? hub.rookies : award === "mvp" ? hub.mvp : hub[award]) ?? [];
  const built = new Date(hub.builtAtMs);
  const stamp = `NBA ${hub.seasonKey} · ${built.getMonth() + 1}/${built.getDate()}`;
  /** 切り替えてもマップの追加選手などを残すため、隠すだけでアンマウントしない */
  const shown = (id: LeagueHubPlayerSection) => (section === id ? null : styles.hidden);

  return (
    <View>
      <View style={shown("style")}>
        <HubShareSectionNative title="STYLE MAP" stamp={stamp} lang={lang}>
          <StyleMap
            players={hub.players}
            lang={lang}
            stamp={stamp}
            onSelectPlayer={onSelectPlayer}
          />
        </HubShareSectionNative>
      </View>

      <View style={shown("zone")}>
        <HubSection
          title="BY ZONE"
          hint={
            ja
              ? "エリアごとの成功率トップ。コートをタップしても切り替えられる。"
              : "Best FG% in each zone. Tap the court to switch zones too."
          }
        >
          {hub.zones.length > 0 ? (
            <LeagueHubZoneKingsNative zones={hub.zones} lang={lang} onSelectPlayer={onSelectPlayer} />
          ) : (
            noData(lang)
          )}
        </HubSection>
      </View>

      <View style={shown("ladder")}>
        {AWARD_SECTIONS.map(({ id: award, title }) => {
          const rows = ladderRows(award);
          const hasPrev = hub.ladderPrev?.[award] != null;
          return (
            <HubShareSectionNative key={award} title={title} stamp={stamp} lang={lang}>
              {rows.length > 0 ? (
                <HubCellHeader
                  labels={awardCellLabels(award, ja)}
                  caption={awardCellCaption(award, ja)}
                />
              ) : null}
              {rows.length === 0
                ? noData(lang)
                : rows.map((r, i) => (
                    <HubRow
                      key={r.playerId}
                      rank={i + 1}
                      rankMove={ladderMove(r, i, hasPrev)}
                      teamId={r.teamId}
                      name={r.name}
                      {...awardRowText(award, r, ja)}
                      onPress={() => onSelectPlayer(r.playerId)}
                    />
                  ))}
              <Text style={hubStyles.footnote}>{AWARD_FOOTNOTE[award][ja ? "ja" : "en"]}</Text>
            </HubShareSectionNative>
          );
        })}
      </View>

      <View style={shown("trend")}>
        <HubShareSectionNative
          title="TOP PERFORMANCES"
          stamp={stamp}
          lang={lang}
          hint={
            hub.topGames
              ? `${hub.topGames.startLabel} – ${hub.topGames.endLabel} · ${
                  ja ? "1 試合の Game Score 順" : "single games by Game Score"
                }`
              : undefined
          }
        >
          {hub.topGames && hub.topGames.games.length > 0 ? (
            <View>
              <HubCellHeader labels={["PTS", "REB", "AST"]} />
              {hub.topGames.games.map((g, i) => (
                <HubRow
                  key={`${g.playerId}-${g.gameId}`}
                  rank={i + 1}
                  teamId={g.teamId}
                  name={g.name}
                  sub={topGameSub(g)}
                  cells={[String(g.pts), String(g.reb), String(g.ast)]}
                  valueSub={`Game Score ${g.gameScore.toFixed(1)}`}
                  onPress={() => onSelectPlayer(g.playerId)}
                />
              ))}
            </View>
          ) : (
            noData(lang)
          )}
        </HubShareSectionNative>

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
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { display: "none" },
  captureMapTitle: {
    fontFamily: METRIC_FONT,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 4,
  },
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
    marginTop: 12,
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
  compareWrap: {
    marginTop: 4,
  },
  compareHint: {
    textAlign: "center",
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,245,255,0.18)",
    color: "rgba(0,245,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
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
});
