import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import type {
  NbaOffseasonMove,
  NbaOffseasonMoveKind,
  NbaPlayerSeasonFinalTeam,
  NbaTeamOffseasonMovesDoc,
} from "./offseasonMovesTypes";

export type BuildTeamOffseasonMovesInput = {
  seasonKey: string;
  priorSeasonKey: string;
  /** 前季最終所属（playerId → team） */
  priorFinal: Record<string, NbaPlayerSeasonFinalTeam>;
  /** 今季ロスター（teamId → players） */
  currentRosters: Record<string, { players: readonly NbaRosterPlayer[] }>;
  /** 今季キャップヒット（playerId → $） */
  salaryByPlayer: ReadonlyMap<string, number>;
  /** 今季 curated デッド保有チーム（playerId → teamId） */
  deadTeamByPlayer: ReadonlyMap<string, string>;
};

function seasonStartYear(seasonKey: string): number {
  const y = Number.parseInt(seasonKey.slice(0, 4), 10);
  return Number.isFinite(y) ? y : 0;
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}

const KIND_ORDER: Record<NbaOffseasonMoveKind, number> = {
  draft: 0,
  acquired: 1,
  signed: 2,
  departed: 0,
  waived: 1,
  unsigned: 2,
};

function sortMoves(a: NbaOffseasonMove, b: NbaOffseasonMove): number {
  const k = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  if (k !== 0) return k;
  if (a.kind === "draft" && b.kind === "draft") {
    const ra = (a.draftRound ?? 9) * 100 + (a.draftNumber ?? 99);
    const rb = (b.draftRound ?? 9) * 100 + (b.draftNumber ?? 99);
    if (ra !== rb) return ra - rb;
  }
  if (a.isTwoWay !== b.isTwoWay) return a.isTwoWay ? 1 : -1;
  const s = (b.salary ?? 0) - (a.salary ?? 0);
  if (s !== 0) return s;
  return a.lastName.localeCompare(b.lastName);
}

export function buildTeamOffseasonMoves(
  input: BuildTeamOffseasonMovesInput
): NbaTeamOffseasonMovesDoc {
  const draftYear = seasonStartYear(input.seasonKey);

  const currentTeamOf = new Map<string, string>();
  const currentPlayer = new Map<string, NbaRosterPlayer>();
  for (const [teamId, team] of Object.entries(input.currentRosters)) {
    for (const p of team.players) {
      const id = String(p.id);
      currentTeamOf.set(id, teamId);
      currentPlayer.set(id, p);
    }
  }

  const teams: NbaTeamOffseasonMovesDoc["teams"] = {};
  const ensure = (teamId: string) =>
    (teams[teamId] ??= { incoming: [], outgoing: [] });
  for (const teamId of Object.keys(input.currentRosters)) ensure(teamId);

  for (const [teamId, team] of Object.entries(input.currentRosters)) {
    for (const p of team.players) {
      const id = String(p.id);
      const prior = input.priorFinal[id];
      if (prior?.teamId === teamId) continue;
      const isDraft =
        !prior && typeof p.draftYear === "number" && p.draftYear === draftYear;
      ensure(teamId).incoming.push({
        playerId: id,
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        kind: isDraft ? "draft" : prior ? "acquired" : "signed",
        otherTeamId: prior?.teamId ?? null,
        draftRound: isDraft ? numOrNull(p.draftRound) : null,
        draftNumber: isDraft ? numOrNull(p.draftNumber) : null,
        isTwoWay: p.isTwoWay === true,
        salary: input.salaryByPlayer.get(id) ?? null,
      });
    }
  }

  for (const [id, prior] of Object.entries(input.priorFinal)) {
    const fromTeam = prior.teamId;
    const nowTeam = currentTeamOf.get(id) ?? null;
    if (nowTeam === fromTeam) continue;
    const deadTeam = input.deadTeamByPlayer.get(id) ?? null;
    const waivedHere = deadTeam === fromTeam;
    /** 前季末 A → オフに B へトレード → B がウェーブ（B デッド）: A から見れば B へ移籍 */
    const toTeam = deadTeam && !waivedHere ? deadTeam : nowTeam;
    const cur = currentPlayer.get(id);
    ensure(fromTeam).outgoing.push({
      playerId: id,
      firstName: cur?.firstName ?? prior.firstName,
      lastName: cur?.lastName ?? prior.lastName,
      kind: waivedHere ? "waived" : toTeam ? "departed" : "unsigned",
      otherTeamId: toTeam,
      draftRound: null,
      draftNumber: null,
      isTwoWay: cur?.isTwoWay === true,
      salary:
        nowTeam && toTeam === nowTeam
          ? input.salaryByPlayer.get(id) ?? null
          : null,
    });
  }

  /** オフに獲得 → そのままウェーブ（前季は他球団）: デッド保有球団の OUT に載せる */
  for (const [id, deadTeam] of input.deadTeamByPlayer) {
    const prior = input.priorFinal[id];
    if (!prior || prior.teamId === deadTeam) continue;
    const bucket = ensure(deadTeam);
    if (bucket.outgoing.some((m) => m.playerId === id)) continue;
    const cur = currentPlayer.get(id);
    bucket.outgoing.push({
      playerId: id,
      firstName: cur?.firstName ?? prior.firstName,
      lastName: cur?.lastName ?? prior.lastName,
      kind: "waived",
      otherTeamId: currentTeamOf.get(id) ?? null,
      draftRound: null,
      draftNumber: null,
      isTwoWay: false,
      salary: null,
    });
  }

  for (const bucket of Object.values(teams)) {
    bucket.incoming.sort(sortMoves);
    bucket.outgoing.sort(sortMoves);
  }

  return {
    seasonKey: input.seasonKey,
    priorSeasonKey: input.priorSeasonKey,
    teams,
  };
}
