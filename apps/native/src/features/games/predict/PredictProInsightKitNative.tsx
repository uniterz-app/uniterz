/**
 * Pro Insight「予想の材料」— WINNER（勝つ確率・みんなの予想・予想点差の内訳）/ SCORING（予想スコア）/
 * TOP SCORER（得点王になる確率）/ 今季の成績。
 * 成績・欠場は STATS / INJURY タブにあるので出さない。
 * 見た目は PredictProInsightNarrativePanelNative（チップ見出し・本文）に揃える。
 */
import { Platform, StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import {
  PREDICT_KIT_RECORD_STRONG_PCT,
  type ProInsightPredictKit,
  type ProInsightPredictKitFactor,
  type ProInsightPredictKitRecord,
} from "../../../../../../lib/nba/insights/predictKit/predictKitTypes";
import { L, resolveLocalizedLang, type LocalizedLang } from "../../../../../../lib/i18n/localize";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import {
  getTeamAbbrBadgeColor,
  getTeamJerseyPrimaryColor,
  jerseyPrimariesClash,
  resolveMatchupUiAccents,
} from "../../../../../../lib/team-colors";
import ProCyberBadgeNative from "../../profile/kinetik/ProCyberBadgeNative";
import { JP_600, JP_700, OXANIUM_600, OXANIUM_700, OXANIUM_800 } from "../../profile/reports/reportThemeNative";
import { MATCH_CARD_TEAM_NAME_FONT } from "../matchCardTypography";
import { colors } from "../../../theme/tokens";
import type { GamesLanguage } from "../gamesI18n";

type Props = {
  kit: ProInsightPredictKit;
  homeTeamId: string;
  awayTeamId: string;
  language: GamesLanguage;
  /** PRO バッジと対戦カードの行（パネル内に埋め込むときは false） */
  showHeader?: boolean;
  /** UNITERZ のみんなの予想（ホームを選んだ割合 % と人数）。少ないときは出さない */
  crowd?: { homePct: number; total: number } | null;
};

const WINNER_ACCENT = "rgba(110,231,183,0.95)";
const SCORING_ACCENT = "rgba(253,230,138,0.95)";
const SCORER_ACCENT = "rgba(251,146,200,0.95)";
/** みんなの予想をこの人数以上で出す */
const CROWD_MIN_PICKS = 20;

function nickOf(teamId: string): string {
  const full = NBA_TEAM_NAME_BY_ID[teamId];
  return (full ? getMobileTeamName("nba", full) : teamId.replace(/^nba-/, "")).toUpperCase();
}

/** 通常はバッジ色。同系色の対戦だけ市場バーと同じ差し替え */
function teamColorsFor(homeTeamId: string, awayTeamId: string): { homeColor: string; awayColor: string } {
  const homeBadge = getTeamAbbrBadgeColor(homeTeamId);
  const awayBadge = getTeamAbbrBadgeColor(awayTeamId);
  if (!jerseyPrimariesClash(homeBadge, awayBadge)) return { homeColor: homeBadge, awayColor: awayBadge };
  const { homeAccent, awayAccent } = resolveMatchupUiAccents("nba", homeTeamId, awayTeamId);
  return { homeColor: homeAccent, awayColor: awayAccent };
}

/** 要因で得をするチーム（連戦・欠場は相手） */
function beneficiaryOf(f: ProInsightPredictKitFactor, homeTeamId: string, awayTeamId: string): string {
  const other = f.teamId === homeTeamId ? awayTeamId : homeTeamId;
  return f.kind === "b2b" || f.kind === "injury" ? other : f.teamId;
}

function factorLabel(f: ProInsightPredictKitFactor, lang: LocalizedLang): string {
  const nick = nickOf(f.teamId);
  switch (f.kind) {
    case "strength":
      return L(lang, { ja: "実力差", en: "Team strength" });
    case "home":
      return L(lang, { ja: "ホーム", en: "Home court" });
    case "b2b":
      return L(lang, { ja: `${nick} が連戦`, en: `${nick} on B2B` });
    case "rested":
      return L(lang, { ja: `${nick} が休養十分`, en: `${nick} well rested` });
    case "injury":
      return L(lang, { ja: `${nick} に欠場`, en: `${nick} absences` });
  }
}

function SkewText({
  children,
  style,
  skew,
}: {
  children: React.ReactNode;
  style: StyleProp<TextStyle>;
  skew: string;
}) {
  return (
    <View
      collapsable={false}
      renderToHardwareTextureAndroid
      style={[{ transform: [{ skewX: skew }] }, Platform.OS === "android" ? { opacity: 0.999 } : null]}
    >
      <Text style={style}>{children}</Text>
    </View>
  );
}

function KindChip({ label, accent }: { label: string; accent: string }) {
  return (
    <View
      collapsable={false}
      renderToHardwareTextureAndroid
      style={[styles.kindWrap, { borderColor: accent }, Platform.OS === "android" ? { opacity: 0.999 } : null]}
    >
      <Text style={[styles.kind, { color: accent }]}>{label}</Text>
    </View>
  );
}

function RecordLine({
  label,
  hits,
  games,
  lang,
}: {
  label: string;
  hits: number;
  games: number;
  lang: LocalizedLang;
}) {
  const pct = games > 0 ? Math.round((hits / games) * 100) : 0;
  return (
    <View style={styles.recordLine}>
      <Text style={styles.recordLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.recordCount}>
        {L(lang, { ja: `${hits} / ${games} 試合`, en: `${hits} / ${games}` })}
      </Text>
      <Text style={styles.recordPct}>{pct}%</Text>
    </View>
  );
}

export default function PredictProInsightKitNative({
  kit,
  homeTeamId,
  awayTeamId,
  language,
  showHeader = true,
  crowd = null,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const homeNick = nickOf(homeTeamId);
  const awayNick = nickOf(awayTeamId);
  const { homeColor, awayColor } = teamColorsFor(homeTeamId, awayTeamId);
  const colorOf = (teamId: string) => (teamId === homeTeamId ? homeColor : awayColor);
  const favoredId = kit.favoredTeamId;
  const underdogId = favoredId === homeTeamId ? awayTeamId : homeTeamId;
  const crowdFavoredPct =
    crowd && crowd.total >= CROWD_MIN_PICKS
      ? Math.round(favoredId === homeTeamId ? crowd.homePct : 100 - crowd.homePct)
      : null;
  const crowdLeadId = crowdFavoredPct != null && crowdFavoredPct < 50 ? underdogId : favoredId;
  const crowdLeadPct = crowdFavoredPct != null && crowdFavoredPct < 50 ? 100 - crowdFavoredPct : crowdFavoredPct;

  const leanWord =
    kit.lean === "clear"
      ? L(lang, { ja: "が有利", en: " favored" })
      : L(lang, { ja: "がやや有利", en: " has a slight edge" });
  const paceWord =
    kit.pace === "low"
      ? L(lang, { ja: "ロースコア寄り", en: "Low-scoring" })
      : kit.pace === "high"
        ? L(lang, { ja: "ハイスコア寄り", en: "High-scoring" })
        : L(lang, { ja: "平均並み", en: "Around average" });
  const totalVsLeague = kit.score.total - kit.score.leagueTotal;

  /** 1 点未満で省いた要因の合計（有利側から見た点）。内訳の合計を予想点差に揃える */
  const otherPts =
    Math.round(
      (kit.margin -
        kit.factors.reduce((s, f) => s + (beneficiaryOf(f, homeTeamId, awayTeamId) === favoredId ? f.pts : -f.pts), 0)) *
        10
    ) / 10;
  const breakdown = [
    ...kit.factors.map((f) => ({
      key: `${f.kind}-${f.teamId}`,
      label: factorLabel(f, lang),
      note:
        f.kind === "strength" && kit.strengthBasis === "cleanSos"
          ? L(lang, { ja: "ガベージタイム抜き・相手補正", en: "Garbage time removed · schedule-adjusted" })
          : null,
      to: beneficiaryOf(f, homeTeamId, awayTeamId),
      pts: f.pts,
    })),
    ...(otherPts !== 0
      ? [
          {
            key: "other",
            label: L(lang, { ja: "その他の小さな要因", en: "Smaller factors" }),
            note: null,
            to: otherPts > 0 ? favoredId : underdogId,
            pts: Math.abs(otherPts),
          },
        ]
      : []),
  ];

  const center = kit.score.leagueTotal;

  return (
    <View style={styles.shell}>
      {showHeader ? (
        <View style={styles.matchRow}>
          <View style={styles.proBadgeWrap}>
            <ProCyberBadgeNative premium />
          </View>
          <View style={styles.matchTeamSkew}>
            <Text
              style={[styles.matchTeam, { color: getTeamJerseyPrimaryColor("nba", homeTeamId) }]}
              numberOfLines={1}
            >
              {homeNick}
            </Text>
          </View>
          <View style={styles.matchVsSkew}>
            <Text style={styles.matchVs}>vs</Text>
          </View>
          <View style={styles.matchTeamSkew}>
            <Text
              style={[styles.matchTeam, { color: getTeamJerseyPrimaryColor("nba", awayTeamId) }]}
              numberOfLines={1}
            >
              {awayNick}
            </Text>
          </View>
        </View>
      ) : null}

      {/* WINNER */}
      <View style={[styles.section, styles.sectionBorder]}>
        <View style={styles.chipRow}>
          <KindChip label="WINNER" accent={WINNER_ACCENT} />
          <SkewText style={styles.head} skew="-4deg">
            {kit.lean === "even" ? (
              L(lang, { ja: "互角", en: "Toss-up" })
            ) : (
              <>
                <Text style={{ color: colorOf(favoredId) }}>{nickOf(favoredId)}</Text>
                {leanWord}
              </>
            )}
          </SkewText>
        </View>
        <View style={styles.winLine}>
          <SkewText style={[styles.winTeam, { color: colorOf(favoredId) }]} skew="-8deg">
            {nickOf(favoredId)}
          </SkewText>
          <Text style={styles.winCaption}>{L(lang, { ja: "の勝つ確率", en: "win chance" })}</Text>
          <Text style={[styles.winPct, { color: colorOf(favoredId) }]}>
            {kit.winPct}
            <Text style={styles.winPctUnit}>%</Text>
          </Text>
        </View>
        {crowdFavoredPct != null ? (
          <View style={styles.crowdRow}>
            <Text style={styles.crowdLabel}>{L(lang, { ja: "みんなの予想", en: "UNITERZ picks" })}</Text>
            <Text style={[styles.crowdTeam, { color: colorOf(crowdLeadId) }]}>{nickOf(crowdLeadId)}</Text>
            <Text style={[styles.crowdPct, { color: colorOf(crowdLeadId) }]}>{crowdLeadPct}%</Text>
          </View>
        ) : null}

        <View style={styles.block}>
          {breakdown.map((b) => (
            <View key={b.key} style={styles.sumRow}>
              <Text style={styles.sumLabel} numberOfLines={1}>
                {b.label}
                {b.note ? <Text style={styles.sumNote}>{`  ${b.note}`}</Text> : null}
              </Text>
              <Text style={[styles.sumTeam, { color: colorOf(b.to) }]}>{nickOf(b.to)}</Text>
              <Text style={[styles.sumValue, { color: colorOf(b.to) }]}>+{b.pts.toFixed(1)}</Text>
            </View>
          ))}
          <View style={[styles.sumRow, styles.sumTotalRow]}>
            <Text style={styles.sumTotalLabel}>{L(lang, { ja: "予想点差", en: "Projected margin" })}</Text>
            <Text style={[styles.sumTeam, styles.sumTotalTeam, { color: colorOf(favoredId) }]}>
              {nickOf(favoredId)}
            </Text>
            <Text style={[styles.sumValue, styles.sumTotalValue, { color: colorOf(favoredId) }]}>
              +{kit.margin.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* SCORING */}
      <View style={styles.section}>
        <KindChip label="SCORING" accent={SCORING_ACCENT} />
        <View style={styles.scoreLine}>
          <Text style={[styles.scoreTeam, { color: homeColor }]} numberOfLines={1}>
            {homeNick}
          </Text>
          <Text style={styles.scoreNum}>{kit.score.home}</Text>
          <Text style={styles.scoreDash}>–</Text>
          <Text style={styles.scoreNum}>{kit.score.away}</Text>
          <Text style={[styles.scoreTeam, styles.alignRight, { color: awayColor }]} numberOfLines={1}>
            {awayNick}
          </Text>
        </View>

        <View style={styles.block}>
          <View style={styles.totalHead}>
            <Text style={styles.blockCaption}>{L(lang, { ja: "合計点", en: "Total points" })}</Text>
            <Text style={styles.totalValue}>{kit.score.total}</Text>
          </View>
          <Text style={styles.paceWord}>
            {paceWord}
            <Text style={styles.paceNote}>
              {"  "}
              {totalVsLeague === 0
                ? L(lang, { ja: `リーグ平均 ${center} と同じ`, en: `same as league avg ${center}` })
                : L(lang, {
                    ja: `リーグ平均 ${center} より ${Math.abs(totalVsLeague)} 点${totalVsLeague > 0 ? "多い" : "少ない"}`,
                    en: `${Math.abs(totalVsLeague)} ${totalVsLeague > 0 ? "above" : "below"} league avg ${center}`,
                  })}
            </Text>
          </Text>
        </View>
      </View>

      {/* TOP SCORER */}
      {kit.scorers?.length ? (
        <View style={[styles.section, styles.sectionTopBorder]}>
          <View style={styles.chipRow}>
            <KindChip label="TOP SCORER" accent={SCORER_ACCENT} />
            <Text style={styles.chipNote}>
              {L(lang, { ja: "この試合で両チーム最多得点になる確率", en: "Chance to lead both teams in points" })}
            </Text>
          </View>
          <Text style={styles.scorerCaption}>
            {L(lang, {
              ja: "今季平均に、直近 5 試合・点の振れ幅・出場未定を足して計算",
              en: "Season average plus last 5 games, game-to-game swings and injury status",
            })}
          </Text>
          <View style={styles.block}>
            {kit.scorers.map((s) => (
              <View key={s.playerId} style={styles.scorerRow}>
                <SkewText style={[styles.scorerName, { color: colorOf(s.teamId) }]} skew="-8deg">
                  {s.name}
                </SkewText>
                <Text style={styles.scorerMeta} numberOfLines={1}>
                  {L(lang, { ja: `今季平均 ${s.ppg.toFixed(1)} 点`, en: `${s.ppg.toFixed(1)} PPG` })}
                  {s.doubtful ? (
                    <Text style={styles.scorerDoubt}>{L(lang, { ja: "  出場未定", en: "  questionable" })}</Text>
                  ) : null}
                </Text>
                <Text style={[styles.scorerPct, { color: colorOf(s.teamId) }]}>{s.pct}%</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {kit.record ? <PredictKitRecordNative record={kit.record} language={language} /> : null}
    </View>
  );
}

/** PRO INSIGHT の精度（今季）。Pro のカードの一番下 */
export function PredictKitRecordNative({
  record,
  language,
}: {
  record: ProInsightPredictKitRecord;
  language: GamesLanguage;
}) {
  const lang = resolveLocalizedLang(language);
  return (
    <View style={styles.recordBlock}>
      <Text style={styles.recordTitle}>
        {L(lang, { ja: "PRO PICK の精度（今季）", en: "PRO PICK accuracy (this season)" })}
      </Text>
      <Text style={styles.recordCaption}>
        {record.basis === "backtest"
          ? L(lang, {
              ja: `今季 ${record.games} 試合で検証`,
              en: `Tested on ${record.games} games this season`,
            })
          : L(lang, {
              ja: "終わった試合で予想が当たった割合",
              en: "How often the picks were right in finished games",
            })}
      </Text>
      <RecordLine
        label={L(lang, { ja: "勝つチームを当てた", en: "Picked the winner" })}
        hits={record.hits}
        games={record.games}
        lang={lang}
      />
      {record.strongGames ? (
        <RecordLine
          label={L(lang, {
            ja: `勝つ確率 ${PREDICT_KIT_RECORD_STRONG_PCT}% 以上の試合だけ`,
            en: `Only games at ${PREDICT_KIT_RECORD_STRONG_PCT}%+`,
          })}
          hits={record.strongHits}
          games={record.strongGames}
          lang={lang}
        />
      ) : null}
      {record.scorerGames ? (
        <RecordLine
          label={L(lang, { ja: "得点王を当てた（一番上の選手）", en: "Picked the top scorer" })}
          hits={record.scorerHits}
          games={record.scorerGames}
          lang={lang}
        />
      ) : null}
    </View>
  );
}

const ACCURACY_ACCENT = colors.accentCyan;
const ACCURACY_SEGMENTS = 20;

/** 割合をメモリのバーで（5% で 1 マス） */
function AccuracyBar({ pct, tall }: { pct: number; tall: boolean }) {
  const filled = Math.round((pct / 100) * ACCURACY_SEGMENTS);
  return (
    <View style={styles.accBar}>
      {Array.from({ length: ACCURACY_SEGMENTS }, (_, i) => (
        <View
          key={i}
          style={[
            styles.accSeg,
            tall ? styles.accSegTall : null,
            i < filled ? (tall ? styles.accSegOn : styles.accSegOnSub) : null,
          ]}
        />
      ))}
    </View>
  );
}

/** 無料のゲート用: PRO INSIGHT の精度（勝つチームを主役に、ほか 2 つを下に） */
export function PredictKitAccuracyHeroNative({
  record,
  language,
}: {
  record: ProInsightPredictKitRecord;
  language: GamesLanguage;
}) {
  const lang = resolveLocalizedLang(language);
  const pct = (h: number, g: number) => (g > 0 ? Math.round((h / g) * 100) : 0);
  const rows = [
    {
      key: "winner",
      main: true,
      label: L(lang, { ja: "勝つチームを当てた", en: "Picked the winner" }),
      hits: record.hits,
      games: record.games,
    },
    ...(record.strongGames
      ? [
          {
            key: "strong",
            main: false,
            label: L(lang, {
              ja: `勝つ確率 ${PREDICT_KIT_RECORD_STRONG_PCT}% 以上の試合`,
              en: `Games at ${PREDICT_KIT_RECORD_STRONG_PCT}%+`,
            }),
            hits: record.strongHits,
            games: record.strongGames,
          },
        ]
      : []),
    ...(record.scorerGames
      ? [
          {
            key: "scorer",
            main: false,
            label: L(lang, { ja: "得点王を当てた", en: "Picked the top scorer" }),
            hits: record.scorerHits,
            games: record.scorerGames,
          },
        ]
      : []),
  ];

  return (
    <View style={styles.accWrap}>
      <View style={styles.chipRow}>
        <KindChip label="ACCURACY" accent={ACCURACY_ACCENT} />
        <Text style={styles.chipNote}>
          {record.basis === "backtest"
            ? L(lang, {
                ja: `PRO PICK の精度・今季 ${record.games} 試合で検証`,
                en: `PRO PICK · tested on ${record.games} games this season`,
              })
            : L(lang, {
                ja: `PRO PICK の精度・今季 ${record.games} 試合`,
                en: `PRO PICK · ${record.games} games this season`,
              })}
        </Text>
      </View>

      {rows.map((r) => {
        const p = pct(r.hits, r.games);
        return (
          <View key={r.key} style={r.main ? styles.accRowMain : styles.accRow}>
            <View style={styles.accHead}>
              <Text style={r.main ? styles.accLabelMain : styles.accLabel} numberOfLines={1}>
                {r.label}
              </Text>
              <Text style={styles.accCount}>
                {r.hits}/{r.games}
              </Text>
              <Text style={r.main ? styles.accPctMain : styles.accPct}>
                {p}
                <Text style={r.main ? styles.accPctUnitMain : styles.accPctUnit}>%</Text>
              </Text>
            </View>
            <AccuracyBar pct={p} tall={r.main} />
          </View>
        );
      })}
    </View>
  );
}

function Mask({ width, height = 12 }: { width: number; height?: number }) {
  return <View style={[styles.mask, { width, height }]} />;
}

/**
 * 無料向け: この試合の PRO INSIGHT と同じ形で、中身を伏せた版。
 * 予想の中身はクライアントに来ないので、チーム名とみんなの予想（公開情報）以外は伏せ字のバーだけ。
 */
export function PredictProInsightKitMaskedNative({
  homeTeamId,
  awayTeamId,
  language,
  crowd = null,
}: {
  homeTeamId: string;
  awayTeamId: string;
  language: GamesLanguage;
  crowd?: { homePct: number; total: number } | null;
}) {
  const lang = resolveLocalizedLang(language);
  const homeNick = nickOf(homeTeamId);
  const awayNick = nickOf(awayTeamId);
  const { homeColor, awayColor } = teamColorsFor(homeTeamId, awayTeamId);
  const crowdLeadHome = crowd ? crowd.homePct >= 50 : true;
  const crowdLeadPct = crowd
    ? Math.round(crowdLeadHome ? crowd.homePct : 100 - crowd.homePct)
    : null;
  const showCrowd = crowd != null && crowd.total >= CROWD_MIN_PICKS;
  const rows = [
    L(lang, { ja: "実力差", en: "Team strength" }),
    L(lang, { ja: "ホーム", en: "Home court" }),
    L(lang, { ja: "連戦・休養", en: "Rest" }),
    L(lang, { ja: "欠場", en: "Absences" }),
  ];

  return (
    <View style={styles.shell}>
      <View style={styles.matchRow}>
        <View style={styles.proBadgeWrap}>
          <ProCyberBadgeNative premium />
        </View>
        <View style={styles.matchTeamSkew}>
          <Text style={[styles.matchTeam, { color: getTeamJerseyPrimaryColor("nba", homeTeamId) }]} numberOfLines={1}>
            {homeNick}
          </Text>
        </View>
        <View style={styles.matchVsSkew}>
          <Text style={styles.matchVs}>vs</Text>
        </View>
        <View style={styles.matchTeamSkew}>
          <Text style={[styles.matchTeam, { color: getTeamJerseyPrimaryColor("nba", awayTeamId) }]} numberOfLines={1}>
            {awayNick}
          </Text>
        </View>
      </View>

      <View style={[styles.section, styles.sectionBorder]}>
        <View style={styles.chipRow}>
          <KindChip label="WINNER" accent={WINNER_ACCENT} />
          <Mask width={110} height={14} />
        </View>
        <View style={styles.winLine}>
          <Mask width={96} height={18} />
          <Text style={styles.winCaption}>{L(lang, { ja: "の勝つ確率", en: "win chance" })}</Text>
          <View style={styles.maskPush} />
          <Mask width={60} height={26} />
        </View>
        {showCrowd ? (
          <View style={styles.crowdRow}>
            <Text style={styles.crowdLabel}>{L(lang, { ja: "みんなの予想", en: "UNITERZ picks" })}</Text>
            <Text style={[styles.crowdTeam, { color: crowdLeadHome ? homeColor : awayColor }]}>
              {crowdLeadHome ? homeNick : awayNick}
            </Text>
            <Text style={[styles.crowdPct, { color: crowdLeadHome ? homeColor : awayColor }]}>{crowdLeadPct}%</Text>
          </View>
        ) : null}
        <View style={styles.block}>
          {rows.map((label) => (
            <View key={label} style={styles.sumRow}>
              <Text style={styles.sumLabel} numberOfLines={1}>
                {label}
              </Text>
              <Mask width={64} />
              <Mask width={38} />
            </View>
          ))}
          <View style={[styles.sumRow, styles.sumTotalRow]}>
            <Text style={styles.sumTotalLabel}>{L(lang, { ja: "予想点差", en: "Projected margin" })}</Text>
            <Mask width={64} height={14} />
            <Mask width={44} height={14} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <KindChip label="SCORING" accent={SCORING_ACCENT} />
        <View style={styles.scoreLine}>
          <Text style={[styles.scoreTeam, { color: homeColor }]} numberOfLines={1}>
            {homeNick}
          </Text>
          <Mask width={46} height={22} />
          <Text style={styles.scoreDash}>–</Text>
          <Mask width={46} height={22} />
          <Text style={[styles.scoreTeam, styles.alignRight, { color: awayColor }]} numberOfLines={1}>
            {awayNick}
          </Text>
        </View>
        <View style={styles.block}>
          <View style={styles.totalHead}>
            <Text style={styles.blockCaption}>{L(lang, { ja: "合計点", en: "Total points" })}</Text>
            <Mask width={40} height={16} />
          </View>
          <Mask width={180} />
        </View>
      </View>

      <View style={[styles.section, styles.sectionTopBorder]}>
        <View style={styles.chipRow}>
          <KindChip label="TOP SCORER" accent={SCORER_ACCENT} />
          <Text style={styles.chipNote}>
            {L(lang, { ja: "この試合で両チーム最多得点になる確率", en: "Chance to lead both teams in points" })}
          </Text>
        </View>
        <View style={styles.block}>
          {[120, 104, 92].map((w) => (
            <View key={w} style={styles.scorerRow}>
              <Mask width={w} height={14} />
              <View style={styles.maskPush} />
              <Mask width={40} height={16} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.maskFoot}>
        <Text style={styles.maskFootText}>
          {L(lang, { ja: "この試合の予想は PRO で表示されます", en: "This game's picks unlock with PRO" })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: "#050508",
    borderWidth: 1,
    borderColor: "rgba(212,175,90,0.35)",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 0,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  proBadgeWrap: {
    flexShrink: 0,
    transform: [{ scale: 0.92 }],
  },
  matchTeamSkew: {
    flexShrink: 1,
    maxWidth: "42%",
    transform: [{ skewX: "-8deg" }],
  },
  matchTeam: {
    flexShrink: 1,
    fontFamily: MATCH_CARD_TEAM_NAME_FONT,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  matchVsSkew: {
    flexShrink: 0,
    transform: [{ skewX: "-8deg" }],
  },
  matchVs: {
    flexShrink: 0,
    fontFamily: OXANIUM_600,
    fontSize: 11,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.45)",
    textTransform: "lowercase",
  },
  section: {
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  sectionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sectionTopBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  chipNote: {
    fontFamily: JP_600,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  crowdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -2,
    marginBottom: 4,
  },
  crowdLabel: {
    flex: 1,
    fontFamily: JP_600,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  crowdTeam: {
    fontFamily: OXANIUM_700,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  crowdPct: {
    minWidth: 48,
    textAlign: "right",
    fontFamily: OXANIUM_800,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  scorerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scorerName: {
    fontFamily: MATCH_CARD_TEAM_NAME_FONT,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  scorerMeta: {
    flex: 1,
    fontFamily: JP_600,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  scorerDoubt: {
    color: "rgba(251,191,36,0.9)",
  },
  scorerPct: {
    minWidth: 48,
    textAlign: "right",
    fontFamily: OXANIUM_800,
    fontSize: 17,
    fontVariant: ["tabular-nums"],
  },
  scorerCaption: {
    fontFamily: JP_600,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.4)",
    marginTop: -4,
  },
  recordBlock: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    gap: 4,
  },
  accWrap: {
    alignSelf: "stretch",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  accRowMain: {
    gap: 6,
  },
  accRow: {
    gap: 5,
  },
  accHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  accLabelMain: {
    flex: 1,
    fontFamily: JP_700,
    fontSize: 14,
    color: "#fff",
  },
  accLabel: {
    flex: 1,
    fontFamily: JP_600,
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
  },
  accCount: {
    fontFamily: OXANIUM_600,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontVariant: ["tabular-nums"],
  },
  accPctMain: {
    minWidth: 64,
    textAlign: "right",
    fontFamily: OXANIUM_800,
    fontSize: 30,
    lineHeight: 34,
    color: ACCURACY_ACCENT,
    fontVariant: ["tabular-nums"],
  },
  accPctUnitMain: {
    fontSize: 15,
  },
  accPct: {
    minWidth: 64,
    textAlign: "right",
    fontFamily: OXANIUM_800,
    fontSize: 17,
    color: "rgba(255,255,255,0.9)",
    fontVariant: ["tabular-nums"],
  },
  accPctUnit: {
    fontSize: 11,
  },
  accBar: {
    flexDirection: "row",
    gap: 2,
  },
  accSeg: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ skewX: "-14deg" }],
  },
  accSegTall: {
    height: 8,
  },
  accSegOn: {
    backgroundColor: ACCURACY_ACCENT,
  },
  accSegOnSub: {
    backgroundColor: "rgba(34,211,238,0.55)",
  },
  mask: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
  },
  maskPush: {
    flex: 1,
  },
  maskFoot: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    alignItems: "center",
  },
  maskFootText: {
    fontFamily: JP_600,
    fontSize: 11,
    color: "rgba(253,186,116,0.85)",
  },
  recordTitle: {
    fontFamily: JP_700,
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },
  recordCaption: {
    fontFamily: JP_600,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.4)",
    marginTop: -2,
    marginBottom: 2,
  },
  recordLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordLabel: {
    flex: 1,
    fontFamily: JP_600,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  recordCount: {
    fontFamily: JP_600,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontVariant: ["tabular-nums"],
  },
  recordPct: {
    minWidth: 40,
    textAlign: "right",
    fontFamily: OXANIUM_700,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontVariant: ["tabular-nums"],
  },
  kindWrap: {
    alignSelf: "flex-start",
    backgroundColor: "#000",
    borderWidth: 1,
    borderRadius: 0,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ skewX: "-6deg" }],
  },
  kind: {
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    includeFontPadding: false,
    /** 枠の skew を相殺して字形の潰れを防ぐ */
    transform: [{ skewX: "6deg" }],
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  head: {
    fontFamily: JP_700,
    fontSize: 14,
    lineHeight: 19,
    color: "#FFFFFF",
  },
  block: {
    gap: 3,
  },
  blockCaption: {
    fontFamily: JP_600,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.55)",
  },
  winLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  winTeam: {
    fontFamily: MATCH_CARD_TEAM_NAME_FONT,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  winCaption: {
    flex: 1,
    fontFamily: JP_600,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  winPct: {
    fontFamily: OXANIUM_800,
    fontSize: 28,
    lineHeight: 32,
    fontVariant: ["tabular-nums"],
  },
  winPctUnit: {
    fontFamily: OXANIUM_700,
    fontSize: 15,
  },
  alignRight: {
    textAlign: "right",
  },
  sumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sumLabel: {
    flex: 1,
    fontFamily: JP_600,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.82)",
  },
  sumNote: {
    fontFamily: JP_600,
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
  },
  sumTeam: {
    fontFamily: OXANIUM_700,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  sumValue: {
    minWidth: 48,
    textAlign: "right",
    fontFamily: OXANIUM_800,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  sumTotalRow: {
    marginTop: 3,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
  },
  sumTotalLabel: {
    flex: 1,
    fontFamily: JP_700,
    fontSize: 14,
    lineHeight: 19,
    color: "#FFFFFF",
  },
  sumTotalTeam: {
    fontSize: 12,
  },
  sumTotalValue: {
    fontSize: 18,
  },
  scoreLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreTeam: {
    flex: 1,
    fontFamily: OXANIUM_800,
    fontSize: 12,
    letterSpacing: 1,
  },
  scoreNum: {
    fontFamily: OXANIUM_800,
    fontSize: 24,
    lineHeight: 28,
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
  },
  scoreDash: {
    fontFamily: OXANIUM_600,
    fontSize: 15,
    color: "rgba(255,255,255,0.4)",
  },
  totalHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  totalValue: {
    fontFamily: OXANIUM_800,
    fontSize: 16,
    color: SCORING_ACCENT,
    fontVariant: ["tabular-nums"],
  },
  paceWord: {
    fontFamily: JP_700,
    fontSize: 13,
    lineHeight: 18,
    color: "#FFFFFF",
  },
  paceNote: {
    fontFamily: JP_600,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
});
