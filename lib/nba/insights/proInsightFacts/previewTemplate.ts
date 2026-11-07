/**
 * PREVIEW の本文（ja / en）をファクトからコードで組む。数字・選手の取り違えを起こさないため LLM に作文させない。
 * 他言語は LLM が en を翻訳する（数字は en と同じものだけ許す）。
 */
import { nbaSeasonShortLabel } from "@/lib/rankings/nbaSeason";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";
import type {
  ProInsightPreviewFacts,
  ProInsightPreviewMeeting,
  ProInsightPreviewPlayerLine,
  ProInsightPreviewPrevGame,
  ProInsightPreviewSeries,
  ProInsightPreviewTeamLine,
} from "@/lib/nba/insights/proInsightFacts/buildPreviewFacts";

export type PreviewTemplatePart = { ja: string; en: string };

export type PreviewTemplate = {
  meeting?: PreviewTemplatePart;
  recent?: PreviewTemplatePart;
  read?: PreviewTemplatePart;
};

export const PREVIEW_PART_KEYS = ["meeting", "recent", "read"] as const;
export type PreviewPartKey = (typeof PREVIEW_PART_KEYS)[number];

/** 2 人目を名前に出す最低得点 */
const SECOND_SCORER_MIN_PTS = 20;

function abbr(teamId: string): string {
  return proInsightTeamAbbr(teamId);
}

function seasonJa(seasonKey: string, tonight: string | null): string {
  return tonight && seasonKey === tonight ? "今季" : `昨季（${nbaSeasonShortLabel(seasonKey)}）`;
}

function seasonEn(seasonKey: string, tonight: string | null): string {
  return tonight && seasonKey === tonight ? "this season" : `last season (${seasonKey})`;
}

function fgShort(fg: string | undefined): string | null {
  const m = /^(\d+)-(\d+)$/.exec(String(fg ?? "").trim());
  return m && Number(m[2]) > 0 ? `${m[1]}/${m[2]}` : null;
}

function playerJa(p: ProInsightPreviewPlayerLine, withFg: boolean): string {
  const parts = [`${p.pts}点`];
  if (p.reb >= 8) parts.push(`${p.reb}リバウンド`);
  if (p.ast >= 6) parts.push(`${p.ast}アシスト`);
  const fg = withFg ? fgShort(p.fg) : null;
  return `${p.name} ${parts.join("・")}${fg ? `（FG ${fg}）` : ""}`;
}

function playerEn(p: ProInsightPreviewPlayerLine, withFg: boolean): string {
  const parts = [`${p.pts} pts`];
  if (p.reb >= 8) parts.push(`${p.reb} reb`);
  if (p.ast >= 6) parts.push(`${p.ast} ast`);
  const fg = withFg ? fgShort(p.fg) : null;
  return `${p.name} ${parts.join(", ")}${fg ? ` (FG ${fg})` : ""}`;
}

function shownPlayers(top: ProInsightPreviewPlayerLine[]): ProInsightPreviewPlayerLine[] {
  const [a, b] = top;
  if (!a) return [];
  return b && b.pts >= SECOND_SCORER_MIN_PTS ? [a, b] : [a];
}

function teamPlayersJa(team: ProInsightPreviewTeamLine): string | null {
  const ps = shownPlayers(team.top);
  if (!ps.length) return null;
  return `${abbr(team.teamId)} は ${ps.map((p, i) => playerJa(p, i === 0)).join("、")}`;
}

function teamPlayersEn(team: ProInsightPreviewTeamLine): string | null {
  const ps = shownPlayers(team.top);
  if (!ps.length) return null;
  return `${abbr(team.teamId)}: ${ps.map((p, i) => playerEn(p, i === 0)).join(", ")}`;
}

