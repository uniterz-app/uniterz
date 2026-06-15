import type { Language } from "@/lib/i18n/language";
import type { DocumentSnapshot } from "firebase/firestore";
import {
  RESULT_LIST_INITIAL_MAX_DAY_GROUPS,
  countResultDayGroups,
  trimPostsToMaxDayGroups,
  type PostWithMillis,
} from "@/lib/result/result-page-data";

export type ResultListPageFetchResult = {
  posts: PostWithMillis[];
  lastDoc: DocumentSnapshot | null;
  /** 取得上限いっぱい（続きがあり得る） */
  fullPage: boolean;
};

/** 初回一覧: 直近 maxDayGroups 試合日分が揃うまでページ取得し、古い日は切り捨てる */
export async function fetchInitialResultPostsByDayWindow(opts: {
  language: Language;
  fetchPage: (cursor: DocumentSnapshot | null) => Promise<ResultListPageFetchResult>;
  mergePosts: (
    primary: PostWithMillis[],
    extra: PostWithMillis[]
  ) => PostWithMillis[];
  maxDayGroups?: number;
}): Promise<{
  posts: PostWithMillis[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}> {
  const maxDay = opts.maxDayGroups ?? RESULT_LIST_INITIAL_MAX_DAY_GROUPS;
  let accumulated: PostWithMillis[] = [];
  let lastDoc: DocumentSnapshot | null = null;
  let lastFullPage = false;

  while (true) {
    const page = await opts.fetchPage(lastDoc);
    lastDoc = page.lastDoc;
    lastFullPage = page.fullPage;
    accumulated = opts.mergePosts(accumulated, page.posts);

    const dayCount = countResultDayGroups(accumulated, opts.language);
    if (dayCount >= maxDay) break;
    if (!page.fullPage) break;
  }

  const { posts, trimmed } = trimPostsToMaxDayGroups(
    accumulated,
    opts.language,
    maxDay
  );
  return {
    posts,
    lastDoc,
    hasMore: trimmed || lastFullPage,
  };
}
