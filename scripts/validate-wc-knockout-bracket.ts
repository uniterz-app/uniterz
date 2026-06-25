/**
 * WC ノックアウトブラケット定義の整合性チェック。
 *   npx tsx scripts/validate-wc-knockout-bracket.ts
 */

import {
  WC_BRACKET_PREDICT_MATCH_IDS,
  WC_KNOCKOUT_MATCHES,
  getWcKnockoutMatch,
  listWcR32MatchesForDisplay,
} from "../lib/wc/wc-knockout-bracket";
import {
  WC_BRACKET_LEFT_R16,
  WC_BRACKET_RIGHT_R16,
} from "../lib/wc/wc-bracket-layout";
import { WC_THIRD_PLACE_ANNEX_C } from "../lib/wc/wc-knockout-third-place-annex-data";

let ok = true;

function fail(msg: string) {
  console.error("FAIL:", msg);
  ok = false;
}

if (WC_BRACKET_PREDICT_MATCH_IDS.length !== 31) {
  fail(`expected 31 predict matches, got ${WC_BRACKET_PREDICT_MATCH_IDS.length}`);
}

const left = listWcR32MatchesForDisplay("left");
const right = listWcR32MatchesForDisplay("right");
if (left.length !== 8 || right.length !== 8) {
  fail(`R32 display halves must be 8+8, got ${left.length}+${right.length}`);
}

for (const half of ["left", "right"] as const) {
  const matches = listWcR32MatchesForDisplay(half);
  const indices = matches.map((m) => m.display!.r32Index);
  const sorted = [...indices].sort((a, b) => a - b);
  if (sorted.join() !== "0,1,2,3,4,5,6,7") {
    fail(`${half} r32Index must be 0..7, got ${sorted.join()}`);
  }
}

function assertR16FeedersAdjacent(
  r32Ids: readonly string[],
  r16Ids: readonly string[],
  label: string
) {
  for (const r16Id of r16Ids) {
    const def = getWcKnockoutMatch(r16Id as never);
    if (!def || def.feedsFrom.length !== 2) continue;
    const ia = r32Ids.indexOf(def.feedsFrom[0]);
    const ib = r32Ids.indexOf(def.feedsFrom[1]);
    if (ia < 0 || ib < 0) {
      fail(`${label} ${r16Id}: feeder not in R32 list`);
      continue;
    }
    if (Math.abs(ia - ib) !== 1) {
      fail(
        `${label} ${r16Id}: feeders ${def.feedsFrom.join("/")} not adjacent in display order (indices ${ia},${ib})`
      );
    }
  }
}

const leftR32Ids = left.map((m) => m.id);
const rightR32Ids = right.map((m) => m.id);
assertR16FeedersAdjacent(leftR32Ids, WC_BRACKET_LEFT_R16, "left");
assertR16FeedersAdjacent(rightR32Ids, WC_BRACKET_RIGHT_R16, "right");

for (const m of WC_KNOCKOUT_MATCHES) {
  for (const parent of m.feedsFrom) {
    if (!WC_KNOCKOUT_MATCHES.some((x) => x.id === parent)) {
      fail(`${m.id} references unknown parent ${parent}`);
    }
  }
}

// 全試合がちょうど 1 つの子に繋がる（M103 除く葉以外）
const childCount = new Map<string, number>();
for (const m of WC_KNOCKOUT_MATCHES) {
  for (const p of m.feedsFrom) {
    childCount.set(p, (childCount.get(p) ?? 0) + 1);
  }
}
for (const m of WC_KNOCKOUT_MATCHES) {
  if (m.id === "M103") continue;
  const children = WC_KNOCKOUT_MATCHES.filter((x) =>
    x.feedsFrom.includes(m.id)
  );
  if (m.id === "M104") {
    if (children.length !== 0) fail(`M104 should have no children`);
    continue;
  }
  if (children.length === 0 && m.round !== "R32") {
    fail(`${m.id} has no children`);
  }
}

if (WC_THIRD_PLACE_ANNEX_C.length !== 495) {
  fail(`Annex C rows expected 495, got ${WC_THIRD_PLACE_ANNEX_C.length}`);
}

const keys = new Set(WC_THIRD_PLACE_ANNEX_C.map((r) => r.key));
if (keys.size !== 495) {
  fail(`Annex C duplicate keys: ${495 - keys.size}`);
}

console.log("WC knockout bracket validation:");
console.log(`  predict matches: ${WC_BRACKET_PREDICT_MATCH_IDS.length}`);
console.log(`  R32 left/right: ${left.length}/${right.length}`);
console.log(`  Annex C rows: ${WC_THIRD_PLACE_ANNEX_C.length}`);
console.log(ok ? "\nALL CHECKS PASSED" : "\nISSUES FOUND");
process.exit(ok ? 0 : 1);
