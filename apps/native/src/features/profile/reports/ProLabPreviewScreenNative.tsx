/**
 * __DEV__ — PRO LAB。
 * 曜日・時間帯・予想の変更は出さない。
 */
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { REPORT_CHROME } from "../../../../../../lib/reports/reportChrome";
import { proLabPreviewMock } from "../../../../../../lib/reports/proLabPreviewMock";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { spacing } from "../../../theme/tokens";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { BEBAS, JP_400, JP_600, OXANIUM_700 } from "./reportThemeNative";
import {
  CYAN,
  GOLD,
  ProLabCompareNative,
  ProLabHabitBarsNative,
  ProLabSplitGridNative,
  ProLabStackNative,
  ProLabTeamBarsNative,
  ProLabTrendChartNative,
  ProLabVsPickNative,
  hexToRgba,
} from "./ProLabChartsNative";

type Props = { onClose: () => void };
type WindowKey = "n10" | "n30" | "n100";

const FRAME = REPORT_CHROME.goldBorder;
const LINE = "rgba(232,198,106,0.18)";
const MUTED_CAP = "rgba(255,255,255,0.45)";

export default function ProLabPreviewScreenNative({ onClose }: Props) {
  const d = useMemo(() => proLabPreviewMock(), []);
  const chartW = Math.max(240, useWindowDimensions().width - spacing.md * 2 - 28);
  const [win, setWin] = useState<WindowKey>("n30");
  const [allTeams, setAllTeams] = useState(false);
  const ranked = d.teams.filter((t) => t.games >= 10);
  const teamRows = allTeams ? d.teams : [...ranked.slice(0, 4), ...ranked.slice(-4)];

  return (
    <MobilePageShell
      title="PRO LAB"
      eyebrow="DEV"
      subtitle="自分 vs PRO PICK。精度、クセ、相性。"
      onClose={onClose}
      appBackground
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <ProCyberBadgeNative compact />
          <View style={styles.seasonPill}>
            <Text style={styles.season}>{d.season}</Text>
          </View>
        </View>

        <Slab
          kicker="VS PRO PICK"
          title="自分 vs PRO PICK"
          caption={`同じ ${d.vsPick.games} 試合。大きな数字は、勝敗の読みが分かれたときの勝ち数。`}
        >
          <ProLabVsPickNative data={d.vsPick} />
          <Text style={styles.body}>{d.vsPick.note}</Text>
        </Slab>

        <Slab
          kicker="ACCURACY"
          title="予想精度"
          caption="ランキングと同じ3本。勝敗的中・得点王的中・1試合あたりのアップセット点。上位％は今季の全体の中での位置。"
        >
          <View style={styles.hitRow}>
            <Hit label="勝敗" value={`${(d.win.you * 100).toFixed(1)}%`} top={d.win.topPercent} hero />
            <Hit label="得点王" value={`${(d.scorer.you * 100).toFixed(1)}%`} top={d.scorer.topPercent} />
            <Hit label="アップセット" value={`${d.upset.you.toFixed(1)}`} top={d.upset.topPercent} unit="pt" />
          </View>
          <View style={[styles.subRow, { borderTopColor: LINE }]}>
            <Subk label="平均点" value={d.avgPts.you.toFixed(1)} hint={`全体 ${d.avgPts.league.toFixed(1)}`} />
            <Subk label="スコア誤差" value={d.mae.you.toFixed(1)} hint={`全体 ${d.mae.league.toFixed(1)} · 低いほどよい`} />
            <Subk label="パーフェクト" value={String(d.perfect.n)} hint={`+${d.perfect.pts} · 上位 ${d.perfect.topPercent}%`} />
          </View>
          <Text style={styles.streakLine}>
            連勝 最長 {d.streak.longest} · いま {d.streak.now} · ボーナス {d.streak.pts}pt · {d.games} 試合
          </Text>
        </Slab>

        <Slab
          kicker="TREND"
          title="成長曲線"
          caption="直近 10 / 30 / 100 試合の勝敗的中。シアンが自分。白い点線がこの期間の平均。金の点線が全体平均。塗った点は平均以上。"
        >
          <View style={styles.chips}>
            {(["n10", "n30", "n100"] as const).map((k) => {
              const on = win === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setWin(k)}
                  style={[styles.chip, on && styles.chipOn]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.chipTx, on && styles.chipTxOn]}>
                    {k === "n10" ? "直近 10" : k === "n30" ? "直近 30" : "直近 100"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <ProLabTrendChartNative points={d.trend[win]} width={chartW} leagueRate={d.win.league} />
        </Slab>

        <Slab
          kicker="VS LEAGUE"
          title="リーグ内比較"
          caption="勝敗・得点王・アップセット点・平均点・スコア誤差を、自分・全体平均・上位 10% で並べた。金の線を超えていれば今季の強み。誤差だけ低いほどよい。"
        >
          <ProLabCompareNative rows={d.compare} />
        </Slab>

        <Slab
          kicker="POINTS"
          title="獲得点の内訳"
          caption="採点どおりの内訳。基礎点は勝者 4 点＋点差の近さ＋合計の近さ。その上にアップセット・連勝・得点王・スコア完全一致。"
        >
          <ProLabStackNative items={d.breakdown} />
        </Slab>

        <Slab
          kicker="TENDENCIES"
          title="予想のクセ"
          caption="どの試合を選びやすいか（選んだ割合）。当たった率は次の SPLITS。上の棒が自分、下の棒が全体。"
        >
          <ProLabHabitBarsNative
            rows={[
              { label: "ホーム勝利予想", you: d.habits.homePick.you, league: d.habits.homePick.league },
              { label: "強豪・順当寄り", you: d.habits.chalkPick.you, league: d.habits.chalkPick.league },
              { label: "アップセット予想", you: d.habits.upsetPick.you, league: d.habits.upsetPick.league },
            ]}
          />
          <Text style={styles.body}>{d.habits.note}</Text>
        </Slab>

        <Slab
          kicker="SPLITS"
          title="条件別の勝率"
          caption="ホーム／アウェイ、順当／逆張りで、選んだ側が当たった率。金の縦線が全体平均。選びやすさ（上のクセ）とは別。"
        >
          <ProLabSplitGridNative items={d.splits} />
        </Slab>

        <Slab
          kicker="TEAMS"
          title="チーム別相性"
          caption="相手チームごとの的中率と平均獲得点。金の縦線が自分のシーズン的中。赤はそれを下回る。10 試合未満は薄い参考。"
          last
        >
          {!allTeams ? (
            <>
              <Text style={styles.group}>得意</Text>
              <ProLabTeamBarsNative teams={ranked.slice(0, 4)} baseline={d.win.you} />
              <Text style={[styles.group, styles.groupGap]}>苦手</Text>
              <ProLabTeamBarsNative teams={ranked.slice(-4)} baseline={d.win.you} />
            </>
          ) : (
            <>
              <View style={styles.teamHead}>
                <Text style={[styles.teamHeadTx, { width: 34 }]}>TEAM</Text>
                <Text style={[styles.teamHeadTx, { width: 28 }]}>G</Text>
                <Text style={[styles.teamHeadTx, { flex: 1 }]}>的中</Text>
                <Text style={[styles.teamHeadTx, { width: 36, textAlign: "right" }]}>%</Text>
                <Text style={[styles.teamHeadTx, { width: 32, textAlign: "right" }]}>点</Text>
              </View>
              <ProLabTeamBarsNative teams={teamRows} baseline={d.win.you} />
            </>
          )}
          {d.teams.length > 8 ? (
            <Pressable
              onPress={() => setAllTeams((v) => !v)}
              accessibilityRole="button"
              style={styles.more}
            >
              <Text style={styles.moreTx}>{allTeams ? "得意・苦手だけ" : `全 ${d.teams.length} チーム`}</Text>
            </Pressable>
          ) : null}
        </Slab>

        <Text style={styles.foot}>数字は仮。本番は自分の投稿と結果。</Text>
      </ScrollView>
    </MobilePageShell>
  );
}

function Slab({
  kicker,
  title,
  caption,
  last,
  children,
}: {
  kicker: string;
  title: string;
  caption: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.slab, last && styles.slabLast]}>
      <View style={styles.slabBeam} />
      <View style={styles.titleRow}>
        <Text style={styles.kicker}>{kicker}</Text>
        <View style={styles.titleLine} />
      </View>
      <Text style={styles.slabTitle}>{title}</Text>
      <Text style={styles.caption}>{caption}</Text>
      {children}
    </View>
  );
}

