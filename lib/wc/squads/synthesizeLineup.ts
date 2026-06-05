// lib/wc/squads/synthesizeLineup.ts
//
// 複数メディアの予想XIを参考に、自社編集の予想スタメンを生成する。
// いずれか1社の予想をそのまま転載せず、スロット単位で加重投票して11人を決める。

import {
  buildLineupSlots,
  getFormationLayout,
  type FormationSlotTemplate,
} from "../formationLayouts";
import type { WcFormationCode, WcLineupSlot, WcSquadPlayer } from "../squadTypes";
import { matchPlayer } from "./lineupMatching";
import type { RawSourceLineup } from "./sources/goalLineups";

export type ResolvedSourceLineup = {
  sourceId: string;
  weight: number;
  formation: WcFormationCode;
  playerIds: string[];
};

export type SynthesisResult = {
  formation: WcFormationCode;
  slots: WcLineupSlot[];
  sourceCount: number;
};

const KEY_PLAYER_BOOST = 0.4;
const CAPTAIN_BOOST = 0.25;

const SLOT_POS_FIT: Record<string, WcSquadPlayer["pos"][]> = {
  GK: ["GK"],
  LB: ["DF"],
  CB: ["DF"],
  RB: ["DF"],
  LWB: ["DF", "MF"],
  RWB: ["DF", "MF"],
  CM: ["MF", "FW"],
  DM: ["MF", "DF"],
  AM: ["MF", "FW"],
  LM: ["MF", "FW", "DF"],
  RM: ["MF", "FW", "DF"],
  LW: ["FW", "MF"],
  RW: ["FW", "MF"],
  ST: ["FW"],
};

/** フォーメーション間で同じ役割とみなすスロット群 */
const SLOT_ROLE_GROUPS: string[][] = [
  ["GK"],
  ["CB"],
  ["LB", "LWB"],
  ["RB", "RWB"],
  ["LM", "LWB"],
  ["RM", "RWB"],
  ["LW", "LM", "AM"],
  ["RW", "RM", "AM"],
  ["CM", "DM"],
  ["AM", "LW", "RW"],
  ["ST"],
];

const SLOT_EQUIV = buildSlotEquivalence();

function buildSlotEquivalence(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const group of SLOT_ROLE_GROUPS) {
    for (const slot of group) {
      const set = map.get(slot) ?? new Set<string>([slot]);
      for (const alias of group) set.add(alias);
      map.set(slot, set);
    }
  }
  return map;
}

function slotsEquivalent(a: string, b: string): boolean {
  if (a === b) return true;
  return SLOT_EQUIV.get(a)?.has(b) ?? false;
}

function posFit(slot: string, pos: WcSquadPlayer["pos"]): number {
  const prefs = SLOT_POS_FIT[slot] ?? [pos];
  const idx = prefs.indexOf(pos);
  if (idx === 0) return 30;
  if (idx > 0) return 15;
  if (pos === "MF") return 8;
  return 0;
}

/** CB#2 のように同名スロットの何番目かを返す */
function slotOccurrence(layout: FormationSlotTemplate[], index: number): number {
  const name = layout[index]!.slot;
  let count = 0;
  for (let i = 0; i <= index; i++) {
    if (layout[i]!.slot === name) count++;
  }
  return count - 1;
}

/** 採用フォーメーションの slotIdx に対応するソース側の playerIds インデックス */
export function findSourceSlotIndex(
  srcFormation: WcFormationCode,
  targetFormation: WcFormationCode,
  targetIdx: number,
): number | null {
  if (srcFormation === targetFormation) return targetIdx;

  const targetLayout = getFormationLayout(targetFormation);
  const srcLayout = getFormationLayout(srcFormation);
  const targetSlot = targetLayout[targetIdx]!.slot;
  const targetOcc = slotOccurrence(targetLayout, targetIdx);

  let seen = 0;
  for (let i = 0; i < srcLayout.length; i++) {
    if (!slotsEquivalent(targetSlot, srcLayout[i]!.slot)) continue;
    if (seen === targetOcc) return i;
    seen++;
  }

  return null;
}

/** セミコロン区切りの行グループからフォーメーションを推定 */
export function inferFormationFromPlayerGroups(
  groups: string[][],
): WcFormationCode {
  if (groups.length < 2) return "4-3-3";
  const df = groups[1]?.length ?? 0;
  const midGroup = groups[2]?.length ?? 0;
  const fwdGroup = groups[groups.length - 1]?.length ?? 0;
  const totalMid = groups.slice(2, -1).reduce((s, g) => s + g.length, 0);
  const fw = fwdGroup;

  if (df === 5 && totalMid === 4 && fw === 1) return "5-4-1";
  if (df === 4 && midGroup === 1 && (groups[3]?.length ?? 0) === 4 && fw === 1)
    return "4-1-4-1";
  if (df === 4 && midGroup === 2 && (groups[3]?.length ?? 0) === 3 && fw === 1)
    return "4-2-3-1";
  if (df === 4 && totalMid === 4 && fw === 2) return "4-4-2";
  if (df === 4 && totalMid === 3 && fw === 3) return "4-3-3";
  if (df === 3 && totalMid === 5 && fw === 2) return "3-5-2";
  if (df === 3 && totalMid === 4 && fw === 3) return "3-4-3";
  if (df === 3 && totalMid === 4 && fw === 1 && groups.length === 4)
    return "3-4-2-1";
  if (df === 5 && totalMid === 3 && fw === 2) return "5-3-2";
  if (df === 3 && midGroup === 4 && fw === 1) return "3-4-2-1";
  return "4-3-3";
}