/** box がある試合だけ。いちばん偏った 1 指標 */
function teamGap(m: ProInsightPreviewMeeting): PreviewTemplatePart | null {
  const w = m.winnerTeamId === m.home.teamId ? m.home : m.away;
  const l = w === m.home ? m.away : m.home;
  if (w.reb == null || l.reb == null) return null;
  const W = abbr(w.teamId);
  const L = abbr(l.teamId);
  const cands: Array<{ score: number; part: PreviewTemplatePart }> = [];
  if (w.reb - l.reb >= 10) {
    cands.push({
      score: (w.reb - l.reb) / 10,
      part: {
        ja: `リバウンドは ${W} が ${w.reb}-${l.reb} と圧倒。`,
        en: `${W} won the glass ${w.reb}-${l.reb}.`,
      },
    });
  }
  if (w.fg3m != null && l.fg3m != null && w.fg3m - l.fg3m >= 7) {
    cands.push({
      score: (w.fg3m - l.fg3m) / 7,
      part: {
        ja: `3P成功は ${W} ${w.fg3m}本、${L} ${l.fg3m}本。`,
        en: `${W} made ${w.fg3m} threes to ${L}'s ${l.fg3m}.`,
      },
    });
  }
  if (w.tov != null && l.tov != null && l.tov - w.tov >= 7) {
    cands.push({
      score: (l.tov - w.tov) / 7,
      part: {
        ja: `ターンオーバーは ${W} ${w.tov}、${L} ${l.tov}。`,
        en: `Turnovers: ${W} ${w.tov}, ${L} ${l.tov}.`,
      },
    });
  }
  cands.sort((a, b) => b.score - a.score);
  return cands[0]?.part ?? null;
}

function seriesRecord(s: ProInsightPreviewSeries): { leader: string | null; wl: string } {
  const entries = Object.entries(s.wins).sort((a, b) => b[1] - a[1]);
  const [[aId, a], [, b]] = entries.length >= 2 ? entries : [entries[0], ["", 0]];
  if (a === b) return { leader: null, wl: `${a}-${b}` };
  return { leader: abbr(aId), wl: `${a}-${b}` };
}

function stageJa(stage: ProInsightPreviewSeries["stage"]): string {
  return stage === "playoffs" ? "プレーオフ" : stage === "play_in" ? "プレーイン" : "レギュラーシーズン";
}

function stageEn(stage: ProInsightPreviewSeries["stage"]): string {
  return stage === "playoffs" ? "playoffs" : stage === "play_in" ? "play-in" : "regular season";
}

function seriesLine(
  series: ProInsightPreviewSeries[],
  tonight: string | null,
  meetingSeasonKey: string
): PreviewTemplatePart | null {
  if (!series.length) return null;
  const bySeason = new Map<string, ProInsightPreviewSeries[]>();
  for (const s of series) bySeason.set(s.seasonKey, [...(bySeason.get(s.seasonKey) ?? []), s]);
  const ja: string[] = [];
  const en: string[] = [];
  for (const [seasonKey, rows] of bySeason) {
    const multiStage = rows.length > 1 || rows[0].stage !== "regular";
    const jaRows = rows.map((r) => {
      const { leader, wl } = seriesRecord(r);
      const sweep = leader && Object.values(r.wins).includes(0) && Math.max(...Object.values(r.wins)) >= 3;
      const rec = leader ? `${leader} ${wl}${sweep ? " と全勝" : ""}` : `${wl} の五分`;
      return multiStage ? `${stageJa(r.stage)} ${rec}` : rec;
    });
    const enRows = rows.map((r) => {
      const { leader, wl } = seriesRecord(r);
      const rec = leader ? `${leader} ${wl}` : `even at ${wl}`;
      return multiStage ? `${rec} in the ${stageEn(r.stage)}` : rec;
    });
    // 前回対戦の文で季を書いたので、同じ季は「昨季」「今季」だけ
    const label =
      seasonKey === meetingSeasonKey
        ? tonight && seasonKey === tonight
          ? "今季"
          : "昨季"
        : seasonJa(seasonKey, tonight);
    ja.push(`${label}の対戦成績は ${jaRows.join("、")}`);
    en.push(
      `Series ${seasonKey === meetingSeasonKey ? (tonight && seasonKey === tonight ? "this season" : "last season") : seasonEn(seasonKey, tonight)}: ${enRows.join(", ")}`
    );
  }
  return { ja: `${ja.join("。")}。`, en: `${en.join(". ")}.` };
}