function Hit({
  label,
  value,
  top,
  hero,
  unit,
}: {
  label: string;
  value: string;
  top: number;
  hero?: boolean;
  unit?: string;
}) {
  return (
    <View style={[styles.hit, hero && styles.hitHero]}>
      <Text style={styles.hitLab}>{label}</Text>
      <Text style={[styles.hitVal, hero && styles.hitValHero]}>
        {value}
        {unit ? <Text style={styles.hitUnit}>{unit}</Text> : null}
      </Text>
      <View style={styles.tag}>
        <Text style={styles.tagTx}>上位 {top}%</Text>
      </View>
    </View>
  );
}

function Subk({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.subk}>
      <Text style={styles.hitLab}>{label}</Text>
      <Text style={styles.subVal}>{value}</Text>
      <Text style={styles.subHint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.md, paddingBottom: 64 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  seasonPill: {
    borderWidth: 1,
    borderColor: "rgba(232,198,106,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    transform: [{ skewX: "-12deg" }],
  },
  season: {
    fontFamily: OXANIUM_700,
    fontSize: 11,
    color: GOLD,
    letterSpacing: 0.6,
    transform: [{ skewX: "12deg" }],
  },
  slab: {
    backgroundColor: "rgba(8,8,10,0.94)",
    borderWidth: 1,
    borderColor: FRAME,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  slabLast: { marginBottom: 8 },
  slabBeam: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1.5,
    backgroundColor: GOLD,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  kicker: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 1.6,
    color: GOLD,
  },
  titleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: hexToRgba(GOLD, 0.35),
  },
  slabTitle: {
    fontFamily: JP_600,
    fontSize: 16,
    color: "#f4f7ff",
    marginBottom: 6,
  },
  caption: {
    fontFamily: JP_400,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.62)",
    marginBottom: 14,
  },
  hitRow: { flexDirection: "row", gap: 8 },
  hit: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  hitHero: {
    borderColor: "rgba(0,245,255,0.5)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  hitLab: { fontFamily: JP_600, fontSize: 11, color: "rgba(255,255,255,0.5)" },
  hitVal: { fontFamily: BEBAS, fontSize: 26, lineHeight: 28, color: "#f4f7ff", marginTop: 4 },
  hitValHero: { color: CYAN, fontSize: 30, lineHeight: 32 },
  hitUnit: { fontFamily: METRIC_FONT, fontSize: 11, color: GOLD },
  streakLine: {
    fontFamily: JP_400,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.62)",
    marginTop: 12,
  },
  tag: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderWidth: 1,
    borderColor: GOLD,
    paddingHorizontal: 6,
    paddingVertical: 2,
    transform: [{ skewX: "-12deg" }],
  },
  tagTx: {
    fontFamily: OXANIUM_700,
    fontSize: 9,
    color: GOLD,
    transform: [{ skewX: "12deg" }],
  },
  subRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  subk: { flex: 1 },
  subVal: { fontFamily: BEBAS, fontSize: 22, lineHeight: 24, color: "#f4f7ff", marginTop: 2 },
  subHint: { fontFamily: JP_400, fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2, lineHeight: 14 },
  chips: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: FRAME,
    alignSelf: "flex-start",
    overflow: "hidden",
    marginBottom: 10,
  },
  chip: { paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: GOLD },
  chipTx: { fontFamily: METRIC_FONT, fontSize: 10, letterSpacing: 0.5, color: GOLD },
  chipTxOn: { color: "#050508" },
  body: {
    fontFamily: JP_400,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.78)",
    marginTop: 8,
  },
  teamHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  teamHeadTx: { fontFamily: METRIC_FONT, fontSize: 9, letterSpacing: 0.8, color: MUTED_CAP },
  group: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 1.4,
    color: GOLD,
    marginBottom: 6,
  },
  groupGap: { marginTop: 14 },
  more: { alignSelf: "flex-start", marginTop: 10, borderWidth: 1, borderColor: FRAME, paddingHorizontal: 10, paddingVertical: 6 },
  moreTx: { fontFamily: METRIC_FONT, fontSize: 10, letterSpacing: 0.6, color: GOLD },
  foot: { fontFamily: JP_400, fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 8 },
});
