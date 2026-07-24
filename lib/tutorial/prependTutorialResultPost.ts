/**
 * 本番リザルト一覧の先頭にチュートリアル投稿を差し込む
 */

import type { Language } from "@/lib/i18n/language";
import {
  formatResultDateLabel,
  getGroupDateMillis,
  type PostWithMillis,
  type ResultDayGroup,
} from "@/lib/result/result-page-data";
import { TUTORIAL_RESULT_POST_ID } from "@/lib/tutorial/tutorialNbaUi";

function toTutorialPostWithMillis(post: PostWithMillis): PostWithMillis {
  const now = Date.now();
  return {
    ...post,
    createdAtMillis: post.createdAtMillis ?? now,
    startAtMillis: post.startAtMillis ?? now - 3 * 60 * 60 * 1000,
    settledAtMillis: post.settledAtMillis ?? now,
  };
}

function stripTutorialPosts(groups: ResultDayGroup[]): ResultDayGroup[] {
  return groups
    .map((day) => ({
      ...day,
      pending: day.pending.filter((p) => p.id !== TUTORIAL_RESULT_POST_ID),
      final: day.final.filter((p) => p.id !== TUTORIAL_RESULT_POST_ID),
    }))
    .filter((day) => day.pending.length + day.final.length > 0);
}

/** 一覧先頭（最新日の final 先頭）にチュートリアル投稿を置く */
export function prependTutorialResultPost(
  groups: ResultDayGroup[],
  post: PostWithMillis,
  language: Language
): ResultDayGroup[] {
  const withMs = toTutorialPostWithMillis(post);
  const cleaned = stripTutorialPosts(groups);
  const dateMs = getGroupDateMillis(withMs);
  const dateLabel = formatResultDateLabel(dateMs, language);

  const idx = cleaned.findIndex((g) => g.dateLabel === dateLabel);
  if (idx >= 0) {
    const day = cleaned[idx]!;
    const nextDay: ResultDayGroup = {
      ...day,
      final: [withMs, ...day.final],
    };
    if (idx === 0) {
      return [nextDay, ...cleaned.slice(1)];
    }
    const rest = cleaned.filter((_, i) => i !== idx);
    return [nextDay, ...rest];
  }

  return [
    {
      dateLabel,
      dateMs,
      pending: [],
      final: [withMs],
    },
    ...cleaned,
  ];
}
