import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import type {
  LeagueHubMilestoneStat,
  NbaLeagueHubDoc,
} from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import {
  HUB_BAD_COLOR,
  HUB_GOOD_COLOR,
  HubCellHeader,
  HubEmpty,
  HubRow,
  HubSection,
  HubTwoCol,
  type HubLang,
} from "./leagueHubUiNative";
import { HubSlantedTabs } from "./LeagueHubSlantedTabsNative";

type Props = {
  hub: NbaLeagueHubDoc;
  lang: HubLang;
  onSelectPlayer: (playerId: string) => void;
};

function signed(v: number): string {
  return `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(1)}`;
}

function empty(lang: HubLang) {
  return <HubEmpty text={lang === "ja" ? "まだ試合が少ないです" : "Not enough games yet"} />;
}

type SplitMode = "homeAway" | "b2b";

const SPLIT_HINTS: Record<SplitMode, Record<HubLang, string>> = {
  homeAway: {
    ja: "ホームとアウェーの 1 試合平均得点の差。平均 12 点以上で、ホーム・アウェーとも数試合ある選手だけ。",
    en: "Points per game at home minus on the road. 12+ PPG with several games each.",
  },
  b2b: {
    ja: "連戦 2 日目（自分も前日に出た試合）の平均得点と、それ以外の試合の差。2 日目が 2 試合以上ある選手だけ。",
    en: "Points on the second night of back-to-backs (played the night before too) vs other games. 2+ such games.",
  },
};

/** ホーム / アウェー・B2B 2 日目の得点差 */
export function PlayerSplitsSection({ hub, lang, onSelectPlayer }: Props) {
  const [mode, setMode] = useState<SplitMode>("homeAway");
  const ja = lang === "ja";
  const s = hub.playerSplits;
  if (!s) return null;
  const home = mode === "homeAway";
  const left = home ? s.home : s.b2bUp;
  const right = home ? s.away : s.b2bDrop;
  /** アウェー列はアウェーから見た差（+ = アウェーのほうが多い） */
  const list = (rows: typeof left, flip = false) =>
    rows.length === 0
      ? empty(lang)
      : rows.slice(0, 5).map((r) => (
          <HubRow
            key={r.playerId}
            teamId={r.teamId}
            name={r.name}
            sub={
              home
                ? `H ${r.a.toFixed(1)} · A ${r.b.toFixed(1)}`
                : `B2B ${r.a.toFixed(1)} · ${ja ? "他" : "else"} ${r.b.toFixed(1)}`
            }
            value={signed(flip ? -r.diff : r.diff)}
            onPress={() => onSelectPlayer(r.playerId)}
            framed
          />
        ));
  return (
    <HubSection title="HOME / AWAY · B2B" hint={SPLIT_HINTS[mode][lang]}>
      <HubSlantedTabs
        items={[
          { id: "homeAway", label: "HOME / AWAY" },
          { id: "b2b", label: "B2B" },
        ]}
        value={mode}
        onChange={setMode}
      />
      <HubTwoCol
        leftTitle={home ? (ja ? "ホームで得点アップ" : "BETTER AT HOME") : ja ? "2 日目に得点アップ" : "B2B UP"}
        rightTitle={
          home ? (ja ? "アウェーで得点アップ" : "BETTER ON ROAD") : ja ? "2 日目に得点ダウン" : "B2B DROP"
        }
        left={list(left)}
        right={list(right, home)}
      />
    </HubSection>
  );
}

/** 節目の言い方と、残りの数の単位 */
const MILESTONE_TEXT: Record<
  LeagueHubMilestoneStat,
  { target: (n: string) => { ja: string; en: string }; unit: { ja: string; en: string } }
> = {
  pts: { target: (n) => ({ ja: `通算 ${n} 点まで`, en: `${n} career PTS` }), unit: { ja: "点", en: "PTS" } },
  reb: {
    target: (n) => ({ ja: `通算 ${n} リバウンドまで`, en: `${n} career REB` }),
    unit: { ja: "本", en: "REB" },
  },
  ast: {
    target: (n) => ({ ja: `通算 ${n} アシストまで`, en: `${n} career AST` }),
    unit: { ja: "本", en: "AST" },
  },
  fg3m: {
    target: (n) => ({ ja: `通算 3P ${n} 本まで`, en: `${n} career 3PM` }),
    unit: { ja: "本", en: "3PM" },
  },
};

