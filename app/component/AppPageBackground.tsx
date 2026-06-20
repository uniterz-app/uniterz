"use client";

import GamesPageBackground from "@/app/component/games/GamesPageBackground";
import MobileStaticPageBackground from "@/app/component/games/MobileStaticPageBackground";
import { usePreferStaticPageBackground } from "@/lib/perf/usePreferStaticPageBackground";

/**
 * アプリ全体で1インスタンスのサイバー背景。
 * ルート layout に置き、ページ遷移でアンマウントされない。
 *
 * - デスクトップ / 大画面: フルオーロラ + モート
 * - iPhone Safari / モバイル Chrome / /mobile/*: 静止背景（発熱対策）
 */
export default function AppPageBackground() {
  const preferStatic = usePreferStaticPageBackground();

  if (preferStatic) {
    return <MobileStaticPageBackground />;
  }

  return (
    <div data-page-bg="full" className="contents">
      <GamesPageBackground lite={false} />
    </div>
  );
}
