/**
 * 同時キックオフスロット連勝の単体テスト（tsx で実行）
 *   npx tsx lib/wc/wcSlotStreakReplay.test.ts
 */

import assert from "node:assert/strict";
import { computeWcSlotStreakOutcome } from "./wcKickoffSlot";
import {
  buildTimelineUnits,
  buildWcGamesByKickoff,
  replayFootballActiveBeforeKickoff,
  replayFootballStreakWithSlots,
} from "./wcSlotStreakReplay";

function testComputeAllWin() {
  const result = computeWcSlotStreakOutcome(3, [
    { gameId: "wc-b", didWin: true },
    { gameId: "wc-a", didWin: true },
  ]);
  assert.equal(result.perGameActiveWinStreak.get("wc-a"), 4);
  assert.equal(result.perGameActiveWinStreak.get("wc-b"), 5);
  assert.equal(result.finalActiveWinStreak, 5);
}

function testComputeAnyLoss() {
  const result = computeWcSlotStreakOutcome(4, [
    { gameId: "wc-a", didWin: true },
    { gameId: "wc-b", didWin: false },
  ]);
  assert.equal(result.perGameActiveWinStreak.get("wc-a"), 0);
  assert.equal(result.perGameActiveWinStreak.get("wc-b"), 0);
  assert.equal(result.finalActiveWinStreak, 0);
  assert.equal(result.finalCurF, -1);
}

function testReplayTwoSlots() {
  const gamesByKickoff = buildWcGamesByKickoff([
    { gameId: "g1a", kickoffMs: 100, league: "wc" },
    { gameId: "g1b", kickoffMs: 100, league: "wc" },
    { gameId: "g2a", kickoffMs: 200, league: "wc" },
    { gameId: "g2b", kickoffMs: 200, league: "wc" },
  ]);

  const posts = [
    { gameId: "g1a", isWin: true, kickoffMs: 100 },
    { gameId: "g1b", isWin: true, kickoffMs: 100 },
    { gameId: "g2a", isWin: true, kickoffMs: 200 },
    { gameId: "g2b", isWin: true, kickoffMs: 200 },
  ];

  const units = buildTimelineUnits(posts, gamesByKickoff);
  const replay = replayFootballStreakWithSlots(units);
  assert.equal(replay.perGameActive.get("g1a"), 1);
  assert.equal(replay.perGameActive.get("g1b"), 2);
  assert.equal(replay.perGameActive.get("g2a"), 3);
  assert.equal(replay.perGameActive.get("g2b"), 4);
  assert.equal(replay.activeWinStreakFootball, 4);
}

function testEntryBeforeKickoff() {
  const gamesByKickoff = buildWcGamesByKickoff([
    { gameId: "g1a", kickoffMs: 100, league: "wc" },
    { gameId: "g1b", kickoffMs: 100, league: "wc" },
    { gameId: "g2a", kickoffMs: 200, league: "wc" },
    { gameId: "g2b", kickoffMs: 200, league: "wc" },
  ]);

  const posts = [
    { gameId: "g1a", isWin: true, kickoffMs: 100 },
    { gameId: "g1b", isWin: true, kickoffMs: 100 },
    { gameId: "solo", isWin: true, kickoffMs: 150 },
  ];

  const entry = replayFootballActiveBeforeKickoff(posts, gamesByKickoff, 200);
  assert.equal(entry, 3);
}

testComputeAllWin();
testComputeAnyLoss();
testReplayTwoSlots();
testEntryBeforeKickoff();
console.log("✅ wcSlotStreakReplay tests passed");
