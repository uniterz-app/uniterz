/**
 * 7言語コピーの組み立てヘルパー。
 * 文を「基本 + 接尾」で連結するテンプレ生成（Pro Insight など）で使う。
 */
import { LOCALIZED_UI_LANGUAGES, type LocalizedLang } from "@/lib/i18n/localize";
import { ui, type UiStrings } from "@/lib/i18n/ui";

type FullUiStrings = Record<LocalizedLang, string>;

/** 各言語の文字列を個別に加工する */
export function mapUiStrings(
  input: UiStrings,
  fn: (value: string, lang: LocalizedLang) => string
): UiStrings {
  const out = {} as FullUiStrings;
  for (const lang of LOCALIZED_UI_LANGUAGES) {
    out[lang] = fn(ui(lang, input), lang);
  }
  return out;
}

/** 言語ごとに部品を連結する。空の部品は落とす。 */
export function joinUiStrings(
  parts: ReadonlyArray<UiStrings | string | null | undefined>,
  separator = " · "
): UiStrings {
  const out = {} as FullUiStrings;
  for (const lang of LOCALIZED_UI_LANGUAGES) {
    out[lang] = parts
      .map((part) => {
        if (part == null) return "";
        return typeof part === "string" ? part : ui(lang, part);
      })
      .filter((value) => value.trim().length > 0)
      .join(separator);
  }
  return out;
}

/** 言語ごとに接頭辞を付ける（空接頭辞は無視） */
export function prefixUiStrings(
  prefix: UiStrings,
  body: UiStrings,
  separator = " "
): UiStrings {
  return joinUiStrings([prefix, body], separator);
}
