/**
 * エース／キー選手欠場レコードと injury の突合。
 * 表示: 欠場時 W–L + 平均得点–平均失点。
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

/** Insight に出す最低サンプル */
export const ACE_OUT_MIN_GAMES = 3;

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

export function aceOutSuffix(
  player: NbaAceOutPlayerSplit,
  phaseLabel: "前季" | "今季",
  _team?: Pick<NbaTeamAceOutRecord, "teamPtsFor" | "teamPtsAgainst"> | null
): { ja: string; en: string } {
  const wl = formatWl(player.whenOut);
  const ptsFor = player.whenOutPtsFor;
  const ptsAgainst = player.whenOutPtsAgainst;
  if (
    player.gamesOut >= ACE_OUT_MIN_GAMES &&
    Number.isFinite(ptsFor) &&
    Number.isFinite(ptsAgainst) &&
    (ptsFor > 0 || ptsAgainst > 0)
  ) {
    return {
      ja: `${phaseLabel}欠場時 ${wl} · ${ptsFor}-${ptsAgainst}`,
      en: `without him ${phaseLabel === "前季" ? "last yr " : ""}${wl} · ${ptsFor}-${ptsAgainst}`.trim(),
    };
  }
  return {
    ja: `${phaseLabel}欠場時 ${wl}`,
    en: `without him ${phaseLabel === "前季" ? "last yr " : ""}${wl}`.trim(),
  };
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
