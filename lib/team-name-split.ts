// lib/team-name-split.ts
import { teamNameRules as teamNameRulesB1 } from "./team-names";      // Bリーグのルール
import { teamNameRulesJ1 } from "./team-names-j1";                    // J1のルール

// 念のための正規化（全角/半角の違いによる事故を減らす）
const norm = (s: string) =>
  s.replace(/\s+/g, " ").trim(); // まずは空白だけ簡易統一（必要に応じて拡張）

/** リーグを見て、チーム名を [1行目, 2行目] に分割して返す */
export function splitTeamNameByLeague(
  league: "bj" | "j",
  rawName: string
): [string, string] {
  const name = norm(rawName);

  // 1) ルール表を選ぶ
  const rules = league === "j" ? teamNameRulesJ1 : teamNameRulesB1;

  // 2) 完全一致でヒットしたらそのまま返す
  const rule = rules[name];
  if (rule) return [rule.line1, rule.line2];

  // 3) ヒットしない時の予備（空白・中黒などでなんとなく分ける）
  //    例: 「FC 町田ゼルビア」→ ["FC", "町田ゼルビア"]
  const m = name.match(/^(.*?)[\s・·･\-–—]+(.*)$/u);
  if (m) return [m[1], m[2]];

  // 4) ほんとに何も分けられない時は2行目を空白で返す（高さを固定するため非改行スペース）
  return [name, "\u00A0"];
}
