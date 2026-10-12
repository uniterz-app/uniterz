import type { Language } from "@/lib/i18n/language";

/**
 * プロフィールの表示名・自己紹介に含めさせない語（ギャンブル関連・性的表現・差別語）。
 * 英語の "bet" は単語境界で判定し、"alphabet" 等の誤検知を避ける。
 * 「シコ」単体は「メキシコ」に当たるため入れない。
 * firestore.rules の profileTextGamblingFree と揃える。
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
] as const;

/** 日本語はそのまま部分一致 */
const EN_WORD_PATTERNS: readonly RegExp[] = [
  /\bbet\b/i,
  /\bbetting\b/i,
  /\bbets\b/i,
  /\bbetted\b/i,
  /\bbettor\b/i,
  /sex/i,
  /porn/i,
  /fuck/i,
  /pussy/i,
  /hentai/i,
  /nigg/i,
  /xvideos/i,
];

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

function findViolationInText(text: string): string | null {
  const s = text.normalize("NFKC");
  for (const sub of JA_SUBSTRINGS) {
    if (s.includes(sub)) return sub;
  }
  for (const re of EN_WORD_PATTERNS) {
    const m = s.match(re);
    if (m) return m[0];
  }
  return null;
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
