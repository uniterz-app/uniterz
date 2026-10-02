/**
 * バッジ title / description の言語解決。
 * Firestore に titleEn / descriptionEn があれば優先。無ければ JA 文言をパターン翻訳。
 */
import { normalizeLanguage } from "@/lib/i18n/language";
import {
  translateBadgeDescriptionJaToLang,
  translateBadgeTitleJaToLang,
} from "./translateBadgeCopyLang";

export type BadgeCopyLang =
  | "ja"
  | "en"
  | "ko"
  | "zh"
  | "es"
  | "pt"
  | "fr";

export type BadgeCopySource = {
  id?: string;
  title?: string | null;
  description?: string | null;
  titleEn?: string | null;
  descriptionEn?: string | null;
};

export type ResolvedBadgeCopy = {
  title: string;
  description: string;
};

function looksMostlyJapanese(text: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9fff]/.test(text);
}

function resolveBadgeLang(language: BadgeCopyLang | string): BadgeCopyLang {
  const normalized = normalizeLanguage(language);
  if (
    normalized === "ja" ||
    normalized === "en" ||
    normalized === "ko" ||
    normalized === "zh" ||
    normalized === "es" ||
    normalized === "pt" ||
    normalized === "fr"
  ) {
    return normalized;
  }
  return "en";
}

/**
 * 表示用の title / description を返す。
 */
export function resolveBadgeCopy(
  badge: BadgeCopySource,
  language: BadgeCopyLang | string = "ja"
): ResolvedBadgeCopy {
  const lang = resolveBadgeLang(language);
  const titleJa = String(badge.title ?? "").trim();
  const descJa = String(badge.description ?? "").trim();
  const fallbackTitle = titleJa || String(badge.id ?? "Badge");

  if (lang === "ja") {
    return { title: fallbackTitle, description: descJa };
  }

  const titleEnStored = String(badge.titleEn ?? "").trim();
  const descEnStored = String(badge.descriptionEn ?? "").trim();

  const titleNeedsTranslation =
    looksMostlyJapanese(fallbackTitle) ||
    fallbackTitle.includes("総合得点") ||
    fallbackTitle.includes("トータルポイント") ||
    fallbackTitle.includes("位");

  const title =
    lang === "en" && titleEnStored
      ? titleEnStored
      : titleNeedsTranslation
        ? translateBadgeTitleJaToLang(fallbackTitle, lang)
        : titleEnStored || fallbackTitle;

  const description =
    lang === "en" && descEnStored
      ? descEnStored
      : descJa && looksMostlyJapanese(descJa)
        ? translateBadgeDescriptionJaToLang(descJa, lang)
        : descEnStored || descJa;

  return { title, description };
}
