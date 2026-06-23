// lib/team-name-split.ts
import { teamNameRules as teamNameRulesB1 } from "./team-names";
import { teamNameRulesJ1 } from "./team-names-j1";
import { teamNameRulesNBA } from "./team-names-nba";
import { teamNameRulesPL } from "./team-names-pl";
import type { League } from "./leagues";

// 正規化
const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/**
 * リーグ別にチーム名を 1行目 / 2行目 に分解する
 *
 * 将来リーグを増やしたときは else if を追加。未対応リーグは自動分割→fallback。
 */
export function splitTeamNameByLeague(
  league: League,
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

/** 表示用：line2 が nbsp プレースホルダだけのときは line1 のみ（中央揃えの見た目ずれ防止） */
export function joinTeamNameLines(l1: string, l2: string): string {
  const second = l2.replace(/\u00A0/g, " ").trim();
  if (!second) return l1.trim();
  return `${l1} ${second}`.trim();
}

/** モバイル WC 一覧 — この文字数超のみ 2 行（短い国名は 1 行・nowrap） */
const WC_MOBILE_LIST_WRAP_MIN_LEN = 13;

export type WcMobileListNameLayout =
  | { singleLine: true; text: string }
  | { singleLine: false; line1: string; line2: string };

/** モバイル WC 試合カード — 長い国名だけ 2 行に分割 */
export function splitWcCountryNameForMobileList(
  rawName: string
): WcMobileListNameLayout {
  const name = norm(rawName);
  if (name.length <= WC_MOBILE_LIST_WRAP_MIN_LEN) {
    return { singleLine: true, text: name };
  }

  const amp = name.match(/^(.+?\s&)\s+(.+)$/u);
  if (amp) {
    return {
      singleLine: false,
      line1: amp[1].trim(),
      line2: amp[2].trim(),
    };
  }

  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    return {
      singleLine: false,
      line1: words.slice(0, mid).join(" "),
      line2: words.slice(mid).join(" "),
    };
  }

  return { singleLine: true, text: name };
}
