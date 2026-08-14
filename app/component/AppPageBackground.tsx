"use client";

import { usePathname } from "next/navigation";
import GamesPageBackground from "@/app/component/games/GamesPageBackground";
import MobileStaticPageBackground from "@/app/component/games/MobileStaticPageBackground";
import { isPublicLpPath } from "@/lib/lp/publicLpPaths";
import { usePreferStaticPageBackground } from "@/lib/perf/usePreferStaticPageBackground";

/**
 * アプリ全体で1インスタンスのサイバー背景。
 * ルート layout に置き、ページ遷移でアンマウントされない。
 *
 * - /web/*: 静止背景（アニメオフ）
 * - /dev/*: 静止背景（プレビュー用）
 * - iPhone Safari / モバイル Chrome / /mobile/*: 静止背景（発熱対策）
 * - その他デスクトップ: フルオーロラ + モート
 */
export default function AppPageBackground() {
  const pathname = usePathname();
  const preferStatic = usePreferStaticPageBackground();

  if (isPublicLpPath(pathname)) {
    return null;
  }

  if (preferStatic) {
    return <MobileStaticPageBackground />;
  }

  return (
    <div data-page-bg="full" className="contents">
      <GamesPageBackground lite={false} />
    </div>
  );
}
