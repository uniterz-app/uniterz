import assert from "node:assert/strict";
import {
  collectMonthlyRadarStrengths,
  isMonthlyRadarAxisStrength,
  judgeMonthlyAnalysisType,
  type MonthlyRadarStrengthInput,
} from "@/lib/reports/monthlyRadarJudge";

function baseAxis(
  percentile: number,
  extra: Partial<MonthlyRadarStrengthInput["win"]> = {}
): MonthlyRadarStrengthInput["win"] {
  return { percentile, ...extra };
}

function emptyInput(): MonthlyRadarStrengthInput {
  return {
    win: baseAxis(50, { winRate: 0.5 }),
    scorer: baseAxis(50, { scorerHits: 5, scorerMedian: 8 }),
    upset: baseAxis(50, {
      upsetPoints: 10,
      upsetMedian: 20,
      upsetOpportunity: 3,
    }),
    activity: baseAxis(50, { activityRate: 0.4 }),
    consistency: baseAxis(50, { maxLoseStreak: 6 }),
  };
}

// 相対だけ高くても絶対未達なら強みではない
{
  const m = baseAxis(90, { winRate: 0.48 });
  assert.equal(isMonthlyRadarAxisStrength("win", m), false);
}

// 相対∩絶対
{
  const m = baseAxis(90, { winRate: 0.55 });
  assert.equal(isMonthlyRadarAxisStrength("win", m), true);
}

// サンプル未達 → Prospect
assert.equal(
  judgeMonthlyAnalysisType({ strengths: ["win", "upset"], sampleEligible: false }),
  "PROSPECT"
);

// 5 → GOAT
assert.equal(
  judgeMonthlyAnalysisType({
    strengths: ["win", "scorer", "upset", "activity", "consistency"],
    sampleEligible: true,
  }),
  "GOAT"
);

// 4 → Complete
assert.equal(
  judgeMonthlyAnalysisType({
    strengths: ["win", "scorer", "upset", "activity"],
    sampleEligible: true,
  }),
  "COMPLETE_PLAYER"
);

// 3 → All-Rounder
assert.equal(
  judgeMonthlyAnalysisType({
    strengths: ["win", "scorer", "upset"],
    sampleEligible: true,
  }),
  "ALL_ROUNDER"
);

// 2 → dual
assert.equal(
  judgeMonthlyAnalysisType({
    strengths: ["win", "consistency"],
    sampleEligible: true,
  }),
  "HIGH_FLOOR"
);
assert.equal(
  judgeMonthlyAnalysisType({
    strengths: ["upset", "consistency"],
    sampleEligible: true,
  }),
  "CHAOS_ANCHOR"
);

// 1 → single
assert.equal(
  judgeMonthlyAnalysisType({ strengths: ["scorer"], sampleEligible: true }),
  "LASER"
);

// 0 → Prospect
assert.equal(
  judgeMonthlyAnalysisType({ strengths: [], sampleEligible: true }),
  "PROSPECT"
);

// collectStrengths
{
  const input = emptyInput();
  input.win = baseAxis(88, { winRate: 0.63 });
  input.upset = baseAxis(91, {
    upsetPoints: 42,
    upsetMedian: 25,
    upsetOpportunity: 12,
  });
  input.activity = baseAxis(86, { activityRate: 0.6 });
  input.consistency = baseAxis(74, { maxLoseStreak: 3 });
  // scorer stays weak
  const strengths = collectMonthlyRadarStrengths(input);
  assert.deepEqual(strengths, ["win", "upset", "activity", "consistency"]);
  assert.equal(
    judgeMonthlyAnalysisType({ strengths, sampleEligible: true }),
    "COMPLETE_PLAYER"
  );
}

console.log("monthlyRadarJudge: ok");
