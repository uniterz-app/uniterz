/**
 * CONTEXT ファクト（試合全体 → cap 2）。
 * 直近相手強度・連勝の質・会場連勝・点差プロファイル・対勝率帯・last10/クラッチ。
 * multi_out / 単独連勝連敗は出さない。空セクション可。
 */
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { findTeamRow } from "@/lib/nba/insights/rankTeamMetrics";
import {
  formatWl,
  wlTotal,
  type NbaTeamSeasonRecordsBundle,
  type WlRecord,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import type { SchedulePriorGame } from "@/lib/nba/insights/proInsightFacts/buildScheduleFacts";
import {
  attachStreakOppQuality,
  deriveTeamFormFromPriors,
  type DerivedTeamForm,
} from "@/lib/nba/insights/proInsightFacts/deriveContextFormFromPriors";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";
import type { ProInsightFact } from "@/lib/nba/insights/proInsightFacts/types";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import type { NbaTeamShapeRecordsBundle } from "@/lib/nba/teamShapes/teamShapeTypes";
import {
  formatShapeEdgeHintEn,
  selectTeamShapeEdges,
} from "@/lib/nba/teamShapes/selectTeamShapeEdges";

/** @deprecated 配線は prior から derive。テスト用 override のみ */
export type TeamStreakFactInput = {
  teamId: string;
  kind: "W" | "L";
  count: number;
};

const SOS_HARD = 0.55;
const SOS_SOFT = 0.45;
const STREAK_MIN = 3;
const VENUE_STREAK_MIN = 3;
const STREAK_TOUGH = 0.52;
const STREAK_FARM = 0.42;
const MARGIN_MIN_SAMPLE = 4;
const CLUTCH_DELTA_MIN = 3;
const THREE_HOT_DELTA = 0.04;
const THREE_HOT_ABS = 0.38;
const RATING_DELTA_MIN = 3;
const CONF_TOP6 = 6;

function abbr(teamId: string): string {
  return proInsightTeamAbbr(teamId);
}

function pct1(n: number): string {
  return (Math.round(n * 1000) / 1000).toString();
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** ingest の recentOppWinPcts は oldest→newest。streak 用は newest-first */
function newestFirstPcts(oldestFirst: number[]): number[] {
  return [...oldestFirst].reverse();
}

function formFor(
  teamId: string,
  priors: SchedulePriorGame[],
  recentOppWinPctsOldestFirst: number[]
): DerivedTeamForm {
  const base = deriveTeamFormFromPriors({ teamId, priorGames: priors });
  return attachStreakOppQuality(
    base,
    newestFirstPcts(recentOppWinPctsOldestFirst)
  );
}

function extremeWl(r: WlRecord, minGames: number): boolean {
  if (wlTotal(r) < minGames) return false;
  const pct = r.wins / wlTotal(r);
  return pct >= 0.65 || pct <= 0.35 || Math.abs(r.wins - r.losses) >= 3;
}

function majority(part: number, whole: number): boolean {
  return whole >= 2 && part * 2 > whole;
}

function sosFacts(input: {
  teamId: string;
  recentOppWinPcts: number[];
  form: DerivedTeamForm;
}): ProInsightFact[] {
  const pcts = input.recentOppWinPcts;
  if (pcts.length < 2) return [];
  const a = avg(pcts);
  if (a == null) return [];
  const rounded = Math.round(a * 1000) / 1000;
  const nick = abbr(input.teamId);
  const onLoss =
    input.form.streakKind === "L" && input.form.streakCount >= STREAK_MIN;

  if (a >= SOS_HARD) {
    return [
      {
        id: `ctx:hardSos:${input.teamId}`,
        section: "CONTEXT",
        kind: "recent_sos_hard",
        score: onLoss ? 21 : 20,
        teamIds: [input.teamId],
        label: "HARD_SOS",
        metrics: [
          {
            key: "recentOppWinPctAvg",
            value: pct1(rounded),
            teamId: input.teamId,
          },
          { key: "sample", value: String(pcts.length), teamId: input.teamId },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`sos:${input.teamId}`, `form:${input.teamId}`],
        hintEn: onLoss
          ? `${nick} on a losing streak but recent opponents avg win% ${pct1(rounded)} (hard schedule).`
          : `${nick} recent opponents avg win% ${pct1(rounded)} (hard schedule).`,
      },
    ];
  }
  if (a <= SOS_SOFT) {
    return [
      {
        id: `ctx:softSos:${input.teamId}`,
        section: "CONTEXT",
        kind: "recent_sos_soft",
        score: 11,
        teamIds: [input.teamId],
        label: "SOFT_SOS",
        metrics: [
          {
            key: "recentOppWinPctAvg",
            value: pct1(rounded),
            teamId: input.teamId,
          },
          { key: "sample", value: String(pcts.length), teamId: input.teamId },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`sos:${input.teamId}`],
        hintEn: `${nick} recent opponents avg win% ${pct1(rounded)} (soft schedule).`,
      },
    ];
  }
  return [];
}

function streakVsQualityFact(input: {
  teamId: string;
  form: DerivedTeamForm;
}): ProInsightFact | null {
  const { form } = input;
  if (form.streakKind == null || form.streakCount < STREAK_MIN) return null;
  if (form.streakOppWinPctAvg == null) return null;
  const opp = form.streakOppWinPctAvg;
  let quality: "tough" | "weak" | null = null;
  if (opp >= STREAK_TOUGH) quality = "tough";
  else if (opp <= STREAK_FARM) quality = "weak";
  if (!quality) return null;

  const nick = abbr(input.teamId);
  const isWin = form.streakKind === "W";
  const score =
    quality === "tough" ? (isWin ? 19 : 19) : isWin ? 14 : 16;
  const reading =
    isWin && quality === "tough"
      ? "winning through a tough slate"
      : isWin && quality === "weak"
        ? "winning against softer foes"
        : !isWin && quality === "tough"
          ? "losing through a tough slate"
          : "losing against softer foes";

  return {
    id: `ctx:streakQ:${input.teamId}`,
    section: "CONTEXT",
    kind: "streak_vs_quality",
    score,
    teamIds: [input.teamId],
    label: "STREAK_VS_QUALITY",
    metrics: [
      {
        key: "streak",
        value: `${form.streakKind}${form.streakCount}`,
        teamId: input.teamId,
      },
      {
        key: "streakOppWinPctAvg",
        value: pct1(opp),
        teamId: input.teamId,
      },
      { key: "quality", value: quality, teamId: input.teamId },
    ],
    players: [],
    mode: "neutral",
    dedupeKeys: [`streak:${input.teamId}`, `form:${input.teamId}`],
    hintEn: `${nick} on a ${form.streakCount}-game ${isWin ? "win" : "loss"} streak — ${reading} (opp avg win% ${pct1(opp)}).`,
  };
}

function venueStreakFact(input: {
  teamId: string;
  isHomeTonight: boolean;
  form: DerivedTeamForm;
}): ProInsightFact | null {
  const { form, isHomeTonight } = input;
  const nick = abbr(input.teamId);
  if (isHomeTonight) {
    if (form.homeWinStreak >= VENUE_STREAK_MIN) {
      return {
        id: `ctx:homeW:${input.teamId}`,
        section: "CONTEXT",
        kind: "home_win_streak",
        score: 18,
        teamIds: [input.teamId],
        label: "HOME_WIN_STREAK",
        metrics: [
          {
            key: "homeWinStreak",
            value: String(form.homeWinStreak),
            teamId: input.teamId,
          },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`venue_streak:${input.teamId}`, `streak:${input.teamId}`],
        hintEn: `${nick} on a ${form.homeWinStreak}-game home win streak.`,
      };
    }
    if (form.homeLossStreak >= VENUE_STREAK_MIN) {
      return {
        id: `ctx:homeL:${input.teamId}`,
        section: "CONTEXT",
        kind: "home_loss_streak",
        score: 17,
        teamIds: [input.teamId],
        label: "HOME_LOSS_STREAK",
        metrics: [
          {
            key: "homeLossStreak",
            value: String(form.homeLossStreak),
            teamId: input.teamId,
          },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`venue_streak:${input.teamId}`, `streak:${input.teamId}`],
        hintEn: `${nick} on a ${form.homeLossStreak}-game home losing streak.`,
      };
    }
  } else {
    if (form.awayWinStreak >= VENUE_STREAK_MIN) {
      return {
        id: `ctx:awayW:${input.teamId}`,
        section: "CONTEXT",
        kind: "away_win_streak",
        score: 18,
        teamIds: [input.teamId],
        label: "AWAY_WIN_STREAK",
        metrics: [
          {
            key: "awayWinStreak",
            value: String(form.awayWinStreak),
            teamId: input.teamId,
          },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`venue_streak:${input.teamId}`, `streak:${input.teamId}`],
        hintEn: `${nick} on a ${form.awayWinStreak}-game road win streak.`,
      };
    }
    if (form.awayLossStreak >= VENUE_STREAK_MIN) {
      return {
        id: `ctx:awayL:${input.teamId}`,
        section: "CONTEXT",
        kind: "away_loss_streak",
        score: 17,
        teamIds: [input.teamId],
        label: "AWAY_LOSS_STREAK",
        metrics: [
          {
            key: "awayLossStreak",
            value: String(form.awayLossStreak),
            teamId: input.teamId,
          },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`venue_streak:${input.teamId}`, `streak:${input.teamId}`],
        hintEn: `${nick} on a ${form.awayLossStreak}-game road losing streak.`,
      };
    }
  }
  return null;
}

function marginProfileFact(input: {
  teamId: string;
  form: DerivedTeamForm;
}): ProInsightFact | null {
  const m = input.form.margin;
  if (m.sample < MARGIN_MIN_SAMPLE) return null;
  const nick = abbr(input.teamId);

  type Profile =
    | "close_wins"
    | "blowout_wins"
    | "close_losses"
    | "blowout_losses";
  let profile: Profile | null = null;
  let score = 0;
  let hint = "";

  if (majority(m.closeWins, m.wins) && m.closeWins >= 2) {
    profile = "close_wins";
    score = 17;
    hint = `${nick} recent wins are mostly close (≤5 pts): ${m.closeWins}/${m.wins} wins in last ${m.sample}.`;
  } else if (majority(m.blowoutWins, m.wins) && m.blowoutWins >= 2) {
    profile = "blowout_wins";
    score = 16;
    hint = `${nick} recent wins are mostly blowouts (≥15 pts): ${m.blowoutWins}/${m.wins} wins in last ${m.sample}.`;
  } else if (majority(m.closeLosses, m.losses) && m.closeLosses >= 2) {
    profile = "close_losses";
    score = 17;
    hint = `${nick} recent losses are mostly close (≤5 pts): ${m.closeLosses}/${m.losses} losses in last ${m.sample}.`;
  } else if (majority(m.blowoutLosses, m.losses) && m.blowoutLosses >= 2) {
    profile = "blowout_losses";
    score = 16;
    hint = `${nick} recent losses are mostly blowouts (≥15 pts): ${m.blowoutLosses}/${m.losses} losses in last ${m.sample}.`;
  }
  if (!profile) return null;

  return {
    id: `ctx:margin:${input.teamId}:${profile}`,
    section: "CONTEXT",
    kind: "recent_margin_profile",
    score,
    teamIds: [input.teamId],
    label: "MARGIN_PROFILE",
    metrics: [
      { key: "profile", value: profile, teamId: input.teamId },
      { key: "sample", value: String(m.sample), teamId: input.teamId },
      { key: "wins", value: String(m.wins), teamId: input.teamId },
      { key: "losses", value: String(m.losses), teamId: input.teamId },
      { key: "closeWins", value: String(m.closeWins), teamId: input.teamId },
      {
        key: "blowoutWins",
        value: String(m.blowoutWins),
        teamId: input.teamId,
      },
      {
        key: "closeLosses",
        value: String(m.closeLosses),
        teamId: input.teamId,
      },
      {
        key: "blowoutLosses",
        value: String(m.blowoutLosses),
        teamId: input.teamId,
      },
    ],
    players: [],
    mode: "neutral",
    dedupeKeys: [`margin:${input.teamId}`, `form:${input.teamId}`],
    hintEn: hint,
  };
}

function vsBandFacts(input: {
  teamId: string;
  opponentTeamId: string;
  opponentConfRank: number | null;
  opponentWinPct: number | null;
  records: NbaTeamSeasonRecordsBundle | null | undefined;
  phase: ProBriefPhase;
  isHome: boolean;
}): ProInsightFact[] {
  const split = input.records?.teams[input.teamId];
  if (!split) return [];
  const nick = abbr(input.teamId);
  const oppNick = abbr(input.opponentTeamId);
  const minGames = input.phase === "opening" ? 8 : 4;
  const out: ProInsightFact[] = [];

  const oppIsTop6 =
    input.opponentConfRank != null &&
    input.opponentConfRank >= 1 &&
    input.opponentConfRank <= CONF_TOP6;

  if (oppIsTop6) {
    const venue = input.isHome ? split.vsConfTop6Home : split.vsConfTop6Away;
    const top =
      venue && wlTotal(venue) >= 2 ? venue : split.vsConfTop6;
    if (top && extremeWl(top, minGames === 8 ? 4 : 2)) {
      out.push({
        id: `ctx:vsTop:${input.teamId}`,
        section: "CONTEXT",
        kind: "vs_band_top6",
        score: 16,
        teamIds: [input.teamId],
        label: "VS_BAND_TOP6",
        metrics: [
          {
            key: "vsConfTop6",
            value: formatWl(top),
            teamId: input.teamId,
          },
          {
            key: "oppConfRank",
            value: String(input.opponentConfRank),
            teamId: input.opponentTeamId,
          },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`vs_band:${input.teamId}`],
        hintEn: `${nick} vs conf top-6: ${formatWl(top)} (tonight vs ${oppNick}, conf #${input.opponentConfRank}).`,
      });
      return out;
    }
  }

  const oppPct = input.opponentWinPct;
  if (oppPct == null) return out;

  if (oppPct < 0.5) {
    const under = split.vsUnder500;
    if (under && extremeWl(under, minGames)) {
      out.push({
        id: `ctx:vsUnder:${input.teamId}`,
        section: "CONTEXT",
        kind: "vs_band_under500",
        score: 15,
        teamIds: [input.teamId],
        label: "VS_BAND_UNDER_500",
        metrics: [
          {
            key: "vsUnder500",
            value: formatWl(under),
            teamId: input.teamId,
          },
          {
            key: "oppWinPct",
            value: pct1(oppPct),
            teamId: input.opponentTeamId,
          },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`vs_band:${input.teamId}`],
        hintEn: `${nick} vs sub-.500: ${formatWl(under)} (tonight opp win% ${pct1(oppPct)}).`,
      });
    }
  } else if (!oppIsTop6) {
    const over = split.vsOver500;
    if (over && extremeWl(over, minGames)) {
      out.push({
        id: `ctx:vsOver:${input.teamId}`,
        section: "CONTEXT",
        kind: "vs_band_over500",
        score: 12,
        teamIds: [input.teamId],
        label: "VS_BAND_OVER_500",
        metrics: [
          {
            key: "vsOver500",
            value: formatWl(over),
            teamId: input.teamId,
          },
          {
            key: "oppWinPct",
            value: pct1(oppPct),
            teamId: input.opponentTeamId,
          },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`vs_band:${input.teamId}`],
        hintEn: `${nick} vs .500+: ${formatWl(over)} (tonight opp win% ${pct1(oppPct)}).`,
      });
    }
  }

  return out;
}

function hasUsableLast10Rating(row: NbaLeagueTeamStatRow): boolean {
  return (
    typeof row.ortg === "number" &&
    typeof row.drtg === "number" &&
    typeof row.netrtg === "number" &&
    row.ortg >= 80 &&
    row.drtg >= 80
  );
}

function ratingTiltFacts(
  teamId: string,
  seasonRow: NbaLeagueTeamStatRow | null,
  last10Row: NbaLeagueTeamStatRow | null
): ProInsightFact[] {
  if (!seasonRow || !last10Row) return [];
  if (!hasUsableLast10Rating(last10Row)) return [];
  if (
    typeof seasonRow.ortg !== "number" ||
    seasonRow.ortg < 80 ||
    typeof seasonRow.drtg !== "number" ||
    seasonRow.drtg < 80
  ) {
    return [];
  }
  const nick = abbr(teamId);
  const out: ProInsightFact[] = [];

  const pushTilt = (
    kindSuffix: string,
    metricKey: string,
    season: number,
    last10: number,
    higherIsBetter: boolean
  ) => {
    const delta = Math.round((last10 - season) * 10) / 10;
    if (Math.abs(delta) < RATING_DELTA_MIN) return;
    const improved = higherIsBetter ? delta > 0 : delta < 0;
    const label =
      metricKey === "ortg"
        ? improved
          ? "offense heating up"
          : "offense cooling"
        : metricKey === "drtg"
          ? improved
            ? "defense tightening"
            : "defense slipping"
          : improved
            ? "NET tilting up"
            : "NET tilting down";
    out.push({
      id: `ctx:tilt:${kindSuffix}:${teamId}`,
      section: "CONTEXT",
      kind: "rating_last10_tilt",
      score: 14 + Math.min(Math.abs(delta), 6),
      teamIds: [teamId],
      label: "RATING_LAST10_TILT",
      metrics: [
        { key: `season${metricKey}`, value: String(season), teamId },
        { key: `last10${metricKey}`, value: String(last10), teamId },
        { key: `${metricKey}Delta`, value: String(delta), teamId },
      ],
      players: [],
      mode: "neutral",
      dedupeKeys: [`rating_tilt:${teamId}`, `tilt:${metricKey}:${teamId}`],
      hintEn: `${nick} last-10 ${metricKey.toUpperCase()} ${last10} vs season ${season} (Δ ${delta}) — ${label}.`,
    });
  };

  if (
    typeof seasonRow.netrtg === "number" &&
    typeof last10Row.netrtg === "number"
  ) {
    pushTilt("net", "net", seasonRow.netrtg, last10Row.netrtg, true);
  }
  if (typeof seasonRow.ortg === "number" && typeof last10Row.ortg === "number") {
    pushTilt("ortg", "ortg", seasonRow.ortg, last10Row.ortg, true);
  }
  if (typeof seasonRow.drtg === "number" && typeof last10Row.drtg === "number") {
    pushTilt("drtg", "drtg", seasonRow.drtg, last10Row.drtg, false);
  }

  // 同一チームは最強の1本だけ
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, 1);
}

function clutchFormFact(
  teamId: string,
  seasonRow: NbaLeagueTeamStatRow | null
): ProInsightFact | null {
  if (!seasonRow) return null;
  const clutch = seasonRow.clutchNet;
  const seasonNet = seasonRow.netrtg;
  if (
    typeof clutch !== "number" ||
    typeof seasonNet !== "number" ||
    !Number.isFinite(clutch) ||
    !Number.isFinite(seasonNet)
  ) {
    return null;
  }
  const delta = Math.round((clutch - seasonNet) * 10) / 10;
  if (Math.abs(delta) < CLUTCH_DELTA_MIN) return null;
  const nick = abbr(teamId);
  const better = delta > 0;
  return {
    id: `ctx:clutch:${teamId}`,
    section: "CONTEXT",
    kind: "clutch_form",
    score: 13,
    teamIds: [teamId],
    label: "CLUTCH_FORM",
    metrics: [
      { key: "clutchNet", value: String(clutch), teamId },
      { key: "seasonNet", value: String(seasonNet), teamId },
      { key: "clutchDelta", value: String(delta), teamId },
    ],
    players: [],
    mode: "neutral",
    dedupeKeys: [`clutch:${teamId}`],
    hintEn: better
      ? `${nick} clutch NET ${clutch} vs season NET ${seasonNet} (Δ ${delta}) — stronger in the clutch.`
      : `${nick} clutch NET ${clutch} vs season NET ${seasonNet} (Δ ${delta}) — weaker in the clutch.`,
  };
}

function threeHotFact(
  teamId: string,
  seasonRow: NbaLeagueTeamStatRow | null,
  last10Row: NbaLeagueTeamStatRow | null
): ProInsightFact | null {
  if (!seasonRow || !last10Row) return null;
  const season = seasonRow.fg3Pct;
  const last10 = last10Row.fg3Pct;
  if (
    typeof season !== "number" ||
    typeof last10 !== "number" ||
    !Number.isFinite(season) ||
    !Number.isFinite(last10) ||
    season <= 0 ||
    last10 <= 0
  ) {
    return null;
  }
  const delta = Math.round((last10 - season) * 1000) / 1000;
  if (last10 < THREE_HOT_ABS || delta < THREE_HOT_DELTA) return null;
  const nick = abbr(teamId);
  return {
    id: `ctx:hot3:${teamId}`,
    section: "CONTEXT",
    kind: "three_last10_hot",
    score: 12,
    teamIds: [teamId],
    label: "THREE_LAST10_HOT",
    metrics: [
      { key: "seasonFg3Pct", value: pct1(season), teamId },
      { key: "last10Fg3Pct", value: pct1(last10), teamId },
      { key: "fg3Delta", value: pct1(delta), teamId },
    ],
    players: [],
    mode: "neutral",
    dedupeKeys: [`hot3:${teamId}`],
    hintEn: `${nick} last-10 3P% ${pct1(last10)} vs season ${pct1(season)} (Δ ${pct1(delta)}).`,
  };
}

function venueSplitFact(input: {
  teamId: string;
  isHome: boolean;
  records: NbaTeamSeasonRecordsBundle | null | undefined;
  phase: ProBriefPhase;
}): ProInsightFact | null {
  const split = input.records?.teams[input.teamId];
  if (!split) return null;
  const row = input.isHome ? split.home : split.away;
  const minGames = input.phase === "opening" ? 10 : 8;
  if (!row || wlTotal(row) < minGames) return null;
  const pct = row.wins / wlTotal(row);
  if (pct > 0.35 && pct < 0.65) return null;
  const nick = abbr(input.teamId);
  const venue = input.isHome ? "home" : "away";
  return {
    id: `ctx:venueSplit:${input.teamId}`,
    section: "CONTEXT",
    kind: "venue_split",
    score: 10,
    teamIds: [input.teamId],
    label: "VENUE_SPLIT",
    metrics: [
      {
        key: input.isHome ? "homeRecord" : "awayRecord",
        value: formatWl(row),
        teamId: input.teamId,
      },
      { key: "venueWinPct", value: pct1(pct), teamId: input.teamId },
    ],
    players: [],
    mode: "neutral",
    dedupeKeys: [`venue_split:${input.teamId}`],
    hintEn: `${nick} ${venue} record ${formatWl(row)} (win% ${pct1(pct)}).`,
  };
}

function sideFacts(input: {
  teamId: string;
  opponentTeamId: string;
  isHomeTonight: boolean;
  phase: ProBriefPhase;
  priors: SchedulePriorGame[];
  recentOppWinPcts: number[];
  records: NbaTeamSeasonRecordsBundle | null | undefined;
  confRankByTeamId: Record<string, number>;
  seasonRows: NbaLeagueTeamStatRow[];
  last10Rows: NbaLeagueTeamStatRow[] | null | undefined;
  shapeRecords?: NbaTeamShapeRecordsBundle | null;
}): ProInsightFact[] {
  const form = formFor(
    input.teamId,
    input.priors,
    input.recentOppWinPcts
  );
  const oppRank = input.confRankByTeamId[input.opponentTeamId] ?? null;
  const oppRow = findTeamRow(input.seasonRows, input.opponentTeamId);
  const oppWinPct =
    oppRow && typeof oppRow.winPct === "number" ? oppRow.winPct : null;
  const seasonRow = findTeamRow(input.seasonRows, input.teamId);
  const last10Row = input.last10Rows
    ? findTeamRow(input.last10Rows, input.teamId)
    : null;

  const facts: ProInsightFact[] = [];
  facts.push(...sosFacts({ teamId: input.teamId, recentOppWinPcts: input.recentOppWinPcts, form }));
  const streakQ = streakVsQualityFact({ teamId: input.teamId, form });
  if (streakQ) facts.push(streakQ);
  const venue = venueStreakFact({
    teamId: input.teamId,
    isHomeTonight: input.isHomeTonight,
    form,
  });
  if (venue) facts.push(venue);
  const margin = marginProfileFact({ teamId: input.teamId, form });
  if (margin) facts.push(margin);
  facts.push(
    ...vsBandFacts({
      teamId: input.teamId,
      opponentTeamId: input.opponentTeamId,
      opponentConfRank: oppRank,
      opponentWinPct: oppWinPct,
      records: input.records,
      phase: input.phase,
      isHome: input.isHomeTonight,
    })
  );
  facts.push(...ratingTiltFacts(input.teamId, seasonRow, last10Row));
  const clutch = clutchFormFact(input.teamId, seasonRow);
  if (clutch) facts.push(clutch);
  const hot3 = threeHotFact(input.teamId, seasonRow, last10Row);
  if (hot3) facts.push(hot3);
  const vsplit = venueSplitFact({
    teamId: input.teamId,
    isHome: input.isHomeTonight,
    records: input.records,
    phase: input.phase,
  });
  if (vsplit) facts.push(vsplit);
  facts.push(
    ...shapeEdgeFacts({
      teamId: input.teamId,
      shapeRecords: input.shapeRecords,
    })
  );
  return facts;
}

function shapeEdgeFacts(input: {
  teamId: string;
  shapeRecords: NbaTeamShapeRecordsBundle | null | undefined;
}): ProInsightFact[] {
  const rec = input.shapeRecords?.teams?.[input.teamId];
  if (!rec) return [];
  const edges = selectTeamShapeEdges(rec, { surface: "context" });
  const nick = abbr(input.teamId);
  const out: ProInsightFact[] = [];
  for (const edge of edges) {
    const pp = Math.round(edge.split.deltaWinPct * 100);
    const score =
      edge.kind === "strength"
        ? 52 + Math.min(18, Math.abs(pp))
        : 48 + Math.min(16, Math.abs(pp));
    out.push({
      id: `shape_${edge.kind}_${edge.def.id}_${input.teamId}`,
      section: "CONTEXT",
      kind: edge.kind === "strength" ? "shape_strength" : "shape_weakness",
      label:
        edge.kind === "strength" ? "SHAPE_STRENGTH" : "SHAPE_WEAKNESS",
      score,
      teamIds: [input.teamId],
      metrics: [
        {
          key: "whenRecord",
          value: formatWl(edge.split.when),
          teamId: input.teamId,
        },
        {
          key: "deltaWinPct",
          value: pct1(edge.split.deltaWinPct),
          teamId: input.teamId,
        },
        {
          key: "shapeGames",
          value: String(edge.split.games),
          teamId: input.teamId,
        },
      ],
      players: [],
      mode: edge.kind === "strength" ? "strength" : "weakening",
      dedupeKeys: [`shape_edge:${input.teamId}:${edge.def.id}`],
      hintEn: `${nick}: ${formatShapeEdgeHintEn(edge)}`,
    });
  }
  return out;
}

export function buildContextFactCandidates(input: {
  phase: ProBriefPhase;
  homeTeamId: string;
  awayTeamId: string;
  seasonRows: NbaLeagueTeamStatRow[];
  last10Rows?: NbaLeagueTeamStatRow[] | null;
  homeInjuries?: unknown;
  awayInjuries?: unknown;
  homeRecentOppWinPcts?: number[];
  awayRecentOppWinPcts?: number[];
  homePriorGames?: SchedulePriorGame[];
  awayPriorGames?: SchedulePriorGame[];
  seasonRecords?: NbaTeamSeasonRecordsBundle | null;
  priorRecords?: NbaTeamSeasonRecordsBundle | null;
  /** unused — prior から derive */
  streaks?: TeamStreakFactInput[];
  confRankByTeamId?: Record<string, number> | null;
  shapeRecords?: NbaTeamShapeRecordsBundle | null;
}): ProInsightFact[] {
  const records =
    input.phase === "opening"
      ? input.priorRecords
      : input.seasonRecords ?? input.priorRecords;
  const ranks = input.confRankByTeamId ?? {};

  return [
    ...sideFacts({
      teamId: input.homeTeamId,
      opponentTeamId: input.awayTeamId,
      isHomeTonight: true,
      phase: input.phase,
      priors: input.homePriorGames ?? [],
      recentOppWinPcts: input.homeRecentOppWinPcts ?? [],
      records,
      confRankByTeamId: ranks,
      seasonRows: input.seasonRows,
      last10Rows: input.last10Rows,
      shapeRecords: input.shapeRecords,
    }),
    ...sideFacts({
      teamId: input.awayTeamId,
      opponentTeamId: input.homeTeamId,
      isHomeTonight: false,
      phase: input.phase,
      priors: input.awayPriorGames ?? [],
      recentOppWinPcts: input.awayRecentOppWinPcts ?? [],
      records,
      confRankByTeamId: ranks,
      seasonRows: input.seasonRows,
      last10Rows: input.last10Rows,
      shapeRecords: input.shapeRecords,
    }),
  ];
}
