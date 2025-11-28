// lib/team-alias.ts
// 表示用の略称マップ。必要になったらここへ追記していけばOK。
const ALIASES: Record<string, string> = {
  "ファイティングイーグルス名古屋": "FE名古屋",
  // 例：
  // "シーホース三河": "三河",
  // "川崎ブレイブサンダース": "川崎",
  // "名古屋ダイヤモンドドルフィンズ": "名古屋D",
};

// ★ shortTeamName が返す型を広げる
export type TeamAlias =
  | string
  | {
      short?: string;
      name?: string;
    };

// ★ 返り値の型だけ TeamAlias に変更
export function shortTeamName(name: string): TeamAlias {
  return ALIASES[name] ?? name;
}
