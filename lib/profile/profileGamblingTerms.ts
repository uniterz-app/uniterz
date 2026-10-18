import type { Language } from "@/lib/i18n/language";

/**
 * プロフィールの表示名・自己紹介・ランキングのひとことに含めさせない語
 * （ギャンブル関連・性的表現・差別語・悪口・脅し）。
 * 英語の "bet" は単語境界で判定し、"alphabet" 等の誤検知を避ける。
 * 「シコ」単体は「メキシコ」、「カス」単体は「カスタム」に当たるため入れない。
 * 文字の間に空白・記号を挟んだすり抜け（「死 ね」「f.u.c.k」）も検出する。
 * firestore.rules の profileTextGamblingFree は直接書き込みの最終防衛で、ギャンブル・性的表現の基本語のみ
 * （既存の自己紹介に新しい語が含まれると、そのユーザーの users 更新が全部落ちるため増やさない）。
 */
const JA_SUBSTRINGS = [
  "ベット",
  "ベッド",
  "ベッティング",
  "賭け",
  "賭博",
  "ギャンブル",
  "セックス",
  "せっくす",
  "エロ動画",
  "ちんこ",
  "チンコ",
  "ちんぽ",
  "チンポ",
  "まんこ",
  "マンコ",
  "中出し",
  "男優",
  "AV女優",
  "オナニー",
  "シコシコ",
  "シコる",
  "シコら",
  "レイプ",
  "射精",
  "勃起",
  "痴漢",
  "風俗",
  // 悪口・脅し
  "死ね",
  "氏ね",
  "タヒね",
  "しねよ",
  "しねや",
  "消えろ",
  "殺す",
  "殺せ",
  "ぶっころ",
  "殺害",
  "自殺しろ",
  "首吊れ",
  "爆破",
  "クズ",
  "ゴミカス",
  "ゴミクズ",
  "ゴミ野郎",
  "カス野郎",
  "このカス",
  "クソ野郎",
  "くそ野郎",
  "ボケが",
  "ガイジ",
  "池沼",
  "キチガイ",
  "気違い",
  "基地外",
  "知恵遅れ",
  // 差別語
  "支那",
  "チョン公",
  "バカチョン",
  "ジャップ",
  "ニガー",
  "ニグロ",
  "黒んぼ",
  "土人",
  "穢多",
  "ホモ野郎",
] as const;

/** 禁止語を含むが問題ない語。判定前に取り除く（カタカナに揃えた形で書く） */
const JA_ALLOWED = ["ガイジン", "シコルスキ", "シコルノスキ"] as const;

/** 単語境界つき（空白をまたいで連結しない） */
const EN_WORD_PATTERNS: readonly RegExp[] = [
  /\bbet\b/i,
  /\bbetting\b/i,
  /\bbets\b/i,
  /\bbetted\b/i,
  /\bbettor\b/i,
  /\bkys\b/i,
  /\bfag\b/i,
  /\bspic\b/i,
  /\bkike\b/i,
  /\brape\b/i,
  /\bchinks?\b/i,
  /kill\s*yourself/i,
];

/** 部分一致（記号を抜いた形・1 文字ずつ区切った形にも当てる） */
const EN_SUBSTRING_PATTERNS: readonly RegExp[] = [
  /sex/i,
  /porn/i,
  /fuck/i,
  /pussy/i,
  /hentai/i,
  /nigg/i,
  /xvideos/i,
  /retard/i,
  /faggot/i,
  /cunt/i,
  /bitch/i,
  /whore/i,
  /slut/i,
  /wetback/i,
  /tranny/i,
];

const ZERO_WIDTH = /[\u00AD\u200B-\u200F\u2060\uFEFF]/g;
const SEPARATORS = /[\s\p{P}\p{S}]/gu;

/** NFKC・小文字・ひらがな→カタカナ・ゼロ幅文字除去 */
export function normalizeModerationText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(ZERO_WIDTH, "")
    .toLowerCase()
    .replace(/[\u3041-\u3096]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) + 0x60)
    );
}

/** 空白・記号を全部抜いた形（日本語のすり抜け用） */
export function compactModerationText(normalized: string): string {
  return normalized.replace(SEPARATORS, "");
}

/** 記号だけ抜き、空白は残す（「f.u.c.k」→「fuck」、「wins exactly」は連結しない） */
function stripSymbols(normalized: string): string {
  return normalized.replace(/[\p{P}\p{S}]/gu, "");
}

/** 1 文字ずつ区切った並び（「f u c k」「s-e-x」）だけを連結する */
function joinSingleCharRuns(normalized: string): string {
  const tokens = normalized.split(SEPARATORS).filter(Boolean);
  const out: string[] = [];
  let run = "";
  for (const t of tokens) {
    if (Array.from(t).length === 1) {
      run += t;
      continue;
    }
    if (run) out.push(run);
    run = "";
    out.push(t);
  }
  if (run) out.push(run);
  return out.join(" ");
}

const JA_NORMALIZED = JA_SUBSTRINGS.map((s) =>
  compactModerationText(normalizeModerationText(s))
);

function findViolationInText(text: string): string | null {
  const normalized = normalizeModerationText(text);
  let compact = compactModerationText(normalized);
  for (const w of JA_ALLOWED) compact = compact.split(w).join("|");
  for (let i = 0; i < JA_NORMALIZED.length; i++) {
    if (compact.includes(JA_NORMALIZED[i]!)) return JA_SUBSTRINGS[i]!;
  }
  const joined = joinSingleCharRuns(normalized);
  const stripped = stripSymbols(normalized);
  for (const re of EN_WORD_PATTERNS) {
    for (const s of [normalized, joined]) {
      const m = s.match(re);
      if (m) return m[0];
    }
  }
  for (const re of EN_SUBSTRING_PATTERNS) {
    for (const s of [normalized, joined, stripped]) {
      const m = s.match(re);
      if (m) return m[0];
    }
  }
  return null;
}

export class ProfileGamblingTermsError extends Error {
  readonly code = "forbidden_gambling_terms" as const;

  constructor() {
    super("forbidden_gambling_terms");
    this.name = "ProfileGamblingTermsError";
  }
}

export function profileGamblingTermsUserMessage(language: Language): string {
  return language === "ja"
    ? "使用できない文字が含まれています。"
    : "Your input contains characters that cannot be used.";
}

export function isProfileGamblingTermsError(err: unknown): boolean {
  return err instanceof ProfileGamblingTermsError;
}

/**
 * @returns 問題なければ null、あればマッチした文字列（ログ用・サーバーは返さなくてよい）
 */
export function findProfileGamblingTermViolation(text: string): string | null {
  return findViolationInText(text);
}

export function assertProfileTextsFreeOfGamblingTerms(
  displayName: string,
  bio: string,
): void {
  if (findViolationInText(displayName) != null || findViolationInText(bio) != null) {
    throw new ProfileGamblingTermsError();
  }
}