function meetingPart(facts: ProInsightPreviewFacts, tonight: string | null): PreviewTemplatePart | null {
  const m = facts.lastMeeting;
  if (!m) return null;
  const W = abbr(m.winnerTeamId);
  const V = abbr(m.venueTeamId);
  const w = m.winnerTeamId === m.home.teamId ? m.home : m.away;
  const l = w === m.home ? m.away : m.home;
  const score = `${w.score}-${l.score}`;
  const stageJaText = m.stage === "regular" ? "" : `${stageJa(m.stage)}の`;
  const stageEnText = m.stage === "regular" ? "" : ` in the ${stageEn(m.stage)}`;
  const homeWin = m.winnerTeamId === m.venueTeamId;
  const ja: string[] = [
    `前回の対戦は${seasonJa(m.seasonKey, tonight)}の${stageJaText} ${m.dateLabel}。${
      homeWin ? `${W} がホームで` : `${V} のホームで ${W} が`
    } ${score}（${m.margin}点差）で勝った。`,
  ];
  const en: string[] = [
    `They last met ${seasonEn(m.seasonKey, tonight)}${stageEnText} on ${m.dateLabel}: ${W} won ${score} ${
      homeWin ? "at home" : `at ${V}`
    } (by ${m.margin}).`,
  ];
  const playerJaLines = [teamPlayersJa(w), teamPlayersJa(l)].filter((x): x is string => !!x);
  const playerEnLines = [teamPlayersEn(w), teamPlayersEn(l)].filter((x): x is string => !!x);
  if (playerJaLines.length) {
    ja.push(`${playerJaLines.join("。")}。`);
    en.push(`${playerEnLines.join("; ")}.`);
  }
  const gap = teamGap(m);
  if (gap) {
    ja.push(gap.ja);
    en.push(gap.en);
  }
  const series = seriesLine(facts.series, tonight, m.seasonKey);
  if (series) {
    ja.push(series.ja);
    en.push(series.en);
  }
  return { ja: ja.join(""), en: en.join(" ") };
}

function prevGameJa(g: ProInsightPreviewPrevGame): string {
  const T = abbr(g.teamId);
  const O = abbr(g.oppTeamId);
  const when = g.daysBefore === 1 ? `前日（${g.dateLabel}）` : ` ${g.dateLabel} `;
  const where = g.isHome ? "ホーム" : "敵地";
  const score = `${g.teamScore}-${g.oppScore}`;
  const result =
    g.result === "W" ? `${where}で ${O} を ${score} で下した` : `${where}で ${O} に ${score} で敗れた`;
  const ps = shownPlayers(g.top);
  const players = ps.length ? `。${ps.map((p, i) => playerJa(p, i === 0)).join("、")}` : "";
  const heavy = g.heavyMinutes.length
    ? `。${g.heavyMinutes.map((h) => `${h.name} ${h.min}分`).join("、")}と出場時間が長い`
    : "";
  return `${T} は${when}に${result}${players}${heavy}。`;
}

function prevGameEn(g: ProInsightPreviewPrevGame): string {
  const T = abbr(g.teamId);
  const O = abbr(g.oppTeamId);
  const when = g.daysBefore === 1 ? `last night (${g.dateLabel})` : `on ${g.dateLabel}`;
  const where = g.isHome ? "at home" : "on the road";
  const score = `${g.teamScore}-${g.oppScore}`;
  const result = g.result === "W" ? `beat ${O} ${score} ${where}` : `lost ${score} to ${O} ${where}`;
  const ps = shownPlayers(g.top);
  const players = ps.length ? ` behind ${ps.map((p, i) => playerEn(p, i === 0)).join(", ")}` : "";
  const heavy = g.heavyMinutes.length
    ? `; heavy minutes for ${g.heavyMinutes.map((h) => `${h.name} (${h.min})`).join(", ")}`
    : "";
  return `${T} ${result} ${when}${players}${heavy}.`;
}