export function resolveRawLineup(
  iso3: string,
  squad: WcSquadPlayer[],
  raw: RawSourceLineup,
  sourceId: string,
  weight: number,
): ResolvedSourceLineup | null {
  const layout = getFormationLayout(raw.formation);
  if (layout.length !== 11 || raw.players.length !== 11) return null;

  const used = new Set<string>();
  const ids: string[] = [];
  for (let i = 0; i < raw.players.length; i++) {
    const id = matchPlayer(iso3, squad, raw.players[i]!, {
      slot: layout[i]?.slot,
      usedIds: used,
    });
    if (!id || used.has(id)) return null;
    used.add(id);
    ids.push(id);
  }

  return {
    sourceId,
    weight,
    formation: raw.formation,
    playerIds: ids,
  };
}

function pickFormation(resolved: ResolvedSourceLineup[]): WcFormationCode {
  const votes = new Map<WcFormationCode, number>();
  for (const src of resolved) {
    votes.set(src.formation, (votes.get(src.formation) ?? 0) + src.weight);
  }
  let best: WcFormationCode = "4-3-3";
  let bestScore = -1;
  for (const [f, score] of votes) {
    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }
  return best;
}

function buildGlobalScores(
  sources: ResolvedSourceLineup[],
  squad: WcSquadPlayer[],
  keyPlayerIds: Set<string>,
): Map<string, number> {
  const scores = new Map<string, number>();
  for (const src of sources) {
    for (const id of src.playerIds) {
      scores.set(id, (scores.get(id) ?? 0) + src.weight);
    }
  }
  for (const p of squad) {
    let boost = 0;
    if (keyPlayerIds.has(p.id)) boost += KEY_PLAYER_BOOST;
    if (p.captain) boost += CAPTAIN_BOOST;
    if (boost > 0) scores.set(p.id, (scores.get(p.id) ?? 0) + boost);
  }
  return scores;
}

function scoreCandidate(
  slot: string,
  playerId: string,
  vote: number,
  squad: WcSquadPlayer[],
  keyPlayerIds: Set<string>,
): number {
  const player = squad.find((p) => p.id === playerId);
  const fit = player ? posFit(slot, player.pos) : 0;
  return (
    vote * 10 +
    fit * 0.05 +
    (keyPlayerIds.has(playerId) ? KEY_PLAYER_BOOST : 0) +
    (player?.captain ? CAPTAIN_BOOST : 0)
  );
}

/** 全スロットの票をまとめて割り当て（同一選手の複数スロット競合を票の強さで解決） */
function pickElevenBySlotConsensus(
  formation: WcFormationCode,
  sources: ResolvedSourceLineup[],
  squad: WcSquadPlayer[],
  globalScores: Map<string, number>,
  keyPlayerIds: Set<string>,
): string[] | null {
  const layout = getFormationLayout(formation);
  const slotVotes = new Map<number, Map<string, number>>();

  for (let slotIdx = 0; slotIdx < layout.length; slotIdx++) {
    const votes = new Map<string, number>();
    for (const src of sources) {
      const srcIdx = findSourceSlotIndex(src.formation, formation, slotIdx);
      if (srcIdx == null) continue;
      const id = src.playerIds[srcIdx];
      if (!id) continue;
      votes.set(id, (votes.get(id) ?? 0) + src.weight);
    }
    slotVotes.set(slotIdx, votes);
  }

  type Candidate = { slotIdx: number; playerId: string; total: number };
  const candidates: Candidate[] = [];
  for (const [slotIdx, votes] of slotVotes) {
    const slot = layout[slotIdx]!.slot;
    for (const [playerId, vote] of votes) {
      if (!squad.some((p) => p.id === playerId)) continue;
      candidates.push({
        slotIdx,
        playerId,
        total: scoreCandidate(slot, playerId, vote, squad, keyPlayerIds),
      });
    }
  }
  candidates.sort((a, b) => b.total - a.total);

  const assignedSlot = new Map<number, string>();
  const usedPlayers = new Set<string>();
  for (const c of candidates) {
    if (assignedSlot.has(c.slotIdx) || usedPlayers.has(c.playerId)) continue;
    assignedSlot.set(c.slotIdx, c.playerId);
    usedPlayers.add(c.playerId);
  }

  const result: string[] = [];
  for (let slotIdx = 0; slotIdx < layout.length; slotIdx++) {
    let picked = assignedSlot.get(slotIdx) ?? null;
    if (!picked) {
      const slotTpl = layout[slotIdx]!;
      let bestScore = -Infinity;
      for (const player of squad) {
        if (usedPlayers.has(player.id)) continue;
        const total =
          (globalScores.get(player.id) ?? 0) + posFit(slotTpl.slot, player.pos);
        if (total > bestScore) {
          bestScore = total;
          picked = player.id;
        }
      }
    }
    if (!picked) return null;
    usedPlayers.add(picked);
    result.push(picked);
  }

  return result;
}

export function synthesizeLineup(
  squad: WcSquadPlayer[],
  sources: ResolvedSourceLineup[],
  keyPlayerIds: Set<string>,
): SynthesisResult | null {
  if (!sources.length) return null;

  const formation = pickFormation(sources);
  const globalScores = buildGlobalScores(sources, squad, keyPlayerIds);
  const playerIds = pickElevenBySlotConsensus(
    formation,
    sources,
    squad,
    globalScores,
    keyPlayerIds,
  );
  if (!playerIds || playerIds.length !== 11) return null;

  const slots = buildLineupSlots(
    formation,
    playerIds as [
      string, string, string, string, string, string,
      string, string, string, string, string,
    ],
  );

  return { formation, slots, sourceCount: sources.length };
}
