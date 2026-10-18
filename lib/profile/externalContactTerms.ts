import {
  compactModerationText,
  normalizeModerationText,
} from "@/lib/profile/profileGamblingTerms";

/**
 * ランキングのひとことに載せさせない外部誘導（URL・SNS / LINE への誘導・予想販売・電話番号）。
 * 自己紹介には X のアカウント等を書く人がいるので、ひとことだけに使う。
 * 「BOS@DET」は対戦表記なので、英数字の直後の @ はアカウント扱いしない。
 */
const URL_PATTERNS: readonly RegExp[] = [
  /https?:\/\//,
  /www\./,
  /[a-z0-9-]+\.(com|net|org|jp|co|me|io|ly|gg|app|xyz|link|info|tv|cc|biz|site|online|shop|page)\b/,
  /(^|[^a-z0-9])@[a-z0-9_.]{4,}/,
  /line\s*(id|@)/,
  /0[789]0[-\s]?\d{4}[-\s]?\d{4}/,
];

/** 空白・記号を抜いた形に部分一致 */
const CONTACT_SUBSTRINGS = [
  "lineid",
  "line追加",
  "ライン追加",
  "ラインid",
  "公式line",
  "オプチャ",
  "オープンチャット",
  "dmください",
  "dmで",
  "dmへ",
  "dm待",
  "dmして",
  "インスタ",
  "instagram",
  "tiktok",
  "ティックトック",
  "discord",
  "ディスコード",
  "telegram",
  "テレグラム",
  "twitter",
  "ツイッター",
  "youtube",
  "ユーチューブ",
  "フォローして",
  "相互フォロー",
  "プロフ見",
  "予想販売",
  "予想を販売",
  "有料予想",
  "予想売",
  "情報商材",
  "副業",
  "稼げ",
  "儲か",
  "サロン",
  "連絡先",
] as const;

const CONTACT_NORMALIZED = CONTACT_SUBSTRINGS.map((s) =>
  compactModerationText(normalizeModerationText(s))
);

/** @returns 問題なければ null、あればマッチした文字列（ログ用） */
export function findExternalContactViolation(text: string): string | null {
  const normalized = normalizeModerationText(text);
  for (const re of URL_PATTERNS) {
    const m = normalized.match(re);
    if (m) return m[0];
  }
  const compact = compactModerationText(normalized);
  for (let i = 0; i < CONTACT_NORMALIZED.length; i++) {
    if (compact.includes(CONTACT_NORMALIZED[i]!)) return CONTACT_SUBSTRINGS[i]!;
  }
  return null;
}
