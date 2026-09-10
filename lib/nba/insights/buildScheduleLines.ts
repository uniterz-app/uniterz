/**
 * SCHEDULE 行（移動・休養・連戦・開幕）。
 */
import type { ProBriefLineItem } from "@/lib/predict/predictProBrief";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import { proBriefLine } from "@/lib/predict/predictProBrief";
import {
  proBriefTravelLines,
  travelSummaryForBrief,
} from "@/lib/predict/nbaProBriefTravel";
import type { NbaTravelStop } from "@/lib/nba/nbaArenaTravel";

const DAY_MS = 24 * 60 * 60 * 1000;

export type TeamScheduleInput = {
  teamId: string;
  isHome: boolean;
  tonightVenueTeamId: string;
  tonightStartAtMs: number;
  /** 今夜より前の試合（新しい順でも古い順でも可） */
  priorGames: Array<{
    startAtMs: number;
    venueTeamId: string;
    isHome: boolean;
    overtime?: boolean;
  }>;
  /** 相手チームの休養日数（差を出す用） */
  opponentRestDays: number | null;
  phase: ProBriefPhase;
};

function restDaysBefore(
  tipAtMs: number,
  priorStartAtMs: number | null
): number | null {
  if (priorStartAtMs == null || priorStartAtMs <= 0) return null;
  const gap = tipAtMs - priorStartAtMs;
  if (gap < 0) return null;
  return Math.floor(gap / DAY_MS);
}

function countStreak(
  prior: TeamScheduleInput["priorGames"],
  home: boolean
): number {
  let n = 0;
  const sorted = [...prior].sort((a, b) => b.startAtMs - a.startAtMs);
  for (const g of sorted) {
    if (g.isHome !== home) break;
    n += 1;
  }
  return n;
}

function countInWindow(
  prior: TeamScheduleInput["priorGames"],
  tipAtMs: number,
  windowDays: number
): number {
  const from = tipAtMs - windowDays * DAY_MS;
  return prior.filter((g) => g.startAtMs >= from && g.startAtMs < tipAtMs).length;
}

export function computeRestDays(input: {
  tipAtMs: number;
  priorGames: TeamScheduleInput["priorGames"];
}): number | null {
  const last = [...input.priorGames].sort((a, b) => b.startAtMs - a.startAtMs)[0];
  return restDaysBefore(input.tipAtMs, last?.startAtMs ?? null);
}

