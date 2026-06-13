import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import type { EventNoticeContent } from "./eventNoticeTypes";
import type { Messages } from "@/messages/ja";

export type EventNoticeI18nKey = keyof Messages["eventNotices"];

export type ResolvedEventNoticeCopy = {
  tag?: string;
  title: string;
  description: string;
  period: string;
  target?: string;
  reward?: string;
};

export function resolveEventNoticeCopy(
  event: EventNoticeContent,
  language: Language
): ResolvedEventNoticeCopy {
  if (event.i18nKey) {
    const copy = t(language).eventNotices[event.i18nKey];
    return {
      tag: copy.tag,
      title: copy.title,
      description: copy.description,
      period: copy.period,
      target: copy.target,
      reward: copy.reward,
    };
  }

  const isEn = language === "en";
  return {
    tag: isEn && event.tagEn ? event.tagEn : event.tag,
    title: isEn && event.titleEn ? event.titleEn : event.title,
    description:
      isEn && event.descriptionEn ? event.descriptionEn : event.description,
    period: isEn && event.periodEn ? event.periodEn : event.period,
    target: isEn && event.targetEn !== undefined ? event.targetEn : event.target,
    reward: isEn && event.rewardEn !== undefined ? event.rewardEn : event.reward,
  };
}
