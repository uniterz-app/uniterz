/**
 * エース／キー選手欠場レコードと injury の突合。
 * 表示: 欠場時 W–L + 平均得点–平均失点 + 通算比 OFF/DEF 差分。
 * （poss が無いので真正 ORTG/DRTG ではなく得点ベースの差分）
 */
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type {
  NbaAceOutPlayerSplit,
  NbaTeamAceOutRecord,
  NbaTeamAceOutRecordsBundle,
} from "@/lib/nba/insights/aceOutRecordTypes";
import {
  formatWl,
  wlTotal,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import type { UiStrings } from "@/lib/i18n/ui";

/** Insight に出す最低サンプル */
export const ACE_OUT_MIN_GAMES = 3;

/** 通算比で差分を出す最低 |Δ|（得点） */
export const ACE_OUT_DELTA_MIN = 1;

function playersOfTeam(
  bundle: NbaTeamAceOutRecordsBundle,
  teamId: string
): NbaAceOutPlayerSplit[] {
  const rec = bundle.teams[teamId];
  if (!rec) return [];
  if (Array.isArray(rec.players) && rec.players.length > 0) return rec.players;
  return [
    {
      playerId: rec.acePlayerId,
      playerName: rec.acePlayerName,
      ppg: rec.acePpg,
      gp: rec.aceGp,
      source: "auto",
      whenOut: rec.whenOut,
      whenOutHome: rec.whenOutHome,
      whenOutAway: rec.whenOutAway,
      gamesOut: rec.gamesOut,
      whenOutPtsFor: rec.whenOutPtsFor ?? 0,
      whenOutPtsAgainst: rec.whenOutPtsAgainst ?? 0,
    },
  ];
}

export function findAceOutPlayerForInjury(
  bundle: NbaTeamAceOutRecordsBundle | null | undefined,
  teamId: string,
  injury: NbaTeamInjuryEntry
): NbaAceOutPlayerSplit | null {
  if (!bundle) return null;
  const want = String(injury.playerId ?? "").trim();
  if (!want) return null;
  const hit = playersOfTeam(bundle, teamId).find(
    (p) => String(p.playerId) === want
  );
  if (!hit) return null;
  if (wlTotal(hit.whenOut) < ACE_OUT_MIN_GAMES) return null;
  return hit;
}

/** @deprecated 名前互換 */
export function findAceOutRecordForInjury(
  bundle: NbaTeamAceOutRecordsBundle | null | undefined,
  teamId: string,
  injury: NbaTeamInjuryEntry
): NbaAceOutPlayerSplit | null {
  return findAceOutPlayerForInjury(bundle, teamId, injury);
}

/** 前季（opening）か今季（early / full）か */
export type AceOutPhase = "prior" | "current";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatSignedDelta(n: number): string {
  const v = round1(n);
  if (v > 0) return `+${v}`;
  return String(v);
}

/**
 * 欠場時得点–失点 vs 通算。OFF 低下 / DEF 悪化（失点増）を出す。
 * 真正な ORTG/DRTG ではない（poss 未集計）。
 */
export function aceOutOffDefDeltas(
  player: NbaAceOutPlayerSplit,
  team?: Pick<NbaTeamAceOutRecord, "teamPtsFor" | "teamPtsAgainst"> | null
): { off: number; def: number } | null {
  if (!team) return null;
  const teamFor = team.teamPtsFor;
  const teamAgainst = team.teamPtsAgainst;
  if (
    !Number.isFinite(teamFor) ||
    !Number.isFinite(teamAgainst) ||
    (teamFor <= 0 && teamAgainst <= 0)
  ) {
    return null;
  }
  const ptsFor = player.whenOutPtsFor;
  const ptsAgainst = player.whenOutPtsAgainst;
  if (!Number.isFinite(ptsFor) || !Number.isFinite(ptsAgainst)) return null;
  return {
    off: round1(ptsFor - teamFor),
    def: round1(ptsAgainst - teamAgainst),
  };
}

function formatAceOutBody(
  player: NbaAceOutPlayerSplit,
  team?: Pick<NbaTeamAceOutRecord, "teamPtsFor" | "teamPtsAgainst"> | null
): string {
  const wl = formatWl(player.whenOut);
  const ptsFor = player.whenOutPtsFor;
  const ptsAgainst = player.whenOutPtsAgainst;
  const hasPts =
    player.gamesOut >= ACE_OUT_MIN_GAMES &&
    Number.isFinite(ptsFor) &&
    Number.isFinite(ptsAgainst) &&
    (ptsFor > 0 || ptsAgainst > 0);

  if (!hasPts) return wl;

  const parts = [`${wl} · ${ptsFor}-${ptsAgainst}`];
  const deltas = aceOutOffDefDeltas(player, team);
  if (deltas) {
    const showOff = Math.abs(deltas.off) >= ACE_OUT_DELTA_MIN;
    const showDef = Math.abs(deltas.def) >= ACE_OUT_DELTA_MIN;
    if (showOff || showDef) {
      const bits: string[] = [];
      if (showOff) bits.push(`OFF ${formatSignedDelta(deltas.off)}`);
      if (showDef) bits.push(`DEF ${formatSignedDelta(deltas.def)}`);
      parts.push(bits.join(" · "));
    }
  }
  return parts.join(" · ");
}

/** 「〜欠場時 W–L」の 7 言語テンプレ */
function aceOutWhenOutText(phase: AceOutPhase, body: string): UiStrings {
  const prior = phase === "prior";
  return {
    ja: `${prior ? "前季" : "今季"}欠場時 ${body}`,
    en: `without him ${prior ? "last yr " : ""}${body}`
      .replace(/\s+/g, " ")
      .trim(),
    ko: `${prior ? "지난 시즌" : "이번 시즌"} 결장 시 ${body}`,
    zh: `${prior ? "上季" : "本季"}缺阵时 ${body}`,
    es: `sin él ${prior ? "temp. pasada " : ""}${body}`
      .replace(/\s+/g, " ")
      .trim(),
    pt: `sem ele ${prior ? "temp. passada " : ""}${body}`
      .replace(/\s+/g, " ")
      .trim(),
    fr: `sans lui ${prior ? "saison dern. " : ""}${body}`
      .replace(/\s+/g, " ")
      .trim(),
  };
}

export function aceOutSuffix(
  player: NbaAceOutPlayerSplit,
  phase: AceOutPhase,
  team?: Pick<NbaTeamAceOutRecord, "teamPtsFor" | "teamPtsAgainst"> | null
): UiStrings {
  return aceOutWhenOutText(phase, formatAceOutBody(player, team));
}

export function findAceOutForInjuryWithTeam(
  bundle: NbaTeamAceOutRecordsBundle | null | undefined,
  teamId: string,
  injury: NbaTeamInjuryEntry
): {
  player: NbaAceOutPlayerSplit;
  team: NbaTeamAceOutRecord;
} | null {
  if (!bundle) return null;
  const team = bundle.teams[teamId];
  if (!team) return null;
  const player = findAceOutPlayerForInjury(bundle, teamId, injury);
  if (!player) return null;
  return { player, team };
}
