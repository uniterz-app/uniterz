/**
 * チャットのチーム名 → アプリのチーム ID。略称・英語名・カタカナ・よく使う愛称。
 * 読み取りの AI が略称を返せなかったときと、AI を通さない即答の両方で使う。
 */
import { TEAM_SHORT } from "@/lib/team-short";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";

const JA_ALIASES: Record<string, readonly string[]> = {
  "nba-hawks": ["ホークス", "アトランタ"],
  "nba-celtics": ["セルティックス", "ボストン", "セルツ"],
  "nba-nets": ["ネッツ", "ブルックリン"],
  "nba-hornets": ["ホーネッツ", "シャーロット"],
  "nba-bulls": ["ブルズ", "シカゴ"],
  "nba-cavaliers": ["キャバリアーズ", "キャブス", "クリーブランド", "クリーヴランド", "cavs"],
  "nba-mavericks": ["マーベリックス", "マーヴェリックス", "マブス", "ダラス", "mavs"],
  "nba-nuggets": ["ナゲッツ", "デンバー"],
  "nba-pistons": ["ピストンズ", "デトロイト"],
  "nba-warriors": ["ウォリアーズ", "ゴールデンステート", "ゴールデンステイト", "dubs"],
  "nba-rockets": ["ロケッツ", "ヒューストン"],
  "nba-pacers": ["ペイサーズ", "ペーサーズ", "インディアナ"],
  "nba-clippers": ["クリッパーズ", "クリッパース", "clips"],
  "nba-lakers": ["レイカーズ", "レーカーズ"],
  "nba-grizzlies": ["グリズリーズ", "メンフィス", "grizz"],
  "nba-heat": ["ヒート", "マイアミ"],
  "nba-bucks": ["バックス", "ミルウォーキー"],
  "nba-timberwolves": ["ティンバーウルブズ", "ウルブズ", "ミネソタ", "wolves"],
  "nba-pelicans": ["ペリカンズ", "ニューオーリンズ", "pels"],
  "nba-knicks": ["ニックス", "ニューヨーク"],
  "nba-thunder": ["サンダー", "オクラホマシティ", "オクラホマ"],
  "nba-magic": ["マジック", "オーランド"],
  "nba-76ers": ["セブンティシクサーズ", "シクサーズ", "76ers", "sixers", "フィラデルフィア", "フィラ"],
  "nba-suns": ["サンズ", "フェニックス"],
  "nba-blazers": ["トレイルブレイザーズ", "ブレイザーズ", "ブレーザーズ", "ポートランド", "blazers"],
  "nba-kings": ["キングス", "サクラメント"],
  "nba-spurs": ["スパーズ", "サンアントニオ"],
  "nba-raptors": ["ラプターズ", "トロント"],
  "nba-jazz": ["ジャズ", "ユタ"],
  "nba-wizards": ["ウィザーズ", "ワシントン"],
};

/** 「ロサンゼルス」だけでは決めない（レイカーズ / クリッパーズ） */
const AMBIGUOUS = new Set(["ロサンゼルス", "la", "los angeles"]);

function norm(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[・\s.'’-]/g, "");
}

type Entry = { teamId: string; keys: string[] };

let entries: Entry[] | null = null;

function teamEntries(): Entry[] {
  if (entries) return entries;
  entries = Object.keys(TEAM_SHORT)
    .filter((id) => id.startsWith("nba-"))
    .map((teamId) => {
      const full = NBA_TEAM_NAME_BY_ID[teamId] ?? "";
      const nickname = full.split(" ").slice(-1)[0] ?? "";
      const keys = [
        TEAM_SHORT[teamId] ?? "",
        full,
        nickname,
        full.replace(/ \S+$/, ""),
        ...(JA_ALIASES[teamId] ?? []),
      ]
        .map(norm)
        .filter((k) => k.length >= 2 && !AMBIGUOUS.has(k));
      if (teamId === "nba-blazers") keys.push(norm("Trail Blazers"));
      return { teamId, keys: [...new Set(keys)] };
    });
  return entries;
}

/** 1 チームに決まるときだけ ID を返す */
export function resolveNbaAskTeamId(query: string | null | undefined): string | null {
  const q = norm(String(query ?? ""));
  if (q.length < 2) return null;
  const exact = teamEntries().filter((e) => e.keys.includes(q));
  if (exact.length === 1) return exact[0]!.teamId;
  if (exact.length > 1) return null;
  const partial = teamEntries().filter((e) =>
    e.keys.some((k) => k.length >= 3 && (q.includes(k) || (q.length >= 4 && k.startsWith(q))))
  );
  return partial.length === 1 ? partial[0]!.teamId : null;
}

/** 文の中に出てくるチーム（出た順、重複なし）。「レイカーズとセルティックス」 */
export function findNbaAskTeamsInText(text: string): string[] {
  const t = norm(text);
  const hits: { teamId: string; at: number }[] = [];
  for (const e of teamEntries()) {
    let at = -1;
    for (const k of e.keys) {
      // 略称（LAL など）は英字の単語として出たときだけ。日本語文の途中の偶然一致を拾わない
      if (/^[a-z0-9]{2,3}$/.test(k)) {
        const m = new RegExp(`(^|[^a-z0-9])${k}([^a-z0-9]|$)`).exec(t);
        if (m) at = at < 0 ? m.index : Math.min(at, m.index);
        continue;
      }
      const i = t.indexOf(k);
      if (i >= 0) at = at < 0 ? i : Math.min(at, i);
    }
    if (at >= 0) hits.push({ teamId: e.teamId, at });
  }
  return hits.sort((a, b) => a.at - b.at).map((h) => h.teamId);
}

/** 日本語の答えで使うチーム名（レイカーズ） */
export function nbaAskTeamJaName(teamId: string): string | null {
  return JA_ALIASES[teamId]?.[0] ?? null;
}