/** 通算の節目まであと少しの選手 */
export function MilestonesSection({ hub, lang, onSelectPlayer }: Props) {
  const rows = hub.milestones;
  if (rows == null) return null;
  const ja = lang === "ja";
  const anyApprox = rows.some((r) => r.approx);
  return (
    <HubSection
      title="MILESTONE WATCH"
      hint={
        ja
          ? `通算（レギュラーシーズン）の節目まであと少しの選手。今季のペースで早く届きそうな順。${anyApprox ? "「約」は記録が一部欠けた試合を平均で埋めた選手で、数本ずれることがあります。" : ""}`
          : `Players closing in on a career (regular season) milestone, soonest at this season's pace first.${anyApprox ? " \"~\" marks players with a few games filled in from averages, so the count can be off by a few." : ""}`
      }
    >
      {rows.length === 0
        ? empty(lang)
        : rows.map((r) => {
            const text = MILESTONE_TEXT[r.stat];
            const lang2 = ja ? "ja" : "en";
            return (
              <HubRow
                key={`${r.playerId}-${r.stat}`}
                teamId={r.teamId}
                name={r.name}
                sub={text.target(r.target.toLocaleString())[lang2]}
                value={
                  ja
                    ? `あと${r.approx ? "約" : ""} ${r.remaining.toLocaleString()} ${text.unit.ja}`
                    : `${r.approx ? "~" : ""}${r.remaining.toLocaleString()} ${text.unit.en} to go`
                }
                onPress={() => onSelectPlayer(r.playerId)}
                framed
              />
            );
          })}
    </HubSection>
  );
}

type ValueMode = "best" | "worst";

/** 年俸の順位と働き（Game Score）の順位の差 */
export function ValueSection({ hub, lang, onSelectPlayer }: Props) {
  const [mode, setMode] = useState<ValueMode>("best");
  const ja = lang === "ja";
  const v = hub.value;
  if (v === undefined) return null;
  const rows = v ? v[mode] : [];
  const of = rows[0]?.of;
  return (
    <HubSection title="VALUE">
      <HubSlantedTabs
        items={[
          { id: "best", label: "BARGAINS" },
          { id: "worst", label: "OVERPAID" },
        ]}
        value={mode}
        onChange={setMode}
      />
      <Text style={styles.hint}>
        {ja
          ? `今季の年俸の順位と、Game Score（効率も含めた 1 試合の働き）の順位の差。${
              mode === "best" ? "年俸のわりに働いている（割安な）" : "年俸のわりに働けていない（割高な）"
            }選手。平均 15 分以上の選手${of ? ` ${of} 人` : ""}で比べています。`
          : `Salary rank vs Game Score rank this season — ${
              mode === "best" ? "players outplaying their pay" : "players underplaying their pay"
            }, among ${of ?? ""} players averaging 15+ minutes.`}
      </Text>
      {rows.length > 0 ? (
        <HubCellHeader
          labels={["GS"]}
          caption={ja ? "Game Score 平均 · 下は順位の差" : "Avg Game Score · rank gap below"}
          framed
        />
      ) : null}
      {rows.length === 0
        ? empty(lang)
        : rows.map((r, i) => {
            const gap = r.salaryRank - r.gameScoreRank;
            return (
              <HubRow
                key={r.playerId}
                rank={i + 1}
                teamId={r.teamId}
                name={r.name}
                sub={
                  ja
                    ? `$${r.salaryM.toFixed(1)}M · 年俸 ${r.salaryRank} 位 → 働き ${r.gameScoreRank} 位`
                    : `$${r.salaryM.toFixed(1)}M · pay #${r.salaryRank} → play #${r.gameScoreRank}`
                }
                cells={[r.gameScore.toFixed(1)]}
                valueSub={`${gap > 0 ? "+" : "−"}${Math.abs(gap)}`}
                valueSubColor={gap > 0 ? HUB_GOOD_COLOR : HUB_BAD_COLOR}
                onPress={() => onSelectPlayer(r.playerId)}
                framed
              />
            );
          })}
    </HubSection>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 6,
  },
});
