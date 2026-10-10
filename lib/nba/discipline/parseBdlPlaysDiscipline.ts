/**
 * BDL play-by-play → 選手ごとの TECH / FLAG / EJECT。
 *
 * - `participants` が空の行は本文の氏名をその試合の box 出場者に照合する
 * - box に居ない名前（コーチ・チーム T）は数えない
 * - Defensive 3-Seconds / Flopping / Delay は NBA のテクニカル数に入らないので除外
 */
import type { BdlGamePlayerRef, BdlPlay } from "@/lib/nba/bdl/fetchBdlPlays";
import { rememberBdlTeamId } from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import type {
  NbaDisciplineEventKind,
  NbaGameDisciplineEvent,
} from "@/lib/nba/discipline/disciplineTypes";

function classifyPlayType(type: string): NbaDisciplineEventKind | "double_tech" | null {
  const t = type.trim().toLowerCase();
  if (t === "technical foul") return "tech";
  if (t === "double technical foul") return "double_tech";
  if (t.startsWith("flagrant foul type")) return "flag";
  if (t === "ejection") return "eject";
  return null;
}

export function normalizeNbaPersonName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'’`-]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 本文から氏名部分を取り出す（double は 2 名） */
function namesFromText(
  kind: NbaDisciplineEventKind | "double_tech",
  text: string
): string[] {
  const s = text.replace(/\s+/g, " ").trim();
  if (kind === "double_tech") {
    const body = s.split(":").slice(1).join(":").trim();
    return body ? body.split(/\s+and\s+/i).map((x) => x.trim()) : [];
  }
  const marker =
    kind === "tech"
      ? /\s*technical foul\b/i
      : kind === "flag"
        ? /\s*flagrant foul\b/i
        : /\s*ejected\b/i;
  const idx = s.search(marker);
  if (idx <= 0) return [];
  return [s.slice(0, idx).trim()];
}

type PlayerIndex = {
  byId: Map<string, BdlGamePlayerRef>;
  byFull: Map<string, BdlGamePlayerRef[]>;
  byLast: Map<string, BdlGamePlayerRef[]>;
};

function buildPlayerIndex(players: readonly BdlGamePlayerRef[]): PlayerIndex {
  const byId = new Map<string, BdlGamePlayerRef>();
  const byFull = new Map<string, BdlGamePlayerRef[]>();
  const byLast = new Map<string, BdlGamePlayerRef[]>();
  for (const p of players) {
    byId.set(p.playerId, p);
    const full = normalizeNbaPersonName(`${p.firstName} ${p.lastName}`);
    const last = normalizeNbaPersonName(p.lastName);
    if (full) byFull.set(full, [...(byFull.get(full) ?? []), p]);
    if (last) byLast.set(last, [...(byLast.get(last) ?? []), p]);
  }
  return { byId, byFull, byLast };
}

function pickUnique(
  list: BdlGamePlayerRef[] | undefined,
  teamId: string | null
): BdlGamePlayerRef | null {
  if (!list?.length) return null;
  if (list.length === 1) return list[0]!;
  if (teamId) {
    const sameTeam = list.filter((p) => p.teamId === teamId);
    if (sameTeam.length === 1) return sameTeam[0]!;
  }
  return null;
}

function resolveByName(
  index: PlayerIndex,
  name: string,
  teamId: string | null
): BdlGamePlayerRef | null {
  const norm = normalizeNbaPersonName(name);
  if (!norm) return null;
  const full = pickUnique(index.byFull.get(norm), teamId);
  if (full) return full;
  const last = norm.split(" ").slice(1).join(" ");
  if (!last) return null;
  return pickUnique(index.byLast.get(last), teamId);
}

export type ParsedGameDiscipline = {
  events: NbaGameDisciplineEvent[];
  unresolved: string[];
  names: Record<string, string>;
};

export function parseBdlPlaysDiscipline(
  plays: readonly BdlPlay[],
  players: readonly BdlGamePlayerRef[]
): ParsedGameDiscipline {
  const index = buildPlayerIndex(players);
  const events: NbaGameDisciplineEvent[] = [];
  const unresolved: string[] = [];
  const names: Record<string, string> = {};

  for (const play of plays) {
    const kind = classifyPlayType(String(play.type ?? ""));
    if (!kind) continue;
    const text = String(play.text ?? "").trim();
    const playTeamId =
      typeof play.team?.id === "number"
        ? rememberBdlTeamId(play.team.id, play.team.abbreviation)
        : null;
    const eventKind: NbaDisciplineEventKind =
      kind === "double_tech" ? "tech" : kind;

    const resolved: BdlGamePlayerRef[] = [];
    const participants = Array.isArray(play.participants)
      ? play.participants.map(String)
      : [];
    for (const pid of participants) {
      const hit = index.byId.get(pid);
      if (hit) resolved.push(hit);
    }
    const expected = kind === "double_tech" ? 2 : 1;
    if (resolved.length < expected) {
      for (const name of namesFromText(kind, text)) {
        // double は相手チームの選手も含むので team で絞らない
        const hit = resolveByName(
          index,
          name,
          kind === "double_tech" ? null : playTeamId
        );
        if (hit && !resolved.some((r) => r.playerId === hit.playerId)) {
          resolved.push(hit);
        }
      }
    }

    if (resolved.length === 0) {
      unresolved.push(`${play.type}: ${text}`);
      continue;
    }
    for (const p of resolved.slice(0, expected)) {
      const teamId = p.teamId ?? playTeamId;
      if (!teamId) {
        unresolved.push(`${play.type}: ${text}`);
        continue;
      }
      events.push({ p: p.playerId, t: teamId, k: eventKind });
      names[p.playerId] = `${p.firstName} ${p.lastName}`.trim();
    }
  }

  return { events, unresolved, names };
}
