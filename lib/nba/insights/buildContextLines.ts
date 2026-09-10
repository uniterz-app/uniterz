/**
 * CONTEXT 行（欠場ローテ・直近強度・開幕の前季偏り）。
 */
import type { ProBriefLineItem } from "@/lib/predict/predictProBrief";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import { proBriefLine } from "@/lib/predict/predictProBrief";
import { joinUiStrings } from "@/lib/i18n/uiCompose";
import {
  injuryStatusPhrase,
  vsConfTopLine,
  vsOver500Line,
  vsUnder500Line,
  type InsightPhase,
} from "@/lib/nba/insights/insightPhrases";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { isOutOrQuestionableInjury } from "@/lib/nba/teamInjuries/injuryStatusDisplay";
import { findTeamRow } from "@/lib/nba/insights/rankTeamMetrics";
import {
  formatWl,
  wlTotal,
  type NbaTeamSeasonRecordsBundle,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import type { NbaTeamAceOutRecordsBundle } from "@/lib/nba/insights/aceOutRecordTypes";
import {
  aceOutSuffix,
  findAceOutForInjuryWithTeam,
} from "@/lib/nba/insights/aceOutInsight";

function shortName(entry: NbaTeamInjuryEntry): string {
  const raw = entry.name.trim();
  const m = raw.match(/^([A-Za-z])\.(.+)$/);
  if (m) return `${m[1]}.${m[2]}`.replace(/\s+/g, " ");
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}.${parts.slice(1).join(" ")}`;
  }
  return raw;
}

export function buildContextLinesForTeam(input: {
  phase: ProBriefPhase;
  seasonRows: NbaLeagueTeamStatRow[];
  priorRows: NbaLeagueTeamStatRow[] | null;
  priorRecords?: NbaTeamSeasonRecordsBundle | null;
  teamId: string;
  isHome: boolean;
  injuries: NbaTeamInjuryEntry[];
  /** MATCHUP に既に出した選手名（小文字） */
  injuryNamesUsedInMatchup: Set<string>;
  /** 直近対戦相手の winPct（古い→新しい） */
  recentOppWinPcts: number[];
  /** 今季 games 集計（early / full） */
  seasonRecords?: NbaTeamSeasonRecordsBundle | null;
  /** opening → 前季、early/full → 今季のエース欠場 W–L */
  aceOutRecords?: NbaTeamAceOutRecordsBundle | null;
}): ProBriefLineItem[] {
  const lines: ProBriefLineItem[] = [];
  const acePhase: InsightPhase =
    input.phase === "opening" ? "prior" : "current";

  const unusedInjuries = input.injuries.filter((i) => {
    if (!isOutOrQuestionableInjury(i.status)) return false;
    const key = shortName(i).toLowerCase();
    return !input.injuryNamesUsedInMatchup.has(key);
  });

  const outs = unusedInjuries.filter(
    (i) => i.status === "out" || i.status === "doubtful"
  );
  if (outs.length >= 2) {
    const n = outs.length;
    lines.push(
      proBriefLine({
        ja: `スターター ${n}人 OUT · 作成が分散`,
        en: `${n} OUT · creation thins out`,
        ko: `주전 ${n}명 결장 · 공격 창출 분산`,
        zh: `${n} 名主力缺阵 · 组织分散`,
        es: `${n} bajas · creación repartida`,
        pt: `${n} desfalques · criação dividida`,
        fr: `${n} absents · création dispersée`,
      })
    );
  } else {
    const pick = (outs[0] ?? unusedInjuries[0]) as
      | NbaTeamInjuryEntry
      | undefined;
    if (pick) {
      const name = shortName(pick);
      const isOut = pick.status === "out" || pick.status === "doubtful";
      const status = injuryStatusPhrase(name, isOut);
      const hit = findAceOutForInjuryWithTeam(
        input.aceOutRecords,
        input.teamId,
        pick
      );
      if (hit) {
        const suf = aceOutSuffix(hit.player, acePhase, hit.team);
        lines.push(proBriefLine(joinUiStrings([status, suf])));
      } else if (input.phase === "opening") {
        lines.push(
          proBriefLine(
            joinUiStrings([
              status,
              {
                ja: "負荷管理の可能性",
                en: "minutes may be managed",
                ko: "출전 시간 관리 가능성",
                zh: "可能进行负荷管理",
                es: "podrían gestionarle los minutos",
                pt: "minutos podem ser gerenciados",
                fr: "temps de jeu peut-être géré",
              },
            ])
          )
        );
      } else {
        lines.push(
          proBriefLine(
            joinUiStrings([
              status,
              {
                ja: "守備ローテが薄くなる",
                en: "rotation thins out",
                ko: "수비 로테이션이 얇아짐",
                zh: "防守轮换变薄",
                es: "la rotación se adelgaza",
                pt: "a rotação fica mais curta",
                fr: "la rotation s'amincit",
              },
            ])
          )
        );
      }
    }
  }

  // MATCHUP にエース欠場を折り込んだ場合でも、欠場時成績だけは CONTEXT に出してよい
  if (lines.length < 2) {
    const matchupInjuries = input.injuries.filter((i) => {
      if (!isOutOrQuestionableInjury(i.status)) return false;
      return input.injuryNamesUsedInMatchup.has(shortName(i).toLowerCase());
    });
    for (const pick of matchupInjuries) {
      const hit = findAceOutForInjuryWithTeam(
        input.aceOutRecords,
        input.teamId,
        pick
      );
      if (!hit) continue;
      const name = shortName(pick);
      const suf = aceOutSuffix(hit.player, acePhase, hit.team);
      lines.push(proBriefLine(joinUiStrings([name, suf])));
      break;
    }
  }

  if (input.phase === "opening") {
    const split = input.priorRecords?.teams[input.teamId];
    const row = findTeamRow(input.priorRows ?? input.seasonRows, input.teamId);
    const conf = row?.conference === "west" ? "WEST" : "EAST";

    if (split) {
      const venueTop = input.isHome
        ? split.vsConfTop6Home
        : split.vsConfTop6Away;
      if (wlTotal(venueTop) >= 3) {
        lines.push(
          proBriefLine(
            vsConfTopLine({
              phase: "prior",
              conference: conf,
              isHome: input.isHome,
              record: formatWl(venueTop),
            })
          )
        );
      } else if (wlTotal(split.vsConfTop6) >= 4) {
        lines.push(
          proBriefLine(
            vsConfTopLine({
              phase: "prior",
              conference: conf,
              isHome: null,
              record: formatWl(split.vsConfTop6),
            })
          )
        );
      }

      if (wlTotal(split.vsUnder500) >= 8) {
        const pct = Math.round(
          (split.vsUnder500.wins / wlTotal(split.vsUnder500)) * 100
        );
        lines.push(
          proBriefLine(
            vsUnder500Line({
              phase: "prior",
              record: formatWl(split.vsUnder500),
              winPct: pct,
            })
          )
        );
      } else if (wlTotal(split.vsOver500) >= 8) {
        const pct = Math.round(
          (split.vsOver500.wins / wlTotal(split.vsOver500)) * 100
        );
        lines.push(
          proBriefLine(
            vsOver500Line({
              phase: "prior",
              record: formatWl(split.vsOver500),
              winPct: pct,
            })
          )
        );
      }
    }
  } else {
    const split = input.seasonRecords?.teams[input.teamId];
    const row = findTeamRow(input.seasonRows, input.teamId);
    const conf = row?.conference === "west" ? "WEST" : "EAST";

    if (split) {
      const venueTop = input.isHome
        ? split.vsConfTop6Home
        : split.vsConfTop6Away;
      if (wlTotal(venueTop) >= 2) {
        lines.push(
          proBriefLine(
            vsConfTopLine({
              phase: "current",
              conference: conf,
              isHome: input.isHome,
              record: formatWl(venueTop),
            })
          )
        );
      }
      if (wlTotal(split.vsUnder500) >= 3) {
        const pct = Math.round(
          (split.vsUnder500.wins / wlTotal(split.vsUnder500)) * 100
        );
        lines.push(
          proBriefLine(
            vsUnder500Line({
              phase: "current",
              record: formatWl(split.vsUnder500),
              winPct: pct,
            })
          )
        );
      } else if (wlTotal(split.vsOver500) >= 3) {
        const pct = Math.round(
          (split.vsOver500.wins / wlTotal(split.vsOver500)) * 100
        );
        lines.push(
          proBriefLine(
            vsOver500Line({
              phase: "current",
              record: formatWl(split.vsOver500),
              winPct: pct,
            })
          )
        );
      }
    }

    const opps = input.recentOppWinPcts.filter((x) => Number.isFinite(x));
    if (opps.length >= 2 && lines.length < 2) {
      const avg = opps.reduce((a, b) => a + b, 0) / opps.length;
      const n = opps.length;
      if (avg < 0.45) {
        lines.push(
          proBriefLine({
            ja: `直近${n} · 相手は勝率 5割未満`,
            en: `Last ${n} · opponents under .500`,
            ko: `최근 ${n}경기 · 상대 승률 5할 미만`,
            zh: `近 ${n} 场 · 对手胜率低于五成`,
            es: `Últimos ${n} · rivales bajo .500`,
            pt: `Últimos ${n} · adversários abaixo de .500`,
            fr: `${n} derniers · adversaires sous .500`,
          })
        );
      } else if (avg >= 0.55) {
        lines.push(
          proBriefLine({
            ja: `直近${n} · 相手は勝率上位続き`,
            en: `Last ${n} · tough recent opponents`,
            ko: `최근 ${n}경기 · 강팀 상대 연속`,
            zh: `近 ${n} 场 · 连续遭遇强敌`,
            es: `Últimos ${n} · rivales exigentes`,
            pt: `Últimos ${n} · adversários difíceis`,
            fr: `${n} derniers · adversaires coriaces`,
          })
        );
      }
    }

    const season = findTeamRow(input.seasonRows, input.teamId);
    if (season && season.wins + season.losses > 0 && lines.length < 2) {
      const wl = `${season.wins}-${season.losses}`;
      lines.push(
        proBriefLine({
          ja: `開幕 ${wl}`,
          en: `Record ${wl}`,
          ko: `시즌 성적 ${wl}`,
          zh: `赛季战绩 ${wl}`,
          es: `Balance ${wl}`,
          pt: `Campanha ${wl}`,
          fr: `Bilan ${wl}`,
        })
      );
    }
  }

  const seen = new Set<string>();
  const out: ProBriefLineItem[] = [];
  for (const line of lines) {
    if (seen.has(line.textJa)) continue;
    seen.add(line.textJa);
    out.push(line);
  }
  return out.slice(0, 2);
}
