import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  LEAGUE_HUB_PLAYER_SCATTER_PRESETS,
  type LeagueHubPlayerScatterPreset,
} from "../../../../../../lib/nba/leagueHub/leagueHubScatterPresets";
import type {
  LeagueHubCountRow,
  LeagueHubHighStat,
  LeagueHubPlayer,
  LeagueHubWeekRow,
  NbaLeagueHubDoc,
} from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import LeagueHubScatterNative, { type HubScatterPoint } from "./LeagueHubScatterNative";
import LeagueHubZoneKingsNative from "./LeagueHubZoneKingsNative";
import {
  HubChips,
  HubEmpty,
  HubRow,
  HubSection,
  HubToggle,
  HubTwoCol,
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
  const [selected, setSelected] = useState<string | null>(null);
  const preset: LeagueHubPlayerScatterPreset =
    LEAGUE_HUB_PLAYER_SCATTER_PRESETS.find((p) => p.id === presetId) ??
    LEAGUE_HUB_PLAYER_SCATTER_PRESETS[0]!;

  const pool = useMemo(
    () =>
      players
        .filter(
          (p) =>
            p.m[preset.volume] != null && p.m[preset.x.metric] != null && p.m[preset.y.metric] != null
        )
        .sort((a, b) => (b.m[preset.volume] ?? 0) - (a.m[preset.volume] ?? 0))
        .slice(0, Number(topN)),
    [players, preset, topN]
  );
  const points: HubScatterPoint[] = pool.map((p) => ({
    id: p.playerId,
    x: p.m[preset.x.metric]!,
    y: p.m[preset.y.metric]!,
    label: p.name,
    color: teamInk(p.teamId),
  }));
  const sel = selected ? pool.find((p) => p.playerId === selected) : null;

  return (
    <View>
      <HubChips
        items={LEAGUE_HUB_PLAYER_SCATTER_PRESETS.map((p) => ({ id: p.id, label: p.label[lang] }))}
        value={presetId}
        onChange={(id) => {
          setPresetId(id);
          setSelected(null);
        }}
      />
      <View style={styles.mapHead}>
        <Text style={styles.mapHint}>{preset.hint[lang]}</Text>
        <HubToggle
          items={[
            { id: "30", label: "TOP 30" },
            { id: "50", label: "TOP 50" },
          ]}
          value={topN}
          onChange={setTopN}
        />
      </View>
      <Text style={styles.mapPool}>
        {lang === "ja"
          ? `${preset.volumeLabel.ja}の上位 ${topN} 人`
          : `Top ${topN} by ${preset.volumeLabel.en}`}
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
        />
      )}
      {sel ? (
        <Pressable style={styles.selRow} onPress={() => onSelectPlayer(sel.playerId)}>
          <View style={[styles.selDot, { backgroundColor: teamInk(sel.teamId) }]} />
          <View style={styles.selNameCol}>
            <Text style={[styles.selName, playerNameStyle]}>{sel.name}</Text>
            <Text style={styles.selSub}>
              {teamAbbr(sel.teamId)} · {sel.gp} GP · {sel.min.toFixed(1)} MIN
            </Text>
          </View>
          <View style={styles.selStats}>
            {[preset.x, preset.y].map((ax) => (
              <Text key={ax.metric} style={styles.selStat}>
                {ax.label[lang].replace(/（.*）|\(.*\)/, "").trim()}{" "}
                <Text style={styles.selStatValue}>
                  {formatHubValue(sel.m[ax.metric], ax.format)}
                </Text>
              </Text>
            ))}
          </View>
          <Text style={styles.selGo}>›</Text>
        </Pressable>
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

  return (
    <View>
      <HubSection title={ja ? "スタイルマップ" : "STYLE MAP"}>
        <StyleMap players={hub.players} lang={lang} onSelectPlayer={onSelectPlayer} />
      </HubSection>

      <HubSection
        title={ja ? "エリアの王" : "ZONE KINGS"}
        hint={
          ja
            ? "エリアごとの成功率トップ。コートかチップでエリアを切り替え。一定の試投数がある選手だけ。"
            : "Best FG% in each zone (minimum attempts). Tap the court or a chip to switch zones."
        }
      >
        {hub.zones.length > 0 ? (
          <LeagueHubZoneKingsNative zones={hub.zones} lang={lang} onSelectPlayer={onSelectPlayer} />
        ) : (
          noData(lang)
        )}
      </HubSection>

      <HubSection title={ja ? "MVP ラダー" : "MVP LADDER"}>
        {hub.mvp.length === 0
          ? noData(lang)
          : hub.mvp.map((r, i) => (
              <HubRow
                key={r.playerId}
                rank={i + 1}
                teamId={r.teamId}
                name={r.name}
                value={`${r.pts.toFixed(1)} / ${r.reb.toFixed(1)} / ${r.ast.toFixed(1)}`}
                valueSub={
                  r.teamWins != null
                    ? `${ja ? "チーム" : "TEAM"} ${r.teamWins}-${r.teamLosses}`
                    : undefined
                }
                onPress={() => onSelectPlayer(r.playerId)}
              />
            ))}
        <Text style={hubStyles.footnote}>
          {ja
            ? "UNITERZ の試算（個人の貢献度 PIE × チームの勝率）。公式の投票とは別物です。PTS / REB / AST。"
            : "UNITERZ estimate (PIE × team win %). Not the official vote. PTS / REB / AST."}
        </Text>
      </HubSection>

      <HubSection title={ja ? "新人ラダー" : "ROOKIE LADDER"}>
        {hub.rookies.length === 0
          ? noData(lang)
          : hub.rookies.map((r, i) => (
              <HubRow
                key={r.playerId}
                rank={i + 1}
                teamId={r.teamId}
                name={r.name}
                sub={`${r.gp} GP`}
                value={`${r.pts.toFixed(1)}`}
                valueSub={`${r.reb.toFixed(1)} REB · ${r.ast.toFixed(1)} AST`}
                onPress={() => onSelectPlayer(r.playerId)}
              />
            ))}
      </HubSection>

      <HubSection
        title={ja ? "週間ベスト" : "PLAYERS OF THE WEEK"}
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
        title={ja ? "好調 / 不調" : "HOT / COLD"}
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

      <HubSection title={ja ? "シーズンハイ" : "SEASON HIGHS"}>
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
        title={ja ? "連続記録と回数" : "STREAKS & COUNTS"}
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
            { id: "pts20", label: ja ? "20点+ 連続" : "20+ PTS STREAK" },
            { id: "ddStreak", label: ja ? "ダブルダブル連続" : "DD STREAK" },
            { id: "pts30", label: ja ? "30点+ 回数" : "30+ PTS GAMES" },
            { id: "dd", label: ja ? "ダブルダブル回数" : "DOUBLE-DOUBLES" },
            { id: "td", label: ja ? "トリプルダブル回数" : "TRIPLE-DOUBLES" },
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
  mapHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 4,
  },
  mapHint: {
    flex: 1,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    lineHeight: 16,
  },
  mapPool: {
    fontFamily: METRIC_FONT,
    color: "rgba(0,245,255,0.55)",
    fontSize: 10,
    marginBottom: 4,
  },
  selRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  selDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  selNameCol: {
    minWidth: 0,
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
