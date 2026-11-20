#!/usr/bin/env node
/**
 * シーズン予想の提出締切が lib と functions で一致しているか確認する。
 * functions は lib を import できないため、締切の値を二重に持っている。
 *
 * 使い方: node scripts/check-season-predict-deadlines.mjs
 * 不一致なら終了コード 1。新シーズンの締切を足したあとに実行する。
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const libPath = resolve(root, "lib/predict/seasonPredictDeadline.ts");
const fnPath = resolve(root, "functions/src/notifications/notifyEveningPredictNudgesCron.ts");

const libSrc = readFileSync(libPath, "utf8");
const fnSrc = readFileSync(fnPath, "utf8");

const blockMatch = libSrc.match(
  /SEASON_PREDICT_SUBMIT_DEADLINE_BY_SEASON[^=]*=\s*\{([\s\S]*?)\n\};/
);
if (!blockMatch) {
  console.error("lib: SEASON_PREDICT_SUBMIT_DEADLINE_BY_SEASON が見つかりません");
  process.exit(1);
}
const libDeadlines = [...blockMatch[1].matchAll(/Date\.parse\(\s*"([^"]+)"\s*\)/g)].map(
  (m) => m[1]
);

const fnMatch = fnSrc.match(
  /SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS\s*=\s*Date\.parse\(\s*"([^"]+)"\s*\)/
);
if (!fnMatch) {
  console.error("functions: SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS が見つかりません");
  process.exit(1);
}
const fnDeadline = fnMatch[1];

if (!libDeadlines.includes(fnDeadline)) {
  console.error(
    `締切が不一致: functions=${fnDeadline} / lib=${libDeadlines.join(", ") || "(なし)"}`
  );
  console.error("lib/predict/seasonPredictDeadline.ts と functions を揃えてください。");
  process.exit(1);
}

console.log(`OK: 締切は一致しています（${fnDeadline}）`);
