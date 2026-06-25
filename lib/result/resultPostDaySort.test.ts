import assert from "node:assert/strict";
import {
  compareResultPostsForDayList,
  sortResultPostsForDisplay,
} from "./resultPostDaySort";
import type { PostWithMillis } from "./result-page-data";

function post(
  id: string,
  gameId: string,
  startAtMillis: number,
  activeWinStreak?: number
): PostWithMillis {
  return {
    id,
    gameId,
    startAtMillis,
    stats:
      activeWinStreak == null
        ? undefined
        : {
            pointsV3Detail: { activeWinStreak },
          },
  } as PostWithMillis;
}

const kickoff = 1_000_000;

const mar = post("1", "wc-2026-C-mar-hti", kickoff, 5);
const sct = post("2", "wc-2026-C-sct-bra", kickoff, 6);
const later = post("3", "wc-2026-B-bih-qat", kickoff + 60_000, 1);

assert(compareResultPostsForDayList(sct, mar) < 0, "same kickoff: higher streak first");
assert(compareResultPostsForDayList(mar, sct) > 0, "same kickoff: lower streak second");
assert(compareResultPostsForDayList(later, mar) < 0, "later kickoff above earlier");

const slot2a = post("4", "wc-2026-B-bih-qat", kickoff - 60_000, 3);
const slot2b = post("5", "wc-2026-B-che-can", kickoff - 60_000, 4);
const sorted = sortResultPostsForDisplay([slot2a, slot2b, mar, sct]);
assert.deepEqual(
  sorted.map((p) => readStreak(p)),
  [6, 5, 4, 3],
  "two concurrent slots: 6,5 then 4,3 top to bottom"
);

function readStreak(p: PostWithMillis): number {
  return (p.stats as { pointsV3Detail?: { activeWinStreak?: number } })?.pointsV3Detail
    ?.activeWinStreak as number;
}

console.log("✅ resultPostDaySort tests passed");