function recentPart(facts: ProInsightPreviewFacts): PreviewTemplatePart | null {
  if (!facts.prevGames.length) return null;
  return {
    ja: facts.prevGames.map(prevGameJa).join(""),
    en: facts.prevGames.map(prevGameEn).join(" "),
  };
}

/** 直近の対戦成績で 2 勝差以上なら、その季の勝ち越し側 */
function seriesLean(series: ProInsightPreviewSeries[]): string | null {
  const latest = series[0];
  if (!latest) return null;
  let lean: string | null = null;
  let diff = 0;
  for (const s of series.filter((x) => x.seasonKey === latest.seasonKey)) {
    const entries = Object.entries(s.wins).sort((a, b) => b[1] - a[1]);
    if (entries.length < 2) continue;
    const d = entries[0][1] - entries[1][1];
    if (d > diff) {
      diff = d;
      lean = entries[0][0];
    }
  }
  return diff >= 2 && lean ? abbr(lean) : null;
}

function readPart(facts: ProInsightPreviewFacts): PreviewTemplatePart | null {
  const ja: string[] = [];
  const en: string[] = [];
  const lean = seriesLean(facts.series);
  if (lean) {
    ja.push(`相性は ${lean} 寄り。`);
    en.push(`The matchup history leans ${lean}.`);
  }
  const b2b = facts.prevGames.filter((g) => g.daysBefore === 1);
  const rested = facts.prevGames.filter((g) => g.daysBefore >= 3);
  const heavy = facts.prevGames.filter((g) => g.heavyMinutes.length > 0);
  if (b2b.length === 2) {
    ja.push("両チームとも連戦の 2 日目で、終盤の脚の残り方が分かれ目。");
    en.push("Both teams are on the second night of a back-to-back, so late-game legs decide a lot.");
  } else if (b2b.length === 1) {
    const T = abbr(b2b[0].teamId);
    const tired = b2b[0].heavyMinutes.length > 0;
    const other = facts.prevGames.find((g) => g !== b2b[0]);
    const otherRested = other && other.daysBefore >= 2 ? abbr(other.teamId) : null;
    ja.push(
      `${T} は連戦の 2 日目${tired ? "で主力の出場時間も長く" : "で"}、${otherRested ? `休養のある ${otherRested} が` : "相手が"}脚の差を突きやすい。`
    );
    en.push(
      `${T} are on the second night of a back-to-back${tired ? " after heavy minutes" : ""}, so ${otherRested ? `the rested ${otherRested}` : "their opponent"} can test their legs.`
    );
  } else if (heavy.length === 1 && rested.length < 2) {
    const T = abbr(heavy[0].teamId);
    ja.push(`前の試合で主力の出場時間が長かった ${T} は、ローテーションの使い方に注目。`);
    en.push(`${T} leaned hard on their starters last time out — watch how they manage minutes.`);
  }
  if (!ja.length) return null;
  return { ja: ja.join(""), en: en.join(" ") };
}

export function buildPreviewTemplate(
  facts: ProInsightPreviewFacts | null | undefined,
  tonightSeasonKey: string | null
): PreviewTemplate | null {
  if (!facts) return null;
  const meeting = meetingPart(facts, tonightSeasonKey);
  const recent = recentPart(facts);
  if (!meeting && !recent) return null;
  const read = readPart(facts);
  return {
    ...(meeting ? { meeting } : {}),
    ...(recent ? { recent } : {}),
    ...(read ? { read } : {}),
  };
}
