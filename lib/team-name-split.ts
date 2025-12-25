// lib/team-name-split.ts
import { teamNameRules as teamNameRulesB1 } from "./team-names";
import { teamNameRulesJ1 } from "./team-names-j1";
import { teamNameRulesNBA } from "./team-names-nba";
import { teamNameRulesPL } from "./team-names-pl";

// 正規化
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * リーグ別にチーム名を 1行目 / 2行目 に分解する
 */
export function splitTeamNameByLeague(
  league: "bj" | "j1" | "nba" | "pl",
  rawName: string
): [string, string] {
  const name = norm(rawName);

  // ▼ リーグごとにルール表を決定
  let rules: Record<string, { line1: string; line2: string }> | null = null;

  if (league === "bj") {
    rules = teamNameRulesB1;
  } else if (league === "j1") {
    rules = teamNameRulesJ1;
  } else if (league === "nba") {
    rules = teamNameRulesNBA;
  } else if (league === "pl") {
    rules = teamNameRulesPL;
  } else {
    // 将来リーグ増やした時の安全策
    return [name, "\u00A0"];
  }

  // ▼ 1) 完全一致したらそのルールを使う
  const rule = rules[name];
  if (rule) return [rule.line1, rule.line2];

  // ▼ 2) 自動分割（空白・中黒・ハイフンなど）
  const m = name.match(/^(.*?)[\s・·･\-–—]+(.*)$/u);
  if (m) return [m[1], m[2]];

  // ▼ 3) どうしても分割できない場合の fallback
  return [name, "\u00A0"];
}
