/**
 * 自社合成スタメンの監査
 *   npx tsx scripts/audit-wc-lineup-slots.ts
 */

import type { WcSquadPlayer } from "../lib/wc/squadTypes";
import { WC_GENERATED_SQUADS } from "../lib/wc/squads/_generatedSquads";
import { WC_PREDICTED_LINEUPS } from "../lib/wc/squads/_generatedLineups";
import { getFormationLayout } from "../lib/wc/formationLayouts";
import {
  findSourceSlotIndex,
  resolveRawLineup,
  type ResolvedSourceLineup,
} from "../lib/wc/squads/synthesizeLineup";
import { GOAL_LINEUPS } from "../lib/wc/squads/sources/goalLineups";
import { ESPN_LINEUPS } from "../lib/wc/squads/sources/espnLineups";
import { FOUR_FOUR_TWO_LINEUPS } from "../lib/wc/squads/sources/fourFourTwoLineups";

let ROTOWIRE_LINEUPS: typeof GOAL_LINEUPS = [];
try {
  const mod = await import("../lib/wc/squads/sources/rotowireLineups");
  ROTOWIRE_LINEUPS = mod.ROTOWIRE_LINEUPS;
} catch {
  /* empty */
}

const SOURCE_WEIGHTS = {
  goal: 1.0,
  rotowire: 0.95,
  espn: 1.15,
  fourFourTwo: 0.9,
} as const;

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

function posFitScore(slot: string, pos: WcSquadPlayer["pos"]): number {
  const prefs = SLOT_POS_FIT[slot] ?? [pos];
  const idx = prefs.indexOf(pos);
  if (idx === 0) return 3;
  if (idx > 0) return 2;
  if (pos === "MF") return 1;
  return 0;
}

function sourcesForTeam(iso3: string, squad: WcSquadPlayer[]): ResolvedSourceLineup[] {
  const resolved: ResolvedSourceLineup[] = [];
  const goal = GOAL_LINEUPS.find((l) => l.iso3 === iso3);
  if (goal) {
    const r = resolveRawLineup(iso3, squad, goal, "goal", SOURCE_WEIGHTS.goal);
    if (r) resolved.push(r);
  }
  const rw = ROTOWIRE_LINEUPS.find((l) => l.iso3 === iso3);
  if (rw) {
    const r = resolveRawLineup(iso3, squad, rw, "rotowire", SOURCE_WEIGHTS.rotowire);
    if (r) resolved.push(r);
  }
  const espn = ESPN_LINEUPS.find((l) => l.iso3 === iso3);
  if (espn) {
    const r = resolveRawLineup(iso3, squad, espn, "espn", SOURCE_WEIGHTS.espn);
    if (r) resolved.push(r);
  }
  const fft = FOUR_FOUR_TWO_LINEUPS.find((l) => l.iso3 === iso3);
  if (fft) {
    const r = resolveRawLineup(iso3, squad, fft, "fourFourTwo", SOURCE_WEIGHTS.fourFourTwo);
    if (r) resolved.push(r);
  }
  return resolved;
}

type SlotIssue = {
  iso3: string;
  slot: string;
  player: string;
  kind: "no_votes" | "poor_pos_fit" | "duplicate" | "ghost_id";
  detail: string;
};

const issues: SlotIssue[] = [];
let totalSlots = 0;
let cleanSlots = 0;
let singleSourceTeams = 0;

for (const iso3 of Object.keys(WC_GENERATED_SQUADS).sort()) {
  const squad = WC_GENERATED_SQUADS[iso3]!;
  const lineup = WC_PREDICTED_LINEUPS[iso3];
  if (!lineup) continue;

  const sources = sourcesForTeam(iso3, squad);
  if (!sources.length) continue;
  if (sources.length === 1) singleSourceTeams++;

  const layout = getFormationLayout(lineup.formation);
  const name = (id: string) => squad.find((p) => p.id === id)?.name ?? id;
  const ids = lineup.slots.map((s) => s.playerId);

  if (new Set(ids).size !== ids.length) {
    issues.push({
      iso3,
      slot: "-",
      player: "-",
      kind: "duplicate",
      detail: "同一選手が重複",
    });
  }

  for (let slotIdx = 0; slotIdx < 11; slotIdx++) {
    totalSlots++;
    const slotName = layout[slotIdx]!.slot;
    const playerId = lineup.slots[slotIdx]!.playerId;
    const player = squad.find((p) => p.id === playerId);

    if (!player) {
      issues.push({
        iso3,
        slot: slotName,
        player: playerId,
        kind: "ghost_id",
        detail: "名簿に存在しない選手ID",
      });
      continue;
    }

    const votes = new Map<string, number>();
    for (const src of sources) {
      const srcIdx = findSourceSlotIndex(src.formation, lineup.formation, slotIdx);
      if (srcIdx == null) continue;
      const id = src.playerIds[srcIdx]!;
      votes.set(id, (votes.get(id) ?? 0) + src.weight);
    }

    const playerVotes = votes.get(playerId) ?? 0;
    const fit = posFitScore(slotName, player.pos);
    const winner = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];

    if (playerVotes > 0 && fit >= 2 && winner != null && playerId === winner[0]) {
      cleanSlots++;
    }

    if (playerVotes === 0) {
      issues.push({
        iso3,
        slot: slotName,
        player: name(playerId),
        kind: "no_votes",
        detail: "どのソースの票にも入っていない（フォールバック）",
      });
    }

    if (fit === 0) {
      issues.push({
        iso3,
        slot: slotName,
        player: name(playerId),
        kind: "poor_pos_fit",
        detail: `名簿上のポジション ${player.pos} がスロットと不整合`,
      });
    }
  }
}

const byKind = (k: SlotIssue["kind"]) => issues.filter((i) => i.kind === k);
const byTeam = new Map<string, SlotIssue[]>();
for (const issue of issues) {
  const list = byTeam.get(issue.iso3) ?? [];
  list.push(issue);
  byTeam.set(issue.iso3, list);
}

console.log("=== WC スタメン監査（自社合成）===\n");
console.log(`チーム数: ${Object.keys(WC_PREDICTED_LINEUPS).length}`);
console.log(`スロット総数: ${totalSlots}`);
console.log(
  `最多票＋ポジション適合: ${cleanSlots} (${Math.round((cleanSlots / totalSlots) * 100)}%)`,
);
console.log(`ソース1社のみのチーム: ${singleSourceTeams}（参考1社ベース）`);
console.log(`指摘件数: ${issues.length}`);
console.log(`  票なしフォールバック: ${byKind("no_votes").length}`);
console.log(`  名簿外ID: ${byKind("ghost_id").length}`);
console.log(`  重複起用: ${byKind("duplicate").length}`);
console.log(`  ポジション不整合: ${byKind("poor_pos_fit").length}`);
console.log(`  指摘のあるチーム: ${byTeam.size} / 48\n`);

const severe = issues.filter(
  (i) => i.kind === "ghost_id" || i.kind === "duplicate" || i.kind === "no_votes",
);
if (severe.length) {
  console.log("--- 要確認 ---");
  for (const i of severe) {
    console.log(`${i.iso3.toUpperCase()} ${i.slot} ${i.player}: ${i.detail}`);
  }
  console.log();
}

const posOnly = byKind("poor_pos_fit");
if (posOnly.length) {
  console.log("--- 名簿ラベルと戦術ポジションの差 ---");
  for (const i of posOnly.slice(0, 10)) {
    console.log(`${i.iso3.toUpperCase()} ${i.slot} ${i.player}`);
  }
}

if (issues.length === 0) {
  console.log("全スロット問題なし");
}