export function buildScheduleLinesForTeam(
  input: TeamScheduleInput
): ProBriefLineItem[] {
  const lines: ProBriefLineItem[] = [];
  const priorSorted = [...input.priorGames].sort(
    (a, b) => a.startAtMs - b.startAtMs
  );
  const rest = computeRestDays({
    tipAtMs: input.tonightStartAtMs,
    priorGames: input.priorGames,
  });

  if (input.phase === "opening") {
    if (rest != null && rest >= 2) {
      lines.push(
        proBriefLine({
          ja: `開幕戦 · 休養十分（プレ最終から ${rest}日）`,
          en: `Opener · ${rest} days rest after last preseason`,
          ko: `개막전 · 프리시즌 최종전 이후 ${rest}일 휴식`,
          zh: `揭幕战 · 季前赛后休息 ${rest} 天`,
          es: `Debut · ${rest} días de descanso tras la pretemporada`,
          pt: `Estreia · ${rest} dias de descanso após a pré-temporada`,
          fr: `Ouverture · ${rest} jours de repos après la présaison`,
        })
      );
    } else {
      lines.push(
        proBriefLine({
          ja: "開幕戦",
          en: "Season opener",
          ko: "시즌 개막전",
          zh: "赛季揭幕战",
          es: "Debut de temporada",
          pt: "Estreia da temporada",
          fr: "Match d'ouverture",
        })
      );
    }
  } else if (rest === 0) {
    const oppRest = input.opponentRestDays;
    if (oppRest != null && oppRest >= 2) {
      lines.push(
        proBriefLine({
          ja: `B2B · 相手は休養 ${oppRest}日`,
          en: `B2B · opponent has ${oppRest} days rest`,
          ko: `백투백 · 상대는 ${oppRest}일 휴식`,
          zh: `背靠背 · 对手休息 ${oppRest} 天`,
          es: `B2B · rival con ${oppRest} días de descanso`,
          pt: `B2B · adversário com ${oppRest} dias de descanso`,
          fr: `B2B · adversaire avec ${oppRest} jours de repos`,
        })
      );
    } else if (input.isHome) {
      lines.push(
        proBriefLine({
          ja: "ホーム Back-to-Back",
          en: "Home back-to-back",
          ko: "홈 백투백",
          zh: "主场背靠背",
          es: "Back-to-back en casa",
          pt: "Back-to-back em casa",
          fr: "Back-to-back à domicile",
        })
      );
    } else {
      lines.push(
        proBriefLine({
          ja: "B2B",
          en: "Back-to-back",
          ko: "백투백",
          zh: "背靠背",
          es: "Back-to-back",
          pt: "Back-to-back",
          fr: "Back-to-back",
        })
      );
    }
  } else if (rest != null && rest >= 2) {
    lines.push(
      proBriefLine({
        ja: `休養 ${rest}日`,
        en: `${rest} days rest`,
        ko: `${rest}일 휴식`,
        zh: `休息 ${rest} 天`,
        es: `${rest} días de descanso`,
        pt: `${rest} dias de descanso`,
        fr: `${rest} jours de repos`,
      })
    );
  }

  const in4 = countInWindow(input.priorGames, input.tonightStartAtMs, 4);
  // 今夜を含めると in4+1
  if (in4 + 1 >= 3) {
    lines.push(
      proBriefLine({
        ja: "4日で3試合目",
        en: "3rd game in 4 days",
        ko: "4일간 3번째 경기",
        zh: "4 天内第 3 场",
        es: "3.º partido en 4 días",
        pt: "3.º jogo em 4 dias",
        fr: "3e match en 4 jours",
      })
    );
  }
  const in6 = countInWindow(input.priorGames, input.tonightStartAtMs, 6);
  if (in6 + 1 >= 4 && in4 + 1 < 3) {
    lines.push(
      proBriefLine({
        ja: "6日で4試合目",
        en: "4th game in 6 days",
        ko: "6일간 4번째 경기",
        zh: "6 天内第 4 场",
        es: "4.º partido en 6 días",
        pt: "4.º jogo em 6 dias",
        fr: "4e match en 6 jours",
      })
    );
  }

  const homeStreak = countStreak(input.priorGames, true);
  const awayStreak = countStreak(input.priorGames, false);
  if (input.isHome && homeStreak + 1 >= 3) {
    const n = homeStreak + 1;
    lines.push(
      proBriefLine({
        ja: `ホーム連戦 ${n}試合目`,
        en: `Home stand game ${n}`,
        ko: `홈 연전 ${n}번째 경기`,
        zh: `主场连战第 ${n} 场`,
        es: `Racha en casa · partido ${n}`,
        pt: `Sequência em casa · jogo ${n}`,
        fr: `Série à domicile · match ${n}`,
      })
    );
  }
  if (!input.isHome && awayStreak + 1 >= 3) {
    const n = awayStreak + 1;
    lines.push(
      proBriefLine({
        ja: `アウェイ連戦 ${n}試合目`,
        en: `Road trip game ${n}`,
        ko: `원정 연전 ${n}번째 경기`,
        zh: `客场连战第 ${n} 场`,
        es: `Gira · partido ${n}`,
        pt: `Excursão · jogo ${n}`,
        fr: `Déplacement · match ${n}`,
      })
    );
  }

  if (input.tonightVenueTeamId === "nba-nuggets" && !input.isHome) {
    lines.push(
      proBriefLine({
        ja: "高地 · DEN",
        en: "Altitude · DEN",
        ko: "고지대 · DEN",
        zh: "高原 · DEN",
        es: "Altitud · DEN",
        pt: "Altitude · DEN",
        fr: "Altitude · DEN",
      })
    );
  }

  const last = [...input.priorGames].sort((a, b) => b.startAtMs - a.startAtMs)[0];
  if (last?.overtime) {
    lines.push(
      proBriefLine({
        ja: "前試合は延長戦後",
        en: "Coming off overtime",
        ko: "직전 경기 연장 후",
        zh: "上一场加时之后",
        es: "Viene de una prórroga",
        pt: "Vem de uma prorrogação",
        fr: "Sort d'une prolongation",
      })
    );
  }

  const recentStops: NbaTravelStop[] = priorSorted
    .slice(-4)
    .map((g) => ({
      venueTeamId: g.venueTeamId,
      startAtMs: g.startAtMs,
    }));
  const travel = travelSummaryForBrief({
    teamId: input.teamId,
    tonightVenueTeamId: input.tonightVenueTeamId,
    tonightStartAtMs: input.tonightStartAtMs,
    recentStops,
  });
  lines.push(
    ...proBriefTravelLines(travel, {
      homeNoTravel: input.isHome,
    })
  );

  // 重複除去（同じ textJa）
  const seen = new Set<string>();
  const deduped: ProBriefLineItem[] = [];
  for (const line of lines) {
    if (seen.has(line.textJa)) continue;
    seen.add(line.textJa);
    deduped.push(line);
  }
  return deduped.slice(0, 3);
}
