/**
 * CONTEXT 行（欠場ローテ・直近強度・開幕の前季偏り）。
 */
import type { ProBriefLineItem } from "@/lib/predict/predictProBrief";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
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
  const acePhaseLabel: "前季" | "今季" =
    input.phase === "opening" ? "前季" : "今季";

  const unusedInjuries = input.injuries.filter((i) => {
    if (!isOutOrQuestionableInjury(i.status)) return false;
    const key = shortName(i).toLowerCase();
    return !input.injuryNamesUsedInMatchup.has(key);
  });

  const outs = unusedInjuries.filter(
    (i) => i.status === "out" || i.status === "doubtful"
  );
  if (outs.length >= 2) {
    lines.push({
      textJa: `スターター ${outs.length}人 OUT · 作成が分散`,
      textEn: `${outs.length} OUT · creation thins out`,
    });
  } else {
    const pick = (outs[0] ?? unusedInjuries[0]) as
      | NbaTeamInjuryEntry
      | undefined;
    if (pick) {
      const name = shortName(pick);
      const st =
        pick.status === "out" || pick.status === "doubtful" ? "OUT" : "Questionable";
      const hit = findAceOutForInjuryWithTeam(
        input.aceOutRecords,
        input.teamId,
        pick
      );
      if (hit) {
        const suf = aceOutSuffix(hit.player, acePhaseLabel, hit.team);
        lines.push({
          textJa: `${name} が ${st === "OUT" ? "OUT" : "Questionable"} · ${suf.ja}`,
          textEn: `${name} ${st === "OUT" ? "OUT" : "QUES"} · ${suf.en}`,
        });
      } else if (input.phase === "opening") {
        lines.push({
          textJa: `${name} が ${st === "OUT" ? "OUT" : "Questionable"} · 負荷管理の可能性`,
          textEn: `${name} ${st} · minutes may be managed`,
        });
      } else {
        lines.push({
          textJa: `${name} が ${st === "OUT" ? "OUT" : "Questionable"} · 守備ローテが薄くなる`,
          textEn: `${name} ${st} · rotation thins out`,
        });
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
      const suf = aceOutSuffix(hit.player, acePhaseLabel, hit.team);
      lines.push({
        textJa: `${name} · ${suf.ja}`,
        textEn: `${name} · ${suf.en}`,
      });
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
        lines.push({
          textJa: `前季 ${conf} 上位との${input.isHome ? "ホーム" : "アウェイ"}は ${formatWl(venueTop)}`,
          textEn: `Last season vs ${conf} top-6 (${input.isHome ? "home" : "road"}) ${formatWl(venueTop)}`,
        });
      } else if (wlTotal(split.vsConfTop6) >= 4) {
        lines.push({
          textJa: `前季 ${conf} 上位との対戦は ${formatWl(split.vsConfTop6)}`,
          textEn: `Last season vs ${conf} top-6 ${formatWl(split.vsConfTop6)}`,
        });
      }

      if (wlTotal(split.vsUnder500) >= 8) {
        const pct = Math.round(
          (split.vsUnder500.wins / wlTotal(split.vsUnder500)) * 100
        );
        lines.push({
          textJa: `前季 下位相手 ${formatWl(split.vsUnder500)}（勝率 ${pct}%）`,
          textEn: `Last season vs weaker ${formatWl(split.vsUnder500)} (${pct}%)`,
        });
      } else if (wlTotal(split.vsOver500) >= 8) {
        const pct = Math.round(
          (split.vsOver500.wins / wlTotal(split.vsOver500)) * 100
        );
        lines.push({
          textJa: `前季 勝率5割以上相手 ${formatWl(split.vsOver500)}（${pct}%）`,
          textEn: `Last season vs .500+ ${formatWl(split.vsOver500)} (${pct}%)`,
        });
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
        lines.push({
          textJa: `今季 ${conf} 上位との${input.isHome ? "ホーム" : "アウェイ"} ${formatWl(venueTop)}`,
          textEn: `This season vs ${conf} top-6 (${input.isHome ? "home" : "road"}) ${formatWl(venueTop)}`,
        });
      }
      if (wlTotal(split.vsUnder500) >= 3) {
        const pct = Math.round(
          (split.vsUnder500.wins / wlTotal(split.vsUnder500)) * 100
        );
        lines.push({
          textJa: `今季 下位相手 ${formatWl(split.vsUnder500)}（${pct}%）`,
          textEn: `This season vs weaker ${formatWl(split.vsUnder500)} (${pct}%)`,
        });
      } else if (wlTotal(split.vsOver500) >= 3) {
        const pct = Math.round(
          (split.vsOver500.wins / wlTotal(split.vsOver500)) * 100
        );
        lines.push({
          textJa: `今季 勝率5割以上相手 ${formatWl(split.vsOver500)}（${pct}%）`,
          textEn: `This season vs .500+ ${formatWl(split.vsOver500)} (${pct}%)`,
        });
      }
    }

    const opps = input.recentOppWinPcts.filter((x) => Number.isFinite(x));
    if (opps.length >= 2 && lines.length < 2) {
      const avg = opps.reduce((a, b) => a + b, 0) / opps.length;
      const n = opps.length;
      if (avg < 0.45) {
        lines.push({
          textJa: `直近${n} · 相手は勝率 5割未満`,
          textEn: `Last ${n} · opponents under .500`,
        });
      } else if (avg >= 0.55) {
        lines.push({
          textJa: `直近${n} · 相手は勝率上位続き`,
          textEn: `Last ${n} · tough recent opponents`,
        });
      }
    }

    const season = findTeamRow(input.seasonRows, input.teamId);
    if (season && season.wins + season.losses > 0 && lines.length < 2) {
      lines.push({
        textJa: `開幕 ${season.wins}-${season.losses}`,
        textEn: `Record ${season.wins}-${season.losses}`,
      });
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
