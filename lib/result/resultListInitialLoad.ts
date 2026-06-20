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

export type ResultListFirstPagePayload = {
  posts: PostWithMillis[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
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
  /** 1ページ目取得直後（日付ウィンドウ完了前）に呼ぶ */
  onFirstPage?: (payload: ResultListFirstPagePayload) => void;
  /** true なら以降の処理・コールバックを中断（リーグ切替など） */
  isStale?: () => boolean;
}): Promise<{
  posts: PostWithMillis[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}> {
  const maxDay = opts.maxDayGroups ?? RESULT_LIST_INITIAL_MAX_DAY_GROUPS;
  let accumulated: PostWithMillis[] = [];
  let lastDoc: DocumentSnapshot | null = null;
  let lastFullPage = false;
  let firstPageDelivered = false;

  while (true) {
    if (opts.isStale?.()) {
      return {
        posts: accumulated,
        lastDoc,
        hasMore: false,
      };
    }

    const page = await opts.fetchPage(lastDoc);
    if (opts.isStale?.()) {
      return {
        posts: accumulated,
        lastDoc: page.lastDoc ?? lastDoc,
        hasMore: false,
      };
    }

    lastDoc = page.lastDoc;
    lastFullPage = page.fullPage;
    accumulated = opts.mergePosts(accumulated, page.posts);

    if (!firstPageDelivered) {
      firstPageDelivered = true;
      opts.onFirstPage?.({
        posts: [...accumulated],
        lastDoc: page.lastDoc,
        hasMore: page.fullPage,
      });
    }

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
